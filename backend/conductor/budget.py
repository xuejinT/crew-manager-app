"""Hard ceilings on how much the Conductor may do — persisted, so a restart is
not a fresh allowance.

Two shapes of limit, because they answer two different questions:

* **Per (goal, action_class) per UTC day.** "Has this goal had its share?" A daily
  counter is what stops a single goal from spending the whole install's autonomy
  on one wedged session, and it is per class because six continuations is a very
  different fact from six ``loop_arm``s.
* **Global per rolling hour.** "Is the machine as a whole being noisy?" Two
  resources are genuinely global and neither is per-goal: the sessions being
  written into, and the operator's attention. Ten goals each inside their own
  daily budget can still produce a message a minute, and per-goal accounting
  cannot see that.

**Why :meth:`Budget.post_action_check` exists.** A budget is consulted when a turn
*starts*, so a turn that runs for twenty minutes finishes after the window that
authorised it. The platform hit this in its own loop service and fixed it the same
way — ``autonudge.py:1267`` (# VERIFIED) checks the runtime budget again
*post-delivery*, with the comment "the budget gates when turns START, so a slow
in-flight turn can overshoot it … once the turn HAS finished, a spent budget must
take effect NOW". Without the second check the overshoot is invisible: the next
tick sees a fresh window and dispatches again. With it, exhaustion becomes a named
terminal reason the driver escalates on, which is invariant I6 — *budget
exhaustion escalates; it never guesses and never silently continues.*

Every refusal reason begins with a named code (:class:`LimitReason`) rather than
prose, for the reason ``autonudge.py:294``'s ``stopped_reason`` records: elapsed
time keeps growing after a pause, so without the code a held goal is
indistinguishable from a budget-stopped one and raising the budget silently
resumes work the operator explicitly stopped.

The numbers here are placeholders on purpose. They get tuned from Increment 1's
shadow ledger, not from intuition — batty's own defaults record that its first
envelope "blocked everything".
"""

from __future__ import annotations

import asyncio
import logging
import time
from datetime import datetime, timezone
from enum import Enum
from pathlib import Path
from typing import Any, Callable, Mapping

from . import store

logger = logging.getLogger(__name__)

BUDGET_NAME = "budget.json"
STATE_VERSION = 1

# ── global rolling-hour caps ─────────────────────────────────────────────────
MAX_OUTBOUND_SESSION_MESSAGES_PER_HOUR = 30
MAX_OPERATOR_NOTIFICATIONS_PER_HOUR = 10

WINDOW_OUTBOUND = "outbound_session_messages"
WINDOW_NOTIFY = "operator_notifications"

HOUR_SECS = 3600

#: Classes that put text into a session someone might be reading. ``narrate`` is
#: deliberately absent: it writes a digest into the Conductor's OWN slot, and
#: letting self-narration compete for the same 30/hour would mean a chatty digest
#: starves the steering the digest is describing. It keeps a daily cap instead.
#: ``context_inject`` is absent for a stronger reason — it dispatches no turn and
#: raises no WS event, so it is not an outbound message at all.
OUTBOUND_CLASSES: frozenset[str] = frozenset({
    "session_continue", "session_resume", "session_create",
    "session_side_ask", "option_choice",
})

#: Classes that consume the one resource no budget can replenish.
NOTIFY_CLASSES: frozenset[str] = frozenset({"operator_notify", "escalate"})

#: Per (goal, class) per UTC day. Sized so a single goal cannot monopolise the
#: hourly windows, and so the turn-dispatching classes stay countable by a human
#: reading the day's ledger.
DEFAULT_DAILY_CAPS: dict[str, int] = {
    "context_inject": 200,
    # 48 was one digest a minute for under an hour, chosen before anyone had
    # watched a real build. A six-leaf goal runs for hours, and the cap was
    # reached mid-afternoon — after which the Conductor chat went silent while the
    # loop was still working, which reads to an operator exactly like a stall.
    # A digest costs a transcript row and no turn, so the cap is here to stop a
    # runaway, not to ration: 240 is a digest a minute for four hours.
    "narrate": 240,
    "pr_read": 500,
    "cron_pause": 20,
    "operator_notify": 40,
    "escalate": 24,
    "session_continue": 12,
    "session_resume": 12,
    # A goal decomposes into up to MAX_LEAVES (8) leaves, and a per-goal budget may
    # only ever NARROW this number (:meth:`_cap` clamps the override against it).
    # At 6 a six-leaf goal could not dispatch its last worker: observed, with `uci`
    # escalating "action_cap:session_create 6/6" every tick while the leaf that
    # unblocked it sat closed. The ceiling has to leave room for the largest legal
    # decomposition plus a little for a retry, or the default silently caps how big
    # a goal may be — which is not what a daily action budget is for.
    "session_create": 16,
    "loop_arm": 4,
    "cron_create": 6,
    "option_choice": 10,
    "session_side_ask": 12,
    "loop_stop": 6,
    "pr_comment": 10,
}

#: Days of history kept. Enough for a retro and a "what did it do yesterday"
#: question, short enough that the file stays a few kilobytes.
KEEP_DAYS = 7

#: Belt-and-braces bound on a rolling window list. Time-based pruning is the real
#: mechanism; this stops a clock that jumped backwards from growing the file
#: without limit until the clock catches up.
MAX_WINDOW_ENTRIES = 1000


class LimitReason(str, Enum):
    """Terminal reason codes. The prefix of every reason string this module returns."""

    OK = "ok"
    ACTION_CAP = "action_cap"
    """Daily per-(goal, class) ceiling. Rendered ``action_cap:<class>``."""

    HOURLY_CAP = "hourly_cap"
    """Global rolling-hour ceiling. Rendered ``hourly_cap:<window>``."""

    UNCONFIGURED = "action_cap:unconfigured"
    """A class with no cap. Fails CLOSED — see :meth:`Budget.cap_for`."""


def utc_day(now: float) -> str:
    """The UTC calendar day *now* falls in.

    UTC, not local: a local-midnight rollover is ambiguous twice a year (a goal
    would get two allowances on the long day) and two hosts sharing a data
    directory would disagree about when the day turned over.
    """
    return datetime.fromtimestamp(now, tz=timezone.utc).strftime("%Y-%m-%d")


def budget_path() -> Path:
    return store.conductor_dir() / BUDGET_NAME


def _empty_state() -> dict[str, Any]:
    return {"version": STATE_VERSION, "day": {}, "hour": {}}


class Budget:
    """Persisted counters, one instance per driver.

    In-memory after the first load and written through on every :meth:`consume`.
    That is safe because the driver is the only writer on the machine (the PID +
    heartbeat in ``control.py`` is what makes that true), and it means the read
    path — :meth:`check`, called several times per tick — costs nothing. The file
    exists so a restart does not hand out a fresh day's allowance.

    *goal_caps_provider* is the seam for per-goal overrides from the goal file:
    a callable taking a ``goal_id`` and returning ``{action_class: cap}``. It is
    injected rather than read here so this module never has to know the goal
    schema, and so a goal file that fails to load degrades to the defaults
    instead of to no limits.
    """

    def __init__(
        self,
        path: Path | None = None,
        *,
        daily_caps: Mapping[str, int] | None = None,
        hourly_caps: Mapping[str, int] | None = None,
        goal_caps_provider: Callable[[str], Mapping[str, int]] | None = None,
        now: Callable[[], float] = time.time,
    ) -> None:
        self._path = path
        self._daily_caps = dict(daily_caps or DEFAULT_DAILY_CAPS)
        self._hourly_caps = dict(hourly_caps or {
            WINDOW_OUTBOUND: MAX_OUTBOUND_SESSION_MESSAGES_PER_HOUR,
            WINDOW_NOTIFY: MAX_OPERATOR_NOTIFICATIONS_PER_HOUR,
        })
        self._goal_caps_provider = goal_caps_provider
        self._now = now
        self._state: dict[str, Any] | None = None

    # -- paths and state ---------------------------------------------------

    @property
    def path(self) -> Path:
        """Resolved late so a test can point ``conductor_dir`` elsewhere first."""
        return self._path if self._path is not None else budget_path()

    def _load(self) -> dict[str, Any]:
        if self._state is None:
            raw = store.read_json(self.path, None)
            self._state = self._coerce(raw)
        return self._state

    @staticmethod
    def _coerce(raw: Any) -> dict[str, Any]:
        """Accept only the shape we wrote; anything else starts empty.

        A corrupt counter file must not raise — ``store.read_json`` already treats
        corruption as absence, and the safe direction for a *limiter* whose state
        is unreadable is to start counting from zero and let the hourly windows
        re-establish themselves within the hour, not to refuse all work.
        """
        if not isinstance(raw, dict):
            return _empty_state()
        state = _empty_state()
        day = raw.get("day")
        if isinstance(day, dict):
            for day_key, goals in day.items():
                if not isinstance(day_key, str) or not isinstance(goals, dict):
                    continue
                clean_goals: dict[str, dict[str, int]] = {}
                for goal_id, classes in goals.items():
                    if not isinstance(goal_id, str) or not isinstance(classes, dict):
                        continue
                    clean_goals[goal_id] = {
                        str(cls): int(count)
                        for cls, count in classes.items()
                        if isinstance(count, (int, float)) and not isinstance(count, bool)
                    }
                state["day"][day_key] = clean_goals
        hour = raw.get("hour")
        if isinstance(hour, dict):
            for window, stamps in hour.items():
                if not isinstance(window, str) or not isinstance(stamps, list):
                    continue
                state["hour"][window] = [
                    float(ts) for ts in stamps
                    if isinstance(ts, (int, float)) and not isinstance(ts, bool)
                ]
        return state

    def _prune(self, state: dict[str, Any], now: float) -> dict[str, Any]:
        """Drop expired days and out-of-window stamps.

        Called on every read and every write. A rolling window that is only pruned
        when it happens to be inspected is a file that grows forever on a quiet
        install, which is the specific failure this method exists to prevent.
        """
        days = state.get("day")
        if isinstance(days, dict) and len(days) > KEEP_DAYS:
            for stale in sorted(days)[: len(days) - KEEP_DAYS]:
                days.pop(stale, None)
        cutoff = now - HOUR_SECS
        hours = state.get("hour")
        if isinstance(hours, dict):
            for window, stamps in list(hours.items()):
                kept = [ts for ts in stamps if ts > cutoff][-MAX_WINDOW_ENTRIES:]
                if kept:
                    hours[window] = kept
                else:
                    hours.pop(window, None)
        return state

    # -- caps --------------------------------------------------------------

    def cap_for(self, action_class: str, goal_id: str) -> int:
        """The daily ceiling for *action_class* under *goal_id*.

        A class with no configured cap gets **zero**, not a default allowance.
        Failing open would mean a class added to ``ACTION_CLASSES`` without a
        budget row runs with an arbitrary invented limit and nobody notices;
        failing closed is loud — the class is refused with
        ``action_cap:unconfigured`` on a ledger row — and the fix is one line in
        :data:`DEFAULT_DAILY_CAPS`. A limiter's default must be the restrictive one.
        """
        if self._goal_caps_provider is not None:
            try:
                override = self._goal_caps_provider(goal_id) or {}
            except Exception:
                logger.debug(
                    "conductor: goal cap lookup failed for %s", goal_id, exc_info=True
                )
                override = {}
            raw = override.get(action_class)
            if isinstance(raw, (int, float)) and not isinstance(raw, bool):
                # A goal may only ever RESTRICT, mirroring policy.goal_tier: an
                # override that raised the ceiling would make the table advisory.
                return max(0, min(int(raw), self._daily_caps.get(action_class, 0)))
        return int(self._daily_caps.get(action_class, 0))

    def windows_for(self, action_class: str) -> tuple[str, ...]:
        """Which global hourly windows *action_class* draws on."""
        windows: list[str] = []
        if action_class in OUTBOUND_CLASSES:
            windows.append(WINDOW_OUTBOUND)
        if action_class in NOTIFY_CLASSES:
            windows.append(WINDOW_NOTIFY)
        return tuple(windows)

    # -- counting ----------------------------------------------------------

    def used_today(self, action_class: str, goal_id: str) -> int:
        now = self._now()
        state = self._prune(self._load(), now)
        return int(state["day"].get(utc_day(now), {}).get(goal_id, {}).get(action_class, 0))

    def used_this_hour(self, window: str) -> int:
        now = self._now()
        state = self._prune(self._load(), now)
        return len(state["hour"].get(window, ()))

    def remaining(self, action_class: str, goal_id: str) -> int:
        """Daily headroom, floored at zero. Ignores the hourly windows on purpose:
        those are global, so "how many does this goal have left" has no answer
        that includes them."""
        cap = self.cap_for(action_class, goal_id)
        return max(0, cap - self.used_today(action_class, goal_id))

    # -- the three gates ---------------------------------------------------

    def _evaluate(self, action_class: str, goal_id: str) -> tuple[bool, str]:
        """Is there room for one more *action_class* on *goal_id*?

        One predicate serves both :meth:`check` and :meth:`post_action_check`
        deliberately. Two arithmetics would be two places for the same off-by-one,
        and the difference between the two callers is not the question — it is
        *when* the question is asked and what the answer costs. It also means a
        cap the operator lowered mid-turn, or an hourly window other goals filled
        while this turn ran, is caught by the same lines.
        """
        now = self._now()
        state = self._prune(self._load(), now)
        cap = self.cap_for(action_class, goal_id)
        used = int(state["day"].get(utc_day(now), {}).get(goal_id, {}).get(action_class, 0))

        if cap <= 0 and action_class not in self._daily_caps:
            return False, (
                f"{LimitReason.UNCONFIGURED.value}:{action_class} has no configured cap"
            )
        if used >= cap:
            # `used > cap` can only happen when a turn overshot the window that
            # authorised it, or a cap was lowered under a running goal. Say which:
            # the operator reading the escalation needs to know whether the
            # ceiling was hit or breached.
            overshoot = " (overshot)" if used > cap else ""
            return (
                False,
                f"{LimitReason.ACTION_CAP.value}:{action_class} {used}/{cap} today"
                f" for goal {goal_id}{overshoot}",
            )

        for window in self.windows_for(action_class):
            limit = int(self._hourly_caps.get(window, 0))
            count = len(state["hour"].get(window, ()))
            if count >= limit:
                return (
                    False,
                    f"{LimitReason.HOURLY_CAP.value}:{window} {count}/{limit}"
                    " in the last hour",
                )

        return True, f"{LimitReason.OK.value}: {action_class} {used}/{cap} today"

    def check(self, action_class: str, goal_id: str) -> tuple[bool, str]:
        """May one more *action_class* be spent on *goal_id* right now?

        Read-only: a gate that consumed would charge for proposals the gate goes
        on to refuse for an unrelated reason, and the budget would drain without
        anything happening.
        """
        return self._evaluate(action_class, goal_id)

    def consume(self, action_class: str, goal_id: str) -> None:
        """Charge one *action_class* to *goal_id* and persist. Blocking.

        Called by ``act.py`` when it commits to the call, not when the call
        returns — a turn that was dispatched and then failed still consumed the
        session's attention and still must count, or a failing loop gets
        unlimited retries.

        Written through ``store.update_json`` (read-modify-write inside one
        exclusive lock) rather than from the in-memory copy, so a stale process
        cannot roll the counter backwards.
        """
        now = self._now()
        day_key = utc_day(now)
        windows = self.windows_for(action_class)

        def mutate(current: Any) -> dict[str, Any]:
            state = self._prune(self._coerce(current), now)
            day = state["day"].setdefault(day_key, {})
            goal = day.setdefault(goal_id, {})
            goal[action_class] = int(goal.get(action_class, 0)) + 1
            for window in windows:
                state["hour"].setdefault(window, []).append(now)
            return self._prune(state, now)

        try:
            self._state = self._coerce(store.update_json(self.path, mutate, None))
        except Exception:
            # An uncounted action is worse than a lost row, so keep the in-memory
            # increment even when the disk write failed: the ceiling still holds
            # for this process's lifetime and the failure is logged.
            logger.exception(
                "conductor: budget write failed for %s/%s", goal_id, action_class
            )
            state = self._prune(self._load(), now)
            goal = state["day"].setdefault(day_key, {}).setdefault(goal_id, {})
            goal[action_class] = int(goal.get(action_class, 0)) + 1
            for window in windows:
                state["hour"].setdefault(window, []).append(now)

    def post_action_check(self, action_class: str, goal_id: str) -> tuple[bool, str]:
        """Re-check AFTER the action completed. See the module docstring.

        ``ok=False`` here means the class is spent for this goal *now* — the one
        just taken was the last one available, or the ceiling was breached while
        the turn was in flight. The caller stops dispatching this class into this
        goal and escalates with the returned code, rather than leaving the
        discovery to the next tick, which would find a window that had meanwhile
        rolled and dispatch again. Same predicate as :meth:`check`; the reason it
        is a separate method is the call site, and the call site is the point.
        """
        return self._evaluate(action_class, goal_id)

    # -- read model --------------------------------------------------------

    def snapshot(self, goal_id: str = "") -> dict[str, Any]:
        """Counters for the status route, in the shape the UI renders."""
        now = self._now()
        state = self._prune(self._load(), now)
        today = state["day"].get(utc_day(now), {})
        per_goal = {goal_id: today.get(goal_id, {})} if goal_id else dict(today)
        return {
            "path": str(self.path),
            "utc_day": utc_day(now),
            "daily_caps": dict(self._daily_caps),
            "used_today": per_goal,
            "hourly": {
                window: {
                    "used": len(state["hour"].get(window, ())),
                    "cap": int(self._hourly_caps.get(window, 0)),
                }
                for window in self._hourly_caps
            },
        }

    # -- async variants ----------------------------------------------------
    # The first call touches the disk (lazy load) and consume() always does, so
    # the loop offloads both.

    async def check_async(self, action_class: str, goal_id: str) -> tuple[bool, str]:
        return await asyncio.to_thread(self.check, action_class, goal_id)

    async def consume_async(self, action_class: str, goal_id: str) -> None:
        await asyncio.to_thread(self.consume, action_class, goal_id)

    async def post_action_check_async(
        self, action_class: str, goal_id: str
    ) -> tuple[bool, str]:
        return await asyncio.to_thread(self.post_action_check, action_class, goal_id)

    async def snapshot_async(self, goal_id: str = "") -> dict[str, Any]:
        return await asyncio.to_thread(self.snapshot, goal_id)
