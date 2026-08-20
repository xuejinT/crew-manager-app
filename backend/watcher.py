"""Background stall watcher for Crew Manager.

Why this exists at all: the UI can only notice things while it is on screen.
A wedged session is precisely the case the user is NOT watching, so detection has
to live in the gateway process and reach them through the notification bell.

Design notes worth keeping:

* **One loop per gateway, started lazily.** ``register_routes`` runs at load; the
  loop is armed on the first request instead, so an app that is installed but
  never opened costs nothing.
* **Notify on the EDGE, not on the state.** A stall that is still a stall next
  cycle must not ring again, so the notified set is keyed by session and cleared
  when the session comes back to life. Re-notification only happens after a long
  window, for a stall that is genuinely still stuck.
* **Never crash the gateway.** Every cycle is wrapped: a bad slot payload logs
  and skips rather than killing the task and taking the app's routes with it.
"""

from __future__ import annotations

import asyncio
import contextlib
import logging
import time
from typing import Any

from detect import (
    DEFAULT_MIN_REPEATS,
    DEFAULT_RENOTIFY_SECS,
    DEFAULT_STALL_SECS,
    ErrorLoopFinding,
    StallFinding,
    build_reason_prompt,
    clean_reason,
    describe_silence,
    detect_error_loops,
    detect_stalls,
    due_for_notice,
)

logger = logging.getLogger(__name__)

APP_NAME = "crew-manager"
CHANNEL_ID = "stalled"
LOOP_CHANNEL_ID = "error-loop"
CHANNEL_PRIORITY = "default"

# How often to sweep. The threshold is ten minutes, so a 60s sweep detects a
# stall within ~2% of its own age -- polling faster would only add wakeups.
SWEEP_SECS = 60

#: A stall explanation must not outlive the sweep it belongs to. If the model is
#: slow we simply ship the rule-based body for this round.
REASON_TIMEOUT_SECS = 20.0

#: "auto" inherits the session's governed default. A hardcoded model id 400s on
#: accounts and partitions that do not serve it, which is why the platform's own
#: one-liner callers pass auto rather than naming a model.
REASON_MODEL = "auto"


def _load_oneliner() -> Any:
    """The gateway's tool-free one-shot LLM helper, or None if unavailable.

    This is the same path the dashboard's own link-label and title generation use:
    an ephemeral background session, no tools by contract, permission requests
    rejected and SEL-audited. Reaching into a platform module couples us to it, so
    the import is guarded — an older or newer gateway that has moved it simply
    means stalls keep their rule-based body.
    """
    try:
        from kiro_crew.llm_helpers import run_bg_oneliner
    except Exception:  # pragma: no cover - gateway without the helper
        logger.debug("crew-manager: one-shot LLM helper unavailable", exc_info=True)
        return None
    return run_bg_oneliner


def _redact(text: object) -> str:
    """Strip credentials and exfiltration URLs from model output.

    This sentence lands in a notification body, and the transcript it was written
    from can contain anything the session touched. The platform redacts its own
    LLM output for the same reason; if those helpers are missing we return the
    text unchanged rather than dropping the feature, since the prompt asks for a
    description rather than a quotation.
    """
    raw = text if isinstance(text, str) else ""
    if not raw:
        return ""
    try:
        from kiro_crew.security import redact_credentials, redact_exfiltration_urls
    except Exception:  # pragma: no cover - gateway without the helpers
        return raw
    out, _ = redact_exfiltration_urls(raw)
    out, _ = redact_credentials(out)
    return out

# Crew Manager's own Conductor is exempt: it is a scratch session the user never
# asked to babysit, and both names exist because the app was renamed.
SKIP_KEYS = frozenset({"crew-manager-conductor", "overwatch-conductor"})


class StallWatcher:
    """Owns the sweep loop, the dedup memory, and the last known findings."""

    def __init__(self) -> None:
        self._task: asyncio.Task | None = None
        self._findings: list[StallFinding] = []
        self._loops: list[ErrorLoopFinding] = []
        self._notified_at: dict[str, float] = {}
        # When each finding was FIRST seen, for "what changed since the Conductor
        # last spoke". Separate from _notified_at, which records only notices that
        # were DUE: a finding can be live and un-notified and still be news.
        self._first_seen: dict[str, float] = {}
        # Loops dedup separately from stalls: one session can legitimately raise
        # both, and suppressing one because the other rang would hide a signal.
        self._loop_notified_at: dict[str, float] = {}
        self._loop_first_seen: dict[str, float] = {}
        # Model-written stall reasons, keyed by session. Write-once while a stall
        # persists: its story does not change, so re-asking would spend a model
        # call to get the same sentence.
        self._reasons: dict[str, str] = {}
        self._last_sweep: float = 0.0
        self.stall_secs: int = DEFAULT_STALL_SECS
        self.renotify_secs: int = DEFAULT_RENOTIFY_SECS
        self.min_repeats: int = DEFAULT_MIN_REPEATS
        self.enabled: bool = True

    # -- lifecycle ---------------------------------------------------------

    def ensure_started(self, state: Any) -> None:
        """Arm the loop once. Safe to call on every request."""
        if self._task is not None and not self._task.done():
            return
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:  # pragma: no cover - no loop during import
            return
        self._task = loop.create_task(self._run(state))
        logger.info("crew-manager: stall watcher armed (every %ss)", SWEEP_SECS)

    async def stop(self) -> None:
        task, self._task = self._task, None
        if task is not None:
            task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await task

    async def _run(self, state: Any) -> None:
        while True:
            try:
                await asyncio.sleep(SWEEP_SECS)
                if self.enabled:
                    findings = self.sweep(state, time.time())
                    await self._explain(state, findings)
            except asyncio.CancelledError:
                raise
            except Exception:
                # A failed sweep must never take the loop (and the app's routes)
                # down with it.
                logger.exception("crew-manager: stall sweep failed; continuing")

    # -- the sweep ---------------------------------------------------------

    def sweep(self, state: Any, now: float) -> list[StallFinding]:
        """One detection pass. Returns the current findings."""
        slots = self._read_slots(state)
        findings = detect_stalls(
            slots, now, stall_secs=self.stall_secs, skip_keys=SKIP_KEYS
        )
        self._findings = findings
        self._last_sweep = now

        live = {f.key for f in findings}
        # Forget sessions that recovered, so a NEW stall on the same session
        # rings again instead of being suppressed forever.
        for key in list(self._notified_at):
            if key not in live:
                del self._notified_at[key]
        # First-sighting times follow the same lifecycle, and for the same reason:
        # a session that recovered and stalled again is NEW work for the reader,
        # not a continuation. Distinct from _notified_at because a notice is only
        # written when one is DUE -- a finding can be live, and legitimately
        # un-notified, and still be something the Conductor has never been told.
        for key in list(self._first_seen):
            if key not in live:
                del self._first_seen[key]
        for finding in findings:
            self._first_seen.setdefault(finding.key, now)
        # The reason goes with it: a new stall on the same session is a new story.
        for key in list(self._reasons):
            if key not in live:
                del self._reasons[key]
        # Reuse the sentence already written for a stall that is still standing.
        for finding in findings:
            cached = self._reasons.get(finding.key)
            if cached:
                finding.reason = cached

        for finding in findings:
            if not due_for_notice(
                finding,
                self._notified_at.get(finding.key),
                now,
                renotify_secs=self.renotify_secs,
            ):
                continue
            if self._notify(state, finding):
                self._notified_at[finding.key] = now

        self._sweep_loops(state, slots, now)
        return findings

    def _sweep_loops(self, state: Any, slots: list[dict], now: float) -> None:
        """Second pass: sessions busy but getting nowhere."""
        loops = detect_error_loops(
            slots, min_repeats=self.min_repeats, skip_keys=SKIP_KEYS
        )
        self._loops = loops

        live = {loop.key for loop in loops}
        for key in list(self._loop_notified_at):
            if key not in live:
                del self._loop_notified_at[key]
        # Same lifecycle as the stall map: a loop that cleared and came back is
        # news again, not a continuation.
        for key in list(self._loop_first_seen):
            if key not in live:
                del self._loop_first_seen[key]
        for loop in loops:
            self._loop_first_seen.setdefault(loop.key, now)

        for loop in loops:
            if not due_for_notice(
                loop,
                self._loop_notified_at.get(loop.key),
                now,
                renotify_secs=self.renotify_secs,
            ):
                continue
            if self._notify_loop(state, loop):
                self._loop_notified_at[loop.key] = now

    @staticmethod
    def _read_slots(state: Any) -> list[dict]:
        """Slot dicts from gateway state, tolerating shape differences."""
        raw = getattr(state, "_slots", None) or {}
        out: list[dict] = []
        for slot in raw.values():
            to_dict = getattr(slot, "to_dict", None)
            if not callable(to_dict):
                continue
            try:
                out.append(to_dict())
            except Exception:
                logger.debug("crew-manager: skipped an unreadable slot", exc_info=True)
        return out

    # -- model-written reasons ---------------------------------------------

    def _is_current(self, finding: StallFinding) -> bool:
        """Is this finding still in the live set the most recent sweep produced?

        The staleness test is MEMBERSHIP OF THE KEY in ``self._findings``, because
        that is already this module's definition of "no longer current": absence
        from the live set is exactly what invalidates ``_reasons`` and
        ``_notified_at`` in ``sweep``. Reusing it keeps one notion of currency
        rather than inventing a second one that could disagree with the memo purge.

        Two alternatives are deliberately rejected:

        * **Object identity** (``finding in self._findings``) is too strict.
          ``sweep`` builds fresh ``StallFinding`` objects every pass, and ``POST
          /sweep`` (the UI's manual refresh) runs one on demand while this await is
          in flight — so a stall that is genuinely still standing would lose its
          reason merely because a refresh landed mid-call.
        * **A time-based cooldown** does not test the thing that matters. The
          window is however long the model takes, not a fixed span, so a timer
          either discards good reasons or lets stale ones through. Overwatch records
          the same conclusion for this race in ``tests/approval-resume.test.ts``:
          only re-reading the live state can tell whether the user acted inside it.

        A session that recovered and re-stalled inside the window would read as
        current, but that is not reachable: a fresh stall needs ``stall_secs`` of
        new silence (minutes by configuration, floor of one minute) against an await
        bounded by ``REASON_TIMEOUT_SECS``.
        """
        return any(f.key == finding.key for f in self._findings)

    async def _explain(self, state: Any, findings: list[StallFinding]) -> None:
        """Attach a one-sentence account of what each stalled session was doing.

        The rule-based body can only say "silent for 24m" — that a session stopped,
        never what it stopped in the middle of. One sentence naming the last thing
        attempted is the difference between a notice worth opening and one worth
        muting.

        A PRIVATE session is never explained. Its transcript is precisely what the
        incognito/temporary mode exists to keep from leaking, and sending it to a
        model to be described would defeat that — the same reason its label is
        already anonymised.

        Best-effort by construction: a missing LLM helper, a missing session
        manager, an empty transcript, a timeout, or any failure leaves `reason`
        unset and the notification falls back to the rule-based sentence.
        """
        pending = [f for f in findings if not f.private and f.key not in self._reasons]
        if not pending:
            return

        oneliner = _load_oneliner()
        sessions = getattr(state, "sessions", None)
        if oneliner is None or sessions is None:
            return

        slots = {slot.get("key"): slot for slot in self._read_slots(state)}
        for finding in pending:
            slot = slots.get(finding.key)
            if not isinstance(slot, dict):
                continue
            prompt = build_reason_prompt(slot)
            if not prompt:
                continue
            try:
                raw = await asyncio.wait_for(
                    oneliner(
                        sessions,
                        prompt,
                        model=REASON_MODEL,
                        sel_source=f"app:{APP_NAME}",
                    ),
                    timeout=REASON_TIMEOUT_SECS,
                )
            except asyncio.CancelledError:
                raise
            except Exception:
                logger.debug(
                    "crew-manager: no stall reason for %s", finding.key, exc_info=True
                )
                continue
            reason = clean_reason(_redact(raw))
            if not reason:
                continue
            # Re-validate before storing. The model call takes seconds, and the
            # user frequently acts inside that window: reply to the session, or
            # stop it. A reason stored for a session that has since recovered is
            # not merely useless -- `_reasons` is a write-once memo, so it would
            # be kept and phrased into the NEXT notice for whatever stall comes
            # after, describing something the session is no longer doing.
            #
            # This is the guard Overwatch's src/main/orchestrator.ts applies in
            # three places (lines 412, 628, 700) after its own slow
            # `summarizeBlocked` returns -- `if (session.state !== 'blocked' ||
            # session.blockedReason !== 'approval') return` -- for exactly this
            # reason. Discarding costs one wasted model call; the next sweep will
            # ask again if the stall is real, since the memo was never written.
            if not self._is_current(finding):
                logger.debug(
                    "crew-manager: discarded a stale stall reason for %s", finding.key
                )
                continue
            self._reasons[finding.key] = reason
            finding.reason = reason

    def _notify(self, state: Any, finding: StallFinding) -> bool:
        silence = describe_silence(finding.silent_secs)
        # The model's sentence replaces the rule-based one rather than being
        # appended: two sentences saying the same thing is what makes a notice
        # feel automated. The duration stays, because it is the reason this fired.
        body = (
            f"{finding.reason} Silent for {silence}."
            if finding.reason
            else f"Still marked running with no activity for {silence}."
        )
        return self._push(
            state,
            CHANNEL_ID,
            title=f"{finding.label} looks stalled",
            body=body,
            group_key=f"{APP_NAME}:stalled",
        )

    def _push(
        self,
        state: Any,
        channel_id: str,
        *,
        title: str,
        body: str,
        group_key: str,
    ) -> bool:
        """Push one bell notification. Returns True when it was accepted."""
        bus = getattr(state, "notification_bus", None)
        if bus is None:
            return False
        try:
            from kiro_crew.notifications.bus import (
                NotificationPayload,
                NotificationValidationError,
            )
        except Exception:  # pragma: no cover - gateway too old for the bus
            logger.debug("crew-manager: notification bus unavailable")
            return False

        channel = f"{APP_NAME}.{channel_id}"
        if not bus.is_registered(channel):
            bus.register_channel(channel, CHANNEL_PRIORITY)

        payload = NotificationPayload(
            source=f"app:{APP_NAME}",
            channel=channel,
            title=title,
            body=body,
            priority=CHANNEL_PRIORITY,
            # One stack per signal kind: several wedged sessions collapse into
            # one entry in the feed rather than becoming a pile.
            group_key=group_key,
            url="/crew-manager",
        )
        try:
            payload.validate()
        except NotificationValidationError as exc:
            logger.warning("crew-manager: dropped an invalid notice: %s", exc)
            return False
        try:
            bus.push(payload)
        except Exception:
            logger.exception("crew-manager: failed to push a notice")
            return False
        return True

    def _notify_loop(self, state: Any, loop: ErrorLoopFinding) -> bool:
        return self._push(
            state,
            LOOP_CHANNEL_ID,
            title=f"{loop.label} is repeating a failure",
            body=(
                f"{loop.tool} has failed the same way {loop.repeats} times in a row."
            ),
            group_key=f"{APP_NAME}:error-loop",
        )

    # -- read model --------------------------------------------------------

    def snapshot(self) -> dict:
        return {
            "enabled": self.enabled,
            "stall_secs": self.stall_secs,
            "renotify_secs": self.renotify_secs,
            "min_repeats": self.min_repeats,
            "sweep_secs": SWEEP_SECS,
            "last_sweep": self._last_sweep or None,
            "stalls": [f.to_dict() for f in self._findings],
            "error_loops": [loop.to_dict() for loop in self._loops],
            # When each live finding was first seen, keyed as the findings are.
            # Sent alongside rather than inside to_dict() so the finding shape
            # stays the detector's business and this stays the watcher's: the
            # detector is stateless and has no idea when it last ran.
            "first_seen": {
                key: seen
                for key, seen in {**self._first_seen, **self._loop_first_seen}.items()
            },
        }


WATCHER = StallWatcher()
