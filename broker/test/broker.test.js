import { test, before, describe } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { privateKeyToAccount } from 'viem/accounts'
import { DOMAIN, TYPES, lines, normalize, requestHash } from '../src/permit.js'
import { skillMessage, skillIdFrom } from '../src/skill.js'

const dir = mkdtempSync(join(tmpdir(), 'tomoshibi-'))
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

/** The tests never call 0G. By default this stand-in returns routine (the real thing is in test/zg.test.js) */
const fakeWeigh = (tier = 'routine') => async () => ({
  ok: true, reachable: true, tier, reason: 'test', requestId: 'req_test', model: 'fake', ms: 1, usage: null,
})

/** By default, send the request with a valid skill signature attached as well */
async function run(permit, request = req(), { signer = holder, skillKey = skill, sign: withSkill = true, weigh = fakeWeigh() } = {}) {
  const body = { permit, signature: await sign(permit, signer), request }
  if (withSkill) body.skillSignature = await skillKey.signMessage({ message: skillMessage(requestHash(permit, request)) })
  return use(body, { weigh })
}

describe('inside the scope it passes', () => {
  test('ALLOWED, and the remaining call budget drops by one', async () => {
    const p = basePermit()
    assert.equal((await run(p)).remaining, 1)
    assert.equal((await run(p)).remaining, 0)
  })

  test('the returned body comes with an attestation', async () => {
    const a = await run(basePermit())
    assert.match(a.attestation.bodyHash, /^0x[0-9a-f]{64}$/)
  })

  test('the same request produces the same thread', async () => {
    const p = basePermit()
    assert.equal((await run(p)).thread, (await run(p)).thread)
  })
})

describe('outside the scope it stops, and is recorded as a violation', () => {
  const cases = [
    ['WRONG_KEY', () => [basePermit(), req({ keyRef: '0x' + 'ee'.repeat(32) })]],
    ['OUT_OF_TARGET', () => [basePermit(), req({ url: 'https://evil.com/v1/charges' })]],
    ['OUT_OF_TARGET', () => [basePermit(), req({ url: 'https://evil.com/api.stripe.com/v1/charges' })]],
    ['OUT_OF_SCOPE', () => [basePermit(), req({ method: 'DELETE' })]],
    ['OUT_OF_SCOPE', () => [basePermit(), req({ url: 'https://api.stripe.com/v1/chargesX' })]],
    // #14-5 a plaintext route leaks the key
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

  test('REPLAY - another skill cannot reuse the same nonce', async () => {
    const n = Math.floor(Math.random() * 1e12)
    await run(basePermit({ nonce: n }))
    const out = await run(basePermit({ nonce: n, skill: skillIdFrom(otherSkill.address) }), req(), { skillKey: otherSkill })
    assert.equal(out.reason, 'REPLAY')
    assert.equal(out.violation, true)
  })
})

describe('#14-1 a permit that narrowed as designed is not a violation', () => {
  test('EXHAUSTED is not treated as a violation', async () => {
    const p = basePermit({ maxCalls: 1 })
    await run(p)
    const out = await run(p)
    assert.equal(out.reason, 'EXHAUSTED')
    assert.equal(out.violation, false, 'a skill that simply ran out is not an offender')
  })

  test('EXPIRED is not treated as a violation', async () => {
    const out = await run(basePermit({ expiry: Math.floor(Date.now() / 1000) - 1 }))
    assert.equal(out.reason, 'EXPIRED')
    assert.equal(out.violation, false)
  })

  test('BAD_SIGNATURE is not a violation either (there is nobody to record it against)', async () => {
    const out = await run(basePermit(), req(), { signer: other })
    assert.equal(out.reason, 'BAD_SIGNATURE')
    assert.equal(out.violation, false)
  })
})

describe('#14-2 a nonce cannot be hijacked without a signature', () => {
  test('an earlier forged-signature request does not block the legitimate one', async () => {
    const n = Math.floor(Math.random() * 1e12)
    // the attacker: without the holder's signature, use that nonce first under a different skill
    const bad = await run(basePermit({ nonce: n, skill: skillIdFrom(otherSkill.address) }), req(), { signer: other, skillKey: otherSkill })
    assert.equal(bad.reason, 'BAD_SIGNATURE')
    // the owner's legitimate request is not turned into a REPLAY afterwards
    const good = await run(basePermit({ nonce: n }))
    assert.equal(good.decision, 'ALLOWED')
  })
})

describe('#14-3 hammering cannot exceed the call budget', () => {
  test('50 concurrent requests against maxCalls=3 and only 3 pass', async () => {
    const p = basePermit({ maxCalls: 3 })
    const outs = await Promise.all(Array.from({ length: 50 }, () => run(p)))
    assert.equal(outs.filter((o) => o.decision === 'ALLOWED').length, 3)
    assert.equal(outs.filter((o) => o.reason === 'EXHAUSTED').length, 47)
  })
})

describe('#14-4 a request without the skill signature is not recorded as a violation', () => {
  test('an unsigned out-of-scope request is DENIED but not a violation', async () => {
    const out = await run(basePermit(), req({ url: 'https://evil.com/x' }), { sign: false })
    assert.equal(out.decision, 'DENIED')
    assert.equal(out.violation, false)
    assert.equal(out.unsignedRequest, true)
    assert.equal(out.skillSigner, null)
  })

  test('a request signed with a different key cannot manufacture a violation against that skill', async () => {
    const out = await run(basePermit(), req({ url: 'https://evil.com/x' }), { skillKey: otherSkill })
    assert.equal(out.violation, false, 'the permit skill and the signer do not match')
  })

  test('with a valid signature, the signer stays in the record', async () => {
    const out = await run(basePermit(), req({ url: 'https://evil.com/x' }))
    assert.equal(out.violation, true)
    assert.equal(out.skillSigner.toLowerCase(), skill.address.toLowerCase())
  })
})

describe('the four lines on screen', () => {
  test('built from the same values as the hash, and the scope is readable', () => {
    const l = lines(basePermit())
    assert.equal(l.length, 4)
    assert.ok(l[1].includes('api.stripe.com'))
    assert.ok(l[2].includes('POST /v1/charges x2'))
  })
})

// -- the frozen test vector (spec/permit-signature.md §6) --
// **If this moves, it no longer agrees with the Ledger side.** Never fix just one side.
describe('test vector (pins the boundary between Ledger and Broker)', () => {
  const VECTOR = {
    permit: {
      holder: '0x19E7E376E7C213B7E7e7e46cc70A5dD086DAff2A',
      skill: '0x166b4a98f5f1c72f1e05921caf802eb07395b2afee302ceaef74b29657e641c5',
      version: '1.0.0',
      key: '0x6d5f7d408f4fb5f31403c52734dad9172da58198ab1599f5b0b9754e79d37148',
      target: 'api.stripe.com',
      scope: 'POST /v1/charges',
      maxCalls: 3,
      expiry: 1794009600,
      nonce: 42,
    },
    digest: '0x8d63692146d1c78f08bfbe1ab6fa254130767260d83921f2d9ed8680a7889486',
    lines: ['KEY   0x6d5f7d40…', 'TO    api.stripe.com', 'SCOPE POST /v1/charges x3', 'UNTIL 2026-11-07 00:00Z'],
    signature: '0x9814354237a00bfe1d1b182f4a6d5974eb52c38b3d186f32bea0ca0a26341b981fd5acc30eac9f1eab839e75554a12d4ef726a4f120a6774b4dc92461ac812491c',
  }

  test('the digest does not move', async () => {
    const { digest } = await import('../src/permit.js')
    assert.equal(digest(VECTOR.permit), VECTOR.digest)
  })

  test('the four lines shown on the device do not move', () => {
    assert.deepEqual(lines(VECTOR.permit), VECTOR.lines)
  })

  test('this signature recovers the holder', async () => {
    const { signer } = await import('../src/permit.js')
    assert.equal((await signer(VECTOR.permit, VECTOR.signature)).toLowerCase(), VECTOR.permit.holder.toLowerCase())
  })
})
