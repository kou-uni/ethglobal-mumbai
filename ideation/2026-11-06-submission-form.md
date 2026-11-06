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
`assets/tomoshibi-mark.svg` (teardrop flame + round candle) / `assets/tomoshibi-cover.svg` (1200×630)
Emoji do not let you choose the shape, so **the look is carried by our own mark.**

## Demo link
**`https://kou-uni.github.io/ethglobal-mumbai/ui/index.html`** [verified] A screen you can touch (the gate).
GitHub Pages was enabled on 2026-11-06 and a 200 was confirmed. The flame screen is `/ui/stars.html`.
The values on screen are real responses sent to production 0G (recorded; the timestamp and the source are shown on screen).
At the venue, switch to "send it live" and show the request id from that moment
(GitHub Pages. Swap it out if we can get the Broker onto a public tunnel)

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
| Tests | **50 / 50**, including the frozen cross-side signature vector (`spec/permit-signature.md` §6) |
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

**Ethereum developer tools** — select: **viem**, **Ethers.js**.
Add under "other" if the list allows it: **EIP-712 typed-data signing**, **Ledger Device SDK (Rust)**.
*What they do here:* viem signs and sends the seal transaction and recovers the signer of a permit;
ethers is pulled in by the 0G Storage SDK.

**Blockchain networks** — select **0G** (Galileo testnet, chainId **16602**, `0x40da`).
Nothing else. We are not deployed on any mainnet and do not claim to be.

**Programming languages** — **JavaScript**, **Rust**, **Python**.
*Where:* JavaScript — the Broker (Node 22, no transpiler) and the three screens.
Rust — the Ledger app (`ledger-app/`, `no_std`). Python — the USB bridge and the document generators.

**Web frameworks** — **none**. Add under "other": **no framework (vanilla JS + the Node `http` module)**.
*Why it is worth saying:* the judged screens are static files with no build step, so anyone can open
them straight from GitHub Pages and read the source in the same tab.

**Databases** — **none**. Add under "other": **append-only JSONL, sealed to 0G Storage**.
*Why:* the trail must be append-only and publicly verifiable. A database you can `UPDATE` is the
wrong shape for the one artifact whose value is that it cannot be rewritten.

**Design tools** — **none**. Add under "other": **hand-written SVG, generated from Python**.
Every diagram in the repo is produced by `ideation/build-diagrams.py`,
`build-business-model.py` and `build-hero-video.py`, so the figures cannot drift from the numbers.

**Other technologies / libraries we lean on heavily**

| | What it is | What it does for us |
|---|---|---|
| **0G Compute (TeeML)** | TEE-attested inference, Intel TDX / dstack, model `0gm-1.0-35b-a3b` | **Decides the weight of a request by reading its body — inside the seal, where we cannot read it.** This is in the decision loop, not a log sink |
| **`@0gfoundation/0g-storage-ts-sdk`** | 0G Storage client | Seals the append-only trail. Flow contract `0x22E03a6A89B950F1c82ec5e74F8eCa321a105296` |
| **World ID** | Proof of personhood, OIDC `device_code` grant | One sector-scoped pseudonym, one star, per version — so a flame cannot be bought |
| **`ledger_device_sdk` (Rust)** | Ledger app framework | The four lines on the device screen, and the EIP-712 digest computed **inside** the device from those same bytes |
| **`jose`** | JWT / JWKS | Verifies the World ID token against the issuer's keys |
| **`hidapi`** (Python) | USB HID | The bridge between the host and the device |
| **Node.js built-in test runner** | `node --test` | 50 tests, no test framework dependency |

---

## Describe how AI tools were used in your project

**Claude Code (Anthropic) was used, by one of the two of us, on the half that people do not look at.**

- **`broker/src/` and `broker/test/`** — the human wrote the boundaries first, as a spec
  (`spec/permit-signature.md`), then had the AI write the implementation, then verified it with
  tests the human read. The four refusal types, the scope match and the call-budget reservation
  were specified before any code existed.
- **`ideation/` and `research/`** — drafting and structure. **Every number, verdict and measurement
  in those documents was produced by running something and reading the result**; anything not
  measured is marked `[unverified]` in the text.
- **`web/`, `ui/` and `ledger-app/`** — designed and implemented by the other teammate, on the
  device and in the browser. AI assistance on the Rust, human hands on the screens.
- **What we did not do:** nothing generated by AI went into the submission without a human running
  it. The prompt that decides a request's weight was changed from Japanese to English only **after
  measuring 120 paired calls** and confirming the English version was not less safe
  (`ideation/2026-11-06-decisions.md`, decision 25).

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
has to press. **We cannot read the body — not being able to is the feature**, because the thing that
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
- **Honest status:** the code path is written and the issuer is verified, but **our client
  registration has not come through, so no star has been issued against production yet.**
  Runs without it are recorded with `simulated: true` and we do not present them as real.

## Why Ethereum Foundation (CROPS)

**The privacy property here is structural, not a policy.** The only component that ever sees a
request body is the sealed model, inside the TEE. The operator cannot read it, and the trail — which
is written to be public — carries **no request body and no key**.

| | Knows | Does not know |
|---|---|---|
| The device | The four lines, and whether a human pressed | The request body. The key never leaves |
| World | That this is a human, and the same human | Which skill, which key, when |
| 0G Private Computer | The body, **inside the seal** | The key. **And we cannot read it either** |
| The trail | Who permitted what, and whether it stopped | **No body, no key** |

- No trackers: no analytics script, no pixel, no third-party cookie. MIT licensed.
- **The known gap, stated rather than hidden:** the Broker is the one point of trust and **we did not
  put it in a TEE this time**; and the anonymous read path for stars (query without revealing which
  star you are reading) is **designed but not implemented**. Both are written down in the README.
