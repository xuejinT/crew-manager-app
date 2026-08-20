"""Durable JSON state for the Conductor — fcntl-locked, atomically written.

The write protocol is copied from ``kiro_crew/autonudge.py:496`` deliberately
rather than reinvented, because it already solved the two problems that matter:

* **Atomic replace, not truncate-in-place.** ``open(path, "w")`` truncates
  before any lock is taken, so a reader can observe a half-written file. We
  serialize to a temp file in the same directory, fsync, then rename onto the
  target — a reader always sees either the whole old file or the whole new one.
* **Retrying rename.** On Windows the rename can fail with ``PermissionError``
  while an indexer or AV product transiently holds the fresh temp file, which
  silently loses the write. ``replace_with_retry`` is the platform's own fix.

Two divergences from autonudge, both deliberate:

* **One file per goal** (``goals/<id>.json``) rather than one ``goals.json``.
  At five goals across thirty sessions a single file makes every goal write
  contend on one lock, and — worse — one corrupt goal fails the whole load. A
  per-goal file degrades to *one skipped goal*.
* **Async wrappers offload to a thread.** ``fsync`` on the gateway's event loop
  is a blocking call in a process that is also serving a dashboard.

Locking is ``fcntl`` and therefore **per-machine only**. It does not protect
against two gateways on different hosts sharing a state directory; that is what
the PID + heartbeat in :mod:`control` is for.
"""

from __future__ import annotations

import asyncio
import contextlib
import errno
import json
import logging
import os
import tempfile
from pathlib import Path
from typing import Any, Iterator

logger = logging.getLogger(__name__)

try:  # pragma: no cover - exercised on POSIX only
    import fcntl
except ImportError:  # pragma: no cover - Windows
    fcntl = None  # type: ignore[assignment]

try:
    from kiro_crew.atomic_write import replace_with_retry
except Exception:  # pragma: no cover - offline/unit-test use
    def replace_with_retry(src: str | Path, dst: str | Path) -> None:  # type: ignore[misc]
        os.replace(src, dst)


def conductor_dir() -> Path:
    """``<app data dir>/conductor``. Created on demand.

    Resolved from this file's location so it follows the INSTALLED copy of the
    app (``~/.kiro/crew/apps/crew-manager/data``) rather than the clone the
    operator edits — the same convention ``initiatives.py`` uses.
    """
    return Path(__file__).resolve().parent.parent.parent / "data" / "conductor"


def goals_dir() -> Path:
    return conductor_dir() / "goals"


@contextlib.contextmanager
def locked(path: Path, *, shared: bool = False) -> Iterator[None]:
    """Hold an advisory lock on a sidecar of *path* for the block's duration.

    The lock is taken on ``<path>.lock``, never on the data file itself: the data
    file is replaced by rename, so a lock held on the old inode would protect
    nothing once the rename lands.

    Degrades to a no-op where ``fcntl`` is unavailable rather than failing —
    losing serialization is strictly better than losing the feature, and every
    caller's write is atomic regardless.
    """
    if fcntl is None:  # pragma: no cover
        yield
        return
    lock_path = path.with_suffix(path.suffix + ".lock")
    lock_path.parent.mkdir(parents=True, exist_ok=True)
    fd = os.open(lock_path, os.O_RDWR | os.O_CREAT, 0o600)
    try:
        fcntl.flock(fd, fcntl.LOCK_SH if shared else fcntl.LOCK_EX)
        try:
            yield
        finally:
            with contextlib.suppress(OSError):
                fcntl.flock(fd, fcntl.LOCK_UN)
    finally:
        with contextlib.suppress(OSError):
            os.close(fd)


def write_json(path: Path, payload: Any) -> None:
    """Atomically replace *path* with *payload*. Blocking — offload if async."""
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp_path = tempfile.mkstemp(dir=path.parent, suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as fh:
            json.dump(payload, fh, indent=1)
            fh.flush()
            os.fsync(fh.fileno())
        replace_with_retry(tmp_path, path)
    except BaseException:
        with contextlib.suppress(OSError):
            os.unlink(tmp_path)
        raise


def read_json(path: Path, fallback: Any = None) -> Any:
    """Read *path*, returning *fallback* on absence or corruption.

    A corrupt file is logged and treated as absent. The alternative — raising —
    turns one bad byte into a dead control loop.
    """
    try:
        with locked(path, shared=True):
            text = path.read_text(encoding="utf-8")
    except FileNotFoundError:
        return fallback
    except OSError as exc:
        logger.warning("conductor: unreadable state %s: %s", path.name, exc)
        return fallback
    if not text.strip():
        return fallback
    try:
        return json.loads(text)
    except ValueError as exc:
        logger.error("conductor: CORRUPT state %s: %s (treated as absent)", path.name, exc)
        return fallback


def update_json(path: Path, mutate, fallback: Any = None) -> Any:
    """Read-modify-write *path* under one exclusive lock.

    *mutate* receives the loaded value and returns the value to persist. The
    whole cycle is inside the lock, which is the point: a read followed by a
    separate locked write is a lost-update race.
    """
    with locked(path):
        try:
            text = path.read_text(encoding="utf-8")
            current = json.loads(text) if text.strip() else fallback
        except (FileNotFoundError, ValueError):
            current = fallback
        except OSError as exc:
            logger.warning("conductor: unreadable state %s: %s", path.name, exc)
            current = fallback
        updated = mutate(current)
        write_json(path, updated)
        return updated


def append_jsonl(path: Path, record: dict[str, Any]) -> None:
    """Append one record to a JSONL file under an exclusive lock.

    Append mode plus a lock, not read-modify-write: the ledger is the one file
    that must stay cheap to write at any size.
    """
    path.parent.mkdir(parents=True, exist_ok=True)
    line = json.dumps(record, sort_keys=True, separators=(",", ":")) + "\n"
    with locked(path):
        with open(path, "a", encoding="utf-8") as fh:
            fh.write(line)
            fh.flush()
            os.fsync(fh.fileno())


def read_jsonl(path: Path, *, limit: int | None = None) -> list[dict[str, Any]]:
    """Read a JSONL file, skipping unparseable lines rather than failing."""
    try:
        with locked(path, shared=True):
            lines = path.read_text(encoding="utf-8").splitlines()
    except FileNotFoundError:
        return []
    except OSError as exc:
        logger.warning("conductor: unreadable jsonl %s: %s", path.name, exc)
        return []
    if limit is not None:
        lines = lines[-limit:]
    out: list[dict[str, Any]] = []
    for line in lines:
        line = line.strip()
        if not line:
            continue
        try:
            rec = json.loads(line)
        except ValueError:
            continue
        if isinstance(rec, dict):
            out.append(rec)
    return out


def marker_path(name: str) -> Path:
    """Path of an operator marker file (``halt``, ``no_session_continue``, …).

    Markers are files on purpose, borrowed from batty's ``.batty/pause``: an
    operator can kill autonomy with ``touch`` from a shell with no running
    gateway, no API call and no auth, which is the property you want from a
    brake.
    """
    return conductor_dir() / "markers" / name


def marker_set(name: str) -> bool:
    return marker_path(name).exists()


def marker_create(name: str, reason: str = "") -> None:
    p = marker_path(name)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(reason or "set by operator\n", encoding="utf-8")


def marker_clear(name: str) -> None:
    with contextlib.suppress(FileNotFoundError):
        marker_path(name).unlink()


# ── async wrappers: never fsync on the gateway's event loop ──────────────────

async def read_json_async(path: Path, fallback: Any = None) -> Any:
    return await asyncio.to_thread(read_json, path, fallback)


async def write_json_async(path: Path, payload: Any) -> None:
    await asyncio.to_thread(write_json, path, payload)


async def update_json_async(path: Path, mutate, fallback: Any = None) -> Any:
    return await asyncio.to_thread(update_json, path, mutate, fallback)


async def append_jsonl_async(path: Path, record: dict[str, Any]) -> None:
    await asyncio.to_thread(append_jsonl, path, record)


async def read_jsonl_async(path: Path, *, limit: int | None = None) -> list[dict[str, Any]]:
    return await asyncio.to_thread(read_jsonl, path, limit=limit)
