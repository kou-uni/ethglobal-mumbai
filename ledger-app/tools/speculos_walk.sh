#!/bin/sh
# Walk every Tomoshibi screen in Speculos and save a screenshot of each.
#   tools/speculos_walk.sh <out-dir> [port]
# Needs the ledger-app-dev-tools image and a finished `cargo ledger build flex`.
set -u
OUT=${1:-shots}; PORT=${2:-5005}
IMG=ghcr.io/ledgerhq/ledger-app-builder/ledger-app-dev-tools:latest
API=http://127.0.0.1:$PORT
mkdir -p "$OUT"
docker rm -f tomoshibi-spec >/dev/null 2>&1
docker run -d --name tomoshibi-spec -p "$PORT:5000" -v "$PWD:/app" "$IMG" \
  speculos --display headless --api-port 5000 --apdu-port 0 -m flex /app/target/flex/release/tomoshibi >/dev/null
shot() { sleep "${2:-1.5}"; curl -sf "$API/screenshot" -o "$OUT/$1.png"; }
tap() { curl -sf -X POST "$API/finger" -H 'Content-Type: application/json' -d "{\"action\":\"press-and-release\",\"x\":$1,\"y\":$2}" >/dev/null; }
finger() { curl -sf -X POST "$API/finger" -H 'Content-Type: application/json' -d "{\"action\":\"$1\",\"x\":$2,\"y\":$3}" >/dev/null; }
apdu() { curl -s -m "${2:-60}" -X POST "$API/apdu" -H 'Content-Type: application/json' -d "{\"data\":\"$1\"}"; }
text_apdu() { printf 'e007%s00%02x%s' "$1" "$(printf %s "$2" | wc -c)" "$(printf %s "$2" | xxd -p | tr -d '\n')"; }
for i in $(seq 1 30); do curl -sf "$API/screenshot" -o /dev/null && break; sleep 1; done

shot 01-idle 3
tap 240 250; shot 02-idle-touched 0.7
shot 03-idle-back 4

python3 tools/apdus.py > "$OUT/apdus.txt"
apdu "$(sed -n 1p "$OUT/apdus.txt")" > "$OUT/apdu-path.txt"
(apdu "$(sed -n 2p "$OUT/apdus.txt")" > "$OUT/apdu-sign.txt") &
shot 04-asking 3
tap 360 552; shot 05-review 2
finger press 240 480; shot 06-holding 1
shot 07-lit 3.5
finger release 240 480
wait
shot 08-idle-one-lit 5

(apdu "$(text_apdu 01 'A skill tried to send stripe-live to evil.example.com')" > "$OUT/apdu-blocked.txt") &
shot 09-blocked 3
tap 240 300; wait
(apdu "$(text_apdu 02 'mcp-invoice changed after you allowed it. Its key is locked.')" > "$OUT/apdu-wentout.txt") &
shot 10-went-out 3
tap 120 552; wait

apdu "$(sed -n 1p "$OUT/apdus.txt")" >/dev/null
(apdu "$(sed -n 2p "$OUT/apdus.txt")" > "$OUT/apdu-declined.txt") &
sleep 3; tap 100 552; shot 11-not-lit 2
wait
shot 12-idle-end 4
docker logs tomoshibi-spec 2>&1 | tail -20 > "$OUT/speculos.log"
docker rm -f tomoshibi-spec >/dev/null 2>&1
