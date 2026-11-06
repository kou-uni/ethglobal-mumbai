# Re-evaluating the money flow (2026-11-06 morning IST)

**Trigger**: the owner — "I want you to re-evaluate the money flow, the reasons behind it,
the evidence that it is sustainable, and whether the pricing holds up."
We took `2026-11-06-market-and-model.html` back down to unit cost and went over it again.

---

## 1. One more thing is now verified — unit cost was never the issue

→ Decision 22. **$0.000036 (0.0056 yen) per judgment. Measured.**

The deck said "closing the 10x spread in unit cost is the first step in pricing."
Once we closed it, **the first step itself disappeared.** Even if a user maxes out the
$9/month plan, gross margin is 80%, and the free tier costs $0.07 a month.

**This is good news, but it is also a trap.** A product whose unit cost is negligible
**cannot explain its price from unit cost.** In the current deck, the only justification for
"why $9" is on the cost side ("because it leaves a margin"). There is not one line of
justification from the buyer's side yet.

---

## 2. There is one contradiction to fix — A still has a "we lose money by stopping things" structure

Decision 16 said **"we do not take a percentage of payment volume. The moment flow becomes
revenue, we become a company that loses money by stopping things."**
But revenue stream A is defined as **"per-judgment usage pricing. Only heavy judgments count."**

**If we only count the judgments that went through, the structure is the same as a payment fee.**
The more we stop, the less revenue. It is only the difference between a percentage and a flat fee,
and what Decision 16 tried to eliminate has not been eliminated.

**Proposal (revert if rejected): bill `DENIED` and `STOPPED` as judgments too.**
- The price tag is attached to the number of times a decision was asked for. **Revenue is the same
  whichever way it ends** = the incentive to stop is not distorted
- It is also correct on the cost side. **A denial judgment costs exactly the same 0G inference**
  ($0.000036)
- The phrasing gets stronger: "**we charge for the number of things we thought about, not the number
  we let through**"
- Counter-argument: from the user's point of view it reads as "I got blocked and billed for it."
  → one option is to **make judgments on violations (where the skill went outside its scope) free**.
  The one at fault is the skill, not the user, so this is the cleaner line

## 3. One thing is on a collision course with the philosophy — B (flame display, $29/month)

The decision **"do not let people buy flames. A flame bought with money is cold"** and
B, **"$29/month for flame display,"** are indistinguishable from the outside.
Even if the star count cannot be bought, **if display costs money then the flames of makers who do
not pay are invisible. An invisible flame is the same as no flame.**

**Proposal: the flame itself is always visible to anyone, for free. The $29 buys "a badge you embed
on your own page" and "per-version trend analysis — who went out."**
Then what we sell is not the flame but **the work of displaying it, and a mirror for yourself**,
which puts us on the same shelf as Vanta (Vanta also sells the work of showing, not the audit itself).

## 4. One more unverified item — C ($20k/year) could become a liability

C includes "preservation of the trail (in a form you can hand to an auditor)." But **we have not yet
confirmed whether 0G Storage's storage fee is a one-time payment or a recurring charge [unverified].**
**If we sell permanent preservation and our own payment is recurring, only the cost remains after
a customer cancels.**
Until we check, do not write "permanent" in the description of C. If we write anything, write
"for the duration of the contract."

## 5. Price validity — the comparison for $9/month is a device, not SaaS

The most recent similar spend by P1 (the key holder) is **an outright purchase of a hardware wallet**.
For a monthly plan, **the shape** matters more than the amount.

| Option | Shape | How it works |
|---|---|---|
| Current $9/month | Recurring | 80% margin. But "one more subscription" |
| **$79 billed annually** | Once a year | **The same price as one device.** The comparison holds. Looks cheaper than $9x12=$108, and churn disappears |
| D (bundled with a device) first | Someone else pays | **P1 pays nothing.** Fewer decisions. Works against the headwind in §05 (making a person press is heavy) |

**Proposed order: D (partnership) → A (annual) → B.** The current deck is ordered A→B→C→D,
which puts D — the lowest-friction one — last.

---

## 6. How many pieces of evidence for sustainability do we have right now?

| Claim | Strength of evidence |
|---|---|
| Unit cost does not eat revenue | **Confirmed by measurement** (Decision 22) |
| Flames go out when the version goes up = re-purchase happens | **Built into the mechanism. Whether people pay is untested** (ask 10 people in P2) |
| We do not fall over if B dies | **We can say it in numbers.** A alone: 8,000 users x $108 = $0.86M = **61%** of the $1.4M SOM |
| We do not get absorbed by the payment companies | Argument only (they are the side that holds the keys). No counter-evidence yet |
| P1 pays a monthly fee | **Zero evidence.** This is the biggest hole, and now that unit cost is settled, **it is the only one left** |

**In the pitch, only the top two lines may be stated.** The third line can be used as
**defensive strength**: "it works even if B dies." Lines four and below are answered if asked.
