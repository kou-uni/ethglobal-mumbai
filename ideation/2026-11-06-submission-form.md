# 提出フォーム — そのまま貼る用（2026-11-06）

後で直す前提の初稿。**実装していないことは書いていない。**

---

## Project name
tomoshibi

## Category
**Security**（このまま）

## Emoji
**🕯️**
理由: 灯火そのもの。🪔（ディヤ）はディワリの灯で意味は近いが、**インドの語・象徴は借りないと決めている**ので外す。

## Demo link
暫定: `https://kou-uni.github.io/ethglobal-mumbai/`
（GitHub Pages。Broker を公開トンネルに出せたら差し替える）

## Short description（100字以内）
AI agents use your API keys without ever holding them. The light goes out when the skill changes.

（97字。別案98字: AI agents use your keys without ever holding them — and the light goes out when the skill changes.）

## Description（280字以上）
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

## How it's made（280字以上）
**Ledger (hardware).** A custom Ledger app, written in Rust, computes the EIP-712 digest inside the
device from the same four values it displays, so the screen and the signature cannot disagree. No blind
signing, and the host never sends a digest. The device/broker boundary is frozen as one JSON contract
plus a published test vector, so both halves of the team could build against it in parallel.

**Broker (Node, viem).** It holds a child token, never the root key, and runs the gate: scope check →
weight → press → proxy execute → append-only trail. 50 tests, including the frozen cross-side signature
vector.

**0G — in the decision loop, not as a log sink.** Before acting, the broker asks 0G Private Computer how
heavy the request is: routine / important / irreversible, using 0gm-1.0-35b-a3b, a TeeML model
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

## GitHub Repositories
`kou-uni/ethglobal-mumbai`（public）
