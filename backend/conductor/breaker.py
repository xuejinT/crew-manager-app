"""Per-subsystem circuit breakers.

A wedged ``gh`` or a rate-limited model must degrade ONE capability, not stop
autonomy and not spin.

That sentence is the whole specification. The loop's steps are split into three
failure classes (plan: ported from batty's ``daemon/error_handling.rs:24,45,70``):
critical steps log and continue, recoverable steps count consecutive failures, and
*optional subsystems* — every LLM call, every provider read, the cron store, the
notification bus — get one of these. Five errors inside ten minutes and the
capability goes away for 60s, then 300s, then 1800s; a ladder that runs out latches
the capability off and raises a notice, because a subsystem that has failed
through the whole ladder is not having a bad minute.

Ported from batty rather than invented, with three deliberate divergences, each
because the Rust original is either wrong or unavailable to us:

* **It trips on the threshold-th error, not the one after.** batty's
  ``record_optional_subsystem_failure`` guards with ``if recent_errors <=
  OPTIONAL_SUBSYSTEM_ERROR_BUDGET { return }`` (error_handling.rs:148) against a
  budget constant of 5, so it actually trips on the sixth. Our spec says five.
* **Deadlines are absolute wall-clock, not a monotonic ``Instant``.** batty stores
  "remaining secs" and rebases on restart (``restore_optional_subsystem_budget_state``,
  error_handling.rs:213), which means a restart every 30s never finishes a backoff.
  Absolute ``open_until`` survives restarts truthfully; the cost is that a clock
  jump forwards ends a backoff early, which is the harmless direction.
* **The ladder latches.** batty saturates at 1800s and retries forever with nobody
  told. A capability that is permanently broken should stop costing a probe every
  half hour and should instead be *visible*: latched off, ``notice`` pending,
  cleared only by :meth:`CircuitBreaker.reset` (the status route's re-enable, or a
  restart with a fixed environment).

Success does not erase recent errors. Five failures interleaved with successes in
ten minutes is flapping, and flapping is exactly what a breaker is for; the ladder
resets only once the whole window is clean, which is batty's
``record_optional_subsystem_success`` semantics.

State is in memory and mirrored to ``conductor_dir()/breakers.json`` on transitions
only — never on the hot path, and never synchronously from inside the event loop.
"""

from __future__ import annotations

import asyncio
import logging
import time
from pathlib import Path
from typing import Any, Callable, Iterable

from . import store
from .ledger import redact_field

logger = logging.getLogger(__name__)

BREAKERS_NAME = "breakers.json"

DEFAULT_THRESHOLD = 5
DEFAULT_WINDOW_SECS = 600
DEFAULT_BACKOFF: tuple[int, ...] = (60, 300, 1800)

#: Bound on the retained error list. The window prunes by time; this stops a
#: subsystem failing in a tight loop from growing the persisted blob.
MAX_RETAINED_ERRORS = 64

#: Strong references to in-flight persist tasks. Without this the event loop is
#: free to garbage-collect a scheduled write mid-flight, which is the documented
#: asyncio footgun and would silently lose exactly the state we are persisting.
_PENDING_WRITES: set[asyncio.Task[Any]] = set()


def breakers_path() -> Path:
    return store.conductor_dir() / BREAKERS_NAME


class CircuitBreaker:
    """One capability's health. Cheap to consult, honest about being open.

    Not thread-safe and does not need to be: the driver is a single task in a
    single process, and the status route reads the same object from the same loop.
    """

    def __init__(
        self,
        name: str,
        *,
        threshold: int = DEFAULT_THRESHOLD,
        window_secs: int = DEFAULT_WINDOW_SECS,
        backoff: Iterable[int] = DEFAULT_BACKOFF,
        now: Callable[[], float] = time.time,
        persist: bool = True,
    ) -> None:
        self.name = name
        self.threshold = max(1, int(threshold))
        self.window_secs = max(1, int(window_secs))
        self.backoff: tuple[int, ...] = tuple(int(s) for s in backoff) or DEFAULT_BACKOFF
        self._now = now
        self._persist_enabled = persist

        self._errors: list[float] = []
        self._level = 0
        self._open_until = 0.0
        self._disabled = False
        self._notice = ""
        self._last_error = ""
        self._tripped_at = 0.0
        self._trips = 0
        self._loaded = False

    # -- persistence -------------------------------------------------------

    def _restore(self) -> None:
        """Load this breaker's slice on first use. Best effort, never raises.

        Deliberately lazy: constructing a breaker at import time must not touch
        the disk, both because house rules forbid blocking I/O on the loop and
        because the module has to import with no data directory at all.
        """
        if self._loaded:
            return
        self._loaded = True
        if not self._persist_enabled:
            return
        blob = store.read_json(breakers_path(), None)
        row = blob.get(self.name) if isinstance(blob, dict) else None
        if not isinstance(row, dict):
            return
        try:
            self._level = max(0, int(row.get("level", 0)))
            self._open_until = float(row.get("open_until", 0.0) or 0.0)
            self._disabled = bool(row.get("disabled", False))
            self._notice = str(row.get("notice", "") or "")
            self._last_error = str(row.get("last_error", "") or "")
            self._tripped_at = float(row.get("tripped_at", 0.0) or 0.0)
            self._trips = max(0, int(row.get("trips", 0)))
            errors = row.get("errors")
            if isinstance(errors, list):
                self._errors = [
                    float(ts) for ts in errors
                    if isinstance(ts, (int, float)) and not isinstance(ts, bool)
                ][-MAX_RETAINED_ERRORS:]
        except (TypeError, ValueError):
            logger.debug(
                "conductor: unusable breaker state for %s", self.name, exc_info=True
            )

    def _persist_now(self) -> None:
        """Merge this breaker's slice into the shared file. Blocking."""
        row = {
            "level": self._level,
            "open_until": round(self._open_until, 3),
            "disabled": self._disabled,
            "notice": self._notice,
            "last_error": self._last_error,
            "tripped_at": round(self._tripped_at, 3),
            "trips": self._trips,
            "errors": [round(ts, 3) for ts in self._errors[-MAX_RETAINED_ERRORS:]],
            "updated": round(self._now(), 3),
        }

        def mutate(current: Any) -> dict[str, Any]:
            blob = dict(current) if isinstance(current, dict) else {}
            blob[self.name] = row
            return blob

        try:
            store.update_json(breakers_path(), mutate, {})
        except Exception:
            # A breaker that cannot persist still works for this process's
            # lifetime, which is the part that protects the subsystem.
            logger.warning(
                "conductor: could not persist breaker %s", self.name, exc_info=True
            )

    def _persist(self) -> None:
        """Schedule a write off the loop; write inline when there is no loop.

        Only transitions call this, so the write rate is bounded by the backoff
        ladder rather than by traffic. The task reference is held in
        :data:`_PENDING_WRITES` until it completes.
        """
        if not self._persist_enabled:
            return
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            self._persist_now()
            return
        task = loop.create_task(asyncio.to_thread(self._persist_now))
        _PENDING_WRITES.add(task)
        task.add_done_callback(_PENDING_WRITES.discard)

    # -- window ------------------------------------------------------------

    def _prune(self, now: float) -> None:
        cutoff = now - self.window_secs
        if self._errors and self._errors[0] <= cutoff:
            self._errors = [ts for ts in self._errors if ts > cutoff]

    # -- the three calls ---------------------------------------------------

    def _verdict(self, now: float) -> tuple[bool, str, bool]:
        """``(allowed, reason, half_open_pending)`` with no side effects.

        Split out so :meth:`state` can answer the status route without *taking*
        the half-open probe. Folding the transition into ``allow`` and letting
        ``state`` call it meant every poll of the dashboard consumed the one probe
        the backoff had earned, and persisted the change while doing it.
        """
        if self._disabled:
            return False, (
                f"{self.name} disabled after {self._trips} trips"
                f"{': ' + self._last_error if self._last_error else ''}"
            ), False
        if self._open_until > now:
            return False, (
                f"{self.name} open for another {int(self._open_until - now)}s"
                f" (backoff rung {self._level}/{len(self.backoff)})"
            ), False
        if self._open_until:
            return True, f"{self.name} half-open probe after backoff", True
        return True, f"{self.name} closed", False

    def allow(self) -> tuple[bool, str]:
        """May this capability be used? Returns the reason either way.

        The reason is returned rather than logged so it can go on the ledger row
        verbatim — a step skipped for an unrecorded reason looks identical to a
        step that had nothing to do.
        """
        self._restore()
        now = self._now()
        allowed, reason, half_open = self._verdict(now)
        if half_open:
            # Backoff elapsed: this call is the probe. The ladder LEVEL is kept
            # until a clean window proves the subsystem is back — otherwise one
            # lucky call resets it and the second outage starts again at 60s.
            self._open_until = 0.0
            logger.info("conductor: breaker %s half-open after backoff", self.name)
            self._persist()
        return allowed, reason

    def record_ok(self) -> None:
        """A successful call. Resets the ladder only once the window is clean."""
        self._restore()
        now = self._now()
        self._prune(now)
        self._open_until = 0.0
        if not self._errors and self._level:
            self._level = 0
            self._notice = ""
            logger.info("conductor: breaker %s recovered; ladder reset", self.name)
            self._persist()

    def record_error(self, exc_or_str: BaseException | str) -> None:
        """An error from this capability. Trips on the threshold-th in the window.

        The message is redacted before it is stored: an exception string from a
        subprocess or an HTTP client is one of the likelier places a token turns
        up, and this string reaches both the persisted file and the status route.
        """
        self._restore()
        now = self._now()
        text = (
            f"{type(exc_or_str).__name__}: {exc_or_str}"
            if isinstance(exc_or_str, BaseException)
            else str(exc_or_str)
        )
        self._last_error = redact_field(text, limit=200)
        self._prune(now)
        self._errors.append(now)
        del self._errors[:-MAX_RETAINED_ERRORS]

        if self._disabled or self._open_until > now:
            # Already tripped. Recording the error is still right (the window is
            # evidence for the status route) but re-tripping would ratchet the
            # ladder on failures that happened while the door was shut — batty
            # guards the same way with its `contains_key(&disable_key)` check.
            return
        if len(self._errors) < self.threshold:
            return
        self._trip(now)

    def _trip(self, now: float) -> None:
        self._trips += 1
        self._tripped_at = now
        errors = len(self._errors)
        # Clear the window on trip. Keeping it would mean the half-open probe's
        # first failure instantly re-trips, since the old errors are still inside
        # a ten-minute window — the ladder would jump to its last rung on what is
        # really the second outage.
        self._errors = []
        if self._level >= len(self.backoff):
            self._disabled = True
            self._notice = (
                f"{self.name} disabled: {errors} errors in {self.window_secs}s"
                f" after exhausting the backoff ladder ({self._last_error})"
            )
            logger.error("conductor: %s", self._notice)
        else:
            secs = self.backoff[self._level]
            self._level += 1
            self._open_until = now + secs
            self._notice = (
                f"{self.name} paused {secs}s: {errors} errors in {self.window_secs}s"
                f" ({self._last_error})"
            )
            logger.warning("conductor: %s", self._notice)
        self._persist()

    # -- operator surface --------------------------------------------------

    def take_notice(self) -> str:
        """Consume the pending operator notice, if any.

        Consuming rather than exposing a flag is what stops the report step from
        re-notifying every tick for one trip. The same "insert even when
        suppressing" discipline as the escalation flood guard, one level down.
        """
        self._restore()
        notice, self._notice = self._notice, ""
        return notice

    def reset(self, reason: str = "operator") -> None:
        """Re-enable and clear the ladder. The only exit from ``disabled``."""
        self._restore()
        self._errors = []
        self._level = 0
        self._open_until = 0.0
        self._disabled = False
        self._notice = ""
        logger.info("conductor: breaker %s reset (%s)", self.name, reason)
        self._persist()

    def state(self) -> dict[str, Any]:
        """Everything the status route needs, with no derived judgement left to it."""
        self._restore()
        now = self._now()
        self._prune(now)
        allowed, reason, _ = self._verdict(now)
        return {
            "name": self.name,
            "allowed": allowed,
            "reason": reason,
            "disabled": self._disabled,
            "open_until": self._open_until or None,
            "open_secs_remaining": (
                max(0, int(self._open_until - now)) if self._open_until else 0
            ),
            "level": self._level,
            "backoff": list(self.backoff),
            "threshold": self.threshold,
            "window_secs": self.window_secs,
            "errors_in_window": len(self._errors),
            "trips": self._trips,
            "tripped_at": self._tripped_at or None,
            "last_error": self._last_error,
            "notice_pending": bool(self._notice),
        }


# ── registry: one breaker per named capability ───────────────────────────────

#: Subsystem names the plan assigns a breaker to. Not enforced — :func:`get`
#: accepts any name — but listed so the status route can render a stable set and
#: so a typo in a call site is visible next to the intended name.
KNOWN_SUBSYSTEMS: tuple[str, ...] = (
    "llm_classify",
    "llm_compose",
    "provider_pr",
    "cron_store",
    "notification_bus",
    "session_dispatch",
)

_REGISTRY: dict[str, CircuitBreaker] = {}


def get(name: str, **kwargs: Any) -> CircuitBreaker:
    """The shared breaker for *name*, created on first use.

    Shared on purpose: two breakers over one wedged subsystem would each need
    their own five errors to trip, so the capability would take twice as long to
    be taken away. *kwargs* apply only to the creating call.
    """
    breaker = _REGISTRY.get(name)
    if breaker is None:
        breaker = CircuitBreaker(name, **kwargs)
        _REGISTRY[name] = breaker
    return breaker


def all_states() -> list[dict[str, Any]]:
    """Every live breaker's state, for ``GET /conductor/state``."""
    return [b.state() for b in _REGISTRY.values()]


def pending_notices() -> list[str]:
    """Drain every breaker's pending notice, for the report step."""
    return [n for n in (b.take_notice() for b in _REGISTRY.values()) if n]


def reset_all(reason: str = "operator") -> None:
    for breaker in _REGISTRY.values():
        breaker.reset(reason)


async def all_states_async() -> list[dict[str, Any]]:
    return await asyncio.to_thread(all_states)
