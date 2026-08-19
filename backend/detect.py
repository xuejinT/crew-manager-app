"""Stall detection for Crew Manager -- pure logic, no gateway imports.

A "stall" is a session the gateway still considers RUNNING while nothing has
happened for a long time. That is the one attention signal Crew Manager cannot
derive in the browser: the UI can only compare what it polls, and a wedged agent
looks identical to a busy one from the outside.

Everything here is a pure function over slot dicts so it can be exercised
offline (``python3 backend/selftest.py``) with no gateway, no clock, and no
network.

The hard part is NOT finding quiet sessions -- it is refusing to call a
legitimately quiet session stalled. Four kinds of quiet are normal and each is
excluded deliberately:

* **Waiting on the user.** ``pending_approval`` / ``waiting_for_input`` mean the
  agent finished its move and handed back. That is already Needs-you; calling it
  stalled would double-report the same fact in a scarier word.
* **Sleeping on purpose.** The ``wait`` tool parks a turn with a deadline in
  ``wait_state``. Such a session is silent BY DESIGN, often for 30 minutes. This
  is the exclusion that matters most: without it every ``wait`` call would raise
  a false alarm, which is exactly how an attention feature earns being ignored.
* **Stopping.** ``stop_state`` other than idle means a soft-stop is already in
  flight; the user asked for it and does not need telling.
* **Delegating.** A session whose subagents are running, or which is executing a
  plan stage, is quiet at the top level while work happens underneath it.
"""

from __future__ import annotations

# A session must be silent this long before it counts as stalled. Ten minutes is
# deliberately unhelpful for spotting brief hiccups: a threshold low enough to
# catch those also fires on every long tool call, and a signal that cries wolf
# is worse than no signal.
DEFAULT_STALL_SECS = 600

# Never re-notify about the same stalled session more often than this, however
# long it stays stuck. One nudge is information; a nudge every cycle is noise.
DEFAULT_RENOTIFY_SECS = 3600

# Sessions whose transcript must not be quoted anywhere durable.
_PRIVATE_MEMORY_MODES = frozenset({"incognito", "temporary"})

_STOP_STATE_IDLE = "idle"


class StallFinding:
    """One stalled session, as the watcher and the API both describe it."""

    __slots__ = ("key", "label", "silent_secs", "private", "reason")

    def __init__(self, key: str, label: str, silent_secs: int, private: bool) -> None:
        self.key = key
        self.label = label
        self.silent_secs = silent_secs
        self.private = private
        # A one-sentence, model-written account of what the session was doing when
        # it went quiet. Absent until generated, and absent forever for a private
        # session; every reader must cope with None.
        self.reason: str | None = None

    def to_dict(self) -> dict:
        out = {
            "key": self.key,
            "label": self.label,
            "silent_secs": self.silent_secs,
            "private": self.private,
        }
        if self.reason:
            out["reason"] = self.reason
        return out

    def __repr__(self) -> str:  # pragma: no cover - debugging aid
        return f"StallFinding(key={self.key!r}, silent_secs={self.silent_secs})"


def epoch_secs(value: object) -> float:
    """Best-effort seconds-since-epoch from the shapes slots actually carry.

    Timestamps arrive as ISO strings, as seconds, and as milliseconds depending
    on which writer produced them, so guessing wrong here would silently mark
    fresh sessions as hours idle. Anything unparseable returns 0.0, which the
    caller treats as "no reading" rather than "very old".
    """
    if isinstance(value, bool):
        return 0.0
    if isinstance(value, (int, float)):
        number = float(value)
        if number <= 0:
            return 0.0
        # A plain seconds value cannot plausibly exceed this; anything larger is
        # milliseconds.
        return number / 1000.0 if number > 10_000_000_000 else number
    if isinstance(value, str) and value.strip():
        text = value.strip().replace("Z", "+00:00")
        try:
            from datetime import datetime

            parsed = datetime.fromisoformat(text)
        except ValueError:
            return 0.0
        if parsed.tzinfo is None:
            from datetime import timezone

            parsed = parsed.replace(tzinfo=timezone.utc)
        return parsed.timestamp()
    return 0.0


def is_excluded(slot: dict) -> bool:
    """True when this session's silence is expected rather than suspicious."""
    if slot.get("pending_approval") or slot.get("waiting_for_input"):
        return True
    if slot.get("wait_state"):
        return True
    if slot.get("stop_state") and slot.get("stop_state") != _STOP_STATE_IDLE:
        return True
    if slot.get("stopping"):
        return True
    if slot.get("subagents_running") or slot.get("orchestrating"):
        return True
    return False


def session_label(slot: dict) -> str:
    """A name safe to put in a notification.

    An incognito or temporary session's title can carry content the user chose
    not to persist, and a notification is written to disk and to the OS centre.
    Those get a generic label so the alert still arrives without leaking.
    """
    if str(slot.get("memory_mode") or "") in _PRIVATE_MEMORY_MODES:
        return "A private session"
    title = str(slot.get("title") or "").strip()
    return title or "Untitled session"


def detect_stalls(
    slots: list[dict],
    now: float,
    *,
    stall_secs: int = DEFAULT_STALL_SECS,
    skip_keys: frozenset[str] = frozenset(),
) -> list[StallFinding]:
    """Sessions that are running but have been silent past *stall_secs*.

    *now* is passed in rather than read from the clock so the behaviour is
    testable and so one sweep judges every slot against the same instant.
    """
    findings: list[StallFinding] = []
    for slot in slots:
        key = str(slot.get("key") or "")
        if not key or key in skip_keys:
            continue
        if not slot.get("running"):
            continue
        if is_excluded(slot):
            continue

        last = epoch_secs(
            slot.get("last_activity_ts") or slot.get("last_ts") or slot.get("created")
        )
        # No usable timestamp means no evidence of a stall. Reporting one anyway
        # would flag every session the moment its clock data is missing.
        if last <= 0:
            continue

        silent = now - last
        if silent < stall_secs:
            continue

        findings.append(
            StallFinding(
                key=key,
                label=session_label(slot),
                silent_secs=int(silent),
                private=str(slot.get("memory_mode") or "") in _PRIVATE_MEMORY_MODES,
            )
        )

    findings.sort(key=lambda f: f.silent_secs, reverse=True)
    return findings


# --------------------------------------------------------------------------
# Error loops
# --------------------------------------------------------------------------
#
# An agent can be busy and still be getting nowhere: same tool, same failure,
# over and over. That reads as healthy from the outside (activity is recent, so
# it is not a stall) which is exactly why it needs its own detector.
#
# IMPORTANT LIMITATION, stated rather than hidden: transcript tool rows carry no
# structured "this failed" flag -- only the tool's own output text. So this is a
# TEXT heuristic, not a structured signal, and the thresholds below are tuned to
# stay quiet rather than to catch everything.

# How many identical failures before it counts as a loop. Two can be an ordinary
# retry; three of the same thing is a pattern.
DEFAULT_MIN_REPEATS = 3

# Only the recent tail is considered, so failures from an hour ago that were
# already recovered from cannot add up into a phantom loop.
DEFAULT_TAIL_MESSAGES = 40

# Output must look like a failure at all. Deliberately narrow: a tool whose
# normal output merely mentions the word "error" (a linter, a log reader) should
# not be mistaken for a failing one, so the marker must appear early.
_FAILURE_MARKERS = (
    "error",
    "failed",
    "failure",
    "traceback",
    "exception",
    "denied",
    "not found",
    "no such file",
    "refused",
    "timed out",
    "permission denied",
    "fatal",
)
_FAILURE_WINDOW = 200

_MAX_SIGNATURE_CHARS = 120


class ErrorLoopFinding:
    """One session repeating the same tool failure."""

    __slots__ = ("key", "label", "tool", "repeats", "private")

    def __init__(self, key: str, label: str, tool: str, repeats: int, private: bool) -> None:
        self.key = key
        self.label = label
        self.tool = tool
        self.repeats = repeats
        self.private = private

    def to_dict(self) -> dict:
        return {
            "key": self.key,
            "label": self.label,
            "tool": self.tool,
            "repeats": self.repeats,
            "private": self.private,
        }

    def __repr__(self) -> str:  # pragma: no cover - debugging aid
        return f"ErrorLoopFinding(key={self.key!r}, tool={self.tool!r}, repeats={self.repeats})"


def looks_like_failure(output: str) -> bool:
    """Whether tool output reads as a failure, not merely as text mentioning one."""
    if not output:
        return False
    head = output[:_FAILURE_WINDOW].lower()
    return any(marker in head for marker in _FAILURE_MARKERS)


def failure_signature(tool: str, output: str) -> str:
    """A stable key for "the same failure again".

    Paths, numbers and hex blobs are masked so that three attempts differing only
    by a line number, a temp path or an id still collapse into one signature --
    without that, a genuine loop looks like three unrelated failures.
    """
    import re

    text = " ".join(output[:_FAILURE_WINDOW].split()).lower()
    text = re.sub(r"/[^\s:]+", "<path>", text)
    text = re.sub(r"0x[0-9a-f]+", "<hex>", text)
    text = re.sub(r"\d+", "<n>", text)
    return f"{tool.strip().lower()}|{text[:_MAX_SIGNATURE_CHARS]}"


def detect_error_loops(
    slots: list[dict],
    *,
    min_repeats: int = DEFAULT_MIN_REPEATS,
    tail_messages: int = DEFAULT_TAIL_MESSAGES,
    skip_keys: frozenset[str] = frozenset(),
) -> list[ErrorLoopFinding]:
    """Running sessions repeating one identical tool failure in their recent tail."""
    findings: list[ErrorLoopFinding] = []
    for slot in slots:
        key = str(slot.get("key") or "")
        if not key or key in skip_keys:
            continue
        # A finished session's past failures are history, not a live loop.
        if not slot.get("running"):
            continue

        messages = slot.get("messages")
        if not isinstance(messages, list) or not messages:
            continue

        counts: dict[str, int] = {}
        tools: dict[str, str] = {}
        # One tool CALL may contribute at most one failure. An auto-approved call
        # is written to the transcript twice -- once when it is granted and again
        # when it completes -- and both rows carry the same output. Counting rows
        # instead of calls therefore reaches min_repeats on two real failures and
        # reports a loop that is not happening. Rows without a call id are still
        # counted: an unidentifiable row is not evidence of a duplicate.
        seen_calls: set[str] = set()
        for row in messages[-tail_messages:]:
            if not isinstance(row, dict) or row.get("role") != "tool":
                continue
            meta = row.get("meta")
            meta = meta if isinstance(meta, dict) else {}
            # A call still in flight has no verdict yet, and its partial output
            # can carry a marker the finished call never reports as a failure.
            if not meta.get("done"):
                continue
            call_id = str(meta.get("tool_call_id") or "")
            if call_id:
                if call_id in seen_calls:
                    continue
                seen_calls.add(call_id)
            output = str(meta.get("output") or "")
            if not looks_like_failure(output):
                continue
            tool = str(row.get("content") or meta.get("tool") or "a tool").strip()
            signature = failure_signature(tool, output)
            counts[signature] = counts.get(signature, 0) + 1
            tools[signature] = tool

        if not counts:
            continue
        worst = max(counts, key=lambda sig: counts[sig])
        if counts[worst] < min_repeats:
            continue

        findings.append(
            ErrorLoopFinding(
                key=key,
                label=session_label(slot),
                tool=tools[worst],
                repeats=counts[worst],
                private=str(slot.get("memory_mode") or "") in _PRIVATE_MEMORY_MODES,
            )
        )

    findings.sort(key=lambda f: f.repeats, reverse=True)
    return findings


def due_for_notice(
    finding: object,
    last_notified_at: float | None,
    now: float,
    *,
    renotify_secs: int = DEFAULT_RENOTIFY_SECS,
) -> bool:
    """Whether this finding should ring now, given when it last rang.

    Takes any finding kind: the dedup rule is about the session, not about which
    detector spotted it.
    """
    if last_notified_at is None:
        return True
    return (now - last_notified_at) >= renotify_secs


# -- model-written stall reasons ---------------------------------------------
#
# The rule-based body can only ever say "silent for 24m", which tells the user
# that something stopped but not what it stopped in the middle of. One sentence
# naming the last thing attempted is the difference between a notice worth
# opening and one worth muting.

#: How many recent rows go into the prompt. Enough for the last few steps,
#: small enough that the call stays cheap and fast.
REASON_TAIL_MESSAGES = 12

#: Hard cap on each row fed to the model. A single tool dump can be megabytes.
REASON_ROW_CHARS = 400

#: Hard cap on what we keep. This lands in a notification body, not an essay.
REASON_MAX_CHARS = 180

_REASON_INSTRUCTION = (
    "A coding agent session stopped responding and is still marked running. "
    "From the transcript tail below, write ONE short sentence naming what it was "
    "doing when it went quiet. State only what the transcript shows. Do not "
    "speculate about the cause, do not give advice, do not use a greeting, and do "
    "not repeat the session name. Reply with the sentence and nothing else.\n\n"
    "Transcript tail:\n{tail}"
)


def reason_tail(slot: dict, *, tail_messages: int = REASON_TAIL_MESSAGES) -> list[str]:
    """Recent transcript rows rendered as short 'role: text' lines.

    Tool rows are summarised by their tool name plus the head of their output —
    the whole output is frequently a file dump and would drown the actual steps.
    """
    messages = slot.get("messages")
    if not isinstance(messages, list):
        return []
    lines: list[str] = []
    for row in messages[-tail_messages:]:
        if not isinstance(row, dict):
            continue
        role = str(row.get("role") or "").strip() or "unknown"
        meta = row.get("meta")
        meta = meta if isinstance(meta, dict) else {}
        if role == "tool":
            tool = str(meta.get("tool") or meta.get("name") or "tool").strip()
            body = str(meta.get("output") or "").strip()
            text = f"{tool}: {body}" if body else tool
        else:
            text = str(row.get("content") or row.get("text") or "").strip()
        if not text:
            continue
        lines.append(f"{role}: {text[:REASON_ROW_CHARS]}")
    return lines


def build_reason_prompt(slot: dict, *, tail_messages: int = REASON_TAIL_MESSAGES) -> str | None:
    """The prompt for one stall explanation, or None when there is nothing to read."""
    lines = reason_tail(slot, tail_messages=tail_messages)
    if not lines:
        return None
    return _REASON_INSTRUCTION.format(tail="\n".join(lines))


def clean_reason(text: object) -> str | None:
    """Reduce a model reply to one short sentence, or None if unusable.

    A one-liner model reply is usually clean but not reliably so: it can arrive
    wrapped in quotes, prefixed with "Sentence:", or as several sentences. Taking
    the first sentence and capping the length keeps a bad reply from turning a
    notification body into a wall.
    """
    if not isinstance(text, str):
        return None
    out = text.strip()
    if not out:
        return None
    # Drop a leading label like "Sentence:" / "Answer:" that some replies carry.
    if ":" in out[:24] and not out[:24].startswith("http"):
        head, _, rest = out.partition(":")
        if len(head.split()) <= 2 and rest.strip():
            out = rest.strip()
    out = out.strip().strip('"').strip("'").strip()
    # First sentence only.
    for stop in (". ", "! ", "? ", "\n"):
        idx = out.find(stop)
        if idx > 0:
            out = out[: idx + 1].strip()
            break
    out = " ".join(out.split())
    if not out:
        return None
    if len(out) > REASON_MAX_CHARS:
        out = out[: REASON_MAX_CHARS - 1].rstrip() + "…"
    return out


def describe_silence(silent_secs: int) -> str:
    """Human phrasing for a duration, for notification body text."""
    minutes = max(1, int(silent_secs // 60))
    if minutes < 60:
        return f"{minutes} minute{'s' if minutes != 1 else ''}"
    hours = minutes // 60
    rest = minutes % 60
    if rest == 0:
        return f"{hours} hour{'s' if hours != 1 else ''}"
    return f"{hours}h {rest}m"
