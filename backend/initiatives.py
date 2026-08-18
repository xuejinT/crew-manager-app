"""Big-goal buckets for the Goal view's top level.

Crew Manager OWNS this data: buckets live in the app's own ``data/goals.json``
(kept across uninstalls, per the app-data contract), written only by this app's
routes. The matching logic — case-insensitive alias substrings — is borrowed
from Crew Companion's project labelling, but the storage is not shared: this
app must work for a user who has never run Crew Companion.

One courtesy on first run: if the user happens to have a ``projects.md`` (the
Crew Companion convention), its buckets are imported ONCE as the initial
goals.json, so an existing user inherits their projects instead of redefining
them. After that the two files never touch each other.
"""

from __future__ import annotations

import json
import os
import re
from pathlib import Path

# `- **Name**` then anything; the aliases clause is optional.
_LINE = re.compile(r"^-\s+\*\*(?P<name>[^*]+)\*\*(?P<rest>.*)$")
_ALIASES = re.compile(r"aliases:\s*(?P<aliases>.+?)\s*$", re.IGNORECASE)

_MAX_GOALS = 100
_MAX_ALIASES = 8


def _data_home() -> Path:
    return Path(os.environ.get("KIROCREW_HOME", str(Path.home() / ".kiro" / "crew")))


def goals_file() -> Path:
    """This app's own store: <app dir>/data/goals.json, next to backend/."""
    return Path(__file__).resolve().parent.parent / "data" / "goals.json"


def parse_projects(text: str) -> list[dict]:
    """Parse the projects.md bullet format, for the one-time import."""
    buckets: list[dict] = []
    seen: set[str] = set()
    for raw in text.splitlines():
        match = _LINE.match(raw.strip())
        if not match:
            continue
        name = match.group("name").strip()
        if not name or name.lower() in seen:
            continue
        seen.add(name.lower())
        aliases = [name]
        alias_match = _ALIASES.search(match.group("rest"))
        if alias_match:
            aliases += [a.strip() for a in alias_match.group("aliases").split(",") if a.strip()]
        buckets.append({"name": name, "aliases": aliases[: _MAX_ALIASES + 1]})
    return buckets


def _import_once() -> list[dict]:
    """Initial goals for a first run: the user's projects.md buckets, if any."""
    imported: list[dict] = []
    names: set[str] = set()
    home = _data_home()
    candidates = [home / "workspace" / "memory" / "projects.md"]
    try:
        candidates += sorted(
            child / "memory" / "projects.md" for child in home.iterdir() if child.is_dir()
        )
    except OSError:
        pass
    for path in candidates:
        try:
            text = path.read_text(encoding="utf-8")
        except OSError:
            continue
        for bucket in parse_projects(text):
            if bucket["name"].lower() in names:
                continue
            names.add(bucket["name"].lower())
            imported.append(bucket)
    return imported


def _write(buckets: list[dict]) -> None:
    path = goals_file()
    path.parent.mkdir(parents=True, exist_ok=True)
    # Write-then-rename so a crash mid-write cannot truncate the store.
    tmp = path.with_suffix(".json.tmp")
    tmp.write_text(json.dumps({"goals": buckets}, indent=1), encoding="utf-8")
    tmp.replace(path)


def load_initiatives() -> list[dict]:
    path = goals_file()
    if not path.is_file():
        imported = _import_once()
        try:
            _write(imported)
        except OSError:
            pass
        return imported
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return []
    buckets: list[dict] = []
    names: set[str] = set()
    for entry in payload.get("goals", []) if isinstance(payload, dict) else []:
        name = str(entry.get("name", "")).strip() if isinstance(entry, dict) else ""
        if not name or name.lower() in names:
            continue
        names.add(name.lower())
        raw_aliases = entry.get("aliases") if isinstance(entry.get("aliases"), list) else []
        aliases = [str(a).strip() for a in raw_aliases if str(a).strip()]
        if name not in aliases:
            aliases = [name] + aliases
        buckets.append({"name": name, "aliases": aliases[: _MAX_ALIASES + 1]})
    return buckets


def add_initiative(name: str, aliases: list[str] | None = None) -> list[dict]:
    """Add one bucket. Idempotent on the name; returns the updated list."""
    clean = " ".join(str(name).split())
    if not clean or len(clean) > 100:
        raise ValueError("goal name must be 1-100 characters")
    buckets = load_initiatives()
    if any(bucket["name"].lower() == clean.lower() for bucket in buckets):
        return buckets
    if len(buckets) >= _MAX_GOALS:
        raise ValueError("too many goals")
    extra = [" ".join(str(a).split()) for a in (aliases or [])]
    extra = [a for a in extra if a and a.lower() != clean.lower()][:_MAX_ALIASES]
    buckets.append({"name": clean, "aliases": [clean] + extra})
    _write(buckets)
    return buckets


def remove_initiative(name: str) -> list[dict]:
    """Remove a bucket by name. Unknown names are a no-op."""
    clean = " ".join(str(name).split()).lower()
    buckets = [b for b in load_initiatives() if b["name"].lower() != clean]
    _write(buckets)
    return buckets
