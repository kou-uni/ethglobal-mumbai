# Per-prize "can we win it / what is missing / how to fill it" (conceptual stage, 2026-11-06)

**In one line: the current ceiling we can aim at is $11,250. The realistic line is $3,500–6,000.**

> **Correction 2026-11-06 (read the prize pages directly).** The first version put World at $7,500 and named 0G's tracks
> "Build with iAI" and "Wildcard". **Both were wrong.**
> For World, I **wrote that one team could take the total amount** (repeating a mistake I already made once with EF).
> In fact it is split into slots, and **two of those slots are Continuity-only, which we cannot enter.**
> 0G has **no track called "Build with iAI"** (it is actually
> **Build with 0G Private Computer**; iAI is a bonus condition inside it).
> There is no "Wildcard" either; it is actually **Agents That Pay for Themselves** (a revenue loop is required).

**Sources for the requirements (everything labeled "requirement" in these tables comes from the original text of these three pages):**

- https://ethglobal.com/events/mumbai/prizes/world
- https://ethglobal.com/events/mumbai/prizes/0g
- https://ethglobal.com/events/mumbai/prizes/ethereum-foundation

**"What is missing" and "how to fill it" are my own judgement.**
(The pre-event research notes are not placed in public; they are in the private `Mumbai-ideation-2026`.)

**Constraint: partner prizes are capped at 3 partners per project.** World / 0G / EF fill them.
Finalist is a separate slot.

---

## 0. The conclusion table

| Prize | Slot breakdown | Amount for 1st place | Can we aim at it | Biggest gap |
|---|---|---:|---|---|
| World **Agent Pass** | $5,000 / 3 slots (2,500 / 1,500 / 1,000) | **$2,500** | **Yes** | **A different thing from IDKit. Re-researched in §1** |
| World IDKit | $2,500 / up to 2 teams (**$1,250** each) | **$1,250** | Yes | No explanation of a minimal sufficient credential |
| World Agent Pass [Cont] | $2,500 | — | **No** | **Continuity-only. We cannot enter** |
| World IDKit [Cont] | $2,500 | — | **No** | **Continuity-only. We cannot enter** |
| **0G Build with 0G Private Computer** | $5,000 / 3 slots (2,500 / 1,500 / 1,000) | **$2,500** | **Best bet** | Credit usage isn't visible on any screen |
| 0G Physical AI | $5,000 / 3 slots (2,500 / 1,500 / **Hardware 1,000**) | $2,500 | **Maybe to yes** | No body. **But the Hardware slot is separate** |
| 0G Keep Building | $3,000 | — | **No** | **Continuity-only. We cannot enter** |
| 0G Agents That Pay for Themselves | $2,000 / up to 2 teams ($1,000 each) | $1,000 | **Low** | **There is no revenue loop** |
| EF CROPS | $3,500 / 3 slots | **$2,000** | Yes | **The Broker holds plaintext keys = violates the P** |
| EF Anon-RPC | $5,000 / 3 slots | $2,500 | Maybe | Waiting on #6's 30-minute decision. **EF is one prize only** |
| ENS ENSv2 | $7,000 | — | **No (not taking it)** | It competes with EF for the 3 partner slots. See §6 |
| Finalist | Not stated | — | Yes | Practicality (who pays) is absent from the 4 minutes |

**Ceiling = World $3,750 + 0G $5,000 + EF $2,500 = $11,250.**
**We cannot enter the four Continuity-only tracks ($11,000 worth).**

**Multiple tracks from the same sponsor can be won [confirmed, 2026-11-06].** The official submission guidance says
"If a partner has multiple tracks, you can be eligible for all of them while only
counting as 1 Partner Prize". **So World's two tracks and 0G's multiple tracks
each use only one partner slot.** The ceiling of $11,250 therefore stands.
(0G's "the number of slots is not stated, at 0G's discretion" is about how the prize money is split, a separate matter.)

---

## 1. World (aiming for $3,750)

**→ What Agent Pass actually is has been re-researched in `spec/world-agent-pass.md`. Inside, it is standard OIDC.**
**It has the `device_code` grant, so it can be called straight from the Broker.**
**The denial / expiry paths are built into the device flow as standard, so we don't need to build them**
(the "what is missing, item 2" below disappears if we use Agent Pass).


**Requirements (from the original text)**
- Integrate with the official **World ID Agent Pass**
- **Show the whole flow**: requesting the proof → the key holder completing it → verifying the result → the protected action
- **Also show the denial / expiry / revocation / failure paths**
- **Verify on a secure backend.** Don't expose the client secret. Don't trust a response from an unverified client
- **A retrospective on the integration** (time to first success, where you stumbled, missing documentation, one improvement idea)
- The IDKit side additionally requires "**an explanation that the credential used is minimal and sufficient**" and a demo of both the success path and the alternative path

**What is missing**

1. **We designed on the assumption that Agent Pass was the same thing as IDKit.** It is a different product, and we haven't touched it.
   **This decides whether World's $7,500 lives or dies. Kill it first**
2. **The denial path isn't World's.** The `DENIED` in script v4 is the Ledger's denial,
   not World's "the proof expired / was revoked". **The judges want to see World's denial**
3. **Not one character of the integration retrospective has been written** (D6, kou owns it). Required for both prizes
4. The proofs at the venue are mocked. Whether backend verification passes with a mock is unverified

**How to fill it**

- **Spend 30 minutes right now reading the Agent Pass docs.** If the shape of the integration differs from IDKit, fix this before the design
- **Add one denial path: the star owner's proof has expired.**
  → The star turns **gray**, and the Broker returns `DENIED: proof_expired`.
  **Revive F from #10 (the gray star), not as experience but as "World's denial path".** One screen is enough
- **Start writing the retrospective now, and add a line every time we get stuck.** It can't be written after the fact
- The credential explanation goes in the README in three lines: "All we use is the nullifier.
  Orb or Device doesn't matter. **Knowing it's a human is enough; who they are isn't needed**"

---

## 2. 0G (aiming for $5,000, entering two tracks)

### Correction: there is no track called "Build with iAI"

It is actually **Build with 0G Private Computer** ($5,000 / 3 slots).
**iAI is a bonus condition inside it** ("authenticate with a 0G account, and make the credits visibly decrease").

**Requirements (from the original text)**
- **Run inference on 0G Private Computer inside the main usage flow, with a request ID**
- A working application the judges can touch. **The reason to come back must be clear**
- The reason for depending on 0G, **in one sentence**
- **iAI bonus: authenticate with a 0G account, and make the credits visibly decrease**

**All of this is what we were already going to do. No stretching required. Make it the best bet.**

### Physical AI doesn't require claiming a "body"

**The third slot, `Hardware: $1,000`, is separate.**

| Slot | Amount |
|---|---|
| 1st | $2,500 |
| 2nd | $1,500 |
| **Hardware** | **$1,000** |

**We don't need to claim the Ledger is the body in "Agents with a Body".
Simply having a real-hardware demo puts us in the Hardware slot.**

**Requirements (from the original text)**
- **0G calls inside the decision loop** (vision / voice / decision model)
- An episode log into 0G Storage (**a request ID per decision**)
- **A reproducible simulation, or a real-hardware demo**
- **A safe-stop when 0G is unreachable** (**faking the judgement is disqualifying**)

**How to fill it (extra work is one screen and three README lines)**

1. **Show credit consumption on screen C.** Each line of the trail gets `0G: decisive (req_8f2a… / 0.0031 0G)`.
   **The iAI bonus can be satisfied with just this**
2. **Add 0G-account authentication** to the Broker (the first half of the iAI bonus). **Unverified: how**
3. **Two README lines on the reason to come back.** "A star is meaningless once.
   The more the fact of continued use with the same key piles up, the heavier it gets. **So you come back the next day**"
4. **The reason for the dependency, in one sentence.** "Private Computer is the only place that can run the weight judgement externally without handing over the key or the body"
5. **Enter both. The implementation is the same.** Private Computer for 1st, Physical AI for the Hardware slot

⚠️ **"Faking the judgement is disqualifying" is in the original text.** The weight judgement must show the result of actually asking 0G.
**Don't film a hardcoded `significant` / `decisive`.**

### Agents That Pay for Themselves ($1,000, low fit)

It requires a revenue loop (tx hash and request ID) / **running on its own during the demo without a human topping it up** /
**a cap and graceful degradation when it runs out**.

**There is no revenue loop, so we're not taking it.** But `maxCalls` is exactly "a cap and graceful degradation",
so **if there is room, just enter it anyway.**

---

## 3. EF CROPS (aiming for $2,000)

**Requirements (from the original text)**
- A public repository with an OSS license, plus a README
- A **CROPS section** in the README (1–2 lines each for C/O/P/S. **The P line must state what each third party learns**)
- The diff between the state before and after the event
- A demo video of 3 minutes or less
- **No trackers or analytics**
- **Keys and personal data stay inside the device. Exceptions are explained in the README**

**What is missing — this is a head-on contradiction**

**The Broker holds plaintext API keys.** That directly contradicts "keys stay inside the device".
**The center of this work's design violates CROPS's P.** Hide it and it gets hit in judging.

**How to fill it (3 options, strongest first)**

1. **Put the Broker on 0G Private Computer (a TEE).** The contradiction disappears.
   **And it also lines up with 0G iAI's "inference on Private Computer".** Do this if there is time
2. **Write it out fully in the README as an exception.**
   "The key is not in the device, it is inside the Broker. **Safer than being inside the PC, but the Broker is a trust point.**
   In production it goes in a TEE. This time it is not"
   → **Naming your own weakness is stronger in judging than staying quiet**
3. ~~Put the key back in the device~~ → then the AI can read the key, which breaks the work's premise. **Not taking it**

**The P line (what each third party learns) can be written as is.**

| Who | What they learn |
|---|---|
| Ledger | Only the 4 scope lines. It knows neither the key's contents nor the counterparty |
| World | That it is a human. **Not who** (just the nullifier) |
| 0G | The request's weight and the request id. **Neither the key nor the body is handed over** |
| Broker | **Learns everything. This is the trust point** |

**"The diff between before and after the event" is already satisfied by how the repository is run** (only things from 11/5 21:00 onward).

---

## 4. EF Anon-RPC ($2,500, conditional)

**Enter it if #6 passes within 30 minutes. If not, CROPS alone.** Unchanged from D4.
**EF is one prize per project, so even if we enter both only one can land.**
The difference between the two first places is $500 ($2,500 vs $2,000). **Not worth betting time on.**

---

## 5. Finalist (amount unverified)

**Five judging axes:** Technicality / Originality / Practicality / Usability (UI/UX/DX) / WOW Factor.
The presentation is **7 minutes (4 minutes of demo + 3 minutes of Q&A)**.

| Axis | Current hand | Gap |
|---|---|---|
| Technicality | Ledger custom app, EIP-712 inside the device, 0G Compute | — |
| Originality | "The star is a fact, not a promise" | — |
| **Practicality** | — | **Not one line in the 4 minutes says who pays** |
| Usability | Only three screens. minta owns it (#12) | — |
| WOW | Long press → ★ stamp, all going out at once | — |

**How to fill it: add one line for Practicality.**
"Skill authors pay in order to collect stars. **Because the stars can't be bought, they're worth paying for**"
**It will definitely be asked in the 3 minutes of Q&A, so put it inside the 4 minutes.**

---

## 6. We are not taking ENS (why we pass on $7,000)

**Best Use of ENSv2 $7,000 is bigger than EF on amount alone.** We still don't take it.

1. **Partner prizes are capped at 3 partners.** Adding ENS means dropping EF
2. **ENSv2 is mainnet or Sepolia.** It splits from the design that puts the registry on 0G Galileo.
   **Straddling two chains dilutes 0G's "call 0G inside the decision loop"**
3. "It must be core to the functionality" is a requirement. **The name is not core to this work**
   (the core is "whose star it is", and that "whose" is adequately served by a nullifier)

**But remember:** "whose star it is" is, fundamentally, also a question of names.
**Next time we ship this, ENS could be the main bet.** This time it just loses the fight for a slot.

---

## 7. Order to kill things today (biggest gap first)

| # | What to do | Who | Estimate | If it falls |
|---|---|---|---|---|
| **1** | **Register the Agent Pass client and get `device_code` talking** (`spec/world-agent-pass.md`) | kou | 1 hour | World $2,500 |
| **2** | **Show credit consumption on screen C** (`req_… / 0.0031 0G`) + 0G account authentication | minta, kou | 1 hour | 0G's iAI bonus |
| **3** | **Start writing the integration retrospective** | kou | From now on | Both World prizes |
| **4** | The README's CROPS section, and the explanation of the Broker exception | kou | 1 hour | EF $2,000 |
| **5** | The one-sentence reason for depending on 0G / two lines on the reason to come back / film the safe-stop | kou | 30 min | 0G $2,500 |
| **6** | Add the Practicality line to the script | kou | 10 min | Finalist |

**"Add World's denial path" has disappeared.** The Agent Pass device flow includes
`access_denied` / `expired_token` as standard (`spec/world-agent-pass.md` §3).

---

## Unverified

- **Whether one project can win multiple tracks from the same sponsor** (neither World nor 0G states that you cannot)
- The Finalist prize amount (not stated in primary sources)
- **Whether the Agent Pass `device_code` flow runs with the venue's mock proofs**
- Which claim in the `id_token` carries the sector-scoped identifier
- Whether 0G's faucet at 0.1 0G/day gives enough credits to run the weight judgement
- How to do 0G-account authentication (the iAI bonus)
