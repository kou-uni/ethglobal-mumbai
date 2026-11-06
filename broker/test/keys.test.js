// Parking a key: test-mode keys only, memory only, and the key never comes back out.
import { test, before, describe } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { privateKeyToAccount } from 'viem/accounts'
import { DOMAIN, TYPES, normalize, requestHash } from '../src/permit.js'
import { skillMessage, skillIdFrom } from '../src/skill.js'
import { createStore } from '../src/store.js'
import { parkKey, parkedList, parkedFor, keyRef, forgetKeys, reseed } from '../src/keys.js'

process.env.LEDGER_PATH = join(mkdtempSync(join(tmpdir(), 'tomoshibi-')), 'default.jsonl')
const SECRET = 'sk_test_CANARY7f3a9e21d4b85c06donotlog'
const holder = privateKeyToAccount('0x' + '44'.repeat(32))
const skill = privateKeyToAccount('0x' + '55'.repeat(32))
let use
before(async () => { ({ use } = await import('../src/server.js')) })

/** A stand-in for Stripe: answers the few calls the Broker makes, and remembers them. */
const stripe = (opts = {}) => {
  const calls = []
  const f = async (url, init = {}) => {
    calls.push({ url, method: init.method, auth: init.headers?.authorization, body: init.body })
    const path = new URL(url).pathname
    const ok = (obj) => ({ ok: true, status: 200, json: async () => obj })
    if (opts.bad) return { ok: false, status: 401, json: async () => ({ error: { message: 'Invalid API Key provided' } }) }
    if (path === '/v1/balance') return ok({ object: 'balance' })
    if (path === '/v1/payment_intents') return ok({ id: 'pi_test_1', status: 'succeeded' })
    if (path === '/v1/customers') return ok({ id: 'cus_test_1' })
    if (path === '/v1/invoices') return ok({ id: 'in_test_1' })
    return ok({ id: 'x' })
  }
  f.calls = calls
  return f
}

describe('parking a key', () => {
  test('a live key is refused before anything is stored or sent', async () => {
    forgetKeys(); const f = stripe()
    const out = await parkKey({ label: 'stripe-live', key: 'sk_live_' + 'a'.repeat(24) }, { fetch: f })
    assert.equal(out.ok, false); assert.match(out.error, /live key/)
    assert.equal(f.calls.length, 0); assert.equal(parkedList().length, 0)
  })
  test('anything that is not a test-mode key is refused, and so is a label that is not on the list', async () => {
    forgetKeys(); const f = stripe()
    assert.equal((await parkKey({ label: 'stripe-live', key: 'hello' }, { fetch: f })).ok, false)
    assert.equal((await parkKey({ label: 'model-main', key: SECRET }, { fetch: f })).ok, false)
    assert.equal(f.calls.length, 0)
  })
  test('a key Stripe does not accept is not stored', async () => {
    forgetKeys()
    const out = await parkKey({ label: 'stripe-live', key: SECRET }, { fetch: stripe({ bad: true }) })
    assert.equal(out.ok, false); assert.equal(parkedList().length, 0)
    assert.ok(!JSON.stringify(out).includes(SECRET))
  })
  test('a good test key is parked, the list shows every column except the key, and test data is made on request', async () => {
    forgetKeys(); const f = stripe()
    const out = await parkKey({ label: 'stripe-live', key: SECRET, seed: true }, { fetch: f })
    assert.equal(out.ok, true); assert.equal(out.mode, 'test'); assert.equal(out.seed.payment_intent, 'pi_test_1'); assert.equal(out.seed.invoices, 2)
    assert.ok(!JSON.stringify(out).includes(SECRET))
    assert.ok(!JSON.stringify(parkedList()).includes(SECRET))
    assert.equal(parkedFor(keyRef('stripe-live')).secret, SECRET)
    assert.equal((await reseed('stripe-live', { fetch: f })).seed.payment_intent, 'pi_test_1')
  })
  test('with a parked key the call is real, the key goes only to the executor, and the trail says test', async () => {
    forgetKeys(); await parkKey({ label: 'stripe-live', key: SECRET }, { fetch: stripe() })
    const path = join(mkdtempSync(join(tmpdir(), 'tomoshibi-')), 'l.jsonl'); const store = createStore(path)
    const permit = { holder: holder.address, skill: skillIdFrom(skill.address), version: '1.0.0', key: keyRef('stripe-live'), target: 'api.stripe.com', scope: '* /v1', maxCalls: 5, expiry: Math.floor(Date.now() / 1000) + 3600, nonce: Math.floor(Math.random() * 1e12) }
    const signature = await holder.signTypedData({ domain: DOMAIN, types: TYPES, primaryType: 'Permit', message: normalize(permit) })
    const request = { method: 'GET', url: 'https://api.stripe.com/v1/invoices?status=open', keyRef: permit.key }
    const skillSignature = await skill.signMessage({ message: skillMessage(requestHash(permit, request)) })
    let got = null
    const out = await use({ permit, signature, request, skillSignature }, { store, weigh: async () => ({ ok: true, tier: 'routine', reason: 'read', model: 'test', requestId: 'r1', ms: 1, reachable: true }),
      execute: async (_req, secret) => { got = secret; return { status: 200, body: '{"object":"list","data":[]}' } } })
    assert.equal(out.decision, 'ALLOWED'); assert.equal(out.live, 'test'); assert.equal(got, SECRET)
    assert.ok(!JSON.stringify(out).includes(SECRET))
    assert.ok(!readFileSync(path, 'utf8').includes(SECRET))
  })
})
