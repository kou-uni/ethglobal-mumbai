# TOMOSHIBI 🕯️

**A review score never expires. A flame goes out. That is the whole idea.**

> ### Your agent is holding a spare key that works until you cancel it.
>
> **For anyone who hands an AI agent a real key** — a Stripe secret, a wallet, a logged-in session —
> **TOMOSHIBI is the approval layer that hands over one use instead of the key.**
> It does for every action an agent takes what your bank does for a single card payment:
> you approve this one, not all future ones.
> **Unlike a password manager, the secret is never handed over at all** — and every refusal is
> kept, named and signed.

AI agents are starting to ask for our API keys the way apps once asked for passwords — a secret
with no scope, no expiry and no receipt, handed to code we did not read. **TOMOSHIBI puts one
button in front of the key that an AI cannot press.** You sign a scope on a Ledger device — which
key, which destination, which operation, how many times, until when — and the four lines on the
device screen are built from the same bytes that get signed. The skill never receives the secret.
Anything outside the signed scope is refused *before* it happens, and recorded with the skill's own
signature on the request.

And a star is not a review. A star means *I, a verified human, am using this version with my own
key.* **When the version changes, every star goes out at once.**

## Try it now

| | |
|---|---|
| The gate — four different ways to stop | https://kou-uni.github.io/ethglobal-mumbai/ui/index.html |
| The flame — stars go out when the version changes | https://kou-uni.github.io/ethglobal-mumbai/ui/stars.html |
| The live screen wired to the device | https://kou-uni.github.io/ethglobal-mumbai/web/gate.html |

```bash
git clone https://github.com/kou-uni/ethglobal-mumbai && cd ethglobal-mumbai/broker
npm i && npm test                 # 50 / 50
PORT=8797 EXECUTE=0 node src/server.js   # needs ZG_API_KEY, ZG_PRIVATE_KEY
node demo.mjs http://127.0.0.1:8797      # all five paths, end to end
```

## Verifiable facts (not adjectives)

| | |
|---|---|
| A trail sealed on **0G mainnet-testnet (Galileo, chainId 16602)** | tx [`0x74c7cdf9…aef1`](https://chainscan-galileo.0g.ai/tx/0x74c7cdf9bca055c502918e62a7ac9fc7634d1326471433ab10161045aa97aef1) · block **64103318** · `status 0x1` |
| 0G Storage root hash | `0xc0e0c7a911547490680d545ad9d4638a9bf23bd72d8a3004edf9b4ffaa5be080` |
| Tests | **50 / 50**, including the frozen cross-side signature vector (`spec/permit-signature.md` §6) |
| Measured against the **real** 0G Private Computer (TeeML, TDX-attested) | **467 calls** · 2.0 s per verdict · **$0.000036** per verdict |
| Hardware | A custom **Ledger** app in Rust. No blind signing: the host never sends a digest |

## What was hard

1. **The screen and the signature cannot disagree.** The EIP-712 digest is computed *inside* the
   device from the same four values it displays. The host never sends a digest, so blind signing is
   structurally impossible — not merely discouraged.
2. **The count holds under concurrency.** The call budget is reserved before execution with no
   `await` between the check and the record. 100 simultaneous requests against `maxCalls=3` let
   through 0 extra — covered by a test.
3. **Refusing to invent a verdict.** If the sealed model is unreachable we return `STOPPED` and
   change nothing — no default, no rule-based stand-in. **A fabricated verdict is worse than no
   verdict.** Four stops are kept apart because a different stop means a different responsibility:
   `DENIED` (you drew that line in advance) · `STOPPED` (nobody could decide) ·
   `NEEDS_PRESS` (irreversible, and no human has pressed yet) · `human_denied` / `proof_expired`.

## Why this is not the thing next to it

Secrets managers decide *where a key lives*. Certificate systems decide *which machine it is*.
Agent payment rails decide *that it can pay* — and have no reason to stop anything, since volume is
their revenue. **None of them decide whether this one request, right now, was allowed by a human —
and none of them keep the refusals.**

## Why India picked this problem before we did

From **April 2026** the RBI requires a *dynamic, per-transaction* authentication factor for
card-not-present payments, and it applies whether a human or an agent initiates it. NPCI is building
agent payments on UPI with spending limits, audit trails, identity checks and a liability framework.
And CERT-In's Digital Threat Report 2025-26 asks to *"mandate human-in-the-loop controls for agentic
AI actions above defined financial thresholds, with full audit trails."*

**That last sentence is our product description.** We have not integrated with UPI and do not claim
to — the match is structural, and that is the claim. Sources and the honest limits:
[`ideation/2026-11-06-why-mumbai.md`](ideation/2026-11-06-why-mumbai.md).

---

> Start at [START-HERE.md](START-HERE.md) for the current state, how to run it, and what is next.
> ETHGlobal Mumbai 2026 (kou-uni × mintannn). Hacking window: 11/5 21:00 → 11/7 09:00 IST.

**TOMOSHIBI** (*tomoshibi* / a small flame that can go out) —
**Keep the one place an AI cannot see on your own device, and let the AI carry only who trusted what.**
Not how many stars. Whose star.

## Design and decision records

| Where | What |
|---|---|
| `ideation/2026-11-06-decisions.md` | **The decision record.** What we decided (most recent) |
| **`ideation/2026-11-07-finalist-4min.md`** | **Script for the 7-minute finalist round.** Run sheet for the 4-minute demo, the order we cut things if we are pressed, 3 minutes of Q&A (the 3 usual questions plus the 6 hard ones we know are coming) |
| **`ideation/2026-11-06-submission-rules.md`** | **Submission and judging rules (official ETHGlobal).** Deadlines, what is not allowed, judging criteria, video rules, and where we stand against each |
| **`ideation/2026-11-06-stack.html`** | **The system stack.** Seven layers (protocol / tooling / product) and what happens when a borrowed piece goes down |
| `ideation/2026-11-06-minta-proposal.md` | minta's proposal: make a star a fact, not a promise (adopted) |
| **`ui/`** | **Working demo screens (prototype).** `index.html` = the gate (all four ways to stop are visible) / `stars.html` = the flame (goes out when the version rises). The values are real responses from live 0G |
| **`ideation/2026-11-06-market-and-model.html`** | **Market size (TAM/SAM/SOM) and business model.** TAM $43B · SAM $2–7B · SOM $1.4M (year three) / three revenue lines and the cost of one verdict (measured: $0.000036) / what we will not do |
| **`ideation/2026-11-06-diagrams.html`** | **Architecture diagram and five sequence diagrams.** Let it through / make them press / stop it / decline to decide / light a flame (generated by `ideation/build-diagrams.py`) |
| `ideation/2026-11-06-touchpoints.html` | **Who meets which screen, when, and what it changes for them.** Breakdown of the nine open decisions, and which of them Stack-chan would touch |
| `ideation/2026-11-06-screen-flow.html` | **Screen flow and process.** Five screens · transition table · the usage flow · the World flow · three open decisions |
| `ideation/2026-11-06-demo-scenario.md` | **The demo storyline.** 3-minute run sheet · 90-second cut · the fallback when something breaks · the checks before we record |
| `ideation/2026-11-06-storyboard.md` | **The demo script.** Three screens · a 3-minute storyboard · the five shots that land · taglines ([view on phone](https://htmlpreview.github.io/?https://github.com/kou-uni/ethglobal-mumbai/blob/main/ideation/2026-11-06-storyboard.html)) |
| `ideation/2026-11-06-final-image.md` | **The finished picture.** Architecture diagram · business model · personas · journey (storyboard for the video) |
| `ideation/2026-11-06-philosophy.md` | **Philosophy.** Why we are building this (features can be cut; this cannot) |
| `ideation/2026-11-06-review.md` | **Read this first.** The story and the features on one page (marked agreed / proposed) |
| `ideation/2026-11-06-integrated.md` | The merged discussion |
| `ideation/2026-11-06-architecture.md` | Architecture (draft v2) |
| `ideation/2026-11-06-architecture-v2.html` | Diagram (download it and open it in a browser) |
| `research/10-ef-fit.md` | Fit with the EF prizes (CROPS > Anon-RPC) |

## What is settled, and what we are building

| Where | What |
|---|---|
| `ideation/2026-11-06-plan.md` | **How we work and the timetable.** Who does what · the checkpoints · what we drop |
| `ideation/2026-11-06-tech-value-review.md` | **Where World / Ledger / 0G each sit, and a re-check of whether they are really in the build** |
| `research/11-prize-gap.md` | **Per prize: can we win it, what is missing, how to close the gap** (ceiling $11,250) |
| **`broker/`** | **The working thing.** `use` → scope check → **0G decides the weight** → proxied execution → trail, plus **lighting a star with World**. `npm test` 50 tests / `node demo.mjs` |
| `ideation/2026-11-06-world-integration-notes.md` | **Retrospective on the World integration** (required for both World prizes; §6 is the English text for the submission) |
| `spec/permit-signature.md` | **The signing contract.** Derivation path · EIP-712 · how the Broker verifies. The boundary between Ledger and Broker |
| `spec/world-agent-pass.md` | **What World Agent Pass actually is, and how to wire it in** (OIDC / device flow) |

**Split of work (#12): minta owns everything people see, kou owns everything they do not.**
The boundary is one JSON in `spec/permit-signature.md` and the Broker's HTTP.


## Privacy (EF CROPS)

**Who knows what. The design keeps them apart.**

| | Knows | Does not know |
|---|---|---|
| **Ledger (the device)** | The four lines of scope (key label, destination, operation, expiry), and whether it was pressed | The body of the request. The key never leaves in the clear either |
| **World** | **That this is a human, and the same human** (a per-sector pseudonym) | Which skill got a star · which key · when it was used |
| **0G Private Computer (TeeML)** | The body of the request (**inside the seal**, to decide the weight) | The key in the clear. **We cannot read it either** — it stays inside the TEE |
| **Broker** | Scope · verdicts · the trail | — **This is the one point of trust, and we did not put it in a TEE this time**. We say so rather than let it pass unnoticed |
| **The trail (0G Storage)** | Who permitted it, what was requested, and whether it went through or stopped | **No body, no key.** It is written to be public |

- **A star binds to a pseudonym and nothing else.** We seal only the World `sub` (per sector). No name, no email, no wallet
- **No trackers.** No analytics scripts, no pixels, no third-party cookies
- **Open source.** MIT (`LICENSE`). Dependencies are `viem` / `jose` / `ethers` / `@0gfoundation/0g-storage-ts-sdk`
- **Lookups must not leak.** Star reads go through Anon-RPC by default: fetch everything, filter on the device
  (**not implemented.** `research/10-ef-fit.md`, decision #6)

## 0G (why we need it, and why people come back tomorrow)

**What breaks without 0G, in one sentence:**
**You cannot decide the weight without reading the request, and we must not be the ones reading it. Only sealed inference makes that work.**
Drop 0G and the Broker has to read the body in the clear to decide the weight — which breaks the premise of the whole thing.

**Why people come back (two lines):**
One star means nothing. **The weight grows as the fact of still using it, with the same key, piles up.**
And every star goes out at once when the version changes, so **only the people still using it notice, and light one again.**

## How we built it (disclosure per the ETHGlobal rules)

**Built inside the hacking window (from 11/5 21:00 IST).** No pre-existing project-specific code.

### What we reused (public starter kits and libraries)

| Where | Origin | License |
|---|---|---|
| `ledger-app/` | Started from LedgerHQ **`app-boilerplate-rust`** (the app itself was written here) | Apache-2.0 |
| `broker/` dependencies | `viem` / `jose` / `ethers` / `@0gfoundation/0g-storage-ts-sdk` | Respective OSS licenses |
| `bridge/bridge.py` | `hidapi` (Python) | Respective OSS licenses |

Everything else (`broker/src/`, `web/`, `ui/`, `spec/`, `ideation/`) **was written here**.

### How we used AI tools

**We used Claude Code (Anthropic). Of the two of us, it was used on the side people do not see: the implementation and the documents.**

| Scope | How |
|---|---|
| `broker/src/`, `broker/test/` | **A human decided the design, the AI wrote it, a human verified it with tests.** The boundaries of the verdict (the four ways to stop, scope matching, the call budget) were written by a human as a spec first (`spec/`) |
| `ideation/`, `research/` | Used to draft the structure and the prose. **Only numbers, verdicts and measurements a human ran and confirmed are on the page** (marked [verified]) |
| `web/`, `ui/` | **Designed and built by minta** (the screens are human work) |
| `ledger-app/` (Rust) | **Built by minta on real hardware** (with AI assistance) |

**Everything the spec-driven work produced is in this repository:**
`spec/permit-signature.md` (the contract between Ledger and Broker) · `spec/world-agent-pass.md` ·
`ideation/2026-11-06-decisions.md` (what we decided and what we dropped — 25 of them) ·
`ideation/2026-11-06-plan.md` (timetable and checkpoints).
**Not just the output: how we prompted it and what we rejected is on the record too.**

Nothing the AI made and a human did not check is in the submission.
Any number we did not measure ourselves is marked [unverified].
