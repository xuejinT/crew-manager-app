"""Authority composition — the single place effective permission is computed.

    effective(cls, goal) = min(mode_cap(cls), goal_tier(cls), marker_cap(cls))

There is exactly one implementation of that formula in the codebase, and every
caller goes through :func:`effective`. The reason is narrow and practical: the
moment "most restrictive wins" exists in two places, one of them is eventually
wrong in the permissive direction, and the failure is silent.

Nothing here does I/O beyond reading marker files, and nothing here executes.
:mod:`gate` consults this module; :mod:`act` refuses anything the gate did not
stamp. An LLM never reaches this module — authority is data, and a model
anywhere near it is the whole failure mode.
"""

from __future__ import annotations

from enum import Enum

from . import store
from .intents import ACTION_CLASSES, Tier, is_hard_denied, spec_for, tier_min


class Mode(str, Enum):
    """The global operating mode. Operator-set, persisted in ``control.json``."""

    ADVISORY = "advisory"
    """Today's behaviour. Everything is proposed; nothing executes. This is the
    default, and it is what the driver reverts to on every rollback path."""

    ASSISTED = "assisted"
    """Reversible internal actions and escalations execute. Anything that
    dispatches a turn is proposed for an operator click. This is BSC2's
    contingent-authorization shape and the mode a cautious operator lives in."""

    AUTONOMOUS = "autonomous"
    """Class defaults apply, so turn-dispatching classes execute inside their
    budgets. Still cannot reach anything hard-denied."""


#: Classes that may execute in ``assisted``: reversible, internal or
#: operator-facing, and dispatching no turn.
_ASSISTED_ACT: frozenset[str] = frozenset({
    "context_inject", "narrate", "pr_read", "cron_pause",
    "operator_notify", "escalate",
})


#: Marker file name that disables one class, batty-style. ``touch`` from a shell
#: with no gateway running and that class is off.
def marker_name(action_class: str) -> str:
    return f"no_{action_class}"


HALT_MARKER = "halt"
"""Kills all autonomy. Checked inside :func:`gate.gate` on every proposal, not
once per tick — a tick that began before the operator hit the brake must not
finish executing its queue."""


def mode_cap(action_class: str, mode: Mode) -> Tier:
    """The ceiling *mode* imposes on *action_class*."""
    if mode is Mode.ADVISORY:
        return Tier.PROPOSE
    if mode is Mode.ASSISTED:
        return Tier.ACT if action_class in _ASSISTED_ACT else Tier.PROPOSE
    return Tier.ACT


def marker_cap(action_class: str) -> Tier:
    """``OFF`` when a per-class disable marker exists, else no constraint."""
    return Tier.OFF if store.marker_set(marker_name(action_class)) else Tier.ACT


def goal_tier(action_class: str, goal_authority: dict[str, str] | None) -> Tier:
    """The per-goal override, defaulting to the class's design-time default."""
    spec = spec_for(action_class)
    default = spec.default_tier if spec else Tier.DENY_HARD
    if not goal_authority:
        return default
    raw = goal_authority.get(action_class)
    if raw is None:
        return default
    try:
        requested = Tier(raw)
    except ValueError:
        return default
    # A goal may only ever RESTRICT. Letting per-goal config raise authority
    # above the class default would make the design-time table advisory, and
    # would hand a steer instruction a path to privilege escalation.
    return tier_min(default, requested)


def effective(
    action_class: str,
    *,
    mode: Mode,
    goal_authority: dict[str, str] | None = None,
) -> tuple[Tier, str]:
    """Effective tier for *action_class*, plus the reason it is that tier.

    The reason is returned rather than logged here so the caller can put it on
    the ledger row verbatim — an autonomous action whose recorded justification
    was reconstructed after the fact is not an audit trail.
    """
    if is_hard_denied(action_class):
        return Tier.DENY_HARD, f"{action_class} is hard-denied: no execution path exists"
    if action_class not in ACTION_CLASSES:
        return Tier.DENY_HARD, f"{action_class} is not a known action class"

    m = mode_cap(action_class, mode)
    g = goal_tier(action_class, goal_authority)
    k = marker_cap(action_class)
    result = tier_min(m, g, k)

    if result is Tier.OFF and k is Tier.OFF:
        return result, f"disabled by operator marker {marker_name(action_class)}"
    binding: list[str] = []
    if m is result:
        binding.append(f"mode={mode.value}")
    if g is result:
        binding.append("goal policy")
    if k is result and k is not Tier.ACT:
        binding.append("marker")
    why = ", ".join(binding) or f"mode={mode.value}"
    return result, f"tier={result.value} ({why})"


def hard_denied_classes() -> frozenset[str]:
    """Exposed so a test can enumerate the set and assert unreachability."""
    from .intents import DENY_HARD
    return DENY_HARD
