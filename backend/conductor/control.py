"""Operator control state and the steer queue — the two things the operator owns.

Everything in here answers one question: *what did the human say, and is it still
true?* The driver reads this file at the top of every tick and obeys it. Nothing
here executes, observes or decides; it is the operator's half of the contract,
written down where a restart cannot lose it and where ``cat`` can read it.

Four decisions are load-bearing and are recorded here rather than in a design doc:

* **Two stop flags, not one.** ``operator_stopped`` is cleared only by an explicit
  START; ``auto_stopped`` is set by a circuit breaker and cleared by its backoff.
  This is copied verbatim from the cron store's ``user_paused`` / ``auto_paused``
  split (``cron.py:232-235``) for the reason that store learned it: an auto-resume
  path that clears an operator's STOP destroys trust permanently, and it is a
  two-field fix. Nothing in this module clears ``operator_stopped`` except
  :func:`set_running` with ``running=True``.

* **PID + heartbeat is the cross-process guard, because fcntl is not one.**
  ``store.locked`` takes an *advisory, per-machine* lock — it serializes two
  writers on one host and says nothing about a second gateway. A developer
  running a dev gateway beside their real one is the concrete case: both would
  load the same ``data/conductor`` directory, both would think they own the
  fleet, and each would see the other's turns as unexplained motion. So a
  starting driver reads the incumbent's ``pid`` and ``heartbeat_ts`` and refuses
  to tick while they look alive (:func:`foreign_owner`). This is not a lock: it
  is a courtesy check with a staleness window, which is the strongest thing
  available without a lock manager. **Two hosts sharing a network-mounted data
  directory is explicitly unsupported** — neither mechanism covers it.

* **The steer queue is append-only with a cursor, never rewritten.** A consumed
  steer is recorded by advancing a byte-free line offset in a sidecar, so the
  operator's own words are never edited by the machine that read them, and a
  crash between "read" and "acted" replays rather than loses. Rejected: stamping
  ``consumed_ts`` into the line, which means rewriting an append-only file and
  turns every drain into a read-modify-write of the whole history.

* **A steer can narrow authority and never widen it.** :func:`parse_steer`
  recognises a closed directive set and nothing else; free text becomes guidance,
  which shapes *content*. There is deliberately no directive that raises a tier,
  and ``raise_budget`` moves a number inside a ceiling the class table already
  bounds. "Just merge it already" parses as guidance, and the goal statement is
  the only thing it changes.
"""

from __future__ import annotations

import asyncio
import logging
import os
import secrets
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable

from . import store
from .policy import Mode

logger = logging.getLogger(__name__)


CONTROL_NAME = "control.json"
STEER_NAME = "steer.jsonl"
STEER_CURSOR_NAME = "steer.cursor.json"
STATE_VERSION = 1

#: How stale a heartbeat must be before the incumbent is presumed gone. Eight
#: missed 15-second observe ticks: long enough that a slow tick or a paused
#: laptop does not hand the fleet to a second driver, short enough that a real
#: crash does not lock autonomy out for the rest of the night.
HEARTBEAT_STALE_SECS = 120.0

MAX_GOAL_IDS = 64
MAX_STEER_CHARS = 2000
MAX_STEER_DRAIN = 50
MAX_REASON_CHARS = 240

#: The closed directive set. Anything else an operator types is guidance.
#: Membership here is what makes a steer a *policy* change rather than a
#: *content* change, so adding a member is a deliberate act, and no member
#: raises an authority tier.
DIRECTIVES: frozenset[str] = frozenset({
    "pause_goal",
    "resume_goal",
    "stop_dispatching",
    "prefer_session",
    "raise_budget",
    "set_deadline",
    "abandon_goal",
    "mark_report_only",
    "veto",
})

GUIDANCE_KIND = "guidance"
"""What a steer becomes when it matches no directive. Not an error: prose is the
common case and the one the driver can still use."""

#: Verbs :func:`stop_receipt` understands. ``drain`` and ``hold`` differ in what
#: happens to the goals, which is why they are not one verb with a flag.
STOP_VERBS: frozenset[str] = frozenset({"drain", "hold", "kill"})


def control_path() -> Path:
    return store.conductor_dir() / CONTROL_NAME


def steer_path() -> Path:
    return store.conductor_dir() / STEER_NAME


def steer_cursor_path() -> Path:
    return store.conductor_dir() / STEER_CURSOR_NAME


# ── the control record ───────────────────────────────────────────────────────


def _clean(value: object, limit: int) -> str:
    text = value if isinstance(value, str) else ("" if value is None else str(value))
    return " ".join(text.split())[:limit]


def _num(value: object, *, default: float = 0.0) -> float:
    """A finite non-negative number, or *default*.

    ``autonudge._repair_number``'s discipline in three lines: a persisted
    ``1e400`` parses as ``inf``, and ``json.dump`` would then emit the literal
    ``Infinity``, which is not JSON and which no other reader can load.
    """
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return default
    number = float(value)
    if number != number or number in (float("inf"), float("-inf")) or number < 0:
        return default
    return number


def _mode_value(raw: object) -> str:
    """A known mode, defaulting to ``advisory``.

    Fails closed on purpose: a typo in ``control.json`` must cost autonomy, not
    grant it. ``advisory`` is also the documented rollback target for every
    increment, so an unreadable mode lands where a rollback would.
    """
    try:
        return Mode(str(raw)).value
    except ValueError:
        if raw not in (None, ""):
            logger.warning("conductor: unknown mode %r in control.json; using advisory", raw)
        return Mode.ADVISORY.value


@dataclass
class Control:
    """The operator's standing instructions, as stored in ``control.json``."""

    mode: str = Mode.ADVISORY.value
    running: bool = False
    holding: bool = False
    """A hold freezes dispatch while leaving goals ``active`` and budgets frozen.
    Distinct from ``running: False`` because a resume from a hold must not
    restart every countdown, and a budget raise must not silently resume work the
    operator paused."""

    operator_stopped: bool = False
    auto_stopped: bool = False
    goal_ids: list[str] = field(default_factory=list)
    """Which goals this run pursues. Empty means "every dispatchable goal", which
    is the common case; naming goals is how an operator runs one overnight."""

    epoch: int = 0
    """Bumped on every START/STOP. An executor task already past the gate stamps
    the epoch it read; a mismatch on its next write fails it closed."""

    pid: int = 0
    heartbeat_ts: float = 0.0
    started_ts: float = 0.0
    started_by: str = ""
    last_tick_ts: float = 0.0
    capability_nonce: str = ""
    """Rotated by ``kill``, so a task already past the gate cannot complete."""

    paused_reason: str = ""
    stopped_reason: str = ""
    stats: dict[str, Any] = field(default_factory=dict)

    # -- serialization -----------------------------------------------------

    @classmethod
    def from_json(cls, payload: object) -> Control:
        """Per-field fail-open. A junk field becomes its default; the file loads.

        Never returns ``None`` and never raises: this is the file that decides
        whether the driver runs at all, and "unreadable" must degrade to "stopped
        and advisory", not to an exception inside an ``on_startup`` hook.
        """
        src = payload if isinstance(payload, dict) else {}
        raw_goals = src.get("goal_ids")
        goal_ids = [
            _clean(item, 64)
            for item in (raw_goals if isinstance(raw_goals, list) else [])
            if _clean(item, 64)
        ][:MAX_GOAL_IDS]
        stats = src.get("stats")
        return cls(
            mode=_mode_value(src.get("mode")),
            running=bool(src.get("running")),
            holding=bool(src.get("holding")),
            operator_stopped=bool(src.get("operator_stopped")),
            auto_stopped=bool(src.get("auto_stopped")),
            goal_ids=goal_ids,
            epoch=int(_num(src.get("epoch"))),
            pid=int(_num(src.get("pid"))),
            heartbeat_ts=_num(src.get("heartbeat_ts")),
            started_ts=_num(src.get("started_ts")),
            started_by=_clean(src.get("started_by"), 120),
            last_tick_ts=_num(src.get("last_tick_ts")),
            capability_nonce=_clean(src.get("capability_nonce"), 64),
            paused_reason=_clean(src.get("paused_reason"), MAX_REASON_CHARS),
            stopped_reason=_clean(src.get("stopped_reason"), MAX_REASON_CHARS),
            stats=stats if isinstance(stats, dict) else {},
        )

    def to_json(self) -> dict[str, Any]:
        return {
            "version": STATE_VERSION,
            "mode": self.mode,
            "running": self.running,
            "holding": self.holding,
            "operator_stopped": self.operator_stopped,
            "auto_stopped": self.auto_stopped,
            "goal_ids": list(self.goal_ids),
            "epoch": self.epoch,
            "pid": self.pid,
            "heartbeat_ts": self.heartbeat_ts,
            "started_ts": self.started_ts,
            "started_by": self.started_by,
            "last_tick_ts": self.last_tick_ts,
            "capability_nonce": self.capability_nonce,
            "paused_reason": self.paused_reason,
            "stopped_reason": self.stopped_reason,
            "stats": dict(self.stats),
        }

    # -- derived -----------------------------------------------------------

    @property
    def mode_enum(self) -> Mode:
        try:
            return Mode(self.mode)
        except ValueError:  # pragma: no cover - from_json already normalized
            return Mode.ADVISORY

    def blocking_reason(self) -> str:
        """Why this control record forbids acting, or ``""``.

        One function so the guard step, the status route and the start path
        cannot disagree about what "stopped" means. Order is by authority: an
        operator STOP outranks a breaker's auto-stop, which outranks a hold.
        """
        if self.operator_stopped:
            return "operator_stopped: cleared only by an explicit START"
        if not self.running:
            return f"not running{': ' + self.stopped_reason if self.stopped_reason else ''}"
        if self.auto_stopped:
            return f"auto_stopped: {self.stopped_reason or 'a subsystem tripped its breaker'}"
        if self.holding:
            return f"holding{': ' + self.paused_reason if self.paused_reason else ''}"
        return ""

    def dispatching(self) -> bool:
        return not self.blocking_reason()

    def pursues(self, goal_id: str) -> bool:
        """Whether this run covers *goal_id*. Empty ``goal_ids`` means all."""
        return not self.goal_ids or goal_id in self.goal_ids


# ── reading and writing ──────────────────────────────────────────────────────


def load_control() -> Control:
    """The current control record, or a stopped/advisory default. Blocking."""
    return Control.from_json(store.read_json(control_path(), None))


def save_control(control: Control) -> None:
    """Persist *control* wholesale. Blocking.

    Prefer :func:`update_control` for anything read-modify-write: a load followed
    by a separate save is the lost-update race, and the two writers here (a route
    handler and the driver's per-tick heartbeat) genuinely interleave.
    """
    store.write_json(control_path(), control.to_json())


def update_control(mutate: Callable[[Control], Control]) -> Control:
    """Read-modify-write under one exclusive lock. Blocking."""

    def inner(current: Any) -> dict[str, Any]:
        return mutate(Control.from_json(current)).to_json()

    return Control.from_json(store.update_json(control_path(), inner, None))


def set_mode(mode: Mode | str) -> Control:
    """Change the global mode. Does not start or stop anything.

    Separated from START on purpose: promoting ``advisory`` → ``assisted`` while
    the loop is already running is the normal way this feature is adopted, and
    tying the two together would mean every promotion also re-armed the task and
    bumped the epoch.
    """
    value = _mode_value(mode.value if isinstance(mode, Mode) else mode)

    def mutate(current: Control) -> Control:
        current.mode = value
        return current

    return update_control(mutate)


def set_running(
    running: bool,
    *,
    mode: Mode | str | None = None,
    goal_ids: list[str] | None = None,
    started_by: str = "",
    reason: str = "",
    operator: bool = True,
) -> Control:
    """START (``running=True``) or STOP (``running=False``). Idempotent.

    A second START is not an error and a second STOP is not an error — the
    operator *will* double-click, and batty's ``bail!`` on a redundant pause
    (``session.rs:31-33``) is a bug this deliberately does not copy. Both simply
    re-assert the state and return it.

    ``running=True`` is the ONLY thing that clears ``operator_stopped``, and it
    also clears ``auto_stopped`` (an explicit start is the operator overruling a
    breaker) and takes ownership: pid, heartbeat, a fresh nonce, a new epoch.

    ``operator=False`` is the breaker's path: it sets ``auto_stopped`` and leaves
    ``operator_stopped`` exactly as it found it, so a later backoff expiry can
    resume its own stop and can never resume the human's.
    """
    now = time.time()
    value = None
    if mode is not None:
        value = _mode_value(mode.value if isinstance(mode, Mode) else mode)
    ids = (
        [_clean(g, 64) for g in goal_ids if _clean(g, 64)][:MAX_GOAL_IDS]
        if goal_ids is not None
        else None
    )

    def mutate(current: Control) -> Control:
        if value is not None:
            current.mode = value
        if ids is not None:
            current.goal_ids = ids
        current.epoch += 1
        if running:
            current.running = True
            current.holding = False
            current.operator_stopped = False
            current.auto_stopped = False
            current.stopped_reason = ""
            current.paused_reason = ""
            current.pid = os.getpid()
            current.heartbeat_ts = now
            current.started_ts = now
            current.started_by = _clean(started_by, 120) or current.started_by
            current.capability_nonce = secrets.token_hex(8)
        else:
            current.running = False
            current.stopped_reason = _clean(reason, MAX_REASON_CHARS)
            if operator:
                current.operator_stopped = True
            else:
                current.auto_stopped = True
        return current

    return update_control(mutate)


def set_holding(holding: bool, *, reason: str = "") -> Control:
    """Freeze or resume dispatch without ending the run.

    A hold leaves ``running`` true so the observe cadence keeps producing a
    board, which is the whole difference between HOLD and STOP for the operator:
    they still want to see the fleet.
    """

    def mutate(current: Control) -> Control:
        current.holding = bool(holding)
        current.paused_reason = _clean(reason, MAX_REASON_CHARS) if holding else ""
        current.epoch += 1
        return current

    return update_control(mutate)


def heartbeat(*, tick_ts: float = 0.0, stats: dict[str, Any] | None = None) -> Control:
    """Stamp liveness, and optionally the tick clock and counters. Blocking.

    Called once per tick from the report step. It is a read-modify-write rather
    than a blind write because a route handler may have changed the mode inside
    the tick, and a heartbeat that clobbered that would make the operator's click
    silently disappear.
    """
    now = time.time()

    def mutate(current: Control) -> Control:
        current.pid = os.getpid()
        current.heartbeat_ts = now
        if tick_ts:
            current.last_tick_ts = tick_ts
        if stats is not None:
            current.stats = dict(stats)
        return current

    return update_control(mutate)


def rotate_nonce(reason: str = "kill") -> Control:
    """Invalidate every capability an in-flight task already holds.

    This closes the mid-flight window a "check the marker at step 0" design
    leaves open: a task that passed the gate before the operator hit KILL still
    holds a decision, and its next write compares nonces and fails closed.
    """

    def mutate(current: Control) -> Control:
        current.capability_nonce = secrets.token_hex(8)
        current.epoch += 1
        current.stopped_reason = _clean(reason, MAX_REASON_CHARS) or current.stopped_reason
        return current

    return update_control(mutate)


def claim(*, started_by: str = "") -> Control:
    """Record this process as the owner without changing running/mode.

    The arming path's own step: a driver that finds ``running: true`` after a
    gateway restart takes over the record (new pid, fresh heartbeat, new epoch)
    without pretending the operator clicked START again — ``started_ts`` and
    ``started_by`` are left alone, because they describe the operator's decision
    and not this process's lifetime.
    """
    now = time.time()

    def mutate(current: Control) -> Control:
        current.pid = os.getpid()
        current.heartbeat_ts = now
        current.epoch += 1
        if started_by and not current.started_by:
            current.started_by = _clean(started_by, 120)
        return current

    return update_control(mutate)


def _pid_alive(pid: int) -> bool:
    """Does *pid* name a live process on this host?

    ``signal 0`` sends nothing; it only asks the kernel whether the target is
    addressable. ``PermissionError`` means it exists and belongs to somebody
    else, which for our purposes is *alive*. A recycled pid can produce a false
    positive, which is why this is one of two conditions and never the only one.
    """
    if pid <= 0 or pid == os.getpid():
        return False
    try:
        os.kill(pid, 0)
    except ProcessLookupError:
        return False
    except PermissionError:
        return True
    except OSError:
        return True
    return True


def foreign_owner(control: Control, *, now: float | None = None) -> str:
    """A description of another live conductor, or ``""``.

    Both conditions must hold — a fresh heartbeat AND a live pid — because each
    alone has a false positive that matters. A fresh heartbeat with a dead pid is
    a crash inside the staleness window, and refusing on it would lock autonomy
    out until the window expired. A live pid with a stale heartbeat is a pid the
    OS reused, and refusing on it would lock autonomy out until a reboot.

    **This is a courtesy check, not a lock**, and it cannot be made into one
    here: ``fcntl`` is per-machine, so the case it does not cover (two hosts, one
    network-mounted data directory) is unsupported by construction rather than by
    omission.
    """
    stamp = now if now is not None else time.time()
    if control.pid <= 0 or control.pid == os.getpid():
        return ""
    age = stamp - control.heartbeat_ts
    if age > HEARTBEAT_STALE_SECS:
        return ""
    if not _pid_alive(control.pid):
        return ""
    return (
        f"another conductor (pid {control.pid}, epoch {control.epoch}) heartbeat "
        f"{age:.0f}s ago; refusing to tick — fcntl is per-machine, so this pid+heartbeat "
        f"pair is the cross-process guard"
    )


def stop_receipt(verb: str, *, confirmed: bool = False) -> tuple[bool, str]:
    """Whether *verb* may proceed, and why not.

    ``kill`` needs a second explicit confirmation because it stops turns
    mid-flight and therefore destroys work the operator asked for. The other two
    verbs need none: refusing a STOP for want of a confirmation is how a brake
    earns being distrusted.
    """
    if verb not in STOP_VERBS:
        return False, f"unknown stop verb {verb!r}; expected one of {sorted(STOP_VERBS)}"
    if verb == "kill" and not confirmed:
        return False, "kill stops turns mid-flight and needs an explicit second confirmation"
    return True, verb


# ── the steer queue ──────────────────────────────────────────────────────────


def append_steer(
    text: str,
    *,
    kind: str = "",
    goal_id: str = "",
    intent_id: str = "",
    actor: str = "operator",
    epoch: int = 0,
) -> dict[str, Any]:
    """Append one steer. Blocking. Returns the record as written.

    The record is written even when nothing recognises it: unmatched prose is
    guidance, and guidance is the majority of what an operator types. Dropping it
    would make the box feel broken in exactly the case it is working.
    """
    record = {
        "ts": time.time(),
        "kind": _clean(kind, 40).lower(),
        "goal_id": _clean(goal_id, 64),
        "intent_id": _clean(intent_id, 64),
        "actor": _clean(actor, 64) or "operator",
        "epoch": int(_num(epoch)),
        "text": _clean(text, MAX_STEER_CHARS),
    }
    store.append_jsonl(steer_path(), record)
    return record


def _cursor() -> int:
    payload = store.read_json(steer_cursor_path(), None)
    if isinstance(payload, dict):
        return int(_num(payload.get("offset")))
    return 0


def drain_steer(*, limit: int = MAX_STEER_DRAIN) -> list[dict[str, Any]]:
    """Steers not yet consumed, oldest first, advancing the cursor. Blocking.

    Idempotent by LINE OFFSET, which is the only identity an append-only file
    offers for free. The cursor advances by exactly the number of records
    returned, so a crash between this call and acting on its result replays those
    records on the next tick — the same "unknown means reconcile" posture the
    ledger takes, applied to the operator's words.

    Bounded at *limit* per drain so a pasted wall of text cannot make one tick
    unbounded; the remainder is drained by the next tick, in order.

    **The critical section is the CURSOR's, not the queue's**, and it is
    ``store.update_json``'s rather than a hand-rolled ``locked`` block. Both
    details are forced by one fact: POSIX ``flock`` treats two file descriptors
    on one file as independent holders *even inside a single process*, so calling
    ``store.read_jsonl``/``read_json`` (each of which takes its own shared lock)
    from inside an exclusive ``store.locked`` on the same path deadlocks the tick
    against itself. ``update_json`` reads its file directly inside its own lock,
    and the queue read below touches a different lock file, so the only
    contention left is the one that matters: two drains handing out the same
    record. Append-against-read stays serialized by ``read_jsonl``'s shared lock.
    """
    limit = max(1, int(limit))
    pending: list[dict[str, Any]] = []

    def mutate(current: Any) -> dict[str, Any]:
        nonlocal pending
        offset = int(_num(current.get("offset"))) if isinstance(current, dict) else 0
        rows = store.read_jsonl(steer_path())
        if offset > len(rows):
            # The file shrank — a manual truncation, or a restore from backup.
            # Trusting the cursor would replay every steer ever written, so it is
            # clamped to the end: losing an unread steer is recoverable (the
            # operator repeats it), re-applying a month of directives is not.
            logger.warning(
                "conductor: steer cursor %d is past the file's %d lines; clamping",
                offset,
                len(rows),
            )
            offset = len(rows)
        pending = rows[offset : offset + limit]
        for index, row in enumerate(pending):
            row["offset"] = offset + index
        return {
            "version": STATE_VERSION,
            "offset": offset + len(pending),
            "ts": time.time(),
        }

    store.update_json(steer_cursor_path(), mutate, None)
    return pending


def pending_steer_count() -> int:
    """How many steers are waiting. Cheap enough for a status route. Blocking."""
    return max(0, len(store.read_jsonl(steer_path())) - _cursor())


def parse_steer(record: dict[str, Any]) -> tuple[str, dict[str, Any]]:
    """``(kind, args)`` for one steer record. ``kind`` is a directive or guidance.

    Grammar, deliberately tiny: an explicit ``kind`` from the API wins, otherwise
    the first token of the text is matched against :data:`DIRECTIVES`. Remaining
    tokens become ``args["words"]`` and the whole text stays in ``args["text"]``,
    because a directive's prose is still guidance-worthy — "pause_goal auth-fix,
    the API changed under us" carries a fact the next deliberation wants.

    Everything unmatched is :data:`GUIDANCE_KIND`. There is no error branch and
    no partial-match fuzziness: a typo'd directive becoming guidance is safe (it
    shapes wording), while a typo'd directive being *guessed at* would let a
    slip change policy.
    """
    text = _clean(record.get("text"), MAX_STEER_CHARS)
    explicit = _clean(record.get("kind"), 40).lower()
    words = text.split()
    kind = GUIDANCE_KIND
    rest: list[str] = words
    if explicit in DIRECTIVES:
        kind = explicit
    elif words and words[0].lower().strip(":") in DIRECTIVES:
        kind = words[0].lower().strip(":")
        rest = words[1:]
    return kind, {
        "text": text,
        "words": rest,
        "goal_id": _clean(record.get("goal_id"), 64),
        "intent_id": _clean(record.get("intent_id"), 64),
        "actor": _clean(record.get("actor"), 64),
        "ts": _num(record.get("ts")),
        "offset": int(_num(record.get("offset"))),
    }


# ── the wake-up signal ───────────────────────────────────────────────────────
#
# A steer should be acted on within about a second rather than at the end of a
# 60-second sleep, so the route that appends one wakes the driver. The Event is
# BOUND BY THE DRIVER rather than created at import: an ``asyncio.Event``
# resolves its loop the first time it is awaited, and a module-global one created
# under an offline test's ``asyncio.run`` would then belong to a loop that no
# longer exists. Binding from inside the running loop makes the lifetime match
# the driver's, and :func:`signal_steer` is a documented no-op when unbound so a
# route can call it before the loop is armed.

_STEER_EVENT: asyncio.Event | None = None


def bind_steer_event(event: asyncio.Event | None = None) -> asyncio.Event:
    """Install (or replace) the wake-up Event. Call from the running loop."""
    global _STEER_EVENT
    _STEER_EVENT = event if event is not None else asyncio.Event()
    return _STEER_EVENT


def clear_steer_event() -> None:
    global _STEER_EVENT
    _STEER_EVENT = None


def steer_event() -> asyncio.Event | None:
    return _STEER_EVENT


def signal_steer() -> bool:
    """Wake the driver. False when no driver is armed — not an error.

    An unarmed driver is the ``advisory``, never-started case, and the steer is
    already durable on disk by the time this is called; the next arming reads it.
    """
    event = _STEER_EVENT
    if event is None:
        return False
    event.set()
    return True


# ── async wrappers: control state is on the hot path of every tick ───────────


async def load_control_async() -> Control:
    return await asyncio.to_thread(load_control)


async def save_control_async(control: Control) -> None:
    await asyncio.to_thread(save_control, control)


async def update_control_async(mutate: Callable[[Control], Control]) -> Control:
    return await asyncio.to_thread(update_control, mutate)


async def set_mode_async(mode: Mode | str) -> Control:
    return await asyncio.to_thread(set_mode, mode)


async def set_running_async(
    running: bool,
    *,
    mode: Mode | str | None = None,
    goal_ids: list[str] | None = None,
    started_by: str = "",
    reason: str = "",
    operator: bool = True,
) -> Control:
    return await asyncio.to_thread(
        lambda: set_running(
            running,
            mode=mode,
            goal_ids=goal_ids,
            started_by=started_by,
            reason=reason,
            operator=operator,
        )
    )


async def set_holding_async(holding: bool, *, reason: str = "") -> Control:
    return await asyncio.to_thread(lambda: set_holding(holding, reason=reason))


async def heartbeat_async(
    *, tick_ts: float = 0.0, stats: dict[str, Any] | None = None
) -> Control:
    return await asyncio.to_thread(lambda: heartbeat(tick_ts=tick_ts, stats=stats))


async def claim_async(*, started_by: str = "") -> Control:
    return await asyncio.to_thread(lambda: claim(started_by=started_by))


async def rotate_nonce_async(reason: str = "kill") -> Control:
    return await asyncio.to_thread(rotate_nonce, reason)


async def append_steer_async(
    text: str,
    *,
    kind: str = "",
    goal_id: str = "",
    intent_id: str = "",
    actor: str = "operator",
    epoch: int = 0,
) -> dict[str, Any]:
    return await asyncio.to_thread(
        lambda: append_steer(
            text, kind=kind, goal_id=goal_id, intent_id=intent_id, actor=actor, epoch=epoch
        )
    )


async def drain_steer_async(*, limit: int = MAX_STEER_DRAIN) -> list[dict[str, Any]]:
    return await asyncio.to_thread(lambda: drain_steer(limit=limit))


async def pending_steer_count_async() -> int:
    return await asyncio.to_thread(pending_steer_count)
