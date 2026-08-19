"""Offline tests for Crew Manager's stall detection.

Run with: python3 backend/selftest.py

No gateway, no network, no clock: `detect_stalls` takes `now` as an argument, so
every case below pins an exact instant.
"""

from __future__ import annotations

import sys

from detect import (
    DEFAULT_STALL_SECS,
    REASON_MAX_CHARS,
    build_reason_prompt,
    clean_reason,
    describe_silence,
    detect_error_loops,
    detect_stalls,
    due_for_notice,
    epoch_secs,
    looks_like_failure,
    session_label,
)
import recall
from recall import (
    RECALL_LIMIT_DEFAULT,
    RECALL_LIMIT_MAX,
    clamp_limit,
    normalize_query,
    focus_snippet,
    query_is_searchable,
    snippet_is_useful,
    strip_match_markers,
)

NOW = 1_800_000_000.0
FAILURES: list[str] = []


def check(name: str, condition: bool, detail: str = "") -> None:
    if condition:
        print(f"  ok   {name}")
    else:
        print(f"  FAIL {name}{(' -- ' + detail) if detail else ''}")
        FAILURES.append(name)


def slot(**over) -> dict:
    base = {
        "key": "session-1",
        "title": "Translate the gallery copy",
        "running": True,
        "last_activity_ts": NOW - (DEFAULT_STALL_SECS + 120),
        "stop_state": "idle",
    }
    base.update(over)
    return base


print("timestamp parsing")
check("seconds pass through", epoch_secs(1_800_000_000) == 1_800_000_000.0)
check("milliseconds are scaled", epoch_secs(1_800_000_000_000) == 1_800_000_000.0)
check("iso string parses", epoch_secs("2026-08-17T00:00:00Z") > 1_700_000_000)
check("garbage is no reading", epoch_secs("not a date") == 0.0)
check("empty is no reading", epoch_secs(None) == 0.0)
check("booleans are not numbers", epoch_secs(True) == 0.0)

print("detects a genuine stall")
found = detect_stalls([slot()], NOW)
check("one finding", len(found) == 1, repr(found))
check("carries the session key", found and found[0].key == "session-1")
check("reports the silence", found and found[0].silent_secs >= DEFAULT_STALL_SECS)

print("does not cry wolf")
check("idle session is not stalled", detect_stalls([slot(running=False)], NOW) == [])
check(
    "fresh session is not stalled",
    detect_stalls([slot(last_activity_ts=NOW - 30)], NOW) == [],
)
check(
    "pending approval is a handoff, not a stall",
    detect_stalls([slot(pending_approval=True)], NOW) == [],
)
check(
    "waiting for input is a handoff, not a stall",
    detect_stalls([slot(waiting_for_input=True)], NOW) == [],
)
check(
    "a deliberate wait is not a stall",
    detect_stalls([slot(wait_state={"wait_id": "w1", "seconds": 1800})], NOW) == [],
)
check(
    "a stopping session is not a stall",
    detect_stalls([slot(stop_state="soft_pending")], NOW) == [],
)
check(
    "running subagents explain the quiet",
    detect_stalls([slot(subagents_running=True)], NOW) == [],
)
check(
    "an executing plan stage explains the quiet",
    detect_stalls([slot(orchestrating=True)], NOW) == [],
)
check(
    "no timestamp means no claim",
    detect_stalls([slot(last_activity_ts=None, last_ts=None, created=None)], NOW) == [],
)
check("skip_keys are honoured", detect_stalls([slot()], NOW, skip_keys=frozenset({"session-1"})) == [])

print("privacy")
check(
    "incognito is not named",
    session_label(slot(memory_mode="incognito")) == "A private session",
)
check(
    "temporary is not named",
    session_label(slot(memory_mode="temporary")) == "A private session",
)
check("normal sessions keep their title", session_label(slot()) == "Translate the gallery copy")
check("missing title has a fallback", session_label(slot(title="")) == "Untitled session")
private = detect_stalls([slot(memory_mode="incognito")], NOW)
check("private flag rides along", private and private[0].private is True)

print("ordering and thresholds")
many = detect_stalls(
    [
        slot(key="recent", last_activity_ts=NOW - 700),
        slot(key="ancient", last_activity_ts=NOW - 9000),
        slot(key="middle", last_activity_ts=NOW - 3000),
    ],
    NOW,
)
check("longest silence first", [f.key for f in many] == ["ancient", "middle", "recent"], repr(many))
check(
    "a custom threshold is respected",
    len(detect_stalls([slot(last_activity_ts=NOW - 120)], NOW, stall_secs=60)) == 1,
)

print("re-notification")
one = detect_stalls([slot()], NOW)[0]
check("first sighting rings", due_for_notice(one, None, NOW) is True)
check("immediate repeat stays quiet", due_for_notice(one, NOW - 60, NOW) is False)
check("rings again after the window", due_for_notice(one, NOW - 7200, NOW) is True)

print("phrasing")
check("minutes", describe_silence(600) == "10 minutes")
check("one minute is singular", describe_silence(60) == "1 minute")
check("whole hours", describe_silence(7200) == "2 hours")
check("mixed", describe_silence(5400) == "1h 30m")

print("error loops")


def tool_row(output: str, tool: str = "shell") -> dict:
    return {"role": "tool", "content": tool, "meta": {"done": True, "output": output}}


def loop_slot(rows: list[dict], **over) -> dict:
    base = {
        "key": "loop-1",
        "title": "Fix the build",
        "running": True,
        "last_activity_ts": NOW - 5,
        "messages": rows,
    }
    base.update(over)
    return base


same_failure = [tool_row("Error: ENOENT no such file or directory, open '/tmp/a/1'") for _ in range(3)]
loops = detect_error_loops([loop_slot(same_failure)])
check("three identical failures is a loop", len(loops) == 1, repr(loops))
check("names the tool", loops and loops[0].tool == "shell")
check("counts the repeats", loops and loops[0].repeats == 3)

check(
    "two failures is a retry, not a loop",
    detect_error_loops([loop_slot(same_failure[:2])]) == [],
)
check(
    "an idle session is history, not a loop",
    detect_error_loops([loop_slot(same_failure, running=False)]) == [],
)
check(
    "successful output is not a failure",
    detect_error_loops([loop_slot([tool_row("wrote 3 files") for _ in range(4)])]) == [],
)
check(
    "different failures are not one loop",
    detect_error_loops(
        [loop_slot([
            tool_row("Error: connection refused"),
            tool_row("Error: permission denied"),
            tool_row("Error: no such file"),
        ])]
    ) == [],
)
check(
    "output merely discussing errors late is not a failure",
    looks_like_failure("all checks passed. " + ("x" * 400) + " error") is False,
)
check("a real failure is recognised", looks_like_failure("Traceback (most recent call last)") is True)

# Line numbers and temp paths differ every attempt; the signature must still match.
varied = [
    tool_row("Error at /tmp/build/x1.py:12 failed with code 3"),
    tool_row("Error at /tmp/build/x2.py:48 failed with code 3"),
    tool_row("Error at /tmp/build/x3.py:99 failed with code 3"),
]
check(
    "paths and numbers do not split one loop",
    len(detect_error_loops([loop_slot(varied)])) == 1,
    repr(detect_error_loops([loop_slot(varied)])),
)


def call_row(output: str, call_id: str, tool: str = "shell", done: bool = True) -> dict:
    return {
        "role": "tool",
        "content": tool,
        "meta": {"done": done, "output": output, "tool_call_id": call_id},
    }


# An auto-approved call is written twice, granted and completed, with the same
# output both times. Counting rows would make two real failures look like four.
duplicated = [
    call_row("Error: connection refused", "call-a"),
    call_row("Error: connection refused", "call-a"),
    call_row("Error: connection refused", "call-b"),
    call_row("Error: connection refused", "call-b"),
]
check(
    "a repeated transcript row does not count as a second failure",
    detect_error_loops([loop_slot(duplicated)]) == [],
    repr(detect_error_loops([loop_slot(duplicated)])),
)
three_calls = duplicated + [call_row("Error: connection refused", "call-c")]
check(
    "three distinct failing calls are still a loop",
    len(detect_error_loops([loop_slot(three_calls)])) == 1,
)
check(
    "the loop counts calls, not transcript rows",
    detect_error_loops([loop_slot(three_calls)])[0].repeats == 3,
    repr(detect_error_loops([loop_slot(three_calls)])[0].repeats),
)
check(
    "a call still in flight has no verdict to count",
    detect_error_loops([loop_slot([
        call_row("Error: connection refused", "call-a", done=False),
        call_row("Error: connection refused", "call-b", done=False),
        call_row("Error: connection refused", "call-c", done=False),
    ])]) == [],
)
check(
    "old failures outside the tail are ignored",
    detect_error_loops([loop_slot(same_failure + [tool_row("ok") for _ in range(60)])]) == [],
)
check(
    "loop skip_keys are honoured",
    detect_error_loops([loop_slot(same_failure)], skip_keys=frozenset({"loop-1"})) == [],
)
private_loop = detect_error_loops([loop_slot(same_failure, memory_mode="incognito")])
check("private loops are not named", private_loop and private_loop[0].label == "A private session")

# -- model-written stall reasons ---------------------------------------------
#
# Only the pure halves are checked here: prompt construction and reply cleanup.
# The call itself lives in the watcher and needs a gateway, so it stays out.

check(
    "a transcript with no rows yields no prompt",
    build_reason_prompt({"messages": []}) is None,
)
check(
    "a prompt carries the recent rows",
    "npm run build" in (build_reason_prompt({
        "messages": [
            {"role": "assistant", "content": "Rebuilding the bundle"},
            {"role": "tool", "meta": {"tool": "shell", "output": "npm run build"}},
        ]
    }) or ""),
)
huge = {"messages": [{"role": "tool", "meta": {"tool": "shell", "output": "x" * 5000}}]}
check(
    "one giant tool output cannot flood the prompt",
    len(build_reason_prompt(huge) or "") < 1200,
    str(len(build_reason_prompt(huge) or "")),
)
check(
    "a reply is reduced to its first sentence",
    clean_reason("It was running the test suite. Then it stopped responding.")
    == "It was running the test suite.",
    repr(clean_reason("It was running the test suite. Then it stopped responding.")),
)
check(
    "a labelled reply loses the label",
    clean_reason('Sentence: "It was waiting on a build."') == "It was waiting on a build.",
    repr(clean_reason('Sentence: "It was waiting on a build."')),
)
check(
    "an overlong reply is capped",
    len(clean_reason("word " * 200) or "") <= REASON_MAX_CHARS,
    str(len(clean_reason("word " * 200) or "")),
)
for junk in ("", "   ", None, 42, "\n\n"):
    check(f"unusable reply {junk!r} yields nothing", clean_reason(junk) is None)

# -- past-work recall ---------------------------------------------------------
#
# The pure halves run offline. The filtering is exercised against a FAKE
# conversation log, because each dropped row is a security invariant and a test
# that only proves "it returns something" would not notice one going missing.

check("a one-character query is not searchable", not query_is_searchable("a"))
check("a two-character query is searchable", query_is_searchable("ab"))
check(
    "whitespace collapses in a query",
    normalize_query("  hello   world ") == "hello world",
    repr(normalize_query("  hello   world ")),
)
check("a non-string query is empty", normalize_query(None) == "")
check("a junk limit falls back", clamp_limit("abc") == RECALL_LIMIT_DEFAULT)
check("a huge limit is capped", clamp_limit(9999) == RECALL_LIMIT_MAX)
check("a zero limit falls back", clamp_limit(0) == RECALL_LIMIT_DEFAULT)


class _FakeLog:
    """Stands in for ConversationLog with one row per behaviour under test."""

    def __init__(self) -> None:
        self.read_keys: list[str] = []

    def search_sessions(self, query, limit=0):
        return [
            {"key": "public", "title": "Ack contention", "modified": 100},
            {"key": "private", "title": "Secret spike", "modified": 99},
            {"key": "other-ws", "title": "Someone else's work", "modified": 98},
            {"key": "vanished", "title": "Rotated away", "modified": 97},
        ]

    def has_log(self, key):
        return key != "vanished"

    def get_metadata(self, key):
        if key == "private":
            return {"memory_mode": "incognito", "workspace": "default"}
        if key == "other-ws":
            return {"workspace": "elsewhere"}
        return {"workspace": "default"}

    def read_messages(self, key):
        self.read_keys.append(key)
        return [{"role": "user", "content": f"transcript of {key}"}]


class _FakeCore:
    _SEARCH_HISTORY_SCAN = 200

    @staticmethod
    def _history_is_incognito(meta):
        return str((meta or {}).get("memory_mode") or "") in {"incognito", "temporary"}

    @staticmethod
    def _extract_history_snippet(messages, query):
        # A real extractor takes a window AROUND the match, so the query term is
        # present by construction. The fake must do the same or it fails the
        # snippet-quality gate for the wrong reason.
        return f"we talked about {query} in the {messages[0]['content']}"

    @staticmethod
    def _redact_history_output(text):
        return text.replace("secret", "[redacted]")

    @staticmethod
    def _ws_bucket(name):
        return name or "default"


fake_log = _FakeLog()
recall._load_backend = lambda: (lambda: fake_log, _FakeCore)  # type: ignore[assignment]
rows = recall._search_blocking("ack", 10, "default")
keys = [r["session_key"] for r in rows]

check("a matching public session is recalled", keys == ["public"], repr(keys))
check("a private session never surfaces", "private" not in keys)
check("another workspace never surfaces", "other-ws" not in keys)
check("a vanished file yields no ghost row", "vanished" not in keys)
check(
    "a private session's transcript is never even read",
    "private" not in fake_log.read_keys,
    repr(fake_log.read_keys),
)
check("the snippet comes back", rows and "ack" in rows[0]["snippet"], repr(rows))

fake_log2 = _FakeLog()
recall._load_backend = lambda: (lambda: fake_log2, _FakeCore)  # type: ignore[assignment]
check(
    "an unknowable workspace filters nothing but still drops private rows",
    [r["session_key"] for r in recall._search_blocking("ack", 10, None)]
    == ["public", "other-ws"],
    repr([r["session_key"] for r in recall._search_blocking("ack", 10, None)]),
)

recall._load_backend = lambda: None  # type: ignore[assignment]
check(
    "no history backend yields no rows rather than an error",
    recall._search_blocking("ack", 10, "default") == [],
)

# Snippet quality. The bad samples below are REAL output observed against the
# user's own transcripts, not invented shapes.
check(
    "a filename fragment is not a snippet",
    not snippet_is_useful(
        "…ds/40afadcfb4184b008c02ca16e06121ae_Screenshot_2026-08-10_at_11.44.05",
        "grouping",
    ),
)
check(
    "a snippet without the query term is dropped",
    not snippet_is_useful("machine-checkable, exact numbers: WCAG contrast ratios", "grouping"),
)
check(
    "a prose snippet containing the term is kept",
    snippet_is_useful("we discussed session folder grouping and pinned work streams", "grouping"),
)
check("an empty snippet is not useful", not snippet_is_useful("", "grouping"))
check("a non-string snippet is not useful", not snippet_is_useful(None, "grouping"))
check(
    "a multi-word query matches on any of its terms",
    snippet_is_useful("the grouping rule changed", "session grouping model"),
)
check(
    "a CJK query matches on a character pair",
    snippet_is_useful("我们讨论了分组的方案", "分组"),
)
check(
    "a one-character query cannot validate a snippet",
    not snippet_is_useful("anything at all", "x"),
)

# Re-centring: the visible window must start near the term, not 300 chars away.
long_tail = ("boilerplate " * 30) + "we changed the grouping rule " + ("filler " * 30)
focused = focus_snippet(long_tail, "grouping")
check(
    "the focused window contains the term",
    "grouping" in focused,
    repr(focused[:80]),
)
check(
    "the focused window starts near the term, not at the transcript's start",
    focused.index("grouping") < 120,
    str(focused.index("grouping")),
)
check(
    "a trimmed start is marked with an ellipsis",
    focused.startswith("… "),
    repr(focused[:12]),
)
check(
    "a short snippet is returned unchanged apart from whitespace",
    focus_snippet("  the grouping   rule  ", "grouping") == "the grouping rule",
    repr(focus_snippet("  the grouping   rule  ", "grouping")),
)
check(
    "a snippet without the term is left alone rather than mangled",
    focus_snippet("nothing relevant here", "grouping") == "nothing relevant here",
)
check("focusing an empty snippet yields empty", focus_snippet("", "grouping") == "")
check(
    "a multi-word query focuses on whichever term appears first",
    "grouping" in focus_snippet(long_tail, "session grouping"),
)

# The real shape that exposed an ordering bug: the extractor's window OPENS on an
# upload filename and only later reaches the sentence that mentions the query.
# Judging the raw start discarded a good snippet; focusing first keeps it.
real_shape = (
    "…ds/40afadcfb4184b008c02ca16e06121ae_Screenshot_2026-08-10_at_11.44.05_AM.png)\n\n"
    "I'm working on the UI for session folder <<<grouping>>> for kiro web. "
    "How do I make this list useful"
)
check(
    "the raw start alone would have rejected it",
    not snippet_is_useful(real_shape, "grouping"),
)
focused_real = strip_match_markers(focus_snippet(real_shape, "grouping"))
check(
    "focusing first rescues the usable sentence",
    snippet_is_useful(focused_real, "grouping"),
    repr(focused_real[:90]),
)
check(
    "highlight markers are stripped",
    "<<<" not in focused_real and ">>>" not in focused_real,
    repr(focused_real[:90]),
)
check(
    "the rescued snippet reads as the sentence, not the filename",
    "session folder grouping" in focused_real,
    repr(focused_real[:90]),
)

# --- initiatives: this app's own goal store + the one-time projects.md import --
import os  # noqa: E402
import tempfile  # noqa: E402
from pathlib import Path as _Path  # noqa: E402
import initiatives as _init  # noqa: E402

_PROJECTS_SAMPLE = """
<!-- comment the parser must skip -->
- **Crew Companion** — macOS desktop pet; aliases: Desktop Buddy, mochi, the pet
- **Design Critique** — UI critique skill
- not a bucket line
- **Crew Companion** — duplicate must be dropped
"""
_buckets = _init.parse_projects(_PROJECTS_SAMPLE)
check("import parses one bucket per bold line", len(_buckets) == 2, repr([b["name"] for b in _buckets]))
check(
    "the display name always leads the alias list",
    _buckets[0]["aliases"][0] == "Crew Companion",
    repr(_buckets[0]["aliases"]),
)
check(
    "aliases split on commas",
    "mochi" in _buckets[0]["aliases"] and "the pet" in _buckets[0]["aliases"],
    repr(_buckets[0]["aliases"]),
)
check("empty text degrades to no buckets", _init.parse_projects("") == [])

# The store round-trips through THROWAWAY dirs — never the real app dir or home.
with tempfile.TemporaryDirectory() as _tmp:
    _prior_goals_file = _init.goals_file
    _prior_home = os.environ.get("KIROCREW_HOME")
    _init.goals_file = lambda: _Path(_tmp) / "data" / "goals.json"  # type: ignore[assignment]
    os.environ["KIROCREW_HOME"] = str(_Path(_tmp) / "home")
    try:
        # First run with a projects.md present: buckets are imported once.
        _memory = _Path(_tmp) / "home" / "workspace" / "memory"
        _memory.mkdir(parents=True)
        (_memory / "projects.md").write_text(_PROJECTS_SAMPLE, encoding="utf-8")
        _first = _init.load_initiatives()
        check("first run imports projects.md as the initial goals",
              any(b["name"] == "Crew Companion" for b in _first), repr([b["name"] for b in _first]))
        # After import the store is Crew Manager's own: edits to projects.md
        # must NOT leak in.
        (_memory / "projects.md").write_text("- **Later Project** — added after\n", encoding="utf-8")
        check("projects.md changes never leak in after the import",
              not any(b["name"] == "Later Project" for b in _init.load_initiatives()))

        _added = _init.add_initiative("Crew Manager", ["overwatch", "crew-manager"])
        check("add_initiative persists and returns the bucket",
              any(b["name"] == "Crew Manager" for b in _added))
        _cm = next((b for b in _init.load_initiatives() if b["name"] == "Crew Manager"), None)
        check("the stored goal round-trips with its aliases",
              _cm is not None and "overwatch" in _cm["aliases"], repr(_cm))
        _again = _init.add_initiative("crew manager", [])
        check("adding the same name again is idempotent",
              sum(1 for b in _again if b["name"].lower() == "crew manager") == 1)
        _bad = False
        try:
            _init.add_initiative("   ")
        except ValueError:
            _bad = True
        check("a blank name is refused", _bad)
        _left = _init.remove_initiative("Crew Manager")
        check("remove_initiative drops the goal",
              not any(b["name"] == "Crew Manager" for b in _left))
    finally:
        _init.goals_file = _prior_goals_file  # type: ignore[assignment]
        if _prior_home is None:
            os.environ.pop("KIROCREW_HOME", None)
        else:
            os.environ["KIROCREW_HOME"] = _prior_home

print()
if FAILURES:
    print(f"{len(FAILURES)} failing check(s): {', '.join(FAILURES)}")
    sys.exit(1)
print("all stall-detection checks passed")
