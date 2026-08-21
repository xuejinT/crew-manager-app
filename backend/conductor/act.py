"""The executor — the only module in the Conductor with side effects.

Everything upstream of here is inert. :mod:`intents` is data, :mod:`policy` is
arithmetic over tiers, the gate returns a :class:`~intents.Decision` and touches
nothing. This module is where a decision becomes a real turn in a real session,
so it is written defensively on purpose and it is deliberately small.

Four rules shape every line of it:

* **A refusal is a return value, never an exception.** The caller is a 60s
  control loop; a raise that escapes it stops the whole feature. The only thing
  this module re-raises is ``CancelledError``, because swallowing that lies to
  the event loop about whether the task is still alive.
* **The hard-deny set is re-checked here.** The gate checks it too. That is the
  point — ``intents.DENY_HARD``'s own docstring promises the check exists in
  three independent places, so a bug in the gate is not by itself sufficient to
  execute one of them. The cost is one frozenset lookup.
* **The dispatch table is the authority surface.** A class with no entry cannot
  execute, whatever tier a gate stamped on it. Adding a row is a design decision
  taken in review, not something a config file or a steer instruction can do.
* **Claim before acting, not after.** The idempotency key is written to disk
  *before* the side effect. A crash between the write and the effect therefore
  costs one skipped action; the reverse order costs a duplicated agent turn —
  real tokens, real tool calls, real repository writes. Only one of those two
  failure modes is acceptable, and the plan's restart path ("never re-dispatch
  on the assumption a thing did not happen") assumes this one.
* **A claim is released whenever the executor can PROVE nothing happened.**
  Every refusal an executor returns is raised before its first mutation, which
  is a property of this module maintained by construction and stated in each
  executor's docstring. The one direction that is never released is *unknown*:
  a raise, a cancellation, or a platform call that may have half-landed keeps
  the claim, because unknown means reconcile. Retaining a claim by default was
  the alternative and it is worse than it looks — ``Proposal.signature``
  deliberately excludes message bodies, so one badly composed continuation
  would retire that signature permanently and the session would never be
  steered for that reason again. Retry churn is bounded by the gate's budgets
  and cooldowns; silent paralysis is bounded by nothing.

Rejected alternative for reaching the platform: calling the aiohttp handlers
(``api_chat_slot_context``, ``api_chat_slot_continue``) with a duck-typed
request object. They are real, documented APIs and it would have been less code,
but a handler that grows one ``request.headers`` read breaks the shim silently,
and both handlers' first act is an app-token ownership check whose whole purpose
is to constrain *external* callers — faking a request to satisfy it would be
forging the identity the check exists to establish. The in-process primitives
those handlers wrap are used instead, with each one's file:line recorded.
"""

from __future__ import annotations

import asyncio
import contextlib
import importlib
import inspect
import logging
import os
import re
import time
from collections.abc import Awaitable, Callable
from pathlib import Path
from typing import Any

from . import store
from .intents import Decision, Proposal, Verdict, is_hard_denied, spec_for

logger = logging.getLogger(__name__)

APP_NAME = "crew-manager"

#: The Conductor's own session. ``watcher.py:102`` and ``src/model.ts:1032``
#: already exempt this key from every board lane, which is what makes it safe to
#: narrate into: a digest here cannot be mistaken for a stalled worker.
CONDUCTOR_SLOT = "crew-manager-conductor"

#: Attribution stamped on every context entry we write. Not caller-chosen — see
#: :func:`_resolve_source`.
CONTEXT_SOURCE = "crew-manager-conductor"

#: Where the notification bell's entries land. One channel per signal kind so the
#: operator can silence the digest without silencing an escalation.
ESCALATE_CHANNEL = "conductor-escalation"
NOTIFY_CHANNEL = "conductor"

# VERIFIED: dashboard/chat_handlers.py:5353 — the context endpoint's own limit
# (a function local, so it cannot be imported; mirrored rather than guessed).
MAX_CONTEXT_CHARS = 40_000

# UNVERIFIED: there is no length cap on POST /api/chat's message anywhere in
# dashboard/chat_handlers.py — grepped for 40000/40_000/MAX_MESSAGE across
# dashboard/. This mirrors the verified context cap rather than inventing a
# platform limit that does not exist; the real ceiling is the model's context
# window and a composed continuation is two paragraphs.
MAX_MESSAGE_CHARS = 40_000

# VERIFIED: notifications/bus.py:64-65. Clipped here rather than left to
# NotificationPayload.validate(), because a body one character over the line
# would drop an escalation entirely — and an escalation is the message that
# matters most.
MAX_TITLE_CHARS = 500
MAX_BODY_CHARS = 20_000

# VERIFIED: dashboard/state.py:923 and dashboard/chat_handlers.py:5288. Imported
# at runtime when the gateway is present; these are the offline fallbacks.
_FALLBACK_MAX_PENDING_CONTEXT = 50
_FALLBACK_MAX_CONTEXT_PER_SOURCE = 10

#: How many idempotency keys to keep. The window this guards is a crash replay,
#: which is minutes wide; 2000 entries is months of a 60s tick's worth of real
#: actions. A key that has aged out of it is not a replay, it is a new decision.
ACTED_KEEP = 2000

#: Slot names we are willing to mint. ``get_or_create_slot`` folds a name through
#: ``_normalize_slot_key`` (VERIFIED: state.py:4852, defined at :1279) before its
#: idempotency lookup, so a name that would be folded makes "does this slot
#: already exist?" unanswerable from out here. Restricting the charset makes the
#: fold a no-op and the pre-existence check exact.
_SLOT_NAME_RE = re.compile(r"^[A-Za-z0-9._-]{1,120}$")

#: Every slot this module mints starts here. Two jobs, and the second is the one
#: that made it a constant: it keeps the Conductor inside its own namespace, so
#: ``session_create`` can never be aimed at an existing session it did not name
#: (``get_or_create_slot`` ADOPTS on a name collision, which would otherwise be a
#: quiet way to take over the operator's tab). It also excludes the one name shape
#: ``_normalize_slot_key`` actually rewrites — a leading ``dashboard:``/
#: ``dashboard_`` is stripped (VERIFIED: state.py:1304-1307), and that makes the
#: pre-existence check answer about a different slot than the one created.
_SLOT_NAME_PREFIX = "cm-"

#: Public alias. ``steps.py`` has to predict the name the executor will mint so it
#: can skip a leaf whose worker already exists, and it must predict it with the
#: SAME constant — a second literal here is how the proposer and the executor come
#: to disagree about which slot a leaf owns.
SLOT_NAME_PREFIX = _SLOT_NAME_PREFIX


def host_symbol(module: str, name: str) -> Any:
    """Public view of the guarded host-import helper.

    ``steps.py`` needs the same "resolve a gateway private, degrade to None"
    behaviour when it re-adopts worker slots, and copying the try/except would be
    a second place for the degradation policy to drift.
    """
    return _host(module, name)


#: Approval modes the OPERATOR may declare for a goal's workers. Mirrors the
#: platform's own slot-scoped set (VERIFIED: chat_handlers.py:122,
#: ``_SLOT_SCOPED_TRUST_MODES = ("trust", "trust_reads")``). Global modes — and
#: ``yolo`` in particular — are deliberately absent: this may only ever widen the
#: one session the Conductor just minted.
_WORKER_TRUST_MODES = frozenset({"trust", "trust_reads"})


#: The platform's placeholder for an unnamed session.
_NEW_SESSION_TITLE = "New Session…"


def _name_worker(slot: Any, leaf_id: str, leaf_title: str) -> str:
    """Give a worker slot a title that says what it is. Returns the title set.

    ``get_or_create_slot`` takes no title, so a worker was born as "New Session…"
    and stayed that way until the platform's auto-titler guessed one from the
    conversation. On a board of six autonomous workers that is six identical rows:
    the operator can see that something is happening and not what, which defeats
    the point of putting them on the board at all.

    The leaf already carries the operator's own words for the work, so use them —
    ``constants · Piece constants and starting FEN``. The leaf id leads because it
    is what every other surface (ledger rows, digests, slot names, dependency
    lines) identifies the work by, so the board agrees with them at a glance.

    Only overwrites a placeholder. A title the operator or the auto-titler has
    already set is theirs, and a re-adopted worker must not have its history-derived
    name replaced on every tick.
    """
    current = str(getattr(slot, "title", "") or "").strip()
    key = str(getattr(slot, "key", "") or "")
    if current and current not in (_NEW_SESSION_TITLE, key):
        return current
    label = leaf_title.strip() or leaf_id
    title = f"{leaf_id} · {label}" if label != leaf_id else leaf_id
    try:
        slot.title = title[:120]
    except Exception:
        logger.debug("conductor: could not set a title on %s", key, exc_info=True)
        return current
    return title


def name_worker(slot: Any, leaf_id: str, leaf_title: str = "") -> str:
    """Public entry point for :func:`_name_worker`.

    ``steps.readopt_workers`` recreates worker slots after a restart and must name
    them the same way the executor does, or a re-adopted worker would appear on the
    board as "New Session…" while a freshly dispatched one is labelled.
    """
    return _name_worker(slot, leaf_id, leaf_title)


def _apply_declared_worker_trust(state: Any, slot: Any, requested: Any) -> str:
    """Carry out the operator's DECLARED worker approval mode. Never choose one.

    ``trust`` is in the Conductor's hard-DENY set and stays there. That rule is
    about the driver *deciding* to widen permissions. This is the other thing: the
    operator writes ``scope.worker_trust`` on the goal, and the executor applies
    that written instruction to a session it minted itself — the same shape as
    ``scope.adopt_slots``, where a declaration beats inference. No proposal, no
    model and no steer instruction can reach this; only a field the operator typed.

    **Why it has to exist.** A slot is born with ``_trust`` and ``_trust_reads``
    False, so an app-owned worker's first tool call parks on an approval and is
    DENIED after 180s by the unattended deny-fast. This was observed, not
    theorised: a worker briefed to "read CLAUDE.md first" had both reads denied and
    stopped having written nothing. No HTTP surface pre-authorizes a slot at
    creation (``POST /api/chat/mode`` requires the slot to already exist), so
    without this an unattended run cannot complete a single tool call.

    Returns a short note for the ledger, or ``""`` when nothing was declared. A
    value outside :data:`_WORKER_TRUST_MODES` is ignored rather than guessed at.
    """
    mode = str(requested or "").strip().lower()
    if not mode:
        return ""
    if mode not in _WORKER_TRUST_MODES:
        logger.warning(
            "conductor: ignoring worker_trust %r — not one of %s",
            mode, sorted(_WORKER_TRUST_MODES),
        )
        return ""
    try:
        # Mirrors the platform's SINGLE-approval trust path
        # (chat_handlers.py:5123-5127), not its bulk one. The difference is the
        # policy KEY and it is the whole correctness of this function: a slot we
        # created carries a ``linked_session_key``, and the running session reads
        # its approval policy under THAT key. Writing ``dashboard:{slot.key}``
        # instead — which the bulk path does, for slots that have no link — leaves
        # the live session on its default policy, so the grant reports success and
        # the worker's first tool call parks anyway. The platform's own comment at
        # that line says the same thing: "a linked cron/workflow slot runs under
        # linked_session_key, not dashboard:{key}".
        slot._trust = mode == "trust"
        slot._trust_reads = True
        sessions = getattr(state, "sessions", None)
        setter = getattr(sessions, "set_approval_policy", None)
        if callable(setter):
            session_key = getattr(slot, "linked_session_key", "") or f"dashboard:{getattr(slot, 'key', '')}"
            setter(session_key, "auto" if slot._trust else "")
    except Exception:
        logger.warning("conductor: could not apply worker_trust", exc_info=True)
        return ""
    # Logged rather than separately audited: this is a property of the
    # session_create the ledger is already recording, and it travels in that row's
    # detail, so a reader sees the grant and the creation as one event.
    logger.info(
        "conductor: applied operator-declared worker_trust=%s to %s",
        mode, getattr(slot, "key", ""),
    )
    return f"operator-declared worker_trust={mode} applied"


def clear_conductor_chat(state: Any) -> dict[str, Any]:
    """Empty the Conductor chat — the visible rows AND the agent's memory of them.

    "Clear the chat" has two halves and only doing one is worse than doing neither.
    Wiping the visible rows while the agent keeps the conversation leaves an
    operator talking to something that remembers a history they cannot see; wiping
    the agent while the rows remain leaves rows that no longer correspond to
    anything. So this does both, in the order that makes each stick:

    1. **Queued context** (``slot._pending_context``) — entries waiting to ride
       along with the next turn. Dropped first: they are the one part that would
       otherwise survive every step below and reappear in the next answer.
    2. **The in-memory transcript**, with ``_dirty`` cleared so the periodic flush
       cannot write the rows back out after we have removed the file.
    3. **The slot itself**, popped from the registry. That is what drops the ACP
       session, and dropping the session is what makes the agent forget — there is
       no "reset context" call, so a fresh session IS the reset.
    4. **The persisted transcript**, RENAMED aside rather than unlinked. Removing
       only the slot was tried and is not enough: the next
       ``get_or_create_slot`` rehydrates from history and the whole conversation
       comes back (observed). A rename is safe with an open descriptor, needs no
       history lock, and leaves the operator a way back — "clear the chat for a
       demo" should not be the one irreversible button in the panel.

    Refuses while a turn is running. Clearing a session mid-turn would leave the
    ACP runtime writing into a slot nobody owns.
    """
    name = CONDUCTOR_SLOT
    slots = getattr(state, "_slots", None)
    slot = slots.get(name) if isinstance(slots, dict) else None
    if slot is not None and bool(getattr(slot, "running", False)):
        return {"ok": False, "refused": "the Conductor is mid-turn; try again when it settles"}

    dropped_context = 0
    dropped_rows = 0
    if slot is not None:
        pending = getattr(slot, "_pending_context", None)
        if isinstance(pending, list):
            dropped_context = len(pending)
            pending.clear()
        messages = getattr(slot, "messages", None)
        if isinstance(messages, list):
            dropped_rows = len(messages)
            messages.clear()
        for attr, value in (("_dirty", False), ("_resumed_count", 0), ("_disk_window_len", 0)):
            try:
                setattr(slot, attr, value)
            except Exception:
                logger.debug("conductor: could not reset slot.%s", attr, exc_info=True)
        try:
            note = _host("kiro_crew.dashboard.channel_slots", "note_slot_closed")
            if note is not None:
                note(state, name)
        except Exception:
            logger.debug("conductor: note_slot_closed failed", exc_info=True)
        if isinstance(slots, dict):
            slots.pop(name, None)

    archived = ""
    try:
        home = os.environ.get("KIROCREW_HOME") or str(Path.home() / ".kiro" / "crew")
        live = Path(home) / "sessions" / f"dashboard_{name}.jsonl"
        if live.exists():
            keep = store.conductor_dir() / "chat-archive"
            keep.mkdir(parents=True, exist_ok=True)
            target = keep / f"{live.stem}.{int(time.time())}.jsonl"
            live.replace(target)
            archived = str(target)
    except OSError:
        logger.warning("conductor: could not archive the chat transcript", exc_info=True)

    for call in ("push_slots_update", "broadcast_slots"):
        fn = getattr(state, call, None)
        if callable(fn):
            try:
                fn()
            except Exception:
                logger.debug("conductor: %s failed after clearing the chat", call, exc_info=True)
    return {
        "ok": True,
        "rows_cleared": dropped_rows,
        "context_cleared": dropped_context,
        "archived_to": archived,
    }


def worker_slots(state: Any, goal_id: str = "") -> list[dict[str, Any]]:
    """The worker slots this app owns, optionally just one goal's.

    Reads the live registry rather than the goal file, because the question the
    operator is asking — "what sessions exist for this?" — is about the gateway, and
    a leaf that was never dispatched has no slot while a slot whose leaf was removed
    still does. Message counts come from the LINKED session, since a worker slot's
    own list is always empty (see :func:`_linked_transcript_rows`).
    """
    prefix = f"{_SLOT_NAME_PREFIX}{goal_id}-" if goal_id else _SLOT_NAME_PREFIX
    slots = getattr(state, "_slots", None)
    if not isinstance(slots, dict):
        return []
    out: list[dict[str, Any]] = []
    for name, slot in sorted(slots.items()):
        if not str(name).startswith(prefix):
            continue
        out.append({
            "slot": str(name),
            "title": str(getattr(slot, "title", "") or ""),
            "running": bool(getattr(slot, "running", False)),
            "messages": _linked_transcript_rows(slot),
        })
    return out


def remove_worker_slots(
    state: Any, *, goal_id: str = "", slot: str = "", force: bool = False
) -> dict[str, Any]:
    """Retire this app's worker sessions — one, or all of a goal's.

    The gap this fills. A Conductor worker is named ``cm-<goal>-<leaf>``, so once its
    goal is deleted nothing in the panel can address it again: the operator was left
    with sessions they could see and not remove. Leaking them was not a design
    decision, it was an omission.

    **Archived, not deleted, and never silently.** A worker's transcript is the
    record of what was actually built and why — the goal file is bookkeeping, the
    transcript is evidence. So the slot goes and the transcript is renamed aside,
    the same treatment :func:`clear_conductor_chat` gives the chat.

    **Refuses a running worker unless forced.** Removing a goal must not kill a turn
    in flight as a side effect; that is the operator's own decision to take
    explicitly, which is what ``force`` is.

    Only ever touches names beginning with :data:`_SLOT_NAME_PREFIX`. The app removes
    what it created and nothing else — a session the operator opened themselves is
    theirs, and the dashboard's own close is where that belongs.
    """
    slots = getattr(state, "_slots", None)
    if not isinstance(slots, dict):
        return {"ok": False, "refused": "no slot registry"}

    if slot:
        if not str(slot).startswith(_SLOT_NAME_PREFIX):
            return {
                "ok": False,
                "refused": f"{slot!r} is not a Conductor worker; close it from the dashboard",
            }
        targets = [str(slot)] if slot in slots else []
    else:
        prefix = f"{_SLOT_NAME_PREFIX}{goal_id}-" if goal_id else ""
        if not prefix:
            return {"ok": False, "refused": "name a slot or a goal"}
        targets = [str(n) for n in sorted(slots) if str(n).startswith(prefix)]

    running = [n for n in targets if bool(getattr(slots.get(n), "running", False))]
    if running and not force:
        return {
            "ok": False,
            "refused": f"{len(running)} worker(s) are mid-turn: "
                       + ", ".join(running[:3]),
            "running": running,
        }

    removed: list[str] = []
    archived: list[str] = []
    for name in targets:
        live = slots.get(name)
        link = str(getattr(live, "linked_session_key", "") or "")
        try:
            note = _host("kiro_crew.dashboard.channel_slots", "note_slot_closed")
            if note is not None:
                note(state, name)
        except Exception:
            logger.debug("conductor: note_slot_closed failed for %s", name, exc_info=True)
        slots.pop(name, None)
        removed.append(name)
        # The transcript lives under the LINKED key, folded the way the platform
        # folds session filenames.
        for key in (link.replace(":", "_"), f"dashboard_{name}"):
            if not key:
                continue
            try:
                home = os.environ.get("KIROCREW_HOME") or str(Path.home() / ".kiro" / "crew")
                path = Path(home) / "sessions" / f"{key}.jsonl"
                if not path.exists():
                    continue
                keep = store.conductor_dir() / "session-archive"
                keep.mkdir(parents=True, exist_ok=True)
                target = keep / f"{path.stem}.{int(time.time())}.jsonl"
                path.replace(target)
                archived.append(str(target))
            except OSError:
                logger.warning("conductor: could not archive %s", key, exc_info=True)

    for call in ("push_slots_update", "broadcast_slots"):
        fn = getattr(state, call, None)
        if callable(fn):
            try:
                fn()
            except Exception:
                logger.debug("conductor: %s failed after removing workers", call, exc_info=True)
    return {"ok": True, "removed": removed, "archived": archived, "forced": bool(running)}


def conductor_link_key(goal_id: str, leaf_id: str) -> str:
    """The ``linked_session_key`` stamped on a Conductor-created session.

    **Per LEAF, not per goal, and that divergence from the plan is deliberate.**
    The plan's table writes ``linked_session_key=f"conductor:{goal_id}"``, but
    this field is not a label: ``_ChatSlot.linked_session_key``'s own comment is
    "when set, ``_run_chat`` uses this as session key" (VERIFIED: state.py:1850)
    and ``slot_history_key`` returns it verbatim as the TRANSCRIPT path
    (VERIFIED: chat_utils.py:556-558). Two leaves of one goal sharing the literal
    per-goal value would therefore share one agent session and one ``.jsonl``:
    two workers interleaving turns and transcripts under a single key. The
    platform's own background binders are per-unit for the same reason
    (``cron_inject.py:96`` uses ``f"cron:{job.id}"``).

    Exposed rather than inlined because the reconciler and the board both need to
    recognise a Conductor session from its slot payload — ``to_dict`` publishes
    ``linked_session_key`` (VERIFIED: state.py:2862), so this is the one binding
    that survives a restart without a private field.
    """
    return f"conductor:{goal_id}:{leaf_id}" if leaf_id else f"conductor:{goal_id}"


#: Origins a background caller may legitimately declare. ``user`` is absent and
#: that is the whole reason this set exists: ``request_slot_origin``'s docstring
#: (VERIFIED: state.py:1325-1337) forbids background callers from claiming it, and a slot
#: mislabelled USER is handed to any app holding the ``slots:user`` scope.
_ALLOWED_ORIGINS = frozenset({"app", "cron", "system"})

#: Classes whose audit record is written audit-or-deny. These are the ones that
#: dispatch an agent turn, i.e. the ones an operator would need the log to
#: reconstruct. The reversible classes are audited best-effort instead: losing an
#: audit row must not cost the operator the notification that row describes.
_CRITICAL_AUDIT = frozenset({"session_continue", "session_create"})


# ── guarded access to the gateway ────────────────────────────────────────────

_HOST_CACHE: dict[tuple[str, str], Any] = {}


def _host(module: str, name: str) -> Any:
    """One guarded, memoized lookup of one gateway symbol, or ``None``.

    Guarding every platform import is a per-symbol obligation and this module
    needs a dozen of them. Written out longhand that is a dozen chances to omit
    an ``except`` and take the app's UI down with a moved private symbol, so the
    guard lives in one place and every call site inherits it.

    Deferred rather than module-level, for two reasons that both bite:
    ``dashboard.chat_runner`` is a circular import for an app backend — the
    gateway imports the app's routes, which import us — which is why
    ``spec_builder/backend/routes.py:1995`` imports it inside its function too;
    and this module must import with no gateway present at all so the offline
    selftest can exercise the refusal paths.

    Absence is cached as well as presence. A gateway that moved a symbol will not
    grow it back inside one process, and retrying the import every tick turns one
    degraded class into a log flood.

    A missing MODULE logs without a traceback and a failing one logs with it. The
    split is not cosmetic: no gateway at all is the expected state under the
    offline selftest, and eight stack traces of ``No module named 'kiro_crew'``
    would bury the one import that failed for an interesting reason.

    Rule-4 note: ``import_module`` touches the filesystem on a cold module, and
    this runs on the event loop. Every module named in this file is already in
    ``sys.modules`` in a live gateway (``dashboard.server`` pulls in
    ``chat_handlers`` → ``chat_runner`` → ``chat_utils``; ``state`` pulls in the
    notification bus), so the call resolves from the module cache. The memo means
    a cold path can happen at most once per symbol per process even if that
    changes.
    """
    key = (module, name)
    if key in _HOST_CACHE:
        return _HOST_CACHE[key]
    value: Any = None
    try:
        value = getattr(importlib.import_module(module), name, None)
        if value is None:
            logger.warning("conductor: gateway symbol %s.%s is missing", module, name)
    except ModuleNotFoundError as exc:
        logger.warning("conductor: gateway module %s unavailable (%s)", module, exc)
    except Exception:
        logger.warning("conductor: gateway module %s failed to import", module, exc_info=True)
    _HOST_CACHE[key] = value
    return value


def _cap(module: str, name: str, fallback: int) -> int:
    """A platform ceiling, read from the platform when it is there.

    Importing the constant rather than copying it means a gateway that raises its
    own limit raises ours in the same release. The fallback exists for the
    offline case only.
    """
    value = _host(module, name)
    return value if isinstance(value, int) and value > 0 else fallback


def _redact(text: object) -> str:
    """Strip credentials and exfiltration URLs from composed prose.

    Every string this module writes into a session, a transcript or a
    notification was composed by a model from an untrusted transcript. The
    platform redacts its own LLM output at every such boundary
    (``cron_inject.py:113``, ``chat_runner.py:3573``) and this is the same
    boundary. A missing security module returns the text unchanged rather than
    dropping the action: the alternative is a Conductor that silently stops
    steering on a gateway that renamed a helper.
    """
    raw = text if isinstance(text, str) else ""
    if not raw:
        return ""
    strip_urls = _host("kiro_crew.security", "redact_exfiltration_urls")
    strip_creds = _host("kiro_crew.security", "redact_credentials")
    if strip_urls is None or strip_creds is None:
        return raw
    try:
        out, _ = strip_urls(raw)
        out, _ = strip_creds(out)
    except Exception:
        logger.debug("conductor: redaction failed; passing text through", exc_info=True)
        return raw
    return out if isinstance(out, str) else raw


_TRUNCATION_MARKER = "\n[truncated by conductor]"


def _clip(text: str, limit: int) -> str:
    """Truncate to *limit* INCLUSIVE of the marker, saying so in the text.

    Marked rather than silent. A digest that stops mid-sentence with no
    explanation reads like a bug in the session it was injected into, and the
    reader has no way to know they are looking at part of a message.

    The reservation is computed from the marker rather than written as a literal,
    because the two drifting apart is not cosmetic: ``NotificationPayload.validate``
    rejects an over-length title outright (VERIFIED: bus.py:160-161), so a clip
    that overshot would drop the escalation it was clipping — turning a length
    guard into the failure it exists to prevent.
    """
    if len(text) <= limit:
        return text
    if limit <= len(_TRUNCATION_MARKER):
        return text[:limit]
    return text[: limit - len(_TRUNCATION_MARKER)].rstrip() + _TRUNCATION_MARKER


# ── the idempotency ledger: data/conductor/acted.json ────────────────────────


def acted_path() -> Path:
    """Where completed idempotency keys live. Exposed for the reconciler."""
    return store.conductor_dir() / "acted.json"


def _prune(acted: dict[str, Any]) -> dict[str, Any]:
    """Keep the newest :data:`ACTED_KEEP` entries.

    Newest-first by absolute wall-clock ``ts``, never a monotonic instant: this
    file outlives the process, and a monotonic value compared across a restart is
    meaningless. That is the same mistake the plan records as batty's unfixed
    intervention-dedup bug.
    """
    if len(acted) <= ACTED_KEEP:
        return acted
    ordered = sorted(
        acted.items(),
        key=lambda kv: kv[1].get("ts", 0.0) if isinstance(kv[1], dict) else 0.0,
        reverse=True,
    )
    return dict(ordered[:ACTED_KEEP])


def _acted_map(current: Any) -> dict[str, Any]:
    acted = current.get("acted") if isinstance(current, dict) else None
    return acted if isinstance(acted, dict) else {}


async def _claim(proposal: Proposal) -> dict[str, Any] | None:
    """Reserve *proposal*'s idempotency key. Returns the PRIOR record on a repeat.

    Read-modify-write inside :func:`store.update_json` means the test and the
    reservation are one locked critical section. Doing it as a read followed by a
    separate write is the lost-update race that would let two ticks — or a tick
    and a manual operator retry — both conclude the key was free.
    """
    key = proposal.idempotency_key()
    now = time.time()
    prior: dict[str, Any] | None = None

    def mutate(current: Any) -> dict[str, Any]:
        nonlocal prior
        acted = _acted_map(current)
        existing = acted.get(key)
        if isinstance(existing, dict):
            prior = existing
            return {"version": 1, "acted": acted}
        acted[key] = {
            "ts": now,
            "action_id": proposal.action_id,
            "action_class": proposal.action_class,
            "goal_id": proposal.goal_id,
            "signature": proposal.signature,
            "outcome": "claimed",
        }
        return {"version": 1, "acted": _prune(acted)}

    await store.update_json_async(acted_path(), mutate, {})
    return prior


async def _finish(proposal: Proposal, *, outcome: str, detail: str) -> None:
    """Stamp the real outcome onto a claim that has already been spent.

    Three words only: ``ok``, ``unknown``, or the ``claimed`` the claim was born
    with. There is deliberately no ``failed`` — a spent claim whose attempt did
    not succeed is either provably effect-free (in which case :func:`_release`
    removed it) or unknown, and inventing a third state the reconciler would have
    to interpret is how a recovery path grows a case nobody tested.
    """
    key = proposal.idempotency_key()

    def mutate(current: Any) -> dict[str, Any]:
        acted = _acted_map(current)
        record = acted.get(key)
        if isinstance(record, dict):
            record["outcome"] = outcome
            record["detail"] = detail[:240]
            record["done_ts"] = time.time()
        return {"version": 1, "acted": acted}

    await store.update_json_async(acted_path(), mutate, {})


async def _release(proposal: Proposal) -> None:
    """Drop a claim whose attempt provably had no side effect.

    Every refusal an executor RETURNS reaches here, because every one of them is
    raised before that executor's first mutation — a precondition ("the slot is
    running", "the source is at its pending-context cap"), a malformed param, or
    an unusable composition. All three are states a later tick can pass, and
    keeping the claim would retire the signature permanently: the session would
    never be steered again for that reason, which is silent paralysis rather than
    safety.

    Two cases deliberately do NOT release. An attempt that RAISED, and an
    executor that returns ``unknown_effect`` because the platform call it made may
    have half-landed. Unknown means reconcile, and reconciling is the restart
    path's job, not a retry's.
    """
    key = proposal.idempotency_key()

    def mutate(current: Any) -> dict[str, Any]:
        acted = _acted_map(current)
        acted.pop(key, None)
        return {"version": 1, "acted": acted}

    await store.update_json_async(acted_path(), mutate, {})


# ── audit ────────────────────────────────────────────────────────────────────

_SEL_ABSENCE_LOGGED = False


async def _audit(
    proposal: Proposal,
    *,
    outcome: str,
    error: str = "",
    critical: bool = False,
) -> bool:
    """Write one SEL row for this action. Returns False only on audit-or-deny.

    The operation name is ``conductor.<class>`` and never the platform's own
    (``dashboard_continue``, ``context_inject``). That is the requirement, not a
    convenience: an autonomous action must not be indistinguishable in the audit
    log from an operator's click, and the in-process path would otherwise produce
    exactly the row a human's click produces.

    ``critical=True`` is the platform's audit-or-deny flag — the event is written
    synchronously and a filesystem failure re-raises so the caller can refuse the
    action (VERIFIED: sel.py:737-758). We honour it for the turn-dispatching classes. A gateway
    with no SEL module at all is a different case and proceeds with a warning:
    that gateway also has no turn dispatch, so nothing authority-carrying can
    reach a side effect anyway, and refusing here would only turn a missing
    symbol into a mystery.

    Offloaded to a thread. ``log_tool_invocation`` writes and HMAC-chains a file;
    the plan requires it awaited rather than fired off so ordering and the
    audit-or-deny raise both actually hold.
    """
    global _SEL_ABSENCE_LOGGED
    sel = _host("kiro_crew.sel", "sel")
    if sel is None:
        if not _SEL_ABSENCE_LOGGED:
            # Once per process. The condition is static, and repeating it twice per
            # action would drown the log the operator reads to find out what the
            # Conductor actually did.
            _SEL_ABSENCE_LOGGED = True
            logger.warning(
                "conductor: no security event log on this gateway; actions are recorded "
                "only in the app's own ledger"
            )
        return True

    def _write() -> None:
        sel().log_tool_invocation(
            session_key=f"conductor:{proposal.goal_id}",
            agent=APP_NAME,
            source=f"app:{APP_NAME}",
            tool_name=f"conductor.{proposal.action_class}",
            tool_kind="conductor",
            outcome=outcome,
            resources=f"slot={proposal.target_slot}" if proposal.target_slot else "",
            error=error[:400],
            critical=critical,
            metadata={
                "action_id": proposal.action_id,
                "goal_id": proposal.goal_id,
                "signature": proposal.signature,
                "idempotency_key": proposal.idempotency_key(),
                "reasons": list(proposal.reasons)[:8],
            },
        )

    try:
        await asyncio.to_thread(_write)
    except Exception:
        logger.exception("conductor: audit write failed for %s", proposal.action_class)
        return not critical
    return True


# ── slot plumbing ────────────────────────────────────────────────────────────


def _slot_for(state: Any, name: str) -> Any:
    """The live slot named *name*, or None. Never creates one.

    ``get_slot`` is the public accessor (VERIFIED: dashboard/state.py:4572); the
    ``_slots`` fallback is what the handlers themselves reach for
    (VERIFIED: chat_handlers.py:5313) and covers a state object that predates it.
    """
    getter = getattr(state, "get_slot", None)
    if callable(getter):
        try:
            return getter(name)
        except Exception:
            logger.debug("conductor: get_slot(%s) raised", name, exc_info=True)
            return None
    slots = getattr(state, "_slots", None)
    return slots.get(name) if isinstance(slots, dict) else None


def _session_key(slot: Any) -> str:
    """The session a slot's conversation actually runs on.

    Never ``f"dashboard:{slot.key}"`` when the real helper is available: a
    channel-born slot's children register under the channel key, and the
    dashboard-prefixed form silently matches nothing — which would make the
    sub-agent guard below pass on precisely the slots it exists to protect
    (VERIFIED: chat_handlers.py:2604-2609 makes the same point).
    """
    resolve = _host("kiro_crew.dashboard.chat_utils", "effective_session_key")
    if resolve is not None:
        try:
            return str(resolve(slot))
        except Exception:
            logger.debug("conductor: effective_session_key raised", exc_info=True)
    return f"dashboard:{getattr(slot, 'key', '')}"


def _subagent_blocker(state: Any, slot: Any) -> str:
    """``slot_subagents_running`` while children are attached, else "".

    A transliteration of ``_subagents_attached_response``
    (VERIFIED: chat_handlers.py:2031-2074), which returns a ``web.Response`` and
    so cannot be called from here. Its three probes are copied including the
    fail-closed reading of a failed probe: an unreadable queue is *unknown*
    children, not zero children, and a new turn dispatched alongside a child
    interleaves tool calls and repository writes on one session.
    """
    subs = getattr(state, "subagents", None)
    if subs is None:
        return ""
    key = _session_key(slot)
    try:
        running = subs.running_agents_for(key)
    except Exception:
        logger.debug("conductor: running-agents probe failed", exc_info=True)
        return "slot_subagents_running"
    queued = 0
    if running is not None:
        try:
            queued = subs._queued_depth(key)
        except Exception:
            logger.debug("conductor: queued-depth probe failed", exc_info=True)
            queued = 1
    inflight = getattr(slot, "_subagent_deliveries_inflight", 0)
    if running is None or running or queued or inflight:
        return "slot_subagents_running"
    return ""


def _linked_transcript_rows(slot: Any) -> int:
    """How many real rows the slot's LINKED session has on disk.

    A Conductor worker slot is linked: ``get_or_create_slot`` is called with a
    ``linked_session_key``, and the turns land in THAT session's transcript, not in
    the slot's own ``messages`` list — which stays empty for the slot's whole life.

    This blind spot has now caused three separate failures, which is why it has a
    named helper instead of being re-derived at each site: the dispatch proposer
    read ``messages == 0`` as "never ran" and re-proposed a worker every tick
    forever; the board reported ``run=False`` for a working session; and
    ``session_continue`` refused with ``slot_empty`` for a session with a
    twenty-row transcript. The filename is the session key with ``:`` folded to
    ``_``, which is the platform's own convention for session files.
    """
    key = str(getattr(slot, "linked_session_key", "") or "").strip()
    if not key:
        return 0
    try:
        home = os.environ.get("KIROCREW_HOME") or str(Path.home() / ".kiro" / "crew")
        path = Path(home) / "sessions" / (key.replace(":", "_") + ".jsonl")
        if not path.exists():
            return 0
        rows = 0
        for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
            line = line.strip()
            if not line:
                continue
            # The first line is metadata, not conversation.
            if '"_type"' in line and '"metadata"' in line:
                continue
            rows += 1
        return rows
    except OSError:
        return 0


def _has_conversation(slot: Any) -> bool:
    """Whether there is anything here to continue.

    The platform's own predicate first, because it is the one ``/continue``
    authorizes on and a second reading of "is there a conversation" would
    eventually disagree with it about the same slot.

    Then, and only when that says no, the linked session's transcript — see
    :func:`_linked_transcript_rows`. The platform's predicate is right about the
    slots it was written for (a dashboard tab holds its own messages) and blind to
    the ones this app creates. Widening it here rather than in the platform keeps
    the answer identical for every slot the platform owns.
    """
    probe = _host("kiro_crew.dashboard.chat_handlers", "_has_conversation")
    if probe is not None:
        try:
            if bool(probe(slot)):
                return True
        except Exception:
            logger.debug("conductor: _has_conversation raised", exc_info=True)
    if bool(getattr(slot, "messages", None)):
        return True
    return _linked_transcript_rows(slot) > 0


def _pristine(slot: Any) -> bool:
    """True when nothing has ever been said to *slot* and nothing is pending.

    A stricter question than :func:`_has_conversation` and asked for a different
    reason: that one authorizes a continuation, this one authorizes a FIRST
    briefing. Any row at all, a queued message or a live turn all count as "used",
    because the cost of getting this wrong is two briefing turns racing inside one
    session — real tokens against the same repository.
    """
    if getattr(slot, "running", False):
        return False
    if getattr(slot, "queue_depth", 0):
        return False
    return not getattr(slot, "messages", None)


def _turn_blocker(state: Any, slot: Any, *, require_conversation: bool) -> str:
    """The platform's own 409 code for this slot, or "" when a turn may start.

    Mirrored from ``api_chat_slot_continue`` (VERIFIED: chat_handlers.py:2560-2617)
    rather than re-derived, exactly as the plan requires. The set is the product
    of real incidents — ``slot_orchestrating`` exists because ``running`` reads
    False *between* the stages of an autopilot plan — and a second, independently
    reasoned copy of it is how the Conductor would eventually dispatch a turn into
    a state the platform knows is unsafe.

    Read-only and synchronous by design, so the caller can hold ``slot._lock``
    across this check and the enqueue with no ``await`` in between.
    """
    if getattr(slot, "running", False):
        return "slot_running"
    if getattr(slot, "_in_stage_execution", False):
        return "slot_orchestrating"
    if getattr(slot, "_stopping", False) or getattr(slot, "_stop_state", "idle") != "idle":
        return "slot_stopping"
    if getattr(slot, "queue_depth", 0):
        return "slot_queue_pending"
    futures = getattr(slot, "_approval_futures", None) or {}
    try:
        if any(not f.done() for f in futures.values()):
            return "slot_approval_pending"
    except Exception:
        logger.debug("conductor: approval-future probe failed", exc_info=True)
        return "slot_approval_pending"
    blocked = _subagent_blocker(state, slot)
    if blocked:
        return blocked
    if require_conversation and not _has_conversation(slot):
        return "slot_empty"
    return ""


def _masquerade(body: str) -> str:
    """Why *body* may not be dispatched as written, or "".

    Two hazards, both structural rather than hypothetical, and both created by
    the fact that the text we dispatch is composed by a model:

    * **A leading ``/`` is a slash command, not a message.** ``_run_chat``
      classifies the first word and routes it to the CLI's command surface
      (VERIFIED: chat_runner.py:4110-4112, ``_SLASH_COMMANDS`` at
      chat_utils.py:192) — ``/clear`` and ``/compact`` are in that set, so one
      composed sentence beginning with a slash could wipe a worker's context
      instead of steering it. The blocked-command list protects the destructive
      ones; nothing protects the merely context-destroying ones.
    * **The runner classifies injections by PREFIX for rendering.**
      ``is_cron``/``is_subagent`` in ``_start_next_queued_turn`` are computed from
      the text (VERIFIED: chat_runner.py:3587-3588), so a body that happens to
      open with ``[Cron notification from "`` renders as a cron card with a
      parsed label. Our row must say what it is.

    Refusing beats sanitising: silently rewriting the composer's words would make
    the transcript disagree with the ledger about what was sent, and a composer
    that produces these needs fixing, not laundering. The check is skipped rather
    than guessed when the platform constants are unavailable — inventing the
    prefix strings would be inventing a platform fact.
    """
    if body.startswith("/"):
        return (
            "a dispatched message may not begin with '/': the runner would route it to the "
            "CLI's slash-command surface instead of the model"
        )
    prefixes: list[str] = []
    for module, name in (
        ("kiro_crew.dashboard.state", "CRON_NOTIFY_PREFIX"),
        ("kiro_crew.dashboard.state", "SUBAGENT_SYNTHESIS_PREFIX"),
        ("kiro_crew.dashboard.state", "HOOK_CONTINUATION_RECOVERY_PREFIX"),
    ):
        value = _host(module, name)
        if isinstance(value, str) and value:
            prefixes.append(value)
    tuples = _host("kiro_crew.dashboard.state", "SUBAGENT_COMPLETION_PREFIXES")
    if isinstance(tuples, tuple):
        prefixes.extend(p for p in tuples if isinstance(p, str) and p)
    for prefix in prefixes:
        if body.startswith(prefix):
            return f"a dispatched message may not open with the platform's {prefix!r} marker"
    return ""


async def _dispatch_prompt(
    state: Any,
    slot: Any,
    message: str,
    *,
    require_conversation: bool,
) -> dict[str, Any]:
    """Land *message* as one real turn on *slot*. THE turn-dispatch path.

    Every class that gives a session a turn comes through here, so the
    precondition list, the provenance stamp and the redaction are applied once.
    A second copy of this call is how one of those ships without them.

    Mechanism, and it is the platform's own: queue the message at the head with
    ``kind=SYNTHETIC_RECOVERY_KIND`` and ``payload=CONTINUATION``, then let
    ``_start_next_queued_turn`` dequeue it. That is character-for-character what
    ``api_chat_slot_continue`` does (VERIFIED: chat_handlers.py:2624,2639) and it
    buys three things no bespoke dispatch gets:

    * the row lands with ``role="inject"`` and ``meta.injectKind`` rather than
      ``role="user"`` (VERIFIED: chat_runner.py:3611,3633), so the Conductor's
      words are structurally distinguishable from the operator's in the
      transcript, on the wire, and after a rehydrate — ``meta`` is persisted,
      ``cls`` is not;
    * ``payload=CONTINUATION`` marks the text machine-authored, which stops the
      runner mirroring it into a linked Slack thread as the operator's speech
      (VERIFIED: chat_utils.py:1577-1589);
    * queue semantics, the sub-agent hold and the stop-in-progress handling come
      from the runner instead of being reimplemented.

    Two alternatives were rejected. ``slot.enqueue_or_run_prompt``
    (VERIFIED: state.py:2422, and how ``issue_radar`` dispatches at
    apps/builtins/issue_radar/backend/crew_runtime.py:661) is the tidiest call
    available, but it appends ``role="user"`` — which makes an autonomous turn
    indistinguishable from a human send in the one surface the operator actually
    reads. Bare ``spawn_guarded_turn`` (VERIFIED: chat_handlers.py:653-654) re-derives the
    precondition list at the call site, which is the duplication the plan
    explicitly forbids.

    NOTE FOR THE DRIVER: this path does NOT go through
    ``state.run_background_turn``, because ``_start_next_queued_turn`` does not
    (VERIFIED: chat_runner.py:3646-3650, no ``run_background_turn`` in that call,
    unlike chat_handlers.py:653 and slack/gateway.py:4246-4252). The platform's
    unattended-turn semaphore therefore
    does not cap Conductor turns, so the driver's own concurrency ceiling is the
    only one there is.
    """
    start_turn = _host("kiro_crew.dashboard.chat_runner", "_start_next_queued_turn")
    kind = _host("kiro_crew.dashboard.chat_utils", "SYNTHETIC_RECOVERY_KIND")

    # The message is judged before the platform is, so "your composer produced
    # something undispatchable" is reported as that on every gateway rather than
    # being masked by whichever platform symbol happens to be missing.
    body = _clip(_redact(message).strip(), MAX_MESSAGE_CHARS)
    if not body:
        return {
            "ok": False,
            "refused": "the composed message was empty after redaction",
            "detail": "no turn was dispatched",
        }
    bad = _masquerade(body)
    if bad:
        return {
            "ok": False,
            "refused": bad,
            "detail": "no turn was dispatched",
        }

    if start_turn is None or kind is None:
        return {
            "ok": False,
            "refused": "in-process turn dispatch is unavailable on this gateway "
            "(dashboard.chat_runner._start_next_queued_turn / "
            "chat_utils.SYNTHETIC_RECOVERY_KIND)",
            "detail": "no turn was dispatched",
        }

    payload_enum = _host("kiro_crew.dashboard.chat_utils", "RecoveryPayload")
    payload = getattr(getattr(payload_enum, "CONTINUATION", None), "value", "continuation")

    # The check and the enqueue must not be separated by an await: the platform's
    # own Continue endpoint holds this lock for exactly that reason, and without
    # it a tick landing in the instant a turn starts dispatches a second one.
    lock = getattr(slot, "_lock", None)
    async with (lock if lock is not None else contextlib.nullcontext()):
        blocked = _turn_blocker(state, slot, require_conversation=require_conversation)
        if blocked:
            return {
                "ok": False,
                "refused": f"precondition failed: {blocked}",
                "detail": "no turn was dispatched",
            }
        queue_id = slot.queue_insert(0, body, kind=kind, payload=payload)

    started = await start_turn(state, slot)
    with contextlib.suppress(Exception):
        state.push_slots_update()
    if not started:
        # A concurrent dequeue consumed the entry. The turn is running either
        # way, which is why the platform logs this rather than treating it as a
        # failure (VERIFIED: chat_handlers.py:2637-2639).
        logger.info(
            "conductor: queue entry consumed by a concurrent dequeue (slot %s)",
            getattr(slot, "key", "?"),
        )
    return {
        "ok": True,
        "detail": "turn dispatched" if started else "queued; a concurrent dequeue took it",
        "slot": getattr(slot, "key", ""),
        "queue_id": queue_id,
        "started": bool(started),
    }


# ── context injection ────────────────────────────────────────────────────────


def _resolve_source(params: dict[str, Any]) -> str:
    """The ``source`` tag for a context entry. Ours, always.

    A caller may name a sub-lane (``crew-manager-conductor:narrate``) but cannot
    replace the namespace, for two reasons. The tag is the attribution an
    operator filters the injection surface on, so a composed proposal that could
    set it freely could write context that reads as another subsystem's. And the
    platform's per-source cap (VERIFIED: chat_handlers.py:5370-5377) is keyed on it, so a
    rotating source would let the Conductor evict every other writer's pending
    context while never appearing to exceed its own quota.
    """
    lane = str(params.get("source_lane") or "").strip().lower()
    lane = re.sub(r"[^a-z0-9_-]", "", lane)[:32]
    return f"{CONTEXT_SOURCE}:{lane}" if lane else CONTEXT_SOURCE


async def _inject_context(
    state: Any,
    slot_name: str,
    *,
    content: str,
    source: str,
    max_age: int | None,
) -> dict[str, Any]:
    """Append one ephemeral context entry to *slot_name*'s pending queue.

    The entry shape, the per-source cap and the FIFO eviction are copied from
    ``api_chat_slot_context`` (VERIFIED: chat_handlers.py:5359-5383), which does
    the work inline and exposes no helper to call — ``_pending_context`` has
    exactly one writer in the whole gateway and it is that handler.

    ``ephemeral`` is forced True and is not a parameter. ``intents.py`` classes
    ``context_inject`` as REVERSIBLE and ``policy.py`` lets it execute in
    ASSISTED mode on that basis; a persistent injection is not reversible, so
    accepting ``ephemeral=False`` from a proposal would quietly raise the real
    risk of a class whose authority was granted for the lower one.

    No broadcast and no ``push_slots_update``: the point of this class is that
    it starts no turn and emits no WS event. The handler does not push either.
    """
    slot = _slot_for(state, slot_name)
    if slot is None:
        return {
            "ok": False,
            "refused": f"slot {slot_name!r} is not live",
            "detail": "nothing injected",
        }
    pending = getattr(slot, "_pending_context", None)
    if not isinstance(pending, list):
        return {
            "ok": False,
            "refused": "this gateway's slots have no _pending_context queue",
            "detail": "nothing injected",
        }

    per_source = _cap(
        "kiro_crew.dashboard.chat_handlers",
        "_MAX_CONTEXT_PER_SOURCE",
        _FALLBACK_MAX_CONTEXT_PER_SOURCE,
    )
    ceiling = _cap(
        "kiro_crew.dashboard.state", "_MAX_PENDING_CONTEXT", _FALLBACK_MAX_PENDING_CONTEXT
    )

    mine = sum(1 for e in pending if isinstance(e, dict) and e.get("source") == source)
    if mine >= per_source:
        # Real backpressure, surfaced rather than papered over: it means we are
        # writing context faster than the session consumes it, which is a signal
        # about the session, not an error in the write.
        return {
            "ok": False,
            "refused": f"source {source!r} already has {mine} unconsumed entries "
            f"(cap {per_source})",
            "detail": "nothing injected",
        }

    entry: dict[str, Any] = {
        "content": content,
        "source": source,
        "ephemeral": True,
        "injectedAt": time.time(),
    }
    if max_age is not None:
        entry["maxAge"] = max_age

    # No await between the eviction and the append, so a concurrent injection
    # cannot interleave and overshoot the ceiling.
    while len(pending) >= ceiling:
        pending.pop(0)
    pending.append(entry)
    return {
        "ok": True,
        "detail": f"injected {len(content)} chars as {source}",
        "slot": getattr(slot, "key", slot_name),
        "source": source,
        "pending": len(pending),
    }


def _context_body(params: dict[str, Any]) -> tuple[str, str]:
    """(content, refusal). Redacted and clipped, or a reason it cannot be used."""
    content = _clip(_redact(params.get("content")).strip(), MAX_CONTEXT_CHARS)
    if not content:
        return "", "params['content'] is required and was empty after redaction"
    return content, ""


def _max_age(params: dict[str, Any]) -> int | None:
    """An optional positive TTL in seconds, ignored when nonsensical."""
    raw = params.get("max_age_secs")
    if isinstance(raw, bool) or not isinstance(raw, int) or raw <= 0:
        return None
    return min(raw, 86_400)


# ── the executors ────────────────────────────────────────────────────────────


async def _exec_context_inject(proposal: Proposal, state: Any, ctx: Any) -> dict[str, Any]:
    """Ephemeral context into a worker session. The lowest-risk action we take.

    No turn, no WS event, no visible row: it changes what the session will read
    the next time *something else* gives it a turn. That is the whole difference
    between a board that describes sessions and a driver that informs them.
    """
    if not proposal.target_slot:
        return {
            "ok": False,
            "refused": "context_inject needs a target_slot",
            "detail": "nothing injected",
        }
    content, refusal = _context_body(proposal.params)
    if refusal:
        return {
            "ok": False,
            "refused": refusal,
            "detail": "nothing injected",
        }
    return await _inject_context(
        state,
        proposal.target_slot,
        content=content,
        source=_resolve_source(proposal.params),
        max_age=_max_age(proposal.params),
    )


def say_in_conductor_chat(state: Any, content: str) -> bool:
    """Write one VISIBLE line into the Conductor chat. No turn. Returns success.

    ``slot.append`` writes a transcript row and broadcasts it (VERIFIED:
    state.py:2060, ``broadcast`` defaults True), so the operator sees it live while
    nothing is dispatched. Role ``inject`` renders as a system note rather than a
    user bubble and is not mirrored to Slack as though the operator typed it.

    Public because two callers need the same behaviour and must not each grow their
    own copy: :func:`_exec_narrate` for digests, and the decompose route for
    planning. Planning in particular was invisible in the chat — a button that span
    for a minute and then silently changed a goal — and the operator asked for it to
    narrate itself, which is the same requirement digests already had.
    """
    if not content.strip():
        return False
    slot = _slot_for(state, CONDUCTOR_SLOT)
    if slot is None or not callable(getattr(slot, "append", None)):
        return False
    try:
        slot.append(
            "inject",
            content,
            cls="msg msg-inject",
            meta={"injectKind": "conductor", "source": "crew-manager-conductor"},
        )
        return True
    except Exception as exc:
        logger.warning("conductor: slot.append failed: %r", exc)
        return False


async def _exec_narrate(proposal: Proposal, state: Any, ctx: Any) -> dict[str, Any]:
    """A digest into the Conductor's own slot, and only ever there.

    Two decisions worth stating.

    It writes CONTEXT, not a turn. ``intents.py`` classes ``narrate`` REVERSIBLE
    and ``policy._ASSISTED_ACT`` lets it execute in ASSISTED mode — a mode whose
    stated contract is that anything dispatching a turn is proposed for an
    operator click. A narrate that dispatched a digest turn would break that
    contract from inside the one class allowed through it.

    It refuses any target but :data:`CONDUCTOR_SLOT`. Narration is exempt from
    every board lane because it lands in a session nobody is babysitting; aimed
    at a worker it would be an unlabelled context write with a digest's
    authority. ``context_inject`` is the class for talking to a worker.

    It also does NOT create that slot when it is missing, which is a real
    limitation rather than an oversight: the panel mints it on mount
    (``src/index.tsx:2649``), so a gateway whose Conductor tab has never been
    opened has nowhere to narrate. Creating it here would have this class —
    REVERSIBLE, and permitted in ASSISTED on that basis — perform a
    COMPENSATABLE slot creation, which is precisely the authority creep the
    ``ephemeral`` argument above refuses. The driver's answer is a
    ``session_create`` proposal, gated as ``session_create``.
    """
    target = proposal.target_slot or CONDUCTOR_SLOT
    if target != CONDUCTOR_SLOT:
        return {
            "ok": False,
            "refused": f"narrate may only write to {CONDUCTOR_SLOT!r}, not {target!r}; "
            "use context_inject for a worker session",
            "detail": "nothing injected",
        }
    content, refusal = _context_body(proposal.params)
    if refusal:
        return {
            "ok": False,
            "refused": refusal,
            "detail": "nothing injected",
        }
    # VISIBLE, and still no turn. ``slot.append`` writes one transcript row and
    # broadcasts it over the websocket (VERIFIED: state.py:2060, ``broadcast``
    # defaults True), so the digest renders live in the Conductor chat while
    # dispatching nothing — which is the property the ephemeral-context write was
    # reaching for and missed. An ephemeral context write is invisible BY DESIGN
    # (chat_handlers.py:5292: "no visible message is appended to the slot's chat
    # history"), so narration could only ever be read by the model, never by the
    # operator it was written for.
    #
    # Role ``inject`` renders as a system note rather than a user bubble
    # (state.py:861 ``_PROMPT_ROLES``), and is not mirrored to Slack/Telegram as
    # though the operator typed it. The assisted-mode contract is untouched: no
    # turn is dispatched, so ``narrate`` stays REVERSIBLE.
    written = say_in_conductor_chat(state, content)
    if written:
        return {
            "ok": True,
            "detail": f"narrated {len(content)} chars into {CONDUCTOR_SLOT} (visible, no turn)",
            "slot": CONDUCTOR_SLOT,
            "visible": True,
        }

    # Fallback for a gateway whose slot has no append: the digest is still worth
    # having where the model can read it, even though the operator cannot see it.
    result = await _inject_context(
        state,
        CONDUCTOR_SLOT,
        content=content,
        # Its own lane, so a narration backlog cannot evict a worker's context
        # and a chatty worker cannot starve the digest.
        source=f"{CONTEXT_SOURCE}:narrate",
        max_age=_max_age(proposal.params),
    )
    if isinstance(result, dict):
        result["visible"] = False
    return result


async def _exec_session_continue(proposal: Proposal, state: Any, ctx: Any) -> dict[str, Any]:
    """Dispatch one real turn into an existing session."""
    if not proposal.target_slot:
        return {
            "ok": False,
            "refused": "session_continue needs a target_slot",
            "detail": "no turn was dispatched",
        }
    message = str(proposal.params.get("message") or "")
    if not message.strip():
        return {
            "ok": False,
            "refused": "session_continue needs params['message']",
            "detail": "no turn was dispatched",
        }
    slot = _slot_for(state, proposal.target_slot)
    if slot is None:
        # Deliberately not rehydrated here. A slot-miss is not evidence of death
        # — the driver arms before the dashboard restores slots — but
        # ``rehydrate_slot_from_history_async`` (VERIFIED: chat_persistence.py:767) is a
        # recovery decision about whether a session still exists, which belongs
        # to the reconciler that can observe reality. An executor that quietly
        # resurrected an archived session would be taking that decision with no
        # record of having taken it.
        return {
            "ok": False,
            "refused": f"slot {proposal.target_slot!r} is not live; rehydration is the "
            "reconciler's decision, not the executor's",
            "detail": "no turn was dispatched",
        }
    return await _dispatch_prompt(state, slot, message, require_conversation=True)


def _with_working_dir(prompt: str, root: str) -> str:
    """Prepend the absolute working directory to a leaf's brief.

    **The single most consequential line in a dispatch.** Every session gets its
    own sandbox cwd from the platform, derived from the session key
    (observed: ``kirocrew-workspace/conductor_<goal>_<leaf>/``). A brief written in
    relative paths is therefore satisfied *inside that sandbox* — the worker does
    the work correctly, commits it, reports success, and the goal's ``file_exists``
    predicates never see a thing because they are evaluated against
    ``scope.root``. Six leaves then build six private copies of the project that
    never compose into one artifact.

    Observed exactly that: a worker wrote ``chess_engine/board.py`` with 20 passing
    tests and committed it, while the goal root stayed empty and the leaf stayed
    open forever.

    The hand-written briefs in the POC happened to carry absolute paths, which is
    why the failure only appeared once a MODEL wrote the briefs — a reminder that
    the planner cannot be expected to know an operator's directory layout.
    """
    if not root.strip():
        return prompt
    return (
        f"Work in {root}\n"
        f"Change to that directory first. Every path in the task below is relative "
        f"to it, and it is a shared repository: other agents are working in the same "
        f"tree at the same time, so create ONLY the files this task names and commit "
        f"only those. Do not create a project anywhere else.\n\n"
        + prompt
    )


async def _exec_session_create(proposal: Proposal, state: Any, ctx: Any) -> dict[str, Any]:
    """Create (or adopt) a goal-bound worker session and give it its first turn.

    ``get_or_create_slot`` is idempotent by name (VERIFIED: dashboard/state.py:4817
    signature, ``:4857`` returns the existing slot) and that name IS the
    idempotency key for the creation half. The first TURN is not idempotent, so
    it is guarded twice: by this class's entry in ``acted.json``, and by checking
    for an existing conversation before dispatching — a slot created by an
    earlier proposal with a different signature must not be re-briefed.

    That second guard is only sound if this module can answer "did the slot exist
    before I called?" exactly, which is why the name is constrained twice over
    (:data:`_SLOT_NAME_PREFIX`, :data:`_SLOT_NAME_RE`) and then checked against
    the platform's own fold. ``get_or_create_slot`` looks up the NORMALIZED name;
    a caller-supplied name that normalizes to something else would make the
    pre-existence probe answer about a different slot, and the failure mode is a
    second briefing turn dispatched into a session that is already working.
    """
    params = proposal.params
    leaf = str(params.get("leaf_id") or "").strip()
    if not leaf:
        return {
            "ok": False,
            "refused": "session_create needs params['leaf_id']",
            "detail": "nothing created",
        }
    prompt = _with_working_dir(str(params.get("prompt") or ""), str(params.get("root") or ""))
    if not prompt.strip():
        # The leaf's explicit task statement is the entire content of the
        # session. Creating the slot and leaving it empty would produce a worker
        # nobody briefed, sitting on the board looking idle.
        return {
            "ok": False,
            "refused": "session_create needs params['prompt'] — the leaf's task statement",
            "detail": "nothing created",
        }

    name = str(params.get("slot_name") or f"{_SLOT_NAME_PREFIX}{proposal.goal_id}-{leaf}")
    # The Conductor's own scratch session is the one name outside our mint that
    # may be created: it is ours by definition, every board lane already exempts
    # it, and ``narrate`` has nowhere to write until it exists. It is spelled out
    # rather than folded into the prefix rule so the exemption is one readable
    # line instead of a pattern that happens to admit it.
    if name != CONDUCTOR_SLOT and (
        not _SLOT_NAME_RE.match(name) or not name.startswith(_SLOT_NAME_PREFIX)
    ):
        return {
            "ok": False,
            "refused": f"slot name {name!r} must start with {_SLOT_NAME_PREFIX!r} and match "
            f"{_SLOT_NAME_RE.pattern}: outside that, get_or_create_slot may fold the name (so the "
            "pre-existence check stops being exact) or ADOPT a session the Conductor did not name",
            "detail": "nothing created",
        }
    fold = _host("kiro_crew.dashboard.state", "_normalize_slot_key")
    if fold is not None:
        try:
            folded = str(fold(name))
        except Exception:
            logger.debug("conductor: _normalize_slot_key raised for %r", name, exc_info=True)
            folded = name
        if folded != name:
            # Belt and braces over the charset argument above: the fold is the
            # platform's, so asking it beats reasoning about its regex from out
            # here, and a future rule it grows is caught the release it ships.
            return {
                "ok": False,
                "refused": f"the platform folds slot name {name!r} to {folded!r}; refusing rather "
                "than creating a slot under a key the idempotency check cannot address",
                "detail": "nothing created",
            }

    app_owner = params.get("app", APP_NAME)
    app_owner = app_owner if isinstance(app_owner, str) else APP_NAME
    origin_default = "app" if app_owner else "system"
    origin = str(params.get("origin") or origin_default)
    if origin not in _ALLOWED_ORIGINS:
        # "user" lands here. It is refused rather than corrected, because a
        # proposal asking for it is either a bug or an attempt to have the
        # Conductor's session read as a person's to every app holding
        # ``slots:user``, and both deserve the same answer.
        return {
            "ok": False,
            "refused": f"origin {origin!r} is not one a background caller may declare "
            f"(allowed: {sorted(_ALLOWED_ORIGINS)})",
            "detail": "nothing created",
        }
    slot_origin = _host("kiro_crew.dashboard.state", "SlotOrigin")
    if slot_origin is not None:
        # Prefer the platform's own constant when it is there, so a rename shows
        # up as a changed value rather than a silently untagged slot.
        origin = str(getattr(slot_origin, origin.upper(), origin))

    create = getattr(state, "get_or_create_slot", None)
    if not callable(create):
        return {
            "ok": False,
            "refused": "this gateway's state has no get_or_create_slot",
            "detail": "nothing created",
        }

    # A worker session is goal-bound and says so in its session key; the
    # Conductor's own scratch session is not, and binding it would move its
    # transcript off ``dashboard:crew-manager-conductor`` — the file the panel's
    # own reads and the restore path already address.
    link_key = "" if name == CONDUCTOR_SLOT else conductor_link_key(proposal.goal_id, leaf)
    existing = _slot_for(state, name)
    try:
        slot = create(
            name=name,
            agent=str(params.get("agent") or ""),
            workspace=str(params.get("workspace") or "default"),
            app=app_owner,
            linked_session_key=link_key,
            origin=origin,
        )
    except Exception as exc:
        return {
            "ok": False,
            "refused": f"get_or_create_slot rejected {name!r}: {exc!r}",
            "detail": "nothing created",
        }

    created = existing is None
    _name_worker(slot, leaf, str(params.get("title") or ""))
    trust_note = _apply_declared_worker_trust(state, slot, params.get("worker_trust"))
    if not created and not _pristine(slot):
        # Adopted a session that has already been used: no second briefing.
        #
        # ``_has_conversation`` is deliberately NOT the test here, even though it
        # is the platform's own. It only counts ``user``/``assistant`` rows
        # (VERIFIED: chat_handlers.py:2659-2664), and this module's own brief lands as an
        # ``inject`` row — so a slot briefed thirty seconds ago whose turn has not
        # yet emitted anything reads as having no conversation, and a proposal
        # with a different signature for the same leaf would brief it twice. Two
        # briefing turns on one session is the exact double-dispatch the
        # idempotency ledger exists to prevent, so the weaker platform predicate
        # is not enough and "has this slot ever been used" is the real question.
        return {
            "ok": True,
            "detail": "slot already existed and has been used; first turn not re-dispatched",
            "slot": getattr(slot, "key", name),
            "created": False,
            "started": False,
            "link_key": link_key,
        }

    dispatched = await _dispatch_prompt(state, slot, prompt, require_conversation=False)
    return {
        **dispatched,
        "slot": getattr(slot, "key", name),
        "created": created,
        "link_key": link_key,
        "detail": (
            f"{'created' if created else 'adopted'} {getattr(slot, 'key', name)}; "
            f"{dispatched.get('detail') or dispatched.get('refused') or 'no turn'}"
            + (f"; {trust_note}" if trust_note else "")
        ),
        # This is the one executor that can refuse AFTER a mutation — the slot
        # exists once ``create`` returned, even if the briefing turn was then
        # refused — so the released-claim rule deserves its justification here
        # rather than in the entry point. Releasing is right: a retry re-enters an
        # idempotent ``get_or_create_slot``, finds no conversation, and briefs the
        # session it created last time instead of creating a second one. Retaining
        # the claim would leave a worker slot on the operator's board that nobody
        # ever told what to do, which is the one outcome worse than retrying.
    }


#: How long to wait for the bell's history row. Short on purpose: the note is
#: already on screen, and the sink's executor is FIFO across every producer in the
#: process, so a long wait here would let an unrelated backlog stall a tick.
_PERSIST_WAIT_SECS = 5.0


async def _await_persist(state: Any) -> bool | None:
    """Whether the last note's disk row landed. ``None`` when unknowable.

    Read immediately after ``push`` with no ``await`` in between, so the future
    read here is the one this push created — the sink assigns it synchronously on
    the loop, and there is no interleaving point.
    """
    pending = getattr(state, "last_notification_persist", None)
    if pending is None or not inspect.isawaitable(pending):
        # An older gateway persists inline and publishes nothing, and a newer one
        # is free to change the field's type. Neither is a failure to report — we
        # simply cannot say, and saying "not persisted" would be a lie on a
        # gateway that wrote the row synchronously.
        return None
    try:
        return bool(await asyncio.wait_for(asyncio.shield(pending), _PERSIST_WAIT_SECS))
    except asyncio.TimeoutError:
        logger.debug("conductor: notification history write still pending")
        return None
    except asyncio.CancelledError:
        raise
    except Exception:
        logger.warning("conductor: notification history write failed", exc_info=True)
        return False


async def _push_notice(
    proposal: Proposal,
    state: Any,
    *,
    channel_id: str,
    priority: str,
    stack: str,
) -> dict[str, Any]:
    """One bell notification. The shape is ``watcher.py:363``'s ``_push`` (VERIFIED: read today).

    Not a call into ``WATCHER._push``: that method hardcodes the stall channel's
    ``default`` priority and its own group key, and reaching into another
    module's private method to get a different answer out of it is worse than
    stating this one's parameters here.

    ``url`` is fixed and never taken from the proposal. The body is composed by a
    model from an untrusted transcript, and a model-supplied destination for a
    click the operator makes from a trusted surface is not something to accept
    politely.
    """
    bus = getattr(state, "notification_bus", None)
    if bus is None:
        return {
            "ok": False,
            "refused": "this gateway has no notification bus",
            "detail": "nothing pushed",
        }
    payload_cls = _host("kiro_crew.notifications.bus", "NotificationPayload")
    invalid = _host("kiro_crew.notifications.bus", "NotificationValidationError")
    if payload_cls is None or invalid is None:
        return {
            "ok": False,
            "refused": "kiro_crew.notifications.bus is unavailable",
            "detail": "nothing pushed",
        }

    title = _clip(_redact(proposal.params.get("title")).strip(), MAX_TITLE_CHARS)
    body = _clip(_redact(proposal.params.get("body")).strip(), MAX_BODY_CHARS)
    if not title:
        return {
            "ok": False,
            "refused": "a notification needs params['title']",
            "detail": "nothing pushed",
        }

    channel = f"{APP_NAME}.{channel_id}"
    try:
        if not bus.is_registered(channel):
            bus.register_channel(channel, priority)
    except Exception as exc:
        return {
            "ok": False,
            "refused": f"could not register {channel}: {exc!r}",
            "detail": "nothing pushed",
        }

    payload = payload_cls(
        source=f"app:{APP_NAME}",
        channel=channel,
        title=title,
        body=body,
        priority=priority,
        # One stack per signal kind, as the watcher does: several escalations in
        # one tick collapse into one entry in the feed rather than a pile. The
        # scarce resource is the operator's attention, and a Conductor that
        # spends it all gets rubber-stamped, which is worse than one that is
        # occasionally quiet.
        group_key=f"{APP_NAME}:conductor:{stack}",
        url="/crew-manager",
        # Merged flat into the note (VERIFIED: bus.py:409-421). This is what lets the operator
        # get from a bell entry back to the ledger row that produced it.
        meta={
            "goal_id": proposal.goal_id,
            "action_id": proposal.action_id,
            "action_class": proposal.action_class,
        },
    )
    try:
        payload.validate()
    except invalid as exc:
        return {
            "ok": False,
            "refused": f"the notification failed schema validation: {exc}",
            "detail": "nothing pushed",
        }
    try:
        note = bus.push(payload)
    except Exception as exc:
        # The only refusal in this module that keeps its claim. ``push`` validates,
        # then persists, then hands the note to the sink (VERIFIED: bus.py:376-409
        # and the store/broadcast that follows), so a raise from inside it is not
        # evidence that nothing landed — and a retried escalation the operator has
        # already seen spends the one resource escalation exists to protect.
        return {
            "ok": False,
            "refused": f"the bus rejected the notification: {exc!r}",
            "detail": "nothing pushed; the notification may or may not have landed",
            "unknown_effect": True,
        }
    # Delivery already happened synchronously inside ``push`` (broadcast + the
    # in-memory log); only the JSONL row is deferred, to a single-worker executor
    # whose future the sink publishes for exactly this purpose (VERIFIED:
    # state.py:4424-4436, "callers that need durability can await it and read the
    # success bool"). Awaited, bounded, and never fatal: an escalation the operator
    # has already seen on screen is not undone by a history write still in flight,
    # so a timeout downgrades the claim about durability, not the outcome.
    persisted = await _await_persist(state)
    return {
        "ok": True,
        "detail": f"pushed to {channel} at {priority}",
        "channel": channel,
        "notification_ts": (note or {}).get("ts") if isinstance(note, dict) else None,
        "persisted": persisted,
    }



async def _exec_escalate(proposal: Proposal, state: Any, ctx: Any) -> dict[str, Any]:
    """Hand a decision back to the operator. ``critical`` priority.

    A system that cannot reach its operator is worse than one that reaches them
    too often, so this is the one operator-facing class that rings at the top
    priority. The flood guard is NOT here — budgets and cooldowns belong to the
    gate, which is the only place that can see the whole tick.
    """
    return await _push_notice(
        proposal, state, channel_id=ESCALATE_CHANNEL, priority="critical", stack="escalate"
    )


async def _exec_operator_notify(proposal: Proposal, state: Any, ctx: Any) -> dict[str, Any]:
    """Tell the operator something they did not have to be asked about."""
    return await _push_notice(
        proposal, state, channel_id=NOTIFY_CHANNEL, priority="default", stack="notify"
    )


_Executor = Callable[[Proposal, Any, Any], Awaitable[dict[str, Any]]]

#: The complete set of action classes that have an execution path. Absence from
#: this table is not a configuration state — there is no code to run. Every
#: member of ``intents.DENY_HARD`` is absent by construction and
#: ``test_authority.py`` asserts it over :func:`executable_classes`.
#: Prepended to a resumed brief. Deterministic on purpose — see
#: :func:`_exec_session_resume` for why this one is not composed by a model.
RESUME_PREAMBLE = (
    "Your previous attempt at this task was CUT OFF mid-way — the gateway "
    "restarted while your turn was in flight, so the turn ended without you "
    "finishing or reporting. Nothing is wrong with your approach.\n\n"
    "Before doing anything else: look at what is already on disk. Some or all of "
    "this task may already be done. Do not redo finished work and do not revert "
    "it. Carry on from where the tree actually is, and finish.\n\n"
    "If the task cannot be finished because something outside this repository is "
    "missing (a binary that is not installed, a service that is not reachable), "
    "do NOT try to install it and do NOT stop silently. Implement the part you "
    "can, make the missing piece a documented, gracefully-skipped path, and say "
    "plainly in your final message what was missing and what you did instead.\n\n"
    "The original task follows.\n\n"
)


async def _exec_session_resume(proposal: Proposal, state: Any, ctx: Any) -> dict[str, Any]:
    """Re-dispatch a worker's own brief after its turn died. No model involved.

    ``session_resume`` has been in :data:`intents.ACTION_CLASSES` since the plan,
    at ``Tier.ACT`` and annotated "preferred over session_continue" — with no
    executor, so it was declared and unreachable. This is that executor, and the
    case that forced it is a real one: a worker was mid-tool-call when the gateway
    restarted to deploy a fix, its turn was killed, and the leaf stayed open with a
    session that would never speak again. Stall detection could not see it either
    (``detect_stalls`` requires ``running``, and a killed turn is not running), so
    the goal sat at five of six steps indefinitely.

    **Why this one is deterministic while ``session_continue`` is composed.** A
    continuation asks a model to judge what a stuck worker should be told, and the
    plan is deliberately strict there: no composed message, no turn, because
    "please continue" spam is the behaviour operators switch off on day one. A
    resume is not that judgement. The previous turn did not decide to stop — it was
    interrupted — so the correct message is the brief the operator already wrote,
    re-sent, with a preamble saying so. There is nothing for a model to decide, and
    making the recovery path depend on model availability would mean a restart
    could strand a worker permanently on a gateway with no model.

    Refuses rather than doubling up when the slot is already running: a resume into
    a live turn would dispatch two turns into one session, which is the one thing
    this must never do.
    """
    if not proposal.target_slot:
        return {
            "ok": False,
            "refused": "session_resume needs a target_slot",
            "detail": "no turn was dispatched",
        }
    brief = str(proposal.params.get("prompt") or proposal.params.get("message") or "")
    if not brief.strip():
        return {
            "ok": False,
            "refused": "session_resume needs params['prompt'] — the leaf's own brief",
            "detail": "no turn was dispatched",
        }
    slot = _slot_for(state, proposal.target_slot)
    if slot is None:
        return {
            "ok": False,
            "refused": f"slot {proposal.target_slot!r} is not live; rehydration is the "
            "reconciler's decision, not the executor's",
            "detail": "no turn was dispatched",
        }
    if bool(getattr(slot, "running", False)):
        return {
            "ok": False,
            "refused": "the session is already running a turn; a resume would dispatch a second",
            "detail": "no turn was dispatched",
        }
    prompt = _with_working_dir(RESUME_PREAMBLE + brief, str(proposal.params.get("root") or ""))
    trust_note = _apply_declared_worker_trust(state, slot, proposal.params.get("worker_trust"))
    result = await _dispatch_prompt(state, slot, prompt, require_conversation=False)
    if trust_note and result.get("ok"):
        result["detail"] = f"{result.get('detail') or 'resumed'}; {trust_note}"
    return result


EXECUTORS: dict[str, _Executor] = {
    "context_inject": _exec_context_inject,
    "narrate": _exec_narrate,
    "session_continue": _exec_session_continue,
    "session_create": _exec_session_create,
    "session_resume": _exec_session_resume,
    "escalate": _exec_escalate,
    "operator_notify": _exec_operator_notify,
}


def executable_classes() -> frozenset[str]:
    """Classes with a reachable executor, for the authority tests to enumerate."""
    return frozenset(EXECUTORS)


# ── the entry point ──────────────────────────────────────────────────────────


async def execute(decision: Decision, *, state: Any, ctx: Any = None) -> dict[str, Any]:
    """Carry out *decision*, or say why not. Never raises for a policy refusal.

    The order of the checks is the order of decreasing trust, and each one is
    independent of the one before it:

    1. the verdict must be ``ACT`` — a ``PROPOSE`` decision reaching an executor
       is an ordinary caller mistake and gets a quiet refusal;
    2. the class must not be hard-denied — reaching this line with ``ACT`` on a
       denied class means the gate is broken, so it is logged at ERROR and
       audited, not merely refused;
    3. the class must be known, and must have an executor;
    4. the idempotency key must be free;
    5. the audit record must be durable, for the classes that dispatch turns.

    Returns a dict carrying ``ok`` and ``detail`` plus whatever the class
    created — ``slot``, ``queue_id``, ``channel``, ``link_key``. A refusal carries
    ``refused``; a duplicate carries ``replayed`` and ``prior_outcome``, which is
    what lets the driver tell "already done" apart from "would not do".
    ``ctx`` is accepted for the app-logger and is otherwise unused; every side
    effect goes through *state*.

    **What this function does NOT do**, so a driver does not assume it: it does
    not write the ledger's ``intent``/``outcome`` pair (:mod:`ledger` takes a
    ``Decision`` and therefore belongs to the caller that made one), and it does
    not charge :mod:`budget` — ``Budget.consume`` is a method on an instance the
    driver owns, and a second Budget constructed here would be a second ceiling.
    Its own durable records are ``acted.json`` and one SEL row per attempt.
    """
    proposal = decision.proposal
    cls = proposal.action_class
    base: dict[str, Any] = {
        "action_id": proposal.action_id,
        "action_class": cls,
        "goal_id": proposal.goal_id,
        "target_slot": proposal.target_slot,
        "idempotency_key": proposal.idempotency_key(),
    }

    if decision.verdict is not Verdict.ACT:
        return {
            **base,
            "ok": False,
            "refused": f"verdict is {decision.verdict.value}, not act",
            "detail": "nothing executed",
        }

    if is_hard_denied(cls):
        # Defence in depth, and the reason it is worth the frozenset lookup: the
        # gate already refuses these, so arriving here with an ACT verdict means
        # the single chokepoint failed. The requirement is that no ONE bug is
        # sufficient to execute a hard-denied class, which a check that trusts
        # the gate does not satisfy. Loud on purpose — this is a defect report,
        # not a routine refusal.
        logger.error(
            "conductor: BUG — hard-denied class %s reached the executor with verdict ACT "
            "(action_id=%s goal=%s). Refused. The gate must be fixed.",
            cls,
            proposal.action_id,
            proposal.goal_id,
        )
        await _audit(proposal, outcome="refused", error="hard-denied class reached the executor")
        return {
            **base,
            "ok": False,
            "refused": f"{cls} is hard-denied: no execution path exists",
            "detail": "nothing executed",
        }

    if spec_for(cls) is None:
        return {
            **base,
            "ok": False,
            "refused": f"{cls} is not a known action class",
            "detail": "nothing executed",
        }

    handler = EXECUTORS.get(cls)
    if handler is None:
        # Known, not denied, no executor: propose-only by construction.
        return {**base, "ok": False, "refused": "propose-only", "detail": "nothing executed"}

    prior = await _claim(proposal)
    if prior is not None:
        # ok=False because THIS call produced no effect, which is the only honest
        # thing to say about it. `replayed` is how the driver tells a duplicate
        # apart from a refusal it should surface, and `prior_outcome` is what the
        # reconciler needs: a `claimed` prior is a crash window, not a success.
        return {
            **base,
            "ok": False,
            "replayed": True,
            "prior_outcome": prior.get("outcome", "unknown"),
            "refused": f"duplicate: idempotency key already recorded "
            f"(prior outcome={prior.get('outcome', 'unknown')})",
            "detail": "nothing executed",
        }

    if not await _audit(proposal, outcome="attempt", critical=cls in _CRITICAL_AUDIT):
        await _release(proposal)
        return {
            **base,
            "ok": False,
            "refused": "audit-or-deny: the security event log could not record the intent",
            "detail": "nothing executed",
        }

    try:
        result = await handler(proposal, state, ctx)
    except asyncio.CancelledError:
        # The claim STAYS. A cancelled dispatch may or may not have landed a
        # turn, and unknown means reconcile — never re-dispatch on the
        # assumption it did not happen.
        await _finish(proposal, outcome="unknown", detail="cancelled mid-execute")
        raise
    except Exception as exc:
        logger.exception("conductor: executor for %s raised", cls)
        await _finish(proposal, outcome="unknown", detail=repr(exc))
        await _audit(proposal, outcome="failed", error=repr(exc))
        return {
            **base,
            "ok": False,
            "detail": f"executor raised: {exc!r}",
            "error": repr(exc)[:400],
        }

    ok = bool(result.get("ok"))
    unknown = bool(result.get("unknown_effect"))
    note = str(result.get("detail") or result.get("refused") or "")
    outcome = "ok" if ok else "unknown" if unknown else "refused"
    if ok or unknown:
        await _finish(proposal, outcome=outcome, detail=note)
    else:
        # A returned refusal is proof of nothing having happened — see
        # :func:`_release`. The claim goes back so a later tick may reach the same
        # conclusion about the same signature; the alternative retires it forever.
        await _release(proposal)
    # The same three-way word on the audit row as on the claim. "refused" for a
    # call that may have half-landed would put a false certainty in the one record
    # the operator reconstructs the night from.
    await _audit(proposal, outcome=outcome, error="" if ok else str(result.get("refused") or ""))
    return {**base, **result}
