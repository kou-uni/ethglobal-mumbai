// World ID Agent Pass — 「誰であるか」を1回だけ確かめる。
//
// 中身は標準の OIDC（issuer: https://auth.world.org）。device_code グラントがあるので、
// **画面を持たない Broker から始めて、人は自分の端末で終える。**
// 鍵を使うたびには呼ばない。それは Ledger の仕事（spec/world-agent-pass.md §2）。
//
// 守られる動作は **星を出すこと**。自分の評判を賭けて「これを使っている」と言う行為。
import { createRemoteJWKSet, jwtVerify } from 'jose'

export const ISSUER = process.env.WORLD_ISSUER ?? 'https://auth.world.org'
const DEVICE = `${ISSUER}/api/v1/device_authorization`
const TOKEN = `${ISSUER}/api/v1/token`
const JWKS_URL = process.env.WORLD_JWKS ?? `${ISSUER}/.well-known/jwks.json`
const DEVICE_GRANT = 'urn:ietf:params:oauth:grant-type:device_code'

/** 断られた理由。**「断る」と「押さない」は別もの**（前者は人、後者は人が居ない） */
export const WORLD_DENIED = {
  access_denied: 'human_denied',     // 本人が World アプリで断った
  expired_token: 'proof_expired',    // 期限切れ
}

const form = (o) => new URLSearchParams(o).toString()

const post = async (url, body, fetchImpl) => {
  const res = await fetchImpl(url, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
    body: form(body),
  })
  const text = await res.text()
  let json = null
  try { json = JSON.parse(text) } catch {}
  return { status: res.status, json, text }
}

/** 1. 本人の端末に出す合図（user_code と URL）を取る。QR は画面 A が出す。 */
export async function deviceStart(opts = {}) {
  const clientId = opts.clientId ?? process.env.WORLD_CLIENT_ID
  if (!clientId) return { ok: false, error: 'WORLD_CLIENT_ID がない（auth.world.org/portal で登録する）' }
  const r = await post(DEVICE, { client_id: clientId, scope: 'openid' }, opts.fetch ?? fetch)
  if (r.status >= 400 || !r.json?.device_code) {
    return { ok: false, error: `World ${r.status}: ${r.json?.error_description ?? r.json?.error ?? r.text.slice(0, 160)}` }
  }
  return {
    ok: true,
    deviceCode: r.json.device_code,
    userCode: r.json.user_code,
    verificationUri: r.json.verification_uri_complete ?? r.json.verification_uri,
    expiresIn: r.json.expires_in ?? 600,
    interval: r.json.interval ?? 5,
  }
}

/**
 * 2. 本人が終えるのを待つ。**断られた・期限切れ・待っている、を混ぜない。**
 * @returns {Promise<{ok:boolean, idToken?:string, denied?:string, pending?:boolean, error?:string}>}
 */
export async function pollOnce(deviceCode, opts = {}) {
  const clientId = opts.clientId ?? process.env.WORLD_CLIENT_ID
  const secret = opts.clientSecret ?? process.env.WORLD_CLIENT_SECRET
  const body = { grant_type: DEVICE_GRANT, device_code: deviceCode, client_id: clientId }
  if (secret) body.client_secret = secret  // client secret は Broker の中。ブラウザには出さない
  const r = await post(TOKEN, body, opts.fetch ?? fetch)
  const err = r.json?.error
  if (r.json?.id_token) return { ok: true, idToken: r.json.id_token }
  if (err === 'authorization_pending') return { ok: false, pending: true }
  if (err === 'slow_down') return { ok: false, pending: true, slowDown: true }
  if (WORLD_DENIED[err]) return { ok: false, denied: WORLD_DENIED[err], error: err }
  return { ok: false, error: `World ${r.status}: ${r.json?.error_description ?? err ?? r.text.slice(0, 160)}` }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** 間隔を守って待つ。待ち切れなければ expired として返す（勝手に通さない）。 */
export async function waitForHuman(deviceCode, opts = {}) {
  let interval = (opts.interval ?? 5) * 1000
  const until = Date.now() + (opts.expiresIn ?? 600) * 1000
  for (;;) {
    const r = await pollOnce(deviceCode, opts)
    if (r.ok || r.denied || (!r.pending && r.error)) return r
    if (r.slowDown) interval += 5000
    if (Date.now() + interval > until) return { ok: false, denied: WORLD_DENIED.expired_token, error: 'expired_token' }
    await sleep(opts.sleep ?? interval)
  }
}

let jwks
/** 3. 署名を確かめる。**信じるのは JWKS だけ。** id_token を読んで済ませない。 */
export async function verifyIdToken(idToken, opts = {}) {
  const clientId = opts.clientId ?? process.env.WORLD_CLIENT_ID
  const keys = opts.jwks ?? (jwks ??= createRemoteJWKSet(new URL(JWKS_URL)))
  try {
    const { payload } = await jwtVerify(idToken, keys, {
      issuer: opts.issuer ?? ISSUER,
      audience: clientId,
    })
    if (!payload.sub) return { ok: false, error: 'sub がない' }
    return { ok: true, claims: payload, nullifier: String(payload.sub) }
  } catch (e) {
    return { ok: false, error: `id_token を信用できない: ${e.message}` }
  }
}
