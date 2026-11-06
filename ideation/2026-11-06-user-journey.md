# One week with TOMOSHIBI — the concrete journey (2026-11-06)

> Who: **Priya**, 30, runs a small online shop. Not an engineer, and not trying to become one.
> She wants the shop to run, not to learn about keys.
> Markers: **[built]** works today · **[gap]** designed, not built.
> Amounts are illustrative. Everything else matches what is in `broker/` and `web/`.

---

## Part 1 — What has to be true before any of this works

This is the price of entry, and it should be read as a cost, not a feature.

| # | What she needs | Why | Where it comes from |
|---|---|---|---|
| 1 | **A Ledger device**, plugged in by USB, with the TOMOSHIBI app on it | It is the one button her agent cannot press. The scope is signed here and the private key never leaves it | She already owns one (bought for crypto). **[built]** — the bridge is `bridge/bridge.py` |
| 2 | **The bridge running** on the machine the Ledger is plugged into | It carries the four lines to the device and the signature back. It holds no keys and decides nothing | Installed once. **[built]** |
| 3 | **A TOMOSHIBI account with a hosted Broker** | This is where the secret is kept. It must be somewhere her agent is not | **[gap]** — today the Broker is run by hand; hosting it is the first item under "Next" in the README |
| 4 | **The API key itself, pasted into the Broker once** | She still has to get a Stripe key. The point is not that she avoids having one; it is that she never gives it to the agent | She does this once, on the TOMOSHIBI page, from the browser. **[gap]** as a product screen |
| 5 | **World App on her phone** | Only to light a star later. **Not needed to use a key** | **[built]** — `broker/src/world.js` |

**What she has to remember: nothing.** There is no password, no scope language, no config file.
**What she has to keep:** the Ledger, and its recovery phrase. That is the whole of her duty.

---

## Part 2 — The week

### Monday, 09:10. Kitchen table, laptop. **Lending the key.**

She types to her agent: *"Chase the unpaid orders from last week."*
The agent answers that it needs her Stripe key. **She does not have one to give it.**
Instead she pastes one URL — the Broker's — and the agent reads the setup guide there and
configures itself to go through TOMOSHIBI. **[gap]** — the guide and the one-paste setup are not built.

The TOMOSHIBI page then asks her four things in plain words: **which key, where it may go, what it
may do, how many times and until when.** She picks *Stripe · api.stripe.com · read invoices ·
20 times · 7 days*. The Ledger wakes and shows the **same four lines**, built from the same bytes
that are about to be signed. She holds the button for three seconds.

- **Function:** Custody + Permit **[built]** — `broker/src/permit.js`, `scope.js`
- **What it solves:** the agent now has a *handle*, not a secret. There is nothing in its context to leak
- **Value:** *she never handed the key over. She handed over one week of one operation.*

### Tuesday, all day. Laptop, then nothing. **Routine.**

The agent reads invoices twelve times. 0G is asked each time and answers `routine`.
The Ledger stays on its constellation. Her phone is silent. **She does not open TOMOSHIBI at all.**

- **Function:** Weight **[built]** — `broker/src/weigh.js`, 2.0 s, $0.000036 a call
- **Value:** *on an ordinary day it asks her nothing.* A tool that interrupts is a tool she will turn off

### Wednesday, 14:20. At the post office, **phone only**. **Something heavy.**

A customer wants a ₹4,800 refund. The agent decides to issue it. 0G reads the request and answers
`significant`. The Broker returns **`NEEDS_PRESS`** and **nothing runs.** Her phone shows one line:
*A refund — nothing happens until you hold the button on your Ledger.*

She gets home at 18:40, holds the button once, and **the refund goes out once** — a single-use
permit, not a new standing one.

- **Function:** Press **[built]** — `broker/src/tier.js`; a heavy request passes only on `maxCalls = 1`
- **What it solves:** the gap between "the agent decided" and "a person agreed"
- **Value:** *money cannot move while she is away from the device.* The delay is the product, not a defect

### Thursday, 03:00. Nobody is awake. **The accident.**

An updated version of the skill tries `POST` to a host that was never in the permit.
The Broker refuses **before 0G ever sees the body** — no credits spent, nothing forwarded —
and records `DENIED / OUT_OF_TARGET` **carrying the skill's own signature on the request**.

- **Function:** Scope + Attribution **[built]** — `scope.js`, `skill.js`
- **Value:** *the thing she feared most happened, and it did not get anywhere, and it has a name on it*

### Thursday, 08:30. Breakfast, **phone**. **The morning after.**

She opens one page: **"1 thing was stopped. 12 went through without asking you. 1 you let through
by hand."** Each line says what it was in her words, not in HTTP. Tapping one opens the full record
— the permit, the use, the 0G request ID, the return.

- **Function:** Trail **[built]** — `web/morning.js`, sealed into 0G Storage
- **Value:** *she can explain what happened to her own shop without asking anyone*

### Friday. **Lighting a star.**

A week in, it has worked. She confirms herself once through World ID and lights a star on that
skill version. The Broker refuses to light it unless she **owned the key and actually used it** —
signing alone returns `NOT_USED`. Her wallet address is never written into the star.

- **Function:** Flame **[built]** — `broker/src/owner.js`, `world.js`
- **Value:** *the next shopkeeper chooses by whose star it is, not by how many there are*

### Two weeks later. **The version changes.**

The skill ships `1.1.0`. **Every star on `1.0.0` goes out at once**, hers included.
What she sees is not a warning she must read — it is a star that is simply no longer there.

- **Function:** Flame **[built]** — stars are counted per version
- **[gap]** — her *permit* is not version-gated. A skill that updates while keeping its signing key
  keeps its existing scope until the permit expires. Expiry and call budget are the only limits today

---

## Part 3 — Where she actually spends attention

| | How often | How long |
|---|---|---|
| Setting up | once | a few minutes, once |
| Lending a key | once per tool, per week-ish | one long press |
| Being asked | **only when money moves** | one long press |
| Reading the morning page | when she feels like it | ten seconds |
| Lighting a star | when something has been good | once per version |

**Everything else is silence, and the silence is the deliverable.**
