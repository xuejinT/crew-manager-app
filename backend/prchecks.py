"""PR check counts via the `gh` CLI.

The platform's source_links carry only a coarse ci signal (pass/fail/pending),
not the number of checks or which one is red. This pulls the real per-check
rollup from GitHub with `gh pr checks --json bucket` and reduces it to counts.

Deliberately defensive: `gh` may be missing, unauthenticated, rate-limited, or
pointed at a non-GitHub URL. Any of those returns ``available: False`` so the UI
falls back to the coarse status line instead of breaking. Results are cached per
URL for a short TTL because the board polls every few seconds and these are paid,
rate-limited calls.
"""

from __future__ import annotations

import asyncio
import json
import logging
import shutil
import subprocess
import time
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

_CACHE_TTL_SECS = 60.0
_GH_TIMEOUT_SECS = 12.0
# url -> (fetched_at, payload)
_cache: dict[str, tuple[float, dict]] = {}


def _is_github_pr_url(url: str) -> bool:
    """Only accept a github.com pull URL. gh handles GitHub; anything else is
    rejected here so we never hand an unexpected string to a subprocess."""
    try:
        parsed = urlparse(url)
    except ValueError:
        return False
    return (
        parsed.scheme == "https"
        and parsed.netloc.endswith("github.com")
        and "/pull/" in parsed.path
    )


def _count_buckets(rows: list[dict]) -> dict:
    passing = failing = pending = 0
    for row in rows:
        bucket = str(row.get("bucket", "")).lower()
        if bucket == "pass":
            passing += 1
        elif bucket in ("fail", "cancel"):
            failing += 1
        elif bucket == "pending":
            pending += 1
        # "skipping" and unknown buckets are not counted against the total health.
    total = passing + failing + pending
    return {
        "available": True,
        "total": total,
        "passing": passing,
        "failing": failing,
        "pending": pending,
    }


def _run_gh(url: str) -> dict:
    if shutil.which("gh") is None:
        return {"available": False, "reason": "gh not installed"}
    try:
        proc = subprocess.run(
            ["gh", "pr", "checks", url, "--json", "bucket"],
            capture_output=True,
            text=True,
            timeout=_GH_TIMEOUT_SECS,
        )
    except (subprocess.TimeoutExpired, OSError) as exc:
        logger.info("crew-manager: gh pr checks failed: %s", exc)
        return {"available": False, "reason": "gh call failed"}
    # `gh pr checks` exits non-zero when checks are failing, but still prints the
    # JSON — so parse stdout regardless of exit code, and only treat an EMPTY
    # stdout as a real failure (no auth, no such PR).
    out = proc.stdout.strip()
    if not out:
        return {"available": False, "reason": (proc.stderr or "no output").strip()[:200]}
    try:
        rows = json.loads(out)
    except json.JSONDecodeError:
        return {"available": False, "reason": "unparseable gh output"}
    if not isinstance(rows, list):
        return {"available": False, "reason": "unexpected gh output"}
    payload = _count_buckets(rows)
    payload.update(_run_gh_overview(url))
    return payload


_MAX_FILES = 12


def _run_gh_overview(url: str) -> dict:
    """Title, state, branches, diffstat and files — the sidebar PR view's data.

    Best-effort on top of the check counts: a failure here still leaves the
    counts usable, so it degrades to the ID-only header, never to an error.
    """
    try:
        proc = subprocess.run(
            ["gh", "pr", "view", url, "--json",
             "title,state,isDraft,headRefName,baseRefName,additions,deletions,changedFiles,files,author,updatedAt"],
            capture_output=True,
            text=True,
            timeout=_GH_TIMEOUT_SECS,
        )
    except (subprocess.TimeoutExpired, OSError) as exc:
        logger.info("crew-manager: gh pr view failed: %s", exc)
        return {}
    out = proc.stdout.strip()
    if not out:
        return {}
    try:
        data = json.loads(out)
    except json.JSONDecodeError:
        return {}
    if not isinstance(data, dict):
        return {}
    files = []
    for entry in (data.get("files") or [])[:_MAX_FILES]:
        if isinstance(entry, dict) and entry.get("path"):
            files.append({
                "path": str(entry["path"]),
                "additions": int(entry.get("additions") or 0),
                "deletions": int(entry.get("deletions") or 0),
            })
    return {
        "title": str(data.get("title") or ""),
        "state": str(data.get("state") or ""),
        "is_draft": bool(data.get("isDraft")),
        "head": str(data.get("headRefName") or ""),
        "base": str(data.get("baseRefName") or ""),
        "additions": int(data.get("additions") or 0),
        "deletions": int(data.get("deletions") or 0),
        "changed_files": int(data.get("changedFiles") or 0),
        "author": str((data.get("author") or {}).get("login") or ""),
        "updated_at": str(data.get("updatedAt") or ""),
        "files": files,
    }


async def pr_check_counts(url: str | None) -> dict:
    """Cached check-count rollup for one PR URL. Never raises."""
    if not url or not _is_github_pr_url(url):
        return {"available": False, "reason": "not a GitHub PR URL"}
    now = time.time()
    cached = _cache.get(url)
    if cached and now - cached[0] < _CACHE_TTL_SECS:
        return cached[1]
    # Subprocess off the event loop — a blocking gh call would stall the gateway.
    payload = await asyncio.to_thread(_run_gh, url)
    _cache[url] = (now, payload)
    return payload
