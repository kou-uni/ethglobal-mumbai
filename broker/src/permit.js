// Permit — the signature contract. spec/permit-signature.md turned into code.
// If this disagrees with the spec, the app works but the Broker DENIES everything.
import { keccak256, hashTypedData, recoverAddress, toHex } from 'viem'

export const DOMAIN = {
  name: 'Tomoshibi',
  version: '1',
  chainId: 16602, // 0G Galileo Testnet [verified, measured]
  verifyingContract: process.env.VOUCH_REGISTRY ?? '0x0000000000000000000000000000000000000000',
}

export const TYPES = {
  Permit: [
    { name: 'holder', type: 'address' },
    { name: 'skill', type: 'bytes32' },
    { name: 'version', type: 'string' },
    { name: 'key', type: 'bytes32' },
    { name: 'target', type: 'string' },
    { name: 'scope', type: 'string' },
    { name: 'maxCalls', type: 'uint32' },
    { name: 'expiry', type: 'uint64' },
    { name: 'nonce', type: 'uint256' },
  ],
}

const FIELDS = TYPES.Permit.map((f) => f.name)

/** Reject a permit with a missing field. Nothing ambiguous goes any further. */
export function normalize(permit) {
  const out = {}
  for (const f of FIELDS) {
    if (permit?.[f] === undefined || permit?.[f] === null) throw new Error(`permit.${f} is missing`)
    out[f] = f === 'maxCalls' || f === 'expiry' || f === 'nonce' ? BigInt(permit[f]) : permit[f]
  }
  return out
}

/** The 32 bytes the device signed. We do not use the digest that was sent; we rebuild it here. */
export function digest(permit) {
  return hashTypedData({ domain: DOMAIN, types: TYPES, primaryType: 'Permit', message: normalize(permit) })
}

/**
 * The four lines shown on the device screen. **Built from the same values as the hash.**
 * The moment the screen and the hash come from different paths, the claim that the scope is readable collapses.
 */
export function lines(permit) {
  const p = normalize(permit)
  return [
    `KEY   ${p.key.slice(0, 10)}…`,
    `TO    ${p.target}`,
    `SCOPE ${p.scope} x${p.maxCalls}`,
    `UNTIL ${new Date(Number(p.expiry) * 1000).toISOString().replace('T', ' ').slice(0, 16)}Z`,
  ]
}

/** Recover the address of the key that signed. 65 bytes (r‖s‖v). */
export async function signer(permit, signature) {
  return recoverAddress({ hash: digest(permit), signature })
}

/** The thread that ties one use together. It strings the five trail records onto a single line. */
export function requestHash(permit, request) {
  const p = normalize(permit)
  const canonical = JSON.stringify([
    FIELDS.map((f) => String(p[f])),
    [request.method, request.url, request.keyRef],
  ])
  return keccak256(toHex(canonical))
}
