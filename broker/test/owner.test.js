// 灯（星）を出せるのは鍵の持ち主だけ（Q1-b = B）。**網には出ない。**
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
const weigh = async () => ({ ok: true, reachable: true, tier: 'ふだん', reason: '試験', requestId: 'req_test', model: 'fake', ms: 1, usage: null })
/** World の替え玉。呼ばれた回数を数える（持ち主でない人のために本人を煩わせないことを確かめる）。 */
const human = (nullifier) => {
  const w = { asked: 0, waitForHuman: async () => { w.asked++; return { ok: true, idToken: 't' } }, verifyIdToken: async () => ({ ok: true, nullifier }) }
  return w
}
/** その許可で1回、実際に使う。 */
async function useOnce(store, permit, signature) {
  const request = { method: 'GET', url: 'https://api.stripe.com/v1/balance', keyRef: KEY }
  const skillSignature = await skill.signMessage({ message: skillMessage(requestHash(permit, request)) })
  const r = await use({ permit, signature, request, skillSignature }, { store, weigh })
  assert.equal(r.decision, 'ALLOWED')
}

describe('星を出せるのは、鍵の持ち主だけ', () => {
  test('許可を添えなければ出ない。World も呼ばれない', async () => {
    const store = freshStore(), w = human('0xA')
    const r = await vouch({ deviceCode: 'dc', skill: SKILL, version: '1.0.0' }, { store, world: w })
    assert.equal(r.decision, 'VOUCH_DENIED'); assert.equal(r.reason, 'NOT_OWNER')
    assert.equal(w.asked, 0)
    assert.equal(store.starCount(SKILL, '1.0.0'), 0)
  })

  test('他人が署名した許可では出ない', async () => {
    const store = freshStore(), w = human('0xA'), permit = permitFor()
    const signature = await sign(permit, other)
    const r = await vouch({ deviceCode: 'dc', skill: SKILL, version: '1.0.0', permit, signature }, { store, world: w })
    assert.equal(r.reason, 'NOT_OWNER'); assert.equal(w.asked, 0)
  })

  test('別の版への許可では出ない（版が上がったら、署名し直した人だけ）', async () => {
    const store = freshStore(), w = human('0xA'), permit = permitFor({ version: '1.0.0' })
    const signature = await sign(permit)
    await useOnce(store, permit, signature)
    const r = await vouch({ deviceCode: 'dc', skill: SKILL, version: '1.0.1', permit, signature }, { store, world: w })
    assert.equal(r.reason, 'NOT_OWNER'); assert.equal(w.asked, 0)
  })

  test('署名しただけで、一度も使っていなければ出ない', async () => {
    const store = freshStore(), w = human('0xA'), permit = permitFor()
    const signature = await sign(permit)
    const r = await vouch({ deviceCode: 'dc', skill: SKILL, version: '1.0.0', permit, signature }, { store, world: w })
    assert.equal(r.decision, 'VOUCH_DENIED'); assert.equal(r.reason, 'NOT_USED'); assert.equal(w.asked, 0)
  })

  test('期限の切れた許可では出ない', async () => {
    const store = freshStore(), w = human('0xA'), permit = permitFor({ expiry: Math.floor(Date.now() / 1000) - 10 })
    const r = await vouch({ deviceCode: 'dc', skill: SKILL, version: '1.0.0', permit, signature: await sign(permit) }, { store, world: w })
    assert.equal(r.reason, 'NOT_OWNER'); assert.equal(w.asked, 0)
  })

  test('持ち主が署名し、実際に使っていれば出る。持ち主のアドレスは星に刻まない', async () => {
    const store = freshStore(), w = human('0xA'), permit = permitFor()
    const signature = await sign(permit)
    await useOnce(store, permit, signature)
    const r = await vouch({ deviceCode: 'dc', skill: SKILL, version: '1.0.0', permit, signature }, { store, world: w })
    assert.equal(r.decision, 'STAR'); assert.equal(r.ownerChecked, true); assert.equal(w.asked, 1)
    assert.equal(store.starChecked(SKILL, '1.0.0'), 1)
    assert.equal(JSON.stringify(r).toLowerCase().includes(holder.address.toLowerCase()), false)
  })

  test('断られたことも、同じ系譜に残る', async () => {
    const store = freshStore()
    const r = await vouch({ deviceCode: 'dc', skill: SKILL, version: '1.0.0' }, { store, world: human('0xA') })
    assert.ok(r.at); assert.match(r.message, /星を出さない/)
  })
})
