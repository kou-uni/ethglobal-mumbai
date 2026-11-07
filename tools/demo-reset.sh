#!/bin/sh
# Reset the demo on this computer so the whole walk can be shown again, lights included.
#   tools/demo-reset.sh            bumps TOOL_VERSION in broker/.env.local (1.0.1 -> 1.0.2) and restarts everything
# A light is given once per person per version, so "a new version" is what lets the same person light again.
# The trail (broker/data/ledger.jsonl) is append-only and is NOT touched: the old lights stay on the record.
cd "$(dirname "$0")/.." || exit 1
f=broker/.env.local; [ -f "$f" ] || touch "$f"
cur=$(sed -n 's/^TOOL_VERSION=//p' "$f" | tail -1)
case "$cur" in
  "") next=1.0.1 ;;
  *)  next=$(echo "$cur" | awk -F. '{ $NF = $NF + 1; print }' OFS=.) ;;
esac
grep -v '^TOOL_VERSION=' "$f" > "$f.tmp" && echo "TOOL_VERSION=$next" >> "$f.tmp" && mv "$f.tmp" "$f"
echo "tool version: ${cur:-1.0.0} -> $next"
tools/demo-up.sh stop >/dev/null 2>&1
sleep 1
BRIDGE_PORT=${BRIDGE_PORT:-8793} exec tools/demo-up.sh
