// Scope check — stop only requests that fall outside the declared scope, and stop them with evidence.
// Where the line between punishing and merely reporting sits (decisions 2026-11-06):
//   punish = a request outside the declared scope, **and carrying the skill's signature**
//   report = a judgement about the body that came back (not done here; that is TeeML's job)
import { signer, normalize } from './permit.js'

export const REASONS = {
  BAD_SIGNATURE: 'the signature is not the holder\'s',
  EXPIRED: 'the permit has expired',
  WRONG_KEY: 'key not permitted',
  OUT_OF_TARGET: 'target not permitted',
  INSECURE_TRANSPORT: 'not https',
  OUT_OF_SCOPE: 'operation not permitted',
  EXHAUSTED: 'the call budget is used up',
  REPLAY: 'a different skill is requesting under the same nonce',
}

/**
 * Only requests outside the declared scope get recorded against anyone (#14-1).
 * - BAD_SIGNATURE does not establish whose request it was, so there is nobody to record it against
 * - EXPIRED / EXHAUSTED are **the permit narrowing exactly as designed**. A skill that simply ran out is not an offender
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

/** scope is "METHOD /path/prefix". The path is a prefix match up to a separator. */
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
 * Judge one use request. **No side effects.** Counting and recording are the caller's job (#14-3).
 * @returns {{ok:boolean, decision:string, holderValid:boolean}}
 */
export async function check(permit, signature, request, state, now = Date.now()) {
  let p
  try { p = normalize(permit) } catch (e) { return { ...deny('BAD_SIGNATURE', e.message), holderValid: false } }

  // 1. Who pressed. We do not use the digest that was sent; we rebuild it and check
  let who
  try { who = await signer(p, signature) } catch (e) {
    return { ...deny('BAD_SIGNATURE', e.message), holderValid: false }
  }
  if (who.toLowerCase() !== String(p.holder).toLowerCase()) {
    return { ...deny('BAD_SIGNATURE', `recovered ${who}`), holderValid: false }
  }
  // From here on the holder's signature has checked out, so the nonce may be bound (#14-2)
  const valid = { holderValid: true, signerAddress: who }

  // 2. Is another skill already using this nonce
  const seen = state.nonceOwner(p.holder, p.nonce)
  if (seen && seen.skill !== p.skill) return { ...deny('REPLAY', `nonce ${p.nonce} is in use by ${seen.skill}`), ...valid }

  // 3. Expiry
  if (Number(p.expiry) * 1000 <= now) return { ...deny('EXPIRED', `expiry ${p.expiry}`), ...valid }

  // 4. Key
  if (request.keyRef !== p.key) return { ...deny('WRONG_KEY', `${request.keyRef} ≠ ${p.key}`), ...valid }

  // 5. Target. Nothing but https gets through (#14-5: close off any route that carries the key in plaintext)
  let u
  try { u = new URL(request.url) } catch { return { ...deny('OUT_OF_TARGET', `cannot parse URL: ${request.url}`), ...valid } }
  if (u.protocol !== 'https:') return { ...deny('INSECURE_TRANSPORT', u.protocol), ...valid }
  if (u.host !== p.target) return { ...deny('OUT_OF_TARGET', `${u.host} ≠ ${p.target}`), ...valid }

  // 6. Operation
  if (!inScope(p.scope, request.method, request.url)) {
    return { ...deny('OUT_OF_SCOPE', `${request.method} ${request.url} ∉ ${p.scope}`), ...valid }
  }

  // 7. The call budget is reserved while counting, elsewhere. Not checked here (#14-3)
  return { ok: true, decision: 'ALLOWED', ...valid }
}
