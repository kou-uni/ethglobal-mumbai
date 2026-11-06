# One story — the refusal is the product

**Written 2026-11-06. This file is the spine.** The business model, the way we present to judges,
and the India argument are three views of one claim. Where an older document disagrees with this
file, this file wins and the older one gets corrected.

---

## The claim

> ### Your agent is holding a spare key that works until you cancel it.
>
> **For anyone who hands an AI agent a real key** — a Stripe secret, a wallet, a logged-in session —
> **TOMOSHIBI is the approval layer that hands over one use instead of the key.**
> It does for every action an agent takes what your bank does for a single card payment:
> you approve this one, not all future ones.
> **Unlike a password manager, the secret is never handed over at all** — and every refusal is
> kept, named and signed.

**A key is a standing permission. What anyone actually wants to give an agent is a one-time one.**

We make the one-time permission cheap to give, impossible to forge, and impossible to erase.
The human signs a scope on a device — which key, which destination, which operation, how many
times, until when — and the four lines on the screen are built from the same bytes that get signed.
The agent never holds the secret.

And then the part everyone skips: **we keep the refusals.** Four of them, never collapsed into one:

| | meaning | whose responsibility |
|---|---|---|
| `DENIED` | outside the scope the human signed | **the human drew that line in advance** |
| `NEEDS_PRESS` | irreversible, and nobody has pressed for this one | **nobody's yet — that is the point** |
| `STOPPED` | the sealed model was unreachable, so no verdict exists | **ours** |
| `human_denied` / `proof_expired` | a person refused to vouch, or nobody was there | **the person's, and they are allowed** |

A system that answers every stop with "failed" has thrown away the only information that matters
after something goes wrong. **The refusal is the product.** Everything below follows from that one
sentence.

---

## View 1 — What we charge for

**We price judgement, not flow.**

If revenue scales with traffic, then every refusal costs us money, and within a year we are a
company that is quietly bad at stopping things. That is not a values statement; it is the predictable
end state of a payment-style fee. So we do not take a percentage of anything that moves.

We charge per judgement. **A judgement is billed when we produce a verdict — whether that verdict
was yes or no.**

- `ALLOWED`, `NEEDS_PRESS`, `DENIED` → **billed.** We were asked, we decided, the inference ran.
- `STOPPED` → **not billed.** No verdict exists. We failed, not the customer.
- A request rejected because the *skill* violated the signed scope without a valid signature →
  **not billed.** The customer is not the one who misbehaved.

**This is what makes "the refusal is the product" survive contact with an invoice.** Saying no earns
exactly what saying yes earns, so nothing in our revenue prefers one answer.

**We can afford this because the judgement is nearly free.** Measured against the production 0G
Private Computer over 467 calls: 283.9 input tokens and 28.0 output tokens per verdict, at
$0.08/M and $0.48/M (`GET router-api.0g.ai/v1/models` → `pricing_usd`) = **$0.000036 per judgement**.
A free tier of 2,000 judgements per month costs us **$0.07**. Stopping things can be given away.

**What we will not sell, and why each one would break the story:**

| Not sold | Because |
|---|---|
| A percentage of transaction value | Makes refusing expensive. See above. |
| Custody of keys or funds | "You never hand over the secret" is the product. Holding it ends the sentence. |
| The contents of requests, to anyone, including as training data | The body is only ever read inside the sealed model. **Not being able to read it is the feature.** |
| **Stars** | A flame that can be bought is cold. One purchased star and the signal is worth zero. |

**And therefore the flame itself is always free to see.** We sell the badge you embed and the
history of your own versions — the work of showing, and a mirror for yourself. We never sell the
light. *(This corrects the earlier draft, where paid placement meant an unpaid author's flame was
invisible — which is indistinguishable from selling stars.)*

**What keeps people paying** is in the mechanism, not in a retention feature: **ship a new version
and every star goes out at once.** A maker who wants the light back earns it again from real users
on the new version. Reviews never expire; a flame does.

**The number we will not inflate.** TAM is in the tens of billions and we will say so. SOM in year
three is **$1.4M**, and we will say that too, out loud, next to the big number. We would rather be
the team whose smallest number is defensible.

---

## View 2 — What we put in front of judges

**Partner judging is done on the submission alone** (ETHGlobal rules). Booth conversations and the
demo video do not reach a first-pass reader. So the written submission must carry the whole case,
and it must carry it in the form a reader can check.

**That means the refusals go in writing, with evidence, above the fold:**

- the four stops, named and distinguished — this is the originality claim, and it is one table
- a trail sealed on 0G Galileo: tx `0x74c7cdf9…aef1`, block **64103318**, `status 0x1`
- **50/50** tests, including the frozen cross-side signature vector
- **467** measured calls against the real TEE-attested model, 2.0 s, $0.000036
- three pages anyone can open right now, and a three-command local reproduction

**Adjectives are worth nothing to a reader who cannot run the code. Hashes and counts are worth
something, because they are shaped like things that could be falsified.** We replaced "robust" and
"production-ready" with numbers everywhere they appeared.

**What was hard goes in writing too,** because difficulty is never inferred, only read:

1. **The screen and the signature cannot disagree.** The EIP-712 digest is computed inside the
   device from the same four values it displays; the host never sends a digest, so blind signing is
   structurally impossible rather than merely discouraged.
2. **The count holds under concurrency.** The call budget is reserved before execution with no
   `await` between the check and the record — 100 simultaneous requests against `maxCalls=3` let
   through zero extra.
3. **Refusing to invent a verdict.** When the model is unreachable we return `STOPPED` and change
   nothing. No default, no rule-based stand-in. **A fabricated verdict is worse than no verdict** —
   and, per View 1, we do not bill for it.

**The honest small number is an asset here, not a liability.** A reader who has just been handed
twenty decks claiming a billion-dollar SOM will notice the one that says $1.4M and shows the
arithmetic. Credibility is the scarce thing in a judging queue.

---

## View 3 — Why this city already agrees

**We did not choose this problem for India. India chose it first, and wrote it down.**

- **RBI (Authentication Mechanisms for Digital Payment Transactions) Directions, 2025**, in force
  from **1 April 2026**: card-not-present payments need an authentication factor that is *dynamic* —
  uniquely proven for that specific transaction — **and it applies whether a human or an agent
  initiates it.** Our permit is exactly that object: a signature over this request and no other.
- **NPCI** is building agent payments on UPI with **spending limits, audit trails, identity checks
  and a liability framework**, on top of UPI Circle (delegating payment authority to a third party,
  including an agent) and Reserve Pay (blocking funds for several debits).
- **CERT-In**, Digital Threat Report 2025-26: *"Mandate human-in-the-loop controls for agentic AI
  actions above defined financial thresholds, with full audit trails."*

**That last sentence is our product description.** The e-mandate shape — one human factor at
registration, silence inside the limits, a fresh human factor above the threshold, an audit trail
throughout — is the shape we built: one press to sign the scope, silence inside it, `NEEDS_PRESS`
above the line, an append-only trail underneath.

**Three things we are careful to say correctly, because the opposite is tempting:**

1. **We have not integrated with UPI and do not claim to.** The match is structural. That is the
   claim, and it is a smaller claim than it sounds like we are making.
2. **CERT-In's line is a proposal in a threat report, not a rule.** We quote it as evidence that
   serious people independently specified our product; not as compliance.
3. **Our threshold is not ₹15,000.** The sealed model reads what the request actually does, and in
   measurement it escalates **anything where money moves — $4,800 and $1 alike.** That is stricter
   than the regulation, not aligned to it.

**And the limit of the agreement is the most useful part.** India's framework is excellent and it
stops at the edge of money, because that is what a payments regulator governs, and it works by the
bank holding the funds. **A key does more than pay.** It deletes, publishes, grants access, emails
a customer list, transfers a domain. None of that is a rupee and none of it is inside UPI's
perimeter — and we do it **without anyone taking custody of anything.**

So the relationship is not "we are a compliance product." It is: *the shape has already been proven
correct, in the one domain where a regulator was forced to think it through. We are taking the same
shape to everything else a key can do.*

**Where it sits in the pitch.** The written submission carries this in full, because that is what is
judged. The spoken pitch gives it **twenty seconds and one slide**, because the thing people will
remember is a flame going out, not a circular from a central bank.

---

## The three views in one line each

- **Money:** we are paid for deciding, equally for yes and for no — so nothing in the business
  prefers an answer.
- **Judges:** the decision and its refusals are written down with hashes and counts, because the
  reader cannot watch the demo.
- **India:** a regulator, a payments network and a security agency have each described this object
  independently — for money, which is the part of it they govern.

**One claim underneath all three: a refusal is information, and it belongs to someone.**
Everything we built, charge for, and point at is in service of not throwing it away.
