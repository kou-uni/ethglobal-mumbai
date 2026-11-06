# Why Mumbai, and why this product (2026-11-06 research)

**Conclusion: this is not a coincidence. India is the only market in the world where TOMOSHIBI's
design is a rule rather than an opinion.** And all three layers — rule, protocol, proposal — fell
into place within this one year.
**Our assumption before researching ("India is a big market") was the weakest reason of all.**

---

## 1. Three layers of alignment — rule / protocol / proposal

### (1) Rule: even when an agent pays, a dynamic factor is required for each transaction [verified]

**RBI (Authentication Mechanisms for Digital Payment Transactions) Directions, 2025**
(issued 2025-09-25, **effective from 2026-04-01**).

- Digital payments require **two or more independent authentication factors**
- For card-not-present transactions, **at least one must be "dynamic" = provably unique to that
  transaction**
- And according to press reports, this **applies whether a human or an agent initiated it**

> **The TOMOSHIBI permit is exactly that "dynamic factor."**
> The EIP-712 digest is built from "which key, which destination, which operation, how many times,
> until when," and **it corresponds to that request and nothing else.** The fact that the four lines
> shown on the device screen and the byte string being signed are the same thing is itself the
> implementation of "uniquely proven for that specific transaction."

### (2) Protocol: NPCI is building the foundation for letting agents pay [verified]

NPCI is preparing **a framework for agentic payments on UPI** (Reuters, reported 2026-09-01).
The contents are **rule-based instructions (when and up to how much it may pay) + spending limits +
audit trails + identity verification**, plus **a liability framework**. The foundation is two
existing pieces:

- **UPI Circle** — the account holder **delegates payment authority to a third party, including an
  agent**
- **Reserve Pay** — **blocks funds up front** for multiple future debits

> **This is the bank-side counterpart to the TOMOSHIBI permit.**
> "Delegate authority," "set a limit," "keep an audit trail," "decide where liability sits" —
> the reason we keep the four kinds of refusal **unmixed** was the last one (where liability sits).

### (3) Proposal: put a human in the loop above a threshold, with audit trails [verified, but not a rule]

**CERT-In (the cyber arm of the Ministry of IT), Digital Threat Report 2025-26:**

> **"Mandate human-in-the-loop controls for agentic AI actions above defined financial
> thresholds, with full audit trails."**

**That is a one-sentence summary of TOMOSHIBI.** "For agentic actions above defined financial
thresholds, mandate human-in-the-loop controls, with full audit trails."
Our `NEEDS_PRESS` (a heavy request does not go through until a person presses) and the append-only
trail map onto it directly.

**But to be honest**: this is **a proposal in a threat report, not a rule**. Say so.

---

## 2. Matching the alignment against our own parts

| India side (regulation / infrastructure) | TOMOSHIBI side (implementation) | Degree of match |
|---|---|---|
| AFA is required **at mandate registration** and **on the first transaction** (e-mandate 2026) | **Signing the permit (one press on the Ledger)** | Same structure |
| After registration, auto-debit **up to ₹15,000 per transaction** without AFA | **Inside the scope, call budget and expiry, things go through silently** | Same structure |
| A transaction above the threshold needs **per-transaction dynamic authentication** | **`NEEDS_PRESS`** — wake the person only for the one heavy request | Same structure |
| **Pre-notification 24 hours ahead** (counterparty, amount, date) | **The four lines shown on the device** (in advance, read and pressed by a person) | Same purpose, stronger (signed in advance) |
| **Audit trail** (NPCI's framework, CERT-In's proposal) | **Append-only trail + a seal to 0G Storage** | Same. The seal is on mainnet |
| **Liability framework** (NPCI, details not published) | **The four kinds of refusal are not mixed** (DENIED / STOPPED / NEEDS_PRESS / human_denied) | **This is what is ours.** A different way of stopping means a different place for liability |

**Not one line of code needs to change.** The shape already matches. Put the top three rows of this
table into the submission text.

---

## 3. Why "Mumbai" — the city is not incidental

- **RBI's central office is in Mumbai.** The authority that issued (1) is in this city
- **NPCI's headquarters is in Mumbai.** The organization building (2) is in this city
- NPCI's agentic payments framework is **on track to be unveiled at the Global Fintech Fest in
  Mumbai**

**The people writing the rules, the people laying the rails, and us, in the same city in the same week.**
That is more concrete than "India is big," and a judge can verify it.

---

## 4. Numbers (use only the order of magnitude)

| | |
|---|---|
| UPI, October 2026 | **25.47 billion transactions / ₹31.53 lakh crore** (per month. The first time it passed 25 billion transactions and ₹30 lakh crore) |
| Per day | **822 million transactions**; daily value passed **₹1 lakh crore** for the first time |
| Developers in India (GitHub, September 2026) | **32 million. Second in the world** behind the US at 38.3 million, and **+10.08 million** in one year. Projected to pass the US in 2030 |

**Why the developer count matters**: TOMOSHIBI's P2 (the skill maker) is a developer.
**Both the people who light flames and the people who get lit are here.**

---

## 5. The weak spots (write them first. Do not admit them only when asked)

- **We have not connected to UPI or to Ledger yet.** The alignment above is **structural alignment**,
  not integration. Saying "UPI support" would be a lie. We do not say it
- **CERT-In's is a proposal, not a rule.** Do not say "it is mandated"
- **RBI's rule is about payments; TOMOSHIBI is about API keys in general.** Payments are a subset.
  Stretch it too far and it looks like "exaggeration dressed up as regulation."
  **Use payments as an example and do not widen the claim**
- We have done **nothing** for India-specific currency, languages or payment methods.
  All we did was confirm that "India's institutions had already called our design correct"

## 6. How to use this in the pitch (do not make it the main line)

**Do not change the main line** (a world where AI becomes the judge, and flames going out).
India goes in as **one slide, 20 seconds**.

> "We did not pick this problem for India. But India picked it first.
> From April 2026, RBI requires a dynamic, per-transaction factor for non-card-present
> payments — and it applies whether a human or an agent starts it. NPCI is building agent
> payments on UPI with spending limits, audit trails and a liability framework. And CERT-In
> asked for human-in-the-loop above a financial threshold, with full audit trails.
> That last sentence is our product description. We just wrote it in code."

**The pushback that will come in Q&A, and the answers:**
- "Did you connect to UPI?" → **No. We only showed that the structure is the same** (be honest)
- "Is this a regulatory compliance product?" → **No. We are citing the regulation as evidence that
  this is needed**
- "What did you build for India?" → **Nothing. What we built happened to have the same shape as
  India's institutions**

---

## Sources (retrieved 2026-11-06)

- RBI (Authentication mechanisms for digital payment transactions) Directions, 2025 (issued 2025-09-25 / effective 2026-04-01)
  — https://www.rbi.org.in/scripts/bs_viewcontent.aspx?Id=4477 and commentary (Khaitan & Co / Saraf Partners / legal500)
- RBI Digital Payments – E-mandate Framework, 2026 (2026-04-21): AFA at registration and on the first transaction. ₹15,000 per transaction (₹1 lakh for insurance, mutual funds and card bills). Pre-notification 24 hours ahead
  — https://www.businesstoday.in/personal-finance/news/story/rbi-caps-recurring-payments-at-rs15000-without-otp-under-new-e-mandate-framework-526759-2026-04-21 / https://ksandk.com/newsletter/rbi-e-mandate-framework/
- NPCI's agentic payments framework (Reuters, reported 2026-09-01): limits, audit trails, identity verification, liability framework / built on UPI Circle and Reserve Pay
  — https://thepaypers.com/payments/news/india-prepares-agentic-payments-rollout-on-upi-network
- CERT-In Digital Threat Report 2025-26: a **proposal** to mandate human-in-the-loop
  — https://www.medianama.com/2026/07/223-meity-proposes-mandatory-human-interventions-agentic-ai-payments/
- UPI, October 2026: 25.47 billion transactions / ₹31.53 lakh crore / 822 million per day
  — https://entrackr.com/news/upi-hits-record-2547-bn-transactions-in-october-daily-value-crosses-rs-1-lakh-crore-12772871
- GitHub Octoverse 2026: India at 32 million (second in the world, +10.08 million/year)
  — https://github.blog/news-insights/octoverse/octoverse-commits-pushes-reach-new-highs-in-2026-as-developers-build-with-agents/ / https://www.digit.in/features/general/github-octoverse-2026-india-is-the-second-largest-developer-hub-and-growing-faster-than-the-us.html

**Everything was retrieved on 2026-11-06. We have not consulted the primary sources (the RBI PDF
itself, NPCI's announcement, the CERT-In report itself) [unverified].**
The wording of the provisions quoted comes from press reports and law firm commentary.
**In the pitch, do not drop "according to reports."**
