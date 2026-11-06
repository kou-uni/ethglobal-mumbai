#!/bin/sh
# Start everything the live demo needs on one machine, and say plainly what is real and what is not.
#   tools/demo-up.sh          start (or restart) all of it
#   tools/demo-up.sh stop     stop all of it
# Reads broker/.env.local if it exists. A service with no key runs simulated, and the check says so.
# Ports: Broker 8797 · Broker without 0G 8798 · agent 8792 · pages 8790 · bridge $BRIDGE_PORT (8791)
set -u
cd "$(dirname "$0")/.." || exit 1
ROOT=$PWD; LOGS=$ROOT/.demo-logs; mkdir -p "$LOGS"
BRIDGE_PORT=${BRIDGE_PORT:-8791}; PYTHON=${PYTHON:-python3}
export PATH="/opt/homebrew/bin:$PATH"

stop() { for f in "$LOGS"/*.pid; do [ -f "$f" ] && kill "$(cat "$f")" 2>/dev/null; rm -f "$f"; done; }
start() { name=$1; shift; ( "$@" > "$LOGS/$name.log" 2>&1 & echo $! > "$LOGS/$name.pid" ); }
stop
[ "${1:-}" = stop ] && { echo stopped; exit 0; }

# Keys come from the file, never from the command line. Nothing here prints them.
if [ -f broker/.env.local ]; then set -a; . broker/.env.local; set +a; fi
[ -n "${ZG_API_KEY:-}" ] || export ZG_OFFLINE=1
[ -n "${WORLD_CLIENT_ID:-}" ] || export WORLD_OFFLINE=1
unset SECRETS; export EXECUTE=0      # never a real API key, never a real call (decision 15)
# Ask for a press whenever money moves, not only when the model is certain it cannot be undone.
# (A refund came back `significant` one time in three on the real 0G; with the default it would pass.)
export ZG_ESCALATE=${ZG_ESCALATE:-significant}
# 0G withdrew the model this was measured on (0gm-1.0-35b-a3b answered "Model not found" from 2026-11-06 17:32 IST,
# after an hour of 502s, and is gone from GET /v1/models). Its sibling is still sealed (TeeML) and judges the same way,
# measured the same evening: a read -> routine 3/3, a refund -> decisive 3/3, 1.3-4.3 s. It refuses JSON mode, so that
# setting is left out; the answer is parsed as JSON either way. Set ZG_MODEL / ZG_JSON_MODE yourself to override.
export ZG_MODEL=${ZG_MODEL:-0gm-1.0-35b-a3b-sia}
export ZG_JSON_MODE=${ZG_JSON_MODE:-0}

( cd broker && [ -d node_modules ] || npm ci --silent )
start broker   sh -c "cd broker && PORT=8797 LEDGER_PATH=data/ledger.jsonl exec node src/server.js"
start deaf     sh -c "cd broker && ZG_OFFLINE= ZG_ENDPOINT=https://router-api.invalid/v1 PORT=8798 LEDGER_PATH=data/deaf.jsonl exec node src/server.js"
if ! curl -s -m 2 "http://127.0.0.1:$BRIDGE_PORT/health" 2>/dev/null | grep -q '"ok"'; then
  start bridge "$PYTHON" bridge/bridge.py --port "$BRIDGE_PORT"
fi
start agent    sh -c "cd broker && exec node demo-agent.mjs http://127.0.0.1:8797 http://127.0.0.1:$BRIDGE_PORT http://127.0.0.1:8798"
start web      "$PYTHON" -m http.server 8790 --bind 127.0.0.1 --directory web
sleep 3
node tools/demo-check.mjs "$BRIDGE_PORT"

# TUNNEL=1: give the tool (and, through it, the Broker) a temporary public address, so the app can
# be opened on a phone. The address is printed here and nowhere else. Do not commit it or post it:
# anyone who has it can make the tool ask (they still cannot press the Ledger).
if [ "${TUNNEL:-}" = 1 ]; then
  start tunnel cloudflared tunnel --no-autoupdate --url http://127.0.0.1:8792
  for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15; do
    U=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' "$LOGS/tunnel.log" 2>/dev/null | head -1); [ -n "$U" ] && break; sleep 2
  done
  [ -n "${U:-}" ] && printf '\nOpen on the phone:\n  https://mintannn.github.io/tomoshibi/start.html?agent=%s\n' "$U" || echo 'tunnel: no address yet (see .demo-logs/tunnel.log)'
fi
