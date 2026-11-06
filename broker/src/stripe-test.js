// Stripe, test mode only. Two things: one plain call (to check a key, or to make test data), and the test data
// itself — so that the demo's requests have something real to read and something real to refund.
// Nothing here runs with a live key (keys.js refuses those before this file is reached).
const BASE = 'https://api.stripe.com'

export async function stripeCall(fetchImpl, secret, method, path, params) {
  const res = await fetchImpl(BASE + path, {
    method,
    headers: { authorization: `Bearer ${secret}`, ...(params ? { 'content-type': 'application/x-www-form-urlencoded' } : {}) },
    body: params ? new URLSearchParams(params).toString() : undefined,
    signal: AbortSignal.timeout(20000),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`Stripe ${res.status}: ${body?.error?.message ?? 'no message'}`)
  return body
}

/**
 * Make a little test data in the owner's Stripe **test** account: one paid order (so a refund has something to
 * refund) and two unpaid invoices (so "read the unpaid invoices" has something to read).
 * Every step is best effort; what did not work is said in `notes`, never hidden.
 * @returns {Promise<{payment_intent:string|null, amount:number|null, currency:string|null, invoices:number, notes:string[]}>}
 */
export async function seedStripe(secret, fetchImpl = fetch) {
  const out = { payment_intent: null, amount: null, currency: null, invoices: 0, notes: [] }
  const call = (method, path, params) => stripeCall(fetchImpl, secret, method, path, params)
  // 1. one paid order on Stripe's test card. ₹4,800 if the account can charge in rupees, otherwise dollars.
  for (const [currency, amount] of [['inr', 480000], ['usd', 5800]]) {
    try {
      const pi = await call('POST', '/v1/payment_intents', {
        amount: String(amount), currency, payment_method: 'pm_card_visa', confirm: 'true',
        'automatic_payment_methods[enabled]': 'true', 'automatic_payment_methods[allow_redirects]': 'never',
        description: 'TOMOSHIBI demo: order #1042, a bag (test mode)',
      })
      if (pi.status === 'succeeded') { out.payment_intent = pi.id; out.amount = amount; out.currency = currency; break }
      out.notes.push(`test payment in ${currency}: ${pi.status}`)
    } catch (e) { out.notes.push(`test payment in ${currency}: ${String(e.message ?? e)}`) }
  }
  // 2. two unpaid invoices
  try {
    const currency = out.currency ?? 'usd'
    const customer = await call('POST', '/v1/customers', { name: 'Demo customer (TOMOSHIBI test)', email: 'demo-customer@example.com' })
    for (const [n, amount] of [[1038, 120000], [1040, 64000]]) {
      const inv = await call('POST', '/v1/invoices', { customer: customer.id, collection_method: 'send_invoice', days_until_due: '7', auto_advance: 'false', description: `Order #${n} (test mode)` })
      await call('POST', '/v1/invoiceitems', { customer: customer.id, invoice: inv.id, amount: String(currency === 'inr' ? amount : Math.round(amount / 80)), currency, description: `Order #${n}` })
      await call('POST', `/v1/invoices/${inv.id}/finalize`, { auto_advance: 'false' })
      out.invoices += 1
    }
  } catch (e) { out.notes.push(`test invoices: ${String(e.message ?? e)}`) }
  return out
}
