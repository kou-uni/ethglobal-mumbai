# Tomoshibi Broker

**Put one button in front of the key that the AI cannot press.**

The skill never gets the key. It only sends `use`. The Broker checks the request against
**the scope the key holder signed**. If it falls outside, the Broker stops it without executing,
and **keeps a record of the stop itself, with the evidence**.

**Inside the scope, the next question is the weight, and 0G answers it.** Heavy requests pass
only on a single-use permit pressed right then. **If 0G cannot be reached, the Broker stops
instead of inventing a judgement** (safe-stop).

```
skill ──use──▶ Broker ──────── scope check ────────▶ 0G Private Computer (TeeML)
                 │        │                          │ weight (routine / significant / decisive)
                 │        └──▶ external API ◀────────┘
                 └──── trail (append only) ──▶ 0G Storage
```

## Run it in one minute

```bash
npm install
npm test                       # 50 tests

# Production: really ask 0G (needs a pc.0g.ai API key)
ZG_API_KEY=sk-… node src/server.js &

# Development: [simulated], 0G is never called. Records and screens say simulated. **Do not use for filming or submission**
ZG_OFFLINE=1 node src/server.js &

node demo.mjs                  # passes / seals / stops / needs a press / root hash
```

## HTTP

| | |
|---|---|
| `POST /use` | `{permit, signature, request, skillSignature}` → `200 ALLOWED` / `403 DENIED`. The body is the sealed record itself |
| `GET /trace/:thread` | The record for one use. **The QR points here** |
| `POST /lines` | permit → the 4 lines shown on the device. Use it to check that the screen and the hash do not come down separate paths |
| `POST /skill-message` | `{permit, request}` → the string the skill must sign |
| `POST /vouch/start` | → `user_code` and a URL. **The cue shown on the key holder's own device** (the QR is screen A) |
| `POST /vouch/finish` | `{deviceCode, skill, version}` → `200 STAR` / `403 VOUCH_DENIED` (`human_denied` / `proof_expired`) |
| `GET /stars/:skill?version=` | Stars per version. **When the version changes, stars for the old version stop counting** |
| `POST /seal` | `{thread}` → the trail goes to 0G Storage. Returns `rootHash` and `tx` |
| `GET /zg/balance` | The 0G balance (so the screen can show credits going down) |
| `GET /health` | The 0G endpoint, the model, whether the key is present, whether it is simulated |

`request` is `{method, url, keyRef, body?}`. `keyRef` must match `permit.key`.
The `decision` that comes back is one of four: `ALLOWED` / `DENIED`(403) / `NEEDS_PRESS`(409) / `STOPPED`(503).

## 0G (this is the decision loop)

| | |
|---|---|
| **Deciding the weight** | `src/weigh.js`. `0gm-1.0-35b-a3b` (**TeeML, `tee_attested: true`, TDX / dstack** [verified 2026-11-06]) |
| **What is handed over** | The 4 lines shown on the device, the operation, and **the body of the request**. **The plaintext key is never handed over** |
| **Why 0G** | **You cannot decide the weight without reading the contents. Sealed inference is the only thing that can read those contents without showing them to us either** |
| **request ID** | The `x-request-id` of the response (or the `id` in the body, if there is none). It stays in the `ALLOWED` / `NEEDS_PRESS` / `STOPPED` records |
| **What it changes** | `src/tier.js`. `decisive` does not pass on a standing permit (`NEEDS_PRESS`). **0G's answer changes the outcome** |
| **When it cannot be reached** | **No judgement is invented.** `STOPPED` plus `safeStop: true`. It never passes on a default and never swaps in a rule |
| **Episode log** | `src/episode.js`. `POST /seal` sends it to 0G Storage (the Log layer). Returns `rootHash` and `tx` |
| **Target contract** | The Galileo Flow at `0x22E03a6A89B950F1c82ec5e74F8eCa321a105296`. **[verified] a tx carrying the root builds all the way up to here** (the root is in the `submit` calldata; only gas is missing) |
| **What it costs** | About **30,733,644,962 wei of gas plus a 30.7 Gwei fee** per call [verified]. **The faucet's 0.1 0G/day is enough** |

```bash
ZG_API_KEY=sk-…         # pc.0g.ai (without it everything is STOPPED. nothing passes silently)
ZG_PRIVATE_KEY=0x…      # 0G Galileo test key. Sends the /seal tx
ZG_MODEL=0gm-1.0-35b-a3b
ZG_ESCALATE=decisive    # from this tier up, a press right now is required
ZG_OFFLINE=1            # [simulated] 0G is never called. simulated: true stays in the record
```

## World (who it is. only when a star is given)

**It is not called every time a key is used. That is the Ledger's job.** What World checks is
that this is a person, and the same person, and **the action it protects is giving a star**
(staking your own reputation to say "I use this").

| | |
|---|---|
| **What it is** | Standard OIDC. issuer `https://auth.world.org` [verified]. It has the `device_code` grant, so a Broker with no screen can start the flow |
| **The flow** | `/vouch/start` → the key holder finishes it on their own device → `/vouch/finish` takes the token and **verifies it against JWKS** → a star |
| **The refusal path** | **We did not build it. It is in the device flow from the start.** `access_denied`→`human_denied`, `expired_token`→`proof_expired` |
| **Verification** | `jwtVerify` from `jose`. It checks `iss` / `aud` / `exp`. **It does not settle for reading the id_token** |
| **client secret** | Inside the Broker only. It never reaches the browser or the skill |
| **Once only** | The same pseudonym (`sub`) cannot star the same version twice. `store.claimStar` rejects it atomically |
| **Versions** | Stars are per `(skill, version)`. **When the version changes, every star goes out at once** (the old version's count stays) |

```bash
WORLD_CLIENT_ID=app_…      # register at auth.world.org/portal (without it /vouch/start returns 503)
WORLD_CLIENT_SECRET=…
WORLD_OFFLINE=1            # [simulated] World is never called. simulated: true stays in the record
                           #   put deny / expire in deviceCode to walk the refusal path as it is
```

**See the safe-stop:**

```bash
ZG_API_KEY=sk-dummy ZG_ENDPOINT=https://127.0.0.1:1/v1 node src/server.js &
node demo.mjs   # STOPPED even inside the scope. Nothing executes, and the call budget is not spent
```

## The two signatures

| | Whose key | What for |
|---|---|---|
| `signature` | **The person** (Ledger) | Grants the scope. EIP-712. [`../spec/permit-signature.md`](../spec/permit-signature.md) |
| `skillSignature` | **The skill** (soft key) | Shows the request really came from that skill. `personal_sign("tomoshibi-request:<thread>")` |

A request with no `skillSignature`, or one that does not match `permit.skill`
(= `keccak256(signer address)`), is **stopped** too. But it is **not sealed as a violation**.
Otherwise a third party who merely got hold of the permit could manufacture a violation against that skill.

## Why it stops

| reason | | sealed |
|---|---|---|
| `WRONG_KEY` | A key that was not permitted | yes |
| `OUT_OF_TARGET` | A target that was not permitted (**exact host match**) | yes |
| `INSECURE_TRANSPORT` | Not `https` (in plaintext the key leaks) | yes |
| `OUT_OF_SCOPE` | An operation that was not permitted (**the path matches by prefix, up to a separator**) | yes |
| `REPLAY` | A different skill reused the same nonce | yes |
| `EXPIRED` | Past the expiry | no |
| `EXHAUSTED` | The call budget is used up | no |
| `BAD_SIGNATURE` | The signature is not the holder's | no |

**Only a request that went outside the declared scope gets sealed.**
`EXPIRED` and `EXHAUSTED` are the permit running thin exactly as designed, and a skill that
simply used up its budget is not an offender.
With `BAD_SIGNATURE` there is no telling whose request it was, so there is nobody to seal it against.
A suspicious response body (exfiltration, incitement) is **only reported**, and is not handled here.

## Boundaries

- **The signature contract is [`../spec/permit-signature.md`](../spec/permit-signature.md).** `src/permit.js` is its implementation.
  EIP-712, `m/44'/60'/0'/0/0`, chainId 16602 (0G Galileo)
- **The digest that arrives is never used.** It is rebuilt from the permit and run through `ecrecover`
- **The 4 lines on the device and the 32 bytes come from the same value.** `lines()` and `digest()` go through the same `normalize()`
- **The call budget is reserved before execution** (`store.reserve`). There is no `await` between the check
  and the record, so hammering the button cannot get past `maxCalls`. A failed execution does not give it back (fail-closed)
- **A nonce is claimed only by a request whose holder signature verified.** A forged-signature request
  cannot claim it first and turn the genuine request that follows into a `REPLAY`

## Not in yet (we are not dressing this up)

- **0G Storage is sealed by hand.** Records are always appended to a local JSONL (`data/ledger.jsonl`),
  and only what you call `POST /seal` for goes up to 0G Storage. **It does not go up every time** (the Galileo faucet gives 0.1 0G/day)
- **Without `ZG_PRIVATE_KEY` you get the root hash only, and `uploaded: false`.** It does not pretend it was stored
- **World** — the code path is written and the issuer is [verified], but the client registration has not come through, so no star has been issued against production
- **A real Ledger device** — `demo.mjs` signs with a test key. A real device drops in through the single JSON in `spec/permit-signature.md`
- **Version matching** — `version` is not checked. `VERSION_CHANGED` and putting the stars out are not implemented (issue #14, hole 3)
- **Signed refusals** — `DENIED` reaches the device through the PC. The device does not verify it (issue #14, hole 1)
- **The Broker is a trust point** — the key lives here. In production it goes in a TEE. It does not this time

## License

MIT. No trackers.
