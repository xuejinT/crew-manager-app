"""The supervised driver: one clock, one tick, three failure-isolation wrappers.

This module owns the *when*. :mod:`steps` owns the *what*, and the split is the
whole design of this file: every decision is in a step, and the only things here
are the two cadences, the supervision discipline, and the START/STOP verbs.

**``tick()`` is factored out of the sleep loop**, and that factoring is the single
most valuable idea borrowed from batty (``daemon/poll.rs:246``, which explains
itself in its own comment). It is the difference between a testable supervisor and
an untestable one: ``await ConductorDriver(state).tick(dry_run=True)`` exercises
all fourteen steps once, from a test or from ``POST /conductor/tick?dry_run=1``,
with no clock, no sleeping, and no side effects.

**Two cadences, because steady state should cost nothing.**

* ``observe`` every 15s — in-memory attribute reads off ``state._slots`` and the
  service objects. No file I/O, no subprocess, no model. This is what keeps a
  board alive with no browser open, and it keeps running through a HOLD and
  through a drain.
* ``deliberate`` every 60s, and then **only for goals whose ``facts_hash``
  changed or whose cooldown expired** (the per-goal gate lives in
  ``steps.evaluate``). Everything expensive is behind this: predicates, model
  calls, proposals, execution.

**Supervision discipline is ``watcher.py``'s, deliberately copied.** Every cycle
is fully wrapped, so a bad slot payload logs and skips rather than killing the
task and taking the app's routes with it (``watcher.py:146-158``). What is added
on top is the three-tier isolation the plan asks for:

* **critical** — log, continue, never counted. The loop is useless without these,
  but one transient failure is not evidence of a broken subsystem.
* **recoverable** — a consecutive-failure counter that WARNs at ≥3 and is
  persisted, so "the driver has been failing to execute all night" is audible.
* **optional subsystem** — a :class:`breaker.CircuitBreaker`. A rate-limited model
  or a wedged provider must degrade ONE capability, not stop autonomy and not
  spin.

And the constraint that outranks all of them, invariant I9: **the tick cannot kill
the gateway.** ``dashboard/loop_watchdog.py`` arms
``faulthandler.dump_traceback_later(exit_after=25s, exit=True)``, so one
un-offloaded ``fsync`` or glob on this loop hard-exits the operator's entire
gateway — every session, every approval, every cron. Hence: every step runs under
``asyncio.wait_for`` with its own cap, and every filesystem touch in every step
goes through the store's ``_async`` wrappers or ``asyncio.to_thread``.
"""

from __future__ import annotations

import asyncio
import contextlib
import logging
import os
import time
from typing import Any

from . import breaker
from . import budget as budget_mod
from . import control as control_mod
from . import gate as gate_mod
from . import goals as goals_mod
from . import judge
from . import ledger
from . import observe as observe_mod
from . import steps
from . import store
from .control import Control
from .policy import HALT_MARKER
from .steps import TickContext

logger = logging.getLogger(__name__)


#: The cheap cadence. Fifteen seconds is the plan's number and it is chosen
#: against the ten-minute stall threshold: polling faster only adds wakeups.
OBSERVE_SECS = 15.0

#: The expensive cadence.
DELIBERATE_SECS = 60.0

#: How long a stop waits for an in-flight tick before giving up on politeness.
#: A tick's own steps are individually capped well under this.
STOP_GRACE_SECS = 30.0

#: Consecutive failures of a recoverable step before the operator hears about it.
WARN_AFTER_FAILURES = 3

#: Names driver-created slots carry, so ``kill`` can tell ours from the
#: operator's. VERIFIED: ``act.conductor_link_key`` (act.py:129) writes
#: ``conductor:<goal>:<leaf>`` into ``linked_session_key``, and
#: ``act._SLOT_NAME_PREFIX`` (act.py:126) is ``cm-``.
DRIVER_LINK_PREFIX = "conductor:"
DRIVER_SLOT_PREFIX = "cm-"
"""Exported for the route layer and for tests. Note that :meth:`_driver_slots`
does NOT match on it — see that method for why a name is not provenance."""


def _warm_breakers() -> None:
    """Force every breaker to load its persisted slice, off the event loop.

    ``CircuitBreaker._restore`` is lazy and reads ``breakers.json`` on first use
    (breaker.py:111-123) — which, left alone, means the first tick performs one
    synchronous read per breaker *inside a coroutine*. Small, but I9 does not have
    a size exemption and this costs one ``to_thread`` at arming time to remove the
    whole class of exposure. Registering them here also makes ``allow()`` on the
    hot path pure memory.
    """
    for name in breaker.KNOWN_SUBSYSTEMS:
        breaker.get(name).state()
    for step in steps.STEPS:
        if step.isolation == steps.OPTIONAL:
            _step_breaker(step.name).state()


def _step_breaker(name: str) -> breaker.CircuitBreaker:
    """The breaker for one optional STEP, distinct from its subsystem's.

    ``steps.classify`` already trips ``llm_classify`` on a model failure and
    catches it, so it never raises for that reason. A raise OUT of the step is a
    different fault — a bug in the step or an unreadable observation — and giving
    the two one counter would mean either fault needing 2×5 occurrences to trip
    the thing that would have stopped it. Fetched through :func:`breaker.get` so
    there is still exactly one instance per name.
    """
    return breaker.get(f"step_{name}")


class ConductorDriver:
    """One driver per gateway process. Holds the clock, the budget and the runtime.

    Constructed with the host handle the app now receives at startup
    (``bind_host(app)`` → ``app["state"]``) and, optionally, the ``AppContext``.
    Both are stored and neither is required: a driver built with ``state=None``
    ticks, observes nothing, proposes nothing and reports honestly, which is what
    makes the offline selftest able to run the whole loop.

    Single-flight by construction. One tick at a time, one action at a time,
    enforced by an ``asyncio.Lock`` that both the timer and the route-triggered
    tick take — the plan's "single tick, single-threaded" requirement, which is
    also what makes the in-memory :class:`steps.RuntimeState` and
    :class:`budget.Budget` safe to hold across ticks without re-reading.
    """

    def __init__(self, state: Any, ctx: Any = None) -> None:
        self._state = state
        self._ctx = ctx
        self._task: asyncio.Task[None] | None = None
        self._lock: asyncio.Lock | None = None
        self._runtime: steps.RuntimeState | None = None
        self._cooldowns = gate_mod.Cooldowns()
        """The signature index the gate reads. ONE instance per driver, loaded once:
        it is the answer to "have I already sent this", and a second store would
        answer it from an empty index — the one wrong answer that produces duplicate
        sends. Safe to hold in memory because the PID + heartbeat in ``control.py``
        makes this process the only writer on the machine."""
        self._goals: list[goals_mod.Goal] = []
        self._budget = budget_mod.Budget(goal_caps_provider=self._goal_caps)
        self._steered = False
        self._last_deliberate = 0.0
        self._last_tick: dict[str, Any] = {}
        self._ticks = 0
        self._armed_ts = 0.0
        self._closing = False

    # -- host-facing lifecycle --------------------------------------------

    async def start(self) -> dict[str, Any]:
        """Take ownership and arm the loop. Idempotent; never raises for policy.

        The order is the restart-recovery order from the plan and every step of it
        earns its place:

        1. **Load ``control.json``. If ``operator_stopped``, do nothing at all.**
           Not "arm and let the guard skip" — an operator's STOP must survive a
           gateway restart without the loop even existing, because a loop that is
           running-but-skipping is one config typo away from acting.
        2. **Refuse if another conductor is heartbeating.** A dev gateway beside
           the real one is the concrete case, and ``fcntl`` cannot see it.
        3. **Claim** the record: this pid, a fresh heartbeat, a new epoch.
        4. **Reconcile the ledger's open intents by observation** *before* the
           first tick. That set is exactly the crash window, and an unresolved
           intent is ``unknown`` — which means look at reality, never re-dispatch.
        5. Only then arm the timer.
        """
        if self._task is not None and not self._task.done():
            return {"armed": True, "already": True, **self.status}

        control = await control_mod.load_control_async()
        if control.operator_stopped:
            logger.info(
                "conductor: control.json says operator_stopped; not arming. "
                "Only an explicit START clears that."
            )
            return {"armed": False, "reason": "operator_stopped", "mode": control.mode}

        foreign = control_mod.foreign_owner(control)
        if foreign:
            logger.warning("conductor: refusing to arm — %s", foreign)
            return {"armed": False, "reason": foreign}

        judge.bind(self._state)
        self._runtime = await steps.load_runtime_async()
        self._goals = await goals_mod.load_goals_async()
        await self._cooldowns.load_async()
        await asyncio.to_thread(_warm_breakers)
        control = await control_mod.claim_async(started_by=control.started_by)
        control_mod.bind_steer_event()

        recovery = await self._recover(control)

        loop = asyncio.get_running_loop()
        self._closing = False
        self._armed_ts = time.time()
        self._task = loop.create_task(self._run(), name="crew-manager-conductor")
        logger.info(
            "conductor: armed (observe %ss / deliberate %ss, mode=%s, %d goal(s))",
            int(OBSERVE_SECS),
            int(DELIBERATE_SECS),
            control.mode,
            len(self._goals),
        )
        return {"armed": True, "recovery": recovery, **self.status}

    async def stop(
        self, *, verb: str = "drain", confirm: bool = False, reason: str = ""
    ) -> dict[str, Any]:
        """STOP, in three distinctly-implemented verbs. Idempotent.

        Pause and cancel are different operations and conflating them is how
        partial state gets orphaned, so:

        * **drain** (the button) — ``running: false``, epoch bumped. The task is
          **not cancelled**: the observe cadence keeps running so the operator
          still has a board, and ``steps.guard`` stops every deliberate step from
          here on. The in-flight tick finishes and writes its outcomes.
        * **hold** — dispatch freezes, goals stay ``active``, budgets freeze with
          an explicit ``paused_reason`` so a later budget raise cannot silently
          resume work the operator paused.
        * **kill** — drain, plus a capability-nonce rotation (so a task already
          past the gate fails closed on its next write), plus a hard stop of turns
          on **driver-created slots only**. Requires an explicit second
          confirmation and reports ``partial_state: true``, because it destroys
          work the operator asked for.

        Sessions the driver started are deliberately left RUNNING by ``drain``:
        killing a mid-turn agent throws away work the operator wanted. Each such
        turn is reported here as ``orphaned_by_stop`` instead.
        """
        ok, why = control_mod.stop_receipt(verb, confirmed=confirm)
        if not ok:
            return {"stopped": False, "reason": why}

        if verb == "hold":
            control = await control_mod.set_holding_async(True, reason=reason or "operator hold")
            logger.info("conductor: HOLD — %s", control.paused_reason)
            return {"stopped": True, "verb": verb, "mode": control.mode, "holding": True}

        control = await control_mod.set_running_async(
            False, reason=reason or f"conductor_{verb}", operator=True
        )
        await self._await_idle()

        receipt: dict[str, Any] = {
            "stopped": True,
            "verb": verb,
            "epoch": control.epoch,
            "mode": control.mode,
            "orphaned_by_stop": self._driver_turns_in_flight(),
        }
        if verb == "kill":
            control = await control_mod.rotate_nonce_async("kill")
            receipt["epoch"] = control.epoch
            receipt["partial_state"] = True
            receipt["killed"] = await self._kill_driver_turns()
            logger.warning(
                "conductor: KILL — nonce rotated, %d turn(s) stopped, partial_state=true",
                len(receipt["killed"]),
            )
        else:
            logger.info(
                "conductor: DRAIN — no new proposals; %d driver turn(s) left running",
                len(receipt["orphaned_by_stop"]),
            )
        return receipt

    async def aclose(self) -> None:
        """Disarm and persist. Safe to call twice, and safe from a shutdown hook.

        The app has to tear its own loop down: ``deregister_app_routes`` drops the
        module from ``sys.modules`` but cancels nothing the app started, so a
        re-enable without this would leave the old task ticking against a stale
        host handle.
        """
        self._closing = True
        task, self._task = self._task, None
        if task is not None and not task.done():
            task.cancel()
            with contextlib.suppress(asyncio.CancelledError, Exception):
                await task
        control_mod.clear_steer_event()
        # The last tick's cooldowns and signature counts are what stop a restart
        # from re-nudging everything it had just finished nudging.
        with contextlib.suppress(Exception):
            await self._cooldowns.flush_async()
        if self._runtime is not None:
            with contextlib.suppress(Exception):
                await steps.save_runtime_async(self._runtime)
        logger.info("conductor: disarmed")

    # -- the tick ---------------------------------------------------------

    async def tick(self, *, dry_run: bool = False) -> dict[str, Any]:
        """Run one tick. The whole loop, once, synchronously callable.

        Returns the tick record: per-step summaries, timings, and the failure
        state. Never raises for anything a step did — a step that fails is
        recorded and the tick continues, because a partial tick is the normal
        outcome of a transient fault and losing the remaining steps (including
        ``report``, which persists) would turn one bad read into lost state.

        ``dry_run=True`` is the contract a test and ``POST
        /conductor/tick?dry_run=1`` rely on, and it is four things:

        1. it forces a deliberate pass, **even when the driver is stopped, held or
           HALTed** — a preview that skipped the pipeline because autonomy is off
           would answer no question the operator asked;
        2. every proposal goes through the real :func:`steps.gate`, with the real
           authority table, the real budgets and the real cooldowns;
        3. every decision is recorded to the ledger, because in ``advisory`` mode
           the ledger *is* the product;
        4. it **calls nothing in :mod:`act`**, and it mutates nothing durable
           except those ledger rows: the runtime state and the goal objects are
           copied first, so a preview cannot advance a cooldown, retire a
           signature, or move a goal's status under the next real tick.

        The downgrade that makes (2) and (3) safe together happens inside the gate,
        at the one place that can stamp ``ACT`` — not here, and not by a flag
        :mod:`act` is trusted to honour.
        """
        async with self._tick_lock():
            return await self._tick_locked(dry_run=dry_run)

    async def _tick_locked(self, *, dry_run: bool) -> dict[str, Any]:
        began = time.monotonic()
        now = time.time()

        judge.bind(self._state)
        # Without this the per-tick model-call cap self-resets on a 180s window
        # instead of latching off, so a wedged tick could spend six calls a minute
        # forever.
        judge.begin_tick()

        control = await control_mod.load_control_async()
        if self._runtime is None:
            self._runtime = await steps.load_runtime_async()

        deliberate = (
            dry_run
            or self._steered
            or (now - self._last_deliberate) >= DELIBERATE_SECS
        )
        if deliberate or not self._goals:
            # Re-read on the expensive cadence only. Four goal-directory reads a
            # minute is pointless I/O, and the in-memory copies are the ones the
            # steer step mutates and the report step persists — reloading under
            # them every 15s would discard a steer applied between two saves.
            self._goals = await goals_mod.load_goals_async()

        # A dry run works on COPIES. Everything the steps mutate in memory —
        # cooldowns, signature counts, non-progress counters, goal statuses — would
        # otherwise leak into the next real tick: a preview would advance a goal's
        # cooldown and the tick that followed would skip the goal it previewed.
        runtime = (
            self._runtime
            if not dry_run
            else steps.RuntimeState.from_json(self._runtime.to_json())
        )
        goals = self._goals
        cooldowns = self._cooldowns
        if dry_run:
            copies = (goals_mod.Goal.from_json(g.to_json()) for g in self._goals)
            goals = [g for g in copies if g is not None]
            # A non-persisting twin loaded from the same file: real dedup answers,
            # and ``persist=False`` makes every mark and forget a no-op (gate.py:339,
            # :314). Sharing the live instance would let a preview retire a
            # signature, and the session would then never be steered for that reason.
            cooldowns = gate_mod.Cooldowns(persist=False)
            await cooldowns.load_async()

        tc = TickContext(
            now=now,
            state=self._state,
            ctx=self._ctx,
            dry_run=dry_run,
            deliberate=deliberate,
            control=control,
            mode=control.mode_enum,
            budget=self._budget,
            runtime=runtime,
            cooldowns=cooldowns,
            goals=goals,
        )

        record: dict[str, Any] = {
            "ts": now,
            "dry_run": dry_run,
            "deliberate": deliberate,
            "mode": tc.mode.value,
            "steer_wake": self._steered,
            "steps": {},
        }
        # `steps.STEPS`, not a name bound at import: the table IS the running
        # order, so a step added to steps.py must run without an edit here.
        for step in steps.STEPS:
            if step.deliberate_only and not deliberate:
                record["steps"][step.name] = {"skipped": "observe-only tick"}
                continue
            if step.deliberate_only and tc.halted and not dry_run:
                # A HALT/STOP/HOLD keeps observing and keeps reporting — the
                # operator still has a board and the heartbeat still lands — and
                # deliberately freezes everything that decides or acts. Goal
                # transitions freeze with it, which is what "budgets freeze" means.
                # A dry run is exempt: it executes nothing by construction, and a
                # preview that answered "nothing, autonomy is off" would be useless
                # precisely when the operator is deciding whether to turn it on.
                record["steps"][step.name] = {"skipped": f"halted: {tc.halt_reason}"}
                continue
            record["steps"][step.name] = await self._run_step(step, tc)

        if deliberate:
            self._last_deliberate = now
        self._steered = False
        if not dry_run:
            self._runtime = tc.runtime
            # Every mark scheduled a write; this is the guarantee, and the restart
            # path reads this file back (gate.py:321-336).
            await self._cooldowns.flush_async()
        self._ticks += 1
        record["duration_ms"] = round((time.monotonic() - began) * 1000, 1)
        record["halted"] = tc.halted
        record["halt_reason"] = tc.halt_reason
        record["notes"] = list(tc.notes)
        self._last_tick = record
        return record

    async def _run_step(self, step: steps.Step, tc: TickContext) -> dict[str, Any]:
        """One step, inside the isolation wrapper its class asks for.

        Timeouts are per step and are the mechanical half of I9: a step that
        hangs is cancelled and recorded, so the 25-second gateway watchdog is
        never the thing that notices.
        """
        brk = _step_breaker(step.name) if step.isolation == steps.OPTIONAL else None
        if brk is not None:
            allowed, why = brk.allow()
            if not allowed:
                return {"skipped": f"breaker open: {why}"}

        began = time.monotonic()
        try:
            summary = await asyncio.wait_for(step.run(tc), timeout=step.timeout)
        except asyncio.CancelledError:
            raise
        except asyncio.TimeoutError:
            return self._step_failed(
                step, tc, brk, f"timed out after {step.timeout:g}s", began
            )
        except Exception as exc:
            logger.exception("conductor: step %s failed", step.name)
            return self._step_failed(step, tc, brk, repr(exc), began)

        if brk is not None:
            brk.record_ok()
        if step.isolation == steps.RECOVERABLE:
            tc.runtime.consecutive_failures.pop(step.name, None)
        out = summary if isinstance(summary, dict) else {"result": summary}
        out["ms"] = round((time.monotonic() - began) * 1000, 1)
        return out

    def _step_failed(
        self,
        step: steps.Step,
        tc: TickContext,
        brk: breaker.CircuitBreaker | None,
        error: str,
        began: float,
    ) -> dict[str, Any]:
        """Record one step failure according to its isolation class."""
        out: dict[str, Any] = {
            "error": error[:400],
            "isolation": step.isolation,
            "ms": round((time.monotonic() - began) * 1000, 1),
        }
        if brk is not None:
            brk.record_error(error)
            out["breaker"] = brk.name
        elif step.isolation == steps.RECOVERABLE:
            count = tc.runtime.bump(f"fail:{step.name}")
            tc.runtime.consecutive_failures[step.name] = count
            out["consecutive_failures"] = count
            if count >= WARN_AFTER_FAILURES:
                logger.warning(
                    "conductor: step %s has failed %d times in a row: %s",
                    step.name,
                    int(count),
                    error[:200],
                )
                tc.note(f"{step.name} has failed {int(count)} times in a row")
        else:
            # critical: logged and never counted. A transient failure in a step
            # the loop cannot work without is still not evidence of a broken
            # subsystem, and a counter here would trip on the first slow disk.
            logger.error("conductor: critical step %s failed: %s", step.name, error[:200])
        return out

    # -- the sleep loop ---------------------------------------------------

    async def _run(self) -> None:
        """The timer. Nothing but sleep, tick, and never die.

        The whole body is wrapped exactly as ``watcher.py:146-158`` wraps its
        sweep, for the reason stated there: a failed cycle must never take the
        loop — and with it the app's routes — down with it. ``tick`` already
        swallows per-step faults, so reaching the handler here means something
        outside the steps broke, which is the case most worth logging loudly.
        """
        while True:
            try:
                woke = await self._sleep_or_steer(OBSERVE_SECS)
                if woke:
                    self._steered = True
                if self._closing:
                    return
                await self.tick()
            except asyncio.CancelledError:
                raise
            except Exception:
                logger.exception("conductor: tick failed; continuing")

    async def _sleep_or_steer(self, secs: float) -> bool:
        """Sleep, waking early when a steer arrives. True when a steer woke us.

        A steer should be deliberated within about a second rather than at the end
        of the sleep, but the **next tick** consumes it rather than the current
        one: a tick is short, and interrupting one re-enters half-finished steps.
        """
        event = control_mod.steer_event()
        if event is None:
            await asyncio.sleep(secs)
            return False
        try:
            await asyncio.wait_for(event.wait(), timeout=secs)
        except asyncio.TimeoutError:
            return False
        event.clear()
        return True

    def _tick_lock(self) -> asyncio.Lock:
        """The single-flight lock, created inside the running loop.

        Lazily rather than in ``__init__`` because a driver may be constructed
        from a synchronous route-registration path, and a lock built outside the
        loop it is used in is a class of bug not worth leaving available.
        """
        if self._lock is None:
            self._lock = asyncio.Lock()
        return self._lock

    async def _await_idle(self) -> None:
        """Wait for an in-flight tick to finish, bounded.

        A stop that returned while the previous tick was still executing would
        report an ``orphaned_by_stop`` list that was still being added to.
        """
        deadline = time.monotonic() + STOP_GRACE_SECS
        lock = self._tick_lock()
        while lock.locked() and time.monotonic() < deadline:
            await asyncio.sleep(0.1)

    # -- restart recovery -------------------------------------------------

    async def _recover(self, control: Control) -> dict[str, Any]:
        """Reconcile the crash window before the first tick.

        Runs ``steps.reconcile`` and nothing else, over a context built for the
        purpose. Recovery is deliberately **artifact-based**: the goal files and
        the ledger are read and intent is re-derived from them, which is the only
        recovery style that survives a model or a prompt changing mid-goal, and
        the reason a 60-second tick over durable files needs no durable-execution
        engine.
        """
        tc = TickContext(
            now=time.time(),
            state=self._state,
            ctx=self._ctx,
            control=control,
            mode=control.mode_enum,
            budget=self._budget,
            runtime=self._runtime or steps.RuntimeState(),
            cooldowns=self._cooldowns,
            goals=self._goals,
        )
        try:
            summary = await asyncio.wait_for(steps.reconcile(tc), timeout=30.0)
        except asyncio.CancelledError:
            raise
        except Exception as exc:
            logger.exception("conductor: recovery reconcile failed; arming anyway")
            return {"error": repr(exc)[:200]}
        self._runtime = tc.runtime
        if summary.get("open"):
            logger.info("conductor: recovery reconciled %s", summary)
        return summary

    # -- kill ------------------------------------------------------------

    def _driver_slots(self) -> list[tuple[str, Any]]:
        """``(key, slot)`` for the slots this driver created. Ours only, ever.

        Provenance, not shape: ``linked_session_key`` is written by
        ``act._exec_session_create`` and is the only durable marker that a slot is
        the driver's. The ``cm-`` name prefix (``act._SLOT_NAME_PREFIX``,
        act.py:126) is deliberately NOT sufficient on its own — a session the
        OPERATOR happens to have called ``cm-something`` is operator territory, and
        force-stopping one would be exactly the trust-destroying act the rest of
        this design exists to avoid. The first cut of this method tested the name
        as well, in a clause that also required the link: dead code that read as
        though a name could qualify a slot for a forced stop. It cannot.
        """
        raw = getattr(self._state, "_slots", None) or {}
        if not isinstance(raw, dict):
            return []
        out: list[tuple[str, Any]] = []
        for key, slot in list(raw.items()):
            link = str(getattr(slot, "linked_session_key", "") or "")
            if link.startswith(DRIVER_LINK_PREFIX):
                out.append((str(getattr(slot, "key", key) or key), slot))
        return out

    def _driver_turns_in_flight(self) -> list[str]:
        return [
            key
            for key, slot in self._driver_slots()
            if bool(getattr(slot, "running", False))
        ]

    async def _kill_driver_turns(self) -> list[str]:
        """Hard-stop turns on driver-created slots. Guarded end to end.

        VERIFIED: ``SessionManager.stop_turn(key, *, force=False, preserve_queue,
        on_soft, on_hard) -> StopOutcome`` at ``kiro_crew/session.py:4569``, and
        the in-tree app precedent keys it by the slot's session key
        (``apps/builtins/spec_builder/backend/routes.py:1832``). The key is
        resolved through ``chat_utils.effective_session_key`` when that symbol is
        present and falls back to ``dashboard:<slot>`` — the same fallback
        ``act._session_key`` uses, for the same reason: a channel-born slot's
        turns run under the channel key, and the dashboard-prefixed form would
        silently match nothing.
        """
        sessions = getattr(self._state, "sessions", None)
        stop_turn = getattr(sessions, "stop_turn", None) if sessions is not None else None
        if not callable(stop_turn):
            logger.warning(
                "conductor: kill cannot stop turns — state.sessions.stop_turn is "
                "unavailable on this gateway; reporting partial state"
            )
            return []
        resolve = _effective_session_key()
        killed: list[str] = []
        for key, slot in self._driver_slots():
            if not getattr(slot, "running", False):
                continue
            session_key = f"dashboard:{key}"
            if resolve is not None:
                try:
                    session_key = str(resolve(slot))
                except Exception:
                    logger.debug("conductor: effective_session_key raised", exc_info=True)
            try:
                outcome = await stop_turn(session_key, force=True)
            except asyncio.CancelledError:
                raise
            except Exception:
                logger.exception("conductor: could not stop turn on %s", key)
                continue
            killed.append(f"{key}:{outcome}")
        return killed

    # -- read model -------------------------------------------------------

    @property
    def status(self) -> dict[str, Any]:
        """A pure-memory snapshot, safe to read from a request handler.

        Deliberately does NO file I/O: this is read by ``GET /conductor/state`` on
        the event loop, and a status route that stats the ledger is a status route
        that can hang the dashboard. :meth:`status_async` is the one that reads
        disk.
        """
        armed = self._task is not None and not self._task.done()
        return {
            "armed": armed,
            "pid": os.getpid(),
            "ticks": self._ticks,
            "armed_ts": self._armed_ts or None,
            "observe_secs": OBSERVE_SECS,
            "deliberate_secs": DELIBERATE_SECS,
            "last_deliberate_ts": self._last_deliberate or None,
            "steer_pending_wake": self._steered,
            "steps": list(steps.STEP_NAMES),
            "goals": [g.id for g in self._goals],
            "last_tick": self._last_tick,
            "consecutive_failures": (
                dict(self._runtime.consecutive_failures) if self._runtime else {}
            ),
            "degraded": list(observe_mod.MISSING_PLATFORM_HELPERS),
            "judge": judge.snapshot(),
            "halt_marker": HALT_MARKER,
        }

    async def status_async(self) -> dict[str, Any]:
        """:attr:`status` plus everything that needs a disk read, off the loop."""
        out = dict(self.status)
        control = await control_mod.load_control_async()
        out["control"] = control.to_json()
        out["blocking_reason"] = control.blocking_reason()
        out["mode"] = control.mode
        out["breakers"] = await breaker.all_states_async()
        out["ledger"] = await ledger.stats_async()
        out["budget"] = await self._budget.snapshot_async()
        out["steer_pending"] = await control_mod.pending_steer_count_async()
        out["cooldowns"] = self._cooldowns.snapshot()
        out["halted"] = bool(await asyncio.to_thread(store.marker_set, HALT_MARKER))
        return out

    # -- internals -------------------------------------------------------

    def _goal_caps(self, goal_id: str) -> dict[str, int]:
        """Per-goal action caps for :class:`budget.Budget`, from memory.

        Served from the goals this driver already loaded, never by reading a file:
        ``Budget.check`` calls this inside a coroutine on the hot path, and a
        ``goals/*.json`` read there is an I9 violation. A goal that is not loaded
        yields ``{}``, which leaves the class default in force — restrict-only, in
        the same direction as ``policy.goal_tier``.
        """
        for goal in self._goals:
            if goal.id != goal_id:
                continue
            actions = goal.budgets.get("actions")
            if not isinstance(actions, dict):
                return {}
            out: dict[str, int] = {}
            for name, value in actions.items():
                if isinstance(value, bool) or not isinstance(value, (int, float)):
                    continue
                out[str(name)] = int(value)
            return out
        return {}


_SESSION_KEY_RESOLVER: Any = None
_SESSION_KEY_LOADED = False


def _effective_session_key() -> Any:
    """``chat_utils.effective_session_key``, or None. Guarded and memoized.

    Imported lazily rather than at module import so this file loads with no
    gateway present — the offline selftest imports it, and house rule 6 makes
    that a requirement rather than a nicety.
    """
    global _SESSION_KEY_RESOLVER, _SESSION_KEY_LOADED
    if _SESSION_KEY_LOADED:
        return _SESSION_KEY_RESOLVER
    _SESSION_KEY_LOADED = True
    try:
        from kiro_crew.dashboard.chat_utils import effective_session_key
    except Exception:
        logger.debug("conductor: chat_utils.effective_session_key unavailable", exc_info=True)
        _SESSION_KEY_RESOLVER = None
    else:
        _SESSION_KEY_RESOLVER = effective_session_key
    return _SESSION_KEY_RESOLVER


# ── the process-wide driver ──────────────────────────────────────────────────
#
# One instance, mirroring ``watcher.WATCHER``: the route layer needs a handle it
# can reach from a request, ``bind_host`` needs one it can arm from startup, and
# the plan's "single tick, single-threaded" property is a property of there being
# one. Created empty; :func:`arm` supplies the host handle when it arrives.

DRIVER: ConductorDriver | None = None


def get_driver(state: Any = None, ctx: Any = None) -> ConductorDriver:
    """The process-wide driver, created on first call.

    *state* is adopted if the existing driver has none — ``bind_host`` may run
    before any request, or a request may arrive before ``bind_host`` on a gateway
    that does not support it, and whichever gets there first should win without
    creating a second driver.
    """
    global DRIVER
    if DRIVER is None:
        DRIVER = ConductorDriver(state, ctx)
    else:
        if DRIVER._state is None and state is not None:
            DRIVER._state = state
            judge.bind(state)
        if DRIVER._ctx is None and ctx is not None:
            DRIVER._ctx = ctx
    return DRIVER


async def arm(state: Any, ctx: Any = None) -> dict[str, Any]:
    """Arm the process-wide driver. The entry point for ``bind_host``/startup.

    Must be **idempotent and non-blocking**: it is called once per gateway boot
    for an enabled app *plus* once per enable/re-enable, on the event loop. It
    arms a task and does its (bounded) recovery reads off-thread; it does not
    block the boot.
    """
    return await get_driver(state, ctx).start()


async def disarm() -> None:
    """Tear the process-wide driver down. For the app's ``on_shutdown`` hook."""
    global DRIVER
    driver, DRIVER = DRIVER, None
    if driver is not None:
        await driver.aclose()
