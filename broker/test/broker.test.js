import { test, before, describe } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { privateKeyToAccount } from 'viem/accounts'
import { DOMAIN, TYPES, lines, normalize } from '../src/permit.js'

const dir = mkdtempSync(join(tmpdir(), 'hoshi-'))
process.env.LEDGER_PATH = join(dir, 'ledger.jsonl')
process.on('exit', () => rmSync(dir, { recursive: true, force: true }))

const account = privateKeyToAccount('0x' + '11'.repeat(32))
const other = privateKeyToAccount('0x' + '22'.repeat(32))
let use

before(async () => { ({ use } = await import('../src/server.js')) })

const KEY = '0x' + 'ab'.repeat(32)
const basePermit = (over = {}) => ({
  holder: account.address,
  skill: '0x' + 'cc'.repeat(32),
  version: '1.0.0',
  key: KEY,
  target: 'api.stripe.com',
  scope: 'POST /v1/charges',
  maxCalls: 2,
  expiry: Math.floor(Date.now() / 1000) + 3600,
  nonce: Math.floor(Math.random() * 1e12),
  ...over,
})

const sign = (permit, signer = account) =>
  signer.signTypedData({ domain: DOMAIN, types: TYPES, primaryType: 'Permit', message: normalize(permit) })

const req = (over = {}) => ({ method: 'POST', url: 'https://api.stripe.com/v1/charges', keyRef: KEY, ...over })

const run = async (permit, request = req(), signer = account) =>
  use({ permit, signature: await sign(permit, signer), request })

describe('範囲の中なら通る', () => {
  test('ALLOWED で、残り回数が1つ減る', async () => {
    const p = basePermit()
    const a = await run(p)
    assert.equal(a.decision, 'ALLOWED')
    assert.equal(a.remaining, 1)
    const b = await run(p)
    assert.equal(b.remaining, 0)
  })

  test('返った中身に内容証明が付く', async () => {
    const a = await run(basePermit())
    assert.match(a.attestation.bodyHash, /^0x[0-9a-f]{64}$/)
    assert.equal(a.attestation.status, 200)
  })

  test('同じ要求は同じ糸（thread）になる', async () => {
    const p = basePermit()
    const [a, b] = [await run(p), await run(p)]
    assert.equal(a.thread, b.thread)
  })
})

describe('範囲を外れたら止まる', () => {
  const cases = [
    ['WRONG_KEY', () => [basePermit(), req({ keyRef: '0x' + 'ee'.repeat(32) })]],
    ['OUT_OF_TARGET', () => [basePermit(), req({ url: 'https://evil.com/v1/charges' })]],
    // 宛先は完全一致。ホスト名に紛れ込ませても通らない
    ['OUT_OF_TARGET', () => [basePermit(), req({ url: 'https://evil.com/api.stripe.com/v1/charges' })]],
    ['OUT_OF_SCOPE', () => [basePermit(), req({ method: 'DELETE' })]],
    // パスは区切りまで。/v1/chargesX を /v1/charges で通さない
    ['OUT_OF_SCOPE', () => [basePermit(), req({ url: 'https://api.stripe.com/v1/chargesX' })]],
    ['EXPIRED', () => [basePermit({ expiry: Math.floor(Date.now() / 1000) - 1 }), req()]],
  ]
  for (const [reason, mk] of cases) {
    test(`${reason} で DENIED`, async () => {
      const [p, r] = mk()
      const out = await run(p, r)
      assert.equal(out.decision, 'DENIED')
      assert.equal(out.reason, reason)
      assert.equal(out.violation, true, '宣言した範囲を外れた要求は、違反として刻む')
    })
  }

  test('EXHAUSTED — 回数を使い切ると止まる', async () => {
    const p = basePermit({ maxCalls: 1 })
    assert.equal((await run(p)).decision, 'ALLOWED')
    const out = await run(p)
    assert.equal(out.reason, 'EXHAUSTED')
  })

  test('BAD_SIGNATURE — 別人の署名は通らない。違反としては刻まない', async () => {
    const out = await run(basePermit(), req(), other)
    assert.equal(out.reason, 'BAD_SIGNATURE')
    assert.equal(out.violation, false)
  })

  test('REPLAY — 同じ nonce を別のスキルが使い回せない', async () => {
    const n = Math.floor(Math.random() * 1e12)
    await run(basePermit({ nonce: n }))
    const out = await run(basePermit({ nonce: n, skill: '0x' + 'dd'.repeat(32) }))
    assert.equal(out.reason, 'REPLAY')
  })

  test('止まった要求も系譜に残る', async () => {
    const out = await run(basePermit(), req({ url: 'https://evil.com/x' }))
    assert.equal(out.decision, 'DENIED')
    assert.ok(out.at, '刻まれた時刻がある')
    assert.ok(out.thread, '止まった要求にも糸が付く')
  })
})

describe('画面の4行', () => {
  test('ハッシュと同じ値から作られ、範囲が読める', () => {
    const l = lines(basePermit())
    assert.equal(l.length, 4)
    assert.ok(l[1].includes('api.stripe.com'))
    assert.ok(l[2].includes('POST /v1/charges x2'))
    assert.ok(l[3].startsWith('UNTIL'))
  })
})
