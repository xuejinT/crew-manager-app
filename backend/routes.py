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
* ``POST /goal-pass`` -- one semantic clustering pass over the items the
  rule-based grouper left ungrouped; degrades to ``available: false``
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

import goalpass  # noqa: E402
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


async def handle_goal_pass(request: web.Request, ctx: Any) -> web.Response:
    """POST /goal-pass — one semantic clustering pass over the ungrouped items.

    Request: ``{"clusters": [{key, name, items:[{id,title}]}],
    "ungrouped": [{id, title, detail?}]}``.

    Success: ``{"available": true, "assignments": [...], "names": [...]}``.
    ANY failure — no gateway state, no LLM helpers, timeout, unparseable reply —
    answers HTTP 200 with ``{"available": false, "reason": "..."}``, because this
    is an enhancement over the rule-based grouping the UI already shows. An error
    status would make the Goals view look broken when it is merely unimproved.
    """
    denied = _unauthorized(request)
    if denied is not None:
        return denied

    try:
        body = await request.json()
    except Exception:
        body = {}
    if not isinstance(body, dict):
        body = {}

    clusters = goalpass.clamp_clusters(body.get("clusters"))
    ungrouped = goalpass.clamp_ungrouped(body.get("ungrouped"))

    # Nothing to assign and nothing to name: the answer is already known, so no
    # call is made at all.
    if not goalpass.needs_pass(clusters, ungrouped):
        return web.json_response({"available": True, "assignments": [], "names": []})

    state = request.app.get("state")
    sessions = getattr(state, "sessions", None)
    if sessions is None:
        return _pass_unavailable("no gateway session manager")

    # Imported here, never at module scope: this app's backend must load (and its
    # selftest must run) on a machine with no kiro_crew importable.
    try:
        import asyncio
        import uuid

        from kiro_crew.llm_helpers import (
            ToolApprovalPolicy,
            parse_llm_json,
            stream_and_collect,
        )
    except Exception:
        logger.debug("crew-manager: goal pass has no llm helpers", exc_info=True)
        return _pass_unavailable("model helpers unavailable")

    prompt = goalpass.build_prompt(clusters, ungrouped)
    key = f"crew-manager-goalpass:{uuid.uuid4().hex}"
    try:
        provider, _n, _r = await sessions.get_or_create(key, agent=goalpass.PASS_AGENT)
    except Exception:
        logger.debug("crew-manager: goal pass could not open a session", exc_info=True)
        return _pass_unavailable("could not start a model session")

    text = ""
    reason: str | None = None
    try:
        text = await asyncio.wait_for(
            stream_and_collect(
                provider,
                prompt,
                # The pass reads nothing and writes nothing; a tool request here
                # would only be a prompt-injected title trying its luck.
                approval_policy=ToolApprovalPolicy.REJECT_ALL,
            ),
            timeout=goalpass.PASS_TIMEOUT_SECS,
        )
    except (TimeoutError, asyncio.TimeoutError):
        reason = "the model did not answer in time"
    except Exception:
        logger.debug("crew-manager: goal pass call failed", exc_info=True)
        reason = "the model call failed"
    finally:
        # Both, always: release alone leaves the kiro-cli subprocess running for
        # a session nobody will ever ask for again.
        try:
            sessions.release(key)
        except Exception:
            logger.debug("crew-manager: goal pass release failed", exc_info=True)
        try:
            await sessions.destroy(key)
        except Exception:
            logger.debug("crew-manager: goal pass destroy failed", exc_info=True)

    if reason is not None:
        return _pass_unavailable(reason)

    payload = parse_llm_json(text or "")
    if not isinstance(payload, dict):
        return _pass_unavailable("the model reply was not usable JSON")

    result = goalpass.parse_pass(
        payload,
        {cluster["key"] for cluster in clusters},
        {item["id"] for item in ungrouped},
    )
    return web.json_response({"available": True, **result})


def _pass_unavailable(reason: str) -> web.Response:
    """HTTP 200 with available:false — a missing improvement, not an error."""
    return web.json_response({"available": False, "reason": reason})


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
        AppRoute(method="POST", path="/goal-pass", handler=handle_goal_pass),
    ]
