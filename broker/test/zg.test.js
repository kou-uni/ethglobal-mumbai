// Tests for the 0G layer. **No network** (fetch is stubbed out).
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
const unreachable = async () => ({ ok: false, reachable: false, requestId: null, model: 'm', ms: 20000, usage: null, error: '0G is not responding' })

describe('0G sits inside the decision loop', () => {
  test('routine passes, and the request ID stays in the record', async () => {
    const out = await run(permitFor(), says('routine'))
    assert.equal(out.decision, 'ALLOWED')
    assert.equal(out.zg.tier, 'routine')
    assert.equal(out.zg.requestId, 'req_9f2a')
  })

  test('decisive does not pass on a standing permit (maxCalls>1)', async () => {
    const out = await run(permitFor({ maxCalls: 5 }), says('decisive'))
    assert.equal(out.decision, 'NEEDS_PRESS')
    assert.equal(out.press.need.includes('maxCalls=1'), true)
    assert.deepEqual(out.lines.length, 4)
  })

  test('even decisive passes on a press right now (maxCalls=1)', async () => {
    const out = await run(permitFor({ maxCalls: 1 }), says('decisive'))
    assert.equal(out.decision, 'ALLOWED')
  })

  test('a different weight gives a different outcome (so it is not just a log store)', async () => {
    const p = permitFor({ maxCalls: 5 })
    const a = await run(p, says('routine'))
    const b = await run(permitFor({ maxCalls: 5 }), says('decisive'))
    assert.notEqual(a.decision, b.decision)
  })
})

describe('when 0G cannot be reached, it stops instead of inventing a judgement', () => {
  test('it becomes STOPPED and does not execute', async () => {
    const out = await run(permitFor(), unreachable)
    assert.equal(out.decision, 'STOPPED')
    assert.equal(out.safeStop, true)
    assert.equal(out.result, undefined)
    assert.equal(out.zg.error.includes('0G'), true)
  })

  test('a stop does not spend the call budget', async () => {
    const p = permitFor({ maxCalls: 1 })
    await run(p, unreachable)
    const after = await run(p, says('routine'))
    assert.equal(after.decision, 'ALLOWED')
  })

  test('an unreadable answer does not pass on a default either', async () => {
    const broken = async () => ({ ok: false, reachable: true, requestId: 'req_1', model: 'm', ms: 5, usage: null, error: 'unknown weight: probably significant' })
    const out = await run(permitFor(), broken)
    assert.equal(out.decision, 'STOPPED')
  })
})

describe('what gets handed to 0G', () => {
  test('the body is handed over (the weight cannot be decided without reading it); the plaintext key is not', () => {
    const s = promptFor(lines(permitFor()), request)
    assert.equal(s.includes('amount') && s.includes('990'), true)
    assert.equal(s.includes('sk-'), false)
    assert.equal(s.includes('secret'), false)
  })

  test('picks up x-request-id from the stubbed 0G, and refuses an unknown weight', async () => {
    const reply = (content, id = 'hdr_1') => async () => ({
      ok: true, status: 200,
      headers: { get: (k) => (k === 'x-request-id' ? id : null) },
      text: async () => JSON.stringify({ id: 'body_2', choices: [{ message: { content } }], usage: { total_tokens: 9 } }),
    })
    const ok = await weigh(['a'], request, { apiKey: 'sk-test', fetch: reply('<think>…</think>{"tier":"significant","reason":"money leaves"}') })
    assert.equal(ok.ok, true)
    assert.equal(ok.tier, 'significant')
    assert.equal(ok.requestId, 'hdr_1')

    const bad = await weigh(['a'], request, { apiKey: 'sk-test', fetch: reply('{"tier":"nonsense"}') })
    assert.equal(bad.ok, false)
    assert.equal(bad.reachable, true)
  })

  test('with no API key it fails without calling out (nothing passes silently)', async () => {
    const r = await weigh(['a'], request, { apiKey: '', fetch: async () => { throw new Error('must not be called') } })
    assert.equal(r.ok, false)
    assert.equal(r.error.includes('ZG_API_KEY'), true)
  })
})

describe('the episode log', () => {
  test('the JSONL holds one record per line, with the thread on every line', () => {
    const s = serialize('0xthread', [{ decision: 'ALLOWED' }, { decision: 'SEALED' }])
    const rows = s.trim().split('\n').map(JSON.parse)
    assert.equal(rows.length, 2)
    assert.equal(rows.every((r) => r.thread === '0xthread'), true)
  })

  test('the same contents give the same root hash', async () => {
    const b = new TextEncoder().encode('{"a":1}\n')
    assert.equal(await rootOf(b), await rootOf(new TextEncoder().encode('{"a":1}\n')))
  })
})

describe('the tier boundary', () => {
  test('routine does not ask for a press; decisive does', () => {
    assert.equal(needsPress('routine', { maxCalls: 9 }), false)
    assert.equal(needsPress('decisive', { maxCalls: 9 }), true)
  })
})
