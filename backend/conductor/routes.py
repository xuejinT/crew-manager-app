"""The Conductor's HTTP surface — the operator's only writable authority path.

Everything autonomy can be told to do arrives here, and nothing here decides
anything. START records a mode, STOP records intent (and, for ``kill``, drops the
marker file the gate reads on every proposal), STEER appends a line to a queue the
driver drains, and the goal routes edit declaration files. Authority itself is
composed in :mod:`policy`; a route that computed a tier would be a second
implementation of the composition formula, which is the one thing :mod:`policy`
exists to prevent.

**This module owns no state that another module already owns.** ``control.json``
and the steer queue belong to :mod:`control`, the loop and its clock belong to
:mod:`loop`, the counters belong to :mod:`budget`, :mod:`breaker` and
:mod:`ledger`. What lives here is the transport, the validation, the audit trail,
and one process-wide holder (:data:`RUNTIME`) for the host handle the gateway
hands us. Two implementations of "what does stopped mean" is how a brake ends up
disagreeing with the thing it brakes.

Three properties are worth stating because they are what make this safe:

* **Every write lands in a file before anything is armed.** The operator's intent
  survives a crash, a restart, and a gateway that never loads this app again —
  ``cat data/conductor/control.json`` answers "is it running, and who said so".
* **STOP does not depend on the driver.** A wedged or missing loop must not be
  able to refuse a brake, so ``kill`` writes the HALT marker *first* and only then
  tries to talk to the driver; when there is no driver at all the verbs are
  applied straight to ``control.json`` through :mod:`control`'s own primitives.
  START is the opposite: it refuses when it cannot arm, because a persisted
  ``running: true`` that nothing honours is a lie the next boot acts on.
* **The loop is optional.** :mod:`loop` is imported behind a guard, so the panel,
  the ledger view and the goal editor keep working on a gateway where the loop
  module is absent or broken — which is also the state an operator is most likely
  to be looking at the panel in.

Status-code convention, following the app's existing house rule (see
``handle_peek`` and ``handle_goal_pass`` in ``backend/routes.py``): malformed
input is 4xx, and a missing *capability* answers 200 with ``available: false``
when the caller can still be told something useful. The two routes that cannot
function without a live loop — ``start`` and ``tick`` — answer 503 with the
reason. ``GET /conductor/state`` deliberately never 503s: it is the surface an
operator opens *because* something is wrong, and a 503 there replaces the
diagnosis with a spinner.
"""

from __future__ import annotations

import asyncio
import contextlib
import logging
import os
import time
from typing import Any, Iterable

logger = logging.getLogger(__name__)

# aiohttp is the app's own dependency rather than a gateway internal, but it is
# still guarded: house rule 6 asks every conductor module to import with nothing
# installed so the offline selftest can exercise it, and a handler that is never
# called does not need the library present in order to have been imported.
try:
    from aiohttp import web
except Exception:  # pragma: no cover - offline selftest
    web = None  # type: ignore[assignment]

from . import breaker, budget, control, goals, ledger, policy, store
from .intents import ACTION_CLASSES, is_hard_denied, spec_for
from .policy import HALT_MARKER, Mode

# The loop is the one sibling that reaches the whole gateway (steps -> observe,
# act, judge), so it is the one that can fail to import on a gateway that moved a
# private symbol. Guarded, and every route degrades to a named 503 rather than a
# stack trace. VERIFIED against loop.py's ``get_driver`` / ``arm`` / ``disarm``.
# Sibling modules are cited by SYMBOL, not by line: they are being written in
# parallel with this one, and a line number that has drifted reads as a
# verification that was never done.
try:
    from . import loop as loop_mod
except Exception:  # pragma: no cover - degraded gateway
    loop_mod = None  # type: ignore[assignment]
    logger.warning("conductor: loop module unavailable; autonomy cannot be armed", exc_info=True)

# judge holds the model handle. The driver binds it too, in its own ``start``,
# but a request can arrive before any driver exists and binding twice is a no-op.
try:
    from . import judge
except Exception:  # pragma: no cover - defensive
    judge = None  # type: ignore[assignment]

# Only for say_in_conductor_chat: planning narrates itself so the operator watches
# it happen in the chat instead of watching a button spin. Guarded because act
# reaches the gateway, and a route layer must not fail to import over narration.
try:
    from . import act as act_mod
except Exception:  # pragma: no cover - defensive
    act_mod = None  # type: ignore[assignment]


def _say(text: str) -> None:
    """Narrate one line into the Conductor chat. Best effort, never fatal."""
    if act_mod is None or RUNTIME.state is None:
        return
    try:
        act_mod.say_in_conductor_chat(RUNTIME.state, text)
    except Exception:
        logger.debug("conductor: could not narrate to the chat", exc_info=True)


# ── bounds ───────────────────────────────────────────────────────────────────

MAX_STEER_CHARS = control.MAX_STEER_CHARS
"""Borrowed rather than re-declared: :func:`control.append_steer` truncates at
its own constant, and a route with a different cap would silently disagree with
the file it writes."""

MAX_STEER_KIND_CHARS = 40
MAX_GOAL_IDS = control.MAX_GOAL_IDS

LEDGER_LIMIT_DEFAULT = 100
LEDGER_LIMIT_MAX = 500

_TRUE_STRINGS: frozenset[str] = frozenset({"1", "true", "yes", "on"})


# ── the driver seam ──────────────────────────────────────────────────────────


class DriverSeam:
    """A guarded handle on :mod:`loop`'s process-wide driver.

    Every call goes through ``getattr`` and returns a reason string instead of
    raising, for the reason house rule 3 gives: this app must keep serving its
    HTTP surface on a gateway where the loop moved, broke, or was never installed.
    The names are not guesses — every one was read out of :mod:`loop` — but the
    indirection is what turns a future rename into a 503 with an explanation
    instead of a 500 with a traceback.

    It deliberately does NOT construct :class:`loop.ConductorDriver` itself.
    ``loop.get_driver`` owns a module-level singleton (VERIFIED: ``loop.DRIVER``)
    and building a second instance here would give the route layer a driver the
    module's own ``arm``/``disarm`` never touch — two clocks, two budgets, one
    ``control.json``.
    """

    # -- construction ------------------------------------------------------

    def get(self, *, state: Any, ctx: Any) -> tuple[Any, str]:
        """``(driver, reason)``. *reason* is non-empty only when there is none."""
        if loop_mod is None:
            return None, "conductor.loop is unavailable on this gateway"
        factory = getattr(loop_mod, "get_driver", None)
        if not callable(factory):
            return None, "conductor.loop has no get_driver()"
        try:
            # Adopts a late-arriving host handle without creating a second
            # driver, whichever of bind_host / a request gets here first
            # (VERIFIED: ``loop.get_driver`` adopts a late state/ctx).
            return factory(state, ctx), ""
        except Exception as exc:
            logger.exception("conductor: get_driver failed")
            return None, f"get_driver raised {exc.__class__.__name__}: {exc}"

    @property
    def driver(self) -> Any:
        return getattr(loop_mod, "DRIVER", None) if loop_mod is not None else None

    @property
    def bound(self) -> bool:
        return self.driver is not None

    @property
    def origin(self) -> str:
        driver = self.driver
        return f"{type(driver).__module__}.{type(driver).__name__}" if driver else ""

    # -- reads -------------------------------------------------------------

    def status(self) -> dict[str, Any]:
        """The driver's in-memory snapshot. Never touches the disk.

        ``status`` is a PROPERTY, not a method (VERIFIED: ``@property`` on
        ``loop.ConductorDriver.status``), and it
        documents itself as the one safe to read from a request handler —
        :meth:`status_async` is the one that stats the ledger. A status route that
        reads 8 MB on every poll is a status route that hangs the dashboard, so
        the split is honoured here rather than flattened.
        """
        driver = self.driver
        if driver is None:
            return {}
        try:
            snapshot = driver.status
        except Exception as exc:
            logger.debug("conductor: driver.status failed", exc_info=True)
            return {"error": f"status raised {exc.__class__.__name__}: {exc}"}
        return snapshot if isinstance(snapshot, dict) else {"status": str(snapshot)}

    async def status_async(self) -> dict[str, Any]:
        """:meth:`status` plus the disk reads, off the loop.

        VERIFIED: ``loop.ConductorDriver.status_async``.
        """
        driver = self.driver
        if driver is None:
            return {}
        method = getattr(driver, "status_async", None)
        if not callable(method):
            return self.status()
        try:
            snapshot = await method()
        except Exception as exc:
            logger.exception("conductor: driver.status_async failed")
            return {**self.status(), "error": f"{exc.__class__.__name__}: {exc}"}
        return snapshot if isinstance(snapshot, dict) else self.status()

    @property
    def armed(self) -> bool:
        """Derived from the driver, never tracked separately.

        A local ``armed`` flag is a second source of truth that drifts the first
        time the loop's task dies on its own; ``status["armed"]`` is the task
        object's real state (VERIFIED: ``status["armed"]`` is derived from the task).
        """
        return bool(self.status().get("armed"))

    # -- writes ------------------------------------------------------------

    async def arm(self, *, state: Any, ctx: Any) -> tuple[bool, Any]:
        """``loop.arm(state, ctx)`` — idempotent, non-blocking, awaits ``start``."""
        if loop_mod is None:
            return False, "conductor.loop is unavailable on this gateway"
        arm = getattr(loop_mod, "arm", None)
        if not callable(arm):
            return False, "conductor.loop has no arm()"
        return await self._guarded(arm(state, ctx), "arm")

    async def stop(self, *, verb: str, confirm: bool, reason: str) -> tuple[bool, Any]:
        """``driver.stop`` — owns its own ``control.json`` writes.

        VERIFIED: ``loop.ConductorDriver.stop(*, verb, confirm, reason)``; it calls
        ``control.stop_receipt``, then ``set_holding`` for ``hold`` or
        ``set_running(False)`` (+ ``rotate_nonce`` for ``kill``), so the route
        must NOT also write those fields — doing both would double-bump the epoch
        and give the operator a receipt describing a state neither wrote.
        """
        driver = self.driver
        if driver is None:
            return False, "no driver is bound"
        method = getattr(driver, "stop", None)
        if not callable(method):
            return False, "the driver has no stop()"
        return await self._guarded(
            method(verb=verb, confirm=confirm, reason=reason), f"stop:{verb}"
        )

    async def tick(self, *, dry_run: bool) -> tuple[bool, Any]:
        """``driver.tick(*, dry_run)`` — single-flight inside the driver."""
        driver = self.driver
        if driver is None:
            return False, "no driver is bound"
        method = getattr(driver, "tick", None)
        if not callable(method):
            return False, "the driver has no tick()"
        return await self._guarded(method(dry_run=dry_run), "tick")

    async def close(self) -> tuple[bool, Any]:
        """``loop.disarm()`` — closes the driver and drops the singleton."""
        if loop_mod is None:
            return False, "conductor.loop is unavailable on this gateway"
        disarm = getattr(loop_mod, "disarm", None)
        if not callable(disarm):
            return False, "conductor.loop has no disarm()"
        return await self._guarded(disarm(), "disarm")

    @staticmethod
    async def _guarded(awaitable: Any, label: str) -> tuple[bool, Any]:
        try:
            result = awaitable
            if asyncio.iscoroutine(result) or asyncio.isfuture(result):
                result = await result
        except asyncio.CancelledError:
            raise
        except Exception as exc:
            logger.exception("conductor: loop.%s failed", label)
            return False, f"{label} raised {exc.__class__.__name__}: {exc}"
        return True, result


# ── the process-wide runtime ─────────────────────────────────────────────────


class ConductorRuntime:
    """The host handle, and a bounded record of everything that degraded.

    This lives in :mod:`conductor.routes` rather than in ``backend/hooks.py`` for
    a module-identity reason that is easy to miss. The gateway loads an installed
    app's hook modules with ``importlib.util.spec_from_file_location`` under
    private ``sys.modules`` keys (VERIFIED: apps/module_loader.py:114,139), so
    ``backend/hooks.py`` reached through the ``on_startup`` manifest hook and
    ``backend/hooks.py`` reached through a sibling import from
    ``backend/routes.py`` are two DIFFERENT module objects with two sets of
    globals — the trap ``apps/lifecycle.py:169-175`` documents for builtins. A
    singleton in either copy would be invisible to the other half of the wiring.
    Both halves import *this* module the same way, so there is one
    :data:`RUNTIME`.

    The DRIVER is not held here: that singleton is ``loop.DRIVER``, reached
    through :class:`DriverSeam`, for the same "one of everything" reason.
    """

    MAX_NOTES = 20

    def __init__(self) -> None:
        self.host_app: Any = None
        self.state: Any = None
        self.ctx: Any = None
        self.seam = DriverSeam()
        self.bound_ts: float = 0.0
        self.notes: list[str] = []
        self._tasks: set[asyncio.Task[Any]] = set()
        self._tick_lock: asyncio.Lock | None = None
        self._resume_attempted: bool = False

    # -- notes -------------------------------------------------------------

    def note(self, text: str, *, level: int = logging.INFO) -> None:
        """Record something the state route should show, and log it once.

        Bounded and de-duplicated: a per-request failure would otherwise grow this
        list without limit and bury the first (usually causal) note.
        """
        if any(existing.endswith(text) for existing in self.notes):
            return
        self.notes.append(f"{time.strftime('%H:%M:%S')} {text}")
        del self.notes[: max(0, len(self.notes) - self.MAX_NOTES)]
        logger.log(level, "crew-manager conductor: %s", text)

    # -- binding -----------------------------------------------------------

    def attach_app(self, app: Any) -> None:
        """Capture the gateway's aiohttp application (the ``bind_host`` path)."""
        self.host_app = app
        state = None
        with contextlib.suppress(Exception):
            state = app.get("state") if hasattr(app, "get") else None
        self.attach_state(state, source="bind_host")

    def attach_state(self, state: Any, *, source: str) -> None:
        """Capture the host handle. Idempotent; called from several paths."""
        if state is None:
            self.note(f"{source}: no host state handle available", level=logging.WARNING)
            return
        if self.state is state:
            return
        self.state = state
        self.bound_ts = time.time()
        self.note(f"host handle bound via {source}")
        if judge is not None:
            try:
                judge.bind(state)
            except Exception:
                self.note("judge.bind failed; LLM subroutines degrade to defaults",
                          level=logging.WARNING)

    def attach_ctx(self, ctx: Any) -> None:
        self.ctx = ctx

    def ensure_resume_attempt(self, source: str) -> bool:
        """Check the operator's persisted intent at most once per process.

        Two callers, one flag. ``bind_host`` is the good path — no browser needed.
        The first authenticated request is the FALLBACK, for a gateway with no
        ``bind_host`` seam: without it, a restart would leave a conductor the
        operator explicitly started dormant until they noticed and pressed START
        again. That is ``watcher.ensure_started``'s lazy arming, reused for the
        same reason.

        Once, because the answer does not change on its own: after this fires,
        arming is an explicit ``POST /conductor/start``. ``on_shutdown`` clears the
        flag, so a disable/re-enable cycle inside one gateway process re-checks —
        route deregistration unloads the app's hook modules but leaves this
        module's globals alone.
        """
        if self._resume_attempted or self.state is None:
            return False
        self._resume_attempted = True
        task = self.spawn(resume_if_running(source=source), label="conductor resume")
        return task is not None

    def reset_resume(self) -> None:
        self._resume_attempted = False

    # -- the driver --------------------------------------------------------

    def ensure_driver(self) -> tuple[Any, str]:
        """``(driver, reason)`` — the driver, creating the singleton if needed."""
        if self.state is None:
            return None, (
                "no host handle: the gateway never called bind_host and no "
                "request has arrived yet"
            )
        driver, reason = self.seam.get(state=self.state, ctx=self.ctx)
        if driver is None:
            self.note(f"driver unavailable — {reason}", level=logging.WARNING)
        return driver, reason

    def unavailable(self, reason: str) -> dict[str, Any]:
        """The 503 body. Says what is missing, not merely that something is."""
        return {
            "available": False,
            "error": "conductor driver unavailable",
            "reason": reason,
            "bound": self.state is not None,
            "driver": self.seam.origin or None,
            "notes": list(self.notes),
        }

    # -- tasks -------------------------------------------------------------

    def spawn(self, coro: Any, *, label: str) -> asyncio.Task[Any] | None:
        """Run *coro* as a supervised task with a strong reference.

        The strong ref is not decoration: a task held only by the event loop can
        be garbage-collected mid-flight, which is the bug ``autonudge.py``'s
        inflight set exists to prevent.
        """
        try:
            running = asyncio.get_running_loop()
        except RuntimeError:
            coro.close()
            self.note(f"{label}: no running event loop", level=logging.WARNING)
            return None
        task = running.create_task(coro)
        self._tasks.add(task)
        task.add_done_callback(self._tasks.discard)
        task.add_done_callback(lambda t, name=label: self._task_done(name, t))
        return task

    def _task_done(self, label: str, task: asyncio.Task[Any]) -> None:
        if task.cancelled():
            return
        error = task.exception()
        if error is not None:
            self.note(f"{label} failed: {error.__class__.__name__}: {error}",
                      level=logging.ERROR)

    async def cancel_tasks(self) -> None:
        tasks, self._tasks = set(self._tasks), set()
        for task in tasks:
            task.cancel()
        for task in tasks:
            with contextlib.suppress(asyncio.CancelledError, Exception):
                await task

    def tick_lock(self) -> asyncio.Lock:
        if self._tick_lock is None:
            self._tick_lock = asyncio.Lock()
        return self._tick_lock

    # -- read model --------------------------------------------------------

    def runtime_json(self) -> dict[str, Any]:
        return {
            "bound": self.state is not None,
            "bound_ts": self.bound_ts or None,
            "host_app": self.host_app is not None,
            "driver": self.seam.origin or None,
            "loop_module": loop_mod is not None,
            "pid": os.getpid(),
            "notes": list(self.notes),
        }


RUNTIME = ConductorRuntime()


# ── arming ───────────────────────────────────────────────────────────────────


async def resume_if_running(*, source: str) -> dict[str, Any]:
    """Arm the loop only if ``control.json`` already says the operator wants it.

    This is the whole of the restart policy, and the default is deliberately "do
    nothing": a gateway boot is not an instruction to act. A conductor that armed
    itself on boot would mean upgrading the gateway silently granted autonomy.

    The ``running`` check belongs HERE rather than in ``loop.start``, and that is
    not a duplicated guard: ``start`` checks ``operator_stopped`` and the foreign
    owner but not ``running``, because it is also the path an
    explicit START uses — which writes ``running: true`` immediately before
    calling it. Arming on a fresh install would give an app nobody started a
    15-second wakeup forever, observing a fleet it will never act on.

    HALT is honoured here as well as in the gate. The gate is the enforcement
    point — ``gate.gate`` re-reads the marker for EVERY proposal, and the guard
    step reads it once per tick — so refusing to arm is merely the cheap one, and
    it keeps the log honest about why nothing is ticking.
    """
    if RUNTIME.seam.armed:
        return {"armed": True, "reason": "already armed"}
    record = await control.load_control_async()
    if not record.running:
        return {"armed": False, "reason": "control.json says running: false"}
    if record.operator_stopped:
        return {"armed": False, "reason": "operator_stopped is set"}
    if await asyncio.to_thread(store.marker_set, HALT_MARKER):
        RUNTIME.note("not arming: HALT marker present", level=logging.WARNING)
        return {"armed": False, "reason": "HALT marker present"}

    driver, reason = RUNTIME.ensure_driver()
    if driver is None:
        return {"armed": False, "reason": reason}
    ok, result = await RUNTIME.seam.arm(state=RUNTIME.state, ctx=RUNTIME.ctx)
    if not ok:
        RUNTIME.note(f"resume failed — {result}", level=logging.ERROR)
        return {"armed": False, "reason": str(result)}
    armed = bool(result.get("armed")) if isinstance(result, dict) else RUNTIME.seam.armed
    if armed:
        RUNTIME.note(f"resumed from control.json in {record.mode} mode ({source})")
    else:
        detail = result.get("reason") if isinstance(result, dict) else ""
        RUNTIME.note(f"loop refused to arm: {detail or 'no reason given'}",
                     level=logging.WARNING)
    return {"armed": armed, "reason": "", "result": _jsonable(result)}


# ── audit ────────────────────────────────────────────────────────────────────


def _sel() -> Any:
    try:
        from kiro_crew.sel import sel
    except Exception:  # pragma: no cover - no gateway
        return None
    try:
        return sel()
    except Exception:  # pragma: no cover - SEL construction failed
        logger.debug("conductor: SEL unavailable", exc_info=True)
        return None


def audit(
    operation: str,
    outcome: str,
    *,
    caller: str,
    resources: str = "",
    error: str = "",
) -> None:
    """Best-effort audit row. Never raises, never blocks a response."""
    handle = _sel()
    if handle is None:
        return
    try:
        handle.log_api_access(
            caller=caller or "unknown",
            operation=operation,
            outcome=outcome,
            source="app:crew-manager",
            resources=resources,
            error=error,
        )
    except Exception:  # pragma: no cover - audit is best-effort here
        logger.debug("conductor: audit write failed for %s", operation, exc_info=True)


async def critical_audit(operation: str, *, caller: str, resources: str) -> str:
    """Audit-or-deny. Returns "" on success, else why the action must refuse.

    Copied from ``autonudge_authz.py:352-378``, including the two details that
    look like paranoia: ``critical=True`` (a synchronous write whose filesystem
    failure re-raises, which is what makes the refusal possible at all —
    sel.py:896-906) and running it in an executor and awaiting it, so the
    audit-before-action ordering is kept while a wedged disk parks this request
    instead of the whole gateway loop.

    A gateway with no reachable SEL refuses too. Arming a conductor is a strictly
    larger grant than arming a nudge loop, and that path already answers 503.
    """
    handle = _sel()
    if handle is None:
        return "security event log unavailable"

    def _write() -> None:
        handle.log_api_access(
            caller=caller or "unknown",
            operation=operation,
            outcome="invoked",
            source="app:crew-manager",
            resources=resources,
            critical=True,
        )

    try:
        await asyncio.get_running_loop().run_in_executor(None, _write)
    except Exception as exc:
        logger.error("conductor: %s denied — SEL audit unavailable", operation, exc_info=True)
        return f"audit log unavailable: {exc.__class__.__name__}"
    return ""


# ── small helpers ────────────────────────────────────────────────────────────


def _json(payload: Any, status: int = 200) -> Any:
    if web is None:  # pragma: no cover - unreachable while serving
        raise RuntimeError("aiohttp is unavailable; conductor routes cannot respond")
    return web.json_response(payload, status=status)


def _unauthorized(request: Any) -> Any:
    """401 unless this request carries a user, per the app-route contract.

    Duplicated from ``backend/routes.py`` rather than imported: that module
    imports this one, and a three-line helper is a better price than a cycle.
    """
    if request.get("user") is None:
        return _json({"error": "unauthorized"}, 401)
    return None


def _caller(request: Any) -> str:
    return str(request.get("user") or "unknown")


def _bind(request: Any, ctx: Any) -> None:
    """Take whatever this request can tell us about the host, then move on.

    Called by every handler that might need the loop. On a gateway with the
    ``bind_host`` seam this is a no-op after the first call; on one without it,
    this is the ONLY way the host handle ever arrives — which is why it also
    triggers the one-shot resume check.
    """
    RUNTIME.attach_ctx(ctx)
    RUNTIME.attach_state(request.app.get("state"), source="request")
    RUNTIME.ensure_resume_attempt("request")


async def _body(request: Any) -> dict[str, Any]:
    try:
        payload = await request.json()
    except Exception:
        return {}
    return payload if isinstance(payload, dict) else {}


def _flag(request: Any, name: str, body: dict[str, Any]) -> bool:
    """A boolean the caller may send as a query string or in the JSON body."""
    raw = request.query.get(name)
    if raw is not None:
        return raw.strip().lower() in _TRUE_STRINGS
    value = body.get(name)
    if isinstance(value, str):
        return value.strip().lower() in _TRUE_STRINGS
    return bool(value)


def _clamp(value: Any, low: int, high: int, fallback: int) -> int:
    try:
        number = int(value)
    except (TypeError, ValueError):
        return fallback
    return max(low, min(high, number))


def _text(value: Any, limit: int) -> str:
    raw = value if isinstance(value, str) else ""
    return raw.strip()[:limit]


def _jsonable(value: Any, *, depth: int = 0) -> Any:
    """Coerce another module's return value into something serializable.

    The tick record and the stop receipt come from :mod:`loop`, whose shapes are
    dicts today. This is the belt: a value that will not serialize becomes its
    ``repr`` rather than a 500 from the response encoder, because a manual tick
    that ran must not report as a server error over the shape of its receipt.
    """
    if value is None or isinstance(value, (bool, int, float, str)):
        return value
    if depth > 4:
        return repr(value)[:400]
    for method in ("to_json", "to_dict"):
        function = getattr(value, method, None)
        if callable(function):
            try:
                return _jsonable(function(), depth=depth + 1)
            except Exception:
                break
    if isinstance(value, dict):
        return {str(k): _jsonable(v, depth=depth + 1) for k, v in list(value.items())[:200]}
    if isinstance(value, (list, tuple, set, frozenset)):
        return [_jsonable(v, depth=depth + 1) for v in list(value)[:200]]
    if hasattr(value, "__dict__"):
        return {
            str(k): _jsonable(v, depth=depth + 1)
            for k, v in list(vars(value).items())[:200]
            if not str(k).startswith("_")
        }
    return repr(value)[:400]


def _workers_for(goal_id: str) -> list[dict[str, Any]]:
    """The live worker sessions for one goal, for the panel's remove buttons.

    Read from the gateway rather than the goal file: the operator's question is
    "what sessions exist for this?", which is about the registry — a leaf that was
    never dispatched has no slot, and a slot whose leaf was deleted still does. Best
    effort, because a panel poll must not fail on a missing gateway.
    """
    state = RUNTIME.state
    if state is None or act_mod is None:
        return []
    try:
        return act_mod.worker_slots(state, goal_id)
    except Exception:
        logger.debug("conductor: could not list workers for %s", goal_id, exc_info=True)
        return []


def _goal_row(goal: goals.Goal) -> dict[str, Any]:
    """One goal as the panel needs it, and never a predicate evaluation.

    ``evaluate_done_when`` globs and reads files; running it per goal on a poll
    would put I9 back in the read path. It also needs a filesystem root that
    nothing yet resolves from ``goal.scope`` — inventing a resolver here would put
    the meaning of "done" in the transport layer. So this reports the status the
    tick wrote plus :func:`goals.dispatchable`, which is pure and always carries
    its reason.
    """
    can, why = goals.dispatchable(goal)
    leaves = goal.leaves or []
    closed = sum(1 for leaf in leaves if leaf.get("status") in goals.CLOSED_LEAF_STATUSES)
    return {
        "id": goal.id,
        "title": goal.title,
        "statement": goal.statement,
        "status": goal.status,
        "dispatchable": can,
        "why": why,
        "done_when": list(goal.done_when),
        "leaves": {"total": len(leaves), "closed": closed},
        # The live worker sessions, so the panel can show them and offer a Remove.
        # Nothing could remove a session before this: they were visible and, once
        # their goal was gone, unaddressable.
        "workers": _workers_for(goal.id),
        # The editable detail, so the panel can show a draft's plan and let the
        # operator change it before activating. Summary counts alone forced an
        # operator to accept a decomposition sight-unseen or retype it.
        # ``intent_text`` is the brief a worker will actually receive, so it is the
        # one field that has to round-trip exactly.
        "leaf_rows": [
            {
                "id": str(leaf.get("id") or ""),
                "title": str(leaf.get("title") or ""),
                "intent_text": str(leaf.get("intent_text") or ""),
                "depends_on": [str(d) for d in (leaf.get("depends_on") or [])],
                "status": str(leaf.get("status") or ""),
                "produces": next(
                    (
                        str(entry.get("path") or "")
                        for entry in (leaf.get("done_when") or [])
                        if isinstance(entry, dict) and entry.get("kind") == "file_exists"
                    ),
                    "",
                ),
            }
            for leaf in leaves
        ],
        "authority_act": sorted(
            name for name, tier in (goal.authority or {}).items() if tier == "act"
        ),
        "budgets": dict(goal.budgets),
        "scope": dict(goal.scope),
        "guidance_count": len(goal.guidance or []),
        "paused_reason": goal.paused_reason,
        "terminal_reason": goal.terminal_reason,
        "activated_ts": goal.activated_ts or None,
        "created_ts": goal.created_ts,
        "updated_ts": goal.updated_ts,
        "notes": goal.notes,
    }


def _goals_summary(rows: Iterable[dict[str, Any]]) -> dict[str, Any]:
    counts: dict[str, int] = {}
    dispatchable = 0
    for row in rows:
        status = str(row.get("status"))
        counts[status] = counts.get(status, 0) + 1
        if row.get("dispatchable"):
            dispatchable += 1
    return {"by_status": counts, "dispatchable": dispatchable, "total": sum(counts.values())}


async def _markers_async() -> dict[str, Any]:
    """HALT plus every per-class disable marker, in one thread hop."""

    def _read() -> dict[str, Any]:
        return {
            "halted": store.marker_set(HALT_MARKER),
            "halt_path": str(store.marker_path(HALT_MARKER)),
            "disabled_classes": [
                name for name in sorted(ACTION_CLASSES)
                if store.marker_set(policy.marker_name(name))
            ],
        }

    return await asyncio.to_thread(_read)


# ── handlers ─────────────────────────────────────────────────────────────────


async def handle_state(request: Any, ctx: Any) -> Any:
    """GET /conductor/state — what the panel and a worried operator both need.

    200 even when nothing is armed: this is the diagnosis surface, and
    ``available: false`` plus ``notes`` says WHICH part is missing.

    Cheap by default. The driver's ``status`` property is pure memory by contract
    (its own docstring says so); ``?stats=1`` swaps in ``status_async``, which stats the
    ledger — right for a button, wrong for a poll.
    """
    denied = _unauthorized(request)
    if denied is not None:
        return denied
    _bind(request, ctx)

    record = await control.load_control_async()
    markers = await _markers_async()
    goal_list = await goals.load_goals_async()
    rows = [_goal_row(goal) for goal in goal_list]

    try:
        breakers = await breaker.all_states_async()
    except Exception:
        logger.debug("conductor: breaker states unreadable", exc_info=True)
        breakers = []

    # A transient read-only Budget: ``snapshot`` loads and prunes in memory and
    # never writes (``Budget.snapshot``), so it cannot race the driver's instance,
    # which stays the only writer.
    try:
        budget_snapshot = await budget.Budget().snapshot_async()
    except Exception:
        logger.debug("conductor: budget snapshot unreadable", exc_info=True)
        budget_snapshot = {}

    now = time.time()
    heartbeat = record.heartbeat_ts or 0.0
    payload: dict[str, Any] = {
        "available": RUNTIME.seam.bound,
        "armed": RUNTIME.seam.armed,
        "mode": record.mode,
        "modes": [mode.value for mode in Mode],
        "running": record.running,
        "holding": record.holding,
        "operator_stopped": record.operator_stopped,
        "auto_stopped": record.auto_stopped,
        "dispatching": record.dispatching(),
        # One implementation of "why is nothing happening", shared with the guard
        # step and the start path (``Control.blocking_reason``).
        "blocking_reason": record.blocking_reason(),
        "epoch": record.epoch,
        "goal_ids": list(record.goal_ids),
        "started_by": record.started_by,
        "started_ts": record.started_ts or None,
        "paused_reason": record.paused_reason,
        "stopped_reason": record.stopped_reason,
        "heartbeat_ts": heartbeat or None,
        "heartbeat_age_secs": int(now - heartbeat) if heartbeat else None,
        "heartbeat_stale": bool(heartbeat) and (now - heartbeat) > control.HEARTBEAT_STALE_SECS,
        "heartbeat_stale_secs": control.HEARTBEAT_STALE_SECS,
        "planner_timeout_secs": record.planner_timeout_secs,
        "planner_timeout_bounds": [
            control.MIN_PLANNER_TIMEOUT_SECS, control.MAX_PLANNER_TIMEOUT_SECS,
        ],
        "owner_pid": record.pid or None,
        "owner_is_this_process": bool(record.pid) and record.pid == os.getpid(),
        # A second gateway on this host holding the record: the reason a START
        # here would refuse to tick (``control.foreign_owner``).
        "foreign_owner": control.foreign_owner(record),
        "last_tick_ts": record.last_tick_ts or None,
        "tick_stats": dict(record.stats),
        "goals": rows,
        "goals_summary": _goals_summary(rows),
        "breakers": breakers,
        "budget": budget_snapshot,
        "steer_pending": await control.pending_steer_count_async(),
        "directives": sorted(control.DIRECTIVES),
        "runtime": RUNTIME.runtime_json(),
        "paths": {
            "conductor_dir": str(store.conductor_dir()),
            "control": str(control.control_path()),
            "steer": str(control.steer_path()),
        },
        **markers,
    }
    if RUNTIME.seam.bound:
        deep = _flag(request, "stats", {})
        driver_state = await RUNTIME.seam.status_async() if deep else RUNTIME.seam.status()
        payload["driver_state"] = _jsonable(driver_state)
        payload["last_tick"] = driver_state.get("last_tick")
    return _json(payload)


async def handle_start(request: Any, ctx: Any) -> Any:
    """POST /conductor/start {mode, goal_ids?, clear_halt?} — arm the loop.

    Order is load-bearing and is the plan's: validate, audit CRITICALLY, write
    ``control.json``, then arm. The audit precedes the grant so an unauditable
    start is denied rather than performed silently; the file precedes the arming
    because ``loop.start`` reads it — the mode and the goal set are not arguments
    to the driver, they are the record it obeys (VERIFIED: ``loop.ConductorDriver.start``
    takes no parameters at all).

    Idempotent, because the operator will double-click:
    :func:`control.set_running` re-asserts rather than failing, and ``changed``
    reports whether this call was the one that moved anything.

    HALT refuses the start instead of clearing it. A brake somebody set out of
    band is not a thing a START may silently undo; ``clear_halt: true`` is the
    explicit, audited way to say "I know, remove it".
    """
    denied = _unauthorized(request)
    if denied is not None:
        return denied
    _bind(request, ctx)

    body = await _body(request)
    caller = _caller(request)

    raw_mode = body.get("mode", Mode.ADVISORY.value)
    try:
        mode = Mode(str(raw_mode))
    except ValueError:
        return _json(
            {"error": "unknown mode", "mode": str(raw_mode),
             "modes": [m.value for m in Mode]},
            400,
        )

    raw_goal_ids = body.get("goal_ids")
    if raw_goal_ids is not None and not isinstance(raw_goal_ids, list):
        return _json({"error": "goal_ids must be a list"}, 400)
    goal_ids, unknown = await _resolve_goal_ids(raw_goal_ids)
    if unknown:
        return _json({"error": "unknown goal ids", "unknown": unknown}, 400)

    markers = await _markers_async()
    if markers["halted"]:
        if not _flag(request, "clear_halt", body):
            return _json(
                {
                    "error": "halted",
                    "reason": "the HALT marker is set; autonomy is refused at the gate",
                    "halt_path": markers["halt_path"],
                    "confirm_required": "clear_halt",
                },
                409,
            )
        await asyncio.to_thread(store.marker_clear, HALT_MARKER)
        audit("conductor.halt_clear", "ok", caller=caller, resources=markers["halt_path"])
        RUNTIME.note(f"HALT cleared by {caller} on start")

    before = await control.load_control_async()
    foreign = control.foreign_owner(before)
    if foreign:
        # Refuse rather than claim: two conductors on one host is the case fcntl
        # cannot see, and the loser would spend the night explaining the winner's
        # turns as unexplained motion.
        return _json({"error": "another conductor owns this state directory",
                      "reason": foreign}, 409)

    driver, reason = RUNTIME.ensure_driver()
    if driver is None:
        # Refuse BEFORE writing running: true. A persisted "running" that nothing
        # honours is worse than a refusal — the next boot's resume path believes it.
        return _json(RUNTIME.unavailable(reason), 503)

    problem = await critical_audit(
        "conductor.start",
        caller=caller,
        resources=f"mode={mode.value} goals={','.join(goal_ids) or 'all'}",
    )
    if problem:
        return _json(
            {"error": "audit log unavailable — conductor not started", "reason": problem},
            503,
        )

    record = await control.set_running_async(
        True, mode=mode, goal_ids=goal_ids, started_by=caller
    )
    ok, result = await RUNTIME.seam.arm(state=RUNTIME.state, ctx=RUNTIME.ctx)
    armed = bool(result.get("armed")) if ok and isinstance(result, dict) else False
    if not ok or not armed:
        # Roll the intent back: the operator asked for autonomy, it could not be
        # armed, and leaving running: true would arm it on the next boot instead.
        # ``operator=False`` because this was the machine failing, not a human
        # stopping — an operator_stopped here would need a second START to clear
        # a flag the operator never set (``control.set_running``'s ``operator`` arg).
        detail = str(result.get("reason") if isinstance(result, dict) else result)
        await control.set_running_async(
            False, reason=f"arm_failed: {detail}"[: control.MAX_REASON_CHARS], operator=False
        )
        audit("conductor.start", "failed", caller=caller, resources=mode.value, error=detail)
        return _json(RUNTIME.unavailable(detail), 503)

    audit("conductor.start", "ok", caller=caller,
          resources=f"mode={mode.value} epoch={record.epoch}")
    RUNTIME.note(f"started in {mode.value} mode by {caller} (epoch {record.epoch})")
    return _json({
        "ok": True,
        "changed": not (before.running and not before.holding and before.mode == mode.value),
        "mode": record.mode,
        "epoch": record.epoch,
        "goal_ids": list(record.goal_ids),
        "driver": RUNTIME.seam.origin,
        "result": _jsonable(result),
    })


async def handle_stop(request: Any, ctx: Any) -> Any:
    """POST /conductor/stop {verb: "drain"|"hold"|"kill", confirm?, reason?}.

    Three verbs because pause and cancel are different operations, and conflating
    them is how partial state gets orphaned:

    * ``drain`` — stop starting things. ``running: false``, epoch bumped. The
      observe cadence keeps running so the operator still has a board, and
      in-flight work finishes and writes its outcome.
    * ``hold`` — stop dispatching, keep the run. Goals stay ``active`` with an
      explicit ``paused_reason``, so a later budget raise cannot silently resume
      work a human paused.
    * ``kill`` — drain, plus the HALT marker, plus a rotated capability nonce so a
      task already past the gate fails closed on its next write, plus a hard stop
      of turns on driver-created slots. Needs ``confirm: true``.

    This route never depends on the driver. The HALT marker is written FIRST —
    before any await that could fail — because from that moment ``steps.guard``
    refuses every proposal, including ones this tick already composed. When a
    driver IS bound it owns the ``control.json`` transitions (``loop...stop`` calls
    ``set_holding`` / ``set_running`` / ``rotate_nonce`` itself), so
    this handler does not also write them; when there is none, the same
    :mod:`control` primitives are applied here. A brake a wedged loop can refuse
    is not a brake.
    """
    denied = _unauthorized(request)
    if denied is not None:
        return denied
    _bind(request, ctx)

    body = await _body(request)
    caller = _caller(request)
    verb = _text(body.get("verb"), 16).lower()
    if verb not in control.STOP_VERBS:
        return _json(
            {"error": "unknown verb", "verb": verb, "verbs": sorted(control.STOP_VERBS)},
            400,
        )
    confirm = _flag(request, "confirm", body)
    allowed, why = control.stop_receipt(verb, confirmed=confirm)
    if not allowed:
        return _json({"error": "confirmation required", "reason": why,
                      "confirm_required": "confirm"}, 409)

    reason = _text(body.get("reason"), control.MAX_REASON_CHARS)
    receipt: dict[str, Any] = {"ok": True, "verb": verb}

    if verb == "kill":
        await asyncio.to_thread(
            store.marker_create, HALT_MARKER,
            f"kill by {caller} at {int(time.time())}: {reason}\n",
        )
        receipt["halt_path"] = str(store.marker_path(HALT_MARKER))

    if RUNTIME.seam.bound:
        ok, result = await RUNTIME.seam.stop(verb=verb, confirm=confirm, reason=reason)
        receipt["driver_effect"] = _jsonable(result) if ok else {"error": str(result)}
        # ``stopped: False`` is the driver declining (its own ``stop_receipt``),
        # which this route's identical pre-check should have made unreachable.
        # Treated as a failure anyway: a STOP that returns 200 while nothing
        # stopped is the single worst outcome this handler has.
        declined = ok and isinstance(result, dict) and result.get("stopped") is False
        if not ok or declined:
            RUNTIME.note(f"{verb}: the driver did not co-operate — {result}",
                         level=logging.WARNING)
            await _stop_without_driver(verb, reason=reason, caller=caller)
    else:
        await _stop_without_driver(verb, reason=reason, caller=caller)
        receipt["driver_effect"] = {
            "note": "no driver bound; control.json and the markers are authoritative"
        }

    record = await control.load_control_async()
    receipt.update(
        running=record.running,
        holding=record.holding,
        operator_stopped=record.operator_stopped,
        epoch=record.epoch,
        mode=record.mode,
        blocking_reason=record.blocking_reason(),
    )
    audit(f"conductor.{verb}", "ok", caller=caller, resources=f"epoch={record.epoch}")
    RUNTIME.note(f"{verb} by {caller} (epoch {record.epoch})")
    return _json(receipt)


async def _stop_without_driver(verb: str, *, reason: str, caller: str) -> None:
    """Apply a stop verb straight to ``control.json``.

    The fallback for "no driver, or a driver that raised inside ``stop``". It uses
    :mod:`control`'s own primitives rather than writing fields, so the flag
    semantics (which stop clears what) live in exactly one module. Idempotent, so
    running it after a partially-successful ``driver.stop`` cannot corrupt
    anything — it re-asserts the same terminal state.
    """
    if verb == "hold":
        await control.set_holding_async(True, reason=reason or f"held by {caller}")
        return
    await control.set_running_async(
        False, reason=reason or f"conductor_{verb}", operator=True
    )
    if verb == "kill":
        await control.rotate_nonce_async("kill")


async def handle_steer(request: Any, ctx: Any) -> Any:
    """POST /conductor/steer {text, kind?, goal_id?, intent_id?} — append a steer.

    The line lands in ``steer.jsonl`` and the driver is woken so it deliberates
    within about a second instead of waiting out its 60s cadence. The *next* tick
    consumes it: interrupting a tick in progress re-enters half-finished steps,
    and a tick is short.

    The route classifies nothing. A steer is prose until :func:`control.parse_steer`
    recognises a directive in it, and that split is the security boundary the plan
    draws: putting the closed directive set — the thing that can change policy — in
    the transport layer would separate it from the module that also decides what a
    directive is allowed to do. "Just merge it already" parses as guidance and
    changes wording, never authority.
    """
    denied = _unauthorized(request)
    if denied is not None:
        return denied
    _bind(request, ctx)

    body = await _body(request)
    text = _text(body.get("text"), MAX_STEER_CHARS)
    kind = _text(body.get("kind"), MAX_STEER_KIND_CHARS).lower()
    if not text and not kind:
        return _json({"error": "text is required"}, 400)
    if kind and kind not in control.DIRECTIVES:
        # Named-but-unknown is a typo, and a typo that became guidance would look
        # like it had been accepted as a directive. Free text still needs no kind.
        return _json({"error": "unknown directive", "kind": kind,
                      "directives": sorted(control.DIRECTIVES)}, 400)

    goal_id = _text(body.get("goal_id"), 64).lower()
    if goal_id and goals.goal_path(goal_id) is None:
        return _json({"error": "invalid goal id", "goal_id": goal_id}, 400)

    record = await control.load_control_async()
    steer = await control.append_steer_async(
        text,
        kind=kind,
        goal_id=goal_id,
        intent_id=_text(body.get("intent_id"), 64),
        actor=_caller(request),
        epoch=record.epoch,
    )
    parsed_kind, _args = control.parse_steer(steer)
    audit("conductor.steer", "ok", caller=str(steer.get("actor")),
          resources=f"goal={goal_id or '-'} kind={parsed_kind}")
    return _json({
        "ok": True,
        "queued": True,
        "parsed_kind": parsed_kind,
        "is_directive": parsed_kind != control.GUIDANCE_KIND,
        "woke_driver": control.signal_steer(),
        "pending": await control.pending_steer_count_async(),
        "steer": steer,
        "path": str(control.steer_path()),
    })


async def handle_tick(request: Any, ctx: Any) -> Any:
    """POST /conductor/tick?dry_run=1 — run exactly one tick and return it.

    The whole point of factoring ``tick()`` out of the sleep loop (batty's
    ``daemon/poll.rs:246``, and the reason its comment gives) is that it can be
    called once, from here or from a test, and hand back the record it produced.
    In ``advisory`` mode that record IS the product: the ledger's ``would_do``
    rows are what the operator reads before granting anything.

    ``dry_run`` forces a deliberate pass, runs every proposal through the real
    gate, records them, and calls nothing in :mod:`act` — the downgrade happens
    in the gate, at the one place that can stamp ``ACT`` (``loop...tick``'s docstring).

    A second concurrent tick answers 409 rather than queueing. The driver is
    already single-flight (its own ``_tick_lock``), so this is about the REQUEST: two clicks
    should not leave one browser waiting out someone else's tick.
    """
    denied = _unauthorized(request)
    if denied is not None:
        return denied
    _bind(request, ctx)

    body = await _body(request)
    dry_run = _flag(request, "dry_run", body)

    driver, reason = RUNTIME.ensure_driver()
    if driver is None:
        return _json(RUNTIME.unavailable(reason), 503)

    lock = RUNTIME.tick_lock()
    if lock.locked():
        return _json({"error": "a tick is already running", "retry": True}, 409)

    caller = _caller(request)
    async with lock:
        started = time.time()
        ok, result = await RUNTIME.seam.tick(dry_run=dry_run)
        elapsed = time.time() - started
    if not ok:
        audit("conductor.tick", "failed", caller=caller,
              resources=f"dry_run={dry_run}", error=str(result))
        return _json(RUNTIME.unavailable(str(result)), 503)

    audit("conductor.tick", "ok", caller=caller, resources=f"dry_run={dry_run}")
    return _json({
        "ok": True,
        "dry_run": dry_run,
        "elapsed_secs": round(elapsed, 3),
        "record": _jsonable(result),
    })


async def handle_ledger(request: Any, ctx: Any) -> Any:
    """GET /conductor/ledger?limit=&goal=&stats=1 — recent rows, oldest first.

    Reads only the live generation. A rotated file is forensics, and making the
    default view's row count depend on how recently rotation happened would make
    it jump around for no reason the operator can see.
    """
    denied = _unauthorized(request)
    if denied is not None:
        return denied
    limit = _clamp(request.query.get("limit"), 1, LEDGER_LIMIT_MAX, LEDGER_LIMIT_DEFAULT)
    goal_id = _text(request.query.get("goal"), 64).lower()
    try:
        rows = await ledger.tail_async(limit, goal_id=goal_id)
    except Exception:
        logger.exception("conductor: ledger read failed")
        return _json({"available": False, "reason": "the ledger could not be read",
                      "rows": []})
    payload: dict[str, Any] = {
        "available": True,
        "rows": rows,
        "limit": limit,
        "goal_id": goal_id,
        "path": str(ledger.ledger_path()),
    }
    if _flag(request, "stats", {}):
        try:
            payload["stats"] = await ledger.stats_async()
        except Exception:
            logger.debug("conductor: ledger stats unreadable", exc_info=True)
    return _json(payload)


async def handle_goals(request: Any, ctx: Any) -> Any:
    """GET /conductor/goals — every readable goal, oldest first.

    A goal that will not parse is skipped by :func:`goals.load_goals` with a
    warning rather than failing the list, which is the whole argument for one file
    per goal: the operator loses the goal they broke, not the Conductor.
    """
    denied = _unauthorized(request)
    if denied is not None:
        return denied
    goal_list = await goals.load_goals_async()
    rows = [_goal_row(goal) for goal in goal_list]
    return _json({
        "goals": rows,
        "summary": _goals_summary(rows),
        "statuses": [status.value for status in goals.GoalStatus],
        "done_when_kinds": sorted(goals.DONE_WHEN_KINDS),
        "operator_only_statuses": sorted(goals.OPERATOR_ONLY_STATUSES),
        "action_classes": sorted(ACTION_CLASSES),
        "path": str(goals.goals_dir()),
    })


async def handle_declare_goal(request: Any, ctx: Any) -> Any:
    """POST /conductor/goals {title, statement, done_when, ...} — declare a goal.

    "Declare", not merely "create": posting an ``id`` that already exists merges
    the named fields onto the stored goal. That makes the route idempotent (a
    retried request cannot mint a second copy of the same goal) and it is the only
    way the operator can move a goal into ``active``, ``holding``, ``done`` or
    ``abandoned`` — the transitions the plan reserves for a human and
    ``goals.OPERATOR_ONLY_STATUSES`` names. Fields the request does not name are
    preserved, so an activation cannot quietly drop the guidance history.

    ``activated_ts`` is stamped on the first move to ``active`` and never
    restamped. It anchors ``wall_clock_secs``, and a budget whose clock restarts
    on every resume is a suggestion rather than a ceiling.

    Create-and-save runs in one thread hop: ``mint_goal_id`` does up to four
    ``stat`` calls and ``save_goal`` fsyncs, neither of which belongs on the loop.
    """
    denied = _unauthorized(request)
    if denied is not None:
        return denied
    body = await _body(request)
    caller = _caller(request)

    goal_id = _text(body.get("id"), 64).lower()
    if goal_id and goals.goal_path(goal_id) is None:
        return _json({"error": "invalid goal id", "id": goal_id}, 400)

    status = body.get("status")
    if status is not None and status not in {s.value for s in goals.GoalStatus}:
        return _json(
            {"error": "unknown status", "status": status,
             "statuses": [s.value for s in goals.GoalStatus]},
            400,
        )

    try:
        goal, created = await asyncio.to_thread(_declare, goal_id, body)
    except (ValueError, TypeError) as error:
        return _json({"error": str(error)}, 400)
    except OSError:
        logger.exception("conductor: could not write goal %s", goal_id or "(new)")
        return _json({"error": "could not write the goal file"}, 500)

    audit("conductor.goal_declare", "ok", caller=caller,
          resources=f"goal={goal.id} status={goal.status} created={created}")
    return _json({"ok": True, "created": created, "goal": _goal_row(goal)})


#: Declaration fields the route will copy onto an existing goal. ``id``,
#: ``created_ts`` and ``updated_ts`` are absent on purpose: identity and
#: provenance are not the caller's to rewrite.
_DECLARABLE: tuple[str, ...] = (
    "title", "statement", "done_when", "authority", "scope", "budgets",
    "leaves", "status", "notes", "cadence", "paused_reason", "terminal_reason",
    "guidance",
)


def _declare(goal_id: str, body: dict[str, Any]) -> tuple[goals.Goal, bool]:
    """Create or amend one goal, validate it, write it. Blocking by design."""
    existing = goals.get_goal(goal_id) if goal_id else None
    fields = {key: body[key] for key in _DECLARABLE if key in body}

    if existing is None:
        title = fields.pop("title", "")
        goal = goals.new_goal(
            str(title or ""),
            str(fields.pop("statement", "") or ""),
            fields.pop("done_when", None),
            **({"id": goal_id} if goal_id else {}),
            **fields,
        )
        created = True
    else:
        # ``from_json`` is per-field fail-open, so a rejected value would be
        # silently replaced by a default. Validate the CALLER's fields explicitly
        # first, so a bad predicate is a 400 with a reason rather than a quiet
        # no-op the operator only notices when the goal never finishes.
        for key, validator in (
            ("done_when", goals.validate_done_when),
            ("authority", goals.validate_authority),
            ("leaves", goals.validate_leaves),
        ):
            if key in fields:
                ok, errors = validator(fields[key])
                if not ok:
                    raise ValueError("; ".join(errors))
        goal = goals.Goal.from_json({**existing.to_json(), **fields}, goal_id=existing.id)
        if goal is None:  # pragma: no cover - the id already round-tripped once
            raise ValueError("the amended goal could not be read back")
        created = False

    if goal.status == goals.GoalStatus.ACTIVE.value and not goal.activated_ts:
        goal.activated_ts = time.time()
    goals.save_goal(goal)
    return goal, created


async def handle_remove_goal(request: Any, ctx: Any) -> Any:
    """POST /conductor/goals/remove {id, force?} — delete a goal AND its workers.

    An unknown id is a no-op rather than a 404: the operator's intent ("this goal
    should not exist") is already satisfied, and a retried delete should not become
    an error the UI has to explain.

    **The workers go with it.** A worker slot is named ``cm-<goal>-<leaf>``, so a
    goal deleted on its own left sessions nothing in the panel could address again —
    visible, orphaned, and unremovable. Deleting the goal first and the workers
    second is deliberate order: if this call dies in between, the leftovers are
    orphans that :func:`steps.reap_orphan_workers` collects on the next tick, whereas
    the reverse order would leave a goal whose workers had silently vanished.

    Refuses with 409 while a worker is mid-turn unless ``force``. Removing a goal
    should not kill a running turn as an invisible side effect — the panel asks, and
    passes ``force`` once the operator has seen the count.
    """
    denied = _unauthorized(request)
    if denied is not None:
        return denied
    _bind(request, ctx)
    body = await _body(request)
    goal_id = _text(body.get("id"), 64).lower()
    if not goal_id:
        return _json({"error": "id is required"}, 400)
    if goals.goal_path(goal_id) is None:
        return _json({"error": "invalid goal id", "id": goal_id}, 400)
    caller = _caller(request)
    force = _flag(request, "force", body)

    workers: dict[str, Any] = {"removed": [], "archived": []}
    state = RUNTIME.state
    if state is not None and act_mod is not None:
        probe = await asyncio.to_thread(
            act_mod.remove_worker_slots, state, goal_id=goal_id, force=force
        )
        if not probe.get("ok"):
            audit("conductor.goal_remove", "refused", caller=caller,
                  resources=f"goal={goal_id} {probe.get('refused')}")
            return _json(
                {"ok": False, "error": probe.get("refused"),
                 "running": probe.get("running") or [],
                 "confirm_required": "force"},
                409,
            )
        workers = probe

    await goals.delete_goal_async(goal_id)
    audit(
        "conductor.goal_remove", "ok", caller=caller,
        resources=f"goal={goal_id} workers={len(workers.get('removed') or [])}",
    )
    await ledger.record_event_async(
        action_class="goal_remove", goal_id=goal_id, outcome="success", resource=goal_id,
        detail=f"removed the goal and {len(workers.get('removed') or [])} worker session(s)"
               + ("; forced past a running turn" if workers.get("forced") else ""),
        user_id=caller,
    )
    return _json({
        "ok": True, "id": goal_id,
        "workers_removed": workers.get("removed") or [],
        "archived": workers.get("archived") or [],
    })


async def handle_remove_session(request: Any, ctx: Any) -> Any:
    """POST /conductor/sessions/remove {slot, force?} — retire ONE worker session.

    The tool that was missing. Everything else in the panel could create a session
    and nothing could remove one, so a worker whose goal had gone stayed on the board
    for good. Only names this app minted are eligible; a session the operator opened
    themselves is closed from the dashboard, not from here.
    """
    denied = _unauthorized(request)
    if denied is not None:
        return denied
    _bind(request, ctx)
    body = await _body(request)
    slot = _text(body.get("slot"), 200)
    if not slot:
        return _json({"error": "slot is required"}, 400)
    state = RUNTIME.state
    if state is None or act_mod is None:
        return _json(RUNTIME.unavailable("no gateway state"), 503)
    result = await asyncio.to_thread(
        act_mod.remove_worker_slots, state, slot=slot,
        force=_flag(request, "force", body),
    )
    caller = _caller(request)
    if not result.get("ok"):
        audit("conductor.session_remove", "refused", caller=caller,
              resources=f"slot={slot} {result.get('refused')}")
        return _json({"ok": False, "error": result.get("refused"),
                      "confirm_required": "force"}, 409)
    audit("conductor.session_remove", "ok", caller=caller, resources=f"slot={slot}")
    return _json(result)


async def handle_clear_chat(request: Any, ctx: Any) -> Any:
    """POST /conductor/chat/clear — empty the Conductor chat, context included.

    Two halves, and doing one without the other is worse than doing neither: the
    visible rows, and the agent's memory of them. See
    :func:`act.clear_conductor_chat`, which owns the ordering.

    Audited like any other operator action. The transcript is renamed aside rather
    than deleted, and the response says where — a demo reset should not be the one
    irreversible button in the panel.
    """
    denied = _unauthorized(request)
    if denied is not None:
        return denied
    _bind(request, ctx)
    caller = _caller(request)

    state = RUNTIME.state
    if state is None:
        return _json(RUNTIME.unavailable("no gateway state"), 503)
    if act_mod is None:
        return _json({"error": "the executor is unavailable"}, 503)

    result = await asyncio.to_thread(act_mod.clear_conductor_chat, state)
    if not result.get("ok"):
        audit("conductor.chat_clear", "refused", caller=caller,
              resources=str(result.get("refused") or ""))
        return _json({"ok": False, "error": result.get("refused") or "refused"}, 409)

    audit(
        "conductor.chat_clear", "ok", caller=caller,
        resources=f"rows={result.get('rows_cleared')} context={result.get('context_cleared')}",
    )
    await ledger.record_event_async(
        action_class="chat_clear", goal_id="", outcome="success", resource=act_mod.CONDUCTOR_SLOT,
        detail=f"cleared {result.get('rows_cleared')} row(s) and "
               f"{result.get('context_cleared')} queued context entr(ies)"
               + (f"; archived to {result.get('archived_to')}" if result.get("archived_to") else ""),
        user_id=caller,
    )
    return _json(result)


async def handle_clear_events(request: Any, ctx: Any) -> Any:
    """POST /conductor/events/clear {force?} — start a fresh event ledger.

    Rolls the live ledger into ``ledger.jsonl.1`` using the module's own rotation, so
    the pane empties and every row stays queryable in the generations. Deliberately
    NOT a delete: the ledger is the audit trail, and "clear the view" and "destroy
    the record" are different requests.

    Refuses with 409 while an action has no recorded outcome — those rows are what
    reconcile closes the crash window with. See :func:`ledger.rotate_now`.
    """
    denied = _unauthorized(request)
    if denied is not None:
        return denied
    _bind(request, ctx)
    body = await _body(request)
    caller = _caller(request)
    result = await ledger.rotate_now_async(force=_flag(request, "force", body))
    if not result.get("ok"):
        audit("conductor.events_clear", "refused", caller=caller,
              resources=str(result.get("refused") or ""))
        return _json({"ok": False, "error": result.get("refused"),
                      "open_intents": result.get("open_intents") or [],
                      "confirm_required": "force"}, 409)
    audit("conductor.events_clear", "ok", caller=caller,
          resources=f"rows={result.get('rows_cleared')}")
    # Written AFTER the roll, so the new ledger opens with the reason it is empty
    # rather than with no explanation at all.
    await ledger.record_event_async(
        action_class="events_clear", goal_id="", outcome="success", resource="ledger",
        detail=f"cleared {result.get('rows_cleared')} row(s); previous events kept in "
               f"{result.get('rotated_to') or 'no earlier file'}"
               + ("; forced past unreconciled action(s)" if result.get("forced") else ""),
        user_id=caller,
    )
    return _json(result)


async def handle_settings(request: Any, ctx: Any) -> Any:
    """POST /conductor/settings {planner_timeout_secs} — operator preferences.

    Deliberately separate from START/STOP: this changes how the Conductor behaves,
    not whether it is running, and an operator raising a planning ceiling should
    not have to stop autonomy to do it. Values are clamped rather than rejected —
    a typo becomes the nearest usable number and the response says what was stored,
    because the alternative is a form that refuses and explains nothing.
    """
    denied = _unauthorized(request)
    if denied is not None:
        return denied
    body = await _body(request)
    changed: dict[str, Any] = {}

    if "planner_timeout_secs" in body:
        wanted = control._clamp_planner_timeout(body.get("planner_timeout_secs"))
        ctl = await control.load_control_async()
        ctl.planner_timeout_secs = wanted
        await control.save_control_async(ctl)
        changed["planner_timeout_secs"] = wanted

    if not changed:
        return _json({"error": "nothing to change", "accepts": ["planner_timeout_secs"]}, 400)
    audit("conductor.settings", "ok", caller=_caller(request), resources=str(changed))
    return _json({"ok": True, **changed})


async def handle_decompose_goal(request: Any, ctx: Any) -> Any:
    """POST /conductor/goals/decompose {id} — ask the model for the goal's steps.

    The operator states an outcome; deciding how it breaks into work is the one
    part of this that is genuinely a judgement call, and a model is better at it
    than a form. ``judge.decompose_goal`` already existed for exactly this and was
    never called from anywhere — so the first version of the UI made a human type
    six steps that the system could have proposed.

    **These are candidates, and they land on a DRAFT.** Nothing is dispatched by
    decomposing: the leaves are written to the goal and the operator still has to
    read them, edit them, and press Activate. That ordering is deliberate — a model
    may propose the plan, and only a human may start it.

    Accepts a ``draft`` or a ``ready`` goal — re-planning something nobody has
    started is safe, and on success the goal becomes ``ready`` so the operator can
    see that planning achieved something and that starting it is now their move.

    Refuses on a STARTED goal. Re-planning a goal whose workers are already
    running would orphan sessions bound to leaf ids that no longer exist, and the
    honest recovery for "the plan was wrong" is a new goal, not a swap underneath
    live work.

    ``[]`` back from the model is reported as such rather than written: an empty
    decomposition would clear a plan the operator may have typed by hand.
    """
    denied = _unauthorized(request)
    if denied is not None:
        return denied
    body = await _body(request)
    goal_id = _text(body.get("id"), 64).lower()
    if not goal_id:
        return _json({"error": "id is required"}, 400)
    goal = await goals.get_goal_async(goal_id)
    if goal is None:
        return _json({"error": "no such goal", "id": goal_id}, 404)
    if goal.status not in (goals.GoalStatus.DRAFT.value, goals.GoalStatus.READY.value):
        return _json(
            {"error": f"goal is {goal.status}; decompose only applies to a draft",
             "id": goal_id, "status": goal.status},
            409,
        )

    ceiling = (await control.load_control_async()).planner_timeout_secs
    # Both ends of the call land in the ledger, so "the button is spinning" has a
    # matching pair of rows an operator can see in the events pane rather than a
    # silence they have to guess at.
    await ledger.record_event_async(
        action_class="plan", goal_id=goal_id, outcome="attempt", resource=goal_id,
        detail=f"planning steps for {goal.title!r} (up to {ceiling:.0f}s)",
    )
    _say(
        f"**Planning** {goal.title!r}\n"
        f"Reading the objective and breaking it into steps (up to {ceiling:.0f}s). "
        f"Nothing is dispatched by planning — the goal becomes *ready* and waits for you."
    )
    started = time.time()
    try:
        leaves = await judge.decompose_goal(
            goal.to_json(),
            sessions=getattr(RUNTIME.state, "sessions", None),
            timeout=ceiling,
        )
    except Exception:
        logger.exception("conductor: decompose failed for %s", goal_id)
        await ledger.record_event_async(
            action_class="plan", goal_id=goal_id, outcome="failure", resource=goal_id,
            detail="the planner raised; the goal is unchanged",
        )
        _say(f"**Planning failed** for {goal.title!r} — the planner errored. The goal is unchanged.")
        return _json({"error": "the planner failed; nothing was changed", "id": goal_id}, 502)
    elapsed = time.time() - started

    if not leaves:
        await ledger.record_event_async(
            action_class="plan", goal_id=goal_id, outcome="failure", resource=goal_id,
            detail=f"no usable steps after {elapsed:.0f}s"
                   + (f" — the {ceiling:.0f}s ceiling was reached, try raising it"
                      if elapsed >= ceiling - 1 else ""),
        )
        _say(
            f"**No usable steps** for {goal.title!r} after {elapsed:.0f}s"
            + (f" — the {ceiling:.0f}s planning ceiling was reached. Raise it in "
               f"Automation and try again." if elapsed >= ceiling - 1
               else ". A clearer objective, or a working directory, usually fixes it.")
        )
        return _json(
            {"ok": False, "id": goal_id, "leaves": 0,
             "error": "the planner returned no usable steps; the goal is unchanged "
                      "(a clearer statement, or a working directory, usually fixes it)"},
            200,
        )

    goal.leaves = leaves
    # Planning succeeded, so the goal is no longer a bare draft: it is described,
    # planned, and waiting for the operator. Setting it here rather than leaving it
    # to a second call is the point — an operator who has just watched the planner
    # work should not have to ask what changed, and "draft" said nothing changed.
    #
    # It becomes READY, never ACTIVE. Planning is not permission.
    if goal.status == goals.GoalStatus.DRAFT.value:
        goal.status = goals.GoalStatus.READY.value
    goal.updated_ts = time.time()
    try:
        await goals.save_goal_async(goal)
    except OSError:
        logger.exception("conductor: could not persist decomposed goal %s", goal_id)
        return _json({"error": "could not write the goal"}, 500)

    _say("\n".join(
        [f"**Planned** {goal.title!r} — {len(goal.leaves)} step(s) in {elapsed:.0f}s"]
        + [
            f"{index}. `{leaf.get('id')}` {leaf.get('title') or ''}"
            + (f" → {next((e.get('path') for e in (leaf.get('done_when') or []) if isinstance(e, dict) and e.get('kind') == 'file_exists'), '')}"
               if leaf.get("done_when") else "")
            + (f" (after {', '.join(str(d) for d in leaf.get('depends_on') or [])})"
               if leaf.get("depends_on") else "")
            for index, leaf in enumerate(goal.leaves, 1)
        ]
        + [f"This goal is now **ready**. Review or edit the steps in Goals, then "
           f"press Start when you want it to run — planning changed nothing on disk."]
    ))
    await ledger.record_event_async(
        action_class="plan", goal_id=goal_id, outcome="success", resource=goal_id,
        detail=f"planned {len(goal.leaves)} step(s) in {elapsed:.0f}s: "
               + ", ".join(str(leaf.get("id")) for leaf in goal.leaves[:8]),
    )
    audit(
        "conductor.goal_decompose", "ok", caller=_caller(request),
        resources=f"goal={goal_id} leaves={len(goal.leaves)}",
    )
    fresh = await goals.get_goal_async(goal_id)
    return _json({
        "ok": True,
        "id": goal_id,
        "leaves": len(goal.leaves),
        "goal": _goal_row(fresh) if fresh is not None else None,
    })


async def handle_goal_authority(request: Any, ctx: Any) -> Any:
    """POST /conductor/goals/authority {id, action_class, tier} — narrow a goal.

    The response reports the tier the goal file now asks for AND the tier
    :func:`policy.effective` actually yields under the current mode, because those
    differ and the difference is the point: a goal may only ever RESTRICT. Asking
    for ``act`` on a class whose design-time default is ``propose`` gets
    ``propose``, and is told so rather than appearing to have been granted.

    A hard-denied class answers 403 with its name. ``goals.validate_authority``
    would reject it anyway; answering here means the operator reads "that requires
    you" instead of a validation error about an unknown key.
    """
    denied = _unauthorized(request)
    if denied is not None:
        return denied
    body = await _body(request)
    goal_id = _text(body.get("id"), 64).lower()
    action_class = _text(body.get("action_class"), 64)
    tier = _text(body.get("tier"), 16).lower()

    if not goal_id:
        return _json({"error": "id is required"}, 400)
    if is_hard_denied(action_class):
        return _json(
            {
                "error": "hard-denied action class",
                "action_class": action_class,
                "reason": (
                    f"{action_class} has no execution path, and no authority "
                    "level grants one"
                ),
            },
            403,
        )
    if action_class not in ACTION_CLASSES:
        return _json(
            {"error": "unknown action class", "action_class": action_class,
             "action_classes": sorted(ACTION_CLASSES)},
            400,
        )
    ok, errors = goals.validate_authority({action_class: tier})
    if not ok:
        return _json({"error": "; ".join(errors)}, 400)

    goal = await goals.get_goal_async(goal_id)
    if goal is None:
        return _json({"error": "unknown goal", "id": goal_id}, 404)

    goal.authority = {**goal.authority, action_class: tier}
    try:
        await goals.save_goal_async(goal)
    except ValueError as error:
        return _json({"error": str(error)}, 400)
    except OSError:
        logger.exception("conductor: could not write goal %s", goal_id)
        return _json({"error": "could not write the goal file"}, 500)

    record = await control.load_control_async()
    effective_tier, why = policy.effective(
        action_class, mode=record.mode_enum, goal_authority=goal.authority
    )
    spec = spec_for(action_class)
    audit("conductor.goal_authority", "ok", caller=_caller(request),
          resources=f"goal={goal_id} {action_class}={tier} effective={effective_tier.value}")
    return _json({
        "ok": True,
        "id": goal_id,
        "action_class": action_class,
        "requested": tier,
        "effective": effective_tier.value,
        "reason": why,
        "class_default": spec.default_tier.value if spec else None,
        "reversibility": spec.reversibility.value if spec else None,
        "mode": record.mode,
        "goal": _goal_row(goal),
    })


async def _resolve_goal_ids(raw: Any) -> tuple[list[str], list[str]]:
    """``(known, unknown)`` for a caller-supplied goal id list.

    An empty list means "every dispatchable goal" (``Control.pursues``), which is
    why an unknown id is reported rather than dropped: silently narrowing a START
    to the goals that happened to parse would make the conductor look started
    while ignoring the one the operator cared about.
    """
    if raw is None:
        return [], []
    wanted = [_text(item, 64).lower() for item in list(raw)[:MAX_GOAL_IDS]]
    wanted = [item for item in wanted if item]
    if not wanted:
        return [], []
    known = {goal.id for goal in await goals.load_goals_async()}
    return (
        [item for item in wanted if item in known],
        [item for item in wanted if item not in known],
    )


# ── registration ─────────────────────────────────────────────────────────────

#: ``(method, path, handler)`` triples, paths relative to
#: ``/api/apps/crew-manager``. Kept as data so ``backend/routes.py`` can build the
#: gateway's ``AppRoute`` objects and this module needs no gateway import.
ROUTES: tuple[tuple[str, str, Any], ...] = (
    ("GET", "/conductor/state", handle_state),
    ("POST", "/conductor/start", handle_start),
    ("POST", "/conductor/stop", handle_stop),
    ("POST", "/conductor/steer", handle_steer),
    ("POST", "/conductor/tick", handle_tick),
    ("GET", "/conductor/ledger", handle_ledger),
    ("GET", "/conductor/goals", handle_goals),
    ("POST", "/conductor/goals", handle_declare_goal),
    ("POST", "/conductor/settings", handle_settings),
    ("POST", "/conductor/chat/clear", handle_clear_chat),
    ("POST", "/conductor/sessions/remove", handle_remove_session),
    ("POST", "/conductor/events/clear", handle_clear_events),
    ("POST", "/conductor/goals/decompose", handle_decompose_goal),
    ("POST", "/conductor/goals/remove", handle_remove_goal),
    ("POST", "/conductor/goals/authority", handle_goal_authority),
)


def conductor_routes(app_route_cls: Any) -> list[Any]:
    """Build the conductor's ``AppRoute`` list.

    The class is passed in rather than imported so this module stays importable
    with no gateway present — ``backend/routes.py`` already imports ``AppRoute``
    lazily inside ``register_routes`` for the same reason.
    """
    return [
        app_route_cls(method=method, path=path, handler=handler)
        for method, path, handler in ROUTES
    ]
