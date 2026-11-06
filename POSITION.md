# POSITION — what this is, who it is for, and what it assumes

**Written 2026-11-06.** `STORY.md` is the spine; this file is the part a judge, an investor or a
sponsor asks about first: *what exactly are you stopping, for whom, and under what conditions.*
Where this file and an older document disagree, this file wins.

---

## 0. The trunk

**One sentence.**

> **A key becomes a single use, approved on something an agent cannot press.**

**Three pillars. Nothing else is load-bearing.**

| | | |
|---|---|---|
| **1. Substitution** | The secret is put in at the edge and never given to the agent | *It cannot leak what it was never handed* |
| **2. Escalation** | A sealed model decides when a person is needed. Otherwise, silence | *It only asks when it should* |
| **3. Named refusal** | Every "no" is of a known kind, and carries whose code tried it | *The refusal is the product* |

**The MVP — the smallest thing that makes the sentence true.**

1. A permit **signed on hardware**, whose four readable lines are built from the same bytes that are signed
2. A broker that **refuses outside it before anything runs** — no body forwarded, no credits spent
3. A **sealed model in the decision loop**, whose silence stops the request rather than passing it
4. An **append-only trail** where what was allowed and what was refused sit side by side

**The flame is not the trunk; it is the branch.** A star can only be lit by someone who actually
used the key — so it grows out of the trail the trunk produces, and cannot exist without it.
That is also why it goes out when the version changes.

---

## 1. The pitch

**In one line.**

> **We give an AI agent one use of your key, instead of your key.**

**In thirty seconds.**

> You hand your agent an API key the way you would tape a credit card to its hand — no limit, no
> expiry, no receipt. **TOMOSHIBI gives it one use instead.** You sign the scope on a hardware
> device the agent cannot press — which key, where, what, how many times, until when — and the
> agent only ever receives a handle, never the secret. Before anything runs, a sealed model reads
> the request and decides whether it is ordinary or worth your finger, so a normal day is silent
> and **money never moves without you.** And every refusal is kept, named and signed, so after an
> incident you can say what was stopped and whose code tried it.

**In a phrase, if there is only time for one.**

> **Apple Pay for API keys — except it only asks when it should.**

That last clause is the whole design. Apple Pay authenticates every payment. A tool that interrupts
every call is a tool that gets switched off, so a sealed model reads each request first and decides
whether this one is worth a human's finger.

**This is a mechanism, not a service.** Onboarding, billing and distribution are downstream of it
and are deliberately not what we are showing.

---

## 2. Who it is for

**Priya, 30, runs a small online shop.** Not an engineer, and not trying to become one. She cannot
afford to hire anyone, so she hands work to an AI agent and wants it to just go.

- **What she has:** a Ledger, bought for crypto and mostly idle. A World ID. A Stripe key she had to
  go and get, reluctantly
- **What she does not have:** any sense that an API key is as dangerous as a card number. Nobody
  told her, and nothing she uses behaves as if it were true
- **How she chooses tools:** not by star count. Because a shopkeeper she knows is using one
- **What she fears:** her customers' data leaving without her knowing — and not noticing when it does

The full week, hour by hour, is in [`ideation/2026-11-06-user-journey.md`](ideation/2026-11-06-user-journey.md).

---

## 3. What we are stopping — and what we are not

This is the section to get right, because the easy version of it is a lie.

**We are not stopping a malicious agent with shell access to her machine.** Nothing here defends a
computer against its own operator, and we will not claim it does.

**We are stopping four ordinary things:**

| | |
|---|---|
| **A wrong decision** | The agent judges badly at three in the morning. It is not betraying her; it is mistaken |
| **A stray skill** | Something she installed on a recommendation asks for a destination it never declared |
| **Silent reuse** | A key handed over once keeps working forever. Here it expires, and it counts |
| **Spending she never agreed to** | Anything that moves money waits for a finger on a device |

> **We do not stop evil. We stop a wrong decision made at 3 a.m. by something she trusted.**

---

## 4. What it gives her

Not features. **The end of a tension she could not do anything about.**

| | |
|---|---|
| **Nothing to memorise, store or manage** | No password, no scope language, no config file. She keeps the Ledger and its phrase; that is the whole of her duty |
| **It cannot leak what it never received** | The agent is given a handle. With the Broker hosted, the secret is never in its reach at all |
| **It cannot go past what she signed** | Destination, operation, count, expiry — checked before anything runs |
| **It is silent on an ordinary day** | She is asked only when something is heavy enough to deserve it |
| **She can explain an incident herself** | Named refusals, each carrying the signature of whatever tried it |

> **She stops holding something she had no way to manage.** That is the product.

---

## 5. The conditions, stated rather than hidden

| | Assumption | If it does not hold |
|---|---|---|
| **A1** | She owns a hardware device and plugs it in | The signature has no home; there is no button an agent cannot press |
| **A2** | The Broker runs somewhere her agent is not | An agent with a shell can read the secret. Running it on her laptop is a demo convenience, not the product |
| **A3** | Her own agent is fallible, not hostile | A hostile local process bypasses the Broker entirely and calls the API directly |
| **A4** | She obtains the credential herself | Until an OAuth issuance flow exists, she still has to go and get a Stripe key once |
| **A5** | The target API accepts a bearer token | Request-signing APIs (RFC 9421, SigV4) are a strictly better fit and leave no secret to steal — a later path |
| **A6** | The sealed model answers | It stops. `STOPPED` means no verdict exists, nothing ran, and we do not bill for it |

**A2 and A3 are one pair.** Together they say: *we trust the machine, and we do not trust the
agent's judgement.* Everything else follows from that line.

---

## 6. What is not built yet

Said here so that nobody has to discover it.

- **A hosted Broker, and in time one inside a confidential VM.** This is what makes A2 true in
  practice, and it is the first item under "Next" in the README
- **One-paste setup** — pasting a URL and having the agent configure itself from a guide
- **Version-gated permits.** Stars go out when a version changes; a *permit* does not. Expiry and
  call budget are the only limits today
- **OAuth issuance**, so a scoped credential is created for her instead of by her

---

## 7. Further

[`STORY.md`](STORY.md) · [`README.md`](README.md) ·
[`ideation/2026-11-06-user-journey.md`](ideation/2026-11-06-user-journey.md) ·
[`ideation/2026-11-06-where-the-key-lives.md`](ideation/2026-11-06-where-the-key-lives.md)
