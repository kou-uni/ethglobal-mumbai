// 範囲チェック — 「宣言した範囲を外れた要求」だけを、証拠付きで止める。
// 罰する／知らせるの線引き（decisions 2026-11-06）：
//   罰する   = 宣言した範囲を外れた要求。**かつスキルの署名が付いているもの**
//   知らせる = 返ってきた中身の判断（ここではやらない。TeeML の仕事）
import { signer, normalize } from './permit.js'

export const REASONS = {
  BAD_SIGNATURE: '署名が holder のものではない',
  EXPIRED: '期限が切れている',
  WRONG_KEY: '許可されていない鍵',
  OUT_OF_TARGET: '許可されていない宛先',
  INSECURE_TRANSPORT: 'https ではない',
  OUT_OF_SCOPE: '許可されていない操作',
  EXHAUSTED: '回数を使い切っている',
  REPLAY: '同じ nonce で別のスキルが要求している',
}

/**
 * 刻む対象は「宣言した範囲を外れた要求」だけ（#14-1）。
 * - BAD_SIGNATURE は誰の要求か確定しないので、刻む相手がいない
 * - EXPIRED / EXHAUSTED は**設計どおりに細った状態**。普通に使い切ったスキルを違反者にしない
 */
const OUT_OF_RANGE = new Set(['WRONG_KEY', 'OUT_OF_TARGET', 'INSECURE_TRANSPORT', 'OUT_OF_SCOPE', 'REPLAY'])

const deny = (reason, detail) => ({
  ok: false,
  decision: 'DENIED',
  reason,
  detail,
  message: REASONS[reason],
  outOfRange: OUT_OF_RANGE.has(reason),
})

/** scope は "METHOD /path/prefix"。パスは区切りまで含めた前方一致。 */
function inScope(scope, method, url) {
  const [m, prefix] = String(scope).split(/\s+/, 2)
  if (!prefix) return false
  if (m !== '*' && m.toUpperCase() !== method.toUpperCase()) return false
  let path
  try { path = new URL(url).pathname } catch { return false }
  if (path === prefix) return true
  return path.startsWith(prefix.endsWith('/') ? prefix : prefix + '/')
}

/**
 * 1件の使用要求を判定する。**副作用なし。** 数える／刻むのは呼び出し側（#14-3）。
 * @returns {{ok:boolean, decision:string, holderValid:boolean}}
 */
export async function check(permit, signature, request, state, now = Date.now()) {
  let p
  try { p = normalize(permit) } catch (e) { return { ...deny('BAD_SIGNATURE', e.message), holderValid: false } }

  // 1. 押したのは誰か。送られてきた digest は使わず、作り直して確かめる
  let who
  try { who = await signer(p, signature) } catch (e) {
    return { ...deny('BAD_SIGNATURE', e.message), holderValid: false }
  }
  if (who.toLowerCase() !== String(p.holder).toLowerCase()) {
    return { ...deny('BAD_SIGNATURE', `recovered ${who}`), holderValid: false }
  }
  // ここから先は holder の署名が通っている。nonce を結び付けてよい（#14-2）
  const valid = { holderValid: true, signerAddress: who }

  // 2. 同じ nonce を別のスキルが使っていないか
  const seen = state.nonceOwner(p.holder, p.nonce)
  if (seen && seen.skill !== p.skill) return { ...deny('REPLAY', `nonce ${p.nonce} は ${seen.skill} が使用中`), ...valid }

  // 3. 期限
  if (Number(p.expiry) * 1000 <= now) return { ...deny('EXPIRED', `expiry ${p.expiry}`), ...valid }

  // 4. 鍵
  if (request.keyRef !== p.key) return { ...deny('WRONG_KEY', `${request.keyRef} ≠ ${p.key}`), ...valid }

  // 5. 宛先。https 以外は通さない（#14-5。平文で鍵が流れる経路を塞ぐ）
  let u
  try { u = new URL(request.url) } catch { return { ...deny('OUT_OF_TARGET', `URL が読めない: ${request.url}`), ...valid } }
  if (u.protocol !== 'https:') return { ...deny('INSECURE_TRANSPORT', u.protocol), ...valid }
  if (u.host !== p.target) return { ...deny('OUT_OF_TARGET', `${u.host} ≠ ${p.target}`), ...valid }

  // 6. 操作
  if (!inScope(p.scope, request.method, request.url)) {
    return { ...deny('OUT_OF_SCOPE', `${request.method} ${request.url} ∉ ${p.scope}`), ...valid }
  }

  // 7. 回数は数えながら押さえる。ここでは見ない（#14-3）
  return { ok: true, decision: 'ALLOWED', ...valid }
}
