# Pick up here (updated 2026-11-06 11:00 JST / 07:30 IST)

**Open a new session and this file alone is enough to resume.**
The working directory is `~/ch/seeds/ethglobal-mumbai/repo` (a clone of this public repository).

---

## 1. Where we are, in one line

**The Broker is wired to the live 0G and it works. All five end-to-end runs come out.
The only thing stuck is gas. Next up is the three-minute pitch script.**

## 2. The steps we confirmed work (type them in this order and it reproduces)

```bash
cd ~/ch/seeds/ethglobal-mumbai/repo/broker

# the Broker wired to the live 0G
(set -a; . ./.env.local; set +a; PORT=8797 EXECUTE=0 node src/server.js &)

# a Broker that "cannot reach 0G" (to demonstrate STOPPED; just hand it an unreachable endpoint)
(set -a; . ./.env.local; set +a; ZG_ENDPOINT=https://router-api.invalid/v1 PORT=8798 EXECUTE=0 node src/server.js &)

curl -s http://127.0.0.1:8797/health            # apiKey:true / storageKey:true / no simulated field
node demo.mjs http://127.0.0.1:8797 http://127.0.0.1:8798   # the five end-to-end runs
npm test                                        # 50/50
```

**Note:** old Brokers from earlier sessions may still be sitting on 8787-8789.
`kill` is blocked in this environment, so **use free ports** (8797 / 8798 are free).
`.env.local` is gitignored. On a machine without it, set `ZG_API_KEY` and `ZG_PRIVATE_KEY` yourself.

## 3. What is done

| | State |
|---|---|
| Broker (scope, call budget, violations, proxied execution, trail) | Works. Tests 50/50 |
| 0G Private Computer (weight judgement) | **Confirmed working with the production key**. 1.3-2.2s, request id captured |
| The five end-to-end runs (ALLOWED / NEEDS_PRESS / passes with one press / 5 kinds of DENIED / STOPPED) | **All of them come out** |
| Ledger app (minta) | Works on the device. `origin/minta/ledger-app` |
| First draft of the submission form, one-page architecture, one-page TODO, address list | Exist (§6) |

## 4. What is stuck

| Waiting on | Impact | If it does not land |
|---|---|---|
| **gas** (`0xdfcbC73bEC15dD080545f77f8B702832a2b142A4`) | Cannot write to 0G Storage. The root hash comes out but there is no tx | Write "the trail is local append only" in the submission. Do not pretend there is a tx |
| **World client registration** | Proof of personhood for stars will not run in production | Drop the star from the live demo and explain it as design |

Gas needs **0.0000002-0.0000005 0G** (measured). The faucet (`https://faucet.0g.ai`) is not coming through,
so we have asked for a direct send over Telegram.

## 5. What to do next (top first)

1. **The three-minute pitch script** (a version spoken in Japanese plus a version read in English).
   Build it on `ideation/2026-11-06-storyboard.md` and the "four kinds of denial" section of architecture v3
2. Once gas lands, run `/seal` once and **note the tx and root hash** (paste the real values into the submission)
3. Once the World client registration is done, run the device flow through
4. **Filming 11-06 22:00 IST**. Before that, eyeball `/health` to confirm `simulated` does not appear
5. **Provisional submission 11-07 03:00 IST** (deadline 09:00 IST)

## 6. Where things are

| What to look at | Location |
|---|---|
| **TODO up to submission (one page, checkable)** | `ideation/2026-11-06-todo.html` |
| First draft to paste into the submission form (all fields) | `ideation/2026-11-06-submission-form.md` |
| The long version of the submission text (English) | `ideation/2026-11-06-submission-draft.md` |
| **Architecture (current source of truth)** | `ideation/2026-11-06-architecture-v3.md`, one-page HTML under the same name `.html` |
| All addresses, endpoints and environment variables | `ADDRESSES.md` |
| The boundary between the device and the Broker (**move it and signatures break**) | `spec/permit-signature.md` (test vector in §6) |
| What is decided and what is not yet confirmed | `ideation/2026-11-06-decisions.md` |
| Source of truth for procedure (admin, prize requirements, filming) | `ideation/2026-11-06-submission-checklist.md` |

**Old material**: `ideation/2026-11-06-architecture.md` (v2) still contains parts we dropped. There is a marker at the top.

## 7. Things that must not move

- The **domain** in `spec/permit-signature.md` (`verifyingContract` frozen at the zero address, chainId 16602).
  Change it and minta's device no longer agrees with `ecrecover`
- **The ETHGlobal Tokyo 2026 artifacts (a separate, frozen project) and their public routes.** TOMOSHIBI uses none of them.
  The demo URL goes out via GitHub Pages plus video
- **Do not borrow Indian words or symbols** (the reason we do not use 🪔; background in `interests/ethglobal-mumbai-hackathon-plan`)

## 8. Who does what

- **minta** = the visible side (Ledger app, star screen, filming)
- **kou + Claude** = the invisible side (Broker, 0G, World, design, writing, submission)
