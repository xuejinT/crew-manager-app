"""Startup wiring for the Conductor: where the gateway hands us its handle.

Two entry points, called by two different gateway mechanisms:

* :func:`bind_host` — a module-level symbol the route registry looks for on the
  module named by ``backend.hooks.routes`` and calls with the gateway's aiohttp
  application (VERIFIED: ``apps/route_registry.py:226`` calls it before
  ``register_fn(ctx)``, ``:339`` passes ``self._app``, ``:340-341`` awaits an
  awaitable result). ``AppContext`` carries no host handle
  (VERIFIED: ``apps/context.py:52``), so this is the only way a background loop
  reaches ``DashboardState`` without waiting for a browser to open the panel.
  Because the registry looks the symbol up on the *hook* module, it is
  re-exported from ``backend/routes.py``; the definition lives here.
* :func:`on_startup` / :func:`on_shutdown` — declared in ``app.json`` and invoked
  with the app's ``AppContext`` (VERIFIED: ``apps/lifecycle.py:179-181``,
  coroutines awaited). Routes are registered *before* ``on_startup``
  (VERIFIED: ``apps/hooks_integration.py:361-374``), so by the time the startup
  hook runs the host handle either arrived or the gateway does not support the
  seam — which is exactly the thing :func:`on_startup` says out loud.

**Nothing here holds state.** The singleton lives in
``conductor/routes.py`` (:data:`conductor.routes.RUNTIME`) because the gateway
loads an installed app's hook modules by file path under private ``sys.modules``
keys (VERIFIED: ``apps/module_loader.py:114,139``), so this module reached through
the ``on_startup`` hook and this module reached through a sibling import from
``backend/routes.py`` are two distinct objects with two sets of globals — the trap
``apps/lifecycle.py:169-175`` documents. Both copies import ``conductor.routes``
the same way, so there is one runtime no matter how many copies of this file the
loader made.

**Autonomy is never armed by a boot the operator did not ask for.** The default is
``mode: advisory``, ``running: false``; :func:`bind_host` reads ``control.json``
off the loop and arms only if a human previously said START and has not said STOP.
"""

from __future__ import annotations

import asyncio
import logging
import sys
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

# The backend package is loaded by path, so a sibling import needs this
# directory on sys.path -- the same reason (and the same fix) as
# ``backend/routes.py:35-38``. Guarded against duplicates because this module is
# loaded once per hook and once per sibling import.
_BACKEND_DIR = str(Path(__file__).resolve().parent)
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)

try:
    from conductor import routes as conductor_routes_module
    from conductor.routes import RUNTIME
except Exception:  # pragma: no cover - a broken conductor must not cost the UI
    conductor_routes_module = None  # type: ignore[assignment]
    RUNTIME = None  # type: ignore[assignment]
    logging.getLogger(__name__).exception(
        "crew-manager: conductor package unavailable; autonomy is disabled and "
        "the app's other routes are unaffected"
    )


def _live() -> bool:
    """Is the conductor package importable at all?

    Called at the top of every entry point. A gateway that cannot import the
    conductor still loads the app's UI and its existing routes — house rule 3,
    and the practical reason for it: the HTTP surface is what an operator uses to
    turn a broken thing off.
    """
    if RUNTIME is None:
        logger.warning("crew-manager: conductor hook skipped (package unavailable)")
        return False
    return True


def bind_host(app: Any) -> None:
    """Capture the gateway's host handle and resume only if told to.

    Synchronous and non-blocking on purpose. It is called on the event loop, once
    per boot for an enabled app plus once per enable, so everything that touches
    the disk — reading ``control.json``, stat-ing the HALT marker — happens in a
    task that offloads to a thread. Doing that work inline would put file I/O on
    the loop during gateway startup, which is the I9 rule this whole design is
    built around.

    Idempotent, which the registry requires: it calls this once per gateway boot
    for an enabled app *plus* once per enable. A second call re-attaches the same
    handle (a no-op) and does not schedule a second resume check.
    """
    if not _live():
        return
    RUNTIME.attach_app(app)
    if not RUNTIME.ensure_resume_attempt("bind_host"):
        logger.debug("crew-manager: bind_host had nothing new to do")


async def _resume(source: str) -> None:
    """Read the operator's persisted intent, arm the loop if it says to."""
    try:
        outcome = await conductor_routes_module.resume_if_running(source=source)
    except asyncio.CancelledError:
        raise
    except Exception:
        logger.exception("crew-manager: conductor resume failed; nothing armed")
        return
    if outcome.get("armed"):
        logger.info("crew-manager: conductor resumed (%s)", source)
    else:
        logger.info(
            "crew-manager: conductor not armed — %s",
            outcome.get("reason") or "no reason given",
        )


async def on_startup(ctx: Any) -> None:
    """Arm everything that works without a host handle, and say if one never came.

    What this can do with no handle: create the state directory, so the first
    write is not also the first ``mkdir``, and report the situation. What it
    deliberately does NOT do:

    * **Mark the app degraded.** ``ctx.health.mark_degraded`` would put a warning
      on an app whose UI, board, recall and peek all work perfectly; the missing
      seam costs one thing only — arming without a browser — and the app falls
      back to arming on the first request. A health warning that does not
      correspond to something the operator can fix trains them to ignore health
      warnings.
    * **Start anything.** See the module docstring: a boot is not an instruction.
      :func:`bind_host` already ran (routes are registered first,
      ``apps/hooks_integration.py:361-374``) and either resumed or explained why
      not. The :func:`_resume` call below is the belt for a gateway whose ordering
      differs from what we read; ``resume_if_running`` returns early when the
      loop is already armed, so it cannot double-start a driver.
    """
    if not _live():
        return
    RUNTIME.attach_ctx(ctx)

    def _ensure_dirs() -> None:
        from conductor import store

        store.conductor_dir().mkdir(parents=True, exist_ok=True)
        store.goals_dir().mkdir(parents=True, exist_ok=True)

    try:
        await asyncio.to_thread(_ensure_dirs)
    except Exception:
        logger.warning("crew-manager: could not prepare the conductor state dir", exc_info=True)

    if RUNTIME.state is None:
        RUNTIME.note(
            "on_startup: no host handle — this gateway has no bind_host seam, so "
            "the conductor arms on the first panel request instead of at boot",
            level=logging.WARNING,
        )
        return

    logger.info("crew-manager: conductor on_startup with a host handle")
    await _resume("on_startup")


async def on_shutdown(ctx: Any) -> None:
    """Stop the loop cleanly. Does NOT record an operator stop.

    A gateway shutdown is not a human saying STOP, so ``control.json`` is left
    alone: ``running`` stays true and the next boot resumes exactly the autonomy
    the operator asked for. Writing ``operator_stopped`` here would make every
    restart silently disarm the conductor, and clearing ``running`` would make a
    crash and a clean exit behave differently.

    Route deregistration drops this module from ``sys.modules`` but cancels
    nothing the app started (``apps/route_registry.py`` -> ``unload_app_modules``),
    so tearing the loop down is the app's job, not the gateway's — and this hook
    is also what runs on a *disable*, which is why the resume latch is reset:
    a re-enable in the same gateway process has to re-read the operator's intent
    rather than inherit this process's memory of having already looked.
    """
    if not _live():
        return
    if RUNTIME.seam.bound:
        ok, result = await RUNTIME.seam.close()
        if not ok:
            logger.warning("crew-manager: conductor shutdown incomplete — %s", result)
    await RUNTIME.cancel_tasks()
    RUNTIME.reset_resume()
    logger.info("crew-manager: conductor stopped for gateway shutdown")
