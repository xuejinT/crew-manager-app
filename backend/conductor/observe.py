"""Fleet observation — the only thing the cheap 15s tick does.

One pass over ``state._slots`` produces an immutable :class:`Observation`: a
frozen record of what every session is doing at one instant, plus the two
capacity numbers the driver needs to know whether it may start anything. No file
I/O, no subprocess, no LLM, no ``await``.

**Why this reads attributes directly instead of calling ``slot.to_dict()``.**
Two reasons, both measured rather than aesthetic:

* ``to_dict`` does work we would pay for on every slot on every tick and then
  throw away — a source-link projection (``_project_source_links``) and an
  ``[OPTIONS:]`` parse over the transcript tail, plus a full-transcript reverse
  scan and a redaction battery over every title, preview and option string. The
  dashboard pays that when a browser is watching; a background driver paying it
  every 15 seconds for a fleet nobody is looking at is pure waste.
* ``to_dict``'s signature is ``to_dict(*, include_check_status: bool = False)``
  (``dashboard/state.py:2625``), and with the default it **silently drops**
  ``ci``/``state``/``mergeable`` from every source link. That is exactly the bug
  ``backend/watcher.py:230`` has today: it calls ``to_dict()`` with no arguments,
  so its sweep is structurally blind to CI. A driver that proposes work on a pull
  request while unable to see whether its checks are red is worse than no driver.
  Here the check status is read from the platform's own cache
  (``get_cached_check_status``) and attached explicitly.

Every attribute is read through :func:`_attr`, which swallows a raised lookup and
returns the field's degraded value. A gateway that renames a private attribute
must cost us ONE field, never the tick — and never the app's UI, which is why
every gateway import in this module is guarded and every gateway-only path is
behind ``is None`` checks. The module imports and runs with no gateway at all.

**Freshness, not truth.** ``Observation`` is a snapshot. :func:`observe` is
deliberately synchronous: it contains no ``await``, so nothing can be created,
answered or torn down between two of its reads, and the fleet it describes is one
real instant of the event loop. An async version would report a fleet that never
existed, which is the worst possible input to a control loop.

**Detection is not reimplemented here.** ``raw_for_detect`` is shaped for the
pure functions already shipped in ``backend/detect.py`` — ``detect_stalls``,
``detect_error_loops``, ``is_excluded``, ``session_label``,
``build_reason_prompt`` — so the loop feeds them unchanged.
"""

from __future__ import annotations

import logging
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable, Collection

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# detect.py — a sibling of this package's parent, not a gateway module
# ---------------------------------------------------------------------------
#
# ``backend/routes.py:38`` puts the backend directory on ``sys.path`` before
# anything else loads, so ``import detect`` normally resolves. The fallback
# repeats that insert for the one case where it has not run yet (a test, or the
# offline selftest importing this module first). Guarded rather than
# unconditional because mutating ``sys.path`` on every import is how two copies
# of one module end up loaded under different names.
try:
    from detect import DEFAULT_TAIL_MESSAGES, epoch_secs
except ImportError:  # pragma: no cover - depends on who imported first
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    from detect import DEFAULT_TAIL_MESSAGES, epoch_secs


# ---------------------------------------------------------------------------
# Guarded gateway imports
# ---------------------------------------------------------------------------
#: Platform helpers that failed to resolve. Surfaced so ``GET /conductor/state``
#: can report degradation instead of leaving it to be inferred from a field that
#: is quietly always None.
MISSING_PLATFORM_HELPERS: list[str] = []


def _optional(module: str, name: str) -> Any:
    """Import *name* from *module*, or None with the loss recorded.

    A missing symbol degrades one derived field. It must never stop the app's
    routes from registering, so the failure is logged and named rather than
    raised — a gateway that moved a private symbol still gets its UI.
    """
    try:
        mod = __import__(module, fromlist=[name])
        return getattr(mod, name)
    except Exception:
        MISSING_PLATFORM_HELPERS.append(f"{module}.{name}")
        logger.debug("conductor.observe: %s.%s unavailable", module, name, exc_info=True)
        return None


# VERIFIED: kiro_crew/dashboard/state.py:689 — public, and the same predicate
# to_dict's `interrupted` field uses (state.py:2763).
_is_turn_interrupted: Callable[[list[dict]], bool] | None = _optional(
    "kiro_crew.dashboard.state", "is_turn_interrupted"
)
# VERIFIED: kiro_crew/dashboard/state.py:1244. Private, and imported rather than
# reimplemented on purpose: the [OPTIONS:] grammar is ReDoS-hardened and defined
# once in constants.py precisely so copies cannot drift (state.py:1227-1233).
# A local re-parse would be that second copy.
_parse_options: Callable[[str], list[str]] | None = _optional(
    "kiro_crew.dashboard.state", "_parse_options"
)
# VERIFIED: kiro_crew/dashboard/state.py:622 — decodes the JSON-encoded `cls`
# carrier that holds a permission row's tool metadata.
_parse_cls_meta: Callable[[str], dict | None] | None = _optional(
    "kiro_crew.dashboard.state", "parse_cls_meta"
)
# VERIFIED: kiro_crew/dashboard/system_notices.py:17.
_is_system_notice: Callable[[object, object], bool] | None = _optional(
    "kiro_crew.dashboard.system_notices", "is_system_notice"
)
# VERIFIED: kiro_crew/security.py — the same pair watcher.py:93 guards.
_redact_credentials: Callable[[str], tuple[str, Any]] | None = _optional(
    "kiro_crew.security", "redact_credentials"
)
_redact_exfil_urls: Callable[[str], tuple[str, Any]] | None = _optional(
    "kiro_crew.security", "redact_exfiltration_urls"
)

#: Resolved on first use, never at import: ``state.py:7163`` keeps this exact
#: dependency lazy so ``state`` has no import-time dependency on the handler
#: module, and importing it eagerly from here would reintroduce that edge.
_check_status_fn: Callable[[str], dict | None] | None = None
_check_status_tried: bool = False


def _check_status(url: str, kind: str) -> dict[str, str]:
    """Cached ``{ci, state, mergeable}`` for a pull/merge request URL.

    Gated on *kind* for the reason ``state.py:896-906`` gives: the chip-status
    cache is pull-request-only, so consulting it for an issue keys on a URL it
    never stores — and if a PR and an issue ever normalised to the same key, the
    issue would inherit the PR's CI glyph.

    A pure dict lookup (``source_providers.py:4453``): no network, no disk, safe
    on the event loop. Deliberately does NOT carry the age of the entry or the
    flap-damped state — ``prreg`` owns freshness, staleness and the explicit
    ``unknown``, and a second freshness rule here would be one that disagrees.
    """
    global _check_status_fn, _check_status_tried
    if kind != "change":
        return {}
    if not _check_status_tried:
        _check_status_tried = True
        _check_status_fn = _optional(
            # VERIFIED: kiro_crew/dashboard/handlers/source_providers.py:4445
            "kiro_crew.dashboard.handlers.source_providers",
            "get_cached_check_status",
        )
    if _check_status_fn is None or not url:
        return {}
    try:
        found = _check_status_fn(url)
    except Exception:
        logger.debug("conductor.observe: check status unavailable for a link", exc_info=True)
        return {}
    return dict(found) if isinstance(found, dict) else {}


# ---------------------------------------------------------------------------
# Constants mirrored from the platform
# ---------------------------------------------------------------------------

#: Roles that count as the session doing something. VERIFIED: state.py:2643 — to_dict
#: derives `last_activity_ts` from exactly these, excluding system notices, and
#: detect_stalls measures silence against that field. See _slot_facts on its one gap.
_ACTIVITY_ROLES = frozenset({"tool_call", "tool_result", "assistant"})

#: Rows that START a turn. VERIFIED: state.py:861 (`_PROMPT_ROLES`).
_PROMPT_ROLES = frozenset({"user", "inject"})

_CONVERSATIONAL_ROLES = frozenset({"user", "assistant"})

#: ``stop_state`` value meaning "no stop in flight". VERIFIED: state.py:1603.
_STOP_STATE_IDLE = "idle"

#: How far back the per-slot reverse scan looks. to_dict scans the WHOLE
#: transcript; we cap, and the divergence is deliberate. This runs over the
#: entire fleet every 15s, and a session whose newest 200 rows contain no
#: conversational row, no activity row and no unresolved permission row has
#: nothing the driver could act on anyway. The cap bounds worst-case tick cost
#: at O(slots x 200) instead of O(total transcript bytes).
_TAIL_SCAN_LIMIT = 200

#: Transcript rows copied into ``raw_for_detect``. Derived from detect.py's own
#: tail default so the two cannot drift: a detector asked to look at 40 rows
#: must not be handed 20. Four times the default is headroom for a caller that
#: passes a larger ``tail_messages``; beyond that it sees what we captured.
RAW_TAIL_MESSAGES = 4 * DEFAULT_TAIL_MESSAGES

#: Fields that advance on their own with the clock. A ``facts_hash`` built over
#: any of these can never report non-progress, because it changes every tick
#: whether or not the session did anything. Named here so the evaluate step can
#: exclude them by contract rather than by remembering to.
VOLATILE_FIELDS: frozenset[str] = frozenset(
    {"silent_secs", "last_activity_ts", "last_turn_ts", "messages"}
)


# ---------------------------------------------------------------------------
# The one exemption predicate
# ---------------------------------------------------------------------------

#: The conductor's own sessions, current and legacy. Both names exist because
#: the app was renamed from Overwatch and a workspace that ran the old build
#: still has an ``overwatch-conductor`` session on disk. VERIFIED as the same
#: pair the four existing copies hardcode: ``src/model.ts:1032`` (used at
#: ``:1735`` and ``:2588``) and ``backend/watcher.py:102``.
CONDUCTOR_SLOT_KEYS: frozenset[str] = frozenset(
    {"crew-manager-conductor", "overwatch-conductor"}
)


def exclusion_reason(
    slot_key: str,
    *,
    conductor_keys: Collection[str] = CONDUCTOR_SLOT_KEYS,
    report_only: Collection[str] = (),
) -> str:
    """Why *slot_key* is exempt from being acted on, or ``""``.

    Returns the exemption CLASS, because the two classes are not the same fact
    and the driver has to tell them apart in a reason list:

    * ``conductor_owned`` — the session is the driver's own. Acting on it is a
      self-loop, and surfacing it as work makes the operator babysit a scratch
      session they never asked for.
    * ``report_only`` — an operator-declared exemption (``scope.report_only_slots``).
      The session is fully observed and fully reported; it is never touched. This
      is what makes "Crew Manager reports on it without ever touching it" real,
      and it is a prerequisite for the report-only clause of R7.

    Membership is tested against a caller-supplied set rather than a module
    global on purpose: the live sets come from ``GET /conductor/state``, and the
    moment the driver can create helper sessions a hardcoded pair is wrong.
    """
    if not slot_key:
        # An unkeyed slot cannot be addressed by any action, so it is exempt by
        # construction rather than by policy. The four copies being replaced all
        # begin with this same `!slot.key` guard.
        return "unkeyed"
    if slot_key in conductor_keys:
        return "conductor_owned"
    if slot_key in report_only:
        return "report_only"
    return ""


def exclusion_predicate(
    slot_key: str,
    *,
    conductor_keys: Collection[str] = CONDUCTOR_SLOT_KEYS,
    report_only: Collection[str] = (),
) -> bool:
    """True when *slot_key* must not be acted on. One predicate, replacing four.

    The rule exists in four places today — ``src/model.ts:1032`` (applied at
    ``:1735`` and ``:2588``), the ``conductorSlot`` parameter of
    ``summaryTargets`` (``src/summaries.ts:25``), and ``SKIP_KEYS``
    (``backend/watcher.py:102``) — as a hardcoded key pair. Four copies of a
    membership test were survivable while the set was constant; they stop being
    survivable the moment the driver can create helper sessions, because the
    fifth caller is the one that forgets.

    Note what is NOT here: ``memory_mode === 'incognito'``. The TypeScript copies
    fold that in, but privacy is a property of the SLOT, not of its key, and it
    is a different decision — an incognito session is still observed and still
    counted; what it must never do is have its transcript quoted anywhere
    durable. ``detect.session_label`` and ``SlotFacts.memory_mode`` already carry
    that axis, and merging the two would make one flag mean two things.
    """
    return bool(
        exclusion_reason(slot_key, conductor_keys=conductor_keys, report_only=report_only)
    )


# ---------------------------------------------------------------------------
# Facts
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class SlotFacts:
    """What one session is, at one instant, in the driver's vocabulary.

    Field types are ``| None`` wherever a default would be a LIE rather than a
    reading. ``running=None`` means "this gateway did not tell us"; it does not
    mean idle. Every consumer must treat None as *unknown* and take the
    conservative branch — the whole point of degrading a field instead of raising
    is that the driver keeps working with one fact missing, and a missing fact
    that reads as False is worse than one that reads as unknown.

    ``frozen=True`` is shallow: ``wait_state``, ``todo``, ``pending_approval_info``
    and the dicts inside ``source_links`` are the platform's own objects or fresh
    copies of them. Treat all of them as read-only; mutating one either corrupts
    the dashboard's cache or corrupts a later step's view of this tick.

    Do NOT call ``hash()`` on this. ``frozen=True`` generates a ``__hash__`` that
    raises ``TypeError`` on the dict-valued fields. Use :meth:`to_json`, which is
    canonical and JSON-safe, and read :data:`VOLATILE_FIELDS` first.
    """

    key: str
    title: str
    running: bool | None
    stop_state: str | None
    pending_approval: bool | None
    pending_approval_info: dict[str, str] | None
    needs_input: bool | None
    has_options: bool | None
    options: tuple[str, ...]
    waiting_for_input: bool | None
    interrupted: bool | None
    queue_depth: int | None
    wait_state: dict[str, Any] | None
    last_activity_ts: str | float
    """Verbatim in whatever shape the writer used — see :func:`_ts`. Prefer
    ``silent_secs``, which is this resolved against the tick's own instant."""
    last_turn_ts: str | float
    messages: int
    """The COUNT, matching what ``to_dict`` puts on the wire. The rows themselves
    are in ``Observation.raw_for_detect``, where the detectors need them."""
    memory_mode: str
    app: str
    origin: str
    unattended: bool | None
    project: str
    workspace: str
    linked_session_key: str
    source_links: tuple[dict[str, Any], ...]
    todo: dict[str, Any] | None
    trust: bool | None
    silent_secs: float | None

    def to_json(self) -> dict[str, Any]:
        """A JSON-safe projection, stable field-for-field with the dataclass.

        Built by name rather than by ``asdict`` so that adding a field is a
        deliberate act with a visible diff in the ledger and in ``facts_hash``.
        """
        return {
            "key": self.key,
            "title": self.title,
            "running": self.running,
            "stop_state": self.stop_state,
            "pending_approval": self.pending_approval,
            "pending_approval_info": self.pending_approval_info,
            "needs_input": self.needs_input,
            "has_options": self.has_options,
            "options": list(self.options),
            "waiting_for_input": self.waiting_for_input,
            "interrupted": self.interrupted,
            "queue_depth": self.queue_depth,
            "wait_state": self.wait_state,
            "last_activity_ts": self.last_activity_ts,
            "last_turn_ts": self.last_turn_ts,
            "messages": self.messages,
            "memory_mode": self.memory_mode,
            "app": self.app,
            "origin": self.origin,
            "unattended": self.unattended,
            "project": self.project,
            "workspace": self.workspace,
            "linked_session_key": self.linked_session_key,
            "source_links": [dict(link) for link in self.source_links],
            "todo": self.todo,
            "trust": self.trust,
            "silent_secs": self.silent_secs,
        }


@dataclass(frozen=True)
class Observation:
    """One tick's view of the fleet. Immutable, self-dated, cheap to build.

    ``raw_for_detect`` is the same fleet in ``to_dict``-shaped dicts, for the
    pure detectors in ``backend/detect.py``. It carries four keys ``SlotFacts``
    does not, each because something reads it:

    * ``stopping``, ``orchestrating``, ``subagents_running`` — ``is_excluded``
      reads all three (``detect.py:112-121``). ``stopping`` is derivable from
      ``stop_state``; the other two are not, and without them every ``wait``,
      every soft-stop and every fan-out would be reported as a stall.
    * ``question_blocking`` — whether an unanswered question card is PARKING the
      turn (``_question_pending[...]["blocking"]``, state.py:1926) or merely
      followed a finished one. That is the platform's own "the agent is stuck"
      versus "the agent is done and asked you something" distinction, and the
      classify step needs it. It is not in ``SlotFacts`` because that shape is a
      fixed contract other modules are being written against in parallel.

    ``raw_for_detect`` collapses every UNKNOWN to its falsy reading, because
    detect.py's predicates take plain booleans and ``None`` in a ``not x`` test
    silently reads as False anyway. The collapse is safe in one direction only,
    and it happens to be the right one: an unreadable slot gets ``running:
    False``, and both detectors skip a slot that is not running — so a session we
    could not read produces no finding rather than a fabricated one. ``SlotFacts``
    keeps the ``None``, so a step that must tell *unknown* from *false* still can.

    Nothing is filtered out here. The conductor's own sessions and every
    report-only session are present, because an exempt session is still observed
    and still reported — only never acted on. Callers apply
    :func:`exclusion_predicate`, and the detectors take ``skip_keys``.
    """

    ts: float
    slots: dict[str, SlotFacts]
    running_turns: int
    background_headroom: int | None
    raw_for_detect: list[dict]

    def to_json(self) -> dict[str, Any]:
        """Ledger/API projection. ``raw_for_detect`` is deliberately omitted —
        it embeds transcript rows, which are exactly what must not be written to
        a durable audit surface unredacted."""
        return {
            "ts": self.ts,
            "running_turns": self.running_turns,
            "background_headroom": self.background_headroom,
            "slots": {key: facts.to_json() for key, facts in self.slots.items()},
        }


# ---------------------------------------------------------------------------
# Reading one slot
# ---------------------------------------------------------------------------


def _attr(obj: Any, name: str, default: Any = None) -> Any:
    """``getattr`` that cannot raise. The degradation contract, in one place.

    A renamed private attribute costs the ONE field that reads it. Properties
    are the reason this is broader than ``getattr(obj, name, default)``: a
    property whose body raises something other than ``AttributeError`` (a
    ``TypeError`` from a changed helper signature) would otherwise propagate out
    of the tick.
    """
    try:
        return getattr(obj, name, default)
    except Exception:
        logger.debug(
            "conductor.observe: reading %r raised; degrading to %r", name, default, exc_info=True
        )
        return default


def _text(value: Any) -> str:
    return value if isinstance(value, str) else ("" if value is None else str(value))


def _tri(value: Any) -> bool | None:
    """A boolean reading, or None when the platform handed back something else.

    Not ``bool(value)``: truthiness would turn a degraded None into a confident
    False, which is the one thing the whole unknown-vs-false distinction exists
    to prevent.
    """
    return value if isinstance(value, bool) else None


def _count(value: Any) -> int | None:
    """A non-negative count, or None. ``bool`` is excluded because it IS an ``int``."""
    if isinstance(value, bool) or not isinstance(value, int):
        return None
    return value


def _ts(value: Any) -> str | float:
    """A transcript timestamp, passed through in whatever shape it was written.

    Deliberately NOT coerced to ``str``. ``detect.epoch_secs`` accepts ISO
    strings, seconds and milliseconds because "timestamps arrive as ISO strings,
    as seconds, and as milliseconds depending on which writer produced them"
    (detect.py:78-84) — and ``str(1799999280.0)`` is parseable by NONE of those
    branches. Stringifying here would make ``epoch_secs`` return 0.0, which
    ``detect_stalls`` reads as "no usable timestamp" and skips: every stall on
    such a slot would be silently undetectable. Dashboard rows carry ISO strings
    today (``_ChatSlot.append`` floors on ``monotonic_transcript_ts``), so this
    guards a shape we do not control rather than one we observe.

    ``bool`` is rejected before ``int`` because ``bool`` IS an ``int``, and
    ``epoch_secs`` makes the same exclusion for the same reason.
    """
    if isinstance(value, str):
        return value
    if isinstance(value, bool):
        return ""
    if isinstance(value, (int, float)):
        return float(value)
    return ""


def _redact(value: Any) -> str:
    """Strip credentials and exfiltration URLs from a string bound for a prompt.

    Every string this touches ends up in a ledger row, a notification body or an
    LLM prompt. ``to_dict`` redacts the same fields for the same reason
    (state.py:2782-2786); if the helpers are missing we return the text
    unchanged rather than dropping the field, matching watcher.py:93-98.
    """
    text = _text(value)
    if not text:
        return ""
    if _redact_exfil_urls is not None:
        try:
            text = _redact_exfil_urls(text)[0]
        except Exception:
            logger.debug("conductor.observe: url redaction failed", exc_info=True)
    if _redact_credentials is not None:
        try:
            text = _redact_credentials(text)[0]
        except Exception:
            logger.debug("conductor.observe: credential redaction failed", exc_info=True)
    return text


def _notice(role: Any, meta: Any) -> bool:
    """Is this row a system notice (auto-compact banner, reload confirmation)?

    Degrades to False, i.e. to treating a notice as a real row — the behaviour of
    a gateway that predates the concept. That direction is safe: a notice counted
    as activity makes a session look FRESHER than it is, so the driver waits
    instead of continuing something on stale evidence.
    """
    if _is_system_notice is None:
        return False
    try:
        return bool(_is_system_notice(role, meta))
    except Exception:
        return False


@dataclass(frozen=True)
class _Tail:
    """What one reverse scan of the transcript tail yields."""

    last_ts: str | float = ""
    last_activity_ts: str | float = ""
    last_conv_role: str = ""
    options: tuple[str, ...] = ()
    options_known: bool = True
    prompt_ts: str | float = ""
    has_rows: bool = False


def _scan_tail(messages: Any) -> _Tail:
    """One reverse pass for everything derived from the transcript.

    Mirrors ``to_dict``'s single-scan structure (state.py:2635-2688) and for the
    same reason: four separate walks over a multi-megabyte transcript is the cost
    that made the slots push expensive in the first place.
    """
    if not isinstance(messages, list) or not messages:
        return _Tail()
    rows = messages[-_TAIL_SCAN_LIMIT:]
    last_ts: str | float = ""
    newest = rows[-1]
    if isinstance(newest, dict):
        last_ts = _ts(newest.get("ts"))

    last_activity_ts: str | float = ""
    prompt_ts: str | float = ""
    last_conv_role = ""
    options: tuple[str, ...] = ()
    options_known = True
    found_conv = False
    for row in reversed(rows):
        if not isinstance(row, dict):
            continue
        role = row.get("role")
        meta = row.get("meta") or {}
        notice = _notice(role, meta)
        if not last_activity_ts and role in _ACTIVITY_ROLES and not notice:
            last_activity_ts = _ts(row.get("ts"))
        if not prompt_ts and role in _PROMPT_ROLES:
            prompt_ts = _ts(row.get("ts"))
        if not found_conv and role in _CONVERSATIONAL_ROLES and not notice:
            content = _text(row.get("content"))
            if content:
                found_conv = True
                last_conv_role = _text(role)
                if role == "assistant":
                    options, options_known = _options_of(content)
        if found_conv and last_activity_ts and prompt_ts:
            break
    return _Tail(
        last_ts=last_ts,
        last_activity_ts=last_activity_ts,
        last_conv_role=last_conv_role,
        options=options,
        options_known=options_known,
        prompt_ts=prompt_ts,
        has_rows=True,
    )


def _options_of(content: str) -> tuple[tuple[str, ...], bool]:
    """Follow-up choices offered by the last assistant message, and whether we know.

    The second element is the honesty bit. Without the platform's parser we
    cannot tell an options-ended turn from an ordinary one, and reporting
    ``has_options=False`` would let the driver treat a menu as free-form silence.
    """
    if _parse_options is None:
        return (), False
    try:
        parsed = _parse_options(content)
    except Exception:
        logger.debug("conductor.observe: options parse failed", exc_info=True)
        return (), False
    if not isinstance(parsed, list):
        return (), False
    return tuple(_redact(option) for option in parsed), True


def _pending_approval(slot: Any) -> bool | None:
    """Is a tool approval owed on this slot?

    VERIFIED: state.py:2689 — ``any(not f.done() for f in
    self._approval_futures.values())``. The dashboard runner waits on its OWN
    per-slot futures rather than going through ``request_approval``
    (state.py:3610), so this dict IS the fact; there is no public accessor.
    """
    futures = _attr(slot, "_approval_futures")  # VERIFIED: state.py:1508
    if not isinstance(futures, dict):
        return None
    try:
        return any(
            not future.done() for future in futures.values() if hasattr(future, "done")
        )
    except Exception:
        logger.debug("conductor.observe: approval futures unreadable", exc_info=True)
        return None


def _approval_info(messages: Any) -> dict[str, str] | None:
    """Tool metadata for the newest UNRESOLVED permission row, redacted.

    Mirrors state.py:2773-2787, with one divergence: the reverse scan is bounded
    by ``_TAIL_SCAN_LIMIT``. to_dict walks the whole transcript, which is fine
    once per browser push and not fine every 15s for every slot — and a pending
    future whose permission row is 200+ rows back is a leak, not a fact worth a
    full scan.
    """
    if _parse_cls_meta is None or not isinstance(messages, list):
        return None
    for row in reversed(messages[-_TAIL_SCAN_LIMIT:]):
        if not isinstance(row, dict) or row.get("role") != "permission":
            continue
        try:
            meta = _parse_cls_meta(_text(row.get("cls"))) or {}
        except Exception:
            logger.debug("conductor.observe: permission meta unreadable", exc_info=True)
            continue
        if not isinstance(meta, dict) or meta.get("resolved"):
            continue
        return {
            "tool": _redact(row.get("content")),
            "tool_input": _redact(meta.get("tool_input", "")),
            "tool_kind": _redact(meta.get("tool_kind", "")),
            "request_id": _redact(meta.get("approval_id", meta.get("request_id", ""))),
        }
    return None


def _interrupted(messages: Any, running: bool | None) -> bool | None:
    """Did the last turn end without the assistant handing the floor back?

    Gated on ``not running`` exactly as state.py:2763 gates it: while a turn is
    in flight the trailing error row belongs to a superseded turn.

    None when the platform predicate is missing, never False. False here means
    "the transcript shows a finished turn", which the driver may act on; guessing
    it would invent evidence for a resume.
    """
    if _is_turn_interrupted is None or not isinstance(messages, list):
        return None
    if running is None:
        return None
    if running:
        return False
    try:
        return bool(_is_turn_interrupted(messages))
    except Exception:
        logger.debug("conductor.observe: interrupted check failed", exc_info=True)
        return None


def _source_links(slot: Any) -> tuple[dict[str, Any], ...]:
    """This slot's PR/MR/issue links, each with its cached check status attached.

    ``_pr_source_links`` is cached behind an explicit content revision plus the
    GitLab-allowlist generation (VERIFIED: state.py:2472, cache key at :2508) and
    is bounded by a hard parse budget (:2527). The dashboard already calls it on
    every ``push_slots_update``, so a 15s tick adds nothing it is not paying.

    Each link is COPIED before the status is merged. The returned list is the
    slot's own cache object; merging in place would corrupt the sidebar's chips.
    """
    fn = _attr(slot, "_pr_source_links")  # VERIFIED: state.py:2472 (method, not a property)
    if not callable(fn):
        return ()
    try:
        links = fn()
    except Exception:
        logger.debug("conductor.observe: source links unavailable", exc_info=True)
        return ()
    if not isinstance(links, list):
        return ()
    out: list[dict[str, Any]] = []
    for link in links:
        if not isinstance(link, dict):
            continue
        # `kind` is absent on older payloads and means "change" there
        # (state.py:891).
        kind = _text(link.get("kind") or "change")
        out.append({**link, **_check_status(_text(link.get("url")), kind)})
    return tuple(out)


def _todo(slot: Any) -> dict[str, Any] | None:
    """The agent's TODO snapshot with server-derived counts.

    Prefers ``todo_payload()`` (VERIFIED: state.py:2024) over the raw ``_todo``
    dict because the ``completed``/``total``/``current`` derivation lives there,
    and a second derivation would eventually disagree with the pill the operator
    is looking at. Absent-vs-empty is load-bearing: None means the agent never
    used its todo tool, ``{"tasks": []}`` means it cleared the list.
    """
    fn = _attr(slot, "todo_payload")
    if callable(fn):
        try:
            payload = fn()
        except Exception:
            logger.debug("conductor.observe: todo payload failed", exc_info=True)
            payload = None
        if payload is None or isinstance(payload, dict):
            return payload
    raw = _attr(slot, "_todo")  # VERIFIED: state.py:1593
    return raw if isinstance(raw, dict) else None


def _last_turn_ts(tail: _Tail, running: bool | None, slot: Any) -> str | float:
    """When this session last SETTLED — work asked of it, or a turn finished.

    Deliberately not the newest row of any role, which advances on every streamed
    tool call (state.py:2690-2707). A turn in flight holds the rank of the prompt
    that started it.

    A send that arrived behind a running turn is QUEUED rather than appended, so
    the transcript scan alone would rank the session by the older prompt. The
    queued instant is folded in, and the comparison goes through
    ``detect.epoch_secs`` rather than string ``max`` for the reason
    state.py:2720 gives: rows carry both aware and naive isoformat, and comparing
    those as strings can pick the earlier one.
    """
    if not running:
        return tail.last_ts
    candidate = tail.prompt_ts
    queue = _attr(slot, "_queue")  # VERIFIED: state.py:1504
    if isinstance(queue, list) and queue:
        queued_ts = _ts(_attr(slot, "_last_enqueue_ts", ""))  # VERIFIED: state.py:1507
        if queued_ts and epoch_secs(queued_ts) > epoch_secs(candidate):
            return queued_ts
    return candidate


def _question_facts(slot: Any) -> tuple[bool | None, bool | None]:
    """``(needs_input, question_blocking)`` from the unanswered-question map.

    VERIFIED: state.py:1943 ``_question_pending: dict[str, dict]``, values
    ``{"ts": float, "blocking": bool}`` (state.py:1926); ``needs_input`` is
    ``bool(self._question_pending)`` at state.py:2753.

    ``blocking`` is kept separate because it is the platform's own difference
    between a turn PARKED on an ask_question round-trip and a stateless card that
    followed a finished turn — "the agent is stuck" versus "the agent is done and
    asked you something" (state.py:1938-1942). Only the first makes the session
    genuinely unable to advance.
    """
    pending = _attr(slot, "_question_pending")  # VERIFIED: state.py:1943
    if not isinstance(pending, dict):
        return None, None
    if not pending:
        return False, False
    blocking = False
    for entry in pending.values():
        if isinstance(entry, dict) and entry.get("blocking"):
            blocking = True
            break
    return True, blocking


def _slot_facts(
    slot: Any,
    key: str,
    *,
    now: float,
    subagents_running: bool | None,
) -> tuple[SlotFacts, dict[str, Any]]:
    """Build one slot's facts and its detector-shaped twin from one read pass."""
    messages = _attr(slot, "messages")  # VERIFIED: state.py:1496
    tail = _scan_tail(messages)

    running = _tri(_attr(slot, "running"))  # VERIFIED: state.py:2374 (property)
    stop_state = _attr(slot, "_stop_state")  # VERIFIED: state.py:1984 (property)
    stop_state = _text(stop_state) if stop_state is not None else None

    pending_approval = _pending_approval(slot)
    needs_input, question_blocking = _question_facts(slot)

    # Trailing-turn state. waiting_for_input mirrors state.py:2728-2734 exactly.
    # When the options parser is missing we treat the turn as option-free so this
    # still resolves, and True is the safe direction: a session reported as
    # waiting on the operator is escalated, never auto-continued, and
    # detect.is_excluded then declines to call its silence a stall.
    has_options: bool | None = bool(tail.options) if tail.options_known else None
    waiting_for_input: bool | None
    if running is None:
        waiting_for_input = None
    else:
        waiting_for_input = (
            not running
            and not tail.options
            and not pending_approval
            and tail.has_rows
            and tail.last_conv_role == "assistant"
        )

    # Silence, measured against the same field chain detect_stalls uses
    # (detect.py:160-161) so `silent_secs` and a stall finding cannot disagree.
    #
    # KNOWN PLATFORM GAP, reported rather than patched here. The role tuple
    # `last_activity_ts` is derived from (state.py:2643) does not contain "tool",
    # which is the role the dashboard runner actually writes tool rows under
    # (VERIFIED: dashboard/chat_runner.py:5987; history.py:5479 treats
    # "tool"/"tool_call"/"tool_result" as one family, and nothing in the dashboard
    # pipeline writes the latter two). A session grinding through one long tool call
    # with no assistant text between therefore does not advance the field, and
    # `detect_stalls` prefers it over the fresher `last_ts` whenever it is present at
    # all -- so such a session can read as silent while it is working.
    #
    # Widening the tuple HERE is the rejected fix: it would make this sweep disagree
    # with the sidebar row the operator is comparing it against, and a driver whose
    # notion of "active" differs from the UI's is a worse bug than the false stall it
    # removes. The fix belongs in to_dict, where both readers would get it.
    # `backend/watcher.py` has the identical exposure today for the identical reason.
    created = _ts(_attr(slot, "created_at", ""))  # VERIFIED: state.py:1495
    last_seen = epoch_secs(tail.last_activity_ts or tail.last_ts or created)
    silent_secs = max(0.0, now - last_seen) if last_seen > 0 else None

    wait_state = _attr(slot, "_wait_state")  # VERIFIED: state.py:1908
    queue_depth = _attr(slot, "queue_depth")  # VERIFIED: state.py:2378 (property)
    stopping = stop_state is not None and stop_state != _STOP_STATE_IDLE
    # VERIFIED: state.py:2813 — to_dict serializes `_in_stage_execution` as
    # `orchestrating`, which is the key detect.is_excluded reads.
    orchestrating = _attr(slot, "_in_stage_execution")

    # display_title is what the operator sees and what a notification must quote,
    # so a stall notice reads the same as the sidebar row it refers to
    # (VERIFIED: state.py:2455 property, used by to_dict at :2791).
    title = _redact(_attr(slot, "display_title", None) or _attr(slot, "title", ""))

    facts = SlotFacts(
        key=key,
        title=title,
        running=running,
        stop_state=stop_state,
        pending_approval=pending_approval,
        pending_approval_info=_approval_info(messages) if pending_approval else None,
        needs_input=needs_input,
        has_options=has_options,
        options=tail.options,
        waiting_for_input=waiting_for_input,
        interrupted=_interrupted(messages, running),
        queue_depth=_count(queue_depth),
        wait_state=wait_state if isinstance(wait_state, dict) else None,
        last_activity_ts=tail.last_activity_ts,
        last_turn_ts=_last_turn_ts(tail, running, slot),
        messages=len(messages) if isinstance(messages, list) else 0,
        memory_mode=_text(_attr(slot, "memory_mode", "")),  # VERIFIED: state.py:1770
        app=_text(_attr(slot, "_app", "")),  # VERIFIED: state.py:1773
        origin=_text(_attr(slot, "_origin", "")),  # VERIFIED: state.py:1796
        # VERIFIED: state.py:2393 (property) — `bool(_app) and not _human_seen`.
        unattended=_tri(_attr(slot, "unattended")),
        project=_text(_attr(slot, "project", "")),  # VERIFIED: state.py:1494
        workspace=_text(_attr(slot, "workspace", "")),  # VERIFIED: state.py:1493
        linked_session_key=_text(
            _attr(slot, "linked_session_key", "")  # VERIFIED: state.py:1850
        ),
        source_links=_source_links(slot),
        todo=_todo(slot),
        trust=_tri(_attr(slot, "_trust")),  # VERIFIED: state.py:1509
        silent_secs=silent_secs,
    )

    # The detector-shaped twin. Keys and value shapes match `to_dict` so
    # detect.py's pure functions run unchanged; `messages` carries ROWS here,
    # because detect_error_loops and build_reason_prompt read the transcript
    # while the SlotFacts field carries the count `to_dict` puts on the wire.
    #
    # A bounded COPY of the tail, not the live list. SlotFacts and Observation
    # are documented snapshots, and a live list inside one is a snapshot that
    # keeps changing — a facts_hash over it would never settle. Rejected
    # alternative: aliasing `slot.messages`, which is free but makes the
    # immutability claim false and leaves a detector's slice racing appends.
    raw: dict[str, Any] = {
        "key": key,
        "title": title,
        "running": bool(running),
        "stop_state": stop_state or _STOP_STATE_IDLE,
        "stopping": stopping,
        "pending_approval": bool(pending_approval),
        "waiting_for_input": bool(waiting_for_input),
        "needs_input": bool(needs_input),
        "question_blocking": bool(question_blocking),
        "wait_state": facts.wait_state,
        "orchestrating": bool(orchestrating),
        "subagents_running": bool(subagents_running),
        "queue_depth": facts.queue_depth,
        "last_activity_ts": tail.last_activity_ts,
        "last_ts": tail.last_ts,
        "last_turn_ts": facts.last_turn_ts,
        "created": created,
        "memory_mode": facts.memory_mode,
        "messages": (
            list(messages[-RAW_TAIL_MESSAGES:]) if isinstance(messages, list) else []
        ),
    }
    return facts, raw


# ---------------------------------------------------------------------------
# Fleet-wide reads
# ---------------------------------------------------------------------------


def _subagent_parents(state: Any) -> frozenset[str] | None:
    """Session keys with at least one live subagent, in ONE pass.

    ``serialize_slots`` asks per slot (``running_agents_for(f"dashboard:{key}")``,
    VERIFIED: state.py:5925), but that method builds a redacted summary dict for
    every matching agent and scans the whole registry each call — O(slots x
    agents) plus a redaction battery per agent, to answer a boolean. One pass
    over the registry answers it for the whole fleet.

    Returns None when the registry cannot be read that way, which tells the
    caller to fall back to the public per-slot accessor.
    """
    subs = _attr(state, "subagents")  # VERIFIED: state.py:2932
    if subs is None:
        # No subagent manager means no subagents, which is a reading, not a gap.
        return frozenset()
    agents = _attr(subs, "_agents")  # VERIFIED: kiro_crew/subagent.py:1298
    if not isinstance(agents, dict):
        return None
    try:
        return frozenset(
            _text(_attr(info, "parent_session_key", ""))  # VERIFIED: subagent.py:1001
            for info in agents.values()
            if not _attr(info, "done", False)  # VERIFIED: subagent.py:990
        )
    except Exception:
        logger.debug("conductor.observe: subagent registry unreadable", exc_info=True)
        return None


def _subagents_running(state: Any, key: str, parents: frozenset[str] | None) -> bool | None:
    """Whether a subagent is live under *key*. Falls back to the public accessor."""
    # VERIFIED: state.py:5925 — the parent key of a dashboard slot's subagents is
    # exactly f"dashboard:{slot.key}".
    parent_key = f"dashboard:{key}"
    if parents is not None:
        return parent_key in parents
    fn = _attr(_attr(state, "subagents"), "running_agents_for")
    if not callable(fn):
        return None
    try:
        return bool(fn(parent_key))
    except Exception:
        logger.debug("conductor.observe: subagent lookup failed for %s", key, exc_info=True)
        return None


def _background_headroom(state: Any) -> int | None:
    """Free permits under the unattended-turn cap, or None when unreadable.

    VERIFIED: state.py:3664 ``background_turn_stats() -> {"cap", "running",
    "waiting"}``. ``waiting`` is deliberately ignored: a queued turn holds no
    permit, so counting it would understate the headroom and stop the driver
    starting work the platform would have run. The cap is a real ceiling — a turn
    that waits past ``_BACKGROUND_QUEUE_WAIT_SECS`` is ABANDONED with a
    ``TimeoutError`` (state.py:3703-3715) — so proposing past it loses work.
    """
    fn = _attr(state, "background_turn_stats")
    if not callable(fn):
        return None
    try:
        stats = fn()
    except Exception:
        logger.debug("conductor.observe: background turn stats unavailable", exc_info=True)
        return None
    if not isinstance(stats, dict):
        return None
    try:
        return max(0, int(stats.get("cap", 0)) - int(stats.get("running", 0)))
    except (TypeError, ValueError):
        return None


def observe(state: Any, *, now: float | None = None) -> Observation:
    """One tick's worth of fleet facts. Synchronous, allocation-light, total.

    *now* is injectable for the same reason ``detect_stalls`` takes it: one sweep
    must judge every slot against the same instant, and a test must be able to
    pin it. Defaults to the wall clock.

    Total in the sense that matters for a control loop: a slot whose reads blow
    up is logged and SKIPPED, not raised. The alternative is one malformed slot
    stopping the driver from observing the other twenty-nine — the failure mode
    watcher.py:225-237 already chose against.
    """
    ts = time.time() if now is None else now
    # VERIFIED: state.py:5923 iterates `self._slots.values()`; watcher.py:227
    # reads the same attribute. Copied to a list because a dict is not a
    # snapshot; there is no `await` in this function, so nothing can mutate it
    # under us, and the copy keeps that true if that ever changes.
    raw_slots = _attr(state, "_slots") or {}
    if not isinstance(raw_slots, dict):
        logger.warning("conductor.observe: state._slots is not a mapping; observing nothing")
        raw_slots = {}
    parents = _subagent_parents(state)

    facts: dict[str, SlotFacts] = {}
    raw_for_detect: list[dict] = []
    running_turns = 0
    for raw_key, slot in list(raw_slots.items()):
        key = _text(_attr(slot, "key", raw_key)) or _text(raw_key)
        if not key:
            continue
        try:
            one, raw = _slot_facts(
                slot,
                key,
                now=ts,
                subagents_running=_subagents_running(state, key, parents),
            )
        except Exception:
            logger.exception("conductor.observe: skipped an unreadable slot (%s)", key)
            continue
        facts[key] = one
        raw_for_detect.append(raw)
        if one.running:
            running_turns += 1

    return Observation(
        ts=ts,
        slots=facts,
        # Counted from the same pass rather than asked of the platform: a second
        # source (`running_session_keys()`) counts SESSIONS, and a slot bound to
        # a linked session key would be counted twice or not at all.
        running_turns=running_turns,
        background_headroom=_background_headroom(state),
        raw_for_detect=raw_for_detect,
    )
