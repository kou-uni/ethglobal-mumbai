// Permit — 署名の契約。spec/permit-signature.md をコードにしたもの。
// ここが spec と食い違うと、アプリは動くのに Broker が全部 DENIED にする。
import { keccak256, hashTypedData, recoverAddress, toHex } from 'viem'

export const DOMAIN = {
  name: 'Hoshi',
  version: '1',
  chainId: 16602, // 0G Galileo Testnet【確・実測】
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

/** 欠けている項目を落とす。曖昧なまま先に進めない。 */
export function normalize(permit) {
  const out = {}
  for (const f of FIELDS) {
    if (permit?.[f] === undefined || permit?.[f] === null) throw new Error(`permit.${f} がない`)
    out[f] = f === 'maxCalls' || f === 'expiry' || f === 'nonce' ? BigInt(permit[f]) : permit[f]
  }
  return out
}

/** 端末が署名した 32 バイト。送られてきた digest は使わず、ここで作り直す。 */
export function digest(permit) {
  return hashTypedData({ domain: DOMAIN, types: TYPES, primaryType: 'Permit', message: normalize(permit) })
}

/**
 * 端末の画面に出る4行。**ハッシュと同じ値から作る。**
 * 画面とハッシュが別経路で作られた瞬間、「範囲が読める」という主張が崩れる。
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

/** 署名した鍵のアドレスを取り出す。65 バイト（r‖s‖v）。 */
export async function signer(permit, signature) {
  return recoverAddress({ hash: digest(permit), signature })
}

/** 1回の使用をまとめる糸。系譜の5つの記録を、この1本で数珠つなぎにする。 */
export function requestHash(permit, request) {
  const p = normalize(permit)
  const canonical = JSON.stringify([
    FIELDS.map((f) => String(p[f])),
    [request.method, request.url, request.keyRef],
  ])
  return keccak256(toHex(canonical))
}
