#!/usr/bin/env python3
"""Drive the autonomous-Conductor POC: declare a goal, start it, watch it work.

This is the acceptance harness for the feature. It does exactly what an operator
would do through the UI — declare a goal, press start, then go away — and then
reports what the Conductor did without being touched.

    python3 poc/run_chess_poc.py            # declare + start + watch
    python3 poc/run_chess_poc.py --dry-run  # one gated tick, execute nothing
    python3 poc/run_chess_poc.py --watch    # attach to a run already going
    python3 poc/run_chess_poc.py --stop     # drain
    python3 poc/run_chess_poc.py --verify   # just check the built artifact

Deliberately talks HTTP rather than importing the app: the point is to prove the
operator-facing surface works, not that the modules do.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

BASE = "http://localhost:5476"
APP = "/api/apps/crew-manager"
GOAL_FILE = Path(__file__).resolve().parent / "chess-goal.json"
TARGET = Path("/local/home/zedmor/.kiro/crew/workspace/chess-poc")
KIROCREW = "/local/home/zedmor/workplace/KiroCrew/.venv/bin/kirocrew"


def token() -> str:
    """Mint a dashboard token. The cookie name is port-scoped: mc_token_<port>."""
    out = subprocess.run([KIROCREW, "token"], capture_output=True, text=True, timeout=90).stdout
    for part in out.replace("?", "&").split("&"):
        if part.startswith("token="):
            return part.split("=", 1)[1].strip()
    raise SystemExit("could not mint a token — is the gateway running?")


class Client:
    def __init__(self) -> None:
        self.tok = token()

    def _req(self, method: str, path: str, body: dict | None = None) -> tuple[int, object]:
        data = json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(BASE + path, data=data, method=method)
        req.add_header("Cookie", f"mc_token_5476={self.tok}")
        if data:
            req.add_header("Content-Type", "application/json")
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                raw = resp.read().decode()
                return resp.status, (json.loads(raw) if raw.strip() else None)
        except urllib.error.HTTPError as exc:
            raw = exc.read().decode()
            try:
                return exc.code, json.loads(raw)
            except ValueError:
                return exc.code, raw[:400]
        except Exception as exc:  # connection refused, timeout
            return 0, str(exc)

    def get(self, p: str) -> tuple[int, object]:
        return self._req("GET", p)

    def post(self, p: str, body: dict | None = None) -> tuple[int, object]:
        return self._req("POST", p, body or {})


def declare(c: Client) -> str:
    goal = json.loads(GOAL_FILE.read_text())
    status, body = c.post(f"{APP}/conductor/goals", goal)
    if status not in (200, 201):
        raise SystemExit(f"declare failed: HTTP {status}: {body}")
    gid = ""
    if isinstance(body, dict):
        gid = body.get("id") or (body.get("goal") or {}).get("id") or ""
        if not gid:
            for g in body.get("goals", []) or []:
                if g.get("title") == goal["title"]:
                    gid = g.get("id", "")
    if not gid:
        raise SystemExit(f"declared but no goal id came back: {body}")
    print(f"declared goal {gid}: {goal['title']}")
    print(f"  {len(goal['leaves'])} leaves, {len(goal['done_when'])} done_when predicates")
    return gid


def verify() -> dict:
    """Check the artifact the way a human would: compile, run tests, count moves."""
    result: dict = {"modules": {}, "tests": {}, "legal_moves_from_start": None, "commits": 0}
    for name in ("constants", "board", "movegen", "evaluation", "search", "uci"):
        p = TARGET / "src" / f"{name}.py"
        result["modules"][name] = p.stat().st_size if p.exists() else None
    for t in sorted((TARGET / "tests").glob("test_*.py")):
        r = subprocess.run([sys.executable, str(t)], cwd=TARGET,
                           capture_output=True, text=True, timeout=300)
        result["tests"][t.name] = {
            "exit": r.returncode,
            "tail": (r.stdout + r.stderr).strip().splitlines()[-3:],
        }
    probe = (
        "from src.board import Board\n"
        "from src.movegen import generate_legal_moves\n"
        "print(len(generate_legal_moves(Board())))\n"
    )
    r = subprocess.run([sys.executable, "-c", probe], cwd=TARGET,
                       capture_output=True, text=True, timeout=120)
    if r.returncode == 0 and r.stdout.strip().isdigit():
        result["legal_moves_from_start"] = int(r.stdout.strip())
    g = subprocess.run(["git", "log", "--oneline"], cwd=TARGET,
                       capture_output=True, text=True, timeout=60)
    result["commits"] = len([ln for ln in g.stdout.splitlines() if ln.strip()])
    result["commit_log"] = g.stdout.strip().splitlines()
    return result


def print_verify(v: dict) -> bool:
    print("\n=== artifact verification ===")
    for name, size in v["modules"].items():
        print(f"  src/{name}.py".ljust(24), f"{size} bytes" if size else "MISSING")
    passed = failed = 0
    for name, info in v["tests"].items():
        ok = info["exit"] == 0
        passed += ok
        failed += (not ok)
        print(f"  {name}".ljust(24), "PASS" if ok else f"FAIL(exit={info['exit']})")
        if not ok:
            for ln in info["tail"]:
                print("      ", ln[:120])
    print(f"  legal moves from start:  {v['legal_moves_from_start']} (expect 20)")
    print(f"  commits in target repo:  {v['commits']}")
    for ln in v.get("commit_log", [])[:12]:
        print("      ", ln)
    all_modules = all(v["modules"].values())
    return bool(all_modules and failed == 0 and v["legal_moves_from_start"] == 20)


def summarize_state(state: object) -> str:
    if not isinstance(state, dict):
        return str(state)[:200]
    bits = [
        f"mode={state.get('mode')}",
        f"running={state.get('running')}",
        f"holding={state.get('holding')}",
    ]
    goals = state.get("goals")
    if isinstance(goals, list):
        for g in goals:
            if isinstance(g, dict):
                bits.append(
                    f"goal[{g.get('id','?')[:8]}] status={g.get('status')} "
                    f"leaves_closed={g.get('leaves_closed')}/{g.get('leaves_total')}"
                )
    return "  ".join(bits)


def watch(c: Client, gid: str, *, minutes: int) -> None:
    deadline = time.time() + minutes * 60
    seen: set[str] = set()
    print(f"\nwatching for up to {minutes} min — the operator does nothing from here\n")
    while time.time() < deadline:
        s_code, state = c.get(f"{APP}/conductor/state")
        l_code, led = c.get(f"{APP}/conductor/ledger?limit=60")
        stamp = time.strftime("%H:%M:%S")
        if s_code == 200:
            print(f"[{stamp}] {summarize_state(state)}")
        else:
            print(f"[{stamp}] state HTTP {s_code}: {str(state)[:160]}")
        rows = led.get("rows") if isinstance(led, dict) else led
        for row in rows or []:
            if not isinstance(row, dict):
                continue
            key = f"{row.get('action_id')}:{row.get('event_type')}"
            if key in seen:
                continue
            seen.add(key)
            print(f"    · {row.get('event_type','?'):8} {row.get('action_class','-'):17}"
                  f" {row.get('verdict') or row.get('outcome') or '':9}"
                  f" {str(row.get('resource') or '')[:26]:26} {str(row.get('reason') or '')[:70]}")
        if isinstance(state, dict):
            for g in state.get("goals") or []:
                if isinstance(g, dict) and g.get("id") == gid and g.get("status") in {"satisfied", "done"}:
                    print("\n*** goal reported satisfied ***")
                    return
        time.sleep(20)
    print("\n(watch window elapsed)")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="one gated tick, execute nothing")
    ap.add_argument("--watch", action="store_true", help="attach to an existing run")
    ap.add_argument("--stop", action="store_true")
    ap.add_argument("--verify", action="store_true")
    ap.add_argument("--minutes", type=int, default=45)
    ap.add_argument("--mode", default="autonomous")
    args = ap.parse_args()

    if args.verify:
        return 0 if print_verify(verify()) else 1

    c = Client()
    code, state = c.get(f"{APP}/conductor/state")
    if code == 0:
        raise SystemExit(f"gateway unreachable: {state}")
    if code == 404:
        raise SystemExit("no /conductor routes — the feature is not installed in the running gateway")
    print(f"conductor reachable: {summarize_state(state)}")

    if args.stop:
        print(c.post(f"{APP}/conductor/stop", {"verb": "drain"}))
        return 0

    if args.watch:
        gid = ""
        if isinstance(state, dict):
            for g in state.get("goals") or []:
                if isinstance(g, dict):
                    gid = g.get("id", "")
        watch(c, gid, minutes=args.minutes)
        return 0 if print_verify(verify()) else 1

    gid = declare(c)

    if args.dry_run:
        code, rec = c.post(f"{APP}/conductor/tick?dry_run=1")
        print(f"\ndry-run tick HTTP {code}:")
        print(json.dumps(rec, indent=2)[:4000])
        return 0

    code, body = c.post(f"{APP}/conductor/start", {"mode": args.mode, "goal_ids": [gid]})
    if code != 200:
        raise SystemExit(f"start failed: HTTP {code}: {body}")
    print(f"started in {args.mode} mode")

    watch(c, gid, minutes=args.minutes)
    ok = print_verify(verify())
    print("\nRESULT:", "POC PASSED" if ok else "POC INCOMPLETE")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
