import { test, before, describe } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { privateKeyToAccount } from 'viem/accounts'
import { DOMAIN, TYPES, lines, normalize, requestHash } from '../src/permit.js'
import { skillMessage, skillIdFrom } from '../src/skill.js'

const dir = mkdtempSync(join(tmpdir(), 'hoshi-'))
process.env.LEDGER_PATH = join(dir, 'ledger.jsonl')
process.on('exit', () => rmSync(dir, { recursive: true, force: true }))

const holder = privateKeyToAccount('0x' + '11'.repeat(32))
const other = privateKeyToAccount('0x' + '22'.repeat(32))
const skill = privateKeyToAccount('0x' + '33'.repeat(32))
const otherSkill = privateKeyToAccount('0x' + '44'.repeat(32))
let use

before(async () => { ({ use } = await import('../src/server.js')) })

const KEY = '0x' + 'ab'.repeat(32)
const basePermit = (over = {}) => ({
  holder: holder.address,
  skill: skillIdFrom(skill.address),
  version: '1.0.0',
  key: KEY,
  target: 'api.stripe.com',
  scope: 'POST /v1/charges',
  maxCalls: 2,
  expiry: Math.floor(Date.now() / 1000) + 3600,
  nonce: Math.floor(Math.random() * 1e12),
  ...over,
})

const sign = (permit, who = holder) =>
  who.signTypedData({ domain: DOMAIN, types: TYPES, primaryType: 'Permit', message: normalize(permit) })

const req = (over = {}) => ({ method: 'POST', url: 'https://api.stripe.com/v1/charges', keyRef: KEY, ...over })

/** 既定では、スキルの署名も正しく付けて投げる */
async function run(permit, request = req(), { signer = holder, skillKey = skill, sign: withSkill = true } = {}) {
  const body = { permit, signature: await sign(permit, signer), request }
  if (withSkill) body.skillSignature = await skillKey.signMessage({ message: skillMessage(requestHash(permit, request)) })
  return use(body)
}

describe('範囲の中なら通る', () => {
  test('ALLOWED で、残り回数が1つ減る', async () => {
    const p = basePermit()
    assert.equal((await run(p)).remaining, 1)
    assert.equal((await run(p)).remaining, 0)
  })

  test('返った中身に内容証明が付く', async () => {
    const a = await run(basePermit())
    assert.match(a.attestation.bodyHash, /^0x[0-9a-f]{64}$/)
  })

  test('同じ要求は同じ糸（thread）になる', async () => {
    const p = basePermit()
    assert.equal((await run(p)).thread, (await run(p)).thread)
  })
})

describe('範囲を外れたら止まり、違反として刻まれる', () => {
  const cases = [
    ['WRONG_KEY', () => [basePermit(), req({ keyRef: '0x' + 'ee'.repeat(32) })]],
    ['OUT_OF_TARGET', () => [basePermit(), req({ url: 'https://evil.com/v1/charges' })]],
    ['OUT_OF_TARGET', () => [basePermit(), req({ url: 'https://evil.com/api.stripe.com/v1/charges' })]],
    ['OUT_OF_SCOPE', () => [basePermit(), req({ method: 'DELETE' })]],
    ['OUT_OF_SCOPE', () => [basePermit(), req({ url: 'https://api.stripe.com/v1/chargesX' })]],
    // #14-5 平文の経路では鍵が流れる
    ['INSECURE_TRANSPORT', () => [basePermit(), req({ url: 'http://api.stripe.com/v1/charges' })]],
  ]
  for (const [reason, mk] of cases) {
    test(`${reason}`, async () => {
      const out = await run(...mk())
      assert.equal(out.decision, 'DENIED')
      assert.equal(out.reason, reason)
      assert.equal(out.violation, true)
    })
  }

  test('REPLAY — 同じ nonce を別のスキルが使い回せない', async () => {
    const n = Math.floor(Math.random() * 1e12)
    await run(basePermit({ nonce: n }))
    const out = await run(basePermit({ nonce: n, skill: skillIdFrom(otherSkill.address) }), req(), { skillKey: otherSkill })
    assert.equal(out.reason, 'REPLAY')
    assert.equal(out.violation, true)
  })
})

describe('#14-1 設計どおりに細った状態は、違反ではない', () => {
  test('EXHAUSTED は違反にしない', async () => {
    const p = basePermit({ maxCalls: 1 })
    await run(p)
    const out = await run(p)
    assert.equal(out.reason, 'EXHAUSTED')
    assert.equal(out.violation, false, '普通に使い切ったスキルを違反者にしない')
  })

  test('EXPIRED は違反にしない', async () => {
    const out = await run(basePermit({ expiry: Math.floor(Date.now() / 1000) - 1 }))
    assert.equal(out.reason, 'EXPIRED')
    assert.equal(out.violation, false)
  })

  test('BAD_SIGNATURE も違反にしない（刻む相手が確定しない）', async () => {
    const out = await run(basePermit(), req(), { signer: other })
    assert.equal(out.reason, 'BAD_SIGNATURE')
    assert.equal(out.violation, false)
  })
})

describe('#14-2 署名なしで nonce を横取りできない', () => {
  test('偽署名の先行要求があっても、正規の要求は通る', async () => {
    const n = Math.floor(Math.random() * 1e12)
    // 攻撃者：holder の署名を持たないまま、その nonce を別スキルで先に使う
    const bad = await run(basePermit({ nonce: n, skill: skillIdFrom(otherSkill.address) }), req(), { signer: other, skillKey: otherSkill })
    assert.equal(bad.reason, 'BAD_SIGNATURE')
    // 本人の正規の要求が、あとから REPLAY にされない
    const good = await run(basePermit({ nonce: n }))
    assert.equal(good.decision, 'ALLOWED')
  })
})

describe('#14-3 連打で回数を超えられない', () => {
  test('maxCalls=3 に 50 本同時に投げても、通るのは3本', async () => {
    const p = basePermit({ maxCalls: 3 })
    const outs = await Promise.all(Array.from({ length: 50 }, () => run(p)))
    assert.equal(outs.filter((o) => o.decision === 'ALLOWED').length, 3)
    assert.equal(outs.filter((o) => o.reason === 'EXHAUSTED').length, 47)
  })
})

describe('#14-4 スキルの署名がない要求は、違反として刻まない', () => {
  test('署名なしの範囲外要求は DENIED だが violation ではない', async () => {
    const out = await run(basePermit(), req({ url: 'https://evil.com/x' }), { sign: false })
    assert.equal(out.decision, 'DENIED')
    assert.equal(out.violation, false)
    assert.equal(out.unsignedRequest, true)
    assert.equal(out.skillSigner, null)
  })

  test('別の鍵で署名された要求で、そのスキルの違反を作れない', async () => {
    const out = await run(basePermit(), req({ url: 'https://evil.com/x' }), { skillKey: otherSkill })
    assert.equal(out.violation, false, 'permit の skill と署名者が一致しない')
  })

  test('正しい署名が付けば、署名者が記録に残る', async () => {
    const out = await run(basePermit(), req({ url: 'https://evil.com/x' }))
    assert.equal(out.violation, true)
    assert.equal(out.skillSigner.toLowerCase(), skill.address.toLowerCase())
  })
})

describe('画面の4行', () => {
  test('ハッシュと同じ値から作られ、範囲が読める', () => {
    const l = lines(basePermit())
    assert.equal(l.length, 4)
    assert.ok(l[1].includes('api.stripe.com'))
    assert.ok(l[2].includes('POST /v1/charges x2'))
  })
})
