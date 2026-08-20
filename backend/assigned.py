"""Work the developer personally owns: their own open PRs, and issues assigned to them.

The board's other sources all answer "what are my sessions doing". This one answers
a question no session knows: what is waiting on ME, in the forge, whether or not a
session ever touched it.

Deliberately NOT included: pull requests merely requesting the developer's review.
On a repository with CODEOWNERS the developer is review-requested on essentially
every open PR -- measured at 200+ on the repo this was built against, 163 of them
touched within two days. A list like that is not attention, it is the repository's
entire changelog, and folding it in would bury the dozen items that genuinely need
a decision. Review load is a queue to work through, not a signal that something is
stuck; if it is ever surfaced it needs its own view and its own ranking.

Same posture as prchecks.py: `gh` is optional, every failure degrades to
``available: False`` with a reason, and nothing here raises.
"""

from __future__ import annotations

import asyncio
import json
import logging
import re
import shutil
import subprocess
import time
from typing import Any

logger = logging.getLogger(__name__)

_CACHE_TTL_SECS = 120.0
_GH_TIMEOUT_SECS = 15.0

# Repository discovery is one search; per-repo state is one call each. Cap the
# repo count so a developer with work scattered across dozens of forks cannot
# turn one board poll into dozens of rate-limited calls.
_MAX_REPOS = 6
_MAX_ROWS = 60
_PER_REPO_LIMIT = 100
_SEARCH_LIMIT = 100

# owner/name, as gh prints it. Validated before it reaches argv: everything here
# comes from gh's own output, but a repo name is still an untrusted string and
# argv is not the place to find out otherwise.
_REPO_RE = re.compile(r"^[A-Za-z0-9._-]+/[A-Za-z0-9._-]+$")

# (fetched_at, payload) for the single whole-answer key -- this module answers one
# question, so unlike prchecks there is nothing to key by.
_cache: tuple[float, dict] | None = None


def _gh_json(args: list[str]) -> Any | None:
    """Run gh and parse its JSON stdout. None on any failure.

    Exit code is ignored on purpose, matching prchecks: several gh subcommands
    exit non-zero while still printing the JSON that was asked for. Only empty
    stdout is treated as a real failure.
    """
    if shutil.which("gh") is None:
        return None
    try:
        proc = subprocess.run(
            ["gh", *args],
            capture_output=True,
            text=True,
            timeout=_GH_TIMEOUT_SECS,
        )
    except (subprocess.TimeoutExpired, OSError) as exc:
        logger.info("crew-manager: gh %s failed: %s", args[0] if args else "?", exc)
        return None
    out = proc.stdout.strip()
    if not out:
        logger.info(
            "crew-manager: gh %s produced no output: %s",
            args[0] if args else "?",
            (proc.stderr or "").strip()[:200],
        )
        return None
    try:
        return json.loads(out)
    except json.JSONDecodeError:
        return None


def _check_counts(rollup: Any) -> tuple[int, int]:
    """(failing, pending) over a statusCheckRollup, tolerating both node shapes.

    A rollup mixes CheckRun nodes (status + conclusion) with StatusContext nodes
    (state only), so a reader that knows only one shape silently scores half the
    checks as neutral.
    """
    failing = 0
    pending = 0
    if not isinstance(rollup, list):
        return (0, 0)
    for node in rollup:
        if not isinstance(node, dict):
            continue
        conclusion = str(node.get("conclusion") or "").upper()
        status = str(node.get("status") or "").upper()
        state = str(node.get("state") or "").upper()
        if conclusion in {"FAILURE", "TIMED_OUT", "STARTUP_FAILURE", "ACTION_REQUIRED"}:
            failing += 1
        elif state in {"FAILURE", "ERROR"}:
            failing += 1
        elif status in {"QUEUED", "IN_PROGRESS", "WAITING", "PENDING"} or state == "PENDING":
            pending += 1
    return (failing, pending)


# Status vocabulary, most blocking first. The frontend maps these to signals; the
# order here is the order the classifier tries them, so it is load-bearing.
def _classify_pull(row: dict) -> str:
    merge_state = str(row.get("mergeStateStatus") or "").upper()
    decision = str(row.get("reviewDecision") or "").upper()
    failing, pending = _check_counts(row.get("statusCheckRollup"))

    if merge_state == "DIRTY":
        return "conflict"
    if failing:
        return "checks_failing"
    if decision == "CHANGES_REQUESTED":
        return "changes_requested"
    if pending:
        return "checks_running"
    if decision == "APPROVED":
        return "ready_to_merge"
    return "awaiting_review"


def _row_from_pull(row: dict, repo: str) -> dict | None:
    url = str(row.get("url") or "")
    number = row.get("number")
    if not url or not isinstance(number, int):
        return None
    failing, pending = _check_counts(row.get("statusCheckRollup"))
    return {
        "kind": "pull",
        "repo": repo,
        "number": number,
        "url": url,
        "title": str(row.get("title") or ""),
        "updated_at": str(row.get("updatedAt") or ""),
        "status": _classify_pull(row),
        "draft": bool(row.get("isDraft")),
        "failing": failing,
        "pending": pending,
    }


def _discover_repos() -> list[str]:
    """Repos where the developer has an open PR, busiest first.

    gh's search endpoint is the only way to ask "my PRs anywhere"; it cannot
    report merge or check state, so it is used purely for discovery and the real
    state comes from a per-repo `gh pr list`.
    """
    data = _gh_json(
        [
            "search", "prs",
            "--author=@me",
            "--state=open",
            "--limit", str(_SEARCH_LIMIT),
            "--json", "repository",
        ]
    )
    if not isinstance(data, list):
        return []
    counts: dict[str, int] = {}
    for row in data:
        if not isinstance(row, dict):
            continue
        repo = (row.get("repository") or {})
        name = str(repo.get("nameWithOwner") or "") if isinstance(repo, dict) else ""
        if _REPO_RE.match(name):
            counts[name] = counts.get(name, 0) + 1
    ranked = sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))
    return [name for name, _ in ranked[:_MAX_REPOS]]


def _own_pulls() -> list[dict]:
    rows: list[dict] = []
    for repo in _discover_repos():
        data = _gh_json(
            [
                "pr", "list",
                "--repo", repo,
                "--author", "@me",
                "--state", "open",
                "--limit", str(_PER_REPO_LIMIT),
                "--json", "number,title,url,updatedAt,isDraft,mergeStateStatus,reviewDecision,statusCheckRollup",
            ]
        )
        if not isinstance(data, list):
            continue
        for row in data:
            if not isinstance(row, dict):
                continue
            built = _row_from_pull(row, repo)
            # A draft is the developer's own scratch space -- it is not waiting on
            # anyone, so it never belongs in an attention list.
            if built is not None and not built["draft"]:
                rows.append(built)
    return rows


def _assigned_issues() -> list[dict]:
    data = _gh_json(
        [
            "search", "issues",
            "--assignee=@me",
            "--state=open",
            "--limit", str(_SEARCH_LIMIT),
            "--json", "number,title,url,updatedAt,repository",
        ]
    )
    if not isinstance(data, list):
        return []
    rows: list[dict] = []
    for row in data:
        if not isinstance(row, dict):
            continue
        url = str(row.get("url") or "")
        number = row.get("number")
        if not url or not isinstance(number, int):
            continue
        repo = row.get("repository") or {}
        name = str(repo.get("nameWithOwner") or "") if isinstance(repo, dict) else ""
        rows.append(
            {
                "kind": "issue",
                "repo": name,
                "number": number,
                "url": url,
                "title": str(row.get("title") or ""),
                "updated_at": str(row.get("updatedAt") or ""),
                "status": "assigned",
                "draft": False,
                "failing": 0,
                "pending": 0,
            }
        )
    return rows


def _collect() -> dict:
    if shutil.which("gh") is None:
        return {"available": False, "reason": "gh not installed"}
    pulls = _own_pulls()
    issues = _assigned_issues()
    if not pulls and not issues:
        # Distinguish "nothing assigned" from "gh could not answer": an empty
        # board is a legitimate answer and must not read as a broken probe.
        probe = _gh_json(["search", "prs", "--author=@me", "--state=open", "--limit", "1", "--json", "number"])
        if probe is None:
            return {"available": False, "reason": "gh call failed"}
    rows = pulls + issues
    rows.sort(key=lambda r: str(r.get("updated_at") or ""), reverse=True)
    return {"available": True, "rows": rows[:_MAX_ROWS], "truncated": len(rows) > _MAX_ROWS}


async def assigned_work(force: bool = False) -> dict:
    """Cached view of the developer's own PRs and assigned issues. Never raises."""
    global _cache
    now = time.time()
    if not force and _cache is not None and now - _cache[0] < _CACHE_TTL_SECS:
        return _cache[1]
    # Subprocess off the event loop -- these are several blocking gh calls and
    # would stall the gateway for seconds.
    payload = await asyncio.to_thread(_collect)
    _cache = (now, payload)
    return payload
