"""Session peek: let the Conductor LOOK at what a session just did.

Today the board can only tell the Conductor what a session is ABOUT — a title, a
stall verdict, a generated summary. All of those are second-hand: something else
read the session and wrote a sentence about it. When the summary is stale, or
wrong, or simply too coarse to act on, there is no way down to the evidence, and
the only remaining move is to open the session by hand — which is the supervision
cost this app exists to remove.

WHY THE TRANSCRIPT, AND NOT A RING BUFFER
-----------------------------------------
Overwatch solved the same problem with ``sessions_peek``: it kept a ring buffer of
the last N lines a PTY emitted and handed those back. That works there because
Overwatch owns the terminal — the bytes on screen ARE the session.

Crew Manager sits on top of a gateway that already writes every session as a
structured transcript, so scraping is both unnecessary and worse:

* a ring buffer only remembers what happened since the buffer was attached, while
  the transcript is the whole session — a peek right after a gateway restart still
  answers;
* PTY bytes carry cursor moves, spinners, progress bars and repainted frames, so
  "the last 30 lines" is frequently 30 lines of one animation; transcript rows are
  already segmented into who said what;
* the transcript is the same source the platform's own history tools read, so a
  peek cannot disagree with the rest of the product about what a session said;
* and, decisively, the transcript carries the METADATA the privacy rules need.
  A ring buffer of raw bytes has no idea whether the session it scraped was
  incognito or belonged to another workspace. Peeking the transcript means the
  same refusals the platform already enforces apply here too.

WHAT PEEK REFUSES, AND WHY IT REFUSES RATHER THAN TRIMS
------------------------------------------------------
``recall.py`` is the precedent and this module deliberately reuses its helpers
rather than reimplementing them. But peek is a STRICTER surface than recall, and
the difference matters:

recall returns short, ranked snippets drawn from many sessions in answer to a
query. peek returns the verbatim tail of ONE session that the caller has named.
There is no ranking to dilute a mistake and no query to justify the read, so
every ambiguity resolves to a refusal:

* a private (incognito/temporary) session is refused outright — its transcript is
  never read, checked on both the listing row and the authoritative metadata, so
  a private session cannot leak through a second door;
* a session in another workspace is refused; and unlike recall, an UNKNOWABLE
  caller workspace is ALSO refused, because "we could not tell" must not resolve
  to "show it anyway" when the payload is one session's own words;
* if the platform's redaction helper cannot be reached, peek refuses rather than
  returning unredacted text — a degraded peek that quotes credentials verbatim is
  worse than no peek at all;
* what comes back is capped in rows AND in characters per row, because peek is a
  glance, not an export;
* only user/assistant rows are surfaced (mirroring ``get_chat_session``), so tool
  plumbing does not become egress.

A refusal is reported as HTTP 200 with ``available: false`` and a reason, matching
the house rule for anything that merely ENRICHES the board: peek is an extra way
to look at a session, and an error status would make the board itself look broken
when it is only unimproved.

All platform access is behind a guarded import, so a gateway that has moved these
internals gets "unavailable" and the rest of the app is unaffected.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any

logger = logging.getLogger(__name__)

#: One glance at a session. Enough to see the last exchange and what led into it.
PEEK_ROWS_DEFAULT = 12

#: Ceiling on a caller-supplied row count. Peek is a glance, not an export.
PEEK_ROWS_MAX = 40

#: Hard cap per row AFTER redaction, so one long tool dump cannot become a wall.
PEEK_TEXT_CHARS = 600

#: Roles worth showing. Mirrors ``get_chat_session`` so tool plumbing and system
#: scaffolding are not turned into egress by a peek.
PEEK_ROLES = ("user", "assistant")


def clamp_rows(value: object, *, default: int = PEEK_ROWS_DEFAULT) -> int:
    """A usable row count from whatever arrived on the query string."""
    try:
        out = int(str(value))
    except (TypeError, ValueError):
        return default
    if out < 1:
        return default
    return min(out, PEEK_ROWS_MAX)


def normalize_name(value: object) -> str:
    """Collapse a raw session identifier to the string we will look up."""
    if not isinstance(value, str):
        return ""
    return " ".join(value.split())


def name_is_safe(name: str) -> bool:
    """Whether this identifier may be used as a session key at all.

    Defence in depth on a path-bearing identifier, copied from
    ``get_chat_session``: the platform's own key sanitiser already neutralises
    separators, but a key carrying one never comes from this app's board, so it is
    rejected outright instead of being cleaned up and used. ``..``/``.`` are
    rejected only as WHOLE names, never as substrings, because real session keys
    legitimately contain dots.
    """
    if not name:
        return False
    if "/" in name or "\\" in name:
        return False
    return name not in ("..", ".")


def flatten_content(content: object) -> str:
    """One row's text, whatever shape the transcript stored it in.

    A transcript row's ``content`` is a plain string on most sessions and a list
    of typed blocks on others. Peek must not care: an unrecognised shape yields
    the empty string, so a row it cannot read is dropped rather than rendered as
    a Python repr.
    """
    if isinstance(content, str):
        return content
    if isinstance(content, dict):
        text = content.get("text")
        return text if isinstance(text, str) else ""
    if isinstance(content, list):
        parts: list[str] = []
        for block in content:
            piece = flatten_content(block)
            if piece:
                parts.append(piece)
        return "\n".join(parts)
    return ""


def clip_text(text: object, *, limit: int = PEEK_TEXT_CHARS) -> str:
    """Collapse a row to one bounded, single-spaced line."""
    out = text if isinstance(text, str) else ""
    out = " ".join(out.split())
    if len(out) > limit:
        out = out[: limit - 1].rstrip() + "…"
    return out


def unavailable(reason: str) -> dict:
    """The one refusal shape. Never carries session content."""
    return {"available": False, "reason": reason}


def _load_backend() -> tuple[Any, Any] | None:
    """The platform's conversation log and history helpers, or None.

    Reassigned wholesale by the offline selftest, which is why the platform is
    reached through exactly one function.
    """
    try:
        from kiro_crew import mcp_core
        from kiro_crew.history import ConversationLog
    except Exception:  # pragma: no cover - gateway without these modules
        logger.debug("crew-manager: session peek unavailable", exc_info=True)
        return None
    return ConversationLog, mcp_core


def _is_private(mcp_core: Any, meta: object) -> bool:
    """Whether *meta* marks a session private, failing CLOSED.

    A missing classifier, or one that raises, means peek cannot prove the session
    is public — and an unprovable session is treated as private.
    """
    classifier = getattr(mcp_core, "_history_is_incognito", None)
    if classifier is None:
        return True
    try:
        return bool(classifier(meta or {}))
    except Exception:
        logger.debug("crew-manager: peek could not classify a session", exc_info=True)
        return True


def _bucket(mcp_core: Any, value: object) -> str | None:
    """A session's workspace bucket, or None when it cannot be computed."""
    helper = getattr(mcp_core, "_ws_bucket", None)
    if helper is None:
        return None
    try:
        return str(helper(value) or "")
    except Exception:
        logger.debug("crew-manager: peek could not bucket a workspace", exc_info=True)
        return None


def _resolve_key(log: Any, mcp_core: Any, name: str, workspace: str) -> str | None:
    """The session key *name* refers to — a key itself, or a session's title.

    The board hands the Conductor a key, so that is the fast path. A human-typed
    title is resolved by scanning the session listing, newest first.

    Rows that peek would refuse anyway (private, or another workspace's) are
    skipped DURING that scan rather than resolved and then refused: a title
    lookup must not become a way to confirm that a private session exists. A
    caller who names a key directly still gets the honest refusal below, which is
    the ``get_chat_session`` precedent — they already had the key.
    """
    try:
        if log.has_log(name):
            return name
    except Exception:
        logger.debug("crew-manager: peek could not test a session key", exc_info=True)

    lister = getattr(log, "list_sessions", None)
    if lister is None:
        return None
    try:
        rows = lister() or []
    except Exception:
        logger.debug("crew-manager: peek could not list sessions", exc_info=True)
        return None

    wanted = name.casefold()
    for meta in rows:
        if not isinstance(meta, dict):
            continue
        key = str(meta.get("key") or "")
        if not key:
            continue
        if _is_private(mcp_core, meta):
            continue
        if _bucket(mcp_core, meta.get("workspace")) != workspace:
            continue
        title = str(meta.get("title") or "")
        if key.casefold() == wanted or " ".join(title.split()).casefold() == wanted:
            return key
    return None


def _tail(log: Any, key: str, rows: int) -> list[dict]:
    """The last *rows* user/assistant entries of *key*.

    ``ConversationLog.recent`` is the shared tail reader and does the role
    filtering itself. A gateway without it falls back to reading the messages and
    tailing them here, so peek keeps working rather than reporting a session
    empty.
    """
    recent = getattr(log, "recent", None)
    if recent is not None:
        got = recent(key, max_messages=rows, roles=set(PEEK_ROLES)) or []
        return [row for row in got if isinstance(row, dict)]

    messages = log.read_messages(key) or []
    kept = [
        row
        for row in messages
        if isinstance(row, dict) and str(row.get("role") or "") in PEEK_ROLES
    ]
    return kept[-rows:]


def _peek_blocking(name: str, rows: int, workspace: str | None) -> dict:
    """One peek. Synchronous file I/O — never call this on the event loop."""
    loaded = _load_backend()
    if loaded is None:
        return unavailable("session history is unavailable on this gateway")
    ConversationLog, mcp_core = loaded

    # Fail closed on scope BEFORE anything is read. recall may run unscoped
    # because its other filters still bound what surfaces; peek returns one named
    # session's own words, so an unverifiable workspace is a refusal.
    if not workspace:
        return unavailable("the caller's workspace could not be determined")

    # Likewise on redaction: establish that the helper is reachable before a
    # transcript is opened, so there is no path on which text is read and then
    # returned unredacted because the helper turned out to be missing.
    redact = getattr(mcp_core, "_redact_history_output", None)
    if redact is None:
        return unavailable("the redaction helper is unavailable")

    try:
        log = ConversationLog()
    except Exception:
        logger.debug("crew-manager: peek could not open the history log", exc_info=True)
        return unavailable("session history could not be opened")

    key = _resolve_key(log, mcp_core, name, workspace)
    if key is None:
        return unavailable("no session by that name")

    try:
        meta = log.get_metadata(key) or {}
    except Exception:
        logger.debug("crew-manager: peek could not read session metadata", exc_info=True)
        return unavailable("that session's metadata could not be read")

    # The authoritative check, on the session's OWN metadata rather than on a
    # listing row. Both doors, same as recall.
    if _is_private(mcp_core, meta):
        return unavailable("that session is private (incognito or temporary)")

    if _bucket(mcp_core, meta.get("workspace")) != workspace:
        return unavailable("that session belongs to a different workspace")

    try:
        tail = _tail(log, key, rows)
    except Exception:
        logger.debug("crew-manager: peek could not read a transcript", exc_info=True)
        return unavailable("that session's transcript could not be read")

    out: list[dict] = []
    for row in tail[-rows:]:
        text = flatten_content(row.get("content"))
        if not text.strip():
            continue
        try:
            text = redact(text)
        except Exception:
            # A redactor that raised has told us nothing about this text, so the
            # text is dropped. Peek never falls back to the unredacted string.
            logger.debug("crew-manager: peek redaction failed", exc_info=True)
            continue
        out.append({"role": str(row.get("role") or "?"), "text": clip_text(text)})

    try:
        title = redact(str(meta.get("title") or key))
    except Exception:
        # A title is content too — it is whatever the session was named.
        title = key

    return {
        "available": True,
        "session_key": key,
        "title": clip_text(title, limit=200),
        "workspace": workspace,
        "modified": meta.get("modified") or 0,
        "rows": out,
        # Stated rather than left to be counted, so a reader can tell a short
        # session from a peek that hit the cap and has more behind it.
        "returned": len(out),
        "requested": rows,
        "cap": PEEK_ROWS_MAX,
    }


async def peek_session(
    name: object,
    *,
    rows: object = PEEK_ROWS_DEFAULT,
    workspace: str | None = None,
) -> dict:
    """The recent activity of the session called *name*.

    Returns either ``{"available": True, ...}`` with capped, redacted rows, or
    ``{"available": False, "reason": ...}``. Never both, and never content on a
    refusal.

    The read is real file I/O over a transcript, so it runs in a worker thread:
    doing it inline would block the gateway's event loop — and therefore every
    other request — for the length of the read.
    """
    wanted = normalize_name(name)
    if not name_is_safe(wanted):
        return unavailable("no session by that name")

    count = clamp_rows(rows)
    try:
        return await asyncio.to_thread(_peek_blocking, wanted, count, workspace)
    except asyncio.CancelledError:
        raise
    except Exception:
        logger.debug("crew-manager: peek failed", exc_info=True)
        return unavailable("the peek failed")
