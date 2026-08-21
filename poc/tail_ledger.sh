#!/usr/bin/env bash
# Live event stream for the autonomous Conductor.
TOK=$($HOME/workplace/KiroCrew/.venv/bin/kirocrew token | grep -oP 'token=\K[\w.-]+' | head -1)
curl -s -b "mc_token_5476=$TOK" \
  "http://localhost:5476/api/apps/crew-manager/conductor/ledger?limit=${1:-40}" |
python3 -c '
import json,sys,time
rows=(json.load(sys.stdin) or {}).get("rows") or []
for r in rows:
    ts=time.strftime("%H:%M:%S", time.localtime(r.get("ts") or 0))
    ev=(r.get("event_type") or "")[:8]
    cls=(r.get("action_class") or "")[:15]
    vd=(r.get("verdict") or r.get("outcome") or "")[:8]
    res=str(r.get("resource") or "")
    res=res.split("-")[-1][:12] if res.startswith("cm-") else res[:12]
    why=str(r.get("reason") or r.get("detail") or "")[:74]
    print(f"{ts}  {ev:8} {cls:15} {vd:8} {res:12} {why}")
'
