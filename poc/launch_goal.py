#!/usr/bin/env python3
"""Launch a fresh autonomous Conductor run against a clean target directory.

    python3 poc/launch_goal.py                       # default target, then watch
    python3 poc/launch_goal.py --target ~/dev/chess2
    python3 poc/launch_goal.py --no-watch            # start it and return
    python3 poc/launch_goal.py --dry-run             # gate everything, execute nothing

Exists because declaring a goal correctly requires six things that are easy to get
wrong, each of which I got wrong once and each of which fails QUIETLY:

1. ``scope.root``, not ``scope.workspace``. ``workspace`` and ``project`` are also
   the MEMBERSHIP axes, so a goal that names one to locate its files thereby adopts
   every session reporting the same value — a goal quietly claimed five unrelated
   sessions before I noticed.
2. ``scope.worker_trust``. A worker is born untrusted, so its first tool call parks
   on an approval and is auto-DENIED after 180s. Without this a worker briefed to
   "read CLAUDE.md first" has both reads denied and stops having written nothing.
3. Leaf briefs go in ``intent_text``. ``prompt`` is the proposal-param name and is
   dropped by the goal normalizer, leaving leaves that can never be dispatched.
4. Budgets are ``budgets.actions.<class>``. A ``<class>_per_day`` spelling is
   dropped and the default applies.
5. A declared goal starts as ``draft``. Activation is a separate, deliberate
   operator act: POST the id again with ``status: "active"``.
6. The target needs the conventions file. Parallel workers coordinate through it,
   not through each other.
"""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

#: This machine's home, so the script carries no operator's absolute paths.
HOME = str(Path.home())

BASE = "http://localhost:5476"
APP = "/api/apps/crew-manager"
HERE = Path(__file__).resolve().parent
GOAL_FILE = HERE / "chess-goal.json"
CONVENTIONS = Path(HOME + "/.kiro/crew/workspace/chess-poc/CLAUDE.md")
KIROCREW = HOME + "/workplace/KiroCrew/.venv/bin/kirocrew"
DEFAULT_TARGET = Path(HOME + "/.kiro/crew/workspace/chess-poc-2")


def token() -> str:
    out = subprocess.run([KIROCREW, "token"], capture_output=True, text=True, timeout=120).stdout
    for part in out.replace("?", "&").split("&"):
        if part.startswith("token="):
            return part.split("=", 1)[1].strip()
    raise SystemExit("could not mint a token — is the gateway running?")


class Client:
    def __init__(self) -> None:
        self.tok = token()

    def call(self, method: str, path: str, body: dict | None = None):
        data = json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(BASE + path, data=data, method=method)
        req.add_header("Cookie", f"mc_token_5476={self.tok}")
        if data:
            req.add_header("Content-Type", "application/json")
        try:
            with urllib.request.urlopen(req, timeout=90) as resp:
                raw = resp.read().decode()
                return resp.status, (json.loads(raw) if raw.strip() else None)
        except urllib.error.HTTPError as exc:
            raw = exc.read().decode()
            try:
                return exc.code, json.loads(raw)
            except ValueError:
                return exc.code, raw[:400]
        except Exception as exc:
            return 0, str(exc)


def prepare_target(target: Path) -> None:
    """A git repo with the conventions file and nothing else."""
    (target / "src").mkdir(parents=True, exist_ok=True)
    (target / "tests").mkdir(parents=True, exist_ok=True)
    if not (target / ".git").is_dir():
        subprocess.run(["git", "init", "-q"], cwd=target, check=True, timeout=120)
        subprocess.run(["git", "config", "user.email", "conductor@localhost"],
                       cwd=target, check=True, timeout=60)
        subprocess.run(["git", "config", "user.name", "Conductor"],
                       cwd=target, check=True, timeout=60)
    (target / ".gitignore").write_text("__pycache__/\n*.pyc\n", encoding="utf-8")
    if CONVENTIONS.is_file():
        shutil.copy2(CONVENTIONS, target / "CLAUDE.md")
    else:
        raise SystemExit(f"conventions file missing: {CONVENTIONS}")
    subprocess.run(["git", "add", "CLAUDE.md", ".gitignore"], cwd=target, timeout=60)
    subprocess.run(["git", "commit", "-q", "-m", "conventions for parallel agents"],
                   cwd=target, timeout=120)
    existing = [p.name for p in (target / "src").glob("*.py")]
    if existing:
        print(f"  WARNING: {target}/src already has {existing} — leaves whose file "
              f"exists will close instantly and no work will be dispatched for them.")


def build_goal(target: Path, title: str) -> dict:
    g = json.loads(GOAL_FILE.read_text())
    g["title"] = title
    g["statement"] = g["statement"].replace(
        HOME + "/.kiro/crew/workspace/chess-poc", str(target)
    )
    g["scope"]["root"] = str(target)          # gotcha 1
    g["scope"]["worker_trust"] = "trust"      # gotcha 2
    g["scope"].pop("workspace", None)
    g["scope"].pop("project", None)
    for leaf in g["leaves"]:                  # gotcha 3
        text = leaf.get("intent_text") or leaf.pop("prompt", "")
        leaf["intent_text"] = text.replace(
            HOME + "/.kiro/crew/workspace/chess-poc", str(target)
        )
        leaf["status"] = "open"
    g["budgets"] = {                          # gotcha 4
        "wip": 3, "turns": 200, "wall_clock_secs": 21600,
        "actions": {"session_create": 12, "session_continue": 60,
                    "context_inject": 120, "escalate": 20, "operator_notify": 20},
    }
    return g


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--target", type=Path, default=DEFAULT_TARGET)
    ap.add_argument("--title", default="Chess engine (fresh run)")
    ap.add_argument("--no-watch", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--minutes", type=int, default=60)
    args = ap.parse_args()
    target = args.target.expanduser().resolve()

    c = Client()
    code, state = c.call("GET", f"{APP}/conductor/state")
    if code == 0:
        raise SystemExit(f"gateway unreachable: {state}")
    if code == 404:
        raise SystemExit("no /conductor routes — the feature is not installed here")

    print(f"target: {target}")
    prepare_target(target)

    goal = build_goal(target, args.title)
    code, body = c.call("POST", f"{APP}/conductor/goals", goal)
    if code not in (200, 201):
        raise SystemExit(f"declare failed HTTP {code}: {body}")
    gid = ""
    if isinstance(body, dict):
        gid = body.get("id") or (body.get("goal") or {}).get("id") or ""
    if not gid:
        raise SystemExit(f"declared but no id came back: {body}")
    print(f"declared {gid} — {len(goal['leaves'])} leaves (status: draft)")

    # gotcha 5: activation is a separate operator act
    code, body = c.call("POST", f"{APP}/conductor/goals", {"id": gid, "status": "active"})
    g = (body or {}).get("goal") or body or {}
    print(f"activated: status={g.get('status')} dispatchable={g.get('dispatchable')}")

    if args.dry_run:
        code, rec = c.call("POST", f"{APP}/conductor/tick?dry_run=1")
        print(json.dumps(rec, indent=1)[:3000])
        return 0

    code, body = c.call("POST", f"{APP}/conductor/start",
                        {"mode": "autonomous", "goal_ids": [gid]})
    if code != 200:
        raise SystemExit(f"start failed HTTP {code}: {body}")
    print("started in autonomous mode\n")
    print(f"  watch:  {BASE}/crew-manager")
    print(f"  stop:   curl -X POST -b mc_token_5476=$TOK {BASE}{APP}/conductor/stop "
          f"-d '{{\"verb\":\"drain\"}}'")
    print("  brake:  touch ~/.kiro/crew/apps/crew-manager/data/conductor/markers/halt")

    if args.no_watch:
        return 0

    print(f"\nwatching {args.minutes} min — you do nothing from here\n")
    deadline = time.time() + args.minutes * 60
    while time.time() < deadline:
        _, st = c.call("GET", f"{APP}/conductor/state")
        goals = (st or {}).get("goals") or [{}]
        me = next((x for x in goals if x.get("id") == gid), {})
        leaves = me.get("leaves") if isinstance(me.get("leaves"), dict) else {}
        mods = sorted(p.name for p in (target / "src").glob("*.py"))
        print(f"[{time.strftime('%H:%M:%S')}] status={me.get('status')} "
              f"leaves={leaves} src={mods}")
        if me.get("status") in {"done", "awaiting_confirmation"}:
            print("\n*** all machine predicates satisfied — awaiting your confirmation ***")
            break
        time.sleep(30)

    print("\nverify with:")
    print(f"  cd {target} && for t in tests/test_*.py; do python3 $t >/dev/null && "
          f"echo PASS $t || echo FAIL $t; done")
    print(f"  printf 'uci\\nposition startpos\\ngo depth 3\\nquit\\n' | python3 {target}/main.py")
    return 0


if __name__ == "__main__":
    sys.exit(main())
