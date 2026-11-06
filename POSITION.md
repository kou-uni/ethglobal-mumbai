# POSITION — what this is, who it is for, and what it assumes

**Written 2026-11-06.** `STORY.md` is the spine; this file is the part a judge, an investor or a
sponsor asks about first: *what exactly are you stopping, for whom, and under what conditions.*
Where this file and an older document disagree, this file wins.

---

## 1. The claim

An API key is a credit card that never expires, has no spending limit and issues no receipt.
We hand them to AI agents the way we once handed out passwords.

**TOMOSHIBI turns a key into a single use.** The scope is signed on a hardware device a software
agent cannot reach; the secret itself never goes to the agent; and every refusal is kept, named and
signed.

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

Not features — **the end of a tension she could not do anything about.**

**Nothing to memorise. Nothing to store. Nothing to manage.** No password, no scope language, no
config file. She keeps the Ledger and its recovery phrase, and that is the whole of her duty.

**It cannot be used past what she signed**, and **there is always a record** of what was tried.
With the Broker hosted, **the agent never sees the secret at all.**

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
