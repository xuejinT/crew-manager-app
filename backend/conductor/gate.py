"""The chokepoint. One function decides whether anything is allowed to happen.

Every proposal the driver produces passes through :func:`gate`, and nothing
reaches :mod:`act` without a :class:`~intents.Decision` this function stamped.
That is invariant I1 made structural: the restraints that matter are code
branches in one place, not prose in a prompt and not a convention several modules
are trusted to remember.

Three properties are worth more than the check list, and each one is a branch
below rather than a note:

* **The gate has no side effects.** It reads persisted state, it decides, it
  returns. It does not consume budget, does not stamp cooldowns, does not ring
  bells. A gate that could notify would be a gate with an effect, and the reason
  this module can be the single chokepoint is that calling it twice costs nothing
  and changes nothing. Consuming the budget and marking the cooldown are the
  driver's jobs, *after* the effect actually landed — the inverse order paralyses
  autonomy the first time an executor refuses (``act.py``'s claim-release rule).
* **Order is cheapest-and-most-absolute first.** The hard-deny set is tested
  before any file is read, so no I/O failure, no missing marker and no odd goal
  file can move a hard-denied class one step closer to executing.
* **HALT is re-read per proposal, not per tick.** This is the mid-flight kill
  window and closing it is the point: a tick that began before the operator hit
  the brake must not finish executing its queue. Checking once at the top of the
  tick would leave every proposal after the first executing against an intent the
  operator has already withdrawn.

**Where the verdicts differ from a naive reading of the step list.** The task
order says a ``PROPOSE`` tier returns ``Verdict.PROPOSE`` at step 3. It returns
``Verdict.PROPOSE`` here too — but at the *end*, after the absolute checks, so
that a proposal which is out of scope, aimed at a draft goal, or an exact
duplicate of one already acted on is refused or escalated rather than queued for
an operator click. Two reasons, both concrete: advisory mode re-derives the same
findings every 60s, so skipping dedup for non-acting tiers turns the approval
queue into a flood; and Increment 1's shadow ledger is the artifact the envelopes
get tuned from, so a ``would_do`` row that never had to satisfy scope would
inflate the very number it exists to measure. The deviation is only ever in the
restrictive direction, and nothing is hidden: a scope or path violation surfaces
as ``ESCALATE``, which is louder than the click it replaces.

Budget and capacity are the mirror image: they are consulted **only** for an
``ACT``-tier proposal. Refusing to *show* the operator a proposal because the
autonomous allowance is spent would hide work from them at the exact moment they
have to do it by hand.

Rejected alternatives, since the choices are not obvious:

* **A gate that rings its own escalation bell.** Rejected: see the no-side-effects
  property. ``Verdict.ESCALATE`` is a ruling, and a ruling is surfaced by the
  ledger row and by the report step's own ``escalate``-class proposal.
* **In-process dedup memory.** Rejected because that is precisely today's bug —
  ``watcher.py``'s notified set and reason memo live in process memory, so a
  gateway restart re-fires everything once. :class:`Cooldowns` is a file.
* **Trusting a caller-supplied in-flight count for the WIP caps.** Rejected: a
  ceiling computed from a number the caller passes in is a ceiling the caller can
  defeat. In-flight turns are counted from the ``Observation`` every time.
"""

from __future__ import annotations

import asyncio
import contextlib
import fnmatch
import hashlib
import logging
import posixpath
import time
from pathlib import Path
from typing import Any, Iterable

from . import budget as budget_mod
from . import goals as goals_mod
from . import observe as observe_mod
from . import policy, store
from .intents import (
    ACTION_CLASSES,
    Decision,
    Proposal,
    Tier,
    Verdict,
    is_hard_denied,
    spec_for,
)
from .policy import HALT_MARKER, Mode

logger = logging.getLogger(__name__)

# The driver's own app name and the ``linked_session_key`` prefix it stamps are
# how a driver-started session is recognised in an Observation. Imported rather
# than copied so a rename in the executor cannot silently empty the WIP count,
# and guarded because act.py is the one sibling with heavy gateway coupling and
# this module must import with no gateway present at all (house rule 6).
try:  # VERIFIED: act.py:67 (APP_NAME), act.py:129 (conductor_link_key)
    from .act import APP_NAME as DRIVER_APP
except Exception:  # pragma: no cover - only when act.py itself cannot import
    DRIVER_APP = "crew-manager"
    logger.warning("conductor: act.APP_NAME unavailable; WIP counting uses the literal")

#: Prefix of a ``linked_session_key`` the driver minted. VERIFIED: act.py:129
#: returns ``f"conductor:{goal_id}:{leaf_id}"`` — per LEAF, not per goal — so a
#: goal's sessions are found by prefix-matching ``conductor:<goal>:`` and the
#: fleet's driver-started sessions by ``conductor:``.
CONDUCTOR_LINK_PREFIX = "conductor:"

#: The slot-name mint. Spelled here rather than imported from :mod:`act` for the
#: same reason :data:`CONDUCTOR_LINK_PREFIX` is: the gate must not depend on the
#: module whose actions it authorizes, or a change to the executor could widen
#: what the chokepoint permits. ``test_authority`` asserts the two agree.
SLOT_NAME_PREFIX = "cm-"


# ── envelopes ────────────────────────────────────────────────────────────────
# First guesses, deliberately. The plan's instruction is to tune envelopes from
# Increment 1's shadow ledger rather than from intuition, and batty's own defaults
# record that its first attempt at these numbers "blocked everything".

MAX_DRIVER_TURNS = 6
"""Global ceiling on turns the driver has in flight, across every goal.

Independent of the platform's background-turn semaphore and deliberately lower.
VERIFIED: ``act.py`` dispatches through ``_start_next_queued_turn``, which does
not wrap in ``state.run_background_turn`` (act.py:694), so the platform's
4-wide semaphore does not gate our turns at all — this number is the only real
ceiling, which is exactly why it is enforced here and not left to the platform.
Matches ``steps.MAX_DRIVER_TURNS``; the two must not drift."""

DEFAULT_GOAL_WIP = 2
"""Per-goal in-flight turns when the goal file does not say. Matches
``steps.DEFAULT_GOAL_WIP``; a goal's ``budgets.wip`` may lower or raise it,
bounded by :data:`MAX_DRIVER_TURNS` either way."""

SIGNATURE_COOLDOWN_SECS = 1800.0
"""How long one signature is suppressed after it is acted on.

Half an hour is the cheapest available answer to "the same stall is still the
same stall". Deliberately identical to ``steps.SIGNATURE_COOLDOWN_SECS``: two
modules holding two different numbers for one mechanism is how "one send per
failure signature" becomes "one send per tick" without anyone editing a gate."""

OCCURRENCE_RETENTION_SECS = 7 * 86_400.0
"""How long an occurrence count outlives its cooldown.

The cooldown answers "may I act again"; the count answers "have I been here
before", and R7's escalate-on-the-second rule needs the second question to still
have an answer tomorrow morning. Seven days matches ``budget.KEEP_DAYS``."""

ESCALATE_AFTER_OCCURRENCES = 1
"""Occurrences of one ``failure_signature`` after which the driver escalates
instead of steering again. One, so the SECOND occurrence escalates — R7 states
this explicitly and it is the difference between a supervisor and a spammer."""

MAX_TRACKED_SIGNATURES = 2000
"""Bound on the cooldown file. Pruned oldest-first once exceeded."""

MAX_PREDICTED_PATHS = 64
"""Bound on how many predicted paths are matched per proposal. A proposal that
claims to touch more of the tree than this is not a proposal, it is a bug."""

COOLDOWNS_NAME = "cooldowns.json"

#: Classes that dispatch a real turn, and therefore share every capacity ceiling.
#: Matches ``steps.TURN_CLASSES``.
TURN_CLASSES: frozenset[str] = frozenset({
    "session_continue", "session_resume", "session_create", "option_choice",
})

#: Classes whose target is the driver's own session by design. ``act.py`` refuses
#: any other target for ``narrate`` (its report, and enforced there), so its
#: ``conductor_owned`` exemption is not a scope violation and its target is not
#: expected to be a goal member.
SELF_DIRECTED_CLASSES: frozenset[str] = frozenset({"narrate"})

#: Classes that may be gated with no goal at all, and only when the proposal
#: itself names no goal. These two exist to reach the operator; blocking them on
#: goal bookkeeping would mean a driver that cannot say why it stopped. They stay
#: capped by mode, by markers and by their own budget windows.
GOALLESS_CLASSES: frozenset[str] = frozenset({"escalate", "operator_notify"})

#: Classes whose ``target_slot`` names a session they talk ABOUT rather than
#: touch, so the target's exemptions and goal membership do not gate them.
#:
#: This is not a convenience. ``scope.report_only_slots`` means "fully observed
#: and fully reported, never touched" — that clause is what makes "Crew Manager
#: reports on it without ever touching it" real — so applying the exemption to an
#: escalation would invert it into "never mentioned". More generally, a gate able
#: to silence the escalation channel through scope bookkeeping is a gate that can
#: hide a failure, and the whole point of the operator-facing band is that it
#: cannot. Every one of these is still budgeted and still flood-guarded.
NON_TOUCHING_CLASSES: frozenset[str] = frozenset({"escalate", "operator_notify", "pr_read"})


# ── Cooldowns: dedup and cooldown as ONE persisted mechanism ─────────────────


class Cooldowns:
    """Signature dedup and action cooldowns, in one file that survives restart.

    One mechanism doing two jobs on purpose, and the plan says why: message sends
    have no platform-level dedupe, so "have I already sent this" and "may I send
    it again yet" are answered by the same signature index — one place to get
    right instead of two places to disagree.

    Persisted because the in-process version is today's known bug. ``watcher.py``
    keeps its notified set and its reason memo in module state, so a gateway
    restart re-notifies everything once; batty has the identical unfixed bug with
    ``Instant``-based dedup. Every timestamp here is absolute wall clock, never a
    monotonic instant, for exactly that reason.

    Not thread-safe and does not need to be: the driver is one task in one
    process. Writes are handed to a thread, but the snapshot they serialize is
    built on the calling thread — ``autonudge.py:668-685``'s lesson, and the
    reason is concrete: serializing the live dict inside the worker lets the loop
    mutate it mid-``json.dump``.
    """

    def __init__(
        self,
        path: Path | None = None,
        *,
        now: Any = time.time,
        cooldown_secs: float = SIGNATURE_COOLDOWN_SECS,
        retention_secs: float = OCCURRENCE_RETENTION_SECS,
        max_entries: int = MAX_TRACKED_SIGNATURES,
        persist: bool = True,
    ) -> None:
        self._path = path
        self._now = now
        self.cooldown_secs = max(0.0, float(cooldown_secs))
        self.retention_secs = max(self.cooldown_secs, float(retention_secs))
        self.max_entries = max(1, int(max_entries))
        self._persist_enabled = bool(persist)
        self._entries: dict[str, dict[str, Any]] = {}
        self._loaded = False
        self._dirty = False
        self._write_task: Any = None

    # -- identity ----------------------------------------------------------

    @property
    def path(self) -> Path:
        return self._path if self._path is not None else store.conductor_dir() / COOLDOWNS_NAME

    @staticmethod
    def key(signature: str) -> str:
        """The stored key for *signature*, bounded in length.

        ``detect.failure_signature`` returns ``tool|masked-output`` at up to 120
        characters of arbitrary tool output (VERIFIED: detect.py:274,
        ``_MAX_SIGNATURE_CHARS = 120``), and that string is a JSON *key* here.
        Long or non-printable keys are hashed so the file stays bounded and
        readable; the raw form is kept as a label for the human reading it.
        """
        text = str(signature)
        if len(text) <= 96 and text.isprintable():
            return text
        return "sha256:" + hashlib.sha256(text.encode("utf-8", "replace")).hexdigest()[:32]

    # -- load / persist ----------------------------------------------------

    def load(self) -> None:
        """Read the file. Blocking — use :meth:`load_async` from the loop."""
        raw = store.read_json(self.path, {})
        self._merge(raw)
        self._loaded = True

    async def load_async(self) -> None:
        raw = await store.read_json_async(self.path, {})
        self._merge(raw)
        self._loaded = True

    def _merge(self, raw: Any) -> None:
        """Take the file's state, keeping unwritten local changes if there are any.

        Two modes, and needing both is not an accident of implementation:

        * **Nothing unwritten** (the normal arm-time load) ⇒ the file wins
          outright. Union-always was the first version and it was wrong: it makes
          :meth:`forget` un-doable, because a deleted entry is indistinguishable
          from one this process has simply never seen, so the next load resurrects
          the claim the reconciler just released.
        * **Unwritten local marks** ⇒ union, keeping the stronger of each pair, so
          a load racing a mark cannot lose the mark. That is the
          lost-update-after-restart failure ``autonudge``'s snapshot-under-lock
          protocol exists to prevent.

        A corrupt file arrives here as ``{}`` (``store.read_json`` logs and returns
        the fallback), so dedup restarts empty: the failure mode is one duplicated
        action, not a dead control loop.
        """
        entries = raw.get("signatures") if isinstance(raw, dict) else None
        if not isinstance(entries, dict):
            return
        if not self._dirty:
            self._entries = {}
        for key, value in entries.items():
            if not isinstance(value, dict):
                continue
            merged = self._entries.setdefault(str(key), {})
            merged["count"] = max(_int(merged.get("count")), _int(value.get("count")))
            merged["first_ts"] = _min_ts(merged.get("first_ts"), value.get("first_ts"))
            merged["last_ts"] = max(_num(merged.get("last_ts")), _num(value.get("last_ts")))
            merged["until"] = max(_num(merged.get("until")), _num(value.get("until")))
            merged["label"] = str(merged.get("label") or value.get("label") or "")[:160]
        self._prune()

    def _payload(self) -> dict[str, Any]:
        """A JSON-safe snapshot, built on the caller's thread."""
        return {
            "version": 1,
            "updated_ts": float(self._now()),
            "signatures": {k: dict(v) for k, v in self._entries.items()},
        }

    def _write(self, payload: dict[str, Any]) -> None:
        try:
            store.write_json(self.path, payload)
        except Exception:  # pragma: no cover - disk-level failure
            logger.warning("conductor: could not persist cooldowns", exc_info=True)

    def flush(self) -> None:
        """Write if dirty. Blocking — use :meth:`flush_async` from the loop."""
        if not self._persist_enabled or not self._dirty:
            return
        self._dirty = False
        self._write(self._payload())

    async def flush_async(self) -> None:
        """Make every recorded mark durable before returning.

        Awaits any write :meth:`_persist` scheduled, then writes if anything is
        still unwritten. Both halves are needed: the scheduled write shortens the
        crash window, but only this call is a *guarantee*, and a caller that reads
        the file back — the restart path does exactly that — must not race it.
        """
        task = self._write_task
        if task is not None and not task.done():
            with contextlib.suppress(Exception):
                await task
        if not self._persist_enabled or not self._dirty:
            return
        payload = self._payload()
        self._dirty = False
        await asyncio.to_thread(self._write, payload)

    def _persist(self) -> None:
        """Schedule a write off the loop; write inline when there is no loop.

        Only :meth:`mark` and :meth:`forget` reach this, and both follow an effect
        that actually landed, so the write rate is bounded by the action rate —
        which the budgets already cap — and not by traffic. ``breaker.py``'s
        pattern, including the strong reference: a task the loop is free to
        garbage-collect mid-write is the documented asyncio footgun and would lose
        exactly the state being persisted.

        ``_dirty`` is deliberately NOT cleared here. A scheduled write is a
        crash-window shortener, not a guarantee — the guarantee is
        :meth:`flush_async`, and clearing the flag on the schedule made that call
        a no-op that returned before its own write had happened.
        """
        if not self._persist_enabled:
            return
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            self.flush()
            return
        if self._write_task is not None and not self._write_task.done():
            # A write is already in flight with an older snapshot; ``_dirty``
            # stays set so the tick's own flush_async() lands the rest.
            return
        payload = self._payload()
        task = loop.create_task(asyncio.to_thread(self._write, payload))
        self._write_task = task
        _PENDING_WRITES.add(task)
        task.add_done_callback(_PENDING_WRITES.discard)

    # -- the three required calls ------------------------------------------

    def seen(self, signature: str) -> bool:
        """True when *signature* was acted on recently enough to be a duplicate.

        Dedup and cooldown in one answer. A record whose cooldown has expired is
        not "seen" — the same stall an hour later is a new event and gets a new
        decision — but its occurrence count survives, which is what makes
        escalate-on-the-second work across a whole night.
        """
        return self.remaining(signature) > 0.0

    def mark(self, signature: str, *, cooldown_secs: float | None = None) -> None:
        """Record that *signature* was acted on, starting its cooldown.

        Called by the DRIVER after an effect actually landed, never by
        :func:`gate`. If the gate stamped the cooldown itself, an action the
        executor then refused would be suppressed for half an hour with nothing
        having happened — silent paralysis, which is bounded by nothing, versus
        retry churn, which is bounded by the budgets.
        """
        now = float(self._now())
        window = self.cooldown_secs if cooldown_secs is None else max(0.0, float(cooldown_secs))
        key = self.key(signature)
        entry = self._entries.setdefault(key, {})
        entry["count"] = _int(entry.get("count")) + 1
        entry["first_ts"] = _min_ts(entry.get("first_ts"), now) or now
        entry["last_ts"] = now
        entry["until"] = now + window
        if key != str(signature):
            entry["label"] = str(signature)[:160]
        self._dirty = True
        self._prune()
        self._persist()

    def occurrences(self, signature: str) -> int:
        """How many times *signature* has been acted on inside the retention
        window. The count R7's second-occurrence rule reads."""
        entry = self._entries.get(self.key(signature))
        return _int(entry.get("count")) if entry else 0

    # -- supporting reads --------------------------------------------------

    def remaining(self, signature: str) -> float:
        """Seconds left on *signature*'s cooldown, or ``0.0``."""
        entry = self._entries.get(self.key(signature))
        if not entry:
            return 0.0
        return max(0.0, _num(entry.get("until")) - float(self._now()))

    def last_ts(self, signature: str) -> float:
        entry = self._entries.get(self.key(signature))
        return _num(entry.get("last_ts")) if entry else 0.0

    def mark_proposal(
        self, proposal: Proposal, *, cooldown_secs: float | None = None
    ) -> list[str]:
        """Mark a landed proposal's signature AND its ``failure_signature``.

        One call so a caller cannot remember one and forget the other. Forgetting
        the failure signature is the interesting half: the proposal signature
        suppresses the identical proposal, but only the failure count makes the
        second occurrence of the same stall escalate instead of producing a
        second nudge. Returns the keys marked, for the ledger row.
        """
        marked = [proposal.signature]
        self.mark(proposal.signature, cooldown_secs=cooldown_secs)
        failure = str(proposal.params.get("failure_signature") or "")
        if failure:
            self.mark(failure, cooldown_secs=cooldown_secs)
            marked.append(failure)
        return marked

    def forget(self, signature: str) -> None:
        """Drop *signature* entirely — the reconciler's release path.

        An intent that turned out not to have landed must not keep its claim, or
        the driver has quietly decided never to retry a thing it never did.
        """
        if self._entries.pop(self.key(signature), None) is not None:
            self._dirty = True
            self._persist()

    def snapshot(self) -> dict[str, Any]:
        """State for ``GET /conductor/state``. Cheap; no I/O."""
        now = float(self._now())
        active: list[dict[str, Any]] = [
            {
                "signature": key,
                "label": str(entry.get("label") or ""),
                "count": _int(entry.get("count")),
                "remaining_secs": round(max(0.0, _num(entry.get("until")) - now), 1),
                "last_ts": _num(entry.get("last_ts")),
            }
            for key, entry in self._entries.items()
        ]
        active.sort(key=lambda row: _num(row["last_ts"]), reverse=True)
        return {
            "path": str(self.path),
            "loaded": self._loaded,
            "tracked": len(self._entries),
            "on_cooldown": sum(1 for row in active if _num(row["remaining_secs"]) > 0),
            "recent": active[:50],
        }

    def _prune(self) -> None:
        """Drop expired records, then the oldest if still over the bound."""
        cutoff = float(self._now()) - self.retention_secs
        stale = [k for k, v in self._entries.items() if _num(v.get("last_ts")) < cutoff]
        for key in stale:
            self._entries.pop(key, None)
        if len(self._entries) > self.max_entries:
            ordered = sorted(self._entries.items(), key=lambda kv: _num(kv[1].get("last_ts")))
            for key, _entry in ordered[: len(self._entries) - self.max_entries]:
                self._entries.pop(key, None)
        if stale:
            self._dirty = True


#: Strong references to in-flight cooldown writes, for the reason breaker.py
#: gives: an unreferenced task is collectable mid-write.
_PENDING_WRITES: set[Any] = set()


# ── the gate ─────────────────────────────────────────────────────────────────


async def gate(
    proposal: Proposal,
    *,
    mode: Mode | str,
    goal: goals_mod.Goal | None,
    obs: observe_mod.Observation | None,
    budget: budget_mod.Budget | None,
    cooldowns: Cooldowns,
) -> Decision:
    """Decide one proposal. The only function that stamps ``Verdict.ACT``.

    Checks run cheapest-and-most-absolute first, and every branch returns a
    reason a human can act on — including the ``ACT`` branch, because an
    autonomous action with no recorded justification is the thing the audit
    surface exists to prevent.

    Reads state (the HALT marker, per-class markers via :mod:`policy`, the budget
    ledger) but changes none of it. Call it twice and get the same answer twice.
    """
    cls = proposal.action_class
    notes: list[str] = []

    # 1. Hard denial. Before any I/O, so no read failure and no odd state file can
    #    move a hard-denied class one step closer to executing. intents.py's own
    #    docstring commits to this being checked in three independent places.
    if is_hard_denied(cls):
        return _refuse(
            proposal, Tier.DENY_HARD,
            f"{cls} is hard-denied: no execution path exists and no configuration "
            f"creates one",
        )
    if cls not in ACTION_CLASSES or spec_for(cls) is None:
        return _refuse(
            proposal, Tier.DENY_HARD,
            f"{cls} is not a known action class: the gate refuses anything not in "
            f"the design-time table",
        )

    # 1b. An unexplainable action is refused. The plan lists "a Proposal cannot be
    #     constructed with an empty reasons list" as an enforced invariant, but
    #     intents.Proposal defaults it to [], so this is where it is enforced.
    #     Refused at every tier: a proposal with no stated reason is not something
    #     to ask the operator to approve either.
    if not [r for r in proposal.reasons if str(r).strip()]:
        return _refuse(
            proposal, Tier.OFF,
            "proposal carries no reasons: an action with no recorded justification "
            "is refused rather than logged",
        )

    # 2. HALT, re-read for THIS proposal. The mid-flight kill window.
    halted, halt_error = await _halt_state()
    if halted:
        return _refuse(
            proposal, Tier.OFF,
            halt_error
            or f"the {HALT_MARKER} marker is present: all autonomy is stopped, and a "
               f"tick that began before you hit the brake does not finish its queue",
        )

    # 3. The one authority computation: min(mode, goal, marker). Offloaded because
    #    policy.marker_cap stats a file and this is a coroutine (house rule 4).
    mode_enum = as_mode(mode)
    tier, tier_reason = await asyncio.to_thread(
        policy.effective,
        cls,
        mode=mode_enum,
        goal_authority=(goal.authority if goal is not None else None),
    )
    if tier is Tier.DENY_HARD:
        return _refuse(proposal, tier, tier_reason)
    if tier is Tier.OFF:
        return _refuse(proposal, tier, tier_reason)

    # 4. The goal must exist, must be the one the proposal names, and must be
    #    dispatchable. goals.dispatchable() is reused rather than re-derived: an
    #    empty done_when is a draft whatever the status field says, and one
    #    implementation of that rule is the difference between the UI's "why is
    #    nothing happening" and the driver's.
    goal_block = _goal_blocker(proposal, goal, cls)
    if goal_block:
        return _refuse(proposal, tier, goal_block)

    # 5. Scope. Deny patterns, then allow patterns, then the target's membership.
    scope_block = _scope_blocker(proposal, goal, obs, cls)
    if scope_block:
        # Escalated, not silently refused: a driver that wanted to touch a denied
        # path or an out-of-scope session is a fact about the plan, and the
        # operator is the only one who can fix it.
        return _escalate(proposal, tier, scope_block)

    # 6. Dedup. The failure count is checked BEFORE the signature, and the order
    #    is load-bearing — see _dedup_blocker.
    verdict, dedup_reason = _dedup_blocker(proposal, cooldowns, cls)
    if verdict is Verdict.ESCALATE:
        return _escalate(proposal, tier, dedup_reason)
    if verdict is Verdict.REFUSE:
        return _refuse(proposal, tier, dedup_reason)

    if tier is Tier.ACT:
        # 7. Budget. Exhaustion ESCALATES (I6): an operator must learn that
        #    autonomy stopped because it ran out of allowance, not infer it from
        #    silence. Consumption is the driver's call after the effect lands.
        if budget is None:
            logger.error(
                "conductor: gate reached with no budget ledger; refusing %s on %s",
                cls, proposal.goal_id,
            )
            return _refuse(
                proposal, tier,
                "no budget ledger is wired into the gate, so nothing may act: an "
                "uncounted autonomous action is worse than a refused one",
            )
        ok, why = await _budget_check(budget, cls, proposal.goal_id)
        if not ok:
            return _escalate(proposal, tier, f"budget: {why}")
        notes.append(why)

        # 8. Capacity: per-goal WIP and the driver's own global ceiling.
        if cls in TURN_CLASSES:
            capacity = _capacity_blocker(proposal, goal, obs)
            if capacity:
                verdict, reason = capacity
                if verdict is Verdict.ESCALATE:
                    return _escalate(proposal, tier, reason)
                return _refuse(proposal, tier, reason)

    if tier is not Tier.ACT:
        return Decision(
            proposal=proposal,
            verdict=Verdict.PROPOSE,
            tier=tier,
            reason=_join(f"{tier_reason}; every gate passed, surfaced for your click", notes),
        )

    # 9. Allowed.
    return Decision(
        proposal=proposal,
        verdict=Verdict.ACT,
        tier=tier,
        reason=_join(f"{tier_reason}; all gates passed", notes),
    )


# ── verdict constructors ─────────────────────────────────────────────────────


def _refuse(proposal: Proposal, tier: Tier, reason: str) -> Decision:
    return Decision(proposal=proposal, verdict=Verdict.REFUSE, tier=tier, reason=reason)


def _escalate(proposal: Proposal, tier: Tier, reason: str) -> Decision:
    """A refusal the operator is told about, rather than one that is logged.

    The verdict is not ``REFUSE`` because the driver is not declining to act — it
    is declining to *decide*. That band is the plan's always-escalate list:
    anything irreversible, anything externally visible, and anything that is
    really a question about what the operator wants.
    """
    return Decision(proposal=proposal, verdict=Verdict.ESCALATE, tier=tier, reason=reason)


def _join(head: str, notes: Iterable[str]) -> str:
    extra = [n for n in notes if n]
    return f"{head} [{'; '.join(extra)}]" if extra else head


# ── step 2: HALT ─────────────────────────────────────────────────────────────


async def _halt_state() -> tuple[bool, str]:
    """``(halted, reason_override)``. Fails CLOSED on an unreadable marker dir.

    An operator's brake that stops working because a stat raised would be a brake
    in name only, so an error reads as "halted" and says so. The cost of being
    wrong in this direction is one skipped tick.
    """
    try:
        if await asyncio.to_thread(store.marker_set, HALT_MARKER):
            return True, ""
    except Exception as exc:  # pragma: no cover - filesystem-level failure
        logger.warning("conductor: could not read the %s marker: %s", HALT_MARKER, exc)
        return True, (
            f"the {HALT_MARKER} marker could not be read ({exc.__class__.__name__}), so "
            f"the gate assumes autonomy is stopped rather than assuming it is permitted"
        )
    return False, ""


# ── step 4: the goal ─────────────────────────────────────────────────────────


def _goal_blocker(proposal: Proposal, goal: goals_mod.Goal | None, cls: str) -> str:
    """Why this goal cannot authorize this proposal, or ``""``."""
    if goal is None:
        if not proposal.goal_id and cls in GOALLESS_CLASSES:
            # Reaching the operator is not goal bookkeeping. Still capped by mode,
            # by markers and by its own budget window.
            return ""
        if not proposal.goal_id:
            return f"{cls} names no goal, and only {sorted(GOALLESS_CLASSES)} may act without one"
        return f"goal {proposal.goal_id!r} was not loaded: an unreadable goal authorizes nothing"

    if goal.id != proposal.goal_id:
        # Authority was computed from THIS goal's file. A mismatch means the
        # caller handed over the wrong one, and the tier on the decision would be
        # a fact about a goal the action does not belong to.
        return (
            f"goal mismatch: the proposal names {proposal.goal_id!r} but the gate was "
            f"handed {goal.id!r}, so the authority computed does not belong to it"
        )

    ok, why = goals_mod.dispatchable(goal)
    if not ok:
        return f"goal {goal.id!r} is not dispatchable — {why}"
    return ""


# ── step 5: scope ────────────────────────────────────────────────────────────


def _scope_blocker(
    proposal: Proposal,
    goal: goals_mod.Goal | None,
    obs: observe_mod.Observation | None,
    cls: str,
) -> str:
    """Why this target or these paths are outside the goal, or ``""``.

    Paths first because they are the cheaper check and the more absolute one:
    ``paths_deny`` carries ``.github/**`` and ``CODEOWNERS`` on every goal by
    construction (``goals.DEFAULT_PATHS_DENY``, unioned in on every load and
    save), and those are the patterns the gate-tampering risk lives behind.

    ARCC guidance on input validation (BSC1) names the denylist approach as an
    anti-pattern precisely because a denylist is always incomplete, and it is
    right: ``fnmatch(".github/**")`` does not match ``"./.github/ci.yml"``, which
    is the same file. Three things follow, all below: every path is normalized to
    a canonical relative POSIX form *before* matching; a path that cannot be
    normalized is refused rather than skipped; and where the goal declares
    ``paths_allow``, that allowlist is enforced as well, which is the shape BSC1
    actually asks for. The denylist stays because ``DEFAULT_PATHS_DENY`` is an
    absolute that must hold even for a goal whose allowlist is empty.
    """
    if goal is None:
        return ""
    scope = goal.scope if isinstance(goal.scope, dict) else {}

    path_block = _path_blocker(proposal, scope)
    if path_block:
        return path_block

    target = proposal.target_slot
    if not target or cls in SELF_DIRECTED_CLASSES or cls in NON_TOUCHING_CLASSES:
        # session_create has no target yet; narrate's target is the driver's own
        # slot and act.py refuses any other; an escalation names the session it is
        # about. None of the three is a scope question.
        return ""

    exemption = observe_mod.exclusion_reason(
        target, report_only=_str_list(scope.get("report_only_slots"))
    )
    if exemption:
        return (
            f"target {target!r} is {exemption}: an exempt session is observed and "
            f"reported, never acted on"
        )

    return _membership_blocker(target, goal, scope, obs, cls)


def _path_blocker(proposal: Proposal, scope: dict[str, Any]) -> str:
    """``predicted_paths`` against the goal's deny and allow patterns."""
    raw_paths = list(proposal.predicted_paths or ())
    if not raw_paths:
        return ""
    if len(raw_paths) > MAX_PREDICTED_PATHS:
        return (
            f"proposal predicts {len(raw_paths)} paths, over the {MAX_PREDICTED_PATHS} "
            f"the gate will match: refused as unreviewable"
        )

    deny = _str_list(scope.get("paths_deny"))
    allow = _str_list(scope.get("paths_allow"))

    for raw in raw_paths:
        norm = _norm_path(raw)
        if norm is None:
            return (
                f"predicted path {str(raw)[:120]!r} is not a scope-relative path "
                f"(absolute, escaping, or empty), so no denylist match can be trusted"
            )
        for pattern in deny:
            if _glob_hit(norm, pattern):
                return f"predicted path {norm!r} matches paths_deny {pattern!r}"
        if allow and not any(_glob_hit(norm, pattern) for pattern in allow):
            return (
                f"predicted path {norm!r} matches none of the goal's "
                f"{len(allow)} paths_allow patterns"
            )
    return ""


def _membership_blocker(
    target: str,
    goal: goals_mod.Goal,
    scope: dict[str, Any],
    obs: observe_mod.Observation | None,
    cls: str,
) -> str:
    """Why *target* cannot be established as belonging to *goal*, or ``""``.

    Three independent ways to be in scope, any one sufficient, in order of how
    strong the evidence is:

    1. The operator listed the slot in ``scope.adopt_slots``. A declaration beats
       every inference.
    2. The driver created it for this goal — ``linked_session_key`` starts with
       ``conductor:<goal id>:``.
    3. Every scope axis the goal declares matches what the session reports.

    Failing all three ESCALATES rather than passing, and that is deliberate even
    when the goal declares nothing at all: a goal that names no workspace, no
    project and no sessions has no session that can be shown to be its work, and
    "I could not tell which sessions are yours" is a useful thing for an operator
    to be told. Passing instead would make an undeclared goal the widest-scoped
    one in the system.
    """
    if target in _str_list(scope.get("adopt_slots")):
        return ""

    # A creation action's target cannot be observable — not being there yet is the
    # entire point — so requiring an observation made dispatch permanently
    # unreachable: every session_create escalated with "no observation of X this
    # tick", forever, and a goal could never acquire its first worker.
    #
    # Membership is established by CONSTRUCTION instead. The name is minted from
    # this goal's own id, so it encodes ownership before the slot exists; the
    # executor independently refuses any name outside that mint and refuses again
    # if the platform would fold it (act.py), so the pair cannot land on a session
    # this goal does not own. A name outside the mint still blocks here, which is
    # what stops a proposal from using session_create to reach an arbitrary slot.
    if cls == "session_create":
        mint = f"{SLOT_NAME_PREFIX}{goal.id}-"
        if target.startswith(mint):
            return ""
        return (
            f"{target!r} is not a name goal {goal.id!r} may mint: session_create is "
            f"restricted to {mint!r}*, so it cannot be aimed at an existing session"
        )

    facts = _slot_facts(obs, target)
    if facts is None:
        return (
            f"no observation of {target!r} this tick, so the gate cannot establish "
            f"that it belongs to goal {goal.id!r}"
        )

    link = str(getattr(facts, "linked_session_key", "") or "")
    if link.startswith(f"{CONDUCTOR_LINK_PREFIX}{goal.id}:"):
        return ""
    if link.startswith(CONDUCTOR_LINK_PREFIX):
        owner = link.split(":")[1] if link.count(":") >= 2 else "?"
        return (
            f"{target!r} is bound to goal {owner!r} ({link!r}), not to {goal.id!r}: "
            f"one session belongs to one goal"
        )

    declared = {
        "workspace": _clean(scope.get("workspace")),
        "project": _clean(scope.get("project")),
    }
    axes = {name: value for name, value in declared.items() if value}
    if not axes:
        return (
            f"goal {goal.id!r} declares no workspace, no project and no adopt_slots, "
            f"and {target!r} was not created for it, so nothing establishes that this "
            f"session is its work"
        )
    for name, want in axes.items():
        got = _clean(getattr(facts, name, ""))
        if not got:
            return (
                f"{target!r} reports no {name}, so it cannot be shown to be inside "
                f"goal {goal.id!r}'s {name} {want!r}"
            )
        if got.casefold() != want.casefold():
            return (
                f"{target!r} is in {name} {got!r}, outside goal {goal.id!r}'s "
                f"{name} {want!r}"
            )
    if cls in TURN_CLASSES:
        logger.debug(
            "conductor: %s matched goal %s by scope axes only (no conductor link)",
            target, goal.id,
        )
    return ""


# ── step 6: dedup ────────────────────────────────────────────────────────────


def _dedup_blocker(
    proposal: Proposal, cooldowns: Cooldowns, cls: str
) -> tuple[Verdict | None, str]:
    """``(verdict, reason)`` for dedup, or ``(None, "")`` when nothing is stale.

    **The failure count is tested before the proposal signature, and swapping the
    two silently breaks R7.** ``Proposal.compute_signature`` folds
    ``failure_signature`` into its salient params (intents.py:263), so the second
    stall with the same fingerprint produces the *same* proposal signature as the
    first. A signature-first order therefore refuses it as a duplicate, and the
    escalate-on-the-second rule — the one clause that turns a nudger into a
    supervisor — never fires at all. It would look like it was working: the
    second nudge is correctly suppressed, and the escalation is simply absent.
    """
    failure = str(proposal.params.get("failure_signature") or "")
    if failure and cls not in GOALLESS_CLASSES:
        prior = cooldowns.occurrences(failure)
        if prior >= ESCALATE_AFTER_OCCURRENCES:
            return Verdict.ESCALATE, (
                f"this is occurrence {prior + 1} of failure signature {failure[:80]!r}: "
                f"the same failure has already been steered {prior}x, so it escalates "
                f"instead of being nudged again"
            )

    if cooldowns.seen(proposal.signature):
        remaining = cooldowns.remaining(proposal.signature)
        count = cooldowns.occurrences(proposal.signature)
        return Verdict.REFUSE, (
            f"signature {proposal.signature} was already acted on {count}x and is on "
            f"cooldown for another {int(remaining)}s: nothing has changed, so acting "
            f"again would be a duplicate"
        )
    return None, ""


# ── step 7: budget ───────────────────────────────────────────────────────────


async def _budget_check(
    budget: budget_mod.Budget, cls: str, goal_id: str
) -> tuple[bool, str]:
    """``budget.check`` off the loop, tolerating either shape of the API.

    ``check_async`` is preferred because the ledger it reads is a file; ``check``
    is offloaded when only the sync form exists. A budget object that raises is
    treated as exhausted — the fail-closed direction, and the one an operator can
    see, since it comes back as an escalation with the exception named.
    """
    checker = getattr(budget, "check_async", None)
    try:
        if callable(checker):
            ok, why = await checker(cls, goal_id)
        else:
            ok, why = await asyncio.to_thread(budget.check, cls, goal_id)
    except Exception as exc:
        logger.warning("conductor: budget check failed for %s", cls, exc_info=True)
        return False, (
            f"the budget ledger could not be read ({exc.__class__.__name__}), so the "
            f"allowance is treated as spent"
        )
    return bool(ok), str(why)


# ── step 8: capacity ─────────────────────────────────────────────────────────


def _capacity_blocker(
    proposal: Proposal, goal: goals_mod.Goal | None, obs: observe_mod.Observation | None
) -> tuple[Verdict, str] | None:
    """Why this turn cannot be dispatched right now, or ``None``.

    Counted from the ``Observation`` every time, never from a number the caller
    supplied: a ceiling derived from an argument is a ceiling the argument can
    defeat. ``None`` in a fact means *unreadable*, and unreadable is never read as
    zero — ``background_headroom is None`` does not block, ``== 0`` does.
    """
    slots = _slot_map(obs)
    if slots is None:
        return Verdict.REFUSE, "no observation this tick: refusing to dispatch blind"

    driver_turns = sum(
        1
        for facts in slots.values()
        if getattr(facts, "running", None)
        and (
            str(getattr(facts, "linked_session_key", "") or "").startswith(
                CONDUCTOR_LINK_PREFIX
            )
            or str(getattr(facts, "app", "") or "") == DRIVER_APP
        )
    )
    if driver_turns >= MAX_DRIVER_TURNS:
        return Verdict.REFUSE, (
            f"driver concurrency ceiling: {driver_turns} of {MAX_DRIVER_TURNS} "
            f"driver-started turns are already running"
        )

    if goal is not None:
        cap = _wip_cap(goal)
        in_flight = sum(
            1
            for key, facts in slots.items()
            if getattr(facts, "running", None) and _belongs(key, facts, goal)
        )
        if in_flight >= cap:
            return Verdict.REFUSE, (
                f"goal WIP: {in_flight} of {cap} sessions on goal {goal.id!r} are "
                f"already running a turn"
            )

    if getattr(obs, "background_headroom", None) == 0:
        return Verdict.REFUSE, (
            "the platform's background-turn semaphore has no permits left"
        )

    facts = _slot_facts(obs, proposal.target_slot) if proposal.target_slot else None
    if facts is not None:
        # The always-escalate band first: an approval or an unanswered question
        # card is the operator's to answer, and routing around either is the
        # thing the hard-deny set exists to make impossible.
        if getattr(facts, "pending_approval", None):
            return Verdict.ESCALATE, (
                f"{proposal.target_slot!r} has a tool approval pending: that one is "
                f"yours to answer, and the driver will not route around it"
            )
        if getattr(facts, "needs_input", None):
            return Verdict.ESCALATE, (
                f"{proposal.target_slot!r} has an unanswered question card: owner-gated "
                f"by design, so it escalates rather than being answered for you"
            )
        if getattr(facts, "running", None):
            return Verdict.REFUSE, (
                f"{proposal.target_slot!r} is running: never dispatch into a live turn"
            )
        queued = getattr(facts, "queue_depth", None)
        if queued:
            return Verdict.REFUSE, (
                f"{proposal.target_slot!r} already has {queued} queued prompt(s): our "
                f"own undelivered nudge counts, so a second one is a duplicate"
            )
    return None


def _wip_cap(goal: goals_mod.Goal) -> int:
    budgets = goal.budgets if isinstance(goal.budgets, dict) else {}
    raw = int(_num(budgets.get("wip"), float(DEFAULT_GOAL_WIP)))
    cap = raw if raw > 0 else DEFAULT_GOAL_WIP
    return min(cap, MAX_DRIVER_TURNS)


def _belongs(key: str, facts: Any, goal: goals_mod.Goal) -> bool:
    """Whether *key* counts against *goal*'s WIP.

    Adopted slots count. A session the driver created for this goal counts. A
    session that merely happens to share the workspace does NOT count: its turn
    is the operator's work, and charging their typing against the goal's WIP would
    make the driver stop acting precisely because the human started helping.
    """
    scope = goal.scope if isinstance(goal.scope, dict) else {}
    if key in _str_list(scope.get("adopt_slots")):
        return True
    link = str(getattr(facts, "linked_session_key", "") or "")
    return link.startswith(f"{CONDUCTOR_LINK_PREFIX}{goal.id}:")


# ── small helpers ────────────────────────────────────────────────────────────


def as_mode(mode: Mode | str | None) -> Mode:
    """Coerce *mode* to a :class:`~policy.Mode`, defaulting to ``ADVISORY``.

    An unrecognised mode string is the most restrictive real mode, not a raise:
    a control file hand-edited to ``"autonomus"`` must cost autonomy, never the
    tick that would have told the operator about it.
    """
    if isinstance(mode, Mode):
        return mode
    try:
        return Mode(str(mode).strip().lower())
    except ValueError:
        logger.warning("conductor: unknown mode %r; treating as advisory", mode)
        return Mode.ADVISORY


def _norm_path(raw: Any) -> str | None:
    """A canonical scope-relative POSIX path, or ``None`` if there is no such thing.

    Normalizing before matching is what makes the denylist mean what it says:
    VERIFIED empirically that ``fnmatch("./.github/ci.yml", ".github/**")`` is
    ``False`` while ``fnmatch(".github/ci.yml", ".github/**")`` is ``True``, so an
    un-normalized comparison hands out a bypass for the cost of two characters.
    Rejections mirror ``goals._pattern_error``'s (absolute, ``~``, ``..``,
    backslash) so a path the goal layer would refuse to persist is also one the
    gate refuses to match.
    """
    text = str(raw or "").strip().replace("\\", "/")
    if not text or text.startswith(("/", "~")) or ":" in text.split("/")[0]:
        return None
    collapsed = posixpath.normpath(text)
    if collapsed in (".", "..") or collapsed.startswith("../") or collapsed.startswith("/"):
        return None
    return collapsed


def _glob_hit(path: str, pattern: str) -> bool:
    """Deterministic glob match, over-matching in the deny direction on purpose.

    ``fnmatch`` rather than ``PurePath.match`` because the patterns are
    ``.github/**``-shaped and ``fnmatch``'s ``*`` crosses ``/``, which is the
    behaviour those patterns assume (the same choice ``steps._path_blocker``
    made). ``fnmatchcase`` plus an explicit case-folded pass rather than plain
    ``fnmatch``: the latter's case handling follows ``os.path.normcase`` and so
    differs by platform, and a denylist that stops matching ``.GITHUB/`` on a
    case-insensitive filesystem is a denylist with a hole in it. A directory
    pattern also matches everything under it, so ``.github`` covers
    ``.github/workflows/ci.yml`` without the operator writing the ``/**``.
    """
    pat = str(pattern or "").strip().replace("\\", "/")
    if not pat:
        return False
    pat = pat[2:] if pat.startswith("./") else pat
    candidates = [pat]
    if "*" not in pat and "?" not in pat:
        candidates.append(f"{pat.rstrip('/')}/**")
    head = _pattern_head(pat)
    if head:
        # The DIRECTORY a pattern is rooted at is covered by it. Without this,
        # ``.github/**`` matches ``.github/ci.yml`` and misses ``.github`` — and a
        # proposal that predicts touching the directory itself is predicting
        # exactly what the pattern exists to stop.
        candidates.append(head)
    for candidate in candidates:
        if fnmatch.fnmatchcase(path, candidate):
            return True
        if fnmatch.fnmatchcase(path.casefold(), candidate.casefold()):
            return True
    return False


def _pattern_head(pattern: str) -> str:
    """The wildcard-free directory prefix of *pattern*, or ``""``.

    ``.github/**`` → ``.github``; ``**/migrations/**`` → ``""`` (the first segment
    is already a wildcard, so there is no fixed root to protect).
    """
    segments: list[str] = []
    for segment in pattern.split("/"):
        if any(ch in segment for ch in "*?["):
            break
        if segment:
            segments.append(segment)
    return "/".join(segments)


def _slot_map(obs: Any) -> dict[str, Any] | None:
    """*obs*'s slot table, or ``None`` when there isn't a usable one.

    Read defensively rather than by attribute, and the reason is not paranoia
    about type hints: an exception raised inside the chokepoint costs the whole
    tick's queue, and every caller of this function already has a correct branch
    for "no observation" — refuse. A malformed snapshot must land on that branch,
    not in a traceback.
    """
    slots = getattr(obs, "slots", None)
    return slots if isinstance(slots, dict) else None


def _slot_facts(obs: Any, key: str) -> Any | None:
    slots = _slot_map(obs)
    return slots.get(key) if slots is not None else None


def _str_list(raw: Any) -> list[str]:
    if not isinstance(raw, (list, tuple)):
        return []
    return [str(item).strip() for item in raw if str(item).strip()]


def _clean(raw: Any) -> str:
    return str(raw or "").strip()


def _num(raw: Any, default: float = 0.0) -> float:
    """A finite float, or *default*. Copied discipline, not paranoia: a persisted
    ``1e400`` becomes ``inf``, and ``json.dump`` then emits invalid ``Infinity``."""
    try:
        value = float(raw)
    except (TypeError, ValueError):
        return default
    if value != value or value in (float("inf"), float("-inf")):
        return default
    return value


def _int(raw: Any, default: int = 0) -> int:
    try:
        return int(_num(raw, float(default)))
    except (TypeError, ValueError, OverflowError):
        return default


def _min_ts(*values: Any) -> float:
    """The earliest non-zero timestamp among *values*, or ``0.0``."""
    stamps = [_num(v) for v in values if _num(v) > 0]
    return min(stamps) if stamps else 0.0
