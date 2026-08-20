"""Offline tests for the Conductor's authority, dedup and durability rules.

Run with: python3 backend/conductor_selftest.py

No gateway, no network, no wall clock where it can be avoided. Three properties
make that possible and they are the same three the modules were designed for:
``policy.effective`` is a pure function of (class, mode, goal, marker files),
``gate.gate`` reads state and mutates none, and every durable path goes through
``store``, whose directory is one function this file replaces.

**What is under test is the refusal, not the effect.** The interesting assertions
here are all negative — a hard-denied class has no executor, a goal cannot raise
its own authority, a second identical failure escalates instead of nudging again.
That asymmetry is deliberate: the effects need a gateway to be worth testing, and
the refusals must hold on a laptop with no gateway at all, because they are the
part that cannot be allowed to regress quietly.

Two conventions are borrowed from ``selftest.py``; the third is this file's own:

* ``check(name, condition, detail)`` prints ``ok``/``FAIL`` and never raises, so
  one broken invariant does not hide the twenty after it.
* time is pinned (``NOW``) wherever a module accepts an injectable clock.
* every conductor data path is redirected into a temp directory **before the
  first module that could write one is imported**, so a run of this file cannot
  create ``data/conductor`` in the repo or, worse, read the operator's real
  goals. See :func:`_redirect_state`.
"""

from __future__ import annotations

import asyncio
import atexit
import contextlib
import json
import logging
import os
import shutil
import sys
import tempfile
import time
from pathlib import Path
from typing import Any, Iterator

# Several assertions below deliberately drive a module down its loud path — a
# forged ACT on a hard-denied class logs at ERROR, an unreadable budget logs a
# traceback — because being loud is the behaviour under test. Left unconfigured,
# ``logging.lastResort`` interleaves all of it with the ok/FAIL lines and the run
# reads as though it were failing. Silenced by default with an escape hatch,
# rather than by ``logging.disable``, so a genuinely puzzling failure is one env
# var away from its log lines.
logging.basicConfig(
    level=logging.DEBUG if os.environ.get("CONDUCTOR_SELFTEST_LOG") else logging.CRITICAL + 1,
    format="  log  %(levelname)s %(name)s: %(message)s",
)

# `python3 backend/conductor_selftest.py` puts `backend/` on sys.path, which is
# what makes `import conductor.x` resolve; an invocation from anywhere else (a
# harness, an IDE) would not, so it is added rather than assumed.
_HERE = Path(__file__).resolve().parent
if str(_HERE) not in sys.path:
    sys.path.insert(0, str(_HERE))

from conductor import store  # noqa: E402


# ── the temp state directory ─────────────────────────────────────────────────

_TMP = Path(tempfile.mkdtemp(prefix="conductor-selftest-"))


def _redirect_state() -> None:
    """Point every conductor data path at a temp dir, for this process only.

    ``store.conductor_dir`` is replaced rather than an environment variable being
    set, because there is no env hook in ``store.py`` and adding one would mean
    editing a fixed-contract module to make a test convenient. Replacing the
    function is sufficient and provably total: every other module reaches the
    directory through ``store.conductor_dir()`` or ``store.goals_dir()`` — both
    call it by module-global name — and both ``Budget.path`` and
    ``Cooldowns.path`` resolve late, in a property, for exactly this reason
    (budget.py:180).

    Verified with ``grep -n 'conductor_dir\\|goals_dir' backend/conductor/*.py``:
    twelve ``store.conductor_dir()`` call sites (act, breaker, budget, control ×3,
    gate, ledger ×2, routes, steps ×2) plus ``goals.goals_dir``, which delegates
    to ``store.goals_dir``. There is no ``from .store import conductor_dir``
    anywhere, and neither this file nor ``conductor/__init__.py`` creates one.
    """
    store.conductor_dir = lambda: _TMP / "conductor"  # type: ignore[assignment]


_redirect_state()
atexit.register(lambda: shutil.rmtree(_TMP, ignore_errors=True))

from conductor import act, budget as budget_mod, gate, goals, intents  # noqa: E402
from conductor import loop as loop_mod, policy, steps  # noqa: E402
from conductor.intents import Decision, Proposal, Tier, Verdict  # noqa: E402
from conductor.policy import HALT_MARKER, Mode  # noqa: E402


NOW = 1_800_000_000.0
FAILURES: list[str] = []
ASSERTIONS = 0


def check(name: str, condition: bool, detail: str = "") -> None:
    global ASSERTIONS
    ASSERTIONS += 1
    if condition:
        print(f"  ok   {name}")
    else:
        print(f"  FAIL {name}{(' -- ' + detail) if detail else ''}")
        FAILURES.append(name)


# ── one event loop for the whole run ─────────────────────────────────────────

_LOOP = asyncio.new_event_loop()
asyncio.set_event_loop(_LOOP)


def aio(coro: Any) -> Any:
    """Drive one coroutine on the run's single loop.

    One loop rather than an ``asyncio.run`` per section, because two of the
    objects under test are loop-bound and outlive the call that created them:
    ``Cooldowns._persist`` schedules a write as a task on the running loop
    (gate.py:346), and ``ConductorDriver`` lazily creates its tick ``asyncio.Lock``
    on first use. Under ``asyncio.run`` the second section would touch a lock and
    a task belonging to a closed loop, and the failure reads as a mysterious
    ``RuntimeError`` rather than as the test it actually is.
    """
    return _LOOP.run_until_complete(coro)


def _drain_loop() -> None:
    """Let the cooldown/ledger write tasks finish before the loop closes."""
    pending = [t for t in asyncio.all_tasks(_LOOP) if not t.done()]
    if pending:
        with contextlib.suppress(Exception):
            _LOOP.run_until_complete(asyncio.wait(pending, timeout=5.0))


# ── fixtures ─────────────────────────────────────────────────────────────────


class FakeSlot:
    """The handful of attributes ``observe._slot_facts`` reads off a chat slot.

    Deliberately not a mock: ``observe`` reads through ``_attr``, which swallows
    every exception, so a mock that raised on an unexpected attribute would be
    silently indistinguishable from a real slot. A plain object with real values
    is the only way the assertions below mean anything.
    """

    def __init__(self, key: str, **over: Any) -> None:
        self.key = key
        self.title = over.pop("title", f"slot {key}")
        self.running = over.pop("running", False)
        self.stop_state = over.pop("stop_state", "idle")
        self.queue_depth = over.pop("queue_depth", 0)
        self.workspace = over.pop("workspace", "ws")
        self.project = over.pop("project", "")
        self.linked_session_key = over.pop("linked_session_key", "")
        self.app = over.pop("app", "")
        self.memory_mode = over.pop("memory_mode", "")
        self.last_activity_ts = over.pop("last_activity_ts", NOW - 900)
        self.messages = over.pop("messages", [])
        for name, value in over.items():
            setattr(self, name, value)


class Unresolved:
    """An approval future nobody has answered.

    ``observe._pending_approval`` reads ``slot._approval_futures`` and asks each
    value ``done()`` (VERIFIED: observe.py:630, against state.py:2689). There is
    no public ``pending_approval`` attribute to set, so a fake that set one would
    assert nothing — the observation would report ``None`` and the gate's
    always-escalate band would look untested while passing.
    """

    def done(self) -> bool:
        return False


def question(*, blocking: bool = True) -> dict[str, dict[str, Any]]:
    """A ``_question_pending`` map in the platform's shape (observe.py:788)."""
    return {"q1": {"ts": NOW, "blocking": blocking}}


class FakeState:
    """The one attribute ``observe.observe`` needs (VERIFIED: observe.py:1031)."""

    def __init__(self, *slots: FakeSlot) -> None:
        self._slots = {slot.key: slot for slot in slots}


def observation(*slots: FakeSlot) -> Any:
    from conductor import observe as observe_mod

    return observe_mod.observe(FakeState(*slots), now=NOW)


def a_goal(**over: Any) -> goals.Goal:
    """An active, dispatchable goal that grants ``session_continue`` on ``s1``."""
    kw: dict[str, Any] = {
        "id": "g-ship",
        "status": "active",
        "authority": {
            "session_continue": "act",
            "context_inject": "act",
            "escalate": "act",
            "narrate": "act",
            # Granted at `propose` rather than left to the all-off floor, so the
            # "a propose tier needs no budget" case tests the budget rule and not
            # goals.DEFAULT_AUTHORITY's floor.
            "session_create": "propose",
        },
        "scope": {"adopt_slots": ["s1"], "workspace": "ws"},
        "budgets": {"wip": 2},
    }
    title = over.pop("title", "Ship the unicode parser")
    done_when = over.pop("done_when", [{"kind": "manual", "text": "confirm the release"}])
    kw.update(over)
    return goals.new_goal(
        title, "The parser must handle astral-plane codepoints.", done_when, **kw
    )


def a_proposal(cls: str = "session_continue", **over: Any) -> Proposal:
    params: dict[str, Any] = over.pop("params", {"failure_signature": "pytest|assertion"})
    return Proposal(
        action_class=cls,
        goal_id=over.pop("goal_id", "g-ship"),
        reasons=over.pop("reasons", ["silent for 15m", "last turn ended in a traceback"]),
        target_slot=over.pop("target_slot", "s1"),
        params=params,
        **over,
    )


def _serial() -> Iterator[int]:
    """A fresh integer per fixture, so every budget and every cooldown index gets
    its own file. Sharing one would make the assertions order-dependent: the
    ``budget exhaustion`` section spends an allowance the ``dedup`` section three
    hundred lines earlier would then be short of, and the failure would look like
    a dedup bug."""
    n = 0
    while True:
        n += 1
        yield n


_SERIAL = _serial()


def a_budget(**caps: int) -> budget_mod.Budget:
    """A budget with an explicit, non-empty cap map.

    ``daily_caps={}`` is not "no caps" — ``Budget.__init__`` does
    ``dict(daily_caps or DEFAULT_DAILY_CAPS)`` (budget.py:167), so an empty dict
    falls back to the defaults. Every caller here passes real numbers.
    """
    table = caps or {"session_continue": 4, "context_inject": 8, "escalate": 4, "narrate": 4}
    return budget_mod.Budget(
        path=_TMP / f"budget-{next(_SERIAL)}.json", daily_caps=table, now=lambda: NOW
    )


def a_cooldowns(**kw: Any) -> gate.Cooldowns:
    return gate.Cooldowns(
        path=_TMP / f"cooldowns-{next(_SERIAL)}.json", now=lambda: NOW, **kw
    )


def decide(proposal: Proposal, **over: Any) -> Decision:
    """``gate.gate`` with the boring arguments defaulted."""
    kw: dict[str, Any] = {
        "mode": Mode.AUTONOMOUS,
        "goal": None,
        "obs": None,
        "budget": None,
        "cooldowns": a_cooldowns(),
    }
    kw.update(over)
    return aio(gate.gate(proposal, **kw))


# ═════════════════════════════════════════════════════════════════════════════
print()
print("the package imports with or without a gateway")

import conductor as pkg  # noqa: E402

check("conductor is importable", pkg.Tier.OFF is intents.Tier.OFF)
check(
    "every submodule is reachable through the package",
    all(getattr(pkg, name) is not None for name in sorted(pkg._LAZY_SUBMODULES)),
)
_GATEWAY_PRESENT = "kiro_crew" in sys.modules
print(f"       (gateway {'importable' if _GATEWAY_PRESENT else 'absent'} on this box)")
check(
    "importing the package does not require the gateway",
    callable(store.replace_with_retry),
    "store's guarded import of kiro_crew.atomic_write must degrade to os.replace",
)
check(
    "and no conductor module needed a gateway symbol at import time",
    all(
        name in sys.modules
        for name in (
            "conductor.act", "conductor.gate", "conductor.goals", "conductor.loop",
            "conductor.observe", "conductor.steps",
        )
    ),
    repr([n for n in sys.modules if n.startswith("conductor")]),
)
check(
    "the package does not re-export conductor_dir",
    not hasattr(pkg, "conductor_dir"),
    "a second binding would defeat the temp-dir redirect",
)
check("state is redirected into a temp dir", str(store.conductor_dir()).startswith(str(_TMP)))
check(
    "goals_dir follows conductor_dir",
    str(store.goals_dir()).startswith(str(_TMP)) and str(goals.goals_dir()).startswith(str(_TMP)),
    f"{store.goals_dir()} / {goals.goals_dir()}",
)


# ═════════════════════════════════════════════════════════════════════════════
print()
print("I2: every hard-denied class is unreachable, under every mode")

check("the hard-deny set is not empty", len(intents.DENY_HARD) >= 15, str(len(intents.DENY_HARD)))
check(
    "no hard-denied class is also in the design-time table",
    not (intents.DENY_HARD & set(intents.ACTION_CLASSES)),
    repr(sorted(intents.DENY_HARD & set(intents.ACTION_CLASSES))),
)
check(
    "spec_for refuses to describe a hard-denied class",
    all(intents.spec_for(cls) is None for cls in intents.DENY_HARD),
)

_EVERY_MODE = tuple(Mode)
check("all three modes are enumerated", len(_EVERY_MODE) == 3, repr(_EVERY_MODE))

for _cls in sorted(intents.DENY_HARD):
    _decisions = [
        decide(a_proposal(_cls, goal_id="", params={}), mode=_mode) for _mode in _EVERY_MODE
    ]
    check(
        f"gate refuses {_cls} in advisory, assisted AND autonomous",
        all(d.verdict is Verdict.REFUSE and d.tier is Tier.DENY_HARD for d in _decisions),
        repr([(d.verdict.value, d.tier.value) for d in _decisions]),
    )

for _cls in sorted(intents.DENY_HARD):
    check(
        f"{_cls} has no executor entry in act.py's dispatch table",
        _cls not in act.EXECUTORS and _cls not in act.executable_classes(),
    )

# The second of the three independent checks intents.py commits to: act.py must
# refuse a hard-denied class WITHOUT consulting the gate, so that no single bug is
# sufficient to execute one. Forging the ACT verdict by hand is the only way to
# test that — a gate-produced decision can never carry it.
_forged: dict[str, dict[str, Any]] = {
    cls: aio(
        act.execute(
            Decision(a_proposal(cls, goal_id="g-ship", params={}), Verdict.ACT,
                     Tier.ACT, "forged by the selftest"),
            state=FakeState(),
        )
    )
    for cls in sorted(intents.DENY_HARD)
}
check(
    "act.execute refuses a hard-denied class even when handed verdict=ACT",
    all(not r["ok"] and "hard-denied" in str(r.get("refused")) for r in _forged.values()),
    repr({c: r.get("refused") for c, r in _forged.items() if r["ok"]}),
)
check(
    "a forged hard-denied ACT leaves no claim behind",
    not any(
        "pr_merge" in key
        for key in (store.read_json(act.acted_path(), {}) or {}).get("acted", {})
    ),
    repr(store.read_json(act.acted_path(), {})),
)
check(
    "every executable class is a known, non-denied class",
    all(intents.spec_for(cls) is not None for cls in act.executable_classes()),
    repr(sorted(act.executable_classes())),
)
check(
    "goals.validate_authority rejects a goal that names a hard-denied class",
    goals.validate_authority({"pr_merge": "act"})[0] is False,
)


# ═════════════════════════════════════════════════════════════════════════════
print()
print("tier_min: DENY_HARD is absorbing")

check("deny_hard absorbs act", intents.tier_min(Tier.ACT, Tier.DENY_HARD) is Tier.DENY_HARD)
check("order does not matter", intents.tier_min(Tier.DENY_HARD, Tier.ACT) is Tier.DENY_HARD)
check("deny_hard absorbs off", intents.tier_min(Tier.OFF, Tier.DENY_HARD) is Tier.DENY_HARD)
check(
    "deny_hard absorbs a whole list",
    intents.tier_min(Tier.ACT, Tier.PROPOSE, Tier.DENY_HARD, Tier.ACT) is Tier.DENY_HARD,
)
check("the least of act and propose is propose",
      intents.tier_min(Tier.ACT, Tier.PROPOSE) is Tier.PROPOSE)
check("the least of propose and off is off", intents.tier_min(Tier.PROPOSE, Tier.OFF) is Tier.OFF)
check("no tiers at all is off, not act", intents.tier_min() is Tier.OFF)
check("one tier is itself", intents.tier_min(Tier.PROPOSE) is Tier.PROPOSE)


# ═════════════════════════════════════════════════════════════════════════════
print()
print("policy.effective: a goal may only ever restrict")

_raised: list[str] = []
for _cls, _spec in intents.ACTION_CLASSES.items():
    for _asked in ("act", "propose", "off"):
        _tier, _why = policy.effective(
            _cls, mode=Mode.AUTONOMOUS, goal_authority={_cls: _asked}
        )
        if intents.tier_min(_spec.default_tier, _tier) is not _tier:
            _raised.append(f"{_cls} asked {_asked} got {_tier.value} over {_spec.default_tier.value}")
check(
    "no goal request raises any class above its design-time default",
    not _raised,
    "; ".join(_raised),
)
check(
    "a goal asking for act on a propose-only class gets propose",
    policy.effective("loop_arm", mode=Mode.AUTONOMOUS,
                     goal_authority={"loop_arm": "act"})[0] is Tier.PROPOSE,
)
check(
    "a goal asking for act on an off-by-default class gets off",
    policy.effective("option_choice", mode=Mode.AUTONOMOUS,
                     goal_authority={"option_choice": "act"})[0] is Tier.OFF,
)
check(
    "a goal may narrow act down to propose",
    policy.effective("session_continue", mode=Mode.AUTONOMOUS,
                     goal_authority={"session_continue": "propose"})[0] is Tier.PROPOSE,
)
check(
    "a goal may narrow act down to off",
    policy.effective("session_continue", mode=Mode.AUTONOMOUS,
                     goal_authority={"session_continue": "off"})[0] is Tier.OFF,
)
check(
    "an absent class falls back to the class default, not to act",
    policy.effective("loop_arm", mode=Mode.AUTONOMOUS, goal_authority={})[0]
    is Tier.PROPOSE,
)
check(
    "a garbage tier string falls back to the default rather than widening",
    policy.effective("loop_arm", mode=Mode.AUTONOMOUS,
                     goal_authority={"loop_arm": "ACT!"})[0] is Tier.PROPOSE,
)
check(
    "goals.DEFAULT_AUTHORITY is an exhaustive all-off floor",
    set(goals.DEFAULT_AUTHORITY) == set(intents.ACTION_CLASSES)
    and all(
        v == "off"
        for k, v in goals.DEFAULT_AUTHORITY.items()
        if k not in {"context_inject", "operator_notify", "escalate"}
    ),
)

print()
print("policy.effective: advisory caps everything at propose")

_advisory = {
    cls: policy.effective(cls, mode=Mode.ADVISORY)[0] for cls in intents.ACTION_CLASSES
}
check(
    "nothing may act in advisory mode",
    all(t is not Tier.ACT for t in _advisory.values()),
    repr({k: v.value for k, v in _advisory.items() if v is Tier.ACT}),
)
check(
    "advisory still proposes the always-auto classes rather than turning them off",
    _advisory["context_inject"] is Tier.PROPOSE and _advisory["escalate"] is Tier.PROPOSE,
)
check(
    "assisted lets reversible internal classes act",
    policy.effective("context_inject", mode=Mode.ASSISTED)[0] is Tier.ACT
    and policy.effective("escalate", mode=Mode.ASSISTED)[0] is Tier.ACT,
)
check(
    "assisted proposes anything that dispatches a turn",
    all(
        policy.effective(cls, mode=Mode.ASSISTED)[0] is not Tier.ACT
        for cls in gate.TURN_CLASSES
    ),
    repr({c: policy.effective(c, mode=Mode.ASSISTED)[0].value for c in gate.TURN_CLASSES}),
)
check(
    "autonomous lets a turn class act when the goal grants it",
    policy.effective("session_continue", mode=Mode.AUTONOMOUS,
                     goal_authority={"session_continue": "act"})[0] is Tier.ACT,
)
check(
    "an unknown class is deny_hard, not off",
    policy.effective("teleport", mode=Mode.AUTONOMOUS)[0] is Tier.DENY_HARD,
)
check(
    "effective always returns a reason",
    all(policy.effective(c, mode=Mode.AUTONOMOUS)[1].strip() for c in intents.ACTION_CLASSES),
)

print()
print("policy.effective: markers force off")

store.marker_create(policy.marker_name("context_inject"), "selftest")
_marked, _marked_why = policy.effective("context_inject", mode=Mode.AUTONOMOUS,
                                        goal_authority={"context_inject": "act"})
check("a per-class marker forces off", _marked is Tier.OFF, _marked.value)
check("and the reason names the marker file", "no_context_inject" in _marked_why, _marked_why)
check(
    "the marker beats an autonomous mode and a granting goal",
    policy.effective("context_inject", mode=Mode.AUTONOMOUS,
                     goal_authority={"context_inject": "act"})[0] is Tier.OFF,
)
check(
    "the marker is scoped to its own class",
    policy.effective("escalate", mode=Mode.AUTONOMOUS,
                     goal_authority={"escalate": "act"})[0] is Tier.ACT,
)
check(
    "gate refuses a marked class outright",
    decide(a_proposal("context_inject", params={}), goal=a_goal(),
           obs=observation(FakeSlot("s1")), budget=a_budget()).verdict is Verdict.REFUSE,
)
store.marker_clear(policy.marker_name("context_inject"))
check(
    "clearing the marker restores the class",
    policy.effective("context_inject", mode=Mode.AUTONOMOUS,
                     goal_authority={"context_inject": "act"})[0] is Tier.ACT,
)


# ═════════════════════════════════════════════════════════════════════════════
print()
print("Proposal.compute_signature: stable identity, not a nonce")

_base = dict(action_class="session_continue", goal_id="g-ship", target_slot="s1",
             reasons=["stalled"], params={"failure_signature": "pytest|assert"})
_p1 = Proposal(**_base)
_p2 = Proposal(**_base)
check("two instances of the same proposal collide", _p1.signature == _p2.signature)
check("the signature is filled in by __post_init__", len(_p1.signature) == 32, _p1.signature)
check("action_id does not enter the signature", _p1.action_id != _p2.action_id)
check(
    "created_ts does not enter the signature",
    Proposal(**_base, created_ts=1.0).signature == Proposal(**_base, created_ts=9e9).signature,
)
check(
    "the composed message body does not enter the signature",
    Proposal(**{**_base, "params": {"failure_signature": "f|s", "message": "try X"}}).signature
    == Proposal(**{**_base, "params": {"failure_signature": "f|s", "message": "try Y"}}).signature,
)
check(
    "the reason list does not enter the signature",
    Proposal(**{**_base, "reasons": ["a", "b", "c"]}).signature == _p1.signature,
)
check(
    "predicted_paths do not enter the signature",
    Proposal(**_base, predicted_paths=["src/a.py"]).signature == _p1.signature,
)
check(
    "failure_signature DOES enter the signature",
    Proposal(**{**_base, "params": {"failure_signature": "mypy|arg-type"}}).signature
    != _p1.signature,
)
check(
    "the target slot enters the signature",
    Proposal(**{**_base, "target_slot": "s2"}).signature != _p1.signature,
)
check(
    "the action class enters the signature",
    Proposal(**{**_base, "action_class": "context_inject"}).signature != _p1.signature,
)
check(
    "the goal enters the signature",
    Proposal(**{**_base, "goal_id": "g-other"}).signature != _p1.signature,
)
check(
    "an explicit signature is not recomputed",
    Proposal(**_base, signature="handed-in").signature == "handed-in",
)
check(
    "the idempotency key carries goal, class and signature",
    _p1.idempotency_key() == f"g-ship:session_continue:{_p1.signature}",
    _p1.idempotency_key(),
)
check("to_json round-trips through json", json.loads(json.dumps(_p1.to_json()))["goal_id"] == "g-ship")


# ═════════════════════════════════════════════════════════════════════════════
print()
print("HALT: the brake an always-auto class cannot get past")

_halt_goal = a_goal()
_halt_obs = observation(FakeSlot("s1"))
_before = decide(a_proposal("context_inject", params={}), goal=_halt_goal, obs=_halt_obs,
                 budget=a_budget())
check("context_inject acts with no halt marker", _before.verdict is Verdict.ACT, _before.reason)

store.marker_create(HALT_MARKER, "selftest")
_after = decide(a_proposal("context_inject", params={}), goal=_halt_goal, obs=_halt_obs,
                budget=a_budget())
check("the halt marker refuses the always-auto class", _after.verdict is Verdict.REFUSE, _after.reason)
check("and says so in the reason", HALT_MARKER in _after.reason, _after.reason)
check(
    "halt refuses every class, not just the turn-dispatching ones",
    all(
        decide(a_proposal(c, params={}), goal=_halt_goal, obs=_halt_obs,
               budget=a_budget()).verdict is Verdict.REFUSE
        for c in ("context_inject", "narrate", "session_continue", "escalate")
    ),
)
check(
    "a hard-denied class under halt is still refused as hard-denied, not merely halted",
    decide(a_proposal("shell", goal_id="", params={})).tier is Tier.DENY_HARD,
)
store.marker_clear(HALT_MARKER)

# The mid-flight kill: the marker is re-read per proposal, so a tick that began
# before the operator hit the brake must not finish its queue.
_queue = [a_proposal("context_inject", params={"leaf_id": f"L{i}"}) for i in range(4)]
_verdicts: list[Verdict] = []
for _index, _prop in enumerate(_queue):
    if _index == 2:
        store.marker_create(HALT_MARKER, "operator hit the brake mid-tick")
    _verdicts.append(
        decide(_prop, goal=_halt_goal, obs=_halt_obs, budget=a_budget()).verdict
    )
store.marker_clear(HALT_MARKER)
check(
    "a halt mid-tick stops the rest of the queue",
    _verdicts == [Verdict.ACT, Verdict.ACT, Verdict.REFUSE, Verdict.REFUSE],
    repr([v.value for v in _verdicts]),
)


# ═════════════════════════════════════════════════════════════════════════════
print()
print("signature dedup: act once, escalate on the second")

_goal = a_goal()
_obs = observation(FakeSlot("s1"))
_cool = a_cooldowns()
_budget = a_budget()

_first = aio(gate.gate(a_proposal(), mode=Mode.AUTONOMOUS, goal=_goal, obs=_obs,
                       budget=_budget, cooldowns=_cool))
check("the first occurrence acts", _first.verdict is Verdict.ACT, _first.reason)
check("and records why", bool(_first.reason.strip()))

check(
    "the gate itself marks nothing: a second call is still ACT",
    aio(gate.gate(a_proposal(), mode=Mode.AUTONOMOUS, goal=_goal, obs=_obs,
                  budget=_budget, cooldowns=_cool)).verdict is Verdict.ACT,
    "gate() must be side-effect free; the driver marks after the effect lands",
)

_marked_keys = _cool.mark_proposal(_first.proposal)
check(
    "mark_proposal stamps the proposal signature AND the failure signature",
    len(_marked_keys) == 2 and "pytest|assertion" in _marked_keys,
    repr(_marked_keys),
)

_second = aio(gate.gate(a_proposal(), mode=Mode.AUTONOMOUS, goal=_goal, obs=_obs,
                        budget=_budget, cooldowns=_cool))
check(
    "the second identical failure escalates rather than being sent again",
    _second.verdict is Verdict.ESCALATE,
    f"{_second.verdict.value}: {_second.reason}",
)
check("and the escalation names the failure signature", "pytest|assertion" in _second.reason,
      _second.reason)
check(
    "a different failure on the same session still acts",
    aio(gate.gate(a_proposal(params={"failure_signature": "mypy|arg-type"}),
                  mode=Mode.AUTONOMOUS, goal=_goal, obs=_obs, budget=_budget,
                  cooldowns=_cool)).verdict is Verdict.ACT,
)

# A class with no failure_signature falls through to the plain signature test,
# which must refuse rather than escalate: nothing has changed, so it is a
# duplicate, not a repeat failure.
_plain = a_proposal("context_inject", params={"leaf_id": "L9"})
check(
    "a signature with no failure fingerprint acts once",
    aio(gate.gate(_plain, mode=Mode.AUTONOMOUS, goal=_goal, obs=_obs, budget=_budget,
                  cooldowns=_cool)).verdict is Verdict.ACT,
)
_cool.mark(_plain.signature)
_dup = aio(gate.gate(a_proposal("context_inject", params={"leaf_id": "L9"}),
                     mode=Mode.AUTONOMOUS, goal=_goal, obs=_obs, budget=_budget,
                     cooldowns=_cool))
check("and is refused as a duplicate on the next tick", _dup.verdict is Verdict.REFUSE, _dup.reason)
check("with the remaining cooldown in the reason", "cooldown" in _dup.reason, _dup.reason)

print()
print("dedup survives a restart, and the count outlives the cooldown")

aio(_cool.flush_async())
_reloaded = gate.Cooldowns(path=_cool.path, now=lambda: NOW)
aio(_reloaded.load_async())
check(
    "the failure count is on disk after a flush",
    _reloaded.occurrences("pytest|assertion") >= 1,
    repr(_reloaded.snapshot()["tracked"]),
)
check(
    "a fresh process escalates the same failure rather than re-sending",
    aio(gate.gate(a_proposal(), mode=Mode.AUTONOMOUS, goal=_goal, obs=_obs,
                  budget=a_budget(), cooldowns=_reloaded)).verdict is Verdict.ESCALATE,
)

_later = gate.Cooldowns(path=_cool.path, now=lambda: NOW + 4000.0)
aio(_later.load_async())
check(
    "an expired cooldown is no longer 'seen'",
    not _later.seen(_plain.signature),
    f"remaining={_later.remaining(_plain.signature)}",
)
check(
    "but its occurrence count survives, which is what makes escalation work overnight",
    _later.occurrences("pytest|assertion") >= 1,
)
_later.forget(_plain.signature)
check(
    "forget() releases a claim the reconciler proved never landed",
    _later.occurrences(_plain.signature) == 0 and not _later.seen(_plain.signature),
)
aio(_later.flush_async())
_after_forget = gate.Cooldowns(path=_cool.path, now=lambda: NOW + 4000.0)
aio(_after_forget.load_async())
check(
    "and the release is durable: the next load does not resurrect it",
    _after_forget.occurrences(_plain.signature) == 0,
    repr(_after_forget.snapshot()["recent"][:3]),
)


# ═════════════════════════════════════════════════════════════════════════════
print()
print("budgets: exhaustion escalates, it does not go quiet")

_tight = a_budget(session_continue=1)
_ok, _why = _tight.check("session_continue", "g-ship")
check("a fresh budget has room", _ok, _why)
_tight.consume("session_continue", "g-ship")
_ok2, _why2 = _tight.check("session_continue", "g-ship")
check("the cap is enforced after one spend", not _ok2, _why2)
check("and the reason carries the machine code", _why2.startswith("action_cap:"), _why2)

_spent = aio(gate.gate(a_proposal(params={"failure_signature": "fresh|sig"}),
                       mode=Mode.AUTONOMOUS, goal=_goal, obs=_obs, budget=_tight,
                       cooldowns=a_cooldowns()))
check("an exhausted budget escalates rather than refusing silently", _spent.verdict is Verdict.ESCALATE,
      f"{_spent.verdict.value}: {_spent.reason}")
check("and the escalation says it was the budget", "budget:" in _spent.reason, _spent.reason)

check(
    "a missing budget refuses an ACT tier rather than waving it through",
    aio(gate.gate(a_proposal(params={"failure_signature": "no|budget"}),
                  mode=Mode.AUTONOMOUS, goal=_goal, obs=_obs, budget=None,
                  cooldowns=a_cooldowns())).verdict is Verdict.REFUSE,
)
check(
    "a propose tier needs no budget",
    aio(gate.gate(a_proposal("session_create", params={}),
                  mode=Mode.AUTONOMOUS, goal=_goal, obs=_obs, budget=None,
                  cooldowns=a_cooldowns())).verdict is Verdict.PROPOSE,
)


class _AngryBudget:
    """A budget whose ledger cannot be read. Fail closed, and say why."""

    def check(self, action_class: str, goal_id: str) -> tuple[bool, str]:
        raise OSError("the counter file is on a dead mount")


_angry = aio(gate.gate(a_proposal(params={"failure_signature": "angry|budget"}),
                       mode=Mode.AUTONOMOUS, goal=_goal, obs=_obs,
                       budget=_AngryBudget(), cooldowns=a_cooldowns()))
check("an unreadable budget is treated as spent", _angry.verdict is Verdict.ESCALATE, _angry.reason)
check("and the exception class is named", "OSError" in _angry.reason, _angry.reason)

print()
print("budgets: post_action_check catches an overshoot")

check("post_action_check exists", callable(getattr(budget_mod.Budget, "post_action_check", None)))
check(
    "post_action_check_async exists",
    callable(getattr(budget_mod.Budget, "post_action_check_async", None)),
)
_over = a_budget(narrate=1)
check("post_action_check passes before anything is spent", _over.post_action_check("narrate", "g")[0])
_over.consume("narrate", "g")
_ok3, _why3 = _over.post_action_check("narrate", "g")
check("the last available action closes the class", not _ok3, _why3)
_over.consume("narrate", "g")
_ok4, _why4 = _over.post_action_check("narrate", "g")
check("a breached ceiling is reported as an overshoot", not _ok4 and "overshot" in _why4, _why4)
check(
    "an unconfigured class fails closed rather than running unlimited",
    a_budget(narrate=1).check("loop_arm", "g")[1].startswith("action_cap:unconfigured"),
    a_budget(narrate=1).check("loop_arm", "g")[1],
)
check(
    "a goal may only lower a cap, never raise it",
    budget_mod.Budget(
        path=_TMP / "budget-override.json",
        daily_caps={"narrate": 5},
        goal_caps_provider=lambda gid: {"narrate": 500},
        now=lambda: NOW,
    ).cap_for("narrate", "g") == 5,
)


# ═════════════════════════════════════════════════════════════════════════════
print()
print("done_when: a closed vocabulary, and an empty list is a draft")

check(
    "the vocabulary is exactly the five documented kinds",
    goals.DONE_WHEN_KINDS == frozenset(
        {"file_exists", "path_matches", "leaf_closed", "all_leaves_closed", "manual"}
    ),
    repr(sorted(goals.DONE_WHEN_KINDS)),
)
check(
    "an unknown kind is rejected",
    goals.validate_done_when([{"kind": "when_the_model_says_so"}])[0] is False,
)
check(
    "and the error names the allowed kinds",
    "file_exists" in " ".join(goals.validate_done_when([{"kind": "vibes"}])[1]),
    repr(goals.validate_done_when([{"kind": "vibes"}])[1]),
)
check(
    "a missing required key is rejected",
    goals.validate_done_when([{"kind": "file_exists"}])[0] is False,
)
check(
    "an unexpected key is rejected rather than ignored",
    goals.validate_done_when([{"kind": "manual", "path": "x"}])[0] is False,
)
check("a well-formed predicate validates", goals.validate_done_when([{"kind": "all_leaves_closed"}])[0])
check("an empty list validates as a shape", goals.validate_done_when([])[0])
check("a non-list is rejected", goals.validate_done_when({"kind": "manual"})[0] is False)

_draft = goals.new_goal("A goal with no ending", "", [], id="g-draft", status="active")
_sat, _rows = goals.evaluate_done_when(_draft, root=_TMP)
check("an empty done_when is never satisfiable", _sat is False)
check("and reports the draft pseudo-kind rather than silence",
      len(_rows) == 1 and _rows[0]["kind"] == goals.DRAFT_KIND, repr(_rows))
check("an empty done_when is never dispatchable", goals.dispatchable(_draft)[0] is False)
check("even when the file claims status=active", _draft.status == "draft", _draft.status)
check("is_draft is derived, not trusted", _draft.is_draft() is True)
check(
    "the gate refuses to act for a draft goal",
    aio(gate.gate(a_proposal(goal_id="g-draft", params={}), mode=Mode.AUTONOMOUS,
                  goal=_draft, obs=_obs, budget=a_budget(),
                  cooldowns=a_cooldowns())).verdict is Verdict.REFUSE,
)

print()
print("done_when: file_exists and path_matches over a real directory")

_root = _TMP / "scope-root"
(_root / "src").mkdir(parents=True, exist_ok=True)
(_root / "src" / "parser.py").write_text("def parse(text):\n    return text\n", encoding="utf-8")

_fe = goals.new_goal("Land the parser", "", [{"kind": "file_exists", "path": "src/parser.py"}],
                     id="g-fe", status="active")
check("file_exists finds the file", goals.evaluate_done_when(_fe, root=_root)[0] is True)
_miss = goals.new_goal("Land the linter", "", [{"kind": "file_exists", "path": "src/linter.py"}],
                       id="g-miss", status="active")
_msat, _mrows = goals.evaluate_done_when(_miss, root=_root)
check("file_exists reports an absent file as unsatisfied", _msat is False)
check("and names the pattern it looked for", "src/linter.py" in _mrows[0]["detail"], repr(_mrows))
check(
    "a glob works",
    goals.evaluate_done_when(
        goals.new_goal("glob", "", [{"kind": "file_exists", "path": "src/*.py"}],
                       id="g-glob", status="active"),
        root=_root,
    )[0] is True,
)
check(
    "path_matches finds a literal inside the file",
    goals.evaluate_done_when(
        goals.new_goal("contains", "", [{"kind": "path_matches", "path": "src/parser.py",
                                         "contains": "def parse"}],
                       id="g-pm", status="active"),
        root=_root,
    )[0] is True,
)
check(
    "path_matches is unsatisfied when the literal is absent",
    goals.evaluate_done_when(
        goals.new_goal("missing text", "", [{"kind": "path_matches", "path": "src/parser.py",
                                             "contains": "astral plane"}],
                       id="g-pm2", status="active"),
        root=_root,
    )[0] is False,
)
check(
    "an escaping pattern is rejected at declare time, not at evaluate time",
    goals.validate_done_when([{"kind": "file_exists", "path": "../../etc/passwd"}])[0] is False,
)
check(
    "an absolute pattern is rejected too",
    goals.validate_done_when([{"kind": "file_exists", "path": "/etc/passwd"}])[0] is False,
)
check(
    "and a hand-written goal file that smuggles one past validation resolves nothing",
    goals.evaluate_done_when(
        goals.Goal(id="g-esc", title="escape", status="active",
                   done_when=[{"kind": "file_exists", "path": "../../etc/passwd"}]),
        root=_root,
    )[0] is False,
)

print()
print("done_when: manual always escalates")

_manual = goals.new_goal("Ship it", "", [{"kind": "manual", "text": "confirm the release"}],
                         id="g-man", status="active")
_msat2, _mrows2 = goals.evaluate_done_when(_manual, root=_root)
check("a manual predicate is never satisfied by the machine", _msat2 is False)
check("and is flagged as escalating", _mrows2[0]["escalates"] is True, repr(_mrows2))
check("its detail says only you can confirm it", "only you" in _mrows2[0]["detail"], repr(_mrows2))
check(
    "manual-only remainder is the awaiting-confirmation transition",
    goals.needs_operator_confirmation(_mrows2) is True,
)
check(
    "an unsatisfied machine predicate is NOT awaiting confirmation",
    goals.needs_operator_confirmation(
        goals.evaluate_done_when(
            goals.new_goal("mixed", "", [{"kind": "file_exists", "path": "nope.py"},
                                         {"kind": "manual"}],
                           id="g-mix", status="active"),
            root=_root,
        )[1]
    ) is False,
)
check(
    "an unusable predicate is kept and reported, never dropped",
    (lambda g: len(goals.evaluate_done_when(g, root=_root)[1]) == 1
     and goals.evaluate_done_when(g, root=_root)[0] is False)(
        goals.Goal(id="g-bad", title="bad", done_when=[{"kind": "file_exists"}], status="active")
    ),
)


# ═════════════════════════════════════════════════════════════════════════════
print()
print("facts_hash: stable, and blind to the clock")

_hgoal = goals.new_goal("Hash me", "a statement", [{"kind": "manual"}], id="g-hash",
                        status="active", leaves=[{"id": "l1", "title": "one"}])
_facts = {
    "slots": {"s1": {"last_turn_ts": NOW - 60, "messages": 12}},
    "prs": {"https://example.invalid/pr/1": "abc123"},
    "findings": ["pytest|assert"],
}
_h1 = goals.facts_hash(_hgoal, _facts)
check("the hash is stable across calls", _h1 == goals.facts_hash(_hgoal, _facts))
check("the hash is 32 hex chars", len(_h1) == 32 and all(c in "0123456789abcdef" for c in _h1), _h1)
check(
    "a rebuilt-but-identical facts dict hashes the same",
    _h1 == goals.facts_hash(_hgoal, json.loads(json.dumps(_facts))),
)
check(
    "an added clock reading cannot leak in",
    _h1 == goals.facts_hash(_hgoal, {**_facts, "now": time.time(), "observed_ts": time.time()}),
)
time.sleep(0.01)
check(
    "wall-clock time between two calls changes nothing",
    _h1 == goals.facts_hash(_hgoal, _facts),
)
_touched = goals.Goal.from_json({**_hgoal.to_json(), "updated_ts": NOW + 99_999})
check(
    "writing the goal file down does not count as progress",
    _touched is not None and goals.facts_hash(_touched, _facts) == _h1,
)
check(
    "guidance is not in the hash: a steer resets the counter explicitly instead",
    goals.facts_hash(
        goals.Goal.from_json({**_hgoal.to_json(),
                              "guidance": [{"text": "try the other branch", "ts": NOW}]}),
        _facts,
    ) == _h1,
)
check(
    "a leaf status change moves the hash",
    goals.facts_hash(
        goals.Goal.from_json({**_hgoal.to_json(),
                              "leaves": [{"id": "l1", "title": "one", "status": "closed"}]}),
        _facts,
    ) != _h1,
)
check(
    "a message count change moves the hash",
    goals.facts_hash(_hgoal, {**_facts, "slots": {"s1": {"last_turn_ts": NOW - 60,
                                                         "messages": 13}}}) != _h1,
)
check(
    "a new finding moves the hash",
    goals.facts_hash(_hgoal, {**_facts, "findings": ["pytest|assert", "mypy|arg-type"]}) != _h1,
)
check(
    "a new PR head sha moves the hash",
    goals.facts_hash(_hgoal, {**_facts, "prs": {"https://example.invalid/pr/1": "def456"}}) != _h1,
)
check("a junk facts payload still hashes rather than raising",
      len(goals.facts_hash(_hgoal, None)) == 32)
check(
    "real SlotFacts objects pass straight through",
    len(goals.facts_hash(_hgoal, {"slots": observation(FakeSlot("s1")).slots})) == 32,
)


# ═════════════════════════════════════════════════════════════════════════════
print()
print("store: corruption degrades, it does not raise")

_state = _TMP / "corrupt.json"
_state.write_text('{"half": ', encoding="utf-8")
check("read_json returns the fallback on corruption", store.read_json(_state, {"fell": "back"})
      == {"fell": "back"})
store.write_json(_state, {"clean": True})
check("an atomic write replaces a corrupt file", store.read_json(_state) == {"clean": True})
check("no temp files are left behind", not list(_TMP.glob("*.tmp")), repr(list(_TMP.glob("*.tmp"))))

_state.write_text("]]not json[[", encoding="utf-8")
check(
    "update_json treats a corrupt file as absent rather than losing the write",
    store.update_json(_state, lambda cur: {"recovered": cur is None}, None)
    == {"recovered": True},
)
check("and the recovered value is readable", store.read_json(_state) == {"recovered": True})
check("read_json on an absent file returns the fallback", store.read_json(_TMP / "nope.json", 7) == 7)
_empty = _TMP / "empty.json"
_empty.write_text("   \n", encoding="utf-8")
check("an empty file reads as the fallback", store.read_json(_empty, "fb") == "fb")

_lines = _TMP / "ledger.jsonl"
store.append_jsonl(_lines, {"n": 1})
store.append_jsonl(_lines, {"n": 2})
check("append_jsonl round-trips", [r["n"] for r in store.read_jsonl(_lines)] == [1, 2])
with open(_lines, "a", encoding="utf-8") as _fh:
    _fh.write("{not json\n\n")
store.append_jsonl(_lines, {"n": 3})
check(
    "one unparseable line does not lose the rest",
    [r["n"] for r in store.read_jsonl(_lines)] == [1, 2, 3],
    repr(store.read_jsonl(_lines)),
)
check("the limit reads the tail", [r["n"] for r in store.read_jsonl(_lines, limit=1)] == [3])
check("a lock sidecar is used, never the data file", (_lines.parent / "ledger.jsonl.lock").exists())

check(
    "the async wrappers agree with the sync ones",
    aio(store.read_json_async(_state)) == store.read_json(_state)
    and aio(store.read_jsonl_async(_lines)) == store.read_jsonl(_lines),
)
_marker = "no_selftest_probe"
check("a marker is absent until created", store.marker_set(_marker) is False)
store.marker_create(_marker, "why")
check("marker_create makes it visible", store.marker_set(_marker) is True)
store.marker_clear(_marker)
check("marker_clear removes it", store.marker_set(_marker) is False)
store.marker_clear(_marker)
check("clearing an absent marker is not an error", store.marker_set(_marker) is False)


# ═════════════════════════════════════════════════════════════════════════════
print()
print("act.execute: independent of the gate, and idempotent")

_fake_state = FakeState(FakeSlot("s1"))


def _executed(proposal: Proposal, verdict: Verdict = Verdict.ACT,
              tier: Tier = Tier.ACT) -> dict[str, Any]:
    return aio(act.execute(Decision(proposal, verdict, tier, "selftest"),
                           state=_fake_state))


_not_act = _executed(a_proposal("narrate", params={}), Verdict.PROPOSE, Tier.PROPOSE)
check("a PROPOSE decision executes nothing", _not_act["ok"] is False)
check("and says which verdict it saw", "not act" in str(_not_act.get("refused")), repr(_not_act))
_esc = _executed(a_proposal("narrate", params={}), Verdict.ESCALATE, Tier.ACT)
check("an ESCALATE decision executes nothing", _esc["ok"] is False)
_ref = _executed(a_proposal("narrate", params={}), Verdict.REFUSE, Tier.OFF)
check("a REFUSE decision executes nothing", _ref["ok"] is False)

_denied = _executed(a_proposal("pr_merge", params={}))
check("a hard-denied class is refused independently of the gate", _denied["ok"] is False)
check("and the refusal says no execution path exists",
      "no execution path" in str(_denied.get("refused")), repr(_denied))

_unknown = _executed(a_proposal("teleport", params={}))
check("an unknown class is refused", _unknown["ok"] is False
      and "not a known action class" in str(_unknown.get("refused")), repr(_unknown))

_propose_only = _executed(a_proposal("loop_arm", params={}))
check("a known class with no executor is refused as propose-only", _propose_only["ok"] is False
      and _propose_only.get("refused") == "propose-only", repr(_propose_only))
check("every refusal carries the idempotency key for the audit row",
      all("idempotency_key" in r for r in (_not_act, _denied, _unknown, _propose_only)))

# The executor bodies need a gateway; the CLAIM does not. A stub in the dispatch
# table isolates `execute`'s own contract — claim, replay, finish — from the
# platform calls it wraps, which is the only half testable offline.
_calls: list[str] = []


async def _stub_executor(proposal: Proposal, state: Any, ctx: Any) -> dict[str, Any]:
    _calls.append(proposal.action_id)
    return {"ok": True, "detail": "stubbed", "slot": "cm-selftest"}


_saved_executor = act.EXECUTORS["narrate"]
act.EXECUTORS["narrate"] = _stub_executor
try:
    _replay_proposal = a_proposal("narrate", target_slot="cm-selftest",
                                  params={"kind": "digest"})
    _run1 = _executed(_replay_proposal)
    check("a gated ACT reaches its executor", _run1["ok"] is True and len(_calls) == 1, repr(_run1))
    _run2 = _executed(_replay_proposal)
    check("a replay of the same key short-circuits", _run2["ok"] is False
          and _run2.get("replayed") is True, repr(_run2))
    check("the executor was not called twice", len(_calls) == 1, repr(_calls))
    check("and the prior outcome is reported for the reconciler",
          _run2.get("prior_outcome") == "ok", repr(_run2))

    _fresh_id = a_proposal("narrate", target_slot="cm-selftest", params={"kind": "digest"})
    check(
        "a new action_id with the same signature is still the same key",
        _fresh_id.idempotency_key() == _replay_proposal.idempotency_key(),
    )
    check(
        "so a restart cannot double-fire the same intent",
        _executed(_fresh_id).get("replayed") is True and len(_calls) == 1,
    )
    _other = a_proposal("narrate", target_slot="cm-selftest", params={"kind": "summary"})
    check("a genuinely different intent still runs", _executed(_other)["ok"] is True
          and len(_calls) == 2, repr(_calls))
finally:
    act.EXECUTORS["narrate"] = _saved_executor
check("the dispatch table is restored", act.EXECUTORS["narrate"] is _saved_executor)


# ═════════════════════════════════════════════════════════════════════════════
print()
print("gate scope: the paths the operator can never let it write")

check(
    "the default deny list is unioned into every goal",
    all(p in a_goal().scope["paths_deny"] for p in goals.DEFAULT_PATHS_DENY),
    repr(a_goal().scope["paths_deny"]),
)
for _spelling in (".github/workflows/ci.yml", "./.github/workflows/ci.yml",
                  ".github/", "CODEOWNERS"):
    _blocked = aio(gate.gate(
        a_proposal("context_inject", params={"leaf_id": "P"}, predicted_paths=[_spelling]),
        mode=Mode.AUTONOMOUS, goal=_goal, obs=_obs, budget=a_budget(),
        cooldowns=a_cooldowns(),
    ))
    check(f"a predicted write to {_spelling!r} escalates", _blocked.verdict is Verdict.ESCALATE,
          f"{_blocked.verdict.value}: {_blocked.reason}")
check(
    "an ordinary source path is fine",
    aio(gate.gate(
        a_proposal("context_inject", params={"leaf_id": "P2"}, predicted_paths=["src/parser.py"]),
        mode=Mode.AUTONOMOUS, goal=_goal, obs=_obs, budget=a_budget(),
        cooldowns=a_cooldowns(),
    )).verdict is Verdict.ACT,
)
check(
    "an unrelated session escalates rather than being adopted",
    aio(gate.gate(
        a_proposal(target_slot="stranger", params={"failure_signature": "x|y"}),
        mode=Mode.AUTONOMOUS, goal=_goal,
        obs=observation(FakeSlot("s1"), FakeSlot("stranger", workspace="somebody-else")),
        budget=a_budget(), cooldowns=a_cooldowns(),
    )).verdict is Verdict.ESCALATE,
)
check(
    "a session in the goal's workspace is adopted by the scope axis",
    aio(gate.gate(
        a_proposal(target_slot="s2", params={"failure_signature": "ws|match"}),
        mode=Mode.AUTONOMOUS, goal=_goal, obs=observation(FakeSlot("s1"), FakeSlot("s2")),
        budget=a_budget(), cooldowns=a_cooldowns(),
    )).verdict is Verdict.ACT,
)
check(
    "a session bound to another goal is never taken over",
    aio(gate.gate(
        a_proposal(target_slot="s3", params={"failure_signature": "other|goal"}),
        mode=Mode.AUTONOMOUS, goal=_goal,
        obs=observation(FakeSlot("s3", linked_session_key="conductor:g-other:leaf1")),
        budget=a_budget(), cooldowns=a_cooldowns(),
    )).verdict is Verdict.ESCALATE,
)
check(
    "a target nobody observed this tick escalates rather than being dispatched blind",
    aio(gate.gate(
        a_proposal(target_slot="ghost", params={"failure_signature": "gh|ost"}),
        mode=Mode.AUTONOMOUS, goal=_goal, obs=observation(FakeSlot("s1")),
        budget=a_budget(), cooldowns=a_cooldowns(),
    )).verdict is Verdict.ESCALATE,
)
check(
    "a proposal with no reasons is refused at every tier",
    aio(gate.gate(
        a_proposal("context_inject", reasons=[], params={"leaf_id": "P3"}),
        mode=Mode.AUTONOMOUS, goal=_goal, obs=_obs, budget=a_budget(),
        cooldowns=a_cooldowns(),
    )).verdict is Verdict.REFUSE,
)
check(
    "a goal/proposal mismatch is refused: authority computed from the wrong file",
    aio(gate.gate(
        a_proposal(goal_id="g-other", params={"failure_signature": "x|y"}),
        mode=Mode.AUTONOMOUS, goal=_goal, obs=_obs, budget=a_budget(),
        cooldowns=a_cooldowns(),
    )).verdict is Verdict.REFUSE,
)
check(
    "a garbage mode string degrades to advisory rather than raising",
    aio(gate.gate(a_proposal("context_inject", params={"leaf_id": "P4"}),
                  mode="autonomus", goal=_goal, obs=_obs, budget=a_budget(),
                  cooldowns=a_cooldowns())).verdict is Verdict.PROPOSE,
)
check("as_mode is total", gate.as_mode(None) is Mode.ADVISORY and gate.as_mode("ACT") is Mode.ADVISORY)
check(
    "a running target is never dispatched into",
    aio(gate.gate(a_proposal(params={"failure_signature": "run|ning"}),
                  mode=Mode.AUTONOMOUS, goal=_goal,
                  obs=observation(FakeSlot("s1", running=True)), budget=a_budget(),
                  cooldowns=a_cooldowns())).verdict is Verdict.REFUSE,
)
_approval_obs = observation(FakeSlot("s1", _approval_futures={"a1": Unresolved()}))
check(
    "the fake slot really does read as approval-pending",
    _approval_obs.slots["s1"].pending_approval is True,
    repr(_approval_obs.slots["s1"].pending_approval),
)
check(
    "a pending approval escalates: that one is the operator's to answer",
    aio(gate.gate(a_proposal(params={"failure_signature": "appr|oval"}),
                  mode=Mode.AUTONOMOUS, goal=_goal, obs=_approval_obs, budget=a_budget(),
                  cooldowns=a_cooldowns())).verdict is Verdict.ESCALATE,
)
_question_obs = observation(FakeSlot("s1", _question_pending=question()))
check(
    "the fake slot really does read as needing input",
    _question_obs.slots["s1"].needs_input is True,
    repr(_question_obs.slots["s1"].needs_input),
)
check(
    "an unanswered question card escalates rather than being answered for you",
    aio(gate.gate(a_proposal(params={"failure_signature": "ques|tion"}),
                  mode=Mode.AUTONOMOUS, goal=_goal, obs=_question_obs, budget=a_budget(),
                  cooldowns=a_cooldowns())).verdict is Verdict.ESCALATE,
)
check(
    "and answering one is hard-denied, so there is no path around the escalation",
    intents.is_hard_denied("question_answer") and intents.is_hard_denied("approval_answer"),
)
check(
    "a queued prompt of our own counts as a duplicate",
    aio(gate.gate(a_proposal(params={"failure_signature": "que|ued"}),
                  mode=Mode.AUTONOMOUS, goal=_goal,
                  obs=observation(FakeSlot("s1", queue_depth=1)), budget=a_budget(),
                  cooldowns=a_cooldowns())).verdict is Verdict.REFUSE,
)
check(
    "a report-only session is observed and reported, never touched",
    aio(gate.gate(a_proposal(params={"failure_signature": "ro|1"}), mode=Mode.AUTONOMOUS,
                  goal=a_goal(scope={"adopt_slots": ["s1"], "report_only_slots": ["s1"]}),
                  obs=_obs, budget=a_budget(), cooldowns=a_cooldowns())).verdict
    is Verdict.ESCALATE,
)
check(
    "but an escalation ABOUT a report-only session still gets through",
    aio(gate.gate(a_proposal("escalate", goal_id="", target_slot="s1", params={}),
                  mode=Mode.AUTONOMOUS, goal=None, obs=_obs, budget=a_budget(),
                  cooldowns=a_cooldowns())).verdict is Verdict.ACT,
    "a gate that can mute the escalation channel through scope bookkeeping can hide a failure",
)
check(
    "only the operator-facing classes may act with no goal at all",
    all(
        aio(gate.gate(a_proposal(c, goal_id="", target_slot="", params={}),
                      mode=Mode.AUTONOMOUS, goal=None, obs=_obs, budget=a_budget(),
                      cooldowns=a_cooldowns())).verdict is Verdict.REFUSE
        for c in ("session_continue", "context_inject", "narrate")
    ),
)


# ═════════════════════════════════════════════════════════════════════════════
print()
print("the tick: a dry run completes every step and executes nothing")

check("the step table is non-empty", len(steps.STEPS) >= 10, str(len(steps.STEPS)))
check("every step has a timeout", all(s.timeout > 0 for s in steps.STEPS))
check(
    "every step's isolation class is one of the three",
    all(s.isolation in {steps.CRITICAL, steps.RECOVERABLE, steps.OPTIONAL} for s in steps.STEPS),
)
check(
    "STEP_NAMES matches the table",
    steps.STEP_NAMES == tuple(s.name for s in steps.STEPS),
)

_execute_calls: list[Any] = []
_real_execute = act.execute


async def _spy_execute(decision: Decision, *, state: Any, ctx: Any = None) -> dict[str, Any]:
    _execute_calls.append(decision)
    return {"ok": False, "refused": "the selftest spy never executes"}


act.execute = _spy_execute  # type: ignore[assignment]
try:
    _driver = loop_mod.ConductorDriver(FakeState(FakeSlot("s1"), FakeSlot("s2")))
    _record = aio(_driver.tick(dry_run=True))
    check(
        "every step in the table produced a summary",
        set(_record["steps"]) == set(steps.STEP_NAMES),
        repr(sorted(set(steps.STEP_NAMES) - set(_record["steps"]))),
    )
    _crashed = {n: s.get("error") for n, s in _record["steps"].items() if s.get("error")}
    check("no step raised", not _crashed, repr(_crashed))
    _skipped = {n: s.get("skipped") for n, s in _record["steps"].items() if s.get("skipped")}
    check("a dry run skips nothing: it forces the deliberate pass", not _skipped, repr(_skipped))
    check("the record is marked as a dry run", _record["dry_run"] is True)
    check("and as deliberate", _record["deliberate"] is True)
    check("it has a duration", isinstance(_record.get("duration_ms"), float))
    check("nothing in act.py was called", not _execute_calls, repr(_execute_calls))

    _record2 = aio(_driver.tick(dry_run=True))
    check("a second dry run also completes", set(_record2["steps"]) == set(steps.STEP_NAMES))
    check("and still executes nothing", not _execute_calls, repr(_execute_calls))

    store.marker_create(HALT_MARKER, "selftest")
    _halted_record = aio(_driver.tick(dry_run=True))
    store.marker_clear(HALT_MARKER)
    check(
        "a dry run under HALT still previews the whole pipeline",
        set(_halted_record["steps"]) == set(steps.STEP_NAMES),
        repr(sorted(set(steps.STEP_NAMES) - set(_halted_record["steps"]))),
    )
    check("and reports that autonomy is halted", _halted_record["halted"] is True)
    check("while still executing nothing", not _execute_calls, repr(_execute_calls))

    _status = _driver.status
    check("status is a property, not a coroutine", isinstance(_status, dict))
    check("status reports the step names", list(_status["steps"]) == list(steps.STEP_NAMES))
    check("status counts the ticks it ran", _status["ticks"] == 3, repr(_status["ticks"]))
    check("status is not armed: nothing started the sleep loop", _status["armed"] is False)

    _driver_no_state = loop_mod.ConductorDriver(None)
    _blind = aio(_driver_no_state.tick(dry_run=True))
    check(
        "a driver with no host handle ticks and reports honestly",
        set(_blind["steps"]) == set(steps.STEP_NAMES),
        repr(sorted(set(steps.STEP_NAMES) - set(_blind["steps"]))),
    )
    check("with nothing executed", not _execute_calls, repr(_execute_calls))
    aio(_driver.aclose())
    aio(_driver_no_state.aclose())
finally:
    act.execute = _real_execute  # type: ignore[assignment]
check("act.execute is restored", act.execute is _real_execute)
_gate_src = Path(gate.__file__).read_text(encoding="utf-8")
check(
    "gate.py is the only module that stamps verdict=Verdict.ACT",
    _gate_src.count("verdict=Verdict.ACT") == 1,
    str(_gate_src.count("verdict=Verdict.ACT")),
)
_steps_src = Path(steps.__file__).read_text(encoding="utf-8")
check(
    "steps.py stamps none",
    _steps_src.count("verdict=Verdict.ACT") == 0,
    str(_steps_src.count("verdict=Verdict.ACT")),
)
check(
    "the step pipeline delegates to gate.gate rather than deciding for itself",
    "gate_mod.gate(" in _steps_src,
)
check(
    "there is exactly one path matcher: steps.py owns no second fnmatch",
    "fnmatch" not in _steps_src,
    "two matchers means the weaker one is the denylist an operator actually gets",
)
def _modules_referencing(attr: str) -> list[str]:
    """Which conductor modules name ``<something>.<attr>`` in real code.

    Parsed rather than grepped: ``steps.py`` discusses ``policy.effective`` in a
    docstring (steps.py:704), and a substring search cannot tell that apart from
    a call — which is the difference between "documented as the single source" and
    "quietly reimplemented".
    """
    import ast

    hits: list[str] = []
    for path in sorted(Path(gate.__file__).parent.glob("*.py")):
        tree = ast.parse(path.read_text(encoding="utf-8"))
        for node in ast.walk(tree):
            if isinstance(node, ast.Attribute) and node.attr == attr:
                hits.append(path.stem)
                break
    return hits


check(
    "only the gate and the read-only authority report reference policy.effective",
    _modules_referencing("effective") == ["gate", "routes"],
    repr(_modules_referencing("effective")),
)
check(
    "and only the gate turns the answer into a verdict",
    _gate_src.count("verdict=Verdict.ACT") == 1
    and "Verdict.ACT" not in Path(gate.__file__).with_name("routes.py").read_text(
        encoding="utf-8"
    ),
    "conductor/routes.py may report a tier; it may not stamp one",
)


# ═════════════════════════════════════════════════════════════════════════════
print()
print("nothing was written outside the temp directory")

_repo_data = _HERE.parent / "data" / "conductor"
check("no data/conductor was created in the repo", not _repo_data.exists(), str(_repo_data))
check(
    "the temp directory is where the state went",
    (_TMP / "conductor").exists(),
    repr(sorted(p.name for p in (_TMP / "conductor").iterdir()))
    if (_TMP / "conductor").exists()
    else "absent",
)

_drain_loop()
_LOOP.close()

print()
if FAILURES:
    print(f"{len(FAILURES)} of {ASSERTIONS} failing check(s): {', '.join(FAILURES)}")
    sys.exit(1)
print(f"all {ASSERTIONS} conductor checks passed")
