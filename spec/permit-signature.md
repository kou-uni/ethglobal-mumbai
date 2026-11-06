# The signature contract (Permit) — the same shape in the custom app and the standard app

**In one line: the four lines shown on the screen and the 32 bytes that get signed are built from the same values.**

In #11 we decided to target a custom Ledger app. The app side (minta, on the device) and the Broker side (kou)
are written separately, so **if the two disagree, the app works but the Broker DENIES everything**.
If that surfaces at hour 30 there is no time left to fix it. So we pin it down first.

**Even if we fall back to option 3 (the standard Ethereum app), this contract does not change.** Only one word changes: `source`.

---

## 1. The key (derivation path)

- **`m/44'/60'/0'/0/0`** — the same as the standard Ethereum app. The curve is secp256k1
- **Reason: if the custom app fails and we fall back to option 3, the same address still signs.** The owner of the star does not change
- The custom app needs `--path "44'/60'"` in `APP_LOAD_PARAMS`.
  Without it `os_perso_derive_node_bip32` fails — **[unverified]. Check on the device at gate 1**

## 2. What is signed (EIP-712)

```
digest = keccak256( 0x19 ‖ 0x01 ‖ domainSeparator ‖ hashStruct(Permit) )
```

```solidity
EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)
  name              = "Tomoshibi"
  version           = "1"
  chainId           = 16602          // 0G Galileo Testnet [verified]
  verifyingContract = <the VouchRegistry address>

Permit(address holder,bytes32 skill,string version,bytes32 key,
       string target,string scope,uint32 maxCalls,uint64 expiry,uint256 nonce)
```

## 3. The four lines on screen and their relation to the hash (this is the core of the claim)

| Line | Value |
|---|---|
| `KEY` | the label of `key` |
| `TO` | `target` |
| `SCOPE` | `scope` (includes `maxCalls`) |
| `UNTIL` | `expiry` |

**The hash is computed inside the device, from the very values those four lines were built from.**
It uses `cx_keccak_init` / `cx_hash`.

**We do not send 32 bytes computed on the PC and have the device sign them (blind signing).**
If we did, the device would have no guarantee that the four lines on screen and the hash agree.
**The claim this project makes — that the scope is readable — stops holding right there.**

→ **Add this to the pass criteria for gate 1.**

**Fallback if that fails:** the PC sends the digest and the device shows the four lines next to the digest.
In that case **say one line during the presentation**: "the device does not verify the four lines". **Do not use it silently.**

## 4. What comes back

65 bytes (`r` 32 ‖ `s` 32 ‖ `v` 1).
`v` may come back as a recovery id (0 or 1). **On the Broker side, normalize `v < 27` by adding `+27`.**

## 5. The JSON handed to the Broker (the same for the standard app and the custom app)

```json
{
  "permit": {
    "holder": "0x…", "skill": "0x…", "version": "1.4.2", "key": "0x…",
    "target": "api.example.com", "scope": "read", "maxCalls": 20,
    "expiry": 1762500000, "nonce": 7
  },
  "domain": { "name": "Tomoshibi", "version": "1", "chainId": 16602, "verifyingContract": "0x…" },
  "signature": "0x…",
  "signer": "0x…",
  "source": "ledger-app"
}
```

- `signer` is **not used for verification.** It is for diagnosis when the two sides disagree (the address we expected)
- `source` is one of two values: `ledger-app` / `ledger-eth-app`. It goes into the trail as-is

## 6. What the Broker verifies (in this order)

1. **Rebuild the digest from the `permit` / `domain` in the JSON.** Do not use the digest that was sent
2. `ecrecover(digest, v, r, s)` → `signer`
3. Is `signer == permit.holder`
4. Is `expiry > now` / is `nonce` unused / does `scope` match the actual request
5. If any of these is missing, `DENIED`. Return the reason in one word: `sig` / `expired` / `nonce` / `scope`

## 7. Pass criteria (added to gate 1)

**Take a signature returned by a long press on the device, feed it to the Broker's `ecrecover`,
and get the same address as the standard Ethereum app.**

The screen appeared and the long press returned is not enough. **Gate 1 is not passed until the Broker produces the same address.**

## chainId [verified, measured 2026-11-06]

| Name | chainId | RPC |
|---|---|---|
| **0G Galileo Testnet** | **16602** | `https://evmrpc-testnet.0g.ai` |
| 0G Mainnet | 16661 | `https://evmrpc.0g.ai` |

**Evidence:** we sent `eth_chainId` to `https://evmrpc-testnet.0g.ai` and got `0x40da` = **16602**.
The value came from the chain itself, so it is primary.

**Caution:** listing sites still carry an old entry, **16601** (`0G-Galileo-Testnet`, no RPC).
**Using 16601 changes the EIP-712 domainSeparator, and `ecrecover` returns a different address.**
Use **16602**.

## Unverified

- Whether the custom app can derive `44'/60'` (`APP_LOAD_PARAMS`)
- Whether the template includes on-device keccak256

---

## 6. Test vector (**agree on this up front; do not fix it at hour 30**)

**`verifyingContract` stays frozen at `0x0000000000000000000000000000000000000000`.**
Even once the registry ships, we do not change the domain this time. **Changing it changes every signature,
and both sides would have to be fixed at the same moment.**
(On the Ledger side, `VERIFYING_CONTRACT` in `ledger-app/src/eip712.rs` holds the same value. The comments bind the two together.)

```json
{
  "holder":   "0x19E7E376E7C213B7E7e7e46cc70A5dD086DAff2A",
  "skill":    "0x166b4a98f5f1c72f1e05921caf802eb07395b2afee302ceaef74b29657e641c5",
  "version":  "1.0.0",
  "key":      "0x6d5f7d408f4fb5f31403c52734dad9172da58198ab1599f5b0b9754e79d37148",
  "target":   "api.stripe.com",
  "scope":    "POST /v1/charges",
  "maxCalls": 3,
  "expiry":   1794009600,
  "nonce":    42
}
```

| | Value |
|---|---|
| `domainSeparator` | `0x86aa93392bc42c203b5e25afa33e6d85df9f1a884ee0e74c4f1bd0d781d8a470` |
| **`digest` (the 32 bytes the device signs)** | **`0x8d63692146d1c78f08bfbe1ab6fa254130767260d83921f2d9ed8680a7889486`** |
| The four lines on screen | `KEY   0x6d5f7d40…` / `TO    api.stripe.com` / `SCOPE POST /v1/charges x3` / `UNTIL 2026-11-07 00:00Z` |
| Signature under the test key `0x11…11` (32 bytes) | `0x9814354237a00bfe1d1b182f4a6d5974eb52c38b3d186f32bea0ca0a26341b981fd5acc30eac9f1eab839e75554a12d4ef726a4f120a6774b4dc92461ac812491c` |

- `skill` is `keccak256("skill:mail-digest")`, `key` is `keccak256("STRIPE_SECRET")`.
  **`key` is the hash of a label, not the key itself**
- **The Broker side pins these values in a test** (the test-vector block in `broker/test/broker.test.js`).
  **Confirm once, on the device, that the Ledger side produces the same digest.** Once these match, the rest is wiring
- `UNTIL` is UTC. The device and the Broker must produce the same string
