"""Adjudicate a worker's tool-approval requests so a human does not have to.

An unattended worker parks on every tool call it makes: the platform appends a
``permission`` row, registers a future in ``slot._approval_futures`` and waits.
Nobody answers, and the unattended deny-fast rejects it after 180s — which is
how a briefed worker ends a turn having written nothing.

The previous answer was a blanket grant (``scope.worker_trust``): the operator
declared "trust this goal's workers" and the executor flipped the slot's trust
flag at creation. That works, and it is also the bluntest instrument available —
one declaration and every later tool call, including ones nobody anticipated,
is approved unseen. This module is the sharper one: the Conductor reads each
request and answers *that* request.

**Where the authority actually lives.** Not in the model. The decision is a
three-way deterministic classification first:

* :data:`DENY_RULES` — a fixed table of patterns that are never auto-approved.
  Credentials, the platform's own state directory, privilege escalation,
  destructive removals, process and host control, network egress, dependency
  installs, cloud mutations, publish/merge. Checked before anything else and
  never reachable past this point, so no model output and no prompt injected
  into a command can turn one of these into an approval.
* :data:`_READ_BASE`, :data:`_WRITE_BASE`, :data:`_RUN_BASE` plus path scoping — read-only inspection, and mutation
  confined to the goal's own root or the session's own sandbox. This is the
  overwhelming majority of a build worker's traffic and it is answered without a
  model call at all.
* everything else — one schema-validated model call (:func:`judge.judge_tool_call`)
  that may answer only ``allow`` or ``deny``. It is consulted *after* the deny
  table has already excluded the dangerous classes, so the worst a compromised
  or confused verdict can do is permit something already known to be
  root-scoped and non-destructive, or refuse something harmless.

**Escalation never blocks.** A class the operator should really decide
(publish, merge, dependency installs — see ARCC BSC2, which reserves
two-person approval for high-impact operations) is *rejected now* and recorded
as an escalation. A rejection is not fatal: it returns to the agent, which
adapts. Leaving the future unresolved instead would park the worker until the
platform's deny-fast rejected it anyway, 180 seconds later, having stalled the
goal for nothing. So the operator gets a durable row to act on and the build
keeps moving — which is the point of the whole loop.

**The command text is untrusted input.** It was produced by a model that may
itself have been steered. The deny table matches on it, the judge prompt fences
it and is told to treat it as data, and the judge's answer is intersected with
the same deterministic rules that ran before it (ARCC BSC1's prompt-attack
guidance, applied at the only layer we control).
"""

from __future__ import annotations

import logging
import os
import re
import shlex
from dataclasses import dataclass, field
from typing import Any

logger = logging.getLogger(__name__)

#: Verdicts. ``escalate`` rejects the call *and* raises a row for the operator;
#: it is not a third wire protocol state — the platform only knows approve and
#: reject.
ALLOW = "allow"
DENY = "deny"
ESCALATE = "escalate"

#: Provisioning posture. ``local`` lets a worker obtain a dependency the task
#: genuinely needs — clone it, download it, pip-install it — as long as it lands in
#: the goal's own tree and needs no privilege. ``off`` keeps the old refusal.
#:
#: The distinction that matters is NOT "install or not". It is *where it lands*,
#: *whether it needs root*, and *whether the code is executed unreviewed*:
#:
#: * into the goal's tree, unprivileged  → allowed under ``local``. Reversible by
#:   deleting the tree, and confined to what the goal already owns.
#: * system-wide, or via a root package manager (yum/apt/dnf/brew), or ``sudo``
#:   → DENIED under every mode. That is a change to the host, not to the task.
#: * ``curl | sh`` → DENIED under every mode. That is executing unreviewed code
#:   straight off the network, which is the actual supply-chain risk rather than
#:   the proxy for it.
#:
#: Amazon's governed path for third-party code is BTPT/NPMPM/Peru with a Shinrai
#: scan (ARCC BSC14, BSC7). That governs code that ships. A local throwaway POC
#: fetching a test opponent is outside that, and the operator has said so — but it
#: is a deliberate deviation, so the driver announces the posture once per run
#: rather than fetching quietly.
PROVISION_LOCAL = "local"
PROVISION_OFF = "off"

#: Deny rules that a ``local`` posture lifts. Everything else in the table holds.
#: ``system-package``, ``sudo``, ``pipe-to-shell`` and every credential rule are
#: deliberately absent: none of them is a local install.
_PROVISION_EXEMPT: frozenset[str] = frozenset({"package-install", "http-egress"})

#: How many requests we answer in one pass. A parked worker is cheap to leave
#: for one more tick; an unbounded loop over a pathological transcript is not.
MAX_PER_PASS = 12

#: How many of those may cost a model call. The judge has its own per-tick cap;
#: this one keeps a single noisy worker from spending the whole budget.
MAX_JUDGED_PER_PASS = 2


def _rx(pattern: str) -> re.Pattern[str]:
    return re.compile(pattern, re.IGNORECASE)


#: ``(name, pattern, escalate)``. Order is not significant — every rule is
#: tried and the first match wins only in the sense that one match is enough.
#:
#: ``escalate=True`` marks a class a human might legitimately want to permit, so
#: it produces an operator row as well as the rejection. ``escalate=False`` is a
#: flat refusal: there is no version of this the Conductor should be arranging on
#: its own behalf, and pestering the operator about it is noise.
DENY_RULES: tuple[tuple[str, re.Pattern[str], bool], ...] = (
    # ── credentials and other people's secrets ──────────────────────────────
    ("aws-credentials", _rx(r"(^|[\s/'\"])~?/?\.aws(/|\b)"), False),
    ("ssh-keys", _rx(r"(^|[\s/'\"])~?/?\.ssh(/|\b)|id_rsa|id_ed25519"), False),
    ("netrc", _rx(r"\.netrc\b"), False),
    ("dotenv", _rx(r"(^|[\s/'\"])\.env(\.|\b)"), False),
    ("credential-file", _rx(r"\bcredentials?\b\s*$|/credentials\b"), False),
    ("private-key", _rx(r"BEGIN [A-Z ]*PRIVATE KEY|\.pem\b|\.p12\b"), False),
    # The platform's own state: session transcripts, tokens, app data. A worker
    # editing this is editing the machinery that supervises it.
    ("platform-state", _rx(r"\.kiro/crew|mc_token|kirocrew\.service"), False),
    # ── privilege ───────────────────────────────────────────────────────────
    ("sudo", _rx(r"(^|[\s;&|])sudo(\s|$)|(^|[\s;&|])su\s+-"), False),
    ("chmod-world", _rx(r"chmod\s+(-[a-zA-Z]+\s+)*[0-7]*77[0-7]?\b"), False),
    ("chown", _rx(r"(^|[\s;&|])chown(\s|$)"), False),
    # ── destruction outside a scratch tree ──────────────────────────────────
    ("rm-rf-root", _rx(r"rm\s+(-[a-zA-Z]*\s+)*-?[a-zA-Z]*[rf][a-zA-Z]*\s+(/|~|\$HOME)\s*$"), False),
    ("disk-write", _rx(r"\bmkfs|\bdd\s+if=|\bshred\b|\btruncate\s+-s"), False),
    ("git-force-push", _rx(r"git\s+push\b.*(--force|-f)\b"), False),
    ("history-rewrite", _rx(r"git\s+(filter-branch|filter-repo)\b"), False),
    # ── host and process control ─────────────────────────────────────────────
    ("service-control", _rx(r"\bsystemctl\b|\bservice\s+\w+\s+(stop|restart)|\breboot\b|\bshutdown\b"), False),
    ("kill", _rx(r"\bpkill\b|\bkillall\b|\bkill\s+-9\b"), False),
    ("scheduler", _rx(r"\bcrontab\b|\bat\s+now\b"), False),
    # ── network egress ──────────────────────────────────────────────────────
    # Exfiltration and unreviewed code intake share this wire. A build worker
    # for a from-scratch, standard-library-only task has no business on it.
    # Uploading is not provisioning. `curl -d @file`, `-T`, `-F` and friends send
    # local bytes OUT, which is the exfiltration shape the egress rule exists for —
    # so this one is never lifted by the provisioning posture; only inbound fetches
    # are. It sits BEFORE ``http-egress`` because attribution is first-match and
    # this is the more specific reading: an operator reading "egress-upload" learns
    # something "http-egress" would not have told them.
    ("egress-upload", _rx(
        r"\b(curl|wget)\b[^|;&]*(\s-(d|F|T)\b|--data\b|--data-\w+|--form\b|"
        r"--upload-file\b|--post-file\b|--mail-\w+)"
    ), False),
    ("http-egress", _rx(r"(^|[\s;&|(])(curl|wget)(\s|$)"), False),
    ("remote-shell", _rx(r"(^|[\s;&|(])(ssh|scp|sftp|telnet|nc|ncat)(\s|$)"), False),
    ("pipe-to-shell", _rx(r"\|\s*(sudo\s+)?(ba)?sh\b"), False),
    # ── supply chain: an install is a dependency decision, not a build step ──
    ("package-install", _rx(r"\b(pip3?|pipx|npm|yarn|pnpm|gem|cargo|go)\s+(install|add|get)\b"), True),
    ("system-package", _rx(r"\b(apt|apt-get|yum|dnf|brew|snap)\s+(install|remove|update|upgrade)\b"), False),
    # ── cloud mutation ──────────────────────────────────────────────────────
    (
        "aws-mutation",
        _rx(
            r"\baws\s+[\w-]+\s+"
            r"(create|delete|put|update|terminate|modify|attach|detach|remove|stop|start|reboot|"
            r"associate|disassociate|enable|disable|revoke|authorize|tag|untag|restore|invoke)"
        ),
        False,
    ),
    ("iac-apply", _rx(r"\b(terraform|cdk|cfn)\s+(apply|deploy|destroy)\b"), False),
    # ── publishing: outward-facing and hard to take back ────────────────────
    ("git-push", _rx(r"git\s+push\b"), True),
    ("pr-write", _rx(r"\bgh\s+pr\s+(create|merge|close|edit)\b|\bcr\s+(submit|publish)\b"), True),
    ("release", _rx(r"\b(npm|twine)\s+publish\b|\bgh\s+release\s+create\b"), True),
)

#: Base commands that only read. Approved anywhere — a worker that can read the
#: tree it was pointed at is the premise of the whole arrangement, and the deny
#: table above has already carved out the paths where reading is the problem.
_READ_BASE: frozenset[str] = frozenset({
    "ls", "cat", "head", "tail", "wc", "file", "stat", "du", "df", "pwd", "echo",
    "grep", "egrep", "fgrep", "rg", "find", "which", "type", "sort", "uniq", "cut",
    "tr", "sed", "awk", "diff", "cmp", "basename", "dirname", "realpath", "env",
    "date", "true", "false", "printf", "tree", "nl", "less", "more", "jq", "column",
})

#: Base commands that write, and are allowed when every path they touch is
#: inside the goal root or the session's own sandbox.
_WRITE_BASE: frozenset[str] = frozenset({
    "mkdir", "touch", "cp", "mv", "rm", "rmdir", "tee", "ln", "chmod",
})

#: Build and test runners. Confined by the same path scoping as writes: these
#: execute code from the tree, so the tree has to be one we put them in.
_RUN_BASE: frozenset[str] = frozenset({
    "python", "python3", "pytest", "unittest", "make", "sh", "bash", "node", "npx",
    "coverage", "ruff", "mypy", "black", "flake8", "isort", "cargo", "go", "javac",
    "java", "gcc", "g++", "cmake", "ctest", "timeout", "xargs", "time", "nice",
})

#: Shell control structures and test builtins. A `for p in /usr/bin/x ...; do
#: [ -x "$p" ] && echo found; done` probe splits into segments whose bases are
#: `for`, `do`, `[`, `echo`, `done` — none of which were in any table, so each was
#: "unknown", which defaulted to "this can write", which triggered path scoping,
#: which refused a pure existence check with "would write outside the goal's tree".
#: They write nothing; the commands they contain are separate segments and are
#: classified on their own.
_SHELL_KEYWORDS: frozenset[str] = frozenset({
    "for", "do", "done", "if", "then", "elif", "else", "fi", "while", "until",
    "case", "esac", "in", "[", "[[", "test", "read", "shift", "continue", "break",
})

#: Navigation and shell bookkeeping. Present because a real command is a
#: PIPELINE — the first thing a worker briefed with "work in <root>" runs is
#: ``cd <root> && ls && git status``, and a classifier that only understood
#: single commands refused it, which is how this list came to be written.
_NAV_BASE: frozenset[str] = frozenset({
    "cd", "pushd", "popd", "export", "set", "unset", "umask", ":",
})

#: Fetchers and package managers. Allowed only under a ``local`` posture, and
#: always as WRITES, so path scoping confines what they leave behind to the tree.
_PROVISION_BASE: frozenset[str] = frozenset({
    "curl", "wget", "pip", "pip3", "pipx", "npm", "yarn", "pnpm", "cargo", "gem",
})

#: Git subcommands that stay local. ``push`` is absent by construction — it is
#: in the deny table, and a second listing here would be a second place to get
#: it wrong.
_GIT_LOCAL: frozenset[str] = frozenset({
    "status", "diff", "log", "show", "add", "commit", "init", "branch", "checkout",
    "switch", "restore", "rm", "mv", "stash", "tag", "config", "rev-parse",
    "ls-files", "blame", "describe", "remote", "fetch", "merge", "rebase", "cherry-pick",
    "apply", "clean", "reflog", "worktree", "bisect", "shortlog", "count-objects",
})

#: Git subcommands that reach the network. Gated on the provisioning posture like
#: any other fetch — a clone is how a source dependency arrives, so allowing it
#: while `provisioning=off` refused pip would be two answers to one question.
_GIT_FETCHES: frozenset[str] = frozenset({"clone"})


@dataclass(frozen=True)
class PendingApproval:
    """One unanswered tool request, flattened out of the platform's structures."""

    slot_name: str
    request_id: str
    title: str
    full_command: str
    base_command: str
    tool_input: str
    is_read_only: bool
    goal_id: str = ""
    leaf_id: str = ""

    @property
    def text(self) -> str:
        """Everything the request says, for pattern matching in one place."""
        return "\n".join(p for p in (self.title, self.full_command, self.tool_input) if p)

    @property
    def label(self) -> str:
        return f"{self.slot_name}:{self.request_id[:8]}"


@dataclass(frozen=True)
class Ruling:
    """The answer, and why. ``judged`` records whether a model was consulted."""

    kind: str
    rule: str
    why: str
    judged: bool = False

    @property
    def approved(self) -> bool:
        return self.kind == ALLOW


@dataclass
class Pass:
    """What one adjudication pass did, for the tick summary and the ledger."""

    allowed: int = 0
    denied: int = 0
    escalated: int = 0
    judged: int = 0
    rows: list[dict[str, Any]] = field(default_factory=list)

    @property
    def total(self) -> int:
        return self.allowed + self.denied + self.escalated

    def summary(self) -> dict[str, Any]:
        out: dict[str, Any] = {"decided": self.total}
        if self.allowed:
            out["allowed"] = self.allowed
        if self.denied:
            out["denied"] = self.denied
        if self.escalated:
            out["escalated"] = self.escalated
        if self.judged:
            out["judged"] = self.judged
        return out


# ── reading the platform's pending state ─────────────────────────────────────


def _permission_meta(slot: Any, request_id: str) -> dict[str, Any]:
    """The ``permission`` row's metadata for *request_id*, newest first.

    Mirrors ``chat_handlers._get_pattern_from_pending`` (which pulls one field at
    a time) — we want the whole card, so we walk the same rows and parse once.
    """
    import json

    for msg in reversed(list(getattr(slot, "messages", None) or [])):
        if msg.get("role") != "permission":
            continue
        raw = msg.get("cls")
        if not raw:
            continue
        try:
            meta = json.loads(raw)
        except (ValueError, TypeError):
            continue
        if isinstance(meta, dict) and meta.get("request_id") == request_id:
            return meta
    return {}


def scan_pending(state: Any, *, slot_prefix: str) -> list[PendingApproval]:
    """Every unanswered request on a slot this app owns.

    Scoped by slot name on purpose. The Conductor answers for the workers it
    created and for nothing else: a human's own session parked on an approval is
    the human's to answer, and silently answering it would be the Conductor
    reaching outside its goal.
    """
    out: list[PendingApproval] = []
    slots = getattr(state, "_slots", None) or {}
    for name, slot in list(slots.items()):
        if not str(name).startswith(slot_prefix):
            continue
        futures = getattr(slot, "_approval_futures", None) or {}
        for request_id, fut in list(futures.items()):
            try:
                if fut is None or fut.done():
                    continue
            except Exception:  # pragma: no cover - defensive
                continue
            meta = _permission_meta(slot, str(request_id))
            if meta.get("resolved"):
                continue
            goal_id, leaf_id = _split_slot_name(str(name), slot_prefix)
            out.append(
                PendingApproval(
                    slot_name=str(name),
                    request_id=str(request_id),
                    title=str(meta.get("tool_title") or ""),
                    full_command=str(meta.get("full_command") or ""),
                    base_command=str(meta.get("base_command") or ""),
                    tool_input=str(meta.get("tool_input") or ""),
                    is_read_only=bool(meta.get("is_read_only")),
                    goal_id=goal_id,
                    leaf_id=leaf_id,
                )
            )
            if len(out) >= MAX_PER_PASS:
                return out
    return out


def _split_slot_name(name: str, prefix: str) -> tuple[str, str]:
    """``cm-<goal>-<leaf>`` back into its parts, best effort.

    Both halves can contain dashes, so this cannot be exact. It is used for
    labelling only — never for authority, which is keyed on the slot name the
    scan already matched.
    """
    rest = name[len(prefix):] if name.startswith(prefix) else name
    return rest, ""


# ── the deterministic classifier ─────────────────────────────────────────────


def deny_rule(text: str, *, provisioning: str = PROVISION_LOCAL) -> tuple[str, bool] | None:
    """The first deny rule *text* trips, or ``None``.

    Public because it is the one function the tests pin hardest: every rule in
    the table has to be reachable, and nothing in the allow paths may run before
    this has been consulted.
    """
    for name, pattern, escalate in DENY_RULES:
        if provisioning == PROVISION_LOCAL and name in _PROVISION_EXEMPT:
            continue
        if pattern.search(text):
            return name, escalate
    return None


def _tokens(command: str) -> list[str]:
    try:
        return shlex.split(command)
    except ValueError:
        # Unbalanced quotes — fall back to whitespace so we still see the shape.
        return command.split()


def _base_of(command: str) -> str:
    for tok in _tokens(command):
        if "=" in tok and not tok.startswith("-") and not tok.startswith("/"):
            continue  # VAR=value prefix
        return tok.rsplit("/", 1)[-1]
    return ""


_PATH_RE = re.compile(r"(?:^|[\s=:'\"(])((?:/|~/)[^\s'\";|&)]*)")


def _forms(path: str) -> tuple[str, ...]:
    """A path as written AND as the filesystem resolves it.

    Both are needed because containment here is a string comparison over two
    names for the same directory. On this host ``/home/<user>`` is a symlink to
    ``/local/home/<user>``: the operator declares the root one way, the worker's
    shell reports it the other, and comparing the two as plain text called every
    write inside the goal's own tree an escape. Observed, not theorised — it
    refused ``chess_engine/__init__.py`` in the goal root.

    ``realpath`` is the containment-safe direction: a symlink *inside* the root
    that points out of it resolves to its target and is then correctly seen as
    outside. The raw form is kept as well so a path that does not exist yet — the
    normal case for a file about to be created — still matches its declared root.
    """
    out = [path]
    try:
        real = os.path.realpath(os.path.expanduser(path))
        if real != path:
            out.append(real)
    except (OSError, ValueError):  # pragma: no cover - defensive
        pass
    return tuple(out)


def _inside(path: str, roots: tuple[str, ...]) -> bool:
    """True when *path* sits in one of *roots*, under any name either has."""
    candidates = _forms(path)
    for root in roots:
        if not root:
            continue
        for root_form in _forms(root):
            stem = root_form.rstrip("/")
            if any(c == stem or c.startswith(stem + "/") for c in candidates):
                return True
    return False


def paths_outside(text: str, roots: tuple[str, ...]) -> list[str]:
    """Absolute paths in *text* that are not inside any of *roots*.

    Relative paths are not examined: the worker's cwd is the sandbox and the
    brief names the root, so a bare ``chess_engine/board.py`` is in-scope by
    construction. An absolute path is the way out of scope, so that is what we
    look for.
    """
    home = ("/home/", "/local/home/")
    out: list[str] = []
    for raw in _PATH_RE.findall(text):
        path = raw.rstrip("/.,;")
        if not path or len(path) < 2:
            continue
        if _inside(path, roots):
            continue
        # A URL is not a filesystem path. `https://host/p` leaves `//host/p` after
        # the colon, which this regex matches — so scoping a download would have
        # refused the download's own URL as an out-of-tree write.
        if path.startswith("//"):
            continue
        # /dev/null and friends are not an escape.
        if path.startswith(("/dev/null", "/dev/stdout", "/dev/stderr", "/tmp/")):
            continue
        # A bare home reference with nothing after it is noise from prose.
        if path in ("~", "~/") or (path in home):
            continue
        # De-duplicated, order preserved: `text` is title + command + tool_input,
        # which are three views of ONE command, so every path was being reported
        # three times in the reason the operator reads.
        if path not in out:
            out.append(path)
    return out


#: The platform titles every tool call, and the verb says what kind of tool it is.
#: ``Running: <cmd>`` is a shell command; the rest are structured file tools whose
#: ``tool_input`` is CONTENT, not a command.
_TITLE_SHELL = re.compile(r"^\s*Running:\s*(?P<cmd>.+)$", re.S | re.I)
_TITLE_READ = re.compile(
    r"^\s*(?:Reading|listing|Listing|Searching|Grepping|Finding|Viewing)\b(?P<rest>.*)$", re.S
)
_TITLE_WRITE = re.compile(
    r"^\s*(?:Creating|Writing|Editing|Updating|Appending(?:\s+to)?|Replacing(?:\s+in)?|"
    r"Deleting|Removing|Moving|Renaming)\b(?P<rest>.*)$",
    re.S,
)

#: Tool kinds this module distinguishes.
KIND_SHELL = "shell"
KIND_READ = "read"
KIND_WRITE = "write"
KIND_OTHER = "other"


def tool_shape(pa: PendingApproval) -> tuple[str, str]:
    """``(kind, subject)`` — what sort of tool this is, and the text to judge.

    **This is the fix for the worst false denial this module produced.** A file
    write's ``tool_input`` is the FILE'S CONTENTS. Treating that as a command meant
    the deny table and the path scoping were reading source code: a harness that
    contained the literal ``/usr/local/bin/stockfish`` (a path it probes at
    runtime) was refused with "would write outside the goal's tree" — while
    actually writing one file, inside the tree. Any file mentioning ``.env`` or
    ``~/.aws`` in a comment would have been refused the same way.

    So the subject depends on the kind:

    * ``shell`` — the command after ``Running:``. Judge the command.
    * ``write`` — the target path(s) from the title. Judge WHERE it writes, never
      what it writes. A file's contents are data; the next step that *executes*
      them is itself adjudicated, which is where execution belongs.
    * ``read`` — the title. Reads are allowed anywhere the deny table permits.
    * ``other`` — the title, and nothing is assumed about it.
    """
    title = (pa.title or "").strip()
    shell = _TITLE_SHELL.match(title)
    if shell:
        return KIND_SHELL, shell.group("cmd").strip()
    # `Running:` with nothing after it is an EMPTY shell command, which must be
    # refused as unreadable — not mistaken for some unknown structured tool and
    # sent to the judge.
    if re.match(r"^\s*Running:\s*$", title, re.I):
        return KIND_SHELL, ""
    # A bash tool whose title the platform did not prefix: fall back to the
    # extracted command, which only bash tools have.
    if pa.full_command.strip() and not title:
        return KIND_SHELL, pa.full_command.strip()
    write = _TITLE_WRITE.match(title)
    if write:
        return KIND_WRITE, write.group("rest").strip() or title
    read = _TITLE_READ.match(title)
    if read:
        return KIND_READ, title
    return KIND_OTHER, title


def mutates(command: str, provisioning: str = PROVISION_LOCAL) -> bool:
    """Whether any RECOGNISED stage of *command* can change something.

    Shared by :func:`classify` and the judge's post-check so the two can never
    disagree about whether path scoping applies. Only recognised stages count: an
    unclassified one is a question for the judge, not grounds for asserting that a
    command writes somewhere.
    """
    for seg in _segments(command):
        kind, _rule, seg_writes = _segment_kind(seg, provisioning)
        if kind == ALLOW and seg_writes:
            return True
    return False


def classify(
    pa: PendingApproval, *, roots: tuple[str, ...], provisioning: str = PROVISION_LOCAL
) -> Ruling:
    """Answer *pa* without a model, or return a ``Ruling`` asking for one.

    The order here is the security property: the deny table runs first, on the
    whole request text, and nothing below it can revisit that answer.
    """
    kind, subject = tool_shape(pa)
    if not subject.strip():
        # Nothing to reason about. Refusing an unreadable request is the only
        # honest answer — approving one is approving something unseen.
        return Ruling(DENY, "unreadable", "the request carried no readable subject")

    # The deny table runs on the SUBJECT, not on everything the card carries. For a
    # shell command those are the same thing; for a file write the difference is the
    # whole point — see :func:`tool_shape`.
    hit = deny_rule(subject, provisioning=provisioning)
    if hit is not None:
        name, escalate = hit
        why = f"matched the {name} rule, which is never auto-approved"
        return Ruling(ESCALATE if escalate else DENY, name, why)

    if kind == KIND_READ:
        return Ruling(ALLOW, "read-tool", "a read, and it touches no denied path")

    if kind == KIND_WRITE:
        outside = paths_outside(subject, roots)
        if outside:
            return Ruling(
                DENY,
                "outside-root",
                f"would write outside the goal's tree: {', '.join(outside[:3])}",
            )
        # A relative target is inside the tree by construction: the worker's cwd is
        # its sandbox and the brief names the root.
        return Ruling(ALLOW, "write-in-root", "writes one file inside the goal's tree")

    if kind == KIND_OTHER:
        return Ruling("", "unrecognised-tool", f"no rule covers {subject[:40]!r}")

    command = subject
    if pa.is_read_only:
        # The platform computed this from the command itself. Trusting it here is
        # not a widening: the deny table has already run over the same text.
        return Ruling(ALLOW, "read-only", "reads only, and touches no denied path")

    segments = _segments(command)
    if not segments:
        return Ruling("", "no-base", "could not identify the command")

    # Every segment must be recognised. A pipeline is only as safe as the least
    # safe thing in it, so one unknown stage makes the whole request unknown —
    # this is what stops `ls $(something)` from riding in on `ls`.
    unknown: list[str] = []
    writes = False
    for seg in segments:
        seg_kind, rule, seg_writes = _segment_kind(seg, provisioning)
        if seg_kind == DENY:
            return Ruling(DENY, rule, f"the pipeline contains {rule}")
        if seg_kind != ALLOW:
            # Unrecognised. This does NOT count as a write: path scoping produces
            # the message "would write outside the goal's tree", and asserting that
            # about a stage we could not classify is a claim with nothing behind it.
            # It goes to the judge instead, which is what the judge is for.
            unknown.append(rule)
            continue
        writes = writes or seg_writes

    # Path scoping applies to what MUTATES, not to what looks. Confining reads to
    # the goal's tree sounded prudent and was wrong in practice: a worker asked to
    # build a Stockfish match harness probed /usr/bin/stockfish and friends to see
    # whether the binary existed, and this refused the whole command as "would
    # write outside the goal's tree" — it wrote nothing. The step stalled on a
    # denial whose stated reason was not true of the command.
    #
    # Reading outside the tree is how a worker learns about the host it is on. The
    # reads that genuinely matter — credentials, keys, the platform's own state —
    # are in the deny table above, which has already run and cannot be reached
    # past. So: look anywhere, change only your own tree.
    if writes:
        outside = paths_outside(command, roots)
        if outside:
            return Ruling(
                DENY,
                "outside-root",
                f"would write outside the goal's tree: {', '.join(outside[:3])}",
            )

    # Anything the table could not name is the narrow middle the model exists for.
    if unknown:
        return Ruling("", "unclassified", f"no rule covers {'/'.join(unknown[:4])}")

    if writes:
        return Ruling(ALLOW, "in-root", "every stage is recognised and stays in the tree")
    return Ruling(ALLOW, "reads-only", "every stage only inspects; nothing is modified")


#: Where one command ends and the next begins. Deliberately crude: it over-splits
#: rather than under-splits, and an extra fragment can only make the classifier
#: MORE cautious (an unrecognised fragment sends the whole request to the judge).
_SEGMENT_SPLIT = re.compile(r"&&|\|\||;|\||\n")

#: Constructs that hide a command from segmentation. Their presence means we
#: cannot enumerate what will actually run, so the request is not auto-allowed.
#:
#: ``${...}`` is deliberately NOT here. It is parameter expansion, not command
#: substitution — it runs nothing. Listing it meant any command using
#: ``${PIPESTATUS[0]}``, ``${HOME}`` or ``${1}`` became unclassifiable and went to
#: the judge, which is how a perfectly ordinary
#: ``git clone … | tail -8; echo "rc=${PIPESTATUS[0]}"`` ended up being refused.
#: A nested ``${x:-$(cmd)}`` still contains ``$(`` and is still caught.
_OPAQUE = ("$(", "`", "<(", "eval ")


def _segments(command: str) -> list[str]:
    return [s.strip().strip("()") for s in _SEGMENT_SPLIT.split(command) if s.strip().strip("()")]


#: Commands that run another command. Classified by what they WRAP, or `timeout 5
#: ls /usr/bin` would be judged as code execution and have its harmless read
#: confined to the goal's tree.
_WRAPPERS: frozenset[str] = frozenset({"timeout", "time", "nice", "ionice", "env", "xargs", "stdbuf"})

#: Git subcommands that only read the repository. Everything else in
#: :data:`_GIT_LOCAL` changes it, and therefore has to stay in the tree.
_GIT_READONLY: frozenset[str] = frozenset({
    "status", "diff", "log", "show", "rev-parse", "ls-files", "blame", "describe",
    "remote", "reflog", "shortlog", "count-objects", "branch", "tag", "bisect",
})

#: A real output redirect, as opposed to a discarded one. `ls > /etc/motd` writes
#: even though `ls` reads, so the redirect is what makes the stage a mutation.
_REDIRECT_RE = re.compile(r"(?<![0-9])>>?\s*(?!/dev/null|/dev/stdout|/dev/stderr)\S")


def _segment_kind(seg: str, provisioning: str = PROVISION_LOCAL) -> tuple[str, str, bool]:
    """Classify ONE pipeline stage as ``(kind, rule, mutates)``.

    ``kind`` of ``""`` means "ask the judge". ``mutates`` says whether this stage
    can change anything — which is what decides whether path scoping applies to
    it. A stage that only inspects may look outside the goal's tree; the deny
    table has already excluded the reads that actually matter.
    """
    if any(marker in seg for marker in _OPAQUE):
        return "", "a substituted command", True
    tokens = _tokens(seg)
    base = _base_of(seg).rsplit("/", 1)[-1]
    if not base:
        return "", "an unreadable stage", True

    # Unwrap `timeout 5 <cmd>` and friends, so the wrapped command is what is
    # judged. Bounded to one unwrap: nested wrappers are not worth guessing at.
    if base in _WRAPPERS and len(tokens) > 1:
        for tok in tokens[1:]:
            stripped = tok.rsplit("/", 1)[-1]
            if tok.startswith("-") or tok[:1].isdigit() or "=" in tok:
                continue
            base = stripped
            break

    redirects = bool(_REDIRECT_RE.search(seg))
    if base in _NAV_BASE or base in _READ_BASE or base in _SHELL_KEYWORDS:
        return ALLOW, base, redirects
    if base in _WRITE_BASE or base in _RUN_BASE:
        return ALLOW, base, True
    if base in _PROVISION_BASE:
        if provisioning == PROVISION_LOCAL:
            return ALLOW, base, True
        return "", f"{base} (provisioning is off)", True
    if base == "git":
        sub = ""
        for tok in tokens[1:]:
            if not tok.startswith("-"):
                sub = tok
                break
        if sub in _GIT_FETCHES:
            if provisioning == PROVISION_LOCAL:
                return ALLOW, f"git-{sub}", True
            return "", f"git {sub} (provisioning is off)", True
        if sub in _GIT_LOCAL:
            return ALLOW, f"git-{sub}", redirects or sub not in _GIT_READONLY
        return "", f"git {sub or '(no subcommand)'}", True
    return "", base, True


# ── the pass ─────────────────────────────────────────────────────────────────


async def adjudicate(
    pending: list[PendingApproval],
    *,
    roots: tuple[str, ...],
    goal_statement: str = "",
    tasks: dict[str, str] | None = None,
    sessions: Any = None,
    judge_mod: Any = None,
    defer_unclassified: bool = False,
    provisioning: str = PROVISION_LOCAL,
) -> list[tuple[PendingApproval, Ruling]]:
    """Rule on each request. Deterministic first; a model only for the middle.

    *defer_unclassified* is what an observe tick passes. Without it "no judge
    available" and "no judge on THIS tick" collapse into the same refusal, and the
    cheap 15s tick would refuse every unusual-looking command a whole minute
    before the tick that could actually have adjudicated it ran. Deferring is
    safe: the next deliberate tick is at most 60s away, well inside the
    platform's 180s deny-fast.
    """
    out: list[tuple[PendingApproval, Ruling]] = []
    judged = 0
    for pa in pending:
        ruling = classify(pa, roots=roots, provisioning=provisioning)
        if not ruling.kind:
            if judge_mod is None and defer_unclassified:
                out.append((pa, ruling))          # left for the deliberate tick
                continue
            if judge_mod is None or judged >= MAX_JUDGED_PER_PASS:
                # No adjudicator available: refuse. The worker gets a rejection
                # it can route around, which is recoverable; an approval granted
                # because nobody was looking is not.
                ruling = Ruling(
                    DENY,
                    ruling.rule,
                    f"{ruling.why} and no adjudicator was available",
                )
            else:
                judged += 1
                ruling = await _judge_one(
                    pa,
                    ruling,
                    roots=roots,
                    goal_statement=(tasks or {}).get(pa.slot_name) or goal_statement,
                    sessions=sessions,
                    judge_mod=judge_mod,
                    provisioning=provisioning,
                )
        out.append((pa, ruling))
    return out


async def _judge_one(
    pa: PendingApproval,
    prior: Ruling,
    *,
    roots: tuple[str, ...],
    goal_statement: str,
    sessions: Any,
    judge_mod: Any,
    provisioning: str = PROVISION_LOCAL,
) -> Ruling:
    """One model call, then the deterministic rules again over its answer."""
    try:
        verdict = await judge_mod.judge_tool_call(
            {
                "title": pa.title,
                "command": pa.full_command or pa.tool_input,
                "base": pa.base_command,
            },
            goal_statement=goal_statement,
            roots=roots,
            sessions=sessions,
        )
    except Exception:
        logger.warning("conductor: tool-call judge failed for %s", pa.label, exc_info=True)
        return Ruling(DENY, prior.rule, f"{prior.why} and the adjudicator errored")

    decision = str((verdict or {}).get("decision") or "").strip().lower()
    why = str((verdict or {}).get("why") or "").strip() or "no reason given"
    if decision != ALLOW:
        return Ruling(DENY, prior.rule, why, judged=True)

    # The model said yes. Re-run the parts of the classifier that carry the
    # security property over the SAME text, so a verdict swayed by anything
    # embedded in the command cannot be the last word.
    hit = deny_rule(tool_shape(pa)[1], provisioning=provisioning)
    if hit is not None:
        return Ruling(
            DENY,
            hit[0],
            f"the adjudicator allowed it but the {hit[0]} rule forbids it",
            judged=True,
        )
    # Path scoping, on the same terms `classify` applies it: only when a
    # recognised stage can actually write. Re-deriving it differently here is how
    # the two gates would come to disagree, and the disagreement would show up as
    # the judge allowing something that is then refused with a reason that is not
    # true of the command.
    _kind, _subject = tool_shape(pa)
    if mutates(_subject, provisioning):
        outside = paths_outside(_subject, roots)
        if outside:
            return Ruling(
                DENY,
                "outside-root",
                f"the adjudicator allowed it but it leaves the tree: {outside[0]}",
                judged=True,
            )
    return Ruling(ALLOW, prior.rule, why, judged=True)


def resolve(state: Any, pa: PendingApproval, approved: bool) -> bool:
    """Answer the platform, exactly the way its own handler does.

    Copies ``chat_handlers.api_chat_slot_approve``: resolve the future, stamp the
    permission row so the answer survives a tab switch and a restart, broadcast
    so an open dashboard unblocks, and push the slot list so the board moves the
    card out of the blocked lane.
    """
    slots = getattr(state, "_slots", None) or {}
    slot = slots.get(pa.slot_name)
    if slot is None:
        return False
    fut = (getattr(slot, "_approval_futures", None) or {}).get(pa.request_id)
    if fut is None or fut.done():
        return False
    resolved = "approved" if approved else "rejected"
    try:
        fut.set_result(resolved)
    except Exception:  # pragma: no cover - defensive
        logger.warning("conductor: could not resolve approval %s", pa.label, exc_info=True)
        return False

    try:
        from kiro_crew.dashboard.chat_handlers import _mark_permission_resolved

        if _mark_permission_resolved(slot.messages, pa.request_id, resolved):
            slot._dirty = True
    except Exception:
        logger.debug("conductor: could not stamp permission row", exc_info=True)
    for call, args in (
        ("broadcast_ws", ("approval_resolved", {"id": pa.request_id, "approved": approved, "slot": slot.key})),
        ("push_slots_update", ()),
    ):
        fn = getattr(state, call, None)
        if callable(fn):
            try:
                fn(*args)
            except Exception:
                logger.debug("conductor: %s failed after approval", call, exc_info=True)
    return True
