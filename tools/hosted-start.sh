#!/bin/sh
# Start the demo's back end on a hosting service: one container, one public port.
#   The Broker stays inside (127.0.0.1:$BROKER_PORT). The AI tool listens on $PORT and passes /b/* on to it,
#   so the page needs a single address (put it in web/live.json, or paste it into "Connect to a live TOMOSHIBI").
# Keys come from the host's environment settings, never from a file in the image:
#   ZG_API_KEY  WORLD_CLIENT_ID  WORLD_CLIENT_SECRET      (ZG_PRIVATE_KEY is dropped on purpose, see below)
# A service with no key runs simulated, and GET /health says so. There is no USB here: a Ledger is reached
# through the page that is connected to it, and without one a button on the page stands in (every record says so).
set -u
cd "$(dirname "$0")/../broker" || exit 1
PUBLIC_PORT=${PORT:-8080}; BROKER_PORT=${BROKER_PORT:-8797}
[ -n "${ZG_API_KEY:-}" ] || export ZG_OFFLINE=1
[ -n "${WORLD_CLIENT_ID:-}" ] || export WORLD_OFFLINE=1
unset SECRETS; export EXECUTE=0          # no key from the environment (decision 15). A visitor may park a Stripe test-mode key from the page (memory only; live keys refused)
# A public copy never holds the wallet key: anyone can reach it, and sealing spends from that wallet.
# Without it the Broker still keeps its record; it just cannot write it to 0G Storage from here.
unset ZG_PRIVATE_KEY
export ZG_ESCALATE=${ZG_ESCALATE:-significant}
# 0G withdrew the model this was measured on (0gm-1.0-35b-a3b answered "Model not found" from 2026-11-06 17:32 IST,
# after an hour of 502s, and is gone from GET /v1/models). Its sibling is still sealed (TeeML) and judges the same way,
# measured the same evening: a read -> routine 3/3, a refund -> decisive 3/3, 1.3-4.3 s. It refuses JSON mode, so that
# setting is left out; the answer is parsed as JSON either way. Set ZG_MODEL / ZG_JSON_MODE yourself to override.
export ZG_MODEL=${ZG_MODEL:-0gm-1.0-35b-a3b-sia}
export ZG_JSON_MODE=${ZG_JSON_MODE:-0}
mkdir -p data
PORT=$BROKER_PORT LEDGER_PATH=${LEDGER_PATH:-data/ledger.jsonl} node src/server.js &
sleep 2
HOST_AGENT=${HOST_AGENT:-0.0.0.0} PORT_AGENT=$PUBLIC_PORT exec node demo-agent.mjs "http://127.0.0.1:$BROKER_PORT" none
