// Only the key holder can light a flame (Q1-b = B). **It never reaches the network.**
import { test, before, describe } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { privateKeyToAccount } from 'viem/accounts'
import { DOMAIN, TYPES, normalize, requestHash } from '../src/permit.js'
import { skillMessage, skillIdFrom } from '../src/skill.js'
import { createStore } from '../src/store.js'

process.env.LEDGER_PATH = join(mkdtempSync(join(tmpdir(), 'tomoshibi-')), 'default.jsonl')
delete process.env.VOUCH_OWNER

const holder = privateKeyToAccount('0x' + '11'.repeat(32))
const other = privateKeyToAccount('0x' + '22'.repeat(32))
const skill = privateKeyToAccount('0x' + '33'.repeat(32))
const SKILL = skillIdFrom(skill.address), KEY = '0x' + 'ab'.repeat(32)
let use, vouch
before(async () => { ({ use, vouch } = await import('../src/server.js')) })

const freshStore = () => createStore(join(mkdtempSync(join(tmpdir(), 'tomoshibi-')), 'l.jsonl'))
const permitFor = (over = {}) => ({
  holder: holder.address, skill: SKILL, version: '1.0.0', key: KEY, target: 'api.stripe.com', scope: '* /v1',
  maxCalls: 5, expiry: Math.floor(Date.now() / 1000) + 3600, nonce: Math.floor(Math.random() * 1e12), ...over,
})
const sign = (p, who = holder) => who.signTypedData({ domain: DOMAIN, types: TYPES, primaryType: 'Permit', message: normalize(p) })
const weigh = async () => ({ ok: true, reachable: true, tier: 'routine', reason: 'test', requestId: 'req_test', model: 'fake', ms: 1, usage: null })
/** A stand-in for World. Counts the calls, so we can check we never bother the person on behalf of someone who is not the holder. */
const human = (nullifier) => {
  const w = { asked: 0, waitForHuman: async () => { w.asked++; return { ok: true, idToken: 't' } }, verifyIdToken: async () => ({ ok: true, nullifier }) }
  return w
}
/** Actually use that permit once. */
async function useOnce(store, permit, signature) {
  const request = { method: 'GET', url: 'https://api.stripe.com/v1/balance', keyRef: KEY }
  const skillSignature = await skill.signMessage({ message: skillMessage(requestHash(permit, request)) })
  const r = await use({ permit, signature, request, skillSignature }, { store, weigh })
  assert.equal(r.decision, 'ALLOWED')
}

describe('only the key holder can light a flame', () => {
  test('no permit, no flame — and World is never called', async () => {
    const store = freshStore(), w = human('0xA')
    const r = await vouch({ deviceCode: 'dc', skill: SKILL, version: '1.0.0' }, { store, world: w })
    assert.equal(r.decision, 'VOUCH_DENIED'); assert.equal(r.reason, 'NOT_OWNER')
    assert.equal(w.asked, 0)
    assert.equal(store.starCount(SKILL, '1.0.0'), 0)
  })

  test('a permit signed by someone else does not light it', async () => {
    const store = freshStore(), w = human('0xA'), permit = permitFor()
    const signature = await sign(permit, other)
    const r = await vouch({ deviceCode: 'dc', skill: SKILL, version: '1.0.0', permit, signature }, { store, world: w })
    assert.equal(r.reason, 'NOT_OWNER'); assert.equal(w.asked, 0)
  })

  test('a permit for another version does not light it — after a version bump, only whoever signed again', async () => {
    const store = freshStore(), w = human('0xA'), permit = permitFor({ version: '1.0.0' })
    const signature = await sign(permit)
    await useOnce(store, permit, signature)
    const r = await vouch({ deviceCode: 'dc', skill: SKILL, version: '1.0.1', permit, signature }, { store, world: w })
    assert.equal(r.reason, 'NOT_OWNER'); assert.equal(w.asked, 0)
  })

  test('signing alone is not enough — it must have actually been used', async () => {
    const store = freshStore(), w = human('0xA'), permit = permitFor()
    const signature = await sign(permit)
    const r = await vouch({ deviceCode: 'dc', skill: SKILL, version: '1.0.0', permit, signature }, { store, world: w })
    assert.equal(r.decision, 'VOUCH_DENIED'); assert.equal(r.reason, 'NOT_USED'); assert.equal(w.asked, 0)
  })

  test('an expired permit does not light it', async () => {
    const store = freshStore(), w = human('0xA'), permit = permitFor({ expiry: Math.floor(Date.now() / 1000) - 10 })
    const r = await vouch({ deviceCode: 'dc', skill: SKILL, version: '1.0.0', permit, signature: await sign(permit) }, { store, world: w })
    assert.equal(r.reason, 'NOT_OWNER'); assert.equal(w.asked, 0)
  })

  test('signed by the holder and actually used: it lights — and the holder address is not written into the flame', async () => {
    const store = freshStore(), w = human('0xA'), permit = permitFor()
    const signature = await sign(permit)
    await useOnce(store, permit, signature)
    const r = await vouch({ deviceCode: 'dc', skill: SKILL, version: '1.0.0', permit, signature }, { store, world: w })
    assert.equal(r.decision, 'STAR'); assert.equal(r.ownerChecked, true); assert.equal(w.asked, 1)
    assert.equal(store.starChecked(SKILL, '1.0.0'), 1)
    assert.equal(JSON.stringify(r).toLowerCase().includes(holder.address.toLowerCase()), false)
  })

  test('a refusal is kept in the same lineage', async () => {
    const store = freshStore()
    const r = await vouch({ deviceCode: 'dc', skill: SKILL, version: '1.0.0' }, { store, world: human('0xA') })
    assert.ok(r.at); assert.match(r.message, /no star is issued/)
  })
})

describe('what happened with one holder\'s key', () => {
  test('since() returns that holder\'s records in order, and nobody else\'s', async () => {
    const store = freshStore(), permit = permitFor()
    const signature = await sign(permit)
    await useOnce(store, permit, signature)
    const out = { method: 'POST', url: 'https://evil.com/v1/charges', keyRef: KEY }
    const skillSignature = await skill.signMessage({ message: skillMessage(requestHash(permit, out)) })
    const denied = await use({ permit, signature, request: out, skillSignature }, { store, weigh })
    assert.equal(denied.decision, 'DENIED')
    const mine = store.since(holder.address)
    assert.deepEqual(mine.map((r) => r.decision), ['ALLOWED', 'DENIED'])
    assert.equal(store.since(other.address).length, 0)
  })
})
