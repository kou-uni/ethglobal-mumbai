# `tools/`

| File | What it does |
|---|---|
| `demo-up.sh` | Brings the whole demo up: Broker on 8797, **a second Broker on 8798 with no 0G** (that is how `STOPPED` is shown), the agent on 8792, the pages on 8790, the bridge on 8791 |
| `demo-check.mjs` | Checks the pieces are answering before you start filming |

**`demo-up.sh` sets `ZG_ESCALATE=significant`.** The code default in `broker/src/tier.js` is
`decisive`. The demo raises it because a refund comes back `significant` two times out of three,
and a refund that slides through unasked is a weak thing to film. **Say "in this setting, anything
significant or above asks a human" on camera** — not "only decisive ones".
