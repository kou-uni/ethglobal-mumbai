# Lean Canvas — TOMOSHIBI

**Written 2026-11-06.** Derived from `STORY.md` (the spine), `ideation/2026-11-06-money-review.md`
and `ideation/2026-11-06-market-and-model.html`. Where this file and an older deck disagree,
`STORY.md` wins and the disagreement is listed in §11 rather than smoothed over.

Every number here is either **[verified]** (we ran it and read the result) or **[unverified]**
(we believe it and have not checked). Nothing in between.

---

## 1. Problem

1. **To let an agent act for you, you have to hand it a standing secret.** A Stripe secret key, a
   wallet private key, a logged-in OAuth session. Once handed over it has no destination limit, no
   count limit and no expiry. **There is no way to hand over less.**
2. **When something is refused, every system says the same word: "failed".** Was it outside what the
   owner permitted? Was it irreversible and nobody approved it? Was our own checker down? After an
   incident, the one piece of information that decides whose fault it was has already been thrown away.
3. **A maker's trustworthiness is measured by numbers that never expire.** Stars and review counts
   survive any rewrite of the code underneath them, so the number tells you nothing about the version
   you are about to install. They are also buyable — **$0.0027 each** [verified: listed price].

### Existing alternatives (what people do today)

| Alternative | Why it falls short |
|---|---|
| Hand the key over and hope | The actual default. Unbounded in destination, count and time |
| An in-app "are you sure?" dialog | The screen and the bytes being authorised can disagree, and approval fatigue sets in within a day |
| A burner wallet with a small balance | Works for money only. A key also deletes, publishes, emails and delegates |
| A secret manager (Vault, 1Password) | Stores the secret well, then issues it **intact**. It is a safe, not a limit |
| Do it manually | The honest alternative, and the one we actually lose to |

---

## 2. Customer segments

| | Who | What they want |
|---|---|---|
| **P1** | **The key holder.** An individual already running agents against real keys | To stop choosing between "hand over everything" and "do it by hand" |
| **P2** | **The maker.** Someone shipping an agent skill or MCP server | To be trusted by strangers without asking them for a key |
| **P3** | **The company whose staff run agents** (later, pays most) | A trail they can hand an auditor |

**Early adopter: P2, the maker — not P1.**
This is a deliberate correction. P1 is the sympathetic persona, but the evidence that P1 pays a
monthly fee is **zero** (money-review §6) and the nearest thing P1 has actually bought is a hardware
wallet — **a one-time purchase, not a subscription**. P2 already has a budget line for being
trusted (audit, badge and certification spend is real and recurring: Vanta $18.8k/company/year
[unverified: vendor-reported]). **Sell to the side that already pays for trust.**

Sharper still: **the maker who has already been refused a key.** Someone whose install numbers are
capped because users will not hand over credentials has the problem today, in a form they can name.

---

## 3. Unique value proposition

> **Hand an agent a one-time permission instead of your account — and keep every refusal, named and
> signed.**

**High-level concept:** *3-D Secure for everything a key can do.* You do not give the card away; you
approve one payment. We do that for every action an agent takes, not just the ones denominated in
money.

**The sentence we will not soften:** *a review score never expires; a flame goes out.*

---

## 4. Solution

| Problem | What we built | Status |
|---|---|---|
| No way to hand over less | A permit signed on a device: **key / destination / operation / call budget / expiry**. The EIP-712 digest is computed **inside** the device from the same four values it shows, so the host never sends a digest and blind signing is structurally impossible | [verified] — frozen cross-side test vector, 50/50 tests |
| The agent still ends up holding the secret | The Broker executes by proxy. The skill receives the result, never the key | [verified] |
| Deciding weight means reading the request | A **sealed model** (0G Private Computer, TEE-attested) reads the body and returns the weight. **We cannot read it** | [verified] — 467 calls, 2.0 s, $0.000036 each |
| "Failed" tells you nothing | **Four refusals, never collapsed:** `DENIED` / `NEEDS_PRESS` / `STOPPED` / `human_denied` | [verified] — all five paths come out of `demo.mjs` |
| The record can be rewritten later | An append-only trail **sealed on 0G Galileo** | [verified] — tx `0x74c7cdf9…aef1`, block 64103318 |
| Trust numbers that never expire | A **star** issued only to a World-verified human, one per sector pseudonym per version — **and every star goes out when the version goes up** | Code path written, issuer [verified]; **client registration not granted, so no star has been issued against production** |

---

## 5. Channels

1. **The repository and the three live pages.** The whole thing is MIT and reproducible in three
   commands. For developers this *is* the sales call.
2. **Device bundling (partnership).** The hardware-wallet maker already sells to exactly P1, and in
   this shape **P1 pays nothing and decides nothing** — which matters, because the headwind we named
   ourselves is that *making a person press is heavy*.
3. **The embeddable badge.** Every maker who displays a flame points back at the flame that issued
   it. This is the only loop in the model that compounds without spend.
4. **Agent framework and MCP registries.** Where P2 already publishes.
5. *(Untested)* the security and compliance channel into P3.

**Channel 2 before channel 1 before channel 3** — ordered by friction, not by revenue.
The deck's current A→B→C→D ordering puts the lowest-friction one last; that is the wrong order
(money-review §5).

---

## 6. Revenue streams

**We price judgement, not flow.** A judgement is billed when a verdict exists.

| Verdict | Billed | Why |
|---|---|---|
| `ALLOWED` | **yes** | We were asked, we decided, the inference ran |
| `NEEDS_PRESS` | **yes** | Same work, same cost, different answer |
| `DENIED` | **yes** | **Saying no must earn what saying yes earns**, or the business quietly learns to prefer yes |
| `STOPPED` | **no** | No verdict exists. Our outage, not the customer's request |
| Skill violated the signed scope | **no** | The customer is not the one who misbehaved |

| Line | Price | Shape |
|---|---|---|
| **A. Metered judgements (P1)** | Free 2,000/month, then **$108/year, billed once** (50,000 judgements/month) | Annual, not monthly — the comparison in P1's head is *one hardware wallet*, and a yearly charge matches that shape. The amount is unchanged from $9x12, so every market figure still holds; only the shape moves |
| **B. Badge and version analytics (P2)** | $29/month | **The flame itself is always free to see.** We sell the work of displaying it and a mirror of your own versions. We never sell the light |
| **C. Enterprise trail (P3)** | $20k/year | Described as **"for the duration of the contract"**, never "permanent", until 0G Storage's fee model is checked |
| **D. Device bundling** | Partnership | Someone else pays. Listed last here, attempted first |

**Never sold:** a percentage of anything that moves; custody of keys or funds; the contents of
requests, to anyone, including as training data; **stars**. Each of those four, sold, ends the
sentence the product is made of.

**What makes people pay again** is the mechanism, not a retention feature: ship a new version and
every star goes out at once. A maker who wants the light back earns it again from real users.

---

## 7. Cost structure

| Item | Amount |
|---|---|
| One judgement (283.9 in / 28.0 out tokens at $0.08/M and $0.48/M) | **$0.000036** [verified, 467 calls] |
| The free tier, per user per month | **$0.07** [verified, arithmetic on the above] |
| Gross margin at a maxed-out A plan | **80%** |
| Trail storage on 0G | **[unverified] — one-time or recurring is not yet known.** This is the one cost that could turn C into a liability |
| The Broker (the one trust point) | Hosting. **Not in a TEE this time** — we say so rather than let it pass |
| The real cost | **Distribution.** Unit economics are not the constraint and have not been since Decision 22 |

**The trap in this table:** when unit cost is negligible, **cost can no longer explain price**.
Today the only published justification for the price is margin, which is a seller's reason.
The buyer's reason is still missing. **This is the largest open hole in the canvas.**

---

## 8. Key metrics

Chosen so that **the product getting better and the number going up are the same event.**

| Metric | Why this one |
|---|---|
| **Judgements per day** | The thing we bill, counted the same whether we said yes or no |
| **`NEEDS_PRESS` press-through rate** | If people press everything, we built approval theatre. **A healthy number here is not 100%** |
| **Relight rate after a version bump** | The retention mechanism, measured directly. If flames never come back, the model has no second sale |
| **`STOPPED` rate** | Unbilled by design, so it is pure cost and a clean SLO. **We cannot make money by being unreachable** |
| **Violations caught per 1,000 judgements** | The value actually delivered, as opposed to the traffic served |

**One metric we refuse:** total transaction value protected. It is the number that would make a
refusal look like a loss.

---

## 9. Unfair advantage

Honestly stated, because the weak version of this box is what gets noticed:

- **The code is MIT and copyable. That is not where the advantage is.**
- **What accumulates is a trust signal that cannot be bought and does not keep.** Stars are issued
  only against proof of personhood and die on every version bump. A competitor can copy the
  mechanism on day one and still **starts at zero flames with no back-catalogue to purchase** —
  because we do not sell them either.
- **We structurally cannot read request bodies.** A competitor who can will one day want to, and
  cannot credibly promise otherwise afterwards. **Our constraint is the asset.**
- **The refusal corpus.** Four named refusal types accumulating across makers and versions. A
  competitor on a flow-based fee **cannot afford to collect it**, because every entry in it is
  revenue they did not earn.

---

## 10. What this canvas had to decide (gaps that were empty)

1. **Who the early adopter is.** The persona work pointed at P1; the evidence pointed at P2.
   **Resolved for P2**, on the grounds that P2 has an existing recurring spend on being trusted and
   P1 has none.
2. **The shape of A's price.** Changed from **$9/month to $108/year, billed once** — the same
   amount, so no market figure moves, matched to the one comparable purchase P1 has actually made:
   a device, bought outright.
3. **Channel order.** Written down for the first time, ordered by friction: device bundling → repo →
   badge loop.
4. **Key metrics.** The deck had market numbers and no operating metrics. Five added, each chosen so
   it cannot be improved by letting more through.
5. **The unfair advantage.** Previously implicit. Stated, including the part where the code is not it.

---

## 11. Contradiction register

**All six are now resolved in the files themselves.** Kept here because the resolutions are
judgement calls someone may want to reverse, and because a register that only ever grows is useless.

| # | The contradiction | Resolution | State |
|---|---|---|---|
| 1 | Deck line A billed **"only heavy judgements"** — so revenue would fall when we stop things, which Decision 16 forbids | Every verdict bills the same. `STOPPED` and skill-side scope violations do not | **fixed** in `market-and-model.html` §05 |
| 2 | `money-review.md` §2 proposed billing **`STOPPED`** — we would earn when we are down | `STOPPED` is never billed. The section now carries the correction and says why the first draft was wrong | **fixed**, correction left visible |
| 3 | Deck line B sold **"flame display"** — indistinguishable from selling flames, since an unpaid maker's flame would be invisible | The flame is free for anyone to see. $29 buys the **embeddable badge** and **per-version analytics** | **fixed** in `market-and-model.html` §05 |
| 4 | Line C implied **permanent** retention while 0G Storage's fee model is `[unverified]` | C now reads **"for the duration of the contract"** and names the unverified dependency inline | **fixed** |
| 5 | The deck's A→B→C→D ordering put **D — the only line where the customer decides nothing** — last | A note under the table states the go-to-market order is **D → A → B**, by friction rather than revenue | **fixed** |
| 6 | §04 "the year agents started moving money" sits next to "a key does more than pay" | Not a contradiction: **money is the wedge, the key is the market.** Kept, in that order, as `STORY.md` has it | **by design** |

**And one that had to be decided rather than fixed:** A's price moved from **$9/month to $108/year,
billed once**. The amount is identical, so **the SOM build (8,000 x $108 + 1,000 x $348 + 10 x $20k
= $1.41M) is untouched** — what changes is the shape, because the purchase P1 actually compares it
to is a device bought outright, not a subscription. An earlier draft of this canvas said $79/year;
that would have broken the SOM arithmetic for a cosmetic gain, and was dropped.

## 12. Judging points — what each box is load-bearing for

| Audience | The box that carries it | The sentence |
|---|---|---|
| **0G** | Solution row 3, Cost structure | The sealed model is **in the decision loop, not a log sink** — it reads the body to decide weight, and **we cannot read it**. 467 calls, $0.000036, 2.0 s. When it is unreachable we return `STOPPED` and **refuse to invent a verdict** |
| **World** | Solution row 6, Unfair advantage | Proof of personhood is what makes a star **unbuyable**; one sector pseudonym, one star, per version. **Say plainly that client registration has not come through and no production star exists yet** |
| **Ledger** | Solution row 1 | The digest is computed **inside the device** from the four values displayed. **Blind signing is structurally impossible, not merely discouraged** |
| **Finalist judging (written)** | Problem 2, Revenue streams | The four named refusals as one table, and the fee that **pays the same for no as for yes**. Partner judging reads the submission only — so the refusals, the hashes and the counts go **in writing, above the fold** |
| **Everyone** | §7 and the SOM | **TAM is in the tens of billions and SOM in year three is $1.4M**, stated next to each other. In a queue of decks claiming a billion, the defensible small number is the thing that gets believed |

**The one question we will be asked and must answer in a sentence:**
*"If a refusal earns you the same as an approval, what stops you refusing everything?"*
→ **The `NEEDS_PRESS` press-through rate and the relight rate are our own metrics, and both collapse
if we refuse without cause. We are paid for being asked, and nobody asks a gate that never opens.**
