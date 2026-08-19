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

from recall import search_past_work  # noqa: E402
from prchecks import pr_check_counts  # noqa: E402
from initiatives import add_initiative, load_initiatives, remove_initiative  # noqa: E402
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


async def handle_pr_checks(request: web.Request, ctx: Any) -> web.Response:
    """GET /pr-checks?url=... — check-count rollup for one PR, from `gh`.

    Degrades to ``available: False`` (never an error) when gh is missing, the URL
    is not a GitHub PR, or the call fails, so the UI falls back to the coarse
    status line rather than breaking.
    """
    denied = _unauthorized(request)
    if denied is not None:
        return denied
    payload = await pr_check_counts(request.query.get("url"))
    return web.json_response(payload)


async def handle_initiatives(request: web.Request, ctx: Any) -> web.Response:
    """GET /initiatives — the user's big goals, from this app's own goals.json.

    First run imports any existing projects.md once as a courtesy; after that
    the store is Crew Manager's alone. Missing/corrupt store degrades to [].
    """
    denied = _unauthorized(request)
    if denied is not None:
        return denied
    return web.json_response({"initiatives": load_initiatives()})


async def handle_add_initiative(request: web.Request, ctx: Any) -> web.Response:
    """POST /initiatives {name, aliases?} — define a big goal from the UI."""
    denied = _unauthorized(request)
    if denied is not None:
        return denied
    try:
        payload = await request.json()
    except Exception:
        return web.json_response({"error": "invalid json"}, status=400)
    aliases = payload.get("aliases")
    if aliases is not None and not isinstance(aliases, list):
        return web.json_response({"error": "aliases must be a list"}, status=400)
    try:
        buckets = add_initiative(payload.get("name", ""), aliases)
    except ValueError as error:
        return web.json_response({"error": str(error)}, status=400)
    except OSError:
        logger.exception("crew-manager: could not write goals.json")
        return web.json_response({"error": "could not write goals"}, status=500)
    return web.json_response({"initiatives": buckets})


async def handle_remove_initiative(request: web.Request, ctx: Any) -> web.Response:
    """POST /initiatives/remove {name} — drop a big goal. Unknown name: no-op."""
    denied = _unauthorized(request)
    if denied is not None:
        return denied
    try:
        payload = await request.json()
    except Exception:
        return web.json_response({"error": "invalid json"}, status=400)
    try:
        buckets = remove_initiative(payload.get("name", ""))
    except OSError:
        logger.exception("crew-manager: could not write goals.json")
        return web.json_response({"error": "could not write goals"}, status=500)
    return web.json_response({"initiatives": buckets})


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
        AppRoute(method="GET", path="/pr-checks", handler=handle_pr_checks),
        AppRoute(method="GET", path="/initiatives", handler=handle_initiatives),
        AppRoute(method="POST", path="/initiatives", handler=handle_add_initiative),
        AppRoute(method="POST", path="/initiatives/remove", handler=handle_remove_initiative),
    ]
