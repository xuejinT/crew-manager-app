#!/usr/bin/env bash
# Operator control for the autonomous Conductor.
#
#   ./poc/goal.sh declare poc/chess-goal.json   # add a goal to the goal list (draft)
#   ./poc/goal.sh list                          # the goal list
#   ./poc/goal.sh activate <goal-id>            # draft -> active (deliberate act)
#   ./poc/goal.sh start <goal-id>               # arm the driver on it, autonomous
#   ./poc/goal.sh state                         # is it running, what does it see
#   ./poc/goal.sh events [n]                    # the event stream (ledger)
#   ./poc/goal.sh steer <goal-id> "text"        # steer it
#   ./poc/goal.sh stop                          # drain: finish in flight, start nothing
#   ./poc/goal.sh halt                          # instant brake, no restart needed
#   ./poc/goal.sh resume                        # clear the brake
#   ./poc/goal.sh remove <goal-id>
set -euo pipefail

KC=$HOME/workplace/KiroCrew/.venv/bin/kirocrew
BASE=http://localhost:5476
APP=$BASE/api/apps/crew-manager
MARKERS=$HOME/.kiro/crew/apps/crew-manager/data/conductor/markers

tok() { "$KC" token | grep -oP 'token=\K[\w.-]+' | head -1; }
TOK=$(tok)
post() { curl -s -X POST -b "mc_token_5476=$TOK" -H 'Content-Type: application/json' -d "$2" "$APP$1"; }
get()  { curl -s -b "mc_token_5476=$TOK" "$APP$1"; }

case "${1:-help}" in
declare)
  f="${2:?usage: goal.sh declare <goal.json>}"
  curl -s -X POST -b "mc_token_5476=$TOK" -H 'Content-Type: application/json' \
    -d @"$f" "$APP/conductor/goals" |
  python3 -c 'import json,sys; d=json.load(sys.stdin); g=d.get("goal") or d; print("declared:", g.get("id"), "status:", g.get("status"), "\nNow: ./poc/goal.sh activate", g.get("id"))'
  ;;
list)
  get /conductor/goals | python3 -c '
import json,sys
gs=(json.load(sys.stdin) or {}).get("goals") or []
if not gs: print("  (goal list is empty)")
for g in gs:
    lv=g.get("leaves") if isinstance(g.get("leaves"),dict) else {}
    print("  %-26s %-22s %s  leaves=%s" % (g.get("id"), g.get("status"), g.get("title"), lv))
'
  ;;
activate) post /conductor/goals "{\"id\":\"${2:?goal id}\",\"status\":\"active\"}" |
  python3 -c 'import json,sys; g=(json.load(sys.stdin) or {}); g=g.get("goal") or g; print("status:", g.get("status"), "dispatchable:", g.get("dispatchable"), "\nNow: ./poc/goal.sh start", g.get("id"))' ;;
start) post /conductor/start "{\"mode\":\"autonomous\",\"goal_ids\":[\"${2:?goal id}\"]}" |
  python3 -c 'import json,sys; d=json.load(sys.stdin); print("started:", d.get("ok"), "mode:", d.get("mode"), "armed:", (d.get("result") or {}).get("armed"))' ;;
state) get /conductor/state | python3 -c '
import json,sys; d=json.load(sys.stdin)
print("  armed=%s running=%s mode=%s" % (d.get("armed"), d.get("running"), d.get("mode")))
print("  goals:", d.get("goals_summary"))
for g in d.get("goals") or []:
    print("   ", g.get("id"), g.get("status"), "dispatchable=%s" % g.get("dispatchable"), g.get("why") or "")
' ;;
events) get "/conductor/ledger?limit=${2:-30}" | python3 -c '
import json,sys,time
for r in (json.load(sys.stdin) or {}).get("rows") or []:
    ts=time.strftime("%H:%M:%S", time.localtime(r.get("ts") or 0))
    res=str(r.get("resource") or ""); res=res.rsplit("-",1)[-1][:12] if res.startswith("cm-") else res[:12]
    print("%s  %-8s %-15s %-8s %-12s %s" % (ts, r.get("event_type"), r.get("action_class"),
          r.get("verdict") or r.get("outcome") or "", res, str(r.get("reason") or r.get("detail") or "")[:70]))
' ;;
steer) post /conductor/steer "{\"goal_id\":\"${2:?goal id}\",\"text\":\"${3:?text}\"}" | head -c 300; echo ;;
stop) post /conductor/stop '{"verb":"drain"}' | python3 -c 'import json,sys; d=json.load(sys.stdin); print("stopped:", d.get("ok"), "running:", d.get("running"))' ;;
halt) mkdir -p "$MARKERS"; echo "operator brake" > "$MARKERS/halt"; echo "HALT set — every action is refused at the gate until you resume" ;;
resume) rm -f "$MARKERS/halt"; echo "HALT cleared" ;;
remove) post /conductor/goals/remove "{\"id\":\"${2:?goal id}\"}" | head -c 200; echo ;;
*) sed -n '2,20p' "$0" ;;
esac
