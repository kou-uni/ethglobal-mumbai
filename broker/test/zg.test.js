// 0G の層の試験。**網には出ない**（fetch を替え玉にする）。
import { test, before, describe } from 'node:test'
import assert from 'node:assert/strict'
import { privateKeyToAccount } from 'viem/accounts'
import { DOMAIN, TYPES, lines, normalize, requestHash } from '../src/permit.js'
import { skillMessage } from '../src/skill.js'
import { weigh, promptFor } from '../src/weigh.js'
import { serialize, rootOf } from '../src/episode.js'
import { needsPress } from '../src/tier.js'

const holder = privateKeyToAccount('0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d')
const skill = privateKeyToAccount('0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba')
const KEY = '0x' + '11'.repeat(32)

let use
before(async () => { ({ use } = await import('../src/server.js')) })

const permitFor = (over = {}) => ({
  holder: holder.address,
  skill: '0x' + '22'.repeat(32),
  version: '1',
  key: KEY,
  target: 'api.stripe.com',
  scope: 'POST /v1',
  maxCalls: 2,
  expiry: Math.floor(Date.now() / 1000) + 3600,
  nonce: Math.floor(Math.random() * 1e12),
  ...over,
})

const request = { method: 'POST', url: 'https://api.stripe.com/v1/charges', keyRef: KEY, body: '{"amount":990}' }

async function run(permit, weighFn, req = request) {
  const body = {
    permit,
    signature: await holder.signTypedData({ domain: DOMAIN, types: TYPES, primaryType: 'Permit', message: normalize(permit) }),
    request: req,
    skillSignature: await skill.signMessage({ message: skillMessage(requestHash(permit, req)) }),
  }
  return use(body, { weigh: weighFn })
}

const says = (tier) => async () => ({ ok: true, reachable: true, tier, reason: 'x', requestId: 'req_9f2a', model: 'm', ms: 7, usage: { total_tokens: 120 } })
const unreachable = async () => ({ ok: false, reachable: false, requestId: null, model: 'm', ms: 20000, usage: null, error: '0G が応答しない' })

describe('0G が判断ループの中にいる', () => {
  test('「ふだん」なら通り、記録に request ID が残る', async () => {
    const out = await run(permitFor(), says('ふだん'))
    assert.equal(out.decision, 'ALLOWED')
    assert.equal(out.zg.tier, 'ふだん')
    assert.equal(out.zg.requestId, 'req_9f2a')
  })

  test('「決定的」は、立っている許可（maxCalls>1）では通らない', async () => {
    const out = await run(permitFor({ maxCalls: 5 }), says('決定的'))
    assert.equal(out.decision, 'NEEDS_PRESS')
    assert.equal(out.press.need.includes('maxCalls=1'), true)
    assert.deepEqual(out.lines.length, 4)
  })

  test('「決定的」でも、その場の一押し（maxCalls=1）なら通る', async () => {
    const out = await run(permitFor({ maxCalls: 1 }), says('決定的'))
    assert.equal(out.decision, 'ALLOWED')
  })

  test('重さが変われば結果が変わる（＝ログ置き場ではない）', async () => {
    const p = permitFor({ maxCalls: 5 })
    const a = await run(p, says('ふだん'))
    const b = await run(permitFor({ maxCalls: 5 }), says('決定的'))
    assert.notEqual(a.decision, b.decision)
  })
})

describe('0G に届かないときは、判断を作らずに止まる', () => {
  test('STOPPED になり、実行しない', async () => {
    const out = await run(permitFor(), unreachable)
    assert.equal(out.decision, 'STOPPED')
    assert.equal(out.safeStop, true)
    assert.equal(out.result, undefined)
    assert.equal(out.zg.error.includes('0G'), true)
  })

  test('止まった分は回数を減らさない', async () => {
    const p = permitFor({ maxCalls: 1 })
    await run(p, unreachable)
    const after = await run(p, says('ふだん'))
    assert.equal(after.decision, 'ALLOWED')
  })

  test('答えが読めないときも、既定値で通さない', async () => {
    const broken = async () => ({ ok: false, reachable: true, requestId: 'req_1', model: 'm', ms: 5, usage: null, error: '知らない重さ: たぶん大事' })
    const out = await run(permitFor(), broken)
    assert.equal(out.decision, 'STOPPED')
  })
})

describe('0G に渡すもの', () => {
  test('本文は渡す（中身を読まないと重さが決まらない）。鍵の平文は渡さない', () => {
    const s = promptFor(lines(permitFor()), request)
    assert.equal(s.includes('amount') && s.includes('990'), true)
    assert.equal(s.includes('sk-'), false)
    assert.equal(s.includes('secret'), false)
  })

  test('替え玉の 0G から x-request-id を拾い、知らない重さは受け取らない', async () => {
    const reply = (content, id = 'hdr_1') => async () => ({
      ok: true, status: 200,
      headers: { get: (k) => (k === 'x-request-id' ? id : null) },
      text: async () => JSON.stringify({ id: 'body_2', choices: [{ message: { content } }], usage: { total_tokens: 9 } }),
    })
    const ok = await weigh(['a'], request, { apiKey: 'sk-test', fetch: reply('<think>…</think>{"tier":"大事","reason":"送金"}') })
    assert.equal(ok.ok, true)
    assert.equal(ok.tier, '大事')
    assert.equal(ok.requestId, 'hdr_1')

    const bad = await weigh(['a'], request, { apiKey: 'sk-test', fetch: reply('{"tier":"やばい"}') })
    assert.equal(bad.ok, false)
    assert.equal(bad.reachable, true)
  })

  test('API キーが無ければ、呼ばずに失敗を返す（黙って通さない）', async () => {
    const r = await weigh(['a'], request, { apiKey: '', fetch: async () => { throw new Error('呼んではいけない') } })
    assert.equal(r.ok, false)
    assert.equal(r.error.includes('ZG_API_KEY'), true)
  })
})

describe('エピソードログ', () => {
  test('JSONL は1行1記録で、糸がすべての行に入る', () => {
    const s = serialize('0xthread', [{ decision: 'ALLOWED' }, { decision: 'SEALED' }])
    const rows = s.trim().split('\n').map(JSON.parse)
    assert.equal(rows.length, 2)
    assert.equal(rows.every((r) => r.thread === '0xthread'), true)
  })

  test('root hash は同じ中身なら同じ値になる', async () => {
    const b = new TextEncoder().encode('{"a":1}\n')
    assert.equal(await rootOf(b), await rootOf(new TextEncoder().encode('{"a":1}\n')))
  })
})

describe('段の境目', () => {
  test('ふだん は押させない。決定的 は押させる', () => {
    assert.equal(needsPress('ふだん', { maxCalls: 9 }), false)
    assert.equal(needsPress('決定的', { maxCalls: 9 }), true)
  })
})
