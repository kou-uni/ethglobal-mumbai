# Draft submission text (English, 2026-11-06)

**Clear every `[to confirm]` before submitting.** Nothing written here is something we have not implemented.
Anything that was not yet working at the time of writing is marked.

---

## Project name

**TOMOSHIBI** (*tomoshibi*, a flame — a small flame that can go out)

## Tagline (one line)

**An AI agent can use your API keys without ever holding them — and the light goes out when the skill changes.**

## Short description

Agent skills are starting to ask for our API keys the way apps once asked for passwords. We hand over a
secret that has no scope, no expiry and no receipt, to code we did not read, and hope.

TOMOSHIBI puts one button an AI cannot press in front of the key. You sign a *scope* on a Ledger device —
which key, which destination, which operation, how many times, until when — and the four lines on the
device screen are built from the same bytes that get signed. The skill never receives the secret. It asks
a broker to act, and anything outside the signed scope is refused before it happens, and recorded with the
skill's own signature on the request.

Stars are not recommendations. A star means "I, a verified human, am using this version with my own key."
When the version changes, every star goes out at once. Reviews never expire; a flame does.

## How it's made

**Ledger (hardware).** A custom Ledger app computes the EIP-712 digest *inside the device* from the same
four values it displays (`cx_keccak`), so the screen and the signature cannot disagree. No blind signing.
Derivation path `m/44'/60'/0'/0/0`. The host never sends a digest. The device/broker boundary is frozen as a
single JSON contract plus a published test vector (`spec/permit-signature.md` §6).

**0G (decision loop, not a log).** Before acting, the broker asks **0G Private Computer** how heavy the
request is — routine / important / irreversible — using `0gm-1.0-35b-a3b`, a **TeeML** model
(`tee_attested: true`, Intel TDX, verified by dstack). The *body* of the request is part of that judgement,
which is the whole reason 0G is here: **you cannot grade a request without reading it, and we do not want to
read it.** The sealed enclave reads it; we never do. The judgement changes the outcome — an irreversible
request will not pass on a standing permit, only on a press made for that one request. Every decision
carries the 0G `request id`. Episode logs go to **0G Storage** (append-only Log layer, Flow contract
`0x22E03a6A89B950F1c82ec5e74F8eCa321a105296` on Galileo, chain id 16602), and the root hash is in the trail.

**If 0G cannot be reached, nothing happens.** No default, no local rule standing in for the model, no
fabricated verdict — the request stops and the stop is recorded. [to confirm: turn off ZG_OFFLINE before filming]

**World (who, once).** Issuing a star is the protected action — that is where a person stakes their
reputation — so that is where **World ID Agent Pass** sits, not on every key use (the Ledger already covers
"do I allow this, now"). The broker is headless, so it uses the OIDC `device_code` grant: it starts the
request, the person finishes on their own phone, the broker verifies the `id_token` against the JWKS
(`iss`/`aud`/`exp`) in the backend; the client secret never leaves it. **The refusal paths are the
protocol's own**: `access_denied` (a person said no) and `expired_token` (nobody was there) are recorded as
two different events. One sector-scoped pseudonym can star one version once.

**Privacy by separation (EF CROPS).** The device knows the scope and nothing of the body. World knows only
that you are a human and the same human. 0G reads the body sealed. The public trail carries neither keys nor
bodies. MIT licensed, no trackers, no analytics.

## What is not done (we say it out loud)

- The broker holds the key material at execution time. **It is the one trusted point, and it is not in a TEE
  in this build.** The honest next step is running the broker itself inside 0G Private Computer.
- Vouches are recorded in the broker's append-only trail; the on-chain `VouchRegistry` is not deployed, and
  the EIP-712 `verifyingContract` is deliberately frozen at the zero address for this build.
- Reading stars through Anon-RPC is designed, not implemented.

## What to say for each prize (short text to paste into the submission fields)

**0G — Build with 0G Private Computer:** *What breaks without 0G:* grading a request requires reading it, and
we refuse to be the ones who read it — only sealed inference makes that possible. *Why you come back:* a star
is meaningless once; it gets heavy only as the same key keeps using the same version — and when the version
changes every star goes out, so the people still using it are the ones who notice and light it again.
[to confirm: the iAI bonus (authenticating with a 0G account and making the credit burn-down visible) depends on screen C]

**0G — Physical AI (Hardware):** the decision loop calls 0G per request, episode logs with request ids go to
0G Storage, and the hardware is a Ledger device that must be physically pressed. Safe-stop on 0G failure is
demonstrated, not described.

**World — Agent Pass / IDKit:** full chain shown end to end: request → person completes on their device →
backend verification against JWKS → protected action (the star). Denial and expiry are both demonstrated.
Integration notes: `ideation/2026-11-06-world-integration-notes.md`.

**EF — CROPS:** who-knows-what table in the README, MIT, no trackers, no third-party analytics.

## [to confirm] Things to fill in before submission

- Video within 2:55 (EF requires under 3 minutes)
- The contract address field: Flow `0x22E03a6A89B950F1c82ec5e74F8eCa321a105296` (Galileo)
- A screenshot with one 0G request id visible on screen
- Demo URL (judges must be able to touch it. Required for the 0G PC track)
- No `simulated: true` left anywhere (turn off simulation mode and re-film)
