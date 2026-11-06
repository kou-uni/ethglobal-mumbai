#!/bin/sh
# Start the demo's back end on a hosting service: one container, one public port.
#   The Broker stays inside (127.0.0.1:$BROKER_PORT). The AI tool listens on $PORT and passes /b/* on to it,
#   so the page needs a single address (put it in web/live.json, or paste it into "Connect to a live TOMOSHIBI").
# Keys come from the host's environment settings, never from a file in the image:
#   ZG_API_KEY  ZG_PRIVATE_KEY  WORLD_CLIENT_ID  WORLD_CLIENT_SECRET
# A service with no key runs simulated, and GET /health says so. There is no USB here: a Ledger is reached
# through the page that is connected to it, and without one a button on the page stands in (every record says so).
set -u
cd "$(dirname "$0")/../broker" || exit 1
PUBLIC_PORT=${PORT:-8080}; BROKER_PORT=${BROKER_PORT:-8797}
[ -n "${ZG_API_KEY:-}" ] || export ZG_OFFLINE=1
[ -n "${WORLD_CLIENT_ID:-}" ] || export WORLD_OFFLINE=1
unset SECRETS; export EXECUTE=0          # never a real API key, never a real call (decision 15)
export ZG_ESCALATE=${ZG_ESCALATE:-significant}
mkdir -p data
PORT=$BROKER_PORT LEDGER_PATH=${LEDGER_PATH:-data/ledger.jsonl} node src/server.js &
sleep 2
HOST_AGENT=${HOST_AGENT:-0.0.0.0} PORT_AGENT=$PUBLIC_PORT exec node demo-agent.mjs "http://127.0.0.1:$BROKER_PORT" none
