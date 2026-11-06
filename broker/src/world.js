// World ID Agent Pass — confirm who someone is, once.
//
// Underneath it is plain OIDC (issuer: https://auth.world.org). It has the device_code grant, so
// **the Broker, which has no screen, starts it and the person finishes it on their own device.**
// It is not called every time the key is used; that is the Ledger's job (spec/world-agent-pass.md §2).
//
// The protected action is **giving a star**: staking your own reputation to say "I use this".
import { createRemoteJWKSet, jwtVerify } from 'jose'

export const ISSUER = process.env.WORLD_ISSUER ?? 'https://auth.world.org'
const DEVICE = `${ISSUER}/api/v1/device_authorization`
const TOKEN = `${ISSUER}/api/v1/token`
const JWKS_URL = process.env.WORLD_JWKS ?? `${ISSUER}/.well-known/jwks.json`
const DEVICE_GRANT = 'urn:ietf:params:oauth:grant-type:device_code'

/** Why it was refused. **"Refused" and "not pressed" are different things** (the first is a person, the second is nobody being there) */
export const WORLD_DENIED = {
  access_denied: 'human_denied',     // the owner refused in the World app
  expired_token: 'proof_expired',    // expired
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

/** 1. Get the cue to show on the owner's device (user_code and URL). Screen A renders the QR. */
export async function deviceStart(opts = {}) {
  const clientId = opts.clientId ?? process.env.WORLD_CLIENT_ID
  if (!clientId) return { ok: false, error: 'no WORLD_CLIENT_ID (register one at auth.world.org/portal)' }
  // A client registered with a secret (client_secret_post) must authenticate here too, or World answers
  // 400 "Client authentication failed" (measured 2026-11-06).
  const secret = opts.clientSecret ?? process.env.WORLD_CLIENT_SECRET
  const body = { client_id: clientId, scope: 'openid' }
  if (secret) body.client_secret = secret
  const r = await post(DEVICE, body, opts.fetch ?? fetch)
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
 * 2. Wait for the owner to finish. **Do not mix up refused, expired and still waiting.**
 * @returns {Promise<{ok:boolean, idToken?:string, denied?:string, pending?:boolean, error?:string}>}
 */
export async function pollOnce(deviceCode, opts = {}) {
  const clientId = opts.clientId ?? process.env.WORLD_CLIENT_ID
  const secret = opts.clientSecret ?? process.env.WORLD_CLIENT_SECRET
  const body = { grant_type: DEVICE_GRANT, device_code: deviceCode, client_id: clientId }
  if (secret) body.client_secret = secret  // the client secret stays inside the Broker; it never reaches the browser
  const r = await post(TOKEN, body, opts.fetch ?? fetch)
  const err = r.json?.error
  if (r.json?.id_token) return { ok: true, idToken: r.json.id_token }
  if (err === 'authorization_pending') return { ok: false, pending: true }
  if (err === 'slow_down') return { ok: false, pending: true, slowDown: true }
  if (WORLD_DENIED[err]) return { ok: false, denied: WORLD_DENIED[err], error: err }
  return { ok: false, error: `World ${r.status}: ${r.json?.error_description ?? err ?? r.text.slice(0, 160)}` }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** Wait, honouring the interval. If the wait runs out, return expired (never let it through on our own). */
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
/** 3. Verify the signature. **JWKS is the only thing we trust.** Reading the id_token is not enough. */
export async function verifyIdToken(idToken, opts = {}) {
  const clientId = opts.clientId ?? process.env.WORLD_CLIENT_ID
  const keys = opts.jwks ?? (jwks ??= createRemoteJWKSet(new URL(JWKS_URL)))
  try {
    const { payload } = await jwtVerify(idToken, keys, {
      issuer: opts.issuer ?? ISSUER,
      audience: clientId,
    })
    if (!payload.sub) return { ok: false, error: 'no sub' }
    return { ok: true, claims: payload, nullifier: String(payload.sub) }
  } catch (e) {
    return { ok: false, error: `the id_token cannot be trusted: ${e.message}` }
  }
}
