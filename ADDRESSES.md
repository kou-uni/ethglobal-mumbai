# Addresses and endpoints (TOMOSHIBI / ETHGlobal Mumbai 2026)

**Only public information may be written here.** **Never write the contents** of private keys or API keys.
Write only where they live (which file, which variable).
Last checked 2026-11-06. How each line was checked is noted at the end of the row.

---

## 1. Wallets (Galileo testnet)

| Use | Address | Notes |
|---|---|---|
| **The Broker's signing key** (0G Storage tx) | `0xdfcbC73bEC15dD080545f77f8B702832a2b142A4` | Disposable. The key is `ZG_PRIVATE_KEY` in `broker/.env.local` (gitignored, mode 600)|
| For the faucet request (the owner) | `0xc94A3b555f355fA16B992b8447e4a873c208F8AC` | Held by the owner |

**Gas goes into the first one.** One upload costs **0.0000002-0.0000005 0G**
(measured 245,869,159,696-430,271,029,468 wei; it varies with the size of the record. These are the actual "want"
values returned by `eth_estimateGas` during `/seal` on 2026-11-06). **0.01 is plenty for filming and the end-to-end runs.**
Check the balance:

```bash
curl -s -X POST https://evmrpc-testnet.0g.ai -H 'content-type: application/json' \
 -d '{"jsonrpc":"2.0","id":1,"method":"eth_getBalance","params":["0xdfcbC73bEC15dD080545f77f8B702832a2b142A4","latest"]}'
```

## 2. Contracts

| What | Address | Notes |
|---|---|---|
| 0G Storage **Flow** | `0x22E03a6A89B950F1c82ec5e74F8eCa321a105296` | Galileo. The indexer resolves this internally |
| EIP-712 `verifyingContract` | `0x0000000000000000000000000000000000000000` | **Frozen at the zero address.** Change it and every signature changes |
| VouchRegistry (stars) | Not deployed | Set `VOUCH_REGISTRY` and it is swapped in |

## 3. Chain and endpoints

| What | Value |
|---|---|
| Chain | 0G **Galileo**, chain id **16602** (16601 is a different thing; see `spec/permit-signature.md`)|
| RPC | `https://evmrpc-testnet.0g.ai` |
| Explorer | `https://chainscan-galileo.0g.ai` |
| Storage indexer | `https://indexer-storage-testnet-turbo.0g.ai` |
| Inference (OpenAI compatible) | `https://router-api.0g.ai/v1` |
| Model | `0gm-1.0-35b-a3b` (TeeML, Intel TDX)|
| faucet | `https://faucet.0g.ai` (has Turnstile, 0.1 0G/day, **a person has to click**)|
| 0G console | `https://pc.0g.ai/dashboard/api-keys`, usage at `/dashboard/activity` |
| World (OIDC) | `https://auth.world.org`, JWKS at `/.well-known/jwks.json` |

## 4. Keys and accounts (**values are not written here**)

| What | Location | State |
|---|---|---|
| `ZG_API_KEY` | `broker/.env.local` | **Issued and confirmed working**. `tomoshibi-broker` / trust mode **Private (TEE)** / created 2026-11-06 |
| 0G balance | The pc.0g.ai account (email login, Privy) | $6.00 (checked 2026-11-06). **A separate account from gas** |
| `ZG_PRIVATE_KEY` | `broker/.env.local` | Disposable. The address in §1 above |
| `WORLD_CLIENT_ID` / `WORLD_CLIENT_SECRET` | `broker/.env.local` | **Not obtained yet** (register in the auth.world.org portal)|

**There is no way to display the API key again.** If it is lost, create a new one at pc.0g.ai.
Revoke it after the hackathon (it has gone through chat in plaintext).

## 5. Repositories

| What | Location |
|---|---|
| Public (what gets submitted) | `github.com/kou-uni/ethglobal-mumbai` |
| minta's Ledger app | Same repository, `origin/minta/ledger-app` |
| Private (ideation, the Japanese angle) | `github.com/kou-uni/Mumbai-ideation-2026` |

## 6. Frozen signature values (`spec/permit-signature.md` §6)

| What | Value |
|---|---|
| domain | `name: Tomoshibi` / `version: 1` / `chainId: 16602` / `verifyingContract: 0x0…0` |
| Derivation path | `m/44'/60'/0'/0/0` |
| `domainSeparator` | `0x86aa93392bc42c203b5e25afa33e6d85df9f1a884ee0e74c4f1bd0d781d8a470` |
| `digest` (the 32 bytes the device signs) | `0x8d63692146d1c78f08bfbe1ab6fa254130767260d83921f2d9ed8680a7889486` |

**This is the boundary between the device and the Broker.** If either side changes a value, `ecrecover` returns someone else.

## 7. Every environment variable (extracted from `broker/src/`)

`ZG_API_KEY` `ZG_PRIVATE_KEY` `ZG_ENDPOINT` `ZG_MODEL` `ZG_RPC` `ZG_INDEXER` `ZG_EXPLORER`
`ZG_TIMEOUT_MS`(30000) `ZG_THINKING`(1 returns the reasoning) `ZG_ESCALATE`(default `decisive`) `ZG_BODY_LIMIT`(4000)
`ZG_OFFLINE` `WORLD_CLIENT_ID` `WORLD_CLIENT_SECRET` `WORLD_ISSUER` `WORLD_JWKS` `WORLD_OFFLINE`
`VOUCH_REGISTRY` `LEDGER_PATH` `SECRETS` `EXECUTE` `PORT`

**Before filming, eyeball `/health` to confirm `ZG_OFFLINE` and `WORLD_OFFLINE` are not set.**
