"""The fourteen ordered steps of one tick, and the mutable context they share.

Read this file top to bottom and you have read the control loop. :mod:`loop` owns
the clock, the supervision and the failure wrappers; every decision lives here, in
the plan's order — cheap and high-signal first, generative and irreversible last::

     0 guard      1 reconcile   2 operator   3 steer     4 observe
     5 detect     6 classify    7 evaluate   8 propose   9 gate
    10 compose   11 execute    12 prs       13 report

Each step is one coroutine taking the mutable :class:`TickContext` and returning a
small JSON-safe dict for the tick record. They communicate through the context and
never through module state, so a test can run any prefix of them and inspect what
the next one would see.

**The gate is not here.** ``backend/conductor/gate.py`` owns the chokepoint —
one side-effect-free function, the only thing in the codebase that stamps
``Verdict.ACT``. Step 9 (:func:`gate`) is its *caller*: it applies the operator's
veto list, asks ``gate.gate`` about each proposal, downgrades ACT on a dry run,
and writes the ledger's ``intent`` row. Nothing here re-derives authority; a
second implementation of ``min(mode, goal, marker)`` is the exact failure the
authority model exists to prevent.

Three properties of :func:`propose` are worth stating before reading it, because
they are what makes this autonomy rather than automation:

* It is **deterministic**. Findings × goals × policy in, proposals out. No model
  is consulted, no clock is read beyond ``tc.now``, and running it twice on one
  context yields the same list. The model's two jobs — *what kind of attention is
  this session asking for* (step 6) and *what words to use* (step 10) — bracket it
  on either side and neither can add, retarget or authorise a proposal.
* Every ``reasons`` clause is **machine-derived**, and cites the fact it came
  from. The reason list is the product in ``advisory`` mode, and a reason
  reconstructed after the fact is not an audit trail.
* It proposes **escalation as a first-class outcome**, not as a failure path. The
  second occurrence of a signature escalates rather than nudging again; anything a
  model called ``decision``, ``unclear``, ``approval`` or ``permission``
  escalates. A driver that could act but not report is the failure this feature
  exists to remove.

No gateway module is imported here, guarded or otherwise: everything that touches
the host does so through :mod:`act`, :mod:`observe` or :mod:`judge`, each of which
already guards its own imports. That is why this file is importable, and every
step callable, with no gateway present.
"""

from __future__ import annotations

import asyncio
import logging
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable, Iterable, Sequence

from . import act
from . import breaker
from . import budget as budget_mod
from . import control as control_mod
from . import gate as gate_mod
from . import goals as goals_mod
from . import judge
from . import ledger
from . import observe as observe_mod
from . import store
from .control import Control
from .goals import Goal
from .intents import Decision, Proposal, Tier, Verdict
from .observe import Observation
from .policy import HALT_MARKER, Mode

logger = logging.getLogger(__name__)

# ``backend/`` is on sys.path by the time the gateway loads this (routes.py:38);
# the retry covers a test or the offline selftest importing this module first.
# The pattern and its reasoning are observe.py:66-70's.
try:
    import detect
except ImportError:  # pragma: no cover - depends on who imported first
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    import detect  # type: ignore[no-redef]


# ── limits, all first guesses to be tuned from Increment 1's shadow ledger ────

RUNTIME_NAME = "runtime.json"
OPERATOR_NAME = "operator.json"
STATE_VERSION = 1

#: Consecutive deliberate ticks with an unchanged ``facts_hash`` — **while the
#: driver has been acting** — before a goal is declared ``blocked``. Motion is not
#: progress; four ticks is four minutes of the driver acting and nothing moving.
NON_PROGRESS_TICKS = 4

# The driver's global turn ceiling and the per-goal WIP default live in
# ``gate.MAX_DRIVER_TURNS`` / ``gate.DEFAULT_GOAL_WIP``, because the gate is what
# enforces them. Not mirrored here: an envelope tuned in one file and read from
# another is an envelope that is not in force.

# Signature cooldown and occurrence retention are ``gate.SIGNATURE_COOLDOWN_SECS``
# and ``gate.OCCURRENCE_RETENTION_SECS``. They are deliberately NOT re-declared
# here: the gate is the only thing that reads them for a decision, and two numbers
# named the same thing in two files is how a tuned envelope stops being the one in
# force.

#: Escalation flood guard: one escalation per goal+target per window.
ESCALATE_SUPPRESS_SECS = 900.0

#: A vetoed signature stays suppressed this long. TTL'd rather than permanent so
#: a veto is an instruction about *now*, not a decision the operator can never
#: revisit without editing a file.
VETO_TTL_SECS = 86_400.0

#: Hard cap on proposals per tick. A bug that generated one proposal per slot per
#: goal would otherwise spend the tick's whole budget in the ledger.
MAX_PROPOSALS_PER_TICK = 24

#: Digest cadence per goal. The operator gets one digest per goal per period, not
#: one bell per finding.
DIGEST_SECS = 3600.0

#: Deliberate cadence floor. A goal's ``cadence.tick_secs`` may raise it, never
#: lower it below the deliberate tick itself.
MIN_GOAL_TICK_SECS = 60.0

#: Classes that dispatch a real turn. Aliased from the gate rather than restated:
#: this set decides which reconciliation can be settled by observing a slot's turn
#: clock and which actions charge the turn budget, and it must not be able to
#: disagree with the set the gate enforces capacity against.
TURN_CLASSES: frozenset[str] = gate_mod.TURN_CLASSES

#: Classes whose body is composed by a model at step 10.
COMPOSED_CLASSES: frozenset[str] = frozenset({
    "session_continue", "context_inject", "narrate", "escalate", "operator_notify",
})

#: How a class's composed text is carried in ``params``.
_BODY_PARAM: dict[str, str] = {
    "session_continue": "message",
    "context_inject": "content",
    "narrate": "content",
    "escalate": "body",
    "operator_notify": "body",
}


# ── runtime state ────────────────────────────────────────────────────────────


def runtime_path() -> Path:
    return store.conductor_dir() / RUNTIME_NAME


def operator_path() -> Path:
    return store.conductor_dir() / OPERATOR_NAME


def _num(value: object, default: float = 0.0) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return default
    number = float(value)
    if number != number or number in (float("inf"), float("-inf")):
        return default
    return number


def _dict(value: object) -> dict[str, Any]:
    return dict(value) if isinstance(value, dict) else {}


@dataclass
class RuntimeState:
    """Everything the driver has to remember between ticks, and nothing else.

    All of it lives in one file because all of it is worthless individually: a
    cooldown without its signature index, or a non-progress counter without the
    hash it counted, is not partial state — it is misleading state.

    **Every deadline in here is an absolute wall-clock timestamp.** Never a
    monotonic instant, and this is the single most-copied lesson in the plan:
    batty's intervention dedup is ``Instant``-based and in-memory, so a daemon
    restart re-fires every intervention once. Autonudge's persisted absolute
    ``next_due_ts`` is the shape that survives a restart, and it is the shape
    used here.
    """

    cooldowns: dict[str, float] = field(default_factory=dict)
    """signature → the wall-clock time it may next be proposed."""

    signatures: dict[str, dict[str, Any]] = field(default_factory=dict)
    """signature → ``{suppressed, last_seen_ts}``, for the escalation flood guard's
    sighting record only.

    **The occurrence COUNT is deliberately not here.** ``gate.Cooldowns`` owns the
    one index that answers "has this been acted on, and how often" — the gate's own
    dedup reads it, so a second tally in this file could disagree with the gate
    about whether a stall was a repeat. It did, in the first cut."""

    progress: dict[str, dict[str, Any]] = field(default_factory=dict)
    """goal_id → ``{hash, unchanged, acted, history}``."""

    vetoed: dict[str, float] = field(default_factory=dict)
    goal_cooldowns: dict[str, float] = field(default_factory=dict)
    digests: dict[str, float] = field(default_factory=dict)
    delivered: dict[str, float] = field(default_factory=dict)
    """``goal_id|slot`` → when this goal's statement last reached that session.
    The thing that today propagates nowhere, remembered so it is not re-sent
    every minute."""

    counters: dict[str, float] = field(default_factory=dict)
    """``turns:<goal>`` and friends. Floats because JSON round-trips them anyway
    and a clamped repair is simpler with one numeric type."""

    consecutive_failures: dict[str, float] = field(default_factory=dict)
    """step name → consecutive failures, so the WARN at ≥3 survives a restart."""

    dirty: bool = False
    """Set by every mutator; read by the report step, which skips the write when
    nothing changed. Not persisted — it describes this process's copy, not the
    file. Without it the 15-second observe cadence would rewrite this whole file
    four times a minute forever to record that nothing happened."""

    @classmethod
    def from_json(cls, payload: object) -> RuntimeState:
        src = payload if isinstance(payload, dict) else {}
        out = cls(
            cooldowns={k: _num(v) for k, v in _dict(src.get("cooldowns")).items()},
            signatures={
                k: _dict(v) for k, v in _dict(src.get("signatures")).items()
            },
            progress={k: _dict(v) for k, v in _dict(src.get("progress")).items()},
            vetoed={k: _num(v) for k, v in _dict(src.get("vetoed")).items()},
            goal_cooldowns={
                k: _num(v) for k, v in _dict(src.get("goal_cooldowns")).items()
            },
            digests={k: _num(v) for k, v in _dict(src.get("digests")).items()},
            delivered={k: _num(v) for k, v in _dict(src.get("delivered")).items()},
            counters={k: _num(v) for k, v in _dict(src.get("counters")).items()},
            consecutive_failures={
                k: _num(v) for k, v in _dict(src.get("consecutive_failures")).items()
            },
        )
        return out

    def to_json(self) -> dict[str, Any]:
        return {
            "version": STATE_VERSION,
            "cooldowns": dict(self.cooldowns),
            "signatures": {k: dict(v) for k, v in self.signatures.items()},
            "progress": {k: dict(v) for k, v in self.progress.items()},
            "vetoed": dict(self.vetoed),
            "goal_cooldowns": dict(self.goal_cooldowns),
            "digests": dict(self.digests),
            "delivered": dict(self.delivered),
            "counters": dict(self.counters),
            "consecutive_failures": dict(self.consecutive_failures),
        }

    # -- accessors ---------------------------------------------------------

    def touch(self) -> None:
        """Mark this copy as needing a write. Called by every mutator, and
        explicitly by the steps that mutate a nested dict in place."""
        self.dirty = True

    def suppressed(self, key: str, now: float) -> float:
        """Seconds remaining on *key*'s cooldown, or 0.0."""
        return max(0.0, self.cooldowns.get(key, 0.0) - now)

    def stamp(self, key: str, now: float, secs: float) -> None:
        self.cooldowns[key] = now + max(0.0, secs)
        self.touch()

    def record_suppression(self, signature: str, now: float) -> None:
        """Note that a suppressed proposal was seen.

        batty's ``dispatch/guard.rs:39-60`` names the bug this prevents in its own
        comment: escalation → dropped → re-queued → escalation flood. Its fix is
        to insert into the recent set *even when suppressing*, and this is that
        insert. It deliberately does NOT extend the deadline: a sliding window
        that every sighting pushes forward would starve a genuinely repeating
        escalation forever, and the digest (which reads ``suppressed``) is the
        mechanism the plan gives for the volume instead.
        """
        entry = self.signatures.setdefault(signature, {})
        entry["suppressed"] = int(_num(entry.get("suppressed"))) + 1
        entry["last_seen_ts"] = now
        self.touch()

    def bump(self, counter: str, amount: float = 1.0) -> float:
        self.counters[counter] = _num(self.counters.get(counter)) + amount
        self.touch()
        return self.counters[counter]

    def prune(self, now: float) -> None:
        """Drop everything that can no longer change a decision.

        Called once per tick from the report step. Unbounded growth here is a slow
        leak in a process that is expected to run for weeks, and the bound is
        cheap: an expired cooldown, a lapsed veto and a signature nobody has seen
        for a day are all provably inert.
        """
        horizon = now - 86_400.0
        before = (
            len(self.cooldowns) + len(self.vetoed) + len(self.signatures) + len(self.delivered)
        )
        self.cooldowns = {k: v for k, v in self.cooldowns.items() if v > now - 60.0}
        self.vetoed = {k: v for k, v in self.vetoed.items() if v > now}
        self.signatures = {
            k: v
            for k, v in self.signatures.items()
            if _num(v.get("last_ts")) > horizon or _num(v.get("last_seen_ts")) > horizon
        }
        self.delivered = {k: v for k, v in self.delivered.items() if v > horizon}
        after = (
            len(self.cooldowns) + len(self.vetoed) + len(self.signatures) + len(self.delivered)
        )
        if after != before:
            self.touch()


async def load_runtime_async() -> RuntimeState:
    return RuntimeState.from_json(await store.read_json_async(runtime_path(), None))


async def save_runtime_async(runtime: RuntimeState) -> None:
    """Snapshot then write, in that order, off the loop.

    ``to_json`` copies every container before the write is handed to a thread,
    which is autonudge's ``_persist_locked`` discipline (``:668-685``): it
    snapshots under the lock and hands the *snapshot* to the executor, because
    handing over the live structure caused lost updates after a restart.
    """
    await store.write_json_async(runtime_path(), runtime.to_json())


# ── the tick context ─────────────────────────────────────────────────────────


@dataclass
class TickContext:
    """One tick's mutable working set. Built by :mod:`loop`, filled by the steps.

    Mutable on purpose. The alternative — threading fourteen return values
    through fourteen signatures — makes adding a step a refactor and makes a
    partial tick (which is the normal outcome when a step fails and the loop
    continues) unrepresentable.
    """

    now: float
    state: Any = None
    ctx: Any = None
    dry_run: bool = False
    deliberate: bool = True
    """Whether the expensive steps run this tick. False on an observe-only tick."""

    control: Control = field(default_factory=Control)
    mode: Mode = Mode.ADVISORY
    budget: budget_mod.Budget | None = None
    runtime: RuntimeState = field(default_factory=RuntimeState)
    cooldowns: gate_mod.Cooldowns | None = None
    """Signature dedup and cooldowns, owned by the driver and read by the gate.
    Supplied by :mod:`loop`; a bare context gets a non-persisting stand-in."""

    goals: list[Goal] = field(default_factory=list)
    observation: Observation | None = None
    facts: dict[str, Any] = field(default_factory=dict)
    stalls: list[Any] = field(default_factory=list)
    loops: list[Any] = field(default_factory=list)
    classifications: dict[str, dict[str, str]] = field(default_factory=dict)
    evaluations: dict[str, dict[str, Any]] = field(default_factory=dict)
    due_goals: set[str] = field(default_factory=set)
    members: dict[str, list[str]] = field(default_factory=dict)
    member_reasons: dict[str, str] = field(default_factory=dict)
    report_only: set[str] = field(default_factory=set)
    snoozed: set[str] = field(default_factory=set)

    proposals: list[Proposal] = field(default_factory=list)
    decisions: list[Decision] = field(default_factory=list)
    results: list[dict[str, Any]] = field(default_factory=list)
    steers: list[dict[str, Any]] = field(default_factory=list)

    halted: bool = False
    halt_reason: str = ""
    notes: list[str] = field(default_factory=list)
    summaries: dict[str, dict[str, Any]] = field(default_factory=dict)
    goal_touched: set[str] = field(default_factory=set)
    """Goals whose files this tick changed, so report writes each one once."""

    def note(self, text: str) -> None:
        if text and len(self.notes) < 40:
            self.notes.append(text)

    def goal(self, goal_id: str) -> Goal | None:
        for item in self.goals:
            if item.id == goal_id:
                return item
        return None

    def acting(self) -> bool:
        """Whether this tick may cause side effects at all."""
        return not self.halted and not self.dry_run


# ── step 0: guard ────────────────────────────────────────────────────────────


async def guard(tc: TickContext) -> dict[str, Any]:
    """Should this tick do anything? Sets ``tc.halted`` and says why.

    Four brakes, in decreasing order of authority. Every one of them returns
    early with a LOGGED skip rather than silently doing nothing, because "the
    conductor is not acting" and "the conductor is broken" look identical from
    the outside and the operator has to be able to tell them apart.

    The HALT marker is checked here **and again inside ``gate.gate`` for every
    single proposal**. That duplication is invariant I4: a tick that began before
    the operator hit the brake must not finish executing its queue, and a
    once-per-tick check is exactly the window that lets it.
    """
    marker = await asyncio.to_thread(store.marker_set, HALT_MARKER)
    if marker:
        tc.halted = True
        tc.halt_reason = f"HALT marker present ({store.marker_path(HALT_MARKER)})"
        logger.warning("conductor: %s; observing only", tc.halt_reason)
        return {"halted": True, "reason": tc.halt_reason}

    blocking = tc.control.blocking_reason()
    if blocking:
        tc.halted = True
        tc.halt_reason = blocking
        logger.info("conductor: not acting — %s", blocking)
        return {"halted": True, "reason": blocking}

    foreign = control_mod.foreign_owner(tc.control, now=tc.now)
    if foreign:
        tc.halted = True
        tc.halt_reason = foreign
        logger.warning("conductor: %s", foreign)
        return {"halted": True, "reason": foreign, "foreign_owner": True}

    return {"halted": False, "mode": tc.mode.value, "dry_run": tc.dry_run}


# ── step 1: reconcile ────────────────────────────────────────────────────────


async def reconcile(tc: TickContext) -> dict[str, Any]:
    """Close out intents that have no outcome, **by observation, never by retry**.

    An intent row with no outcome is precisely the crash window: the driver said
    what it was about to do, and then the process died before it could say what
    happened. The only safe reading of that row is *unknown*, and unknown means
    look at reality:

    * ``act.acted_path()`` is the executor's own idempotency journal, and the
      intent row carries its key (``ledger.record_intent`` writes
      ``idempotency_key`` into ``detail``). A record stamped ``ok`` is proof the
      effect landed. A record stamped ``claimed`` is the crash window itself. No
      record at all means the claim was released, which every *returned* refusal
      does — so nothing happened.
    * For a turn-dispatching class, the observation is the arbiter: a slot whose
      ``last_turn_ts`` is newer than the intent means our turn (or something
      else's) ran there, so the effect is not distinguishable from landed and we
      must not send again.

    **Nothing here re-dispatches, and nothing here is a retry.** Every path writes
    a ``reconciled`` outcome row, and then does exactly one of three things to the
    signature — which is the part worth reading twice:

    * **landed** ⇒ ``mark`` it, so the driver does not send the same thing again.
    * **did not land** ⇒ ``forget`` it (``gate.Cooldowns.forget``, "the reconciler's
      release path"). This is NOT a retry: nothing is re-dispatched here. The next
      deliberate tick re-derives the proposal from freshly observed reality and puts
      it through the whole gate again. The first cut stamped a cooldown on every
      outcome, which looked safest and was wrong in one direction — a session would
      never be steered again for a reason nothing had ever acted on, which is silent
      paralysis, bounded by nothing.
    * **unknown** ⇒ leave the claim exactly as it is. Unknown means reconcile, and a
      thing that may be half-landed must not be cleared for another attempt.
    """
    open_rows = await ledger.unreconciled_async(limit=100)
    if not open_rows:
        return {"open": 0}

    journal = await store.read_json_async(act.acted_path(), None)
    acted = journal.get("acted") if isinstance(journal, dict) else None
    acted = acted if isinstance(acted, dict) else {}
    await _ensure_observation(tc)

    landed = lost = unknown = 0
    for row in open_rows:
        action_id = str(row.get("action_id") or "")
        if not action_id:
            continue
        verdict, detail, disposition = _reconcile_one(tc, row, acted)
        if verdict == ledger.OUTCOME_SUCCESS:
            landed += 1
        elif disposition == "keep":
            unknown += 1
        else:
            lost += 1
        await ledger.record_outcome_async(
            action_id,
            outcome=verdict,
            detail=detail,
            event_type=ledger.EVENT_RECONCILED,
        )
        signature = str(row.get("signature") or "")
        if signature and tc.cooldowns is not None:
            if disposition == "mark":
                tc.cooldowns.mark(signature)
            elif disposition == "forget":
                tc.cooldowns.forget(signature)
        logger.info(
            "conductor: reconciled %s (%s) as %s — %s",
            action_id,
            row.get("action_class"),
            verdict,
            detail,
        )

    return {"open": len(open_rows), "landed": landed, "lost": lost, "unknown": unknown}


def _reconcile_one(
    tc: TickContext, row: dict[str, Any], acted: dict[str, Any]
) -> tuple[str, str, str]:
    """``(outcome, detail, disposition)`` for one open intent.

    *disposition* is what the caller does to the signature: ``mark`` (it landed,
    do not send again), ``forget`` (it did not land, let a later tick decide
    afresh), or ``keep`` (unknown — leave the claim alone). Pure, so the whole
    decision table is testable without a driver.
    """
    key = str(row.get("detail") or "")
    cls = str(row.get("action_class") or "")
    record = acted.get(key) if key else None
    record = record if isinstance(record, dict) else None

    if record is not None:
        stamp = str(record.get("outcome") or "")
        if stamp == "ok":
            return (
                ledger.OUTCOME_SUCCESS,
                "acted.json records the effect as landed",
                "mark",
            )
        if stamp == "unknown":
            observed, why = _observed_effect(tc, row)
            if observed is True:
                return ledger.OUTCOME_SUCCESS, f"claim was unknown; {why}", "mark"
            if observed is False:
                return ledger.OUTCOME_FAILURE, f"claim was unknown; {why}", "forget"
            return (
                ledger.OUTCOME_FAILURE,
                f"claim was unknown and reality is unreadable ({why}); recorded as "
                f"not landed, and the claim is KEPT so nothing can retry it",
                "keep",
            )
        # "claimed": the executor reserved the key and never came back.
        observed, why = _observed_effect(tc, row)
        if observed is True:
            return ledger.OUTCOME_SUCCESS, f"claim was open; {why}", "mark"
        if observed is False:
            return (
                ledger.OUTCOME_FAILURE,
                f"claim was open at restart; {why}. Nothing is re-dispatched here; a "
                f"later tick may decide afresh from what it observes",
                "forget",
            )
        return (
            ledger.OUTCOME_FAILURE,
            f"claim was open at restart and the effect is unobservable ({why}); the "
            f"claim is kept, because unknown means reconcile and never retry",
            "keep",
        )

    # No claim at all is the one AIRTIGHT reading available, so it does not
    # consult the observation: ``_claim`` is the first thing ``act.execute`` does
    # after its policy checks, and ``_release`` removes a claim only when the
    # attempt provably had no effect (act.py:365-379 — every returned refusal is
    # raised before its executor's first mutation). So no claim ⇒ no effect.
    #
    # Consulting the fleet here was the first implementation and it was WRONG in a
    # way worth recording: a stalled member session is usually `running`, so
    # "something is running there" would report an intent that never reached the
    # executor as landed — a false success in the one record the operator
    # reconstructs the night from. Both readings refuse to re-dispatch; only this
    # one is true.
    #
    # Caveat, stated: ``acted.json`` keeps the newest ACTED_KEEP entries, so an
    # intent older than that window has no claim for a different reason. It still
    # fails toward "nothing happened", which never re-dispatches.
    return (
        ledger.OUTCOME_FAILURE,
        "no idempotency claim on file: the executor released it or never reached "
        "it, so nothing happened",
        "forget",
    )


def _observed_effect(tc: TickContext, row: dict[str, Any]) -> tuple[bool | None, str]:
    """Did this intent's effect happen, as far as the fleet can tell?

    ``True``/``False``/``None`` for landed / did not land / cannot tell. The
    third value is not a nicety: ``context_inject`` leaves no observable trace by
    design (no turn, no WS event, no row), so claiming to know is the one answer
    that is definitely wrong.
    """
    cls = str(row.get("action_class") or "")
    slot_key = str(row.get("resource") or "")
    intent_ts = _num(row.get("ts"))
    observation = tc.observation

    if cls in ("context_inject", "narrate"):
        return None, (
            f"{cls} leaves no observable trace by design (no turn, no WS event)"
        )
    if cls in ("escalate", "operator_notify"):
        return None, f"{cls} lands in the notification feed, which the driver cannot read back"
    if observation is None or not slot_key:
        return None, "no observation to compare against"

    facts = observation.slots.get(slot_key)
    if facts is None:
        if cls == "session_create":
            return False, f"slot {slot_key!r} does not exist, so it was never created"
        return None, (
            f"slot {slot_key!r} is not live — a slot-miss is not evidence of death "
            f"(the driver arms before the dashboard restores slots)"
        )
    if cls == "session_create":
        return True, f"slot {slot_key!r} exists"
    last_turn = detect.epoch_secs(facts.last_turn_ts)
    if last_turn > 0 and intent_ts > 0 and last_turn >= intent_ts:
        return True, (
            f"slot {slot_key!r} settled a turn at {last_turn:.0f}, at or after the "
            f"intent at {intent_ts:.0f}"
        )
    if facts.running:
        return True, f"slot {slot_key!r} is running: a turn is in flight there"
    return False, (
        f"slot {slot_key!r} is idle and its last turn predates the intent"
    )


# ── step 2: operator ─────────────────────────────────────────────────────────


async def operator(tc: TickContext) -> dict[str, Any]:
    """Harvest the operator's dismissals so the loop cannot re-raise them.

    Invariant I7: a set-aside item is never re-raised and a split goal is never
    re-clustered. The migration that puts those decisions in ``data/`` — today
    they are ``localStorage`` keys in the browser — is a prerequisite of this
    feature and **is not built yet**: there is no ``backend/operator_state.py``
    in this tree. So this step reads ``data/conductor/operator.json`` if
    something has written one and degrades to "no dismissals known" if not.

    The degradation is stated rather than hidden because it has teeth: until the
    migration lands, an item the operator snoozed in the browser is invisible
    here, and the honest consequence is that the driver may propose about it.
    That is exactly why the plan calls the migration a merge gate rather than a
    follow-up.
    """
    payload = await store.read_json_async(operator_path(), None)
    if not isinstance(payload, dict):
        tc.note("operator.json absent: no dismissals known (I7 migration pending)")
        return {"present": False, "report_only": 0, "snoozed": 0}

    report_only = payload.get("report_only")
    snoozed = payload.get("snoozed")
    tc.report_only |= {
        str(k) for k in (report_only if isinstance(report_only, (list, tuple)) else [])
    }
    if isinstance(snoozed, dict):
        # A snooze is stored with its expiry; an expired one is not a dismissal.
        tc.snoozed |= {
            str(k) for k, v in snoozed.items() if _num(v) == 0.0 or _num(v) > tc.now
        }
    elif isinstance(snoozed, (list, tuple)):
        tc.snoozed |= {str(k) for k in snoozed}

    return {
        "present": True,
        "report_only": len(tc.report_only),
        "snoozed": len(tc.snoozed),
    }


# ── step 3: steer ────────────────────────────────────────────────────────────


async def steer(tc: TickContext) -> dict[str, Any]:
    """Drain the steer queue and apply it. Two halves, and the split is the boundary.

    Guidance prose is appended to ``goal.guidance`` and shapes *content* — the
    wording of injections and the preamble every model call sees. A recognised
    directive changes *policy*. Nothing in between: free text that matches no
    directive is guidance, and a request for a hard-denied class is refused with a
    ledger row the operator can read.

    **A steer can never widen authority.** ``policy.effective`` is the only source
    of a tier and this function never touches it. "Just merge it already" reaches
    :func:`_refuse_authority`, which records ``authority_refused`` against the
    class the operator named and surfaces "you asked for X; that requires you".

    It also **resets the non-progress counter** for every goal it touches. That is
    load-bearing and easy to miss: ``goals.facts_hash`` deliberately excludes
    ``guidance`` (goals.py:1464) so that appending prose cannot silently clear the
    counter from inside the hash — which means clearing it has to happen here,
    explicitly, where it is auditable.
    """
    records = await control_mod.drain_steer_async()
    tc.steers = records
    if not records:
        return {"drained": 0}

    applied: list[str] = []
    refused: list[str] = []
    guidance_goals: set[str] = set()

    for record in records:
        kind, args = control_mod.parse_steer(record)
        text = args["text"]
        goal_id = args["goal_id"] or _goal_from_words(tc, args["words"])
        if not goal_id and kind == control_mod.GUIDANCE_KIND:
            goal_id = _sole_goal(tc)
        goal = tc.goal(goal_id) if goal_id else None

        if kind == control_mod.GUIDANCE_KIND:
            denied = _hard_denied_request(text)
            if denied:
                await _refuse_authority(tc, denied, goal_id, text)
                refused.append(f"{denied}: authority_refused")
                # It still becomes guidance. The operator's intent is real even
                # when the mechanism they asked for is refused, and the next
                # deliberation should read "they want this landed".
            if goal is not None:
                goal.guidance.append({"text": text[:2000], "ts": tc.now})
                goal.guidance = goal.guidance[-goals_mod.MAX_GUIDANCE :]
                tc.goal_touched.add(goal.id)
                guidance_goals.add(goal.id)
                applied.append(f"guidance → {goal.id}")
            else:
                tc.note(f"steer guidance with no goal named: {text[:80]}")
                applied.append("guidance (unassigned)")
            continue

        ok, why = await _apply_directive(tc, kind, args, goal)
        (applied if ok else refused).append(f"{kind}: {why}")

    for goal_id in guidance_goals | tc.goal_touched:
        entry = tc.runtime.progress.get(goal_id)
        if entry:
            entry["unchanged"] = 0
            entry["steered_ts"] = tc.now
            tc.runtime.touch()

    return {"drained": len(records), "applied": applied, "refused": refused}


def _goal_from_words(tc: TickContext, words: Sequence[str]) -> str:
    """The first token naming a loaded goal. Exact ids only, never a prefix.

    A prefix match would let ``pause_goal auth`` pause ``auth-rewrite`` when the
    operator meant ``auth-fix``. A directive that silently hits the wrong goal is
    worse than one that does nothing and says so.
    """
    known = {g.id for g in tc.goals}
    for word in words:
        candidate = word.strip().strip(",.;:").lower()
        if candidate in known:
            return candidate
    return ""


def _sole_goal(tc: TickContext) -> str:
    """The one live goal, when there is exactly one. Else ``""``.

    Guidance only, never a directive. An operator typing prose into the composer
    with one goal running means that goal, and dropping it — the first behaviour
    here — made the steer box feel broken in its most common case. With two or
    more goals there is no non-guess available, so the prose stays unassigned and
    a note says so. A DIRECTIVE never takes this path: "pause_goal" hitting a goal
    the operator did not name is a policy change by coin-flip.

    "Live" here means *not terminal*, NOT *dispatchable*. A held or blocked goal is
    still the goal the operator is talking about, and guidance explaining why is
    the likeliest thing they type before resuming it. Requiring dispatchable was
    the first cut and it dropped precisely that sentence: a ``pause_goal`` earlier
    in the same drain made the goal undispatchable, so the prose explaining the
    pause went nowhere.
    """
    candidates = [
        goal.id
        for goal in tc.goals
        if tc.control.pursues(goal.id) and goal.status not in goals_mod.TERMINAL_STATUSES
    ]
    return candidates[0] if len(candidates) == 1 else ""


_HARD_DENY_PHRASES: tuple[tuple[str, str], ...] = (
    ("pr_merge", "merge"),
    ("pr_automerge", "auto-merge"),
    ("pr_automerge", "automerge"),
    ("pr_review", "approve the pr"),
    ("approval_answer", "approve the tool"),
    ("approval_answer", "answer the approval"),
    ("question_answer", "answer the question"),
    ("trust", "trust it"),
    ("yolo", "yolo"),
    ("shell", "run the command"),
)


def _hard_denied_request(text: str) -> str:
    """The hard-denied class a steer is asking for, or ``""``.

    A phrase table, not a model: the point of this check is that it is
    deterministic and testable. It is deliberately *narrow* — it exists to make
    the common phrasings produce a visible "that requires you" instead of silence,
    not to be a filter. Nothing depends on it catching everything, because
    ``gate.gate`` refuses hard-denied classes structurally whatever prose
    arrived; missing a phrase costs a nicer error message, never a merge.
    """
    lowered = f" {text.lower()} "
    for action_class, phrase in _HARD_DENY_PHRASES:
        if phrase in lowered:
            return action_class
    return ""


async def _refuse_authority(
    tc: TickContext, action_class: str, goal_id: str, text: str
) -> None:
    """Record ``authority_refused`` for a steer that asked for a denied class.

    A real ledger row rather than a log line, because "I asked it to merge and it
    didn't" must be answerable from the same artifact as everything else the
    driver did that night. The Proposal is inert by construction and never reaches
    a gate — it exists to carry the reason list into the ledger's schema.
    """
    proposal = Proposal(
        action_class=action_class,
        goal_id=goal_id,
        reasons=[
            f"operator steer requested {action_class}",
            f"{action_class} is hard-denied: no execution path and no configuration "
            f"creates one",
            "recorded as authority_refused; the operator remains the only path",
        ],
        params={"steer": text[:400]},
    )
    decision = Decision(
        proposal=proposal,
        verdict=Verdict.REFUSE,
        tier=Tier.DENY_HARD,
        reason=(
            f"authority_refused: you asked for {action_class}; that requires you. "
            f"A steer cannot widen authority."
        ),
    )
    await ledger.record_intent_async(decision)
    logger.warning(
        "conductor: authority_refused — steer asked for %s (goal=%s)", action_class, goal_id
    )
    tc.note(f"you asked for {action_class}; that requires you")


async def _apply_directive(
    tc: TickContext, kind: str, args: dict[str, Any], goal: Goal | None
) -> tuple[bool, str]:
    """Apply one recognised directive. ``(ok, why)`` — *why* is shown either way."""
    words: list[str] = list(args.get("words") or [])

    if kind in ("pause_goal", "resume_goal", "abandon_goal", "stop_dispatching"):
        if goal is None:
            return False, "no loaded goal named in the steer"
        tc.goal_touched.add(goal.id)
        if kind == "pause_goal" or kind == "stop_dispatching":
            goal.status = goals_mod.GoalStatus.HOLDING.value
            goal.paused_reason = args["text"][:200] or "held by operator steer"
            return True, f"{goal.id} → holding"
        if kind == "resume_goal":
            if goal.status not in (
                goals_mod.GoalStatus.HOLDING.value,
                goals_mod.GoalStatus.BLOCKED.value,
            ):
                return False, f"{goal.id} is {goal.status}, not held"
            goal.status = goals_mod.GoalStatus.ACTIVE.value
            goal.paused_reason = ""
            goal.terminal_reason = ""
            entry = tc.runtime.progress.setdefault(goal.id, {})
            entry["unchanged"] = 0
            tc.runtime.touch()
            return True, f"{goal.id} → active"
        # abandon_goal is one of the two statuses only the operator may set, and
        # a steer carries owner identity, so this IS the operator setting it.
        goal.status = goals_mod.GoalStatus.ABANDONED.value
        goal.terminal_reason = "abandoned by operator steer"
        return True, f"{goal.id} → abandoned"

    if kind == "mark_report_only":
        target = _first_slotish(words)
        if not target:
            return False, "no slot named"
        tc.report_only.add(target)
        if goal is not None:
            slots = goal.scope.setdefault("report_only_slots", [])
            if target not in slots:
                slots.append(target)
            tc.goal_touched.add(goal.id)
        return True, f"{target} is report-only: observed and reported, never touched"

    if kind == "prefer_session":
        target = _first_slotish(words)
        if not target or goal is None:
            return False, "needs a goal and a slot"
        adopt = goal.scope.setdefault("adopt_slots", [])
        if target not in adopt:
            adopt.append(target)
        tc.goal_touched.add(goal.id)
        return True, f"{target} adopted into {goal.id}"

    if kind == "veto":
        signature = args.get("intent_id") or (words[0] if words else "")
        if not signature:
            return False, "no intent id or signature named"
        tc.runtime.vetoed[signature] = tc.now + VETO_TTL_SECS
        tc.runtime.touch()
        return True, f"{signature} suppressed for {int(VETO_TTL_SECS // 3600)}h"

    if kind == "raise_budget":
        if goal is None or len(words) < 2:
            return False, "needs a goal, a field and a value"
        field_name, raw = words[0], words[1]
        return _raise_budget(tc, goal, field_name, raw)

    if kind == "set_deadline":
        if goal is None or not words:
            return False, "needs a goal and a wall-clock budget in seconds"
        try:
            secs = int(float(words[0]))
        except ValueError:
            return False, f"{words[0]!r} is not a number of seconds"
        goal.budgets["wall_clock_secs"] = max(60, secs)
        tc.goal_touched.add(goal.id)
        return True, f"{goal.id} wall_clock_secs = {goal.budgets['wall_clock_secs']}"

    return False, f"unhandled directive {kind}"


_BUDGET_FIELDS: frozenset[str] = frozenset({
    "turns", "wip", "max_concurrent_sessions", "wall_clock_secs", "usd",
})


def _raise_budget(
    tc: TickContext, goal: Goal, field_name: str, raw: str
) -> tuple[bool, str]:
    """Raise one numeric budget. Only the named fields, only upward.

    Downward is not refused out of pedantry: lowering a budget below what is
    already spent would make a goal that is mid-flight look budget-exhausted, and
    the operator's tool for stopping work is HOLD, which is unambiguous. Raising a
    budget also **does not clear an operator hold** — that is the ``paused_reason``
    versus ``terminal_reason`` split earning its keep (goals.py:688-696).
    """
    if field_name not in _BUDGET_FIELDS:
        return False, f"{field_name!r} is not a raisable budget field"
    try:
        value = float(raw)
    except ValueError:
        return False, f"{raw!r} is not a number"
    current = _num(goal.budgets.get(field_name))
    if value <= current:
        return False, f"{field_name} is already {current:g}; raise_budget only raises"
    goal.budgets[field_name] = value if field_name == "usd" else int(value)
    if goal.status == goals_mod.GoalStatus.BLOCKED.value and goal.terminal_reason.startswith(
        ("turn_budget", "runtime_budget", "usd_budget", "action_cap")
    ):
        goal.status = goals_mod.GoalStatus.ACTIVE.value
        goal.terminal_reason = ""
    tc.goal_touched.add(goal.id)
    return True, f"{goal.id}.{field_name} = {goal.budgets[field_name]}"


def _first_slotish(words: Iterable[str]) -> str:
    for word in words:
        candidate = word.strip().strip(",.;:'\"")
        if candidate and not candidate.isdigit():
            return candidate[:200]
    return ""


# ── step 4: observe ──────────────────────────────────────────────────────────


async def _ensure_observation(tc: TickContext) -> Observation:
    """The tick's observation, built on first demand.

    :func:`reconcile` runs before :func:`observe` in the plan's order but needs
    the fleet to reconcile against, so both funnel through here and the first one
    to ask pays. That keeps the documented step order intact instead of quietly
    reordering it, and one snapshot serves the whole tick — which is the property
    ``Observation`` exists for.
    """
    if tc.observation is None:
        tc.observation = observe_mod.observe(tc.state, now=tc.now)
    return tc.observation


async def observe(tc: TickContext) -> dict[str, Any]:
    """Build the immutable fleet snapshot and the hashable fact payload.

    Synchronous underneath, and that is deliberate: ``observe_mod.observe``
    contains no ``await`` so the fleet it describes is one real instant. In-memory
    attribute reads only — no ``to_dict()`` per slot (it re-parses ``[OPTIONS:]``
    and re-projects source links on every call, and drops CI status for a
    non-owner caller, which is the bug ``watcher.py:230`` has today).
    """
    snapshot = await _ensure_observation(tc)
    tc.facts = _fact_payload(snapshot)
    # Membership is derived HERE, not in evaluate, because `classify` (step 6)
    # runs before `evaluate` (step 7) and needs to know which goal a stalled
    # session belongs to before it will spend a model call on it. Building it in
    # evaluate meant classify saw an empty map and classified nothing — a bug
    # whose only symptom is that every stall silently escalates.
    tc.members = _build_membership(tc)
    return {
        "slots": len(snapshot.slots),
        "members": {gid: len(keys) for gid, keys in tc.members.items() if keys},
        "running_turns": snapshot.running_turns,
        "background_headroom": snapshot.background_headroom,
        "degraded": list(observe_mod.MISSING_PLATFORM_HELPERS),
    }


def _fact_payload(snapshot: Observation) -> dict[str, Any]:
    """The three keys ``goals.facts_hash`` reads, and nothing else.

    PR head SHAs come from the slots' own ``source_links``, which is free — a
    projection of what the dashboard already cached. It is emphatically **not** a
    provider refresh: that is Increment 7's job and it is gated on OQ4 (see
    :func:`prs`). A stale SHA in the hash is fine for non-progress detection,
    because a *stale* SHA that never moves is exactly the signal "nothing landed".
    """
    slots: dict[str, dict[str, Any]] = {}
    prs: dict[str, str] = {}
    for key, facts in snapshot.slots.items():
        slots[key] = {"last_turn_ts": facts.last_turn_ts, "messages": facts.messages}
        for link in facts.source_links:
            url = str(link.get("url") or "")
            if not url:
                continue
            sha = str(link.get("head_sha") or link.get("sha") or link.get("state") or "")
            prs[url] = sha
    return {"slots": slots, "prs": prs, "findings": []}


# ── step 5: detect ───────────────────────────────────────────────────────────


async def detect_step(tc: TickContext) -> dict[str, Any]:
    """Run the existing pure detectors. No new detection logic lives here.

    ``detect.py`` already refuses to call four kinds of legitimate quiet a stall
    (waiting on the user, sleeping in a ``wait`` tool, stopping, delegating), and
    that restraint is the hard part of the problem. Re-deriving it would produce a
    second set of thresholds that disagreed with the notifications the operator
    already trusts.

    Exempt sessions are skipped by KEY here, not filtered out of the observation:
    the conductor's own slots and every ``report_only`` slot are still observed
    and still reported, and only never acted on.
    """
    snapshot = await _ensure_observation(tc)
    skip = frozenset(observe_mod.CONDUCTOR_SLOT_KEYS | tc.report_only)
    rows = snapshot.raw_for_detect
    tc.stalls = detect.detect_stalls(rows, tc.now, skip_keys=skip)
    tc.loops = detect.detect_error_loops(rows, skip_keys=skip)
    tc.facts["findings"] = sorted(
        [_stall_signature(f) for f in tc.stalls] + [_loop_signature(f) for f in tc.loops]
    )
    return {
        "stalls": len(tc.stalls),
        "error_loops": len(tc.loops),
        "skipped_keys": len(skip),
    }


def _stall_signature(finding: Any) -> str:
    """Stable identity of "this session is stalled".

    Keyed on the session and nothing else, deliberately. A signature that folded
    in the silence duration would change every tick, which turns "one send per
    signature" into "one send per tick" — the exact failure
    ``Proposal.compute_signature`` documents for message bodies.
    """
    return f"stall:{finding.key}"


def _loop_signature(finding: Any) -> str:
    """Stable identity of "this session keeps failing the same way".

    Keyed on ``(session, tool)`` rather than on ``detect.failure_signature``,
    because ``ErrorLoopFinding.__slots__`` (detect.py:231) does not carry the
    signature the detector computed internally — the finding exposes the tool and
    the repeat count only. The consequence is stated rather than papered over:
    two *different* failures of one tool collapse into one signature, so the
    second one is suppressed rather than duplicated. Coarser, never finer; it
    fails toward silence.
    """
    return f"errorloop:{finding.key}:{finding.tool}"


# ── step 6: classify ────────────────────────────────────────────────────────


async def classify(tc: TickContext) -> dict[str, Any]:
    """[LLM] What kind of attention does each blocked session want?

    The one distinguisher that does not exist anywhere in the platform, and the
    reason "supply the fact and the work continues" has never been buildable.
    Everything about it is bounded: an ephemeral session with all tools rejected,
    a per-tick call cap inside :mod:`judge`, a hard timeout, and a circuit breaker
    around the whole capability so a rate-limited model degrades **one** lane
    instead of stopping autonomy.

    Its output is a LABEL. It cannot pick a target, cannot set a tier and cannot
    satisfy a completion check; only ``fact`` is even eligible to unlock a
    continuation, and ``gate.gate`` still has to agree.
    """
    if not tc.stalls:
        return {"classified": 0, "reason": "no stalls to classify"}

    brk = breaker.get("llm_classify")
    allowed, why = brk.allow()
    if not allowed:
        tc.note(f"classification disabled: {why}")
        return {"classified": 0, "breaker": why}
    if not judge.available(sessions=getattr(tc.state, "sessions", None)):
        return {"classified": 0, "reason": "no model path on this gateway"}

    snapshot = await _ensure_observation(tc)
    raw_by_key = {str(row.get("key") or ""): row for row in snapshot.raw_for_detect}
    done = 0
    for finding in tc.stalls[: judge.MAX_CALLS_PER_TICK]:
        goal_id = _goal_for_slot(tc, finding.key)
        if not goal_id:
            continue
        goal = tc.goal(goal_id)
        facts = snapshot.slots.get(finding.key)
        if goal is None or facts is None:
            continue
        payload = facts.to_json()
        raw = raw_by_key.get(finding.key, {})
        # `question_blocking` is why observe.py exposes it: `detect.is_excluded`
        # does not read `needs_input`, so a session parked on a blocking question
        # card DOES produce a stall finding, and it must be routed to "needs you"
        # rather than nudged. judge short-circuits on it without spending a call.
        payload["question_blocking"] = bool(raw.get("question_blocking"))
        # Transcript rows go under "transcript": `to_json`'s `messages` is a COUNT,
        # and judge.render_facts reads rows only from this key.
        rows = raw.get("messages")
        payload["transcript"] = rows if isinstance(rows, list) else []
        try:
            result = await judge.classify_blocked(
                payload,
                goal.statement,
                guidance=goal.guidance,
                sessions=getattr(tc.state, "sessions", None),
            )
        except asyncio.CancelledError:
            raise
        except Exception as exc:
            brk.record_error(exc)
            logger.debug("conductor: classification failed for %s", finding.key, exc_info=True)
            continue
        brk.record_ok()
        tc.classifications[finding.key] = result
        done += 1

    return {
        "classified": done,
        "kinds": sorted({v.get("kind", "") for v in tc.classifications.values()}),
        "judge": judge.snapshot(),
    }


# ── step 7: evaluate ─────────────────────────────────────────────────────────


async def evaluate(tc: TickContext) -> dict[str, Any]:
    """``done_when`` predicates, non-progress, and every hard ceiling.

    Three independent termination forms, all required, and the ordering between
    them matters: a satisfied predicate ends a goal happily, a ceiling ends it
    with a named reason, and non-progress ends it with the hash history that
    proves it. A goal that hit a ceiling and a goal an operator held must never be
    indistinguishable, which is why ``terminal_reason`` and ``paused_reason`` are
    two fields.

    I8 in one line: this step's predicates are the only thing that may satisfy a
    goal. A model may veto, and may close a leaf; ``manual(...)`` lines are never
    closed by the driver — the goal moves to ``awaiting_confirmation`` and waits.
    """
    if not tc.goals:
        return {"goals": 0}

    membership = tc.members
    results: dict[str, Any] = {}

    for goal in tc.goals:
        if not tc.control.pursues(goal.id):
            continue
        summary: dict[str, Any] = {"status": goal.status}

        new_hash = goals_mod.facts_hash(goal, tc.facts)
        entry = tc.runtime.progress.setdefault(goal.id, {})
        previous = str(entry.get("hash") or "")
        changed = new_hash != previous
        cooldown_at = _num(tc.runtime.goal_cooldowns.get(goal.id))
        due = changed or tc.now >= cooldown_at
        summary.update({"facts_hash": new_hash, "changed": changed, "due": due})
        if not due:
            # The whole point of the two cadences: steady state is near zero work.
            results[goal.id] = summary
            continue
        tc.due_goals.add(goal.id)
        tc.runtime.goal_cooldowns[goal.id] = tc.now + max(
            MIN_GOAL_TICK_SECS, _num(goal.cadence.get("tick_secs"), MIN_GOAL_TICK_SECS)
        )
        tc.runtime.touch()

        # Close finished leaves BEFORE the goal's own predicates run, so an
        # ``all_leaves_closed`` line sees this tick's closures rather than lagging
        # a tick behind, and so a leaf that unblocks a dependant does it in the
        # same tick the dependant is proposed.
        newly_closed = await asyncio.to_thread(_close_leaves, goal)
        if newly_closed:
            summary["leaves_closed"] = newly_closed
            tc.goal_touched.add(goal.id)
            for row in newly_closed:
                logger.info(
                    "conductor: goal %s leaf %s closed — %s",
                    goal.id, row.get("leaf_id"), row.get("why"),
                )

        satisfied, predicate_rows = await asyncio.to_thread(_evaluate_predicates, goal)
        summary["done_when"] = predicate_rows
        summary["satisfied"] = satisfied

        # -- non-progress ------------------------------------------------
        if changed:
            entry["unchanged"] = 0
        elif entry.get("acted"):
            entry["unchanged"] = int(_num(entry.get("unchanged"))) + 1
        entry["hash"] = new_hash
        history = entry.get("history")
        history = list(history) if isinstance(history, list) else []
        if not history or history[-1] != new_hash:
            history.append(new_hash)
        entry["history"] = history[-NON_PROGRESS_TICKS - 1 :]
        # Cleared here so the NEXT tick's increment means "the driver acted during
        # the window it measured", not "the driver acted at some point".
        entry["acted"] = False
        tc.runtime.touch()
        summary["unchanged_ticks"] = int(_num(entry.get("unchanged")))

        # -- transitions, most conclusive first --------------------------
        before = goal.status
        if satisfied and goal.done_when:
            # Every machine predicate passed. Only the operator says `done`, so
            # the terminal move available here is to stop dispatching and ask.
            goal.status = goals_mod.GoalStatus.AWAITING_CONFIRMATION.value
            goal.terminal_reason = "every machine predicate passed"
        elif goals_mod.needs_operator_confirmation(predicate_rows):
            goal.status = goals_mod.GoalStatus.AWAITING_CONFIRMATION.value
            goal.terminal_reason = "only manual(...) lines remain"
        else:
            ceiling, why = _ceiling_reason(tc, goal)
            if ceiling:
                goal.status = goals_mod.GoalStatus.BLOCKED.value
                goal.terminal_reason = why
            elif int(_num(entry.get("unchanged"))) >= NON_PROGRESS_TICKS:
                goal.status = goals_mod.GoalStatus.BLOCKED.value
                goal.terminal_reason = (
                    f"non_progress: facts_hash unchanged for {NON_PROGRESS_TICKS} "
                    f"deliberate ticks while acting ({', '.join(history[-3:])})"
                )
        if goal.status != before:
            goal.updated_ts = tc.now
            tc.goal_touched.add(goal.id)
            summary["transition"] = f"{before} → {goal.status}: {goal.terminal_reason}"
            logger.info("conductor: goal %s %s", goal.id, summary["transition"])

        can, why = goals_mod.dispatchable(goal)
        summary["dispatchable"] = can
        summary["why"] = why
        summary["members"] = list(membership.get(goal.id, []))
        if tc.budget is not None:
            summary["budget"] = await tc.budget.snapshot_async(goal.id)
        results[goal.id] = summary

    tc.evaluations = results
    return {
        "goals": len(results),
        "due": sorted(tc.due_goals),
        "blocked": [g for g, s in results.items() if s.get("status") == "blocked"],
    }


def _close_leaves(goal: Goal) -> list[dict[str, Any]]:
    """Close leaves whose file predicates are satisfied. Blocking; mutates *goal*.

    Shares :func:`_resolve_root`'s answer with the goal-level evaluation so a leaf
    and its goal can never disagree about which tree they are talking about. No
    resolvable root means no closures — the same refusal-to-guess as the goal
    predicates, for the same reason: closing a leaf against the wrong tree would
    unblock its dependants on evidence that does not exist.
    """
    root = _resolve_root(goal)
    if root is None:
        return []
    try:
        return goals_mod.close_satisfied_leaves(goal, root=root)
    except Exception:
        logger.exception("conductor: leaf closure failed for goal %s", goal.id)
        return []


def _resolve_root(goal: Goal) -> Path | None:
    """The goal's filesystem root, or None when it cannot be established."""
    for candidate in (
        goal.scope.get("root"), goal.scope.get("project"), goal.scope.get("workspace")
    ):
        text = str(candidate or "").strip()
        if not text.startswith("/"):
            continue
        path = Path(text)
        try:
            if path.is_dir():
                return path
        except OSError:
            continue
    return None


def _evaluate_predicates(goal: Goal) -> tuple[bool, list[dict[str, Any]]]:
    """Resolve the goal's scope to a filesystem root, then evaluate. Blocking.

    ``goals.evaluate_done_when`` takes ``root`` from its caller and deliberately
    does not resolve one, so this is the resolver — and it refuses to guess. Only
    an ABSOLUTE ``scope.project`` or ``scope.workspace`` naming a real directory
    counts. Falling back to the app's own data directory (the tempting default)
    would silently evaluate ``file_exists`` predicates against the wrong tree and
    report a goal as unfinished forever with a reason that looked like a bug in
    the operator's declaration rather than in ours.
    """
    root: Path | None = None
    # ``scope.root`` first, and it exists because the other two are overloaded:
    # ``workspace`` and ``project`` are also the MEMBERSHIP axes, so a goal forced
    # to declare one of them purely to locate its files thereby adopts every
    # session that reports the same value — observed, with a goal quietly claiming
    # five of the operator's unrelated sessions. ``root`` says where the files are
    # and nothing else.
    for candidate in (
        goal.scope.get("root"), goal.scope.get("project"), goal.scope.get("workspace")
    ):
        text = str(candidate or "").strip()
        if not text.startswith("/"):
            continue
        path = Path(text)
        try:
            if path.is_dir():
                root = path
                break
        except OSError:
            continue
    if root is None:
        return False, [
            {
                "kind": goals_mod.DRAFT_KIND,
                "satisfied": False,
                "detail": (
                    "no filesystem root: set scope.project (or scope.workspace) to an "
                    "absolute path so file predicates have something to check"
                ),
                "target": "",
                "index": -1,
                "escalates": False,
            }
        ]
    return goals_mod.evaluate_done_when(goal, root=root)


def _ceiling_reason(tc: TickContext, goal: Goal) -> tuple[bool, str]:
    """Has this goal hit a hard ceiling? ``(hit, named_reason)``.

    Each ceiling has its own reason enum because elapsed time keeps growing after
    a pause: without the name, a held goal and a runtime-exhausted one look the
    same, and raising the budget would silently resume an explicit hold. This is
    ``autonudge.py:288-293``'s ``stopped_reason`` discipline, copied.
    """
    turns_cap = _num(goal.budgets.get("turns"))
    turns_used = _num(tc.runtime.counters.get(f"turns:{goal.id}"))
    if turns_cap and turns_used >= turns_cap:
        return True, f"turn_budget: {turns_used:.0f} of {turns_cap:.0f} turns dispatched"

    wall = _num(goal.budgets.get("wall_clock_secs"))
    # Anchored on the PERSISTED activation, so a restart cannot reset it. A goal
    # with ``activated_ts == 0`` has no anchor and therefore no runtime ceiling:
    # whoever moves a goal to `active` MUST stamp it, and the driver deliberately
    # does not stamp it here — inferring an activation time from the first tick
    # that noticed the goal would reset the ceiling on every restart, which is the
    # exact failure the persisted anchor exists to prevent.
    if wall and goal.activated_ts and (tc.now - goal.activated_ts) >= wall:
        return True, (
            f"runtime_budget: {int(tc.now - goal.activated_ts)}s since activation, "
            f"cap {int(wall)}s"
        )
    # `usd` is declared in DEFAULT_BUDGETS and deliberately NOT enforced here.
    # UNVERIFIED: no per-turn cost signal is reachable from the app backend — no
    # spend accessor exists on DashboardState, and inventing one from token counts
    # would be a number the operator could not reconcile with their bill. Stated
    # rather than silently treated as unlimited.
    return False, ""


# ── step 8: propose ──────────────────────────────────────────────────────────


def _build_membership(tc: TickContext) -> dict[str, list[str]]:
    """goal_id → member slot keys, with the reason each one is a member.

    **This MIRRORS ``gate._membership_blocker`` (gate.py:801-874) and must not be
    wider than it.** Three ways in, any one sufficient, strongest evidence first:
    the operator listed the slot in ``scope.adopt_slots``; the driver created it for
    this goal (``linked_session_key`` starts ``conductor:<goal>:``); or every scope
    axis the goal declares — ``workspace``, ``project`` — matches what the session
    reports. Failing all three, the gate ESCALATES rather than acting, so a
    proposal aimed at such a slot could only ever produce noise.

    **A title/alias match is deliberately NOT membership**, and this is a real
    narrowing worth surfacing at review. The plan (line 208-210) says a goal
    decomposes into "the set of sessions the existing alias clustering already
    assigns to it", and the first cut of this function did exactly that — matching
    ``model.ts:2525``'s longest-alias-wins substring rule. The gate refuses that
    evidence, on the stated ground that an alias in a session title does not
    establish that the session is the goal's work. Rather than propose things the
    chokepoint always escalates, the alias set is used for a NOTE instead
    (:func:`_alias_hint`), which tells the operator the one thing that fixes it:
    declare ``scope.project``, or adopt the slot.
    """
    snapshot = tc.observation
    if snapshot is None:
        return {}
    out: dict[str, list[str]] = {}
    for goal in tc.goals:
        members: list[str] = []
        adopt = {str(s) for s in goal.scope.get("adopt_slots", [])}
        link_prefix = f"conductor:{goal.id}:"
        axes = {
            name: str(goal.scope.get(name) or "").strip()
            for name in ("workspace", "project")
            if str(goal.scope.get(name) or "").strip()
        }
        for key, facts in snapshot.slots.items():
            if observe_mod.exclusion_predicate(key, report_only=tc.report_only):
                continue
            reason = ""
            if key in adopt:
                reason = "adopted into this goal by the operator"
            elif facts.linked_session_key.startswith(link_prefix):
                reason = f"created by the driver for {goal.id}"
            elif facts.linked_session_key.startswith("conductor:"):
                reason = ""  # another goal's session; one session, one goal
            elif axes and all(
                str(getattr(facts, name, "") or "").casefold() == want.casefold()
                for name, want in axes.items()
            ):
                reason = "session " + ", ".join(
                    f"{name} is the goal's {name} ({want})" for name, want in axes.items()
                )
            if reason:
                members.append(key)
                tc.member_reasons[f"{goal.id}|{key}"] = reason
        out[goal.id] = members
        hint = _alias_hint(tc, goal, members)
        if hint:
            tc.note(hint)
    return out


def _alias_hint(tc: TickContext, goal: Goal, members: list[str]) -> str:
    """The teachable sentence for a goal whose sessions cannot be established.

    "Nothing is happening" has to come with the reason, and this is the reason in
    the one case an operator will actually hit: they named aliases (which is what
    the existing board clusters on) and no scope, so the driver can see sessions
    that look like the goal's work and cannot show that they are.
    """
    if members or tc.observation is None:
        return ""
    aliases = [str(a).lower() for a in goal.scope.get("aliases", []) if str(a).strip()]
    if not aliases:
        return ""
    looks_like = [
        key
        for key, facts in tc.observation.slots.items()
        if any(alias in facts.title.lower() for alias in aliases)
        and not observe_mod.exclusion_predicate(key, report_only=tc.report_only)
    ]
    if not looks_like:
        return ""
    return (
        f"goal {goal.id!r}: {len(looks_like)} session(s) match its aliases but nothing "
        f"establishes scope — set scope.project/workspace or add them to "
        f"scope.adopt_slots, or the gate will escalate rather than act"
    )


def _goal_for_slot(tc: TickContext, slot_key: str) -> str:
    for goal_id, keys in tc.members.items():
        if slot_key in keys:
            return goal_id
    return ""


async def propose(tc: TickContext) -> dict[str, Any]:
    """Findings × goals × policy → ``Proposal[]``. Deterministic. **This is the autonomy.**

    Every proposal is built by one of the small ``_propose_*`` helpers below, and
    each helper's whole job is to turn platform facts into a reason list. Read the
    helpers as the answer to "what will it actually do at 3am":

    * a goal whose statement has never reached a member session gets it, as
      ephemeral context — no turn, no WS event, and the entire difference between
      an alias bucket and a driver;
    * a stalled member session gets ONE continuation if a model called its
      blocker a ``fact`` and the goal statement grounds it, and an escalation for
      every other classification;
    * the SECOND occurrence of any signature escalates instead of acting;
    * an error-looping session escalates with the loop evidence, never a nudge;
    * a blocked or awaiting-confirmation goal escalates once per window;
    * each goal gets at most one digest per hour.

    Nothing here reads a model, opens a socket or touches the host. The output is
    inert until :func:`gate` stamps it.
    """
    if tc.halted:
        return {"proposals": 0, "reason": f"halted: {tc.halt_reason}"}

    for goal in tc.goals:
        if goal.id not in tc.due_goals:
            continue
        if not tc.control.pursues(goal.id):
            continue
        can, why = goals_mod.dispatchable(goal)
        if not can:
            tc.proposals.extend(_propose_goal_attention(tc, goal, why))
            continue
        members = tc.members.get(goal.id, [])
        tc.proposals.extend(_propose_dispatch(tc, goal, members))
        tc.proposals.extend(_propose_statement(tc, goal, members))
        tc.proposals.extend(_propose_stalls(tc, goal, members))
        tc.proposals.extend(_propose_loops(tc, goal, members))
        tc.proposals.extend(_propose_digest(tc, goal, members))

    if len(tc.proposals) > MAX_PROPOSALS_PER_TICK:
        logger.warning(
            "conductor: %d proposals in one tick; keeping the first %d",
            len(tc.proposals),
            MAX_PROPOSALS_PER_TICK,
        )
        tc.proposals = tc.proposals[:MAX_PROPOSALS_PER_TICK]

    by_class: dict[str, int] = {}
    for proposal in tc.proposals:
        by_class[proposal.action_class] = by_class.get(proposal.action_class, 0) + 1
    return {"proposals": len(tc.proposals), "by_class": by_class}


def _occurrences(tc: TickContext, signature: str) -> int:
    """How many times *signature* has already been acted on.

    Read from ``gate.Cooldowns`` — the same index the gate's own dedup consults —
    so "has this been steered before" has ONE answer. Keeping a second count in
    :class:`RuntimeState` was the first cut, and it produced exactly the drift this
    avoids: the driver's tally and the gate's disagreed about whether a stall was
    a repeat, so a continuation was proposed and then escalated by the gate, and
    the operator got a ledger row for a nudge that never happened.
    """
    if tc.cooldowns is None:
        return 0
    return tc.cooldowns.occurrences(signature)


def _member_reason(tc: TickContext, goal: Goal, slot_key: str) -> str:
    return tc.member_reasons.get(f"{goal.id}|{slot_key}", "member of this goal")


def _propose_dispatch(tc: TickContext, goal: Goal, members: list[str]) -> list[Proposal]:
    """Give an open leaf its own worker session, briefed with the leaf's own prompt.

    This is Increment 6 — the step that turns the driver from a supervisor of work
    the operator started into something that starts work itself. Everything about
    it is deterministic: which leaf is next, whether its dependencies are closed,
    what the worker is told. No model chooses a target and no model writes the
    brief; the brief is the operator's own ``leaf["prompt"]``, delivered verbatim.

    Four gates, in order, and each one exists because of a specific failure:

    * **``depends_on`` must be closed.** The field gates dispatch only and is
      Conductor-local — the platform has no cross-session dependency model, so
      this must never be described to the operator as though it enforced one.
      Without it the ``search`` leaf is briefed before ``movegen`` exists and the
      worker invents an interface the real module will not have.
    * **The slot must not already exist.** ``cm-<goal>-<leaf>`` is the name the
      executor mints, and ``get_or_create_slot`` is idempotent by name, so a
      re-proposal would ADOPT the running worker rather than create one. Checking
      the observation here means the common case never reaches the executor's
      second guard at all.
    * **WIP ceiling.** ``budgets["max_wip"]`` bounds how many workers a goal may
      have in flight. The point is not cost, it is review surface: six sessions
      all editing at once is a fleet nobody can read, and the platform's own
      4-wide background-turn semaphore would serialize them anyway.
    * **A leaf with no prompt is skipped, loudly.** An unbriefed worker is worse
      than no worker — it sits on the board looking idle while nothing happens —
      and the executor refuses it anyway, so proposing it would only produce a
      ledger row that always fails.
    """
    leaves = goal.leaves or []
    if not leaves:
        return []
    observation = tc.observation
    closed = {
        str(leaf.get("id"))
        for leaf in leaves
        if str(leaf.get("status", "")) in goals_mod.CLOSED_LEAF_STATUSES
    }
    # In-flight is counted from the fleet, not from our own bookkeeping: a worker
    # the operator stopped by hand must free its WIP slot on the next tick.
    in_flight = 0
    for slot_key in members:
        facts = observation.slots.get(slot_key) if observation else None
        if facts is not None and (facts.running or facts.queue_depth):
            in_flight += 1
    # ``wip`` is the key the goal normalizer writes; ``max_wip`` is accepted as
    # the spelling an operator is likely to type. Reading only the latter is how
    # the ceiling silently became "2" regardless of what was declared.
    budgets = goal.budgets if isinstance(goal.budgets, dict) else {}
    try:
        max_wip = int(budgets.get("wip", budgets.get("max_wip", 2)))
    except (TypeError, ValueError):
        max_wip = 2
    max_wip = max(1, max_wip)

    out: list[Proposal] = []
    for leaf in leaves:
        leaf_id = str(leaf.get("id") or "").strip()
        if not leaf_id or leaf_id in closed:
            continue
        if in_flight + len(out) >= max_wip:
            tc.note(
                f"goal {goal.id}: WIP ceiling {max_wip} reached; "
                f"{len([l for l in leaves if str(l.get('id')) not in closed])} leaf/leaves still open"
            )
            break
        blocking = [d for d in (leaf.get("depends_on") or []) if str(d) not in closed]
        if blocking:
            continue
        slot_name = f"{act.SLOT_NAME_PREFIX}{goal.id}-{leaf_id}"
        if observation is not None and slot_name in observation.slots:
            continue
        # ``intent_text`` is the field the goal normalizer preserves and is
        # therefore the leaf's brief of record; ``prompt`` is only the name this
        # text travels under in the proposal params, because that is what the
        # executor reads. Accepting both spellings here means a goal authored with
        # either key dispatches, instead of persisting a leaf whose brief was
        # silently dropped on the way to disk.
        prompt = str(leaf.get("intent_text") or leaf.get("prompt") or "").strip()
        if not prompt:
            tc.note(
                f"goal {goal.id}: leaf {leaf_id!r} has no intent_text, so it cannot "
                "be dispatched — declare one or close the leaf"
            )
            continue
        deps = [str(d) for d in (leaf.get("depends_on") or [])]
        reasons = [
            f"leaf {leaf_id!r} of goal {goal.id!r} is open and has no worker session",
            (
                "its dependencies " + ", ".join(repr(d) for d in deps) + " are closed"
                if deps else "it has no dependencies"
            ),
            f"WIP {in_flight + len(out)}/{max_wip} for this goal",
        ]
        out.append(
            Proposal(
                action_class="session_create",
                goal_id=goal.id,
                target_slot=slot_name,
                reasons=reasons,
                params={
                    "leaf_id": leaf_id,
                    "prompt": prompt,
                    "slot_name": slot_name,
                    "title": str(leaf.get("title") or leaf_id),
                    # Passed through from the goal's scope, never chosen here: the
                    # executor applies an operator-declared approval mode to the
                    # session it mints. Absent means the worker is born untrusted
                    # and its first tool call will be denied by the unattended
                    # deny-fast, so an unattended goal has to declare it.
                    "worker_trust": str(goal.scope.get("worker_trust") or ""),
                    "workspace": str(goal.scope.get("workspace") or "default"),
                },
                # The gate globs these against other in-flight leaves, which is
                # what makes "file ownership is the concurrency control" an
                # enforced rule rather than a line in a conventions file.
                predicted_paths=[str(p) for p in (leaf.get("predicted_paths") or [])],
            )
        )
    return out


def _propose_statement(tc: TickContext, goal: Goal, members: list[str]) -> list[Proposal]:
    """Deliver the goal statement to a member session that has never had it.

    The lowest-risk action available and the one the whole feature turns on: today
    no goal string reaches any session at all, so the operator's intent is written
    down where nothing reads it. Ephemeral context, no turn, no WS event.
    """
    if not goal.statement.strip():
        return []
    out: list[Proposal] = []
    for slot_key in members:
        stamp = _num(tc.runtime.delivered.get(f"{goal.id}|{slot_key}"))
        if stamp:
            continue
        facts = tc.observation.slots.get(slot_key) if tc.observation else None
        if facts is None:
            continue
        out.append(
            Proposal(
                action_class="context_inject",
                goal_id=goal.id,
                target_slot=slot_key,
                reasons=[
                    f"goal {goal.id!r} has a statement this session has never been given",
                    _member_reason(tc, goal, slot_key),
                    "ephemeral context: no turn is dispatched and no WS event fires",
                ],
                params={"kind": "goal_statement", "content": _statement_body(goal)},
            )
        )
    return out


def _statement_body(goal: Goal) -> str:
    """The deterministic fallback body. A model may improve the wording at step 10.

    Written here rather than left to :func:`compose` so that a gateway with no
    model path still delivers the operator's own words verbatim. The fallback is
    the operator's text; the model only ever gets to reshape it.
    """
    lines = [f"Goal: {goal.title}", goal.statement.strip()]
    if goal.done_when:
        kinds = ", ".join(sorted({str(d.get("kind")) for d in goal.done_when}))
        lines.append(f"This is finished when: {kinds}.")
    recent = [str(g.get("text") or "") for g in goal.guidance[-2:] if g.get("text")]
    if recent:
        lines.append("Latest steer: " + " ".join(recent))
    return "\n".join(line for line in lines if line)[: act.MAX_CONTEXT_CHARS]


def _propose_stalls(tc: TickContext, goal: Goal, members: list[str]) -> list[Proposal]:
    """One continuation, or an escalation. Never a second nudge for one signature."""
    out: list[Proposal] = []
    for finding in tc.stalls:
        if finding.key not in members or finding.key in tc.snoozed:
            continue
        signature = _stall_signature(finding)
        seen = _occurrences(tc, signature)
        classification = tc.classifications.get(finding.key) or dict(judge.UNCLEAR)
        kind = str(classification.get("kind") or "unclear")
        wants = str(classification.get("what_it_wants") or "")[:200]
        silence = detect.describe_silence(finding.silent_secs)
        base = [
            f"{finding.label} is marked running with no activity for {silence}",
            _member_reason(tc, goal, finding.key),
            f"classified {kind}" + (f": {wants}" if wants else ""),
        ]

        if seen >= 1:
            out.append(
                Proposal(
                    action_class="escalate",
                    goal_id=goal.id,
                    target_slot=finding.key,
                    reasons=base
                    + [
                        f"this is occurrence {seen + 1} of signature {signature}",
                        "the rule is one send per signature and escalate on the second, "
                        "so this is not nudged again",
                    ],
                    params={
                        "kind": "repeat_stall",
                        "failure_signature": signature,
                        "title": f"{finding.label} is stuck the same way again",
                    },
                )
            )
            continue

        if kind in judge.AUTONOMOUS_KINDS:
            out.append(
                Proposal(
                    action_class="session_continue",
                    goal_id=goal.id,
                    target_slot=finding.key,
                    reasons=base
                    + [
                        "the blocker is a fact, and only a fact may unlock an "
                        "autonomous continuation",
                        f"first occurrence of signature {signature}",
                    ],
                    params={
                        "kind": "continuation",
                        "failure_signature": signature,
                        "message": "",
                    },
                )
            )
        else:
            out.append(
                Proposal(
                    action_class="escalate",
                    goal_id=goal.id,
                    target_slot=finding.key,
                    reasons=base
                    + [
                        f"{kind} is a question about what you actually want, which no "
                        f"amount of engineering resolves",
                        "approvals and question cards are hard-denied and are never "
                        "routed around",
                    ],
                    params={
                        "kind": "blocked_needs_you",
                        "failure_signature": signature,
                        "title": f"{finding.label} needs you ({kind})",
                    },
                )
            )
    return out


def _propose_loops(tc: TickContext, goal: Goal, members: list[str]) -> list[Proposal]:
    """An error loop escalates with its evidence. It is never nudged.

    A session repeating one failure is busy, so it reads healthy from outside and
    no stall lane will ever see it. Nudging it would add a turn to a session
    already proving that turns are not the problem.
    """
    out: list[Proposal] = []
    for finding in tc.loops:
        if finding.key not in members or finding.key in tc.snoozed:
            continue
        signature = _loop_signature(finding)
        out.append(
            Proposal(
                action_class="escalate",
                goal_id=goal.id,
                target_slot=finding.key,
                reasons=[
                    f"{finding.label} has failed {finding.tool} the same way "
                    f"{finding.repeats} times in a row",
                    _member_reason(tc, goal, finding.key),
                    "a repeated identical failure is evidence that another turn will "
                    "not help, so this escalates instead of nudging",
                ],
                params={
                    "kind": "error_loop",
                    "failure_signature": signature,
                    "title": f"{finding.label} is repeating a {finding.tool} failure",
                },
            )
        )
    return out


def _propose_goal_attention(tc: TickContext, goal: Goal, why: str) -> list[Proposal]:
    """Escalate a goal that has stopped moving, once per window, with the reason.

    A goal that went ``blocked`` or ``awaiting_confirmation`` and told nobody is
    the worst outcome available: the operator believes work is happening. Draft
    goals are the exception — an undeclared ``done_when`` is a teachable state the
    UI already renders, and ringing a bell about it every hour would train the
    operator to ignore the bell.
    """
    if goal.status == goals_mod.GoalStatus.DRAFT.value:
        return []
    if goal.status in goals_mod.TERMINAL_STATUSES:
        return []
    if goal.status == goals_mod.GoalStatus.HOLDING.value:
        return []
    third = (
        f"terminal_reason: {goal.terminal_reason}"
        if goal.terminal_reason
        else "no work is being dispatched for it"
    )
    return [
        Proposal(
            action_class="escalate",
            goal_id=goal.id,
            reasons=[f"goal {goal.title!r} is {goal.status}", why, third],
            params={
                "kind": f"goal_{goal.status}",
                "title": f"{goal.title}: {goal.status}",
            },
        )
    ]


def _propose_digest(tc: TickContext, goal: Goal, members: list[str]) -> list[Proposal]:
    """One digest per goal per hour, into the Conductor's own slot.

    ``narrate`` writes context, not a turn — so the Conductor chat stays the
    explanation surface and gains no authority. A goal with no members and nothing
    to say produces no digest: a trivial retro is worse than none.
    """
    if not members and not tc.evaluations.get(goal.id, {}).get("done_when"):
        return []
    last = _num(tc.runtime.digests.get(goal.id))
    if last and (tc.now - last) < DIGEST_SECS:
        return []
    summary = tc.evaluations.get(goal.id, {})
    rows = summary.get("done_when") or []
    open_rows = [r for r in rows if not r.get("satisfied")]
    return [
        Proposal(
            action_class="narrate",
            goal_id=goal.id,
            target_slot=act.CONDUCTOR_SLOT,
            reasons=[
                f"digest for {goal.title!r}: {len(members)} member session(s)",
                f"{len(rows) - len(open_rows)} of {len(rows)} done_when predicates satisfied",
                f"status {goal.status}"
                + (f" ({goal.terminal_reason})" if goal.terminal_reason else ""),
            ],
            params={
                "kind": "digest",
                "content": _digest_body(goal, members, open_rows),
            },
        )
    ]


def _digest_body(goal: Goal, members: list[str], open_rows: list[dict[str, Any]]) -> str:
    lines = [f"Goal {goal.title!r} ({goal.id}) is {goal.status}."]
    if members:
        lines.append("Sessions: " + ", ".join(members[:8]))
    for row in open_rows[:6]:
        lines.append(f"- not yet: {row.get('kind')} — {row.get('detail')}")
    if goal.terminal_reason:
        lines.append(f"Reason it stopped: {goal.terminal_reason}")
    return "\n".join(lines)[: act.MAX_CONTEXT_CHARS]


# ── step 9: gate — the chokepoint lives in gate.py ───────────────────────────


async def gate(tc: TickContext) -> dict[str, Any]:
    """Ask :func:`gate.gate` about every proposal, then record every answer.

    **The decision itself is not made here.** ``backend/conductor/gate.py`` is the
    chokepoint — one function, no side effects, the only thing that stamps
    ``Verdict.ACT`` — and this step is its caller. An earlier version of this file
    implemented the checks inline because ``gate.py`` did not exist yet; two
    implementations of ``min(mode, goal, marker)`` is the precise failure the
    authority model is built to prevent, so the inline copy is gone.

    What remains here is what a *step* owes and a side-effect-free gate must not
    do:

    * **the veto list.** ``gate.py`` has no notion of one, and a veto is an
      operator instruction the steer step recorded, so it is applied on the way in.
    * **the ledger pair.** I3: the intent row must be durable BEFORE the effect,
      and ``strict=True`` is what turns that from a belief into a refusal — a row
      that could not be persisted comes back ``""`` and the action does not happen.
    * **the dry-run downgrade.** ``gate.py`` decides from mode and data; ``dry_run``
      is a property of the TICK, not of the proposal, so it cannot be gate.py's
      business. Downgrading ACT→PROPOSE is only ever restrictive, which is why it
      is safe to do outside the chokepoint — and it is *necessary*, because an ACT
      intent row that is never executed hands the next restart a crash window that
      never happened.

    Every decision is recorded, in every mode, including refusals and including on
    a dry run: in ``advisory`` the ledger IS the product and it is the artifact the
    operator promotes the mode from. Note the inversion of batty's own bug — its
    ``record_orchestrator_action`` returns early when the orchestrator is disabled
    (``telemetry.rs:945-947``, with a test asserting the no-op), making the
    low-trust modes the least observable ones. Backwards.

    Where a ``Verdict.ESCALATE`` surfaces, since nothing executes one: its row is
    in the ledger and in ``GET /conductor/state``, and the *bell* is a separate
    ``escalate``-class proposal that :func:`_propose_stalls` and
    :func:`_propose_goal_attention` produce. A gate that could notify would be a
    gate with a side effect.
    """
    if not tc.proposals:
        return {"decisions": 0}

    counts: dict[str, int] = {}
    vetoed = 0
    for proposal in tc.proposals:
        decision = await _gate_one(tc, proposal)
        acting = decision.verdict is Verdict.ACT
        action_id = await ledger.record_intent_async(decision, strict=acting)
        if acting and not action_id:
            decision = _refuse(
                proposal,
                decision.tier,
                "audit-or-deny: the intent row could not be persisted, so the action "
                "is refused rather than taken unrecorded",
            )
            logger.error(
                "conductor: refusing %s on %s — intent row not durable",
                proposal.action_class,
                proposal.goal_id,
            )
        if "vetoed" in decision.reason:
            vetoed += 1
        tc.decisions.append(decision)
        counts[decision.verdict.value] = counts.get(decision.verdict.value, 0) + 1

    return {"decisions": len(tc.decisions), "by_verdict": counts, "vetoed": vetoed}


async def _gate_one(tc: TickContext, proposal: Proposal) -> Decision:
    """One proposal through the real gate, plus the two things it cannot know."""
    if _num(tc.runtime.vetoed.get(proposal.signature)) > tc.now:
        remaining = int(_num(tc.runtime.vetoed.get(proposal.signature)) - tc.now)
        return _refuse(
            proposal,
            Tier.OFF,
            f"signature {proposal.signature} was vetoed by you; suppressed for "
            f"another {remaining}s",
        )

    if proposal.action_class in ("escalate", "operator_notify"):
        # The cross-signature half of the flood guard, which ``gate.py`` does not
        # implement: its dedup keys on the proposal signature, so two DIFFERENT
        # notices about one target both pass. The plan asks for one escalation per
        # goal+target per window, and the scarce resource being protected is the
        # operator's attention — an honest escalating system's failure mode is a
        # spammed operator who then rubber-stamps.
        key = _escalation_key(proposal)
        remaining = tc.runtime.suppressed(key, tc.now)
        if remaining > 0:
            tc.runtime.record_suppression(key, tc.now)
            return _refuse(
                proposal,
                Tier.ACT,
                f"escalation flood guard: {key} is suppressed for another "
                f"{int(remaining)}s (the sighting is recorded, not dropped)",
            )

    decision = await gate_mod.gate(
        proposal,
        mode=tc.mode,
        goal=tc.goal(proposal.goal_id),
        obs=tc.observation,
        budget=tc.budget,
        cooldowns=tc.cooldowns if tc.cooldowns is not None else _fallback_cooldowns(tc),
    )

    if decision.verdict is Verdict.ACT and tc.dry_run:
        return Decision(
            proposal=proposal,
            verdict=Verdict.PROPOSE,
            tier=decision.tier,
            reason=f"dry_run: would act — {decision.reason}",
        )
    return decision


def _fallback_cooldowns(tc: TickContext) -> gate_mod.Cooldowns:
    """A non-persisting Cooldowns for a context nobody supplied one to.

    Only a test or a bare ``steps.gate(TickContext(...))`` call reaches this; the
    driver always supplies its own loaded instance. ``persist=False`` on purpose:
    an accidental second store would answer "have I already sent this" from an
    empty index, which is the one wrong answer that produces duplicate sends.
    """
    if tc.cooldowns is None:
        tc.cooldowns = gate_mod.Cooldowns(persist=False)
    return tc.cooldowns


def _refuse(proposal: Proposal, tier: Tier, reason: str) -> Decision:
    return Decision(proposal=proposal, verdict=Verdict.REFUSE, tier=tier, reason=reason)



# ── step 10: compose ─────────────────────────────────────────────────────────


async def compose(tc: TickContext) -> dict[str, Any]:
    """[LLM] The wording of an already-approved send. Never the decision to send.

    Runs after the gate, which is safe precisely because
    ``Proposal.compute_signature`` excludes message bodies: composing cannot move
    a proposal's identity, so it cannot escape the dedup that already cleared it.

    ``""`` from :func:`judge.compose_message` means **do not send** — never "send
    an empty body". A proposal whose body cannot be composed and has no
    deterministic fallback is withdrawn, and because the gate has already written
    its ``intent`` row, the withdrawal writes the matching outcome. Leaving that
    row open would hand the next restart a crash window that never happened.
    """
    if not tc.decisions:
        return {"composed": 0}

    brk = breaker.get("llm_compose")
    allowed, why = brk.allow()
    model_ok = allowed and judge.available(sessions=getattr(tc.state, "sessions", None))
    composed = fallback = withdrawn = 0
    kept: list[Decision] = []

    for decision in tc.decisions:
        proposal = decision.proposal
        cls = proposal.action_class
        if cls not in COMPOSED_CLASSES or decision.verdict not in (
            Verdict.ACT,
            Verdict.PROPOSE,
        ):
            kept.append(decision)
            continue

        param = _BODY_PARAM[cls]
        existing = str(proposal.params.get(param) or "").strip()
        # PROPOSE is composed too: in `assisted` mode the operator is shown a card
        # and clicks, and a card with no wording is not reviewable. REFUSE and
        # ESCALATE are skipped — nothing is sent for either, so a model call would
        # be spent on text nobody reads.
        text = ""
        if model_ok:
            goal = tc.goal(proposal.goal_id)
            try:
                text = await judge.compose_message(
                    _message_kind(proposal),
                    goal_statement=goal.statement if goal else "",
                    slot_facts=_facts_json(tc, proposal.target_slot),
                    reasons=list(proposal.reasons),
                    guidance=goal.guidance if goal else None,
                    sessions=getattr(tc.state, "sessions", None),
                )
            except asyncio.CancelledError:
                raise
            except Exception as exc:
                brk.record_error(exc)
                logger.debug("conductor: composition failed for %s", cls, exc_info=True)
            else:
                brk.record_ok()
        if text:
            proposal.params[param] = text
            composed += 1
        elif existing:
            fallback += 1
        elif _fallback_body(proposal):
            proposal.params[param] = _fallback_body(proposal)
            fallback += 1
        else:
            withdrawn += 1
            reason = (
                "withdrawn at compose: no message could be composed and there is no "
                "deterministic fallback, so nothing is sent"
            )
            logger.info("conductor: %s (%s)", reason, cls)
            if decision.verdict is Verdict.ACT:
                await ledger.record_outcome_async(
                    proposal.action_id, outcome=ledger.OUTCOME_DENIED, detail=reason
                )
            continue

        if cls in ("escalate", "operator_notify") and not proposal.params.get("title"):
            # A notification with no title is dropped by the bus; the reason list's
            # first clause is the most specific machine-derived sentence we have.
            proposal.params["title"] = (proposal.reasons or ["Conductor"])[0][:120]
        kept.append(decision)

    tc.decisions = kept
    return {
        "composed": composed,
        "fallback": fallback,
        "withdrawn": withdrawn,
        "breaker": "" if allowed else why,
    }


def _fallback_body(proposal: Proposal) -> str:
    """A body for a class that can be sent without a composed one, or ``""``.

    The split is by what the class *needs*, and it is the reason the withdrawal
    above is safe to be strict:

    * an operator-facing notice needs a TITLE (``act._push_notice`` requires only
      that); its body may be the machine-derived reason list, which is a better
      body than a model's paraphrase of the same clauses and is available on a
      gateway with no model at all;
    * ``session_continue`` needs a MESSAGE and gets no fallback, deliberately.
      Dispatching a real turn with a body the driver invented — "please continue"
      — is the "nudge everything and hope" behaviour every operator turns off
      within a day. No composed message, no turn.
    """
    if proposal.action_class in ("escalate", "operator_notify"):
        return "\n".join(f"- {clause}" for clause in proposal.reasons[:8])[: act.MAX_BODY_CHARS]
    return ""


def _message_kind(proposal: Proposal) -> str:
    """Map an action class onto one of ``judge.MESSAGE_KINDS``."""
    cls = proposal.action_class
    if cls == "session_continue":
        return "continuation"
    if cls == "narrate":
        return "digest"
    if cls in ("escalate", "operator_notify"):
        return "why"
    return "context"


def _facts_json(tc: TickContext, slot_key: str) -> dict[str, Any] | None:
    if not slot_key or tc.observation is None:
        return None
    facts = tc.observation.slots.get(slot_key)
    return facts.to_json() if facts is not None else None


# ── step 11: execute ─────────────────────────────────────────────────────────


async def execute(tc: TickContext) -> dict[str, Any]:
    """One host call per ACT decision, then its outcome row and its budget charge.

    The pairing is the contract :mod:`act` does not implement and this step owes
    it: ``act.execute`` writes ``acted.json`` and one SEL row, and deliberately
    does not touch the ledger (it takes a ``Decision``, which belongs to whoever
    made one) or the budget (whose instance the driver owns). So the sequence
    here is intent-already-durable → execute → outcome → consume → re-check.

    The post-action re-check exists because budgets gate when turns *start* and a
    slow turn overshoots (``autonudge.py:1267``). Exhaustion after the fact still
    has to be visible, or the next tick starts one more.
    """
    acting = [d for d in tc.decisions if d.verdict is Verdict.ACT]
    if tc.dry_run:
        # Belt and braces. _gate_one already downgrades every ACT on a dry run, so
        # reaching here with one means the gate is broken and the right response is
        # a loud refusal rather than a side effect.
        if acting:
            logger.error(
                "conductor: BUG — %d ACT decisions on a dry run; nothing executed", len(acting)
            )
        return {"executed": 0, "dry_run": True, "unexpected_act": len(acting)}
    if not acting:
        return {"executed": 0}
    if tc.state is None:
        return {"executed": 0, "reason": "no host handle: nothing can be executed"}

    brk = breaker.get("session_dispatch")
    ok_count = failed = 0
    for decision in acting:
        proposal = decision.proposal
        allowed, why = brk.allow()
        if not allowed and proposal.action_class in TURN_CLASSES:
            await ledger.record_outcome_async(
                proposal.action_id, outcome=ledger.OUTCOME_DENIED, detail=f"breaker: {why}"
            )
            continue
        try:
            result = await act.execute(decision, state=tc.state, ctx=tc.ctx)
        except asyncio.CancelledError:
            # act.execute already stamped its claim `unknown` and re-raised. The
            # ledger row stays open on purpose: unknown means reconcile, and the
            # next tick's reconcile step is what closes it by observation.
            raise
        except Exception as exc:
            brk.record_error(exc)
            failed += 1
            logger.exception("conductor: act.execute raised for %s", proposal.action_class)
            await ledger.record_outcome_async(
                proposal.action_id,
                outcome=ledger.OUTCOME_FAILURE,
                detail=f"act.execute raised: {exc!r}",
            )
            continue

        outcome, detail = _translate_outcome(result)
        await ledger.record_outcome_async(
            proposal.action_id, outcome=outcome, detail=detail
        )
        tc.results.append(result)
        if outcome == ledger.OUTCOME_SUCCESS:
            ok_count += 1
            brk.record_ok()
            await _charge(tc, proposal)
        else:
            failed += 1
            if not result.get("replayed") and not result.get("refused"):
                brk.record_error(detail)

    return {"executed": len(acting), "ok": ok_count, "failed": failed}


def _translate_outcome(result: dict[str, Any]) -> tuple[str, str]:
    """``act.execute``'s vocabulary → the ledger's three terminal words.

    The two vocabularies are deliberately different and the translation lives
    here, once. ``act`` answers "what happened to this call" (``ok`` /
    ``refused`` / ``replayed`` / ``unknown_effect``); the ledger answers BSC4's
    "success or failure indication", which has exactly three values. A refusal is
    ``denied`` rather than ``failure`` because nothing broke — a precondition
    said no, and conflating the two would make every "the slot was running" read
    as an error in the audit trail.
    """
    detail = str(result.get("detail") or result.get("refused") or "")
    if result.get("ok"):
        return ledger.OUTCOME_SUCCESS, detail
    if result.get("replayed"):
        return (
            ledger.OUTCOME_DENIED,
            f"duplicate: {detail} (prior outcome {result.get('prior_outcome')})",
        )
    if result.get("refused"):
        return ledger.OUTCOME_DENIED, str(result.get("refused"))
    if result.get("unknown_effect"):
        return ledger.OUTCOME_FAILURE, f"unknown effect: {detail}"
    return ledger.OUTCOME_FAILURE, detail or "no detail reported"


def _escalation_key(proposal: Proposal) -> str:
    """The flood guard's suppression key: goal + target + notice kind.

    One function because it is read in :func:`_propose_stalls` and written in
    :func:`_charge`, and two copies of a suppression key that drift apart do not
    fail loudly — they just stop suppressing, which is an operator getting six
    bells a minute at 3am.
    """
    target = proposal.target_slot or str(proposal.params.get("kind") or "")
    return f"escalate:{proposal.goal_id}:{target}"


async def _charge(tc: TickContext, proposal: Proposal) -> None:
    """Spend the budget, stamp the signature, and mark the goal as having acted."""
    cls = proposal.action_class
    if tc.budget is not None:
        await tc.budget.consume_async(cls, proposal.goal_id)
        ok, why = await tc.budget.post_action_check_async(cls, proposal.goal_id)
        if not ok:
            tc.note(f"budget exhausted after acting: {why}")
    # ``mark_proposal`` marks BOTH the proposal signature and the finding's
    # ``failure_signature``, in one call so a caller cannot remember one and forget
    # the other. Forgetting the failure key is the interesting half: the proposal
    # signature suppresses the identical proposal, but only the failure COUNT makes
    # the second occurrence of the same stall escalate instead of nudging again.
    # This runs AFTER the effect landed, never in the gate — a cooldown stamped by
    # the gate would suppress a signature for half an hour on an action the
    # executor then refused, which is silent paralysis rather than safety.
    if tc.cooldowns is not None:
        tc.cooldowns.mark_proposal(proposal)
    if cls in ("escalate", "operator_notify"):
        tc.runtime.stamp(_escalation_key(proposal), tc.now, ESCALATE_SUPPRESS_SECS)
    if cls in TURN_CLASSES:
        tc.runtime.bump(f"turns:{proposal.goal_id}")
    if cls == "narrate":
        tc.runtime.digests[proposal.goal_id] = tc.now
    if cls == "context_inject" and proposal.params.get("kind") == "goal_statement":
        tc.runtime.delivered[f"{proposal.goal_id}|{proposal.target_slot}"] = tc.now
    # The non-progress counter only counts ticks during which the driver acted;
    # a goal nobody touched has not failed to progress, it has been left alone.
    entry = tc.runtime.progress.setdefault(proposal.goal_id, {})
    entry["acted"] = True
    tc.runtime.touch()


# ── step 12: prs ─────────────────────────────────────────────────────────────


async def prs(tc: TickContext) -> dict[str, Any]:
    """**A documented no-op in v1.** PR refresh is Increment 7 and is blocked on OQ4.

    This step exists as a named seam rather than as a hole in the step list, and
    it does exactly one thing: reports what a refresh *would* cover, from the
    source links already in the observation. No provider call, no ``gh``, no
    network.

    The reason it cannot do more yet is not scheduling, it is unresolved:
    ``refresh_slot_source_status`` early-returns when ``_owner_ws_clients`` is
    empty, which means the browser may be structurally required for CI status to
    move — and the whole point of this feature is that no browser is open. Until
    that question is settled, a refresh implemented here would silently report
    stale data as fresh, which is worse than reporting nothing. Note also that
    ``backend/prchecks.py`` is NOT the fallback: the plan deletes it (an
    unhardened ``gh`` from ambient PATH), and extending it is named as the single
    worst available implementation path.
    """
    urls = sorted(tc.facts.get("prs", {}))
    if urls:
        tc.note(f"{len(urls)} PR URL(s) known from source links; refresh is Increment 7 (OQ4)")
    return {"known_urls": len(urls), "refreshed": 0, "blocked_on": "OQ4"}


# ── step 13: report ──────────────────────────────────────────────────────────


async def report(tc: TickContext) -> dict[str, Any]:
    """Persist everything this tick learned, and hand the operator the notices.

    Last on purpose: it is the only step that must run after a partial tick, and
    the only one whose failure loses information rather than merely skipping work.

    ``breaker.pending_notices()`` is **draining** and is called exactly once here.
    Calling it twice per tick would lose a trip notice; calling it nowhere would
    lose every one of them.
    """
    notices = breaker.pending_notices()
    for notice in notices:
        logger.warning("conductor: %s", notice)
        tc.note(notice)

    # A dry run is durable in exactly one place: the ledger rows the gate wrote.
    # It works on copied goals and a copied runtime (see loop._tick_locked), so
    # skipping these two writes is what makes a preview a preview — otherwise
    # asking "what would you do" would move a goal's status and retire a signature.
    saved = 0
    if not tc.dry_run:
        for goal_id in sorted(tc.goal_touched):
            goal = tc.goal(goal_id)
            if goal is None:
                continue
            goal.updated_ts = tc.now
            try:
                await goals_mod.save_goal_async(goal)
                saved += 1
            except Exception:
                logger.exception("conductor: could not persist goal %s", goal_id)

    tc.runtime.prune(tc.now)
    if tc.runtime.dirty and not tc.dry_run:
        await save_runtime_async(tc.runtime)
        tc.runtime.dirty = False

    stats = {
        "last_tick_ts": tc.now,
        "goals": len(tc.goals),
        "proposals": len(tc.proposals),
        "decisions": len(tc.decisions),
        "executed": len(tc.results),
        "stalls": len(tc.stalls),
        "error_loops": len(tc.loops),
        "dry_run": tc.dry_run,
        "halted": tc.halted,
    }
    await control_mod.heartbeat_async(tick_ts=tc.now, stats=stats)

    return {
        "goals_saved": saved,
        "breaker_notices": notices,
        "notes": list(tc.notes),
        "stats": stats,
    }


# ── the step table ───────────────────────────────────────────────────────────

CRITICAL = "critical"
"""Log and continue, never counted. Steps 0-4 and 7: the loop is useless without
them, but a transient failure in one is not evidence of a broken subsystem."""

RECOVERABLE = "recoverable"
"""Consecutive-failure counter, WARN at ≥3. Steps 8-11: a repeated failure here
means the driver is deciding or acting wrongly, which the operator must hear about
before it has been happening all night."""

OPTIONAL = "optional"
"""Circuit breaker. A wedged provider or a rate-limited model must degrade ONE
capability, not stop autonomy and not spin.

Two documented divergences from the plan's grouping, both in this file's table:
**step 5 (detect) is CRITICAL** — the plan's three lists cover steps 0-4, 6-13 and
simply omit it, and it is pure functions over an observation the loop cannot work
without; and **step 13 (report) is CRITICAL** rather than optional, for the reason
written at its table entry."""


@dataclass(frozen=True)
class Step:
    """One entry in the tick's running order."""

    name: str
    run: Callable[[TickContext], Any]
    isolation: str
    timeout: float
    deliberate_only: bool = False
    """Skipped on an observe-only tick. The 15s cadence does in-memory reads and
    nothing else; everything expensive is behind the 60s one."""


#: The running order. :mod:`loop` iterates this and nothing else, so the plan's
#: step list and the code's are the same list.
STEPS: tuple[Step, ...] = (
    Step("guard", guard, CRITICAL, 5.0),
    Step("reconcile", reconcile, CRITICAL, 20.0),
    Step("operator", operator, CRITICAL, 5.0),
    Step("steer", steer, CRITICAL, 10.0),
    Step("observe", observe, CRITICAL, 10.0),
    # `detect` is CRITICAL. The plan's three isolation lists cover steps 0-4 and
    # 6-13 and simply omit step 5, so this is a gap-fill rather than a divergence:
    # it runs pure functions over an in-memory observation, it can only fail on a
    # malformed payload, and a breaker that disabled it would stop the operator's
    # board from showing stalls at all. Log-and-continue retries next tick.
    Step("detect", detect_step, CRITICAL, 10.0),
    Step("classify", classify, OPTIONAL, 60.0, deliberate_only=True),
    Step("evaluate", evaluate, CRITICAL, 30.0, deliberate_only=True),
    Step("propose", propose, RECOVERABLE, 10.0, deliberate_only=True),
    Step("gate", gate, RECOVERABLE, 20.0, deliberate_only=True),
    Step("compose", compose, RECOVERABLE, 60.0, deliberate_only=True),
    Step("execute", execute, RECOVERABLE, 90.0, deliberate_only=True),
    Step("prs", prs, OPTIONAL, 10.0, deliberate_only=True),
    # `report` is CRITICAL, diverging from the plan's optional grouping (step 13).
    # An optional step whose breaker opens is SKIPPED — and skipping report means no
    # runtime persistence and, worse, no heartbeat. A stale heartbeat is precisely
    # what tells a SECOND conductor it may take over the fleet, so a breaker here
    # could hand the fleet to a second driver. Log-and-continue retries every tick,
    # which is what a persistence step wants. The optional-subsystem concern the
    # plan raises for this step (the notification bus) is served where the bus is
    # actually called: the execute step, behind `session_dispatch`, and act.py's own
    # refusal when the bus is absent.
    Step("report", report, CRITICAL, 20.0),
)

STEP_NAMES: tuple[str, ...] = tuple(step.name for step in STEPS)
