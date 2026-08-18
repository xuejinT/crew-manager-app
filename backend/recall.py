"""Past-work recall: find work the user already did, by searching transcripts.

The live board can only show work the gateway still holds in a slot. Everything
older is invisible, which makes "what did we decide about X three weeks ago" a
question Crew Manager cannot answer at all — the user has to go trawl the session
list by hand, which is exactly the supervision cost this app exists to remove.

WHY THIS REUSES THE PLATFORM'S SEARCH INSTEAD OF SCANNING FILES ITSELF
----------------------------------------------------------------------
``ConversationLog.search_sessions`` is the ONE ranking every transcript-search
consumer shares — the dashboard history filter, the ``search_chat_history`` MCP
tool, and Discord session resume. Its own docstring gives the reason: "the best
match for this query should not depend on which surface asked". A private ranking
here would make Crew Manager disagree with the rest of the product about what the
best match is.

The filtering around it is copied from the MCP tool rather than reinvented,
because each step is a security invariant, not a nicety:

* incognito / temporary sessions NEVER surface, checked on both the ranked meta
  and the full metadata — a private session must not leak through a second door;
* workspace scoping is fail-closed, so an unset bucket is treated as "default"
  rather than as "everything";
* a session file can be unlinked between the ranked snapshot and the read
  (rotation, clear-sessions, another process), so existence is re-checked — a
  ghost row the user cannot open is worse than one fewer result;
* the FULL ranked set is fetched and filtered afterwards, never a small page:
  heavy private/workspace drops on the first page would otherwise starve a query
  whose real matches rank lower and report "nothing found" while hits exist;
* output is redacted for credentials and exfiltration URLs, because a snippet is
  a verbatim quote of whatever the session touched.

All of it is behind a guarded import. These are platform internals; if a gateway
moves them, recall reports itself unavailable and the rest of the app is
unaffected.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any

logger = logging.getLogger(__name__)

#: Below this, a query is not worth a transcript scan — a single character
#: matches nearly everything and the ranking cannot say anything useful.
RECALL_MIN_QUERY = 2

#: What one screenful of recalled work looks like.
RECALL_LIMIT_DEFAULT = 8

#: Ceiling on a caller-supplied limit. Recall is a sidebar, not an export.
RECALL_LIMIT_MAX = 25

#: Hard cap on a snippet after redaction, so one row cannot become a wall.
RECALL_SNIPPET_CHARS = 320


def normalize_query(value: object) -> str:
    """Collapse a raw query parameter to the string the search will actually use."""
    if not isinstance(value, str):
        return ""
    return " ".join(value.split())


def clamp_limit(value: object, *, default: int = RECALL_LIMIT_DEFAULT) -> int:
    """A usable result count from whatever arrived on the query string."""
    try:
        out = int(str(value))
    except (TypeError, ValueError):
        return default
    if out < 1:
        return default
    return min(out, RECALL_LIMIT_MAX)


def query_is_searchable(query: str) -> bool:
    """Whether this query earns a transcript scan."""
    return len(query) >= RECALL_MIN_QUERY


def _load_backend() -> tuple[Any, Any] | None:
    """The platform's conversation log and history-search helpers, or None."""
    try:
        from kiro_crew import mcp_core
        from kiro_crew.history import ConversationLog
    except Exception:  # pragma: no cover - gateway without these modules
        logger.debug("crew-manager: history search unavailable", exc_info=True)
        return None
    return ConversationLog, mcp_core


#: A whitespace-free run longer than this is not prose. Real sentences do not
#: contain 40-character words; paths, hashes, URLs and upload filenames do.
SNIPPET_MAX_TOKEN = 40


def snippet_is_useful(snippet: object, query: object) -> bool:
    """Whether a snippet earns its place on the card.

    The platform's extractor takes a fixed window around the first match, which is
    the right shared behaviour but is blind to WHAT it captured. Against real
    transcripts that window regularly lands inside an upload filename
    (``…ds/40afadcf…_Screenshot_2026-08-10_at_11.44.05``) or inside a block of
    boilerplate that several sessions happen to share — so two different sessions
    come back wearing the same snippet.

    A row showing its title and its age is honest. A row showing a filename
    fragment is noise pretending to be context, and it breaks the rule that a card
    must say enough to act on without opening another thread. So a snippet has to
    pass two tests, and is dropped rather than patched when it fails:

    1. it contains a term from the query, which is what makes it evidence of WHY
       this session matched;
    2. it reads like prose, measured by its longest unbroken run.
    """
    text = snippet if isinstance(snippet, str) else ""
    text = text.strip()
    if not text:
        return False

    longest = max((len(tok) for tok in text.split()), default=0)
    if longest > SNIPPET_MAX_TOKEN:
        return False

    needle = query if isinstance(query, str) else ""
    terms = [t for t in needle.split() if len(t) >= 2]
    if not terms:
        # A CJK query has no spaces to split on, so fall back to its own character
        # pairs — the same adjacency floor the platform's ranking uses.
        stripped = "".join(needle.split())
        terms = [stripped[i:i + 2] for i in range(len(stripped) - 1)]
    if not terms:
        return False

    folded = text.casefold()
    return any(term.casefold() in folded for term in terms)


#: How much context to keep on each side of the match when re-centring.
SNIPPET_FOCUS_RADIUS = 90


def focus_snippet(snippet: object, query: object, *, radius: int = SNIPPET_FOCUS_RADIUS) -> str:
    """Re-centre a snippet on the query term, without re-extracting it.

    The platform's extractor anchors its window on the FIRST match in the whole
    transcript. With a multi-word query that first match is often a common word
    ("model") sitting in unrelated boilerplate, and since the card shows the START
    of the snippet, what the user reads can have nothing to do with what they
    typed — the match may be 300 characters further along.

    Extraction stays the platform's job, shared with every other search surface.
    WHERE the visible window sits is presentation, and that is ours: this shifts
    the view onto the term so the first thing read is the reason this row is here.
    """
    text = snippet if isinstance(snippet, str) else ""
    text = " ".join(text.split())
    if not text:
        return ""

    needle = query if isinstance(query, str) else ""
    terms = [t for t in needle.split() if len(t) >= 2] or [needle.strip()]
    folded = text.casefold()
    hit = -1
    for term in terms:
        found = folded.find(term.casefold())
        if found >= 0 and (hit < 0 or found < hit):
            hit = found
    if hit < 0:
        return text

    start = max(0, hit - radius)
    end = min(len(text), hit + radius)
    # Do not cut mid-word at either edge when there is a space to cut on instead.
    if start > 0:
        space = text.find(" ", start)
        if 0 <= space < hit:
            start = space + 1
    if end < len(text):
        space = text.rfind(" ", hit, end)
        if space > hit:
            end = space

    out = text[start:end].strip()
    if start > 0:
        out = "… " + out
    if end < len(text):
        out = out + " …"
    return out


#: The platform's extractor wraps the match in these. They are meant for a
#: highlighter; rendered as-is on a card they read as a bug.
_MARK_OPEN = "<<<"
_MARK_CLOSE = ">>>"


def strip_match_markers(text: object) -> str:
    """Remove the extractor's ``<<<match>>>`` highlight markers."""
    out = text if isinstance(text, str) else ""
    return out.replace(_MARK_OPEN, "").replace(_MARK_CLOSE, "")


def _clip(text: object) -> str:
    out = text if isinstance(text, str) else ""
    out = " ".join(out.split())
    if len(out) > RECALL_SNIPPET_CHARS:
        out = out[: RECALL_SNIPPET_CHARS - 1].rstrip() + "…"
    return out


def _search_blocking(query: str, limit: int, workspace: str | None) -> list[dict]:
    """One recall pass. Synchronous file I/O — never call this on the event loop."""
    loaded = _load_backend()
    if loaded is None:
        return []
    ConversationLog, mcp_core = loaded

    log = ConversationLog()
    scan = getattr(mcp_core, "_SEARCH_HISTORY_SCAN", 200)
    try:
        ranked = log.search_sessions(query, limit=scan)
    except Exception:
        logger.debug("crew-manager: recall search failed", exc_info=True)
        return []

    is_private = getattr(mcp_core, "_history_is_incognito", None)
    extract = getattr(mcp_core, "_extract_history_snippet", None)
    redact = getattr(mcp_core, "_redact_history_output", None)
    bucket = getattr(mcp_core, "_ws_bucket", None)

    out: list[dict] = []
    for meta in ranked:
        if len(out) >= limit:
            break
        key = str(meta.get("key") or "")
        if not key:
            continue
        # The file may have been unlinked since the ranked snapshot was taken.
        try:
            if not log.has_log(key):
                continue
            full_meta = log.get_metadata(key) or {}
        except Exception:
            continue
        if is_private is not None and (is_private(full_meta) or is_private(meta)):
            continue
        if workspace is not None and bucket is not None:
            if bucket(full_meta.get("workspace")) != workspace:
                continue

        snippet = ""
        if extract is not None:
            try:
                snippet = extract(log.read_messages(key), query) or ""
            except Exception:
                snippet = ""
        if redact is not None and snippet:
            try:
                snippet = redact(snippet)
            except Exception:
                snippet = ""
        # Order matters. Focus FIRST, then judge: the extractor's window often
        # OPENS on an upload filename and only then reaches the sentence that
        # actually mentions the query, so judging the raw start threw away good
        # snippets for the sake of their first 60 characters.
        snippet = strip_match_markers(focus_snippet(snippet, query))
        if not snippet_is_useful(snippet, query):
            snippet = ""

        out.append(
            {
                "session_key": key,
                "title": _clip(meta.get("title") or key),
                "snippet": _clip(snippet),
                "modified": meta.get("modified") or 0,
                "created": meta.get("created") or "",
            }
        )
    return out


async def search_past_work(
    query: object,
    *,
    limit: object = RECALL_LIMIT_DEFAULT,
    workspace: str | None = None,
) -> dict:
    """Recall past work matching *query*.

    Returns ``{"enabled": bool, "query": str, "results": [...]}``. ``enabled`` is
    False when this gateway does not expose the history modules, which lets the UI
    hide the section instead of showing an empty one that looks like "you never
    did this".

    The scan is real file I/O over many transcripts, so it runs in a worker
    thread: doing it inline would block the gateway's event loop — and therefore
    every other request — for the length of the scan.
    """
    text = normalize_query(query)
    count = clamp_limit(limit)
    if not query_is_searchable(text):
        return {"enabled": _load_backend() is not None, "query": text, "results": []}

    try:
        results = await asyncio.to_thread(_search_blocking, text, count, workspace)
    except asyncio.CancelledError:
        raise
    except Exception:
        logger.debug("crew-manager: recall failed", exc_info=True)
        return {"enabled": False, "query": text, "results": []}

    return {
        "enabled": _load_backend() is not None,
        "query": text,
        "results": results,
    }
