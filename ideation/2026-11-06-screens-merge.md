# Proposal for merging the screens into one line (minta) — 2026-11-06

I read kou's `ui/` (the gate and flame prototypes) side by side with minta's `web/`, the Ledger app and the bridge.
**Conclusion: they don't collide. Added together they form one line.** Only kou has the gate, and only minta has the parts connected to the real device.

## 1. What is on which side

| What we want to show | kou's `ui/` | minta's `web/` + real device |
|---|---|---|
| 0G reads the contents and decides the weight (4 ways of stopping) | **The gate. Driven by real 0G responses** | None |
| Pressing in your hand | An on-screen "press" button. The signature is pre-made with **a software key** (`0x11…`) | **A long press on the real FLEX.** Screen → bridge → device → Broker works end to end |
| The fact that something out of scope was stopped appears in your hand | `DENIED` appears inside the gate | **The device inverts black and white and shows `BLOCKED`** |
| Flames (who is using it) | 7 flames on one tool. Shows a **count**. The values are the prototype's own | The sky. Toggle between `Everyone` (buyable stars) and `People I know` (flames from people you know). Read from the Broker |
| Record | A trail column at the bottom right of the gate | The record screen. **Can be handed to a phone by QR** (a public link; verified) |
| Language and look | Japanese, white background. It says "a prototype, before minta finishes it" | English, night colors |
| Where it is published | `kou-uni.github.io/ethglobal-mumbai/ui/` | `mintannn.github.io/tomoshibi/` |

## 2. Two things that concern me

1. **The gate's "press" does not currently go through the real device.** §6 of the script also says "not yet connected on the same screen".
   As it stands, the biggest moment (the button an AI cannot press) becomes an on-screen button, and the real device gets filmed separately.
   **It can be connected.** When the gate receives `NEEDS_PRESS`, call the bridge's `/permit`, and re-send `/use` with the device's signature. `demo-ledger.mjs` already does the same thing.
2. **The flame screen has gone back to a "count".** The script says "so the count points at 'being used right now'".
   What we decided in #7 was "**don't show a star count in the sky. Not the count, but whose star it is**". What helps with the World prize is the "whose" side too.
   "They all go out at once when the version goes up" is in `web/` as well (`Demo: the tool changes`).

## 3. Proposal: which screen to film each scene on

| Time | Scene | Screen | Real device |
|---|---|---|---|
| 0:00 | Question | Gate (idle) | A sleeping flame |
| 0:15 | 1. Routine → goes through | **Gate** (kou) | Stays asleep. Asks nothing |
| 0:40 | 2. Heavy → 0G says "decisive" | **Gate** (kou) | **`Lend …?` appears** |
| 1:10 | Press | Gate | **Long press on the device → `A light is lit.`** → the gate goes `ALLOWED` |
| 1:30 | 4. Out of scope → stops | **Gate** (kou) | **Inverts black and white and shows `BLOCKED`** |
| 1:55 | 6. 0G unreachable → stops | **Gate** (kou) | — |
| 2:20 | Flames: who is using it. They go out when the version goes up | **Sky** (minta's `web/`) | `went out` |
| 2:45 | Record | **Read the record screen's QR with a phone** (minta) | — |

## 4. Work needed for that

| Work | Who | Size |
|---|---|---|
| Connect the gate's "press" to the real device (use the device if the bridge is there, otherwise the current button) | minta (needs kou's OK since it touches `ui/`) | Small |
| On the gate's `DENIED`, call the bridge's `/notice` to show `BLOCKED` on the device | minta | Small |
| Make the gate English and match its look to the sky | minta | Medium |
| Use `web/index.html` for the flame screen (keep `ui/stars.html` as a prototype or drop it) | Both decide | — |
| A link from the gate's trail to the record screen (QR) | minta | Small |
| Consolidate publishing to one place (`web/` goes on kou's Pages too; merge PR #17 and it opens at `…/web/`) | kou (merge PR #17) | Small |
| Run it end to end on the real 0G and World, with the real device in it | Both | — |

## 5. What I want decided

1. May the gate's "press" be connected to the real device (minta changes `ui/`)
2. Do we film the flame screen as "whose" (`web/`'s sky) rather than as a "count"
3. Do we merge PR #16 and #17 into main (if so, publishing consolidates to one place)
