"""Crew Manager backend routes.

Registered through ``backend.hooks.routes`` in `app.json`. Paths are RELATIVE to
`/api/apps/crew-manager`, and every handler takes ``(request, ctx)`` -- the
external-app contract, which differs from builtins: adding routes directly to the
aiohttp router never dispatches for an installed app, because the RouteRegistry
catch-all shadows it.

Endpoints:

* ``GET  /stalls``   -- current findings plus the settings in force
* ``POST /settings`` -- adjust the threshold, the re-notify window, or turn the
  watcher off without uninstalling the app
* ``POST /sweep``    -- run one detection pass now (used by tests and by the UI's
  manual refresh, so nobody has to wait out a sweep interval to see a change)
* ``GET  /recall``   -- past work matching a query, from the transcript history
  the live board cannot see
* ``GET  /peek``     -- the recent transcript rows of ONE named session, so the
  Conductor can look at what a session did instead of only reading a summary
  written about it
* ``GET  /assigned`` -- the developer's own open pull requests and assigned issues
* ``GET  /conductor-agent`` -- whether the Conductor agent is bindable here
"""

from __future__ import annotations

import logging
import sys
import time
from pathlib import Path
from typing import Any

from aiohttp import web

# The backend package is loaded by path, so a sibling import needs this dir on
# the path -- without it `import detect` fails once the gateway loads the module
# under its own package name.
sys.path.insert(0, str(Path(__file__).resolve().parent))

from peek import peek_session, name_is_safe, normalize_name  # noqa: E402
from conductor_agent import conductor_agent  # noqa: E402
from recall import search_past_work  # noqa: E402
from assigned import assigned_work  # noqa: E402
from watcher import WATCHER  # noqa: E402

logger = logging.getLogger(__name__)

# Bounds on user-supplied settings. A one-minute floor keeps the threshold above
# ordinary long tool calls; the ceiling stops a typo parking the feature for a
# year.
_MIN_STALL_SECS = 60
_MAX_STALL_SECS = 86_400
_MIN_RENOTIFY_SECS = 60
_MAX_RENOTIFY_SECS = 604_800
# Two would make an ordinary retry a "loop"; the floor keeps that impossible.
_MIN_REPEATS_FLOOR = 3
_MIN_REPEATS_CEIL = 50


def _clamp(value: Any, low: int, high: int, fallback: int) -> int:
    try:
        number = int(value)
    except (TypeError, ValueError):
        return fallback
    return max(low, min(high, number))


def _unauthorized(request: web.Request) -> web.Response | None:
    """401 unless this request carries a user, per the app-route contract."""
    if request.get("user") is None:
        return web.json_response({"error": "unauthorized"}, status=401)
    return None


async def handle_stalls(request: web.Request, ctx: Any) -> web.Response:
    denied = _unauthorized(request)
    if denied is not None:
        return denied
    state = request.app["state"]
    WATCHER.ensure_started(state)
    return web.json_response(WATCHER.snapshot())


async def handle_sweep(request: web.Request, ctx: Any) -> web.Response:
    denied = _unauthorized(request)
    if denied is not None:
        return denied
    state = request.app["state"]
    WATCHER.ensure_started(state)
    WATCHER.sweep(state, time.time())
    return web.json_response(WATCHER.snapshot())


async def handle_settings(request: web.Request, ctx: Any) -> web.Response:
    denied = _unauthorized(request)
    if denied is not None:
        return denied
    try:
        body = await request.json()
    except Exception:
        body = {}
    if not isinstance(body, dict):
        body = {}

    if "enabled" in body:
        WATCHER.enabled = bool(body["enabled"])
    if "stall_secs" in body:
        WATCHER.stall_secs = _clamp(
            body["stall_secs"], _MIN_STALL_SECS, _MAX_STALL_SECS, WATCHER.stall_secs
        )
    if "renotify_secs" in body:
        WATCHER.renotify_secs = _clamp(
            body["renotify_secs"],
            _MIN_RENOTIFY_SECS,
            _MAX_RENOTIFY_SECS,
            WATCHER.renotify_secs,
        )

    if "min_repeats" in body:
        WATCHER.min_repeats = _clamp(
            body["min_repeats"], _MIN_REPEATS_FLOOR, _MIN_REPEATS_CEIL, WATCHER.min_repeats
        )

    state = request.app["state"]
    WATCHER.ensure_started(state)
    return web.json_response(WATCHER.snapshot())


async def handle_recall(request: web.Request, ctx: Any) -> web.Response:
    """GET /recall?q=...&limit=...&scope=workspace|all -- past work matching a query.

    Scoped to the CALLER's workspace by DEFAULT, fail-closed: an unresolvable
    workspace is treated as "default" rather than as "search everything", so a
    misread never widens what the user can see.

    ``scope=all`` lifts the workspace filter, and only that filter. It is opt-in
    per query and never sticky, because the widening has to be a thing the user
    did rather than a mode they are silently left in. Everything else holds
    unchanged: incognito and temporary sessions still never surface, transcripts
    of private sessions are still never read, vanished files still produce no
    ghost rows, and snippets are still redacted. Each result names the workspace
    it came from so a cross-workspace hit cannot be mistaken for a local one.
    """
    denied = _unauthorized(request)
    if denied is not None:
        return denied

    workspace = _caller_workspace(request)
    payload = await search_past_work(
        request.query.get("q"),
        limit=request.query.get("limit"),
        workspace=workspace,
        # Anything other than the literal "all" means the default scope: an
        # unrecognised value must narrow, never widen.
        all_workspaces=(request.query.get("scope") == "all"),
    )
    return web.json_response(payload)


async def handle_peek(request: web.Request, ctx: Any) -> web.Response:
    """GET /peek?session=<key or title>&rows=N -- what that session just did.

    The board can say what a session is ABOUT; this says what it actually SAID.
    Everything the Conductor sees today about a session's activity is second-hand
    -- a title, a stall verdict, a generated summary -- so when the summary is
    stale or too coarse there is nowhere to go but opening the session by hand.
    Peek is that step down to the evidence.

    ``session`` is required and must be a key or an exact title; ``rows`` is
    clamped to ``peek.PEEK_ROWS_MAX``.

    Status codes follow the house rule. A missing or path-bearing ``session`` is
    malformed input and answers 400. Everything else -- including every privacy
    refusal -- answers HTTP 200 with ``{"available": false, "reason": ...}``,
    because peek only ENRICHES the board: an error status would make the view look
    broken when the honest answer is "not for you to read".

    Refusals, all of them enforced in ``peek.py`` and covered by
    ``backend/selftest.py``: a private (incognito/temporary) session is never
    read, a session outside the caller's workspace is never read, an
    UNDETERMINABLE caller workspace refuses rather than widens, and an
    unreachable redaction helper refuses rather than returning raw text.
    """
    denied = _unauthorized(request)
    if denied is not None:
        return denied

    wanted = normalize_name(request.query.get("session"))
    if not wanted:
        return web.json_response({"error": "session is required"}, status=400)
    if not name_is_safe(wanted):
        return web.json_response({"error": "invalid session"}, status=400)

    payload = await peek_session(
        wanted,
        rows=request.query.get("rows"),
        # Same resolver recall uses, and the same fail-closed intent -- but peek
        # treats an unresolvable workspace as a REFUSAL rather than as "do not
        # filter", because the payload here is one named session's own words.
        workspace=_caller_workspace(request),
    )
    return web.json_response(payload)


async def handle_conductor_agent(request: web.Request, ctx: Any) -> web.Response:
    """GET /conductor-agent — whether the Conductor agent can be bound here.

    The frontend cannot answer this for itself: creating a slot validates only the
    agent name's charset, so a name nothing answers to is accepted and the
    Conductor then takes a message and never replies. Registration is also
    conditional on this install trusting app-provided agents, so shipping the
    spec is not evidence that it exists.

    Always HTTP 200. ``available: false`` with a reason is a legitimate answer,
    not a failure -- the caller falls back to the default agent, which is what
    ships today.
    """
    denied = _unauthorized(request)
    if denied is not None:
        return denied
    return web.json_response(conductor_agent())


def _caller_workspace(request: web.Request) -> str | None:
    """The workspace bucket recall is confined to, or None when unknowable.

    None means "do not filter", which is only correct when the gateway cannot tell
    us the bucket at all; in that case the platform's own private-session and
    existence filters still apply.
    """
    state = request.app.get("state")
    name = getattr(state, "workspace", None) or getattr(state, "workspace_name", None)
    if not isinstance(name, str) or not name.strip():
        return None
    try:
        from kiro_crew.mcp_core import _ws_bucket
    except Exception:
        return None
    return _ws_bucket(name)


async def handle_assigned(request: web.Request, ctx: Any) -> web.Response:
    """GET /assigned — the developer's own open PRs and issues assigned to them.

    Degrades to ``available: False`` (never an error) when gh is missing or fails,
    because this enriches the board rather than constituting it: a developer
    without gh must still get their sessions.

    ``?force=1`` skips the TTL cache, for the refresh control.
    """
    denied = _unauthorized(request)
    if denied is not None:
        return denied
    force = str(request.query.get("force") or "") in {"1", "true", "yes"}
    payload = await assigned_work(force=force)
    return web.json_response(payload)


def register_routes(ctx: Any) -> list:
    """Declare Crew Manager's backend routes.

    Imported lazily so a gateway without the route registry still loads the app's
    UI instead of failing the whole install.
    """
    from kiro_crew.apps.route_registry import AppRoute

    logger.info("crew-manager: registering backend routes")
    return [
        AppRoute(method="GET", path="/stalls", handler=handle_stalls),
        AppRoute(method="POST", path="/sweep", handler=handle_sweep),
        AppRoute(method="POST", path="/settings", handler=handle_settings),
        AppRoute(method="GET", path="/recall", handler=handle_recall),
        AppRoute(method="GET", path="/peek", handler=handle_peek),
        AppRoute(method="GET", path="/conductor-agent", handler=handle_conductor_agent),
        AppRoute(method="GET", path="/assigned", handler=handle_assigned),
    ]
