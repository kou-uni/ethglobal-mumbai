// A light (star) can be lit only by the owner of the key (decision Q1-b = B).
// Before World is asked, check that the person saying "I use this" **signed a Permit for this exact
// version, and that the Permit has really been used at least once**.
// World checks "is this a person". This checks "is this the owner, and do they really use it".
//
// What this cannot check (do not let it look better than it is):
// - Whether the signing key lives in a Ledger. The Broker sees a signature, not a device attestation.
// - Whether the World person and the key owner are the same human. All we can say is that both
//   arrived in the same request.
import { signer, normalize } from './permit.js'

export const OWNER_REASONS = {
  NOT_OWNER: 'no Permit for this version signed by the key owner was sent (no star is issued)',
  NOT_USED: 'that Permit has never been used (no star is issued)',
}

/** Owner, and in use? `{ ok }` or `{ ok:false, reason, detail }`. Called **before** World. */
export async function ownerOf({ permit, signature, skill, version }, store, now = Date.now()) {
  const no = (detail) => ({ ok: false, reason: 'NOT_OWNER', detail })
  if (!permit || !signature) return no('no permit or no signature')
  let p, who
  try { p = normalize(permit) } catch { return no('malformed permit') }
  try { who = await signer(p, signature) } catch { return no('unreadable signature') }
  if (String(who).toLowerCase() !== String(p.holder).toLowerCase()) return no('not signed by the holder')
  if (p.skill !== skill || p.version !== version) return no('permit is for another skill or version')
  if (Number(p.expiry) * 1000 <= now) return no('permit has expired')
  if (store.used(p.holder, String(p.nonce)) < 1) return { ok: false, reason: 'NOT_USED', detail: 'no ALLOWED record for this permit' }
  return { ok: true }
}
