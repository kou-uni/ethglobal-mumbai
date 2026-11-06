# Submission form — ready to paste (2026-11-06)

A first draft, expected to be revised. **Nothing written here is something we have not implemented.**

---

## Project name
tomoshibi

## Category
**Security** (keep as is)

## Emoji
**🕯️** (this is what goes in the form's emoji field. A candle with a teardrop flame — the flame itself)
🪔 (diya) is the Diwali light and the meaning is close, but **we have decided not to borrow Indian words or symbols**, so it is out.

## Cover image / logo
`assets/tomoshibi-icon-512.png` — **the icon is the candle emoji 🕯️ on ink `#1B1630`**, 512×512 PNG.
Decided 2026-11-06: we ship no drawn mark. One glyph, the same one in the README title, the same one on
the device. The old `tomoshibi-mark.svg` carried a third palette and has been removed.
Cover image: `assets/tomoshibi-cover.svg` (1200×630) is **still on the old palette and must be redone** — see issue #31.
Emoji do not let you choose the shape, so **the look is carried by our own mark.**

## Demo link
**`https://mintannn.github.io/tomoshibi/start.html`** [verified 200, 2026-11-06] The judged demo.
It opens on the story and walks through it in order: the hand-over, the key, the record, the flame.
Decision 14 makes `web/` the one we show; **`ui/` stays up only as a fallback**
(`https://kou-uni.github.io/ethglobal-mumbai/ui/index.html`, also 200).
The values on screen are real responses sent to production 0G (recorded; the timestamp and the source are shown on screen).
At the venue, switch to "send it live" and show the request id from that moment.

## Short description (100 characters max)
AI agents use your API keys without ever holding them. The light goes out when the skill changes.

(97 characters. Alternative at 98 characters: AI agents use your keys without ever holding them — and the light goes out when the skill changes.)

## Description (280 characters minimum)
Agent skills are starting to ask for our API keys the way apps once asked for passwords: a secret with
no scope, no expiry and no receipt, handed to code we did not read.

TOMOSHIBI puts one button an AI cannot press in front of the key. You sign a scope on a Ledger device —
which key, which destination, which operation, how many times, until when — and the four lines on the
device screen are built from the same bytes that get signed. The skill never receives the secret. It
asks a broker to act, and anything outside the signed scope is refused before it happens, and recorded
with the skill's own signature on the request.

Nothing here answers with a bare "it failed". Four refusals are kept apart, because a different stop
means a different responsibility: DENIED — you drew that line in advance. STOPPED — nobody could decide,
because the sealed model was unreachable, and we would rather do nothing than invent a verdict.
NEEDS_PRESS — this request is irreversible and no human has pressed for it yet. human_denied /
proof_expired — a person refused to vouch, or nobody was there.

Stars are not reviews. A star means: I, a verified human, am using this version with my own key. When
the version changes, every star goes out at once. Reviews never expire; a flame does.

## How it's made (280 characters minimum)
**Ledger (hardware).** A custom Ledger app, written in Rust, computes the EIP-712 digest inside the
device from the same four values it displays, so the screen and the signature cannot disagree. No blind
signing, and the host never sends a digest. The device/broker boundary is frozen as one JSON contract
plus a published test vector, so both halves of the team could build against it in parallel.

**Broker (Node, viem).** It holds a child token, never the root key, and runs the gate: scope check →
weight → press → proxy execute → append-only trail. 50 tests, including the frozen cross-side signature
vector.

**0G — in the decision loop, not as a log sink.** Before acting, the broker asks 0G Private Computer how
heavy the request is: routine / significant / decisive, using 0gm-1.0-35b-a3b, a TeeML model
(tee_attested, Intel TDX, verified by dstack). The body of the request is part of that judgement, and
that is exactly why 0G is here: you cannot grade a request without reading it, and we do not want to
read it. The sealed enclave reads it; we never do. The verdict changes the outcome — an irreversible
request will not pass on a standing permit, only on a press made for that one request — and every
decision carries the 0G request id. Episode logs go to 0G Storage (append-only Log layer, Flow contract
0x22E03a6A89B950F1c82ec5e74F8eCa321a105296 on Galileo, chain id 16602) and the root hash goes in the
trail. If 0G cannot be reached, nothing happens: no default, no local rule standing in for the model,
no fabricated verdict. The request stops and the stop is recorded.

**World — who, once.** Issuing a star is where a person stakes their reputation, so that is where World
ID Agent Pass sits, not on every key use (the Ledger already answers "do I allow this, now"). The broker
is headless, so it uses the OIDC device_code grant: it starts the request, the person finishes on their
own phone, and the broker verifies the id_token against the JWKS (iss / aud / exp) in the backend — the
client secret never leaves it. The refusal paths are the protocol's own: access_denied (a person said
no) and expired_token (nobody was there) are recorded as two different events. One sector-scoped
pseudonym can star one version once.

**Privacy by separation.** The device knows the scope and nothing of the body. World knows only that you
are a human and the same human. 0G reads the body sealed. The public trail carries neither keys nor
bodies. MIT licensed, no trackers, no analytics.

**What is not done, said plainly.** The broker holds key material and is the single trusted point; the
honest next step is to run the broker itself inside 0G Private Computer. Stars live in an append-only
log — the on-chain registry is specified, not deployed.

## Verifiable facts (paste these; they are checkable)

Everything below was produced against production systems during the hack, not mocked.

| | |
|---|---|
| A trail sealed on **0G Galileo** (chain id 16602) | tx `0x74c7cdf9bca055c502918e62a7ac9fc7634d1326471433ab10161045aa97aef1`, block **64103318**, `status 0x1`, gasUsed 306,371 |
| 0G Storage root hash for that episode | `0xc0e0c7a911547490680d545ad9d4638a9bf23bd72d8a3004edf9b4ffaa5be080` |
| A second seal, after the tier vocabulary changed | tx `0x90ecc8a4e1ea97bb4ff4ff7784d2a18ce80729f6fe640d945077ad6266925455` |
| Flow contract | `0x22E03a6A89B950F1c82ec5e74F8eCa321a105296` |
| Tests | **60 / 60**, including the frozen cross-side signature vector (`spec/permit-signature.md` §6) |
| Measured against the real TEE-attested model | **467 calls** · 283.9 input / 28.0 output tokens · ~2.0 s · **$0.000036 per verdict** (`pricing_usd` from `GET router-api.0g.ai/v1/models`) |
| The weight prompt was measured before it was changed | 120 production calls across two languages, **58/60 agreement**; the change was kept only because it was **stricter**, not merely equal — `ideation/2026-11-06-decisions.md` Decision 25 |
| Concurrency | 100 simultaneous requests against `maxCalls=3` let through **0** extra |
| Live pages | `/ui/index.html`, `/ui/stars.html`, `/web/gate.html` on GitHub Pages (all returning 200) |
| Local reproduction | three commands, `README.md` |

## What was hard

1. **The screen and the signature cannot disagree.** The EIP-712 digest is computed inside the Ledger
   from the same four values it displays. The host never sends a digest, so blind signing is
   structurally impossible rather than discouraged.
2. **The call budget holds under concurrency.** The slot is reserved before execution with no `await`
   between the check and the record.
3. **Refusing to invent a verdict.** If the sealed model is unreachable we return `STOPPED` and change
   nothing — no default, no rule-based stand-in. A fabricated verdict is worse than no verdict. We also
   do not bill for it.

## Why this is not the thing next to it

Secrets managers decide *where a key lives*. Certificate systems decide *which machine it is*. Agent
payment rails decide *that it can pay* — and have no reason to stop anything, since volume is their
revenue. **None of them decide whether this one request, right now, was allowed by a human — and none
of them keep the refusals.**

Four stops are kept apart because a different stop means a different responsibility: `DENIED` (the
human drew that line in advance) · `NEEDS_PRESS` (irreversible, nobody has pressed yet) · `STOPPED`
(no verdict exists — ours) · `human_denied` / `proof_expired` (a person refused, and they are allowed
to). A system that answers every stop with "failed" has thrown away the only thing worth having after
something goes wrong.

## GitHub Repositories
`kou-uni/ethglobal-mumbai` (public)

---

# Tech stack (paste into the form, field by field)

**Ethereum developer tools** — select: **viem**, **Ethers.js**, **Ledger**.
Add under "other" if the list allows it: **EIP-712 typed-data signing**, **Ledger Device SDK (Rust)**.
*What they do here:* viem signs and sends the seal transaction and recovers the signer of a permit;
ethers is pulled in by the 0G Storage SDK; the Ledger is the only thing that can add a key to the
switchboard or approve a heavy call.

**Blockchain networks** — select **0G** (Galileo testnet, chainId **16602**, `0x40da`).
Nothing else. We are not deployed on any mainnet and do not claim to be.

**Programming languages** — **JavaScript**, **Rust**, **Python**.
*Where:* JavaScript — the Broker (Node 24, no transpiler, no build step) and the three screens.
Rust — the Ledger app (`ledger-app/`, `no_std`). Python — the USB bridge (`bridge/bridge.py`) and
every figure in the repository.

**Web frameworks** — **none**. Add under "other": **no framework (vanilla JS + the Node `http` module)**.
*Why it is worth saying:* the judged screens are static files with no build step, so anyone can open
them straight from GitHub Pages and read the source in the same tab.

**Databases** — **none**. Add under "other": **append-only JSONL, sealed to 0G Storage**.
*Why:* the trail must be append-only and publicly verifiable. A database you can `UPDATE` is the
wrong shape for the one artifact whose value is that it cannot be rewritten.

**Design tools** — **none**. Add under "other": **hand-written SVG, generated from Python**.
Every figure in the repository comes out of a script, from one bilingual source of copy, so the
figures cannot drift from the system or from each other: `assets/build-figures.py` (the switchboard,
the sequence, what accumulates, and the animated page that writes itself out — plain SMIL, no
JavaScript), plus `ideation/build-diagrams.py`, `build-business-model.py` and `build-hero-video.py`.

**Other technologies / libraries we lean on heavily**

| | What it is | What it does for us |
|---|---|---|
| **0G Compute (TeeML)** | TEE-attested inference, Intel TDX / dstack, model `0gm-1.0-35b-a3b` | **Decides the weight of a request by reading its body — inside the seal, where its operator cannot read it.** This is in the decision loop, not a log sink. No answer means the call stops; there is no fallback judgement |
| **`@0gfoundation/0g-storage-ts-sdk`** | 0G Storage client | Seals the append-only trail, which is what makes a star checkable afterwards. Flow contract `0x22E03a6A89B950F1c82ec5e74F8eCa321a105296` |
| **World ID** | Proof of personhood, OIDC `device_code` grant | One sector-scoped pseudonym, one star, per version — so a flame cannot be bought |
| **`ledger_device_sdk` (Rust)** | Ledger app framework | The four lines on the device screen, and the EIP-712 digest computed **inside** the device from those same bytes |
| **`jose`** | JWT / JWKS | Verifies the World ID token against the issuer's keys |
| **`hidapi`** (Python) | USB HID | The bridge between the host and the device |
| **Node.js built-in test runner** | `node --test` | **60 tests, 60 passing**, no test framework dependency |

---

## Describe how AI tools were used in your project

**Claude Code (Anthropic) and OpenCode were used, by one of the two of us, on the half that people
do not look at.**

- **`broker/src/` and `broker/test/`** — the human wrote the boundaries first, as a spec
  (`spec/permit-signature.md`), then had the AI write the implementation, then verified it with
  tests the human read and ran (`node --test`, 60 passing).
- **`assets/build-figures.py` and the documentation** — the figures and `docs/HOW-IT-RUNS.md` are
  generated and kept in step by the AI, from one bilingual source of copy, so a change to the system
  cannot leave a figure behind.
- **`ideation/` and `research/`** — drafting and structure. **Every number, verdict and measurement
  in those documents was produced by running something and reading the result**.
- **`web/`, `ui/` and `ledger-app/`** — designed and implemented by the other teammate, on the
  device and in the browser. AI assistance on the Rust, human hands on the screens.
- **What we did not do:** nothing generated by AI went into the submission without a human running
  it.

The spec-driven artifacts are all in the repository, so **what we asked for and what we rejected is
visible, not just what was generated**.

---

# Prize selection (paste into the form)

**Submission type: Top 10 Finalist & Partner Prizes.**
*Condition: live judging is 09:30 IST on 7 November and someone has to be in the room.*
The four-minute script is in `ideation/2026-11-07-finalist-4min.md`.

**Partners (3 of 3 used): 0G · World · Ethereum Foundation.**
Reasoning and what we gave up is in `research/11-prize-gap.md` — ENS ($7,000) was dropped on purpose,
because it would have cost the EF slot, it is mainnet/Sepolia while our registry is on 0G Galileo,
and a name is not core to this work.

**Other partners' technologies used but not applying for:** none.
*(The Ledger device is central to the project, but Ledger is not a partner at this event.)*

## Why 0G

**The sealed model is in the decision loop, not next to it.** Before anything runs, the Broker sends
the request body to a **TEE-attested 0G Private Computer** (`0gm-1.0-35b-a3b`, TeeML / Intel TDX)
and gets back the weight: `routine`, `significant` or `decisive`. The weight decides whether a human
has to press. **The Broker keeps none of the body — keeping none of it is the feature**, because the thing that
makes the judgement good is the thing we are not allowed to see.

- **467 measured calls.** 283.9 input / 28.0 output tokens, ~2.0 s, **$0.000036 per judgement**
  (unit prices read from `GET router-api.0g.ai/v1/models → pricing_usd`).
- **The trail is sealed on 0G Galileo.** tx `0x74c7cdf9…aef1`, block **64103318**, `status 0x1`,
  Flow contract `0x22E03a6A89B950F1c82ec5e74F8eCa321a105296`.
- **When 0G is unreachable we return `STOPPED`, change nothing, and do not bill.** No default verdict,
  no rule-based stand-in. **A fabricated verdict is worse than no verdict** — and it would be against
  the spirit of the track to pretend the model answered.
- We also measured a prompt change rather than assuming it: switching the weight prompt from Japanese
  to English was only adopted after **120 paired calls** showed it was not less safe (decision 25).

## Why World

**Proof of personhood is what makes a trust signal unbuyable.** Stars sell for **$0.0027** each today.
A star in TOMOSHIBI can only be issued to a World-verified human, **one sector-scoped pseudonym, one
star, per version** — and **every star goes out when the maker ships a new version**, so the signal
describes the code running now rather than the code that earned the reputation.

- **Agent Pass via OIDC `device_code`**, called directly from a **screenless Broker** — the device
  flow is what makes personhood reachable from a daemon. Issuer verified; the token is checked
  against the issuer's JWKS with `jose`.
- We bind **only the `sub`**. No name, no e-mail, no wallet. Which skill got a star, which key it was
  and when it was used are **not** visible to World.
- **Our client is registered**, and the device flow runs from the Broker against the live issuer.
  Any run made without it is recorded with `simulated: true`, and we never present those as real.

## Why Ethereum Foundation (CROPS)

**The privacy property here is structural, not a policy.** The body is read for the judgement inside
the TEE, where **the model's operator cannot see it**; the Broker passes it through and **retains none
of it**, and the trail — which is written to be public — carries **no request body and no key**.
**The Broker is not yet inside a TEE**, so whoever runs it is in a position to read what passes
through. We state that rather than claim otherwise.

| | Knows | Does not know |
|---|---|---|
| The device | The four lines, and whether a human pressed | The request body. The key never leaves |
| World | That this is a human, and the same human | Which skill, which key, when |
| 0G Private Computer | The body, **inside the seal** | Either key. **Its operator cannot read the body** |
| The trail | Who permitted what, and whether it stopped | **No body, no key** |

- No trackers: no analytics script, no pixel, no third-party cookie. MIT licensed.
- **The known gap, stated rather than hidden:** the Broker is the one point of trust and **we did not
  put it in a TEE this time**; and the anonymous read path for stars (query without revealing which
  star you are reading) is **designed but not implemented**. Both are written down in the README.

---

# Per-prize fields (paste these)

Permalinks are pinned to commit `99e91a1`.

## 0G — $15,000

**Why we are applicable**

> The 0G Private Computer is inside our decision loop, not beside it. Before an agent's request runs,
> the Broker sends the request body to a TEE-attested model (`0gm-1.0-35b-a3b`, TeeML) and gets back
> how heavy the action is — routine, significant or decisive — and that verdict decides whether a
> human has to press a button on a Ledger. The Broker passes the body through and **keeps none of it**:
> the judgement needs the content, and the operator must not have it. We measured 467 calls at
> ~2.0 s and **$0.000036 per judgement**, and the append-only trail is sealed on 0G Galileo
> (tx `0x74c7cdf9…aef1`, block 64103318). When 0G is unreachable we return `STOPPED` and change
> nothing — we never fabricate a verdict.

**Link to the line of code**
`https://github.com/kou-uni/ethglobal-mumbai/blob/99e91a1ef6a684eb1d2854ba5388ff41ee5269a9/broker/src/weigh.js#L68`

**Ease of use: 8**

**Feedback for the sponsor**

> The OpenAI-compatible surface meant the first working call took minutes, which is the best thing
> about it. Three things cost us real time. (1) **Per-token prices are not in the docs** — we found
> them in the `pricing_usd` field of `GET /v1/models`, after a day of planning around a 10x cost
> uncertainty. Putting that table in the docs would have saved the whole exercise. (2) **Thinking is
> on by default and is not mentioned in the quickstart.** Our first integration took 17.2 s per call
> and we nearly dropped the feature; `chat_template_kwargs.enable_thinking=false` brought it to
> 2.0 s. (3) **Verifying the TEE attestation end-to-end is hard to find a path for** — we can say the
> endpoint is attested, but a short "how to check the dstack quote yourself" page would let us claim
> it rather than cite it. Minor: in the storage SDK, `indexer.upload()` returning a `[tx, err]` tuple
> is unusual for JavaScript and cost us one debugging round.

## World — $12,500

**Why we are applicable**

> A trust signal is worthless if it can be bought, and stars sell for $0.0027 each today. In
> TOMOSHIBI a "flame" can only be lit by a World-verified human: one sector-scoped pseudonym, one
> star, per version of a skill — and **every star goes out when the maker ships a new version**, so
> the signal always describes the code that is running now. We use Agent Pass through the OIDC
> `device_code` grant, called straight from a Broker that has no screen, and verify the token against
> the issuer's JWKS. We bind only the `sub` — no name, no e-mail, no wallet — so World never learns
> which skill was endorsed, which key it was, or when it was used.

**Link to the line of code**
`https://github.com/kou-uni/ethglobal-mumbai/blob/99e91a1ef6a684eb1d2854ba5388ff41ee5269a9/broker/src/world.js#L39`

**Ease of use: 8**

**Feedback for the sponsor**

> Agent Pass being plain OIDC underneath is the right decision and should be said louder in the docs
> — we spent our first hour looking for a bespoke SDK before realising we could use any OIDC client.
> The `device_code` grant is what made this work at all, because our Broker is a daemon with no
> screen; a short "verifying a human from a headless process" guide would land well with the agent
> crowd this hackathon was aimed at. One concrete sharp edge: **`/api/v1/device_authorization`
> returns 400 unless the request carries `client_secret`** — a public client is rejected, and the
> error body does not say that. Documenting that a confidential client is required for the device
> flow would have saved us an hour. Finally, the relationship between the sector-scoped `sub` and the
> nullifier vocabulary used elsewhere in the World docs took a while to pin down.

## Ethereum Foundation — $15,000

**Why we are applicable**

> Our privacy property is structural rather than a promise. The only component that reads the
> body of a request is the sealed model inside the TEE; the Broker proxies the call and keeps **only
> a hash of what came back**, so the trail — which is written to be public — contains no request
> body and no key. The signing key never leaves the Ledger: the device computes the EIP-712 digest
> internally from the same four lines it displays, so the host cannot ask it to sign something other
> than what the human read. Stars bind only to a sector-scoped pseudonym. There are no analytics
> scripts, no pixels and no third-party cookies, and the whole thing is MIT.

**Link to the line of code**
`https://github.com/kou-uni/ethglobal-mumbai/blob/99e91a1ef6a684eb1d2854ba5388ff41ee5269a9/broker/src/execute.js#L21`

**Ease of use: 7**

**Feedback for the sponsor**

> This is less an API than a set of properties to build toward, so the rating above is about the
> track rather than a library. The most useful thing for a team like ours would be **a short
> worked example of what counts as "minimum disclosure" when a third party must read a payload to
> make a decision.** Our whole design turns on that case — something has to read the request to
> judge it, and we solved it by putting the reader inside a TEE so the operator cannot see it. We
> could not find prior art in the track materials saying whether that is considered acceptable or a
> cop-out, and we would have built differently if it were the latter. A second useful addition would
> be guidance on **privacy-preserving reads**: publishing a public trail is easy, but letting someone
> query it without revealing which entry they care about is the part we designed and ran out of time
> to implement.

---

# PASTE-READY — the six boxes, exactly as typed

Plain prose, no markdown. The first box asks for "a sentence or two"; these are two or three.
Permalinks are pinned to commit `99e91a1` and will not move.

## 0G — $15,000

**Box 1 — How are you using this Protocol / API?**

```
We put the 0G Private Computer inside our decision loop, not beside it. Before an agent's request runs, the Broker sends the request body to a TEE-attested model (0gm-1.0-35b-a3b, TeeML) and gets back how heavy the action is — routine, significant or decisive — and that verdict decides whether a human has to press a button on a Ledger. The Broker passes the body through and keeps none of it — not in the trail, not in a log — and the operator of the model cannot read it, because the inference runs inside the TEE. The Broker itself is not yet inside a TEE, and we say so rather than claim more. We measured 467 calls at ~2.0 s and $0.000036 per judgement, and the append-only trail is sealed on 0G Galileo (tx 0x74c7cdf9…aef1, block 64103318); when 0G is unreachable we return STOPPED and change nothing rather than invent a verdict.
```

**Box 2 — Link to the line of code**

```
https://github.com/kou-uni/ethglobal-mumbai/blob/99e91a1ef6a684eb1d2854ba5388ff41ee5269a9/broker/src/weigh.js#L68
```

**Box 3 — Ease of use:** 8 stars

**Box 4 — Additional feedback for the sponsor**

```
The OpenAI-compatible surface meant our first working call took minutes, which is the best thing about it. Three things cost us real time. (1) Per-token prices are not in the docs — we found them in the pricing_usd field of GET /v1/models, after a day of planning around a 10x cost uncertainty. Putting that table in the docs would have saved the whole exercise. (2) Thinking is on by default and is not mentioned in the quickstart. Our first integration took 17.2 s per call and we nearly dropped the feature; chat_template_kwargs.enable_thinking=false brought it to 2.0 s. (3) Verifying the TEE attestation end-to-end is hard to find a path for — we can say the endpoint is attested, but a short "how to check the dstack quote yourself" page would let us claim it rather than cite it. Minor: in the storage SDK, indexer.upload() returning a [tx, err] tuple is unusual for JavaScript and cost us one debugging round.
```

## World — $12,500

**Box 1 — How are you using this Protocol / API?**

```
A trust signal is worthless if it can be bought, and stars sell for $0.0027 each today. In TOMOSHIBI a "flame" can only be lit by a World-verified human: one sector-scoped pseudonym, one star per version of a skill, and every star goes out when the maker ships a new version, so the signal always describes the code that is running now. We use Agent Pass through the OIDC device_code grant, called straight from a Broker that has no screen, and verify the token against the issuer's JWKS. We bind only the sub — no name, no e-mail, no wallet — so World never learns which skill was endorsed, which key it was, or when it was used.
```

**Box 2 — Link to the line of code**

```
https://github.com/kou-uni/ethglobal-mumbai/blob/99e91a1ef6a684eb1d2854ba5388ff41ee5269a9/broker/src/world.js#L39
```

**Box 3 — Ease of use:** 8 stars

**Box 4 — Additional feedback for the sponsor**

```
Agent Pass being plain OIDC underneath is the right decision and should be said louder in the docs — we spent our first hour looking for a bespoke SDK before realising we could point any OIDC client at it. The device_code grant is what made this work at all, because our Broker is a daemon with no screen; a short "verifying a human from a headless process" guide would land well with the agent crowd this hackathon was aimed at. One concrete sharp edge: /api/v1/device_authorization returns 400 unless the request carries client_secret — a public client is rejected, and the error body does not say so. Documenting that the device flow needs a confidential client would have saved us an hour. Finally, the relationship between the sector-scoped sub and the nullifier vocabulary used elsewhere in the World docs took a while to pin down.
```

## Ethereum Foundation — $15,000

**Box 1 — How are you using this Protocol / API?**

```
Our privacy property is structural rather than a promise. The body is read for the judgement inside the TEE, where the model's operator cannot see it; the Broker passes it through and retains none of it, so the trail — which is written to be public — contains no request body and no key, only a hash of what came back. Two different keys, and neither reaches the agent: the signing key never leaves the Ledger, which computes the EIP-712 digest internally from the same four lines it displays, and the API key never leaves the Broker. The Broker is not yet inside a TEE and we say so. Stars bind only to a sector-scoped pseudonym, there are no analytics scripts, pixels or third-party cookies, and the whole thing is MIT.
```

**Box 2 — Link to the line of code**

```
https://github.com/kou-uni/ethglobal-mumbai/blob/99e91a1ef6a684eb1d2854ba5388ff41ee5269a9/broker/src/execute.js#L21
```

**Box 3 — Ease of use:** 7 stars

**Box 4 — Additional feedback for the sponsor**

```
This is less an API than a set of properties to build toward, so the rating is about the track rather than a library. The most useful addition for a team like ours would be a short worked example of what counts as "minimum disclosure" when a third party has to read a payload in order to make a decision. Our whole design turns on that case — something must read the request to judge it, and we solved it by putting the reader inside a TEE so the operator cannot see it. We could not find prior art in the track materials saying whether that counts as privacy-preserving or as a cop-out, and we would have built differently if it were the latter. A second useful addition would be guidance on privacy-preserving reads: publishing a public trail is easy, but letting someone query it without revealing which entry they care about is the part we designed and ran out of time to implement.
```
