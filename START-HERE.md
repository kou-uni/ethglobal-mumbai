# Start here (updated 2026-11-06, 14:00 JST / 10:30 IST)

**Open a new session, read this file only, and you can carry on.**
Working directory: `~/ch/seeds/ethglobal-mumbai/repo` — a clone of the public repo.

**The repository is written in English.** Conversation with the agent is in Japanese;
everything committed is English (Decision 24). Already-recorded evidence is the one exception —
see §7.

---

## 1. Where we are, in one line

**The broker runs against production 0G, all five paths come out, two trails are sealed on chain,
and the tests pass 58/58. Nothing is blocked.**

## 2. The commands that reproduce it

```bash
cd ~/ch/seeds/ethglobal-mumbai/repo/broker

# the broker, wired to production 0G
(set -a; . ./.env.local; set +a; PORT=8801 EXECUTE=0 node src/server.js &)

# a broker that cannot reach 0G, so STOPPED can be demonstrated (just an unreachable endpoint)
(set -a; . ./.env.local; set +a; ZG_ENDPOINT=https://router-api.invalid/v1 PORT=8802 EXECUTE=0 node src/server.js &)

curl -s http://127.0.0.1:8801/health          # apiKey:true, storageKey:true, no "simulated", escalateFrom: decisive
node demo.mjs http://127.0.0.1:8801 http://127.0.0.1:8802   # all five paths
npm test                                      # 58/58
```

**Note:** old brokers from earlier sessions may still hold 8787–8798. `kill` is blocked in this
environment, so **use a free port**. `.env.local` is gitignored; without it, set `ZG_API_KEY` and
`ZG_PRIVATE_KEY` yourself.

## 3. Done

| | State |
|---|---|
| Broker (scope, call budget, violations, proxy execution, trail) | works. 58/58 tests |
| 0G Private Computer (weight judgement) | **verified with the production key.** ~1.3–2.0 s, request ids recorded |
| All five paths (ALLOWED / NEEDS_PRESS / press-and-pass / 5 kinds of DENIED / STOPPED) | **all come out** |
| **0G Storage seal, on chain** | **two transactions.** `0x74c7cdf9…aef1` (block 64103318) and `0x90ecc8a4…5455` |
| Ledger app (minta) | runs on the device, `origin/minta/ledger-app` |
| **Gas** | **arrived.** Broker key holds ~4.49 0G; minta's address `0x5f52…22bD` holds 5.5 0G |
| **Cost per verdict** | **$0.000036**, measured — Decision 22 |
| **Tier vocabulary in English** | **switched after measuring**, not before — Decision 25 |
| Repository in English | done except the two batches noted in §5 |

## 4. Still blocked

**Nothing.** Gas has arrived, both seals are on chain, and the World client is registered.
What is left is filming, images and the form — all of it work, none of it waiting on anyone.

## 5. Next, in order

1. **Screenshots — three of them, into the README** (the gate's four stops / the device's four lines /
   stars before and after a version bump). **Usability cannot be scored without images**, and an AI
   first-pass reader never sees the video. `ideation/2026-11-06-ai-judging.md` §2.
2. Paste `ideation/2026-11-06-submission-form.md` into the Hacker Dashboard form. It already carries
   the verifiable facts, what was hard, and the differentiation paragraph.
3. Run the device flow on camera, now that the World client is registered.
4. **Filming 11-06 22:00 IST.** Before rolling, check `/health` shows no `simulated`.
5. **Submit 11-07 06:00 IST** (hard deadline 09:00 IST). Choose **"Finalist and Partner Prizes"**.

## 6. Where things are

| To find | Look at |
|---|---|
| **The one story — money, judges and India as one claim** | **`STORY.md`** |
| Decisions, and what was rejected | `ideation/2026-11-06-decisions.md` (25 entries) |
| Submission form text, ready to paste | `ideation/2026-11-06-submission-form.md` |
| How an AI first-pass reader scores this, and what to fix | `ideation/2026-11-06-ai-judging.md` |
| Why Mumbai — RBI, NPCI, CERT-In, with the limits stated | `ideation/2026-11-06-why-mumbai.md` |
| The money model, re-examined against measured cost | `ideation/2026-11-06-money-review.md` |
| Architecture (current) | `ideation/2026-11-06-architecture-v3.md` and the same-named `.html` |
| Every address, endpoint and env var | `ADDRESSES.md` |
| The device/broker boundary (**moving it breaks signatures**) | `spec/permit-signature.md` (test vector in §6) |
| Rules, deadlines, video constraints, our compliance | `ideation/2026-11-06-submission-rules.md` |

## 7. Do not move these

- The **domain** in `spec/permit-signature.md` (`verifyingContract` frozen at the zero address,
  chainId 16602). Change it and minta's device no longer agrees with `ecrecover`.
- **`ui/scenes.json` and `web/scenes.json`** — verbatim responses recorded from the production model,
  including Japanese verdict strings. **Editing them would be falsifying measurement.** New recordings
  come out in English, because the prompt changed; old ones stay as they are.
- The **ETHGlobal Tokyo 2026 artifacts (frozen, unrelated)** and their serving path. TOMOSHIBI uses
  neither. The demo goes out on GitHub Pages and video.
- **Do not borrow Indian words or symbols** (this is why the emoji is 🕯️ and not 🪔).

## 8. Division of labour

- **minta** — the visible half: the Ledger app, the screens, filming.
- **kou + Claude** — the invisible half: broker, 0G, World, design, writing, submission.
