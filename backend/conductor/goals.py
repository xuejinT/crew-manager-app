"""The goal model — what the operator declared, and the only thing allowed to say "done".

Today's goals are display-only: ``initiatives.py`` stores ``{name, aliases}`` and
the browser clusters work items against them. Nothing the operator writes reaches
a session, and nothing the operator writes can *end* anything. This module is the
other half: a goal becomes a declaration with a **termination predicate**, and a
goal with no termination predicate is a draft that is never dispatched for.

Three properties are load-bearing and are why this file looks the way it does.

* **One file per goal** (``data/conductor/goals/<id>.json``). At five goals across
  thirty sessions a single ``goals.json`` makes every write contend on one lock,
  and one corrupt goal fails the whole load. Per-goal files degrade to *one
  skipped goal*, and the operator can open one and fix it — which is the entire
  reason goals are files and not rows in ``ctx.storage`` (which is ``None`` here
  anyway: ``app.json`` declares ``storage: false``).

* **I8: a model may veto a completion claim; it may never satisfy one.**
  :func:`evaluate_done_when` is deterministic top to bottom. It reads the
  filesystem and the goal's own leaf statuses and nothing else — no LLM, no
  network, no subprocess. That is not a style preference: the single most
  expensive failure available to this feature is a supervisor that talks itself
  into "done", and the cheapest structural defence is that the function which
  answers the question cannot form an opinion.

* **A malformed predicate is kept, never dropped.** Everywhere else in this app a
  bad record is skipped (``autonudge``'s per-entry fail-open, ``read_json``'s
  treat-corruption-as-absent). Here that direction is *wrong*: dropping an
  unsatisfiable ``done_when`` line makes the goal EASIER to satisfy. A predicate
  we cannot parse is retained and reports ``satisfied: False`` forever, so a
  hand-edit typo stalls a goal loudly instead of completing it quietly.

**Deliberately excluded from the v1 vocabulary: ``command_exits_zero``.** It is by
some distance the most useful predicate — "the tests pass" is what an operator
actually means — and it is the one that hands the supervisor a shell. There is no
way to evaluate it without an executable, and once an executable string is a
field in an operator-editable JSON file the Conductor has a general-purpose
command path that bypasses ``cron_command``, ``shell`` and ``trust_command``
being hard-denied in :mod:`intents`. It returns later behind a per-goal allowlist
of exact argv, executed off the gateway loop, never as a free-form string.

Two more predicates from the plan's prose list are **not** here for the same
family of reasons: ``pr_merged`` and ``checks_green`` need a provider read, and a
provider read cannot happen inside a deterministic synchronous predicate
evaluator — it is network I/O with its own circuit breaker, cache staleness and
an explicit ``unknown`` state. Those live in the PR registry (Increment 7) and
reach a goal as a leaf status, so they arrive here through ``leaf_closed``.

Nothing in this module imports the gateway, so it is importable for the offline
selftest with no host present.
"""

from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import math
import re
import sys
import time
import uuid
from dataclasses import asdict, dataclass, field, fields
from enum import Enum
from itertools import islice
from pathlib import Path, PurePosixPath
from typing import Any, Iterable

from . import store
from .intents import ACTION_CLASSES, is_hard_denied

logger = logging.getLogger(__name__)

# VERIFIED: backend/routes.py:38 puts ``backend/`` on ``sys.path`` before the
# gateway loads anything else, so ``import detect`` normally resolves; the retry
# covers a caller that imported this module first (the pattern and its reasoning
# are observe.py:66-70's). Timestamp coercion MUST be
# ``detect.epoch_secs`` and not a local reimplementation: slot timestamps arrive
# as ISO strings, as seconds and as milliseconds depending on the writer.
# VERIFIED: detect.py:77 handles all three; observe.py:324 types
# ``SlotFacts.last_turn_ts`` as ``str`` (an isoformat), so a naive ``float()``
# here would yield 0.0 for EVERY session and make :func:`facts_hash` blind to the
# one fact that most reliably means "something happened".
try:
    from detect import epoch_secs as _epoch_secs
except ImportError:  # pragma: no cover - depends on who imported first
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    try:
        from detect import epoch_secs as _epoch_secs
    except ImportError:
        _epoch_secs = None  # type: ignore[assignment]
        logger.warning(
            "conductor: detect.epoch_secs unavailable; facts_hash falls back to "
            "numeric timestamps only"
        )


# ── limits ───────────────────────────────────────────────────────────────────
# Every one of these exists to bound work done inside the gateway process. The
# numbers are first guesses on purpose: the plan's instruction is to tune
# envelopes from Increment 1's shadow ledger rather than from intuition.

MAX_TITLE_CHARS = 120
MAX_STATEMENT_CHARS = 2000
MAX_NOTES_CHARS = 4000
MAX_DONE_WHEN = 24
MAX_LEAVES = 12
"""Planner ceiling from the plan: depth ≤ 2, ≤ 12 leaves, no re-expansion."""

MAX_PATTERN_CHARS = 400
MAX_CONTAINS_CHARS = 200
MAX_GUIDANCE = 50
MAX_SCOPE_LIST = 32

MAX_GLOB_MATCHES = 200
"""How many filesystem entries one predicate may look at. Bounds a ``**`` glob
over a monorepo: the generator is cut with ``islice``, so traversal stops too."""

MAX_SCAN_BYTES = 4 * 1024 * 1024
"""Bytes of one file ``path_matches`` will read. A truncated scan is still
deterministic, and it says so in its ``detail`` rather than pretending."""

_SCAN_CHUNK = 256 * 1024


# ── vocabulary ───────────────────────────────────────────────────────────────

class GoalStatus(str, Enum):
    """``draft → active → holding | blocked | awaiting_confirmation → done | abandoned``."""

    DRAFT = "draft"
    """No ``done_when``, or not yet started. Never dispatched for."""

    ACTIVE = "active"
    HOLDING = "holding"
    """Operator hold. Budgets freeze; see ``paused_reason``."""

    BLOCKED = "blocked"
    """Non-progress or a budget ceiling; see ``terminal_reason``."""

    AWAITING_CONFIRMATION = "awaiting_confirmation"
    """Every machine predicate passed and a ``manual`` line remains."""

    DONE = "done"
    ABANDONED = "abandoned"


OPERATOR_ONLY_STATUSES: frozenset[str] = frozenset({
    GoalStatus.DONE.value, GoalStatus.ABANDONED.value,
})
"""Only the operator moves a goal here in v1. Exported so :mod:`control` and the
route layer enforce one list rather than two."""

TERMINAL_STATUSES: frozenset[str] = frozenset({
    GoalStatus.DONE.value, GoalStatus.ABANDONED.value,
})

DISPATCHABLE_STATUSES: frozenset[str] = frozenset({GoalStatus.ACTIVE.value})
"""``active`` and only ``active``. ``awaiting_confirmation`` is deliberately not
dispatchable: the work is done and the operator is the remaining step."""


class LeafStatus(str, Enum):
    OPEN = "open"
    RUNNING = "running"
    BLOCKED = "blocked"
    CLOSED = "closed"
    ABANDONED = "abandoned"


CLOSED_LEAF_STATUSES: frozenset[str] = frozenset({LeafStatus.CLOSED.value})
"""``abandoned`` is NOT closed. A goal whose leaves were all given up on has not
met ``all_leaves_closed``, and conflating the two is how a goal completes by
attrition."""


DONE_WHEN_KINDS: frozenset[str] = frozenset({
    "file_exists", "path_matches", "leaf_closed", "all_leaves_closed", "manual",
})

_DONE_WHEN_KEYS: dict[str, tuple[frozenset[str], frozenset[str]]] = {
    # kind -> (required keys, optional keys)
    "file_exists": (frozenset({"path"}), frozenset()),
    "path_matches": (frozenset({"path", "contains"}), frozenset()),
    "leaf_closed": (frozenset({"leaf_id"}), frozenset()),
    "all_leaves_closed": (frozenset(), frozenset()),
    "manual": (frozenset(), frozenset({"text"})),
}

DRAFT_KIND = "draft"
"""Pseudo-kind :func:`evaluate_done_when` returns for an empty ``done_when``, so
the UI can render the teachable reason without string-matching a detail."""

_ALLOWED_TIERS: frozenset[str] = frozenset({"off", "propose", "act"})
"""What a goal file may say about a class. ``deny_hard`` is not in the set: a
goal narrows to ``off``, and hard denial is a design-time property of the class,
not something a JSON file grants or withholds."""

DEFAULT_AUTHORITY: dict[str, str] = {
    **{name: "off" for name in ACTION_CLASSES},
    "context_inject": "act",
    "operator_notify": "act",
    "escalate": "act",
}
"""Per-class authority for a new goal: three classes ``act``, everything ``off``.

**Exhaustive on purpose, and this is the subtle part.** An ABSENT key is not
"off" — :func:`policy.goal_tier` falls back to the class's design-time default,
and that default is ``act`` for ``session_continue``, ``session_resume``,
``narrate``, ``pr_read`` and ``cron_pause``. A three-key map would therefore have
handed a brand-new goal turn-dispatching authority the moment the operator
switched to ``autonomous``, which is the opposite of what the plan's table says
and exactly the kind of silent widening the authority model exists to prevent.
Naming every class costs one dict comprehension.

One divergence from that table, stated so review can reverse it: the plan lists
``context_inject`` and ``operator_notify`` as the ``act`` pair, which leaves
``escalate`` off. I6 requires budget exhaustion and non-progress to *reach the
operator*; an escalation is reversible, operator-facing, dispatches no turn, and
already carries its own budget and flood guard. A goal that can act but cannot
report is the failure this whole feature exists to remove."""

DEFAULT_PATHS_DENY: tuple[str, ...] = (
    ".github/**", "CODEOWNERS", "**/migrations/**",
)
"""Unioned into every goal's ``paths_deny``, never replaced. An operator writing
``"paths_deny": []`` narrows nothing — otherwise the denylist that keeps a worker
out of CI config would be one edit away from empty, and ``write_github_workflows``
being hard-denied in :mod:`intents` would be the only remaining guard."""

DEFAULT_BUDGETS: dict[str, Any] = {
    "max_concurrent_sessions": 2,
    "wip": 2,
    "turns": 40,
    "wall_clock_secs": 6 * 3600,
    "usd": 5.0,
    "actions": {
        "session_continue": 12,
        "session_create": 4,
        "context_inject": 60,
        "escalate": 6,
        "operator_notify": 12,
    },
}

DEFAULT_CADENCE: dict[str, Any] = {"tick_secs": 60, "quiet_hours": []}

_GOAL_ID_RE = re.compile(r"^[a-z0-9][a-z0-9._-]{0,63}$")
_LEAF_ID_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$")
_SLUG_STRIP = re.compile(r"[^a-z0-9]+")


# ── small repairs, copied from autonudge's discipline ────────────────────────

def _clean_text(value: object, limit: int) -> str:
    """Collapse whitespace and truncate. Never raises, never returns ``None``."""
    text = value if isinstance(value, str) else ("" if value is None else str(value))
    return " ".join(text.split())[:limit]


def _clean_body(value: object, limit: int) -> str:
    """Like :func:`_clean_text` but keeps newlines — statements are paragraphs."""
    text = value if isinstance(value, str) else ("" if value is None else str(value))
    return text.replace("\r\n", "\n").strip()[:limit]


def _repair_int(value: object, *, default: int, minimum: int, maximum: int) -> int:
    """Coerce to a bounded int, falling back on anything unrepresentable.

    ``OverflowError`` is caught explicitly: a persisted ``10**400`` is a valid
    Python int that ``float()`` refuses, and ``nan``/``inf`` round-trip through
    JSON as ``NaN``/``Infinity`` which is not JSON at all. This is
    ``autonudge.py``'s ``_repair_number``, and each clause in it is a paid-for bug.
    """
    try:
        num = float(value)  # type: ignore[arg-type]
    except (TypeError, ValueError, OverflowError):
        return default
    if not math.isfinite(num):
        return default
    return int(max(minimum, min(maximum, num)))


def _repair_float(value: object, *, default: float, minimum: float, maximum: float) -> float:
    try:
        num = float(value)  # type: ignore[arg-type]
    except (TypeError, ValueError, OverflowError):
        return default
    if not math.isfinite(num):
        return default
    return max(minimum, min(maximum, num))


def _str_list(value: object, *, limit: int = MAX_SCOPE_LIST, item_chars: int = MAX_PATTERN_CHARS) -> list[str]:
    if not isinstance(value, (list, tuple)):
        return []
    out: list[str] = []
    for item in value:
        text = _clean_text(item, item_chars)
        if text and text not in out:
            out.append(text)
        if len(out) >= limit:
            break
    return out


# ── done_when validation ─────────────────────────────────────────────────────

def _pattern_error(pattern: object, field_name: str) -> str | None:
    """Why *pattern* is not an acceptable scope-relative glob, or ``None``.

    Rejected here rather than sanitised, because there is no honest repair for
    ``../../etc/passwd``: silently rewriting it would leave the operator with a
    predicate that does not mean what they wrote. ``..`` genuinely escapes —
    ``Path('root').glob('../outside/*')`` returns matches outside ``root``
    (verified on this interpreter), so this check is a real boundary and not a
    tidiness rule. :func:`_iter_matches` re-checks containment after resolution
    to catch the case a pattern cannot express: a symlinked directory component,
    which ``glob`` *does* follow when named explicitly.
    """
    if not isinstance(pattern, str) or not pattern.strip():
        return f"{field_name} must be a non-empty string"
    text = pattern.strip()
    if len(text) > MAX_PATTERN_CHARS:
        return f"{field_name} is longer than {MAX_PATTERN_CHARS} characters"
    if "\x00" in text:
        return f"{field_name} contains a NUL byte"
    if text.startswith("~"):
        return f"{field_name} must be relative to the scope root (no '~')"
    if "\\" in text:
        return f"{field_name} must use '/' separators"
    if PurePosixPath(text).is_absolute() or re.match(r"^[A-Za-z]:", text):
        return f"{field_name} must be relative to the scope root"
    if any(part == ".." for part in PurePosixPath(text).parts):
        return f"{field_name} must not contain '..'"
    return None


def _predicate_errors(entry: object, index: int) -> list[str]:
    """All the reasons one ``done_when`` entry is unusable. Empty list ⇒ valid."""
    where = f"done_when[{index}]"
    if not isinstance(entry, dict):
        return [f"{where} must be an object"]
    kind = entry.get("kind")
    if not isinstance(kind, str) or not kind:
        return [f"{where} is missing 'kind'"]
    if kind not in DONE_WHEN_KINDS:
        # Named explicitly so the operator learns the vocabulary instead of
        # guessing, and so the one predicate we removed on purpose says why.
        extra = ""
        if kind == "command_exits_zero":
            extra = " (excluded from v1 on purpose: it is a shell)"
        return [
            f"{where}: unknown kind {kind!r}{extra}; "
            f"allowed: {', '.join(sorted(DONE_WHEN_KINDS))}"
        ]

    required, optional = _DONE_WHEN_KEYS[kind]
    present = {k for k in entry if k != "kind"}
    errors: list[str] = []
    for key in sorted(required - present):
        errors.append(f"{where}: {kind} requires '{key}'")
    for key in sorted(present - required - optional):
        # Strict about extra keys: a typo'd 'pattern' where 'contains' belongs
        # would otherwise validate and then never be satisfiable.
        errors.append(f"{where}: {kind} does not take {key!r}")

    if kind in {"file_exists", "path_matches"} and "path" in present:
        problem = _pattern_error(entry.get("path"), f"{where}.path")
        if problem:
            errors.append(problem)
    if kind == "path_matches" and "contains" in present:
        needle = entry.get("contains")
        if not isinstance(needle, str) or not needle:
            errors.append(f"{where}.contains must be a non-empty literal string")
        elif len(needle) > MAX_CONTAINS_CHARS:
            errors.append(f"{where}.contains is longer than {MAX_CONTAINS_CHARS} characters")
    if kind == "leaf_closed":
        leaf_id = entry.get("leaf_id")
        if not isinstance(leaf_id, str) or not _LEAF_ID_RE.match(leaf_id):
            errors.append(f"{where}.leaf_id must match {_LEAF_ID_RE.pattern}")
    if kind == "manual" and "text" in present:
        if not isinstance(entry.get("text"), str):
            errors.append(f"{where}.text must be a string")
    return errors


def validate_done_when(entries: object) -> tuple[bool, list[str]]:
    """``(ok, errors)`` for a whole ``done_when`` list. Used by the route layer.

    An empty list is **valid but not satisfiable** — that is the draft state, not
    an input error, so the operator can save a half-written goal and come back to
    it. :func:`evaluate_done_when` is where empty stops being free.
    """
    if entries is None:
        return True, []
    if not isinstance(entries, (list, tuple)):
        return False, ["done_when must be a list"]
    if len(entries) > MAX_DONE_WHEN:
        return False, [f"done_when has more than {MAX_DONE_WHEN} entries"]
    errors: list[str] = []
    for index, entry in enumerate(entries):
        errors.extend(_predicate_errors(entry, index))
    return (not errors), errors


def _normalize_done_when(entries: object) -> list[dict[str, Any]]:
    """Keep every entry, valid or not. See the module docstring on why."""
    if not isinstance(entries, (list, tuple)):
        return []
    out: list[dict[str, Any]] = []
    for entry in list(entries)[:MAX_DONE_WHEN]:
        if isinstance(entry, dict):
            out.append(dict(entry))
        else:
            out.append({"kind": DRAFT_KIND, "invalid": repr(entry)[:200]})
    return out


# ── leaf validation ──────────────────────────────────────────────────────────

def validate_leaves(leaves: object) -> tuple[bool, list[str]]:
    """``(ok, errors)`` for the leaf list, including the dependency graph.

    ``depends_on`` cycles are rejected rather than tolerated. The field gates
    dispatch only, so a cycle does not deadlock the platform — it deadlocks the
    *goal*, silently and forever, which is precisely the "goal never terminates"
    failure the termination rules exist to prevent. Cheap to detect here, and
    impossible to detect from a log later.
    """
    if leaves is None:
        return True, []
    if not isinstance(leaves, (list, tuple)):
        return False, ["leaves must be a list"]
    if len(leaves) > MAX_LEAVES:
        return False, [f"leaves has more than {MAX_LEAVES} entries"]

    errors: list[str] = []
    ids: list[str] = []
    edges: dict[str, list[str]] = {}
    for index, leaf in enumerate(leaves):
        where = f"leaves[{index}]"
        if not isinstance(leaf, dict):
            errors.append(f"{where} must be an object")
            continue
        leaf_id = leaf.get("id")
        if not isinstance(leaf_id, str) or not _LEAF_ID_RE.match(leaf_id):
            errors.append(f"{where}.id must match {_LEAF_ID_RE.pattern}")
            continue
        if leaf_id in ids:
            errors.append(f"{where}.id {leaf_id!r} is a duplicate")
            continue
        ids.append(leaf_id)

        status = leaf.get("status", LeafStatus.OPEN.value)
        if status not in {s.value for s in LeafStatus}:
            errors.append(f"{where}.status {status!r} is not a leaf status")
        ok, leaf_errors = validate_done_when(leaf.get("done_when"))
        if not ok:
            errors.extend(f"{where}.{msg}" for msg in leaf_errors)
        for pattern in leaf.get("predicted_paths") or []:
            problem = _pattern_error(pattern, f"{where}.predicted_paths[]")
            if problem:
                errors.append(problem)
        deps = leaf.get("depends_on") or []
        if not isinstance(deps, (list, tuple)):
            errors.append(f"{where}.depends_on must be a list")
            deps = []
        edges[leaf_id] = [d for d in deps if isinstance(d, str)]
        if leaf_id in edges[leaf_id]:
            errors.append(f"{where}.depends_on names itself")

    known = set(ids)
    for leaf_id, deps in edges.items():
        for dep in deps:
            if dep not in known:
                errors.append(f"leaf {leaf_id!r} depends on unknown leaf {dep!r}")
    cycle = _first_cycle({k: [d for d in v if d in known] for k, v in edges.items()})
    if cycle:
        errors.append("depends_on has a cycle: " + " -> ".join(cycle))
    return (not errors), errors


def _first_cycle(edges: dict[str, list[str]]) -> list[str]:
    """One cycle in *edges* as a path, or ``[]``. Iterative — no recursion limit."""
    WHITE, GREY, BLACK = 0, 1, 2
    colour = {node: WHITE for node in edges}
    for root in edges:
        if colour[root] != WHITE:
            continue
        stack: list[tuple[str, list[str]]] = [(root, [root])]
        colour[root] = GREY
        while stack:
            node, path = stack[-1]
            nxt = None
            for dep in edges.get(node, ()):
                if colour.get(dep) == GREY:
                    return path[path.index(dep):] + [dep]
                if colour.get(dep, BLACK) == WHITE:
                    nxt = dep
                    break
            if nxt is None:
                colour[node] = BLACK
                stack.pop()
            else:
                colour[nxt] = GREY
                stack.append((nxt, path + [nxt]))
    return []


# ── scope / authority / budgets ──────────────────────────────────────────────

def _normalize_scope(raw: object) -> dict[str, Any]:
    src = raw if isinstance(raw, dict) else {}
    deny = _str_list(src.get("paths_deny"))
    for default in DEFAULT_PATHS_DENY:
        if default not in deny:
            deny.append(default)
    return {
        "workspace": _clean_text(src.get("workspace"), 200),
        "project": _clean_text(src.get("project"), 200),
        "repos": _str_list(src.get("repos")),
        "aliases": _str_list(src.get("aliases"), item_chars=200),
        "adopt_slots": _str_list(src.get("adopt_slots"), item_chars=200),
        "report_only_slots": _str_list(src.get("report_only_slots"), item_chars=200),
        "paths_allow": _str_list(src.get("paths_allow")),
        "paths_deny": deny[: MAX_SCOPE_LIST + len(DEFAULT_PATHS_DENY)],
        # The approval mode the OPERATOR declares for workers this goal dispatches.
        # Only the platform's two slot-scoped modes are accepted, and anything else
        # (notably ``yolo``, which is global) normalizes to "" = born untrusted.
        # This is a declaration the executor carries out, never something the driver
        # may choose: ``trust`` remains in the Conductor's hard-DENY set.
        "worker_trust": (
            _clean_text(src.get("worker_trust"), 20)
            if str(src.get("worker_trust") or "").strip().lower()
            in ("trust", "trust_reads")
            else ""
        ),
        # Where the goal's done_when path predicates are rooted. Preserved so a
        # goal can name its own working tree instead of the caller having to
        # remember it on every evaluation.
        "root": _clean_text(src.get("root"), 400),
    }


def validate_authority(raw: object) -> tuple[bool, list[str]]:
    """``(ok, errors)`` for a per-class authority map.

    A hard-denied class named at all is an error rather than a silent no-op.
    :func:`policy.goal_tier` would already refuse it — this exists so the
    operator gets told "you asked for X; that requires you" at write time instead
    of wondering why the line they added does nothing.
    """
    if raw is None:
        return True, []
    if not isinstance(raw, dict):
        return False, ["authority must be an object"]
    errors: list[str] = []
    for key, value in raw.items():
        if is_hard_denied(str(key)):
            errors.append(f"authority.{key} is hard-denied: no authority level grants it")
            continue
        if key not in ACTION_CLASSES:
            errors.append(f"authority.{key} is not a known action class")
            continue
        if value not in _ALLOWED_TIERS:
            errors.append(
                f"authority.{key} must be one of {', '.join(sorted(_ALLOWED_TIERS))}"
            )
    return (not errors), errors


def _normalize_authority(raw: object) -> dict[str, str]:
    """Drop unusable entries. Dropping is safe here *because* the caller layers
    this over :data:`DEFAULT_AUTHORITY` — see :func:`_authority_with_floor`."""
    src = raw if isinstance(raw, dict) else {}
    out: dict[str, str] = {}
    for key, value in src.items():
        name = str(key)
        if name in ACTION_CLASSES and not is_hard_denied(name) and value in _ALLOWED_TIERS:
            out[name] = str(value)
    return out


def _authority_with_floor(raw: object) -> dict[str, str]:
    """*raw* layered over the all-``off`` floor, so a partial map cannot widen.

    Applied on BOTH the read and the write path. A hand-written goal file saying
    only ``{"session_continue": "act"}`` gets that one grant plus the floor —
    rather than the class defaults, which are ``act`` for five more classes. The
    cost is that a goal file cannot express "use the class default"; it gets
    ``off`` instead. That is the narrowing direction, and "a goal may only narrow,
    never widen" is the property being protected.
    """
    return {**DEFAULT_AUTHORITY, **_normalize_authority(raw)}


def _normalize_budgets(raw: object) -> dict[str, Any]:
    src = raw if isinstance(raw, dict) else {}
    actions_src = src.get("actions") if isinstance(src.get("actions"), dict) else {}
    actions: dict[str, int] = {}
    for key, value in {**DEFAULT_BUDGETS["actions"], **actions_src}.items():
        name = str(key)
        if name not in ACTION_CLASSES:
            continue
        actions[name] = _repair_int(
            value, default=int(DEFAULT_BUDGETS["actions"].get(name, 0)),
            minimum=0, maximum=10_000,
        )
    return {
        "max_concurrent_sessions": _repair_int(
            src.get("max_concurrent_sessions"),
            default=DEFAULT_BUDGETS["max_concurrent_sessions"], minimum=0, maximum=32,
        ),
        "wip": _repair_int(src.get("wip"), default=DEFAULT_BUDGETS["wip"], minimum=0, maximum=32),
        "turns": _repair_int(
            src.get("turns"), default=DEFAULT_BUDGETS["turns"], minimum=0, maximum=100_000,
        ),
        "wall_clock_secs": _repair_int(
            src.get("wall_clock_secs"), default=DEFAULT_BUDGETS["wall_clock_secs"],
            minimum=0, maximum=30 * 24 * 3600,
        ),
        "usd": _repair_float(
            src.get("usd"), default=DEFAULT_BUDGETS["usd"], minimum=0.0, maximum=10_000.0,
        ),
        "actions": actions,
    }


def _normalize_cadence(raw: object) -> dict[str, Any]:
    src = raw if isinstance(raw, dict) else {}
    quiet: list[list[int]] = []
    for window in src.get("quiet_hours") or []:
        if isinstance(window, (list, tuple)) and len(window) == 2:
            start = _repair_int(window[0], default=0, minimum=0, maximum=23)
            end = _repair_int(window[1], default=0, minimum=0, maximum=23)
            quiet.append([start, end])
        if len(quiet) >= 8:
            break
    return {
        "tick_secs": _repair_int(
            src.get("tick_secs"), default=DEFAULT_CADENCE["tick_secs"], minimum=15, maximum=3600,
        ),
        "quiet_hours": quiet,
    }


def _normalize_guidance(raw: object) -> list[dict[str, Any]]:
    """Append-only steer prose, newest last. Never overwrites the statement."""
    if not isinstance(raw, (list, tuple)):
        return []
    out: list[dict[str, Any]] = []
    for entry in list(raw)[-MAX_GUIDANCE:]:
        if isinstance(entry, dict):
            text = _clean_body(entry.get("text"), MAX_STATEMENT_CHARS)
            ts = _repair_float(entry.get("ts"), default=0.0, minimum=0.0, maximum=4e18)
        else:
            text, ts = _clean_body(entry, MAX_STATEMENT_CHARS), 0.0
        if text:
            out.append({"text": text, "ts": ts})
    return out


# ── the goal ─────────────────────────────────────────────────────────────────

@dataclass
class Goal:
    """One operator declaration, as stored in ``goals/<id>.json``.

    ``status`` carries the plan's ``state`` machine. The field is named ``status``
    because that is what the rest of this module and the route layer were written
    against; :meth:`from_json` accepts a legacy/hand-written ``state`` key when
    ``status`` is absent, and :meth:`to_json` writes ``status`` only. Writing both
    was rejected: the operator editing one of two mirrored keys by hand is a bug
    that cannot be detected, and hand-editing is the whole reason these are files.
    """

    id: str
    title: str
    statement: str = ""
    done_when: list[dict[str, Any]] = field(default_factory=list)
    authority: dict[str, str] = field(default_factory=lambda: dict(DEFAULT_AUTHORITY))
    scope: dict[str, Any] = field(default_factory=lambda: _normalize_scope(None))
    budgets: dict[str, Any] = field(default_factory=lambda: _normalize_budgets(None))
    leaves: list[dict[str, Any]] = field(default_factory=list)
    status: str = GoalStatus.DRAFT.value
    created_ts: float = field(default_factory=time.time)
    updated_ts: float = field(default_factory=time.time)
    notes: str = ""

    # Fields beyond the core declaration, each required by a named mechanism.
    activated_ts: float = 0.0
    """Wall-clock anchor for ``wall_clock_secs``. Persisted so a restart cannot
    reset the budget — the plan's explicit requirement, and the difference
    between a ceiling and a suggestion."""

    guidance: list[dict[str, Any]] = field(default_factory=list)
    """Steer prose, appended never overwritten."""

    cadence: dict[str, Any] = field(default_factory=lambda: dict(DEFAULT_CADENCE))

    paused_reason: str = ""
    """Why the OPERATOR stopped this goal. Cleared only by an explicit resume."""

    terminal_reason: str = ""
    """Why the DRIVER stopped: ``turn_budget``, ``runtime_budget``, ``usd_budget``,
    ``action_cap:<class>``, ``non_progress``. Two fields rather than one for the
    same reason the cron store splits ``operator_stopped`` from ``auto_stopped``:
    a held goal must not be indistinguishable from a budget-stopped one, or
    raising a budget silently resumes work the operator paused."""

    # -- serialization -----------------------------------------------------

    @classmethod
    def from_json(cls, payload: object, *, goal_id: str = "") -> Goal | None:
        """Build a goal from a loaded file, or ``None`` if it is not a goal.

        Per-field fail-open, per ``autonudge``'s ``_load``: a junk budget becomes
        the default and the goal still loads. Two exceptions, both deliberate:
        ``done_when`` entries are never repaired (dropping one weakens the
        termination test) and an unrecognised ``status`` collapses to ``draft``,
        which fails closed — a goal with a typo'd state stops being dispatched
        for rather than inheriting ``active``.
        """
        if not isinstance(payload, dict):
            return None
        ident = _clean_text(goal_id or payload.get("id"), 64).lower()
        if not _GOAL_ID_RE.match(ident):
            return None
        title = _clean_text(payload.get("title"), MAX_TITLE_CHARS) or ident
        raw_status = payload.get("status", payload.get("state"))
        status = raw_status if raw_status in {s.value for s in GoalStatus} else GoalStatus.DRAFT.value
        if raw_status is not None and status != raw_status:
            logger.warning(
                "conductor: goal %s has unknown status %r; treated as draft", ident, raw_status
            )
        created = _repair_float(payload.get("created_ts"), default=0.0, minimum=0.0, maximum=4e18)
        return cls(
            id=ident,
            title=title,
            statement=_clean_body(payload.get("statement"), MAX_STATEMENT_CHARS),
            done_when=_normalize_done_when(payload.get("done_when")),
            authority=_authority_with_floor(payload.get("authority")),
            scope=_normalize_scope(payload.get("scope")),
            budgets=_normalize_budgets(payload.get("budgets")),
            leaves=_normalize_leaves(payload.get("leaves")),
            status=status,
            created_ts=created or time.time(),
            updated_ts=_repair_float(
                payload.get("updated_ts"), default=created, minimum=0.0, maximum=4e18
            ),
            notes=_clean_body(payload.get("notes"), MAX_NOTES_CHARS),
            activated_ts=_repair_float(
                payload.get("activated_ts"), default=0.0, minimum=0.0, maximum=4e18
            ),
            guidance=_normalize_guidance(payload.get("guidance")),
            cadence=_normalize_cadence(payload.get("cadence")),
            paused_reason=_clean_text(payload.get("paused_reason"), 200),
            terminal_reason=_clean_text(payload.get("terminal_reason"), 200),
        )

    def to_json(self) -> dict[str, Any]:
        return asdict(self)

    # -- derived -----------------------------------------------------------

    def is_draft(self) -> bool:
        """No termination predicate ⇒ draft, whatever the file says.

        Derived rather than trusted, so a hand-edited ``"status": "active"`` on a
        goal with an empty ``done_when`` cannot make it dispatchable."""
        return not self.done_when or self.status == GoalStatus.DRAFT.value

    def leaf(self, leaf_id: str) -> dict[str, Any] | None:
        for item in self.leaves:
            if item.get("id") == leaf_id:
                return item
        return None


def _normalize_leaves(raw: object) -> list[dict[str, Any]]:
    if not isinstance(raw, (list, tuple)):
        return []
    out: list[dict[str, Any]] = []
    seen: set[str] = set()
    for entry in list(raw)[:MAX_LEAVES]:
        if not isinstance(entry, dict):
            continue
        leaf_id = _clean_text(entry.get("id"), 64)
        if not _LEAF_ID_RE.match(leaf_id) or leaf_id in seen:
            continue
        seen.add(leaf_id)
        status = entry.get("status", LeafStatus.OPEN.value)
        if status not in {s.value for s in LeafStatus}:
            status = LeafStatus.OPEN.value
        out.append({
            "id": leaf_id,
            "intent_text": _clean_body(entry.get("intent_text"), MAX_STATEMENT_CHARS),
            "done_when": _normalize_done_when(entry.get("done_when")),
            "predicted_paths": _str_list(entry.get("predicted_paths")),
            "depends_on": _str_list(entry.get("depends_on"), item_chars=64),
            "attempts": _repair_int(entry.get("attempts"), default=0, minimum=0, maximum=1000),
            "status": status,
            "slot": _clean_text(entry.get("slot"), 200),
        })
    return out


def validate_goal(goal: Goal) -> tuple[bool, list[str]]:
    """Everything that must hold before a goal is written to disk."""
    errors: list[str] = []
    if not _GOAL_ID_RE.match(goal.id or ""):
        errors.append(f"id must match {_GOAL_ID_RE.pattern}")
    if not goal.title.strip():
        errors.append("title is required")
    if len(goal.title) > MAX_TITLE_CHARS:
        errors.append(f"title is longer than {MAX_TITLE_CHARS} characters")
    if len(goal.statement) > MAX_STATEMENT_CHARS:
        errors.append(f"statement is longer than {MAX_STATEMENT_CHARS} characters")
    if goal.status not in {s.value for s in GoalStatus}:
        errors.append(f"status {goal.status!r} is not a goal status")
    for check in (
        validate_done_when(goal.done_when),
        validate_leaves(goal.leaves),
        validate_authority(goal.authority),
    ):
        errors.extend(check[1])
    return (not errors), errors


# ── identity and paths ───────────────────────────────────────────────────────

def _slug(title: str) -> str:
    slug = _SLUG_STRIP.sub("-", title.lower()).strip("-")[:40].strip("-")
    return slug or "goal"


def mint_goal_id(title: str) -> str:
    """A filename-safe, human-recognisable, collision-resistant goal id.

    Slug + 6 hex, not a bare uuid: the operator is expected to open
    ``goals/ship-the-conductor-4f2a9c.json`` and fix it by hand, and a directory
    of uuids makes that impossible. The suffix is what keeps two goals called
    "Ship it" apart.

    Does up to four ``stat()`` calls — the only filesystem touch outside the
    persistence helpers. A route that creates a goal should offload create+save
    together rather than reason about whether one ``stat`` is blocking enough to
    matter.
    """
    for _ in range(4):
        candidate = f"{_slug(title)}-{uuid.uuid4().hex[:6]}"
        if not _GOAL_ID_RE.match(candidate):
            candidate = f"goal-{uuid.uuid4().hex[:12]}"
        if not (goals_dir() / f"{candidate}.json").exists():
            return candidate
    return f"goal-{uuid.uuid4().hex[:12]}"


def goals_dir() -> Path:
    return store.goals_dir()


def goal_path(goal_id: str) -> Path | None:
    """The file for *goal_id*, or ``None`` if the id is not one we would mint.

    The id reaches this function from an HTTP route, so it is checked against an
    allowlist regex — which contains no ``/``, no ``\\`` and no ``.`` run — rather
    than being sanitised or resolved-and-compared. An allowlist cannot be
    defeated by an encoding trick the way a denylist of ``..`` can, and the
    containment assertion below is the second, cheap belt.
    """
    ident = (goal_id or "").strip().lower()
    if not _GOAL_ID_RE.match(ident) or ".." in ident:
        logger.warning("conductor: refused an unsafe goal id %r", goal_id)
        return None
    path = goals_dir() / f"{ident}.json"
    if path.parent != goals_dir():  # pragma: no cover - unreachable via the regex
        logger.error("conductor: goal id %r escaped the goals directory", goal_id)
        return None
    return path


# ── persistence ──────────────────────────────────────────────────────────────

def load_goals() -> list[Goal]:
    """Every readable goal, oldest first. Blocking — use :func:`load_goals_async`.

    A goal that will not parse is skipped with a warning, which is the whole
    argument for one file per goal: the operator loses the goal they broke, not
    the Conductor.
    """
    directory = goals_dir()
    try:
        paths = sorted(directory.glob("*.json"))
    except OSError as exc:
        logger.warning("conductor: cannot list goals: %s", exc)
        return []
    out: list[Goal] = []
    for path in paths:
        payload = store.read_json(path)
        if payload is None:
            continue
        # The FILENAME wins over a mismatched ``id`` field. save_goal() derives
        # its path from ``goal.id``, so trusting the field would make load/save
        # write to a different file than the one we read and orphan the original.
        goal = Goal.from_json(payload, goal_id=path.stem)
        if goal is None:
            logger.warning("conductor: skipped an unreadable goal file %s", path.name)
            continue
        if isinstance(payload, dict) and payload.get("id") not in (None, goal.id):
            logger.warning(
                "conductor: goal file %s declares id %r; using the filename",
                path.name, payload.get("id"),
            )
        out.append(goal)
    out.sort(key=lambda g: (g.created_ts, g.id))
    return out


def get_goal(goal_id: str) -> Goal | None:
    path = goal_path(goal_id)
    if path is None:
        return None
    payload = store.read_json(path)
    if payload is None:
        return None
    return Goal.from_json(payload, goal_id=path.stem)


def save_goal(goal: Goal) -> None:
    """Validate, stamp ``updated_ts``, write atomically. Raises on invalid input.

    Validation is on the WRITE path rather than the read path because this is the
    last moment an error can be reported to whoever caused it. A goal that got
    past here and is broken on disk is a hand edit, and that case is handled by
    keeping the bad predicate unsatisfiable rather than by refusing to load.
    """
    ok, errors = validate_goal(goal)
    if not ok:
        raise ValueError("; ".join(errors))
    path = goal_path(goal.id)
    if path is None:
        raise ValueError(f"unsafe goal id {goal.id!r}")
    goal.updated_ts = time.time()
    store.write_json(path, goal.to_json())


def delete_goal(goal_id: str) -> None:
    """Remove one goal file. Unknown ids are a no-op, not an error.

    The ``<id>.json.lock`` sidecar is left behind on purpose: unlinking a lock
    file another process is holding gives both of them a lock on different
    inodes, which is worse than a stray zero-byte file.
    """
    path = goal_path(goal_id)
    if path is None:
        return
    try:
        path.unlink()
    except FileNotFoundError:
        return
    except OSError as exc:
        logger.warning("conductor: could not delete goal %s: %s", goal_id, exc)


def new_goal(
    title: str,
    statement: str = "",
    done_when: list[dict[str, Any]] | None = None,
    **kw: Any,
) -> Goal:
    """A validated goal with an id assigned. **Does not write it** — call
    :func:`save_goal`.

    Unknown keyword arguments raise instead of being ignored: a mistyped
    ``budget=`` that silently vanished would leave the operator with a goal whose
    ceilings are not the ones they set, and nothing would ever say so.
    """
    known = {f.name for f in fields(Goal)}
    unknown = set(kw) - known
    if unknown:
        raise TypeError(f"new_goal got unexpected fields: {', '.join(sorted(unknown))}")

    clean_title = _clean_text(title, MAX_TITLE_CHARS)
    if not clean_title:
        raise ValueError("title is required")

    ok, errors = validate_done_when(done_when)
    if not ok:
        raise ValueError("; ".join(errors))
    ok, errors = validate_authority(kw.get("authority"))
    if not ok:
        raise ValueError("; ".join(errors))
    ok, errors = validate_leaves(kw.get("leaves"))
    if not ok:
        raise ValueError("; ".join(errors))

    ident = _clean_text(kw.pop("id", ""), 64).lower() or mint_goal_id(clean_title)
    if not _GOAL_ID_RE.match(ident):
        raise ValueError(f"id must match {_GOAL_ID_RE.pattern}")

    now = time.time()
    status = kw.pop("status", None)
    entries = _normalize_done_when(done_when)
    goal = Goal(
        id=ident,
        title=clean_title,
        statement=_clean_body(statement, MAX_STATEMENT_CHARS),
        done_when=entries,
        authority=_authority_with_floor(kw.pop("authority", None)),
        scope=_normalize_scope(kw.pop("scope", None)),
        budgets=_normalize_budgets(kw.pop("budgets", None)),
        leaves=_normalize_leaves(kw.pop("leaves", None)),
        # A goal with no predicate is a draft no matter what the caller asked
        # for. This is the one place the status is not the caller's to choose.
        status=(status if entries and status in {s.value for s in GoalStatus}
                else GoalStatus.DRAFT.value),
        created_ts=_repair_float(kw.pop("created_ts", now), default=now, minimum=0.0, maximum=4e18),
        updated_ts=now,
        notes=_clean_body(kw.pop("notes", ""), MAX_NOTES_CHARS),
        activated_ts=_repair_float(
            kw.pop("activated_ts", 0.0), default=0.0, minimum=0.0, maximum=4e18
        ),
        guidance=_normalize_guidance(kw.pop("guidance", None)),
        cadence=_normalize_cadence(kw.pop("cadence", None)),
        paused_reason=_clean_text(kw.pop("paused_reason", ""), 200),
        terminal_reason=_clean_text(kw.pop("terminal_reason", ""), 200),
    )
    kw.pop("updated_ts", None)
    ok, errors = validate_goal(goal)
    if not ok:
        raise ValueError("; ".join(errors))
    return goal


# ── done_when evaluation — deterministic, I8 ─────────────────────────────────

def _result(
    kind: str, satisfied: bool, detail: str, *,
    index: int = -1, target: str = "", escalates: bool = False,
) -> dict[str, Any]:
    return {
        "kind": kind,
        "satisfied": satisfied,
        "detail": detail,
        "target": target,
        "index": index,
        "escalates": escalates,
    }


def _iter_matches(root: Path, pattern: str) -> tuple[list[Path], str]:
    """Up to :data:`MAX_GLOB_MATCHES` paths under *root* matching *pattern*.

    Returns ``(matches, note)`` where *note* is non-empty when something about
    the walk needs saying — a bad pattern, a truncated scan, a match that
    resolved outside the root.

    ``islice`` rather than a post-filter: the point is to stop the ``**``
    traversal, not to trim its output, because the traversal is the cost and this
    runs on a 60s tick.

    ``Path.glob`` does not descend into symlinked directories for ``**``
    (verified on this interpreter), but it *does* follow a symlink named
    explicitly as a component — ``a/link/*.txt`` returns files outside the tree.
    So every match is resolved and re-checked against the root: a predicate must
    not be satisfiable by a file the goal's scope does not cover.
    """
    try:
        base = root.resolve()
    except OSError as exc:
        return [], f"scope root is unreadable ({exc.__class__.__name__})"
    if not base.is_dir():
        return [], f"scope root {base} is not a directory"
    try:
        found = list(islice(base.glob(pattern), MAX_GLOB_MATCHES + 1))
    except (ValueError, NotImplementedError, IndexError, OSError) as exc:
        # Absolute patterns raise NotImplementedError, an empty one ValueError.
        # Validation rejects both, so reaching here means a hand-edited file.
        return [], f"pattern is not usable ({exc.__class__.__name__})"

    note = ""
    if len(found) > MAX_GLOB_MATCHES:
        found = found[:MAX_GLOB_MATCHES]
        note = f"stopped after {MAX_GLOB_MATCHES} matches"
    inside: list[Path] = []
    escaped = 0
    for match in found:
        try:
            real = match.resolve()
        except OSError:
            continue
        if real == base or base in real.parents:
            inside.append(match)
        else:
            escaped += 1
    if escaped:
        note = (note + "; " if note else "") + f"{escaped} match(es) resolved outside the scope root"
    return inside, note


def _file_contains(path: Path, needle: bytes) -> tuple[bool, bool]:
    """``(found, truncated)`` for a literal byte search, bounded and chunked.

    Bytes, not text: chunked decoding splits multi-byte characters at chunk
    boundaries, and a literal substring does not need decoding to be matched. The
    overlap is ``len(needle) - 1`` so a match straddling a chunk edge is still
    found.
    """
    if not needle:
        return False, False
    overlap = len(needle) - 1
    scanned = 0
    tail = b""
    try:
        with open(path, "rb") as fh:
            while scanned < MAX_SCAN_BYTES:
                chunk = fh.read(min(_SCAN_CHUNK, MAX_SCAN_BYTES - scanned))
                if not chunk:
                    return False, False
                scanned += len(chunk)
                if needle in tail + chunk:
                    return True, False
                tail = (tail + chunk)[-overlap:] if overlap else b""
            return False, True
    except OSError:
        return False, False


def _eval_file_exists(entry: dict[str, Any], root: Path, index: int) -> dict[str, Any]:
    pattern = str(entry.get("path", ""))
    matches, note = _iter_matches(root, pattern)
    detail = f"no file matches {pattern!r}" if not matches else f"matched {matches[0].name}"
    if note:
        detail = f"{detail} ({note})"
    return _result("file_exists", bool(matches), detail, index=index, target=pattern)


def _eval_path_matches(entry: dict[str, Any], root: Path, index: int) -> dict[str, Any]:
    pattern = str(entry.get("path", ""))
    literal = str(entry.get("contains", ""))
    needle = literal.encode("utf-8", "surrogatepass")
    matches, note = _iter_matches(root, pattern)
    if not matches:
        # The note carries "N match(es) resolved outside the scope root", which is
        # the case a bare "no file matches" would be actively misleading about:
        # the file is right there and the operator can see it.
        detail = f"no file matches {pattern!r}" + (f" ({note})" if note else "")
        return _result("path_matches", False, detail, index=index, target=pattern)
    truncated = 0
    for match in matches:
        if not match.is_file():
            continue
        found, cut = _file_contains(match, needle)
        if found:
            try:
                shown = match.relative_to(root.resolve())
            except (ValueError, OSError):
                shown = match
            detail = f"{shown} contains {literal[:60]!r}"
            return _result("path_matches", True, detail, index=index, target=pattern)
        truncated += 1 if cut else 0
    detail = f"{literal[:60]!r} not found in {len(matches)} file(s) matching {pattern!r}"
    if truncated:
        detail += f"; {truncated} file(s) were larger than the {MAX_SCAN_BYTES}-byte scan limit"
    if note:
        detail += f" ({note})"
    return _result("path_matches", False, detail, index=index, target=pattern)


def _eval_leaf_closed(goal: Goal, entry: dict[str, Any], index: int) -> dict[str, Any]:
    leaf_id = str(entry.get("leaf_id", ""))
    leaf = goal.leaf(leaf_id)
    if leaf is None:
        # Unsatisfied, not an error: done_when is often written before the goal
        # is decomposed. It becomes satisfiable when the leaf appears.
        return _result(
            "leaf_closed", False, f"no leaf {leaf_id!r} on this goal yet",
            index=index, target=leaf_id,
        )
    status = str(leaf.get("status", ""))
    return _result(
        "leaf_closed", status in CLOSED_LEAF_STATUSES, f"leaf {leaf_id} is {status or 'unset'}",
        index=index, target=leaf_id,
    )


def _eval_all_leaves_closed(goal: Goal, index: int) -> dict[str, Any]:
    if not goal.leaves:
        # NOT vacuously true. "All zero leaves are closed" is exactly the shape
        # of bug that completes a goal nothing has worked on.
        return _result(
            "all_leaves_closed", False,
            "this goal has no leaves, so there is nothing to have closed",
            index=index,
        )
    open_leaves = [
        str(leaf.get("id"))
        for leaf in goal.leaves
        if str(leaf.get("status", "")) not in CLOSED_LEAF_STATUSES
    ]
    if open_leaves:
        detail = f"{len(open_leaves)} leaf/leaves not closed: {', '.join(open_leaves[:5])}"
        return _result("all_leaves_closed", False, detail, index=index)
    return _result("all_leaves_closed", True, f"all {len(goal.leaves)} leaves closed", index=index)


def close_satisfied_leaves(goal: Goal, *, root: Path) -> list[dict[str, Any]]:
    """Close every open leaf whose own ``done_when`` is deterministically satisfied.

    **Without this the dependency graph never advances.** A leaf is dispatched,
    its worker writes the file and commits, and the leaf stays ``open`` forever —
    so every leaf that depends on it stays blocked and the goal cannot finish.
    That was the observed failure: ``constants`` produced ``src/constants.py`` with
    passing tests and ``board``/``evaluation`` were never dispatched, because
    nothing in the tree ever transitioned a leaf's status.

    Only the file predicates are honoured here, and that is the I8 line: a machine
    predicate may close a leaf. ``leaf_closed`` and ``all_leaves_closed`` are
    deliberately ignored — they are *goal*-level and would let leaves close each
    other in a cycle — and ``manual`` never closes, because that is what it means.
    A leaf with no ``done_when`` also never closes: an unfalsifiable leaf would
    otherwise close instantly and take the goal with it.

    Mutates *goal* in place and returns one record per newly-closed leaf, so the
    caller can persist once and put the transitions on the ledger. **Blocking** —
    it stats and globs, so call it off the event loop.
    """
    closed: list[dict[str, Any]] = []
    for leaf in goal.leaves:
        if str(leaf.get("status", "")) in CLOSED_LEAF_STATUSES:
            continue
        predicates = [
            entry for entry in (leaf.get("done_when") or [])
            if isinstance(entry, dict) and entry.get("kind") in ("file_exists", "path_matches")
        ]
        if not predicates:
            continue
        results = []
        for index, entry in enumerate(predicates):
            if entry.get("kind") == "file_exists":
                results.append(_eval_file_exists(entry, root, index))
            else:
                results.append(_eval_path_matches(entry, root, index))
        if not all(r.get("satisfied") for r in results):
            continue
        leaf["status"] = LeafStatus.CLOSED.value
        closed.append({
            "leaf_id": str(leaf.get("id") or ""),
            "why": "; ".join(str(r.get("detail") or "") for r in results),
        })
    return closed


def evaluate_done_when(goal: Goal, *, root: Path) -> tuple[bool, list[dict[str, Any]]]:
    """``(all_satisfied, results)`` — deterministic, and the only "done" authority.

    Nothing here calls a model, opens a socket, or runs a command. I8 in one
    sentence: a model may VETO a completion claim and may close a *leaf*; only
    this function or the operator may satisfy a *goal*.

    **Blocking.** It stats and reads files, so the tick must reach it through
    :func:`evaluate_done_when_async`. A ``**`` glob on the gateway's event loop is
    an I9 violation — the 25s watchdog exits the whole gateway.

    An empty ``done_when`` is a draft: never satisfiable, never dispatchable, and
    the single result explains that in the operator's terms. That sentence is the
    feature — "nothing is happening" needs to come with the reason.
    """
    if not goal.done_when:
        return False, [_result(
            DRAFT_KIND, False,
            "this goal has no done_when predicate, so it stays a draft: "
            "nothing can finish it and nothing will be dispatched for it",
        )]

    results: list[dict[str, Any]] = []
    for index, entry in enumerate(goal.done_when):
        problems = _predicate_errors(entry, index)
        if problems:
            # Kept and reported, never dropped: dropping would make the goal
            # easier to satisfy than the operator wrote it.
            kind = entry.get("kind") if isinstance(entry, dict) else None
            results.append(_result(
                str(kind or DRAFT_KIND), False,
                "unusable predicate: " + "; ".join(problems), index=index,
            ))
            continue
        kind = str(entry.get("kind"))
        try:
            if kind == "file_exists":
                results.append(_eval_file_exists(entry, root, index))
            elif kind == "path_matches":
                results.append(_eval_path_matches(entry, root, index))
            elif kind == "leaf_closed":
                results.append(_eval_leaf_closed(goal, entry, index))
            elif kind == "all_leaves_closed":
                results.append(_eval_all_leaves_closed(goal, index))
            else:  # manual
                text = _clean_text(entry.get("text"), 200)
                results.append(_result(
                    "manual", False,
                    f"only you can confirm this{': ' + text if text else ''}",
                    index=index, target=text, escalates=True,
                ))
        except Exception as exc:  # pragma: no cover - defensive
            # A predicate that raises must not take the tick with it, and must
            # never read as satisfied.
            logger.exception("conductor: goal %s predicate %d failed", goal.id, index)
            results.append(_result(
                kind, False, f"predicate raised {exc.__class__.__name__}", index=index,
            ))

    return all(r["satisfied"] for r in results), results


def needs_operator_confirmation(results: Iterable[dict[str, Any]]) -> bool:
    """True when every machine predicate passed and only ``manual`` lines remain.

    That is the ``awaiting_confirmation`` transition. It lives here so the loop
    and the route layer cannot disagree about when a goal is waiting on a human.
    """
    rows = list(results)
    manual = [r for r in rows if r.get("kind") == "manual"]
    if not manual:
        return False
    return all(r.get("satisfied") for r in rows if r.get("kind") != "manual")


def dispatchable(goal: Goal) -> tuple[bool, str]:
    """``(can_dispatch, reason)`` — one implementation, used by loop and UI.

    Always returns a reason, including when the answer is yes, so "why is nothing
    happening" is answerable from the same call that decided it.
    """
    if not goal.done_when:
        return False, "draft: no done_when predicate, so nothing would end it"
    if goal.status == GoalStatus.DRAFT.value:
        return False, "draft: not started yet"
    if goal.status == GoalStatus.HOLDING.value:
        return False, f"held by you{': ' + goal.paused_reason if goal.paused_reason else ''}"
    if goal.status == GoalStatus.BLOCKED.value:
        return False, f"blocked: {goal.terminal_reason or 'no progress'}"
    if goal.status == GoalStatus.AWAITING_CONFIRMATION.value:
        return False, "every machine predicate passed; waiting for your confirmation"
    if goal.status in TERMINAL_STATUSES:
        return False, f"{goal.status}"
    if goal.status not in DISPATCHABLE_STATUSES:  # pragma: no cover - exhaustive above
        return False, f"status {goal.status}"
    return True, "active with at least one done_when predicate"


# ── facts_hash — non-progress detection ──────────────────────────────────────

_FACT_KEYS: tuple[str, ...] = ("slots", "prs", "findings")
"""The only keys :func:`facts_hash` reads from an observation.

Insensitivity to clock time is STRUCTURAL, not a filter: the hash canonicalizes a
fixed key list, so a caller that later adds ``observed_ts`` or ``now`` to its
observation cannot leak the clock in and quietly disable non-progress detection.
A denylist of time-ish key names would have to be maintained forever and would
fail on the first one nobody thought of."""

_MESSAGE_COUNT_KEYS: tuple[str, ...] = ("messages", "message_count", "messages_count")

SLOT_FACT_FIELDS: tuple[str, ...] = ("last_turn_ts", "messages")
"""Which per-slot facts count as change. **One knob, on purpose** — see below.

The plan's formula names these literally: ``sha256(sorted leaf statuses | member
slot keys | last_turn_ts | message counts | PR head SHAs | open finding
signatures)``, and that is what ships.

VERIFIED: ``observe.VOLATILE_FIELDS`` (observe.py:203) takes the stricter position
that ``last_turn_ts`` and ``messages`` should be excluded along with
``silent_secs`` and ``last_activity_ts``. The disagreement is worth stating rather
than resolving silently in one of two modules:

* ``silent_secs`` and ``last_activity_ts`` genuinely advance on their own — the
  first is derived from ``now``, the second from every streamed tool call. They
  are not here and must never be.
* ``last_turn_ts`` as ``observe`` computes it is "when this session last
  SETTLED"; it does not move while a turn streams. ``messages`` is a count that
  moves only when rows are appended. Neither is a clock reading.
* The cost of keeping them: a session chattering inside an error loop keeps its
  goal's hash moving, so non-progress will not trip on it. That case is covered
  by the turn and wall-clock budgets and by ``detect.failure_signature``, whose
  output IS in the hash under ``findings``.
* The cost of dropping them: a goal whose sessions are genuinely working but
  whose leaf statuses have not changed for four deliberate ticks gets declared
  ``blocked`` and stops being acted on.

Set this to ``()`` to adopt ``observe``'s position. It is one line, in one place,
and the ledger's stored hashes make the choice measurable from Increment 1's
shadow data, which is how the plan says to pick this kind of number."""


def _fact_field(container: Any, name: str) -> Any:
    """Read *name* off a dict OR an object.

    VERIFIED: observe.py:413 types ``Observation.slots`` as
    ``dict[str, SlotFacts]`` — dataclass instances, not dicts. A dict-only reader
    would find nothing on every slot and silently hash zeroes, which looks exactly
    like a working non-progress detector and is the opposite of one.
    """
    if isinstance(container, dict):
        return container.get(name)
    return getattr(container, name, None)


def _turn_secs(value: object) -> int:
    """Whole seconds since the epoch, from whatever shape the writer used.

    Rounded to a whole second: float repr differences across a restart would
    otherwise read as motion.
    """
    if _epoch_secs is not None:
        return _repair_int(_epoch_secs(value), default=0, minimum=0, maximum=4_000_000_000)
    return _repair_int(value, default=0, minimum=0, maximum=4_000_000_000)


def _fact_slots(raw: object) -> list[list[Any]]:
    """``[[key, last_turn_ts_secs, message_count], ...]`` sorted by key."""
    entries: list[tuple[str, Any]] = []
    if isinstance(raw, dict):
        for key, value in raw.items():
            entries.append((str(key), value))
    elif isinstance(raw, (list, tuple)):
        for value in raw:
            key = _fact_field(value, "key")
            entries.append((str(key or ""), value))
    out: list[list[Any]] = []
    for key, value in entries:
        if not key:
            continue
        row: list[Any] = [key]
        if "last_turn_ts" in SLOT_FACT_FIELDS:
            row.append(_turn_secs(_fact_field(value, "last_turn_ts")))
        if "messages" in SLOT_FACT_FIELDS:
            count = 0
            for name in _MESSAGE_COUNT_KEYS:
                found = _fact_field(value, name)
                if found is not None:
                    count = _repair_int(found, default=0, minimum=0, maximum=1_000_000)
                    break
            row.append(count)
        out.append(row)
    out.sort(key=lambda item: str(item[0]))
    return out


def _fact_prs(raw: object) -> list[list[str]]:
    """``[[url, head_sha], ...]`` sorted. A PR whose head moved is progress."""
    pairs: list[list[str]] = []
    if isinstance(raw, dict):
        for url, sha in raw.items():
            # A registry entry may be the sha itself or the whole record.
            head = sha if isinstance(sha, str) else (
                _fact_field(sha, "head_sha") or _fact_field(sha, "sha")
            )
            pairs.append([str(url), _clean_text(head, 64)])
    elif isinstance(raw, (list, tuple)):
        for entry in raw:
            pairs.append([
                _clean_text(_fact_field(entry, "url"), 400),
                _clean_text(
                    _fact_field(entry, "head_sha") or _fact_field(entry, "sha"), 64
                ),
            ])
    pairs = [p for p in pairs if p[0]]
    pairs.sort(key=lambda p: p[0])
    return pairs


def _fact_findings(raw: object) -> list[str]:
    """Sorted, deduped finding signatures — ``detect.failure_signature`` output."""
    if isinstance(raw, dict):
        items: Iterable[Any] = raw.keys()
    elif isinstance(raw, (list, tuple, set, frozenset)):
        items = raw
    else:
        return []
    return sorted({_clean_text(item, 200) for item in items if _clean_text(item, 200)})


#: One reader per whitelisted key. Adding a fact to the hash means adding a row
#: here AND to :data:`_FACT_KEYS` — two edits, both visible in a diff.
_FACT_READERS: dict[str, Any] = {
    "slots": _fact_slots,
    "prs": _fact_prs,
    "findings": _fact_findings,
}


def facts_hash(goal: Goal, observation_facts: dict[str, Any]) -> str:
    """Stable digest of everything about *goal* that counts as having changed.

    Unchanged across N consecutive deliberate ticks **while the driver has been
    acting** ⇒ the goal is not progressing, whatever the transcripts look like.
    Motion is not progress, and this is the only cheap way to tell them apart.
    It is also the deliberate tick's skip test: an unchanged hash means the
    expensive steps have nothing new to reason about.

    The digest covers the goal's own id, statement and leaf statuses, plus the
    caller-supplied observation restricted to :data:`_FACT_KEYS`. Expected shape,
    which the loop's ``Observation`` must match::

        {"slots":    {slot_key: {"last_turn_ts": <iso|secs|ms>, "messages": int}},
         "prs":      {pr_url: head_sha},
         "findings": [failure_signature, ...]}

    Deliberately forgiving about container shape, because the loop should not have
    to reshape data to be hashed: ``slots`` may be a mapping or a list of records
    carrying ``key``, values may be dicts or objects (``observe.SlotFacts``
    instances pass straight through), ``last_turn_ts`` may be an ISO string,
    seconds or milliseconds (coerced by ``detect.epoch_secs``), and ``prs`` may
    map url→sha or url→record or be a list of records.

    Three things are deliberately NOT in it:

    * **``updated_ts``.** The driver writes the goal file constantly. A hash that
      moved on every save would never trip non-progress — it would report
      progress every time the Conductor wrote down that it was making none.
    * **Wall-clock now.** Same reason, more obviously.
    * **``guidance``.** A steer IS new information and should reset the
      non-progress counter — but the loop drains ``steer.jsonl`` at step 3 and
      already knows. Resetting there is explicit and auditable; smuggling it into
      the hash would mean any future code path that appends guidance silently
      clears the counter.
    """
    facts = observation_facts if isinstance(observation_facts, dict) else {}
    statement_digest = hashlib.sha256(goal.statement.encode("utf-8")).hexdigest()[:12]
    payload: dict[str, Any] = {
        "goal": goal.id,
        "statement": statement_digest,
        "leaves": sorted(
            [str(leaf.get("id", "")), str(leaf.get("status", ""))] for leaf in goal.leaves
        ),
    }
    # Driven off _FACT_KEYS rather than three hand-written lookups, so the
    # whitelist in the docstring is the whitelist in the code.
    for name in _FACT_KEYS:
        payload[name] = _FACT_READERS[name](facts.get(name))
    blob = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(blob.encode("utf-8")).hexdigest()[:32]


# ── async wrappers: the loop must not touch the filesystem inline ────────────

async def load_goals_async() -> list[Goal]:
    return await asyncio.to_thread(load_goals)


async def get_goal_async(goal_id: str) -> Goal | None:
    return await asyncio.to_thread(get_goal, goal_id)


async def save_goal_async(goal: Goal) -> None:
    await asyncio.to_thread(save_goal, goal)


async def delete_goal_async(goal_id: str) -> None:
    await asyncio.to_thread(delete_goal, goal_id)


async def evaluate_done_when_async(
    goal: Goal, *, root: Path
) -> tuple[bool, list[dict[str, Any]]]:
    """Offloaded :func:`evaluate_done_when`. **The tick must use this one.**

    A ``**`` glob or a multi-megabyte file scan inline in a coroutine is an I9
    violation: ``loop_watchdog.py`` arms ``dump_traceback_later(exit=True)`` and a
    slow predicate takes the operator's entire gateway down with it.
    """
    return await asyncio.to_thread(lambda: evaluate_done_when(goal, root=root))
