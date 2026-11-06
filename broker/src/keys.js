// Parked keys — the right-hand column of the switchboard's table: label → the real key.
//
// A key is parked from the "add a row" screen on the same computer. It lives **in memory only**: it is never
// written to the trail, to a file or to a log, and no route returns it. Restart the Broker and it is gone.
//
// Only **Stripe test-mode keys** (`sk_test_…`, `rk_test_…`) are accepted here. A live key is refused before it is
// stored, so nothing in this demo can move real money. With a parked key the call to Stripe is real (test mode);
// without one the Broker keeps using the stand-in executor.
import { keccak256, toHex } from 'viem'
import { APIS } from './apis.js'
import { seedStripe, stripeCall } from './stripe-test.js'

const parked = new Map()   // permit.key (bytes32) → { label, api, target, secret, mode, at, seed }
const TEST_KEY = /^(sk|rk)_test_[A-Za-z0-9]{16,}$/

/** The id a permit carries for a label (the agent can name the label; it cannot spell the secret). */
export const keyRef = (label) => keccak256(toHex(String(label)))

/**
 * Park one key under a label. Checks it against the list, refuses anything that is not a test-mode key,
 * asks Stripe whether the key is good (no side effects), and — only if asked — makes a little test data.
 */
export async function parkKey({ label, key, seed } = {}, deps = {}) {
  const api = APIS.find((a) => a.ready && a.label === label)
  if (!api) return { ok: false, error: 'This label is not on the supported list.' }
  const secret = typeof key === 'string' ? key.trim() : ''
  if (/^(sk|rk)_live_/.test(secret)) return { ok: false, error: 'That is a live key. Only a Stripe test-mode key (sk_test_…) is accepted here.' }
  if (!TEST_KEY.test(secret)) return { ok: false, error: 'Only a Stripe test-mode key (sk_test_…) is accepted here.' }
  const fetchImpl = deps.fetch ?? fetch
  try { await stripeCall(fetchImpl, secret, 'GET', '/v1/balance') } catch (e) { return { ok: false, error: `Stripe did not accept this key (${String(e.message ?? e)}).` } }
  const row = { label, api: api.id, target: api.target, secret, mode: 'test', at: new Date().toISOString(), seed: null }
  parked.set(keyRef(label), row)
  if (seed) row.seed = await seedStripe(secret, fetchImpl)
  return { ok: true, label, target: api.target, mode: row.mode, seed: row.seed }
}

/** Make the test data again (after a refund there is nothing left to refund). Needs a parked key. */
export async function reseed(label, deps = {}) {
  const row = parked.get(keyRef(label))
  if (!row) return { ok: false, error: 'No key is parked under this label.' }
  row.seed = await seedStripe(row.secret, deps.fetch ?? fetch)
  return { ok: true, label, seed: row.seed }
}

/** The row for a permit's key, with the secret. **Only `use()` may call this, at the moment of sending.** */
export const parkedFor = (ref) => parked.get(ref)
/** What may be shown: every column except the key. */
export const parkedList = () => [...parked.values()].map(({ secret, ...row }) => row)
export const forgetKeys = () => { const n = parked.size; parked.clear(); return n }
