// 範囲チェック — 「宣言した範囲を外れた要求」だけを、証拠付きで止める。
// 罰する／知らせるの線引き（decisions 2026-11-06）：
//   罰する   = ここで DENIED になるもの。要求そのものがスキルの署名付きで残る
//   知らせる = 返ってきた中身の判断（ここではやらない。TeeML の仕事）
import { signer, normalize } from './permit.js'

export const REASONS = {
  BAD_SIGNATURE: '署名が holder のものではない',
  EXPIRED: '期限が切れている',
  WRONG_KEY: '許可されていない鍵',
  OUT_OF_TARGET: '許可されていない宛先',
  OUT_OF_SCOPE: '許可されていない操作',
  EXHAUSTED: '回数を使い切っている',
  REPLAY: '同じ nonce で別の許可が出ている',
}

// 署名の不一致は「範囲を外れた要求」ではない（誰の要求かが確定しないため、刻む相手がいない）
const NOT_A_VIOLATION = new Set(['BAD_SIGNATURE'])

const deny = (reason, detail) => ({
  ok: false,
  decision: 'DENIED',
  reason,
  detail,
  message: REASONS[reason],
  violation: !NOT_A_VIOLATION.has(reason),
})

/** 宛先は完全一致。前方一致にしない（evil.com/api.stripe.com を通さないため）。 */
const targetOf = (url) => {
  try { return new URL(url).host } catch { return null }
}

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
 * 1件の使用要求を判定する。**副作用なし。** 数える／刻むのは呼び出し側。
 * @returns {{ok:boolean, decision:'ALLOWED'|'DENIED', remaining?:number}}
 */
export async function check(permit, signature, request, state, now = Date.now()) {
  let p
  try { p = normalize(permit) } catch (e) { return deny('BAD_SIGNATURE', e.message) }

  // 1. 押したのは誰か。送られてきた digest は使わず、作り直して確かめる
  let who
  try { who = await signer(p, signature) } catch (e) { return deny('BAD_SIGNATURE', e.message) }
  if (who.toLowerCase() !== String(p.holder).toLowerCase()) {
    return deny('BAD_SIGNATURE', `recovered ${who}`)
  }

  // 2. 同じ nonce で別の許可が出ていないか
  const seen = state.nonceDigest(p.holder, p.nonce)
  if (seen && seen.skill !== p.skill) return deny('REPLAY', `nonce ${p.nonce} は ${seen.skill} が使用中`)

  // 3. 期限
  if (Number(p.expiry) * 1000 <= now) return deny('EXPIRED', `expiry ${p.expiry}`)

  // 4. 鍵
  if (request.keyRef !== p.key) return deny('WRONG_KEY', `${request.keyRef} ≠ ${p.key}`)

  // 5. 宛先
  const host = targetOf(request.url)
  if (!host) return deny('OUT_OF_TARGET', `URL が読めない: ${request.url}`)
  if (host !== p.target) return deny('OUT_OF_TARGET', `${host} ≠ ${p.target}`)

  // 6. 操作
  if (!inScope(p.scope, request.method, request.url)) {
    return deny('OUT_OF_SCOPE', `${request.method} ${request.url} ∉ ${p.scope}`)
  }

  // 7. 回数（逓減する子トークン。使うほど細る）
  const used = state.used(p.holder, p.nonce)
  if (used >= Number(p.maxCalls)) return deny('EXHAUSTED', `${used}/${p.maxCalls}`)

  return { ok: true, decision: 'ALLOWED', remaining: Number(p.maxCalls) - used - 1, signer: who }
}
