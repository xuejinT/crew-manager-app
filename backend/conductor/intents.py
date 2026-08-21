"""Typed action classes, proposals and outcomes — the Conductor's vocabulary.

This module is pure data and pure functions. It imports nothing from the gateway
so it can be exercised offline, and it is the contract every other conductor
module is written against.

Three ideas carry the whole design and are encoded here rather than in prose:

* **An action CLASS is fixed at design time, not chosen at runtime.** Its
  reversibility and its default authority are properties of the class. A
  proposal names a class; it never carries its own permission.
* **``DENY_HARD`` means there is no execution path.** Not "possible with
  confirmation" — impossible. :func:`is_hard_denied` is consulted by the gate
  AND by ``act.py``, so a bug in one is not sufficient to execute one of them.
  ``test_authority.py`` asserts every member has no reachable executor.
* **A proposal is inert.** It records what the driver *would* do and why. Only
  :mod:`act` has side effects, and only for a proposal a gate stamped ``ACT``.
"""

from __future__ import annotations

import hashlib
import json
import time
import uuid
from dataclasses import dataclass, field, asdict
from enum import Enum
from typing import Any


class Reversibility(str, Enum):
    """How hard it is to undo an action. Assigned per class, at design time."""

    READ = "read"
    """No mutation at all."""

    REVERSIBLE = "reversible"
    """Undoable with no trace that matters (ephemeral context, a paused cron)."""

    COMPENSATABLE = "compensatable"
    """Cannot be un-done, but can be counter-acted inside the platform: a turn
    can be stopped, a loop deactivated, a created session closed."""

    IRREVERSIBLE = "irreversible"
    """Cannot be undone from here at all. Merges, review submissions, answering
    on the operator's behalf. Every member of this tier is hard-denied in v1."""

    UNKNOWN = "unknown"
    """Semantics not yet verified. Treated as irreversible by the gate."""


class Tier(str, Enum):
    """Authority tiers, in increasing order of trust."""

    OFF = "off"
    """Not proposed at all."""

    PROPOSE = "propose"
    """Recorded and surfaced to the operator; never executed."""

    ACT = "act"
    """Executed autonomously, subject to budgets, cooldowns and dedup."""

    DENY_HARD = "deny_hard"
    """No execution path and no configuration that creates one."""


_TIER_ORDER = {Tier.DENY_HARD: -1, Tier.OFF: 0, Tier.PROPOSE: 1, Tier.ACT: 2}


def tier_min(*tiers: Tier) -> Tier:
    """The least-privileged of *tiers*. ``DENY_HARD`` is absorbing.

    This is the only place tiers are compared, so "most restrictive wins" cannot
    be implemented two different ways in two different modules.
    """
    if any(t is Tier.DENY_HARD for t in tiers):
        return Tier.DENY_HARD
    if not tiers:
        return Tier.OFF
    return min(tiers, key=lambda t: _TIER_ORDER[t])


@dataclass(frozen=True)
class ActionSpec:
    """Design-time facts about one action class."""

    name: str
    reversibility: Reversibility
    default_tier: Tier
    operator_facing: bool = False
    externally_visible: bool = False
    """Visible to humans outside this machine (a PR comment). Raises the bar."""
    note: str = ""


def _spec(
    name: str,
    rev: Reversibility,
    default: Tier,
    *,
    operator_facing: bool = False,
    externally_visible: bool = False,
    note: str = "",
) -> ActionSpec:
    return ActionSpec(name, rev, default, operator_facing, externally_visible, note)


#: Every action class the Conductor knows about. Adding a row here is a design
#: decision; the gate refuses any class not present.
ACTION_CLASSES: dict[str, ActionSpec] = {
    # ---- always-auto: reversible, internal, dispatches no turn ----------------
    "context_inject": _spec(
        "context_inject", Reversibility.REVERSIBLE, Tier.ACT,
        note="Ephemeral context into a slot. No turn, no WS event. The lowest-risk "
             "possible autonomous action and the whole difference between an alias "
             "bucket and a driver.",
    ),
    "narrate": _spec(
        "narrate", Reversibility.REVERSIBLE, Tier.ACT,
        note="Digest into the Conductor's own slot.",
    ),
    "pr_read": _spec("pr_read", Reversibility.READ, Tier.ACT),
    "cron_pause": _spec(
        "cron_pause", Reversibility.REVERSIBLE, Tier.ACT,
        note="Ours only — matched on created_by.",
    ),
    "operator_notify": _spec(
        "operator_notify", Reversibility.REVERSIBLE, Tier.ACT, operator_facing=True,
        note="Rate-limited. The scarce resource is operator attention.",
    ),
    "escalate": _spec(
        "escalate", Reversibility.REVERSIBLE, Tier.ACT, operator_facing=True,
        note="Own budget and own flood guard. A system that cannot reach the "
             "operator is worse than one that reaches them too often — but the "
             "failure mode of an honest escalating system is a spammed operator "
             "who then rubber-stamps, so it is capped.",
    ),

    # ---- auto-with-budget: dispatches turns, compensatable, internal ----------
    "session_continue": _spec(
        "session_continue", Reversibility.COMPENSATABLE, Tier.ACT,
        note="Narrow: goal-bound, idle+stalled, one per failure_signature, "
             "escalate on the second.",
    ),
    "session_resume": _spec(
        "session_resume", Reversibility.COMPENSATABLE, Tier.ACT,
        note="Preferred over session_continue: the platform's own 409 set is the "
             "precondition list, so we mirror it instead of re-deriving it.",
    ),
    "session_create": _spec(
        "session_create", Reversibility.COMPENSATABLE, Tier.ACT,
        note="Idempotent by slot name — that IS the idempotency key. Promoted from "
             "PROPOSE to ACT when Increment 6 (the dispatch proposer in steps.py) "
             "landed: until a leaf could be dispatched deterministically there was "
             "nothing safe to act on. A goal may still restrict it back to propose, "
             "and the gate restricts it to names this goal may mint, so the widest "
             "this reaches is a fresh worker session bound to one goal.",
    ),
    "loop_arm": _spec(
        "loop_arm", Reversibility.REVERSIBLE, Tier.PROPOSE,
        note="Only ever with non-zero max_cycles AND max_runtime_secs in the same "
             "call. The REST default of max_cycles=0 (unlimited) is never inherited.",
    ),
    "cron_create": _spec(
        "cron_create", Reversibility.REVERSIBLE, Tier.PROPOSE,
        note="Created user_paused=True. Message-only; `command` is hard-denied.",
    ),
    "option_choice": _spec(
        "option_choice", Reversibility.COMPENSATABLE, Tier.OFF,
        note="Per-goal opt-in only, and only when a done_when line or the goal "
             "statement determines the answer unambiguously.",
    ),

    # ---- propose-only --------------------------------------------------------
    "session_side_ask": _spec(
        "session_side_ask", Reversibility.UNKNOWN, Tier.PROPOSE,
        note="Semantics unverified (OQ5). Unknown reversibility is gated as "
             "irreversible.",
    ),
    "loop_stop": _spec(
        "loop_stop", Reversibility.IRREVERSIBLE, Tier.PROPOSE,
        note="Irreversible from this app. Never over a loop we did not arm.",
    ),
    "pr_comment": _spec(
        "pr_comment", Reversibility.COMPENSATABLE, Tier.PROPOSE,
        externally_visible=True,
    ),
}


#: No execution path, no configuration key, no steer instruction, ever.
#: Enforced in three independent places: absence from ACTION_CLASSES, an explicit
#: check in gate(), and an explicit check in act.py's dispatcher.
DENY_HARD: frozenset[str] = frozenset({
    # Irreversible or externally visible in a way we will not automate.
    "pr_merge",
    "pr_automerge",
    "pr_review",
    "pr_create",
    # Speaking as the operator. There is no honest distinguisher available, and
    # doing this in-process would make an agent decision indistinguishable from
    # the human's in every downstream consumer, including the audit trail.
    "approval_answer",
    "question_answer",
    # Privilege escalation surfaces.
    "trust",
    "trust_command",
    "yolo",
    "safety_override",
    # Destructive.
    "slot_delete",
    "archive_sweep",
    # Three doors to the same room; all three stay shut.
    "shell",
    "cron_command",
    "write_github_workflows",
})


def is_hard_denied(action_class: str) -> bool:
    """True when *action_class* must never execute, by any path."""
    return action_class in DENY_HARD


def spec_for(action_class: str) -> ActionSpec | None:
    """The design-time spec, or None when the class is unknown/denied."""
    if is_hard_denied(action_class):
        return None
    return ACTION_CLASSES.get(action_class)


@dataclass
class Proposal:
    """One thing the driver would like to do, and why. Inert until gated.

    ``reasons`` is a list of machine-derived clauses, never model prose — the
    same discipline the board's rank explanation uses, so the "why" and the
    decision cannot disagree. ``signature`` is what dedup and cooldowns key on:
    two proposals with the same signature are the same proposal, even across
    ticks and across restarts.
    """

    action_class: str
    goal_id: str
    reasons: list[str] = field(default_factory=list)
    target_slot: str = ""
    params: dict[str, Any] = field(default_factory=dict)
    signature: str = ""
    predicted_paths: list[str] = field(default_factory=list)
    action_id: str = field(default_factory=lambda: uuid.uuid4().hex[:16])
    created_ts: float = field(default_factory=time.time)

    def __post_init__(self) -> None:
        if not self.signature:
            self.signature = self.compute_signature()

    def compute_signature(self) -> str:
        """Stable identity for dedup: class + goal + target + salient params.

        Deliberately EXCLUDES action_id, timestamps and message bodies. Two
        continuations of the same stuck session for the same reason must collide
        even though their composed wording differs, otherwise "one send per
        failure signature" silently becomes "one send per tick".
        """
        salient = {
            k: v for k, v in sorted(self.params.items())
            if k in {"failure_signature", "leaf_id", "url", "loop_id", "job_id", "kind"}
        }
        blob = json.dumps(
            [self.action_class, self.goal_id, self.target_slot, salient],
            sort_keys=True, separators=(",", ":"),
        )
        return hashlib.sha256(blob.encode("utf-8")).hexdigest()[:32]

    def idempotency_key(self) -> str:
        """Key the executor uses so a replay after a crash cannot double-fire."""
        return f"{self.goal_id}:{self.action_class}:{self.signature}"

    def to_json(self) -> dict[str, Any]:
        return asdict(self)


class Verdict(str, Enum):
    """What the gate decided."""

    ACT = "act"
    PROPOSE = "propose"
    ESCALATE = "escalate"
    REFUSE = "refuse"


@dataclass
class Decision:
    """The gate's ruling on one proposal, with the reason it ruled that way."""

    proposal: Proposal
    verdict: Verdict
    tier: Tier
    reason: str
    """Why this verdict. Always populated, including on ACT — an autonomous
    action with no recorded reason is the thing the audit surface exists to
    prevent."""

    def to_json(self) -> dict[str, Any]:
        return {
            "action_id": self.proposal.action_id,
            "action_class": self.proposal.action_class,
            "goal_id": self.proposal.goal_id,
            "target_slot": self.proposal.target_slot,
            "signature": self.proposal.signature,
            "verdict": self.verdict.value,
            "tier": self.tier.value,
            "reason": self.reason,
            "reasons": list(self.proposal.reasons),
        }
