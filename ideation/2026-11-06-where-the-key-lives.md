# Where the API key actually lives, and what "never shown" can and cannot mean

Written 2026-11-06 in answer to a sharp question: **if the key is ever shown, the agent can
remember it. So is this zero-knowledge, and what would the other side have to implement?**

The short answer is: **what we built is not zero-knowledge, and it does not need to be** — but the
reason is worth being precise about, because the moment you want the key inside the Ledger, you
*do* need the other side to change.

---

## 1. What is implemented today (read the code, not the pitch)

**There are two keys and they live in different places.** Collapsing them is the most common
misreading of this project.

| | What it is | Where it lives | Does the agent ever see it |
|---|---|---|---|
| **The signing key** | The authority to say *"I allow this"* | **Inside the Ledger.** Never leaves | No. It never leaves the device at all |
| **The API key** | The thing being lent — `sk_live_…`, a session, a wallet | **Inside the Broker**, in `SECRETS` | **No. It is never sent to the agent** |

The mechanism is substitution at the edge, and it is four lines of code:

```js
const secrets = JSON.parse(process.env.SECRETS ?? '{}')   // server.js:25 — the real secrets
...
if (request.keyRef !== p.key) return deny('WRONG_KEY')     // scope.js:72 — the agent sent a label
...
const out = await exec(request, secrets[p.key])            // server.js:107 — substituted here
```

```js
headers: { authorization: `Bearer ${secret}` }             // execute.js:14 — and only here
```

**The agent never holds, sends, or names the secret. It names a label** (`keyRef`), the Broker
checks that label against the permit the human signed on the device, and the real value is pasted
in at the last moment, on the way out to the network.

So for the threat you are describing — **Claude Code, or any agent, memorising the key because it
saw it once** — the answer is that it never sees it. Not because of cryptography, but because the
value never crosses that boundary. **This is a boundary property, not a secrecy property.**

## 2. Why that is honest, and where it stops being enough

The weakness is equally plain, and it is already written in the README: **the Broker is the one
place that does hold the plaintext, and we did not put it in a TEE this time.** Whoever runs the
Broker is in a position to read it.

So the ladder of claims, from what we have to what is often implied:

1. **The agent cannot learn the key** — **true today.** It never receives it
2. **The host running the agent cannot learn it** — true today, same reason
3. **The operator of the Broker cannot learn it** — **not true today.** It would be true with the
   Broker inside a TEE. That is the "Next" item in the README
4. **Nobody, anywhere, ever holds the plaintext** — **not achievable against a bearer-token API
   at all**, by anyone, including us. See below

## 2b. If the Broker runs on your own laptop, can the agent on that laptop read the key?

**Yes. It can.** This has to be said plainly, because it is the first thing a careful person asks.

`broker/.env.local` is mode `0600` and gitignored. That stops **other users** on the machine and
stops it being committed by accident. **It does not stop a process running as you** — and an agent
you launched is running as you. It can read the file, or read `/proc`-equivalent process
environment, exactly as you could.

**So what the design actually buys, in the local case:**

| Protected against | Not protected against |
|---|---|
| The agent being **handed** the key as data to work with | A local process going and **taking** it off disk |
| The key reaching a **remote** skill, or a skill you did not write | Anything running as your user on your machine |
| The key appearing in the **trail**, in logs, or in a **model prompt** (tested: `secret-never-leaves.test.js`) | |
| An agent **retaining** it for later, after the permit expires | |

**The boundary we enforce is a protocol boundary, not an operating-system one.** Nothing in this
project claims otherwise, and nothing in it tries to defend a machine against its own operator.

This is why "run it on your laptop" is the **convenience** configuration, and the two
configurations that actually mean something are:

1. **The Broker somewhere the agent is not** — a different user, a different machine, a hosted
   instance. Then the OS boundary exists, and the protocol boundary is the one we add on top
2. **The Broker inside a TEE** — then even the person running it cannot read it
3. **Request signing**, where there is no stored secret left to steal at all (next section)

A judge may well ask this. **The answer is not "it is safe"; the answer is "on one machine the key
is as safe as that machine, and here is what we remove from the problem."**

## 3. Why you cannot put the API key in the Ledger (as things stand)

This is the crux. A Ledger can certainly *store* a secret. The problem is what you have to do with
it afterwards.

**`Authorization: Bearer sk_live_…` means the secret itself is the message.** To authenticate,
the plaintext has to arrive at Stripe. If it starts in the Ledger, it has to come out of the Ledger,
cross the host, and go onto the wire. **Taking the key out of the Broker and putting it in the
device would make things worse, not better:** the same plaintext, now also passing through a USB
transport on a general-purpose machine.

**A hardware device only helps when the secret never has to be transmitted** — when the device can
*prove* possession instead of *presenting* it. Which is to say: when the other side verifies a
signature rather than compares a string.

That is exactly what the device already does for permits — EIP-712, digest built inside, signature
out, secret stays in. **The reason we can do it for permits and not for Stripe is not our design.
It is that we control the verifier on one side and not on the other.**

## 4. What the other side would have to implement

In increasing order of difficulty, and **none of them are zero-knowledge in the technical sense**:

### (a) Scoped, short-lived credentials — available today, no new cryptography

Stripe restricted keys; OAuth with scopes and a short TTL; AWS STS session tokens.
**The plaintext still travels, but it is worth little and expires.** This does not remove the key
from the Broker; it limits the damage, in the same way our permit does — just on their terms rather
than the holder's.

**This is the realistic path for a real deployment**, and it composes with what we built: the
permit decides *when* to mint a short-lived credential at all.

### (b) Request signing — the real answer, and it already exists as a standard

The API verifies **a signature over the request** instead of a bearer token. AWS SigV4 has worked
this way for years; **HTTP Message Signatures (RFC 9421, 2024)** is the general version.

With that, the flow becomes:

1. The agent composes a request. It has no secret and never will
2. The Broker sends the **canonical request hash** to the Ledger
3. **The Ledger displays what is being authorised and signs the hash.** The private key never leaves
4. The Broker attaches the signature and sends it
5. **The counterparty verifies against a registered public key**

**Then the API key genuinely lives in the Ledger and is never shown to anyone** — not the agent,
not the host, not the Broker, not even the counterparty. The Broker drops from "holder of the
secret" to "a router that cannot forge anything", and claim 3 above becomes true *without* a TEE.

**What it costs them:** registering public keys per account, a canonicalisation rule, and a
verification path. Hardly free, but this is not research — it is RFC 9421 plus key management.

### (c) Threshold signing / MPC — if they will not change the verifier at all

Split the key so no single party holds it. It preserves `Bearer` compatibility, but **reassembly
happens somewhere**, and now the trust is spread across operators instead of removed. We considered
this and are not doing it: **it makes the security story harder to explain while making the honest
claim weaker.**

### (d) Actual zero-knowledge proof of authorisation

"I hold a credential authorised for this account, and this request is within its scope" — proved,
not shown. Technically possible; **the blocker is that no payment API accepts a proof as
authentication.** Without a verifier on the other side, a proof is a number nobody checks.

## 5. The honest sentence to say on camera

> **The agent never sees the key, because the key is substituted at the edge and the agent only
> ever names a label.** Today the Broker holds that secret, and we say so. **The direction is
> request signing — the device signs the request instead of surrendering the credential — and that
> needs one thing from the service provider: verify a signature instead of comparing a string.**

**What we should not say:** "zero-knowledge", "the key never exists in plaintext anywhere", or
"nobody can read it". The first is wrong terminology, and the other two are false while the Broker
is outside a TEE.

## 6. What this changes in the project (nothing, today)

Nothing before the deadline. It belongs in **"Next"** in the README, next to the TEE, and it is
worth having an answer ready in Q&A — *"why not put the API key in the Ledger?"* is a very natural
question from a judge, and the correct answer is **"because Stripe compares a string, and the
moment it verifies a signature instead, we will."**
