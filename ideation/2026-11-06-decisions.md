# Decision log (2026-11-06)

## 11/6 early morning [agreed]
1. **Adopt minta's proposal (PR #4).** A star is not a promise; it is the fact that "I am using this version with my own key". Violations are recorded against the skill, and the voucher's weight is not reduced. Deposits, tips, quadratic matching, 2-of-2 and Stack-chan are out of scope this time
2. **Drop ENS.** The third partner slot goes to **EF** (Ethereum Foundation). Submit to both CROPS and Anon-RPC (EF gives one prize per project, so the judges decide which one we land in) → `research/10-ef-fit.md`

## Extra work this creates
- Write a CROPS section in the README (on the Private line, what Ledger, World and 0G each learn). Attach an OSS license and use no trackers
- Make star reads go through Anon-RPC by default. Fetch everything and filter on the device (so the content of the query does not leak the web of who you know)

## 11/6 morning [agreed]

3. **D1–D7 (`2026-11-06-plan.md`) agreed.** Both a Flex and a Nano X are on hand as real devices.
   Total time invested in Ledger is capped at 4 hours. #6 Anon-RPC gets a 30-minute go/no-go; if it does not pass, EF goes to CROPS only.
   Filming 11/6 22:00 IST / submission 11/7 06:00 IST. kou owns World's "onboarding retrospective".
   The trail is displayed as a single QR, nothing more
4. **D2 changed: build the Ledger side as a custom app** (#11, minta).
   **Up to the morning of 11/6 the position was "do not go for a custom app".** The reason was "the SDK, the build environment and device management mode cannot be done in 36 hours". **A custom app ran on a real Flex, so that premise is gone.**
   Clear gate 0 (the standard app) first to lock in the floor; if it fails, step back down a tier. Keep the 4-hour cap
5. **Signature hand-off frozen in `spec/permit-signature.md`.** The derivation path is the same as the standard app,
   `m/44'/60'/0'/0/0`, and the EIP-712 digest is computed **inside the device** from the original four-line values
   (no blind signing). The Broker does not use the digest it is sent; it rebuilds it and runs `ecrecover`
6. **A, C, D and E from #10 go into script v4.** B is spoken in the pitch only (not in the video).
   **F (the grey-star experience) is not taken** — the World at the venue is a mock proof, so the experience does not hold up

## 11/6 early morning to morning (in implementation) [kou decided; if × we change it]

7. **"A press right here, right now" = a permit with `maxCalls=1`.**
   A request that 0G judges `decisive` is not let through by a standing permit (`maxCalls>1`); it returns `NEEDS_PRESS`.
   This was done **so as not to grow the signature contract (`spec/permit-signature.md`)**.
   Adding a new signature type would mean minta's custom app has to change too.
   **If × this can be changed on the Broker side alone** (one place, `needsPress` in `src/tier.js`)
8. **0G and World got a "simulation mode"** (`ZG_OFFLINE=1` / `WORLD_OFFLINE=1`).
   So development does not stall until the API key and client registration are in place.
   **`simulated: true` stays in the record, and /health and the demo show "simulated".**
   The 0G prize says "a fallback that fakes a decision is disqualifying", so **turn it off for filming and submission**
9. **Stars are held per `(skill, version)`.** If the version changes, stars on the previous version do not count (i.e. they all go out at once).
   How many there were on the previous version is kept (so that the going-out is visible)

10. **Turn off 0G's reasoning (thinking).** `chat_template_kwargs.enable_thinking=false`.
   The reason is not speed but **correctness**: with thinking on it takes 17.2 seconds, which hits the 20-second timeout and
   turns into "could not decide" = `STOPPED`. A `STOPPED` that is not real is as bad as a fabricated verdict.
   Measured (2026-11-06, production key): thinking on 17.2s / `reasoning_effort:low` is 24.1s and returns an empty answer /
   off is 2.0s. The verdicts matched 6/6 across 3 heavy and 3 light cases. `ZG_THINKING=1` restores it.
   The timeout was raised to 30 seconds as insurance
11. **The public demo URL is GitHub Pages plus the video.** Do not use the public route that is frozen for a separate matter
12. **Do not borrow Indian words or symbols.** The emoji is 🕯️; 🪔 (diya) is not used

13. **The routine scenario is "read a balance". `scope` is `* /v1`.**
   Production 0G reads **not the amount but whether money moves**. Measured (2026-11-06, production key):
   a charge is **"decisive" at $4,800, at $12, and even at $1** ($12 scored 3/3), `POST /v1/customers` is "significant",
   and `GET /v1/balance` and `GET /v1/charges` are "routine".
   → The "routine" scenario in minta's gate.html (a $12 charge) would add a long-press.
   `scope` is a prefix match that accepts `*` for the method (`broker/src/scope.js:34`), so
   **lending once with `* /v1` produces both "routine passes silently" and "heavy wakes you up". No extra long-press on the real device.**
   Verified end to end in production (ALLOWED routine → NEEDS_PRESS decisive → DENIED out of scope)
14. **The star of the video is `web/gate.html`** (the one wired to the real device). `ui/index.html` stays as a design prototype and as filming insurance
15. **The Broker is exposed through a temporary cloudflared URL, only for the duration of filming and judging.**
   The Funnel (443 → 8402) is frozen for a separate matter, so do not touch it. `SECRETS` is not set and `EXECUTE` stays off.
   **Do not write the URL in the public repo** (anyone could burn through the 0G credits)

## 11/6 evening (market and model) [kou decided; if × we change it]

16. **Take no percentage of flow as revenue.** Taking a fee on payment volume makes us **a company that loses money the more it stops things**.
   The price tags go on "judgement" (metered verdicts) and "display" (the flame).
   `ideation/2026-11-06-market-and-model.html` §05
17. **Deposits and insurance stay dropped** (reconfirming Decision 1).
   A deposit inverts into "**the more money you have, the more you are trusted**", which breaks the meaning of the flame.
   Charging a premium **could fall under insurance regulation** [unverified]. What you stake is **your own key itself**.
   If we ever do it, a deposit goes on **a separate axis, not mixed into the flame's weight**, and insurance takes the form of **handing the trail to a third party**.
   `ideation/2026-11-06-actors-io.html` §03
18. **The market is counted as three wallets.** Protect (machine identity + secrets) $24B / show credibility (maker marketing) $3B /
   transfer loss (cyber insurance) $16B. **TAM $43B, SAM $2–7B, SOM $1.4M (year 3).**
   The SOM is presented small and honest. Sources are at the end of the deck (research-firm numbers vary by more than 2x, so **only the order of magnitude** is used)

## 11/6 night (submission and judging) [agreed]

19. **Enter Finalist judging** (the owner, 2026-11-06). On the submission form pick
   **"Finalist and Partner Prizes"**. Seven minutes = **4-minute demo + 3-minute Q&A**.
   The script is `ideation/2026-11-07-finalist-4min.md`. The 2:55 submission video is kept separately.
   **The judging time appears on the Dashboard after submission**, so do not delay submitting (target 11/7 06:00 IST)
20. **The partner prize slots are fixed at three: World / 0G / EF.**
   The official rules say "**you can apply to all tracks of the same partner and it only uses one slot**",
   so both of World's tracks and several of 0G's tracks can be entered at once (the $11,250 cap holds).
   The "unverified" note in `research/11-prize-gap.md` is resolved
21. **State AI usage and reuse explicitly in the README** (required by the rules).
   Without it we could be **excluded from partner prizes and Finalist**.
   The spec and the decision log (`spec/`, `ideation/`) **are not to be deleted before submission**.
   The rules state explicitly: "show not the output but how you instructed it"

## Still unverified
- Whether EF uses one of the three partner slots
- Whether 0G Galileo's RPC can actually be read through Anon-RPC (mechanically it should be)
- Whether a custom app can derive `44'/60'` / whether keccak256 can be run inside the device
- **World: whether `verification_uri_complete` is returned** (it changes how the QR is built) / **the claim name for the sector identifier**
  (we currently treat `sub` as the pseudonym) / whether the device flow runs to completion against the venue mock
  → `ideation/2026-11-06-world-integration-notes.md`
- ~~0G Galileo's chainId~~ → **16602 [verified]** (measured with `eth_chainId` against `evmrpc-testnet.0g.ai`. 16601 is a stale entry, do not use it)

## 11/6 morning (unit cost, 11/7 IST) [kou decides; if × we change it]

22. **The cost of one verdict is $0.000036 (0.0056 yen). Confirmed by measurement.**
   Token counts are the average over the **467 requests** sent to production 0G
   (`ui/scenes.json` + `broker/data/ledger.jsonl`) (input 283.9 / output 28.0). The unit price comes from
   **`pricing_usd` in `GET router-api.0g.ai/v1/models`, which we call every time**
   (`0gm-1.0-35b-a3b`: input $0.00000008/tok, output $0.00000048/tok).
   **The price list did not need to be hunted down externally; it was inside the API.**
   That is **5x cheaper than the bottom** of the $0.0002–0.0019 range we had guessed.
   - $9/month for 50,000 verdicts → **80%** gross margin. Overage $1/1,000 verdicts → **96%**. A free tier of 2,000 verdicts → **$0.07** per month
   - **Consequence:** "close the 10x range on unit cost" was the deck's first action, but **closing it showed that
     unit cost was never the issue**. The basis for pricing can only sit on **value to the buyer**, not on cost.
     The first action moves up to 20 P1 interviews (at which "stopped" event do they pay?)
   - **Unverified:** whether the 192 cached input tokens get a discount (if so the cost is lower still).
     The SIA build (`-sia`) is 6.7x more expensive ($0.536/M, $3.216/M), so we do not use it
   - **Side effect:** the **reason** for the "do not send routine requests to 0G" optimization **changed**. It is no longer about cost,
     only about speed (not making the user wait 2 seconds). **There is no longer any need to cut safety for cost reasons**

23. **The seal to 0G Storage landed on the production chain** (2026-11-06 09:30 IST).
   Gas arrived (9.99 0G) → one `/seal` call. `status 0x1` / block **64103318** / gasUsed **306,371**.
   root `0xc0e0c7a911547490680d545ad9d4638a9bf23bd72d8a3004edf9b4ffaa5be080`,
   tx `0x74c7cdf9bca055c502918e62a7ac9fc7634d1326471433ab10161045aa97aef1`.
   The hedge in the submission text — "the trail is local append-only" — **is no longer needed**. Paste the real tx.
