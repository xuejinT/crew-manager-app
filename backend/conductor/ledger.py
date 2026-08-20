"""The audit trail — append-only, redacted, and written before the act.

Why a second log when the gateway already has a SEL: the SEL records that a tool
was invoked, not *why the Conductor decided to invoke it*. The whole product in
``advisory`` mode is this file, and the Conductor slot's "why did you do X"
answer is read out of it rather than re-derived, so a row that omits the reason
list is a row that cost us the feature.

**The pairing is the mechanism, not bookkeeping.** One ``intent`` row is written
and fsynced BEFORE the side effect, one ``outcome`` row after, and both carry the
same ``action_id``. That ordering is what makes crash recovery possible at all:
after a restart, intents with no matching outcome are *exactly* the crash window
(:func:`unreconciled`), and the driver reconciles each one by observing reality —
does the slot exist, did the loop get armed, has the PR head moved. Written in
the other order, a crash would be indistinguishable from an action that never
started, and the only available recovery would be a blind retry of something that
may well have landed. That is why :func:`record_intent` returns only after the
row is durable, and why ``act.py`` is entitled to refuse a proposal whose intent
it could not persist.

BSC4's required security-log fields are adopted literally — user identification,
type of event, date and time, resource, origination, success/failure indication —
and its anti-pattern *"never log passwords, secrets or PII"* is binding, so every
free-text field goes through :func:`redact_field` on the way in. This is the same
chain ``watcher.py:80`` and ``autonudge_authz.py:251-253`` use, with one
deliberate divergence: the watcher returns text unchanged when the gateway's
redactors are missing, because its output lands in a transient bell. This file is
durable, greppable, and will be pasted into a ticket, so the local patterns run
unconditionally and the host chain is applied on top when it is importable.

Rows are never rewritten. A correction is a new row referring to the same
``action_id``.
"""

from __future__ import annotations

import asyncio
import contextlib
import logging
import os
import re
import time
from collections import OrderedDict
from pathlib import Path
from typing import Any

from . import store
from .intents import Decision, Proposal, Verdict

logger = logging.getLogger(__name__)

LEDGER_NAME = "ledger.jsonl"

# ── event_type: BSC4's "type of event", carrying the plan's four phases ───────
EVENT_INTENT = "intent"
"""About to act. Requires a terminal row with the same ``action_id``."""

EVENT_OUTCOME = "outcome"
"""The act finished, one way or another."""

EVENT_WOULD_DO = "would_do"
"""Proposed, never executed — the shape every row has in ``advisory`` mode.
Terminal on its own: nothing happened, so there is nothing to reconcile."""

EVENT_RECONCILED = "reconciled"
"""Written by the restart path for an intent whose outcome was lost, after the
driver *observed* what really happened. Closes the pair without re-dispatching."""

# ── outcome: BSC4's "success/failure indication" ──────────────────────────────
OUTCOME_SUCCESS = "success"
OUTCOME_FAILURE = "failure"
OUTCOME_DENIED = "denied"
OUTCOME_PENDING = "pending"
"""Not one of BSC4's three, and deliberately so. An ``intent`` row is written
before the effect exists, so its success is *unknown* at write time; stamping it
``success`` would be a lie that also destroys reconciliation, since "pending" is
the exact predicate :func:`unreconciled` searches for. The BSC4 trio remains the
only set a terminal row may use — see :data:`TERMINAL_OUTCOMES`."""

TERMINAL_OUTCOMES: frozenset[str] = frozenset(
    {OUTCOME_SUCCESS, OUTCOME_FAILURE, OUTCOME_DENIED}
)

ACTOR_CONDUCTOR = "conductor"
"""``user_id`` for anything the loop did on its own. An operator-initiated row
carries their identity instead: an autonomous act must never be
indistinguishable from a human click, in this file or in the SEL."""

#: Free text is capped, not just redacted. A model line or an exception string
#: can be enormous, and an audit file that becomes expensive to append to stops
#: being written honestly.
MAX_FIELD_CHARS = 400
MAX_REASONS = 12
MAX_RESOURCE_CHARS = 200

#: How many trailing rows :func:`unreconciled` and the ``action_id`` lookup will
#: scan. The crash window is minutes wide and a tick writes single-digit rows, so
#: this is orders of magnitude more than needed; it exists to bound the read.
SCAN_WINDOW = 4000

#: Rotate at 8 MB, keep 10 generations (plan). Rotation can only ever make
#: :func:`unreconciled` report FEWER open intents, never more — an intent whose
#: row rotated away is simply not reconciled, which fails toward "do nothing"
#: rather than toward a blind re-dispatch.
ROTATE_BYTES = 8 * 1024 * 1024
KEEP_ROTATIONS = 10

#: The last few intent rows, so pairing an outcome costs no read on the hot path.
#: A restart empties it and the file scan takes over, which is the only case that
#: needs to be correct rather than fast.
_INTENT_CACHE: OrderedDict[str, dict[str, Any]] = OrderedDict()
_INTENT_CACHE_MAX = 512


# ── redaction ────────────────────────────────────────────────────────────────

#: Labelled secrets: ``token=…``, ``Authorization: Bearer …``, ``password: …``.
#: The optional scheme word after the separator is load-bearing: without it
#: ``Authorization: Bearer abc.def.ghi`` matches only as far as ``Bearer`` and the
#: credential itself survives, which is precisely the header shape most likely to
#: be pasted into an error message.
_LABELLED_SECRET_RE = re.compile(
    r"(?i)\b(authorization|api[-_ ]?key|apikey|access[-_ ]?key|secret[-_ ]?key"
    r"|client[-_ ]?secret|private[-_ ]?key|password|passwd|pwd|token|auth[-_ ]?token"
    r"|session[-_ ]?token|refresh[-_ ]?token|credential)s?\b\s*[:=]\s*"
    r"(?:bearer|basic|token)?\s*\S+"
)

#: A scheme-prefixed value with no label in front of it.
_SCHEME_SECRET_RE = re.compile(
    r"(?i)\b(bearer|basic|token)\s+([A-Za-z0-9._~+/=-]{8,})"
)

#: Vendor-prefixed tokens, which are self-identifying and worth matching even
#: when they appear bare in a sentence.
_VENDOR_TOKEN_RE = re.compile(
    r"(?i)\b("
    r"gh[pousr]_[A-Za-z0-9]{16,}"
    r"|github_pat_[A-Za-z0-9_]{20,}"
    r"|glpat-[A-Za-z0-9_-]{16,}"
    r"|sk-(?:ant-)?[A-Za-z0-9_-]{16,}"
    r"|xox[baprs]-[A-Za-z0-9-]{10,}"
    r"|xapp-[A-Za-z0-9-]{10,}"
    r"|npm_[A-Za-z0-9]{20,}"
    r"|A(?:KIA|SIA)[0-9A-Z]{12,}"
    r"|AIza[0-9A-Za-z_-]{20,}"
    r"|eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}(?:\.[A-Za-z0-9_-]+)?"
    r")"
)

_PEM_RE = re.compile(
    r"-----BEGIN[^-]{0,64}-----.*?-----END[^-]{0,64}-----", re.DOTALL
)

#: Any long opaque token. See :func:`_scrub_blob` for the hex carve-out.
_BLOB_RE = re.compile(r"\b[A-Za-z0-9+/_=-]{32,}\b")
_HEX_RE = re.compile(r"\A[0-9a-fA-F]+\Z")

_TAG = "[redacted]"
_TRUNCATED = " …[truncated]"


def _scrub_blob(match: re.Match[str]) -> str:
    """Redact a long opaque token, but keep digests.

    A blanket "redact anything ≥32 of base64's alphabet" was the first version
    and it was wrong: ``facts_hash``, a ``failure_signature`` and a PR head SHA
    are all hex digests of exactly that length, they appear inside machine-derived
    reason clauses, and they are the *evidence* the reason list exists to carry.
    Redacting them leaves rows that say a goal made no progress without saying
    how that was determined.

    So: an all-hex run up to 64 characters (sha256's hex width) is kept; anything
    else long enough to be an opaque token is dropped. A hex-only secret longer
    than a sha256 digest still goes, and a 40-character mixed-alphabet blob — the
    shape of an AWS secret access key — is never mistaken for a digest.
    """
    text = match.group()
    if len(text) <= 64 and _HEX_RE.match(text):
        return text
    return _TAG


def _host_redact(text: str) -> str:
    """The gateway's own redaction chain, when it is importable.

    Guarded per house rule: an older or newer gateway that moved these symbols
    must cost us the extra pass, not the ledger.
    """
    try:
        from kiro_crew.security import redact_credentials, redact_exfiltration_urls
    except Exception:  # pragma: no cover - offline / gateway without the helpers
        return text
    # VERIFIED: kiro_crew/security.py:7394 redact_exfiltration_urls,
    # kiro_crew/security.py:8057 redact_credentials — both return (text, notes),
    # and this is the same order autonudge_authz.py:251-253 applies them in.
    try:
        out, _ = redact_exfiltration_urls(text)
        out, _ = redact_credentials(out)
    except Exception:  # pragma: no cover - never let a redactor bug lose the row
        logger.debug(
            "conductor: host redaction failed; local patterns stand", exc_info=True
        )
        return text
    return out


def redact_field(text: object, *, limit: int = MAX_FIELD_CHARS) -> str:
    """Make one free-text field safe to persist, then cap its length.

    Order matters and is copied from ``security.py:9075``'s ``redact_and_truncate``
    for the reason its docstring gives: redacting *after* truncating would slice a
    secret in half and leave a prefix that no longer matches any pattern, so the
    fragment escapes redaction entirely.

    Exported because :mod:`breaker` logs exception strings from subsystems like
    ``gh``, which is one of the likelier places a token shows up in a message.
    """
    raw = text if isinstance(text, str) else ("" if text is None else str(text))
    if not raw:
        return ""
    out = _PEM_RE.sub(_TAG, raw)
    out = _LABELLED_SECRET_RE.sub(lambda m: f"{m.group(1)}={_TAG}", out)
    out = _SCHEME_SECRET_RE.sub(lambda m: f"{m.group(1)} {_TAG}", out)
    out = _VENDOR_TOKEN_RE.sub(_TAG, out)
    out = _BLOB_RE.sub(_scrub_blob, out)
    out = _host_redact(out)
    out = " ".join(out.split())
    if len(out) > limit:
        out = out[: max(0, limit - len(_TRUNCATED))] + _TRUNCATED
    return out


# ── paths and rotation ───────────────────────────────────────────────────────

def ledger_path() -> Path:
    return store.conductor_dir() / LEDGER_NAME


def _rotated_path(index: int) -> Path:
    return store.conductor_dir() / f"{LEDGER_NAME}.{index}"


def _maybe_rotate(path: Path) -> None:
    """Roll the ledger when it passes :data:`ROTATE_BYTES`. Blocking.

    Held under the same sidecar lock ``store.append_jsonl`` takes, so a rotation
    cannot land between another writer's open and its write.
    """
    try:
        size = os.stat(path).st_size
    except OSError:
        return
    if size < ROTATE_BYTES:
        return
    with store.locked(path):
        try:  # re-check: another writer may have rotated while we waited
            if os.stat(path).st_size < ROTATE_BYTES:
                return
        except OSError:
            return
        with contextlib.suppress(OSError):
            oldest = _rotated_path(KEEP_ROTATIONS)
            if oldest.exists():
                oldest.unlink()
        for index in range(KEEP_ROTATIONS - 1, 0, -1):
            src, dst = _rotated_path(index), _rotated_path(index + 1)
            if src.exists():
                with contextlib.suppress(OSError):
                    os.replace(src, dst)
        with contextlib.suppress(OSError):
            os.replace(path, _rotated_path(1))
        logger.info("conductor: rotated ledger at %d bytes", size)


# ── row construction ─────────────────────────────────────────────────────────

def _resource(proposal: Proposal) -> str:
    """BSC4's "identity of the affected resource", in the shapes we actually act on.

    A slot key when there is one; otherwise whichever handle the class operates
    over. Falls back to empty rather than to a guess — an invented resource is
    worse than an absent one on a row someone is auditing.
    """
    if proposal.target_slot:
        return proposal.target_slot[:MAX_RESOURCE_CHARS]
    params = proposal.params if isinstance(proposal.params, dict) else {}
    for key in ("url", "pr_url", "job_id", "loop_id", "cron_id", "leaf_id"):
        value = params.get(key)
        if isinstance(value, str) and value.strip():
            return redact_field(value, limit=MAX_RESOURCE_CHARS)
    return ""


def _reasons(raw: object) -> list[str]:
    """Redact and cap the reason list. Never emitted empty if input was non-empty."""
    if not isinstance(raw, (list, tuple)):
        return []
    out: list[str] = []
    for item in list(raw)[:MAX_REASONS]:
        clause = redact_field(item)
        if clause:
            out.append(clause)
    return out


def _row(
    *,
    event_type: str,
    user_id: str,
    outcome: str,
    origin: str,
    resource: str,
    action_id: str,
    action_class: str,
    goal_id: str,
    signature: str,
    tier: str,
    verdict: str,
    reason: str,
    reasons: list[str],
    detail: str,
    ts: float | None = None,
) -> dict[str, Any]:
    """Every row carries every key, always. A reader must never branch on shape."""
    return {
        "ts": round(time.time() if ts is None else ts, 3),
        "event_type": event_type,
        "user_id": user_id,
        "outcome": outcome,
        "origin": origin,
        "resource": resource,
        "action_id": action_id,
        "action_class": action_class,
        "goal_id": goal_id,
        "signature": signature,
        "tier": tier,
        "verdict": verdict,
        "reason": reason,
        "reasons": reasons,
        "detail": detail,
    }


def _cache_intent(row: dict[str, Any]) -> None:
    action_id = str(row.get("action_id") or "")
    if not action_id:
        return
    _INTENT_CACHE[action_id] = row
    _INTENT_CACHE.move_to_end(action_id)
    while len(_INTENT_CACHE) > _INTENT_CACHE_MAX:
        _INTENT_CACHE.popitem(last=False)


def _intent_row(action_id: str) -> dict[str, Any]:
    """The intent this outcome belongs to: memory first, then the file tail."""
    cached = _INTENT_CACHE.get(action_id)
    if cached is not None:
        return cached
    for row in reversed(store.read_jsonl(ledger_path(), limit=SCAN_WINDOW)):
        if row.get("action_id") == action_id and row.get("event_type") in (
            EVENT_INTENT,
            EVENT_WOULD_DO,
        ):
            return row
    return {}


# ── writing ──────────────────────────────────────────────────────────────────

def record_intent(
    decision: Decision, *, user_id: str = ACTOR_CONDUCTOR, strict: bool = False
) -> str:
    """Write the pre-action row and return its ``action_id``. Blocking.

    Returns only once the row is fsynced (``store.append_jsonl``), because that
    durability is exactly what ``act.py`` is allowed to rely on before it causes
    a side effect (invariant I3). A refused or merely-proposed decision is
    terminal here — it gets a ``would_do`` row and never a second one.

    *strict* is how a caller enforces I3 rather than merely believing it: with
    ``strict=True`` a row that could not be persisted returns ``""``, and the
    caller must refuse the action. It is opt-in because the two callers want
    opposite failure modes — the executor of a turn-dispatching class must not act
    unrecorded (audit-or-deny, the same shape as ``act.py``'s ``critical=True``
    SEL write for those classes), while the report step logging a ``would_do``
    row would rather lose the row than lose the operator's notification. The
    alternative, raising, was rejected: an exception from the audit path lands
    inside a tick that is mid-queue, and "the disk is full" would then also cost
    every later proposal in that queue.
    """
    proposal = decision.proposal
    verdict = decision.verdict
    acting = verdict is Verdict.ACT
    if acting:
        event_type, outcome = EVENT_INTENT, OUTCOME_PENDING
    elif verdict is Verdict.REFUSE:
        event_type, outcome = EVENT_WOULD_DO, OUTCOME_DENIED
    else:
        # PROPOSE / ESCALATE: nothing was executed, but the event being recorded
        # is "this was surfaced to the operator", and that did complete.
        event_type, outcome = EVENT_WOULD_DO, OUTCOME_SUCCESS

    row = _row(
        event_type=event_type,
        user_id=user_id or ACTOR_CONDUCTOR,
        outcome=outcome,
        origin=f"conductor:{proposal.goal_id}",
        resource=_resource(proposal),
        action_id=proposal.action_id,
        action_class=proposal.action_class,
        goal_id=proposal.goal_id,
        signature=proposal.signature,
        tier=decision.tier.value,
        verdict=verdict.value,
        reason=redact_field(decision.reason),
        reasons=_reasons(proposal.reasons),
        detail=redact_field(proposal.idempotency_key(), limit=MAX_RESOURCE_CHARS),
    )
    durable = _append(row)
    if acting:
        _cache_intent(row)
    if strict and not durable:
        return ""
    return proposal.action_id


def record_outcome(
    action_id: str,
    *,
    outcome: str,
    detail: str = "",
    event_type: str = EVENT_OUTCOME,
) -> None:
    """Write the post-action row for *action_id*. Blocking.

    Identity fields are inherited from the intent rather than re-supplied by the
    caller: ``act.py`` has the ``action_id`` in hand at the point it learns the
    result, and asking it to thread goal/class/resource through again is how the
    two halves of a pair end up disagreeing. A pair whose intent cannot be found
    is still written — losing the outcome of something that DID happen is the one
    outcome worse than an incomplete row.

    *event_type* exists for the restart path, which writes
    :data:`EVENT_RECONCILED` after observing reality.
    """
    if outcome not in TERMINAL_OUTCOMES:
        logger.warning(
            "conductor: ledger outcome %r is not terminal; recording failure", outcome
        )
        detail = f"{detail} (bad outcome {outcome!r})".strip()
        outcome = OUTCOME_FAILURE
    intent = _intent_row(str(action_id or ""))
    summary = redact_field(detail, limit=160)
    row = _row(
        event_type=event_type,
        user_id=str(intent.get("user_id") or ACTOR_CONDUCTOR),
        outcome=outcome,
        origin=str(intent.get("origin") or f"conductor:{intent.get('goal_id', '')}"),
        resource=str(intent.get("resource") or ""),
        action_id=str(action_id or ""),
        action_class=str(intent.get("action_class") or ""),
        goal_id=str(intent.get("goal_id") or ""),
        signature=str(intent.get("signature") or ""),
        tier=str(intent.get("tier") or ""),
        verdict=str(intent.get("verdict") or ""),
        reason=f"{outcome}: {summary}" if summary else outcome,
        reasons=[] if intent else ["intent row not found in scan window"],
        detail=redact_field(detail),
    )
    _append(row)
    _INTENT_CACHE.pop(str(action_id or ""), None)


def _append(row: dict[str, Any]) -> bool:
    """Rotate if needed, then append+fsync. Returns whether the row is durable.

    The exception is caught rather than propagated — a full disk must not turn
    into a raise inside a tick that is halfway through its queue — but it is
    *reported*, because a swallowed failure that nobody can observe is how an
    action ends up taken with no row naming it. ``record_intent(strict=True)``
    turns that boolean into the refusal invariant I3 asks for.
    """
    path = ledger_path()
    try:
        _maybe_rotate(path)
        store.append_jsonl(path, row)
    except Exception:
        logger.exception("conductor: FAILED to write ledger row %s", row.get("action_id"))
        return False
    return True


# ── reading ──────────────────────────────────────────────────────────────────

def tail(limit: int = 100, *, goal_id: str = "") -> list[dict[str, Any]]:
    """The most recent rows, oldest-first, optionally for one goal.

    Reads only the live file: a rotated generation is for forensics, and making
    the UI's default view depend on how recently rotation happened would make the
    row count jump around for no reason the operator can see.
    """
    limit = max(1, int(limit))
    if not goal_id:
        return store.read_jsonl(ledger_path(), limit=limit)
    # Filtering after a tail read would return far fewer than `limit` rows for a
    # quiet goal, so widen the scan and slice afterwards.
    window = min(SCAN_WINDOW, limit * 20)
    rows = [r for r in store.read_jsonl(ledger_path(), limit=window)
            if r.get("goal_id") == goal_id]
    return rows[-limit:]


def _open_intents(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Intent rows in *rows* with no terminal partner, oldest first.

    ``would_do`` rows are excluded by construction — nothing was executed, so
    there is nothing to observe. Only rows the gate stamped ACT can be open.
    """
    open_by_id: dict[str, dict[str, Any]] = {}
    for row in rows:
        action_id = row.get("action_id")
        if not isinstance(action_id, str) or not action_id:
            continue
        event_type = row.get("event_type")
        if event_type == EVENT_INTENT:
            open_by_id[action_id] = row
        elif event_type in (EVENT_OUTCOME, EVENT_RECONCILED):
            open_by_id.pop(action_id, None)
    return sorted(open_by_id.values(), key=lambda r: float(r.get("ts") or 0.0))


def unreconciled(limit: int = 200) -> list[dict[str, Any]]:
    """Intents with no outcome — precisely the crash window.

    Oldest first, because that is the order the restart path wants to reconcile
    in: the earliest unresolved action is the one whose observable evidence is
    most likely to have been overwritten by later work.
    """
    rows = store.read_jsonl(ledger_path(), limit=SCAN_WINDOW)
    return _open_intents(rows)[: max(1, int(limit))]


def stats() -> dict[str, Any]:
    """Cheap counters for the status route. One read, bounded by SCAN_WINDOW."""
    rows = store.read_jsonl(ledger_path(), limit=SCAN_WINDOW)
    by_event: dict[str, int] = {}
    by_outcome: dict[str, int] = {}
    for row in rows:
        event = str(row.get("event_type"))
        outcome = str(row.get("outcome"))
        by_event[event] = by_event.get(event, 0) + 1
        by_outcome[outcome] = by_outcome.get(outcome, 0) + 1
    return {
        "path": str(ledger_path()),
        "scanned": len(rows),
        "by_event_type": by_event,
        "by_outcome": by_outcome,
        "unreconciled": len(_open_intents(rows)),
        "last_ts": float(rows[-1].get("ts") or 0.0) if rows else 0.0,
    }


# ── async variants: the fsync never runs on the gateway's event loop ─────────

async def record_intent_async(
    decision: Decision, *, user_id: str = ACTOR_CONDUCTOR, strict: bool = False
) -> str:
    return await asyncio.to_thread(
        record_intent, decision, user_id=user_id, strict=strict
    )


async def record_outcome_async(
    action_id: str,
    *,
    outcome: str,
    detail: str = "",
    event_type: str = EVENT_OUTCOME,
) -> None:
    await asyncio.to_thread(
        record_outcome, action_id, outcome=outcome, detail=detail, event_type=event_type
    )


async def tail_async(limit: int = 100, *, goal_id: str = "") -> list[dict[str, Any]]:
    return await asyncio.to_thread(tail, limit, goal_id=goal_id)


async def unreconciled_async(limit: int = 200) -> list[dict[str, Any]]:
    return await asyncio.to_thread(unreconciled, limit)


async def stats_async() -> dict[str, Any]:
    return await asyncio.to_thread(stats)
