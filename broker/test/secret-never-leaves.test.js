// The claim the whole product rests on: **the agent never receives the API key.**
// It is a boundary property, not a cryptographic one, so the way to hold ourselves to it is a test
// that fails the moment the plaintext appears anywhere the agent, the model or the public can read.
import { test, before, describe } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { privateKeyToAccount } from 'viem/accounts'
import { DOMAIN, TYPES, normalize, requestHash } from '../src/permit.js'
import { skillMessage, skillIdFrom } from '../src/skill.js'
import { createStore } from '../src/store.js'

/** A value that exists nowhere else, so finding it anywhere is proof of a leak. */
const CANARY = 'sk_live_CANARY_7f3a9e21d4b85c06_do_not_log'
/** The permit's key field is a bytes32 handle, not a name. The agent cannot even spell the secret. */
const KEY = '0x' + 'cd'.repeat(32)

process.env.LEDGER_PATH = join(mkdtempSync(join(tmpdir(), 'tomoshibi-')), 'default.jsonl')
process.env.SECRETS = JSON.stringify({ [KEY]: CANARY })

const holder = privateKeyToAccount('0x' + '44'.repeat(32))
const skill = privateKeyToAccount('0x' + '55'.repeat(32))
const SKILL = skillIdFrom(skill.address)
let use
before(async () => { ({ use } = await import('../src/server.js')) })

const permitFor = () => ({
  holder: holder.address, skill: SKILL, version: '1.0.0', key: KEY, target: 'api.stripe.com',
  scope: '* /v1', maxCalls: 5, expiry: Math.floor(Date.now() / 1000) + 3600,
  nonce: Math.floor(Math.random() * 1e12),
})

describe('the API key never crosses the boundary', () => {
  test('the agent names a label, and gets back no secret — not in the result, the trail, or the model prompt', async () => {
    const path = join(mkdtempSync(join(tmpdir(), 'tomoshibi-')), 'l.jsonl')
    const store = createStore(path)
    const permit = permitFor()
    const signature = await holder.signTypedData({ domain: DOMAIN, types: TYPES, primaryType: 'Permit', message: normalize(permit) })

    // What the agent sends: a label. It has no way to name the secret, because it does not have it.
    const request = { method: 'GET', url: 'https://api.stripe.com/v1/balance', keyRef: KEY }
    assert.equal(JSON.stringify(request).includes(CANARY), false, 'the agent cannot even name the secret')

    // Everything the sealed model is shown, captured as it is handed over.
    let shownToModel = null
    const weigh = async (lines, req) => {
      shownToModel = JSON.stringify({ lines, req })
      return { ok: true, reachable: true, tier: 'routine', reason: 'test', requestId: 'req_x', model: 'fake', ms: 1, usage: null }
    }

    // Everything the outbound call receives, captured at the only place the plaintext is used.
    let sentToTarget = null
    const execute = async (req, secret) => {
      sentToTarget = secret
      return { status: 200, body: JSON.stringify({ ok: true }) }
    }

    const skillSignature = await skill.signMessage({ message: skillMessage(requestHash(permit, request)) })
    const result = await use({ permit, signature, request, skillSignature }, { store, weigh, execute })
    assert.equal(result.decision, 'ALLOWED')

    // 1. The egress call is the one and only place the plaintext appears.
    assert.equal(sentToTarget, CANARY, 'the secret is substituted at the edge')

    // 2. Nothing handed back to the agent contains it.
    assert.equal(JSON.stringify(result).includes(CANARY), false, 'the secret reached the agent')

    // 3. The sealed model is never shown it either — it decides weight from the request, not the credential.
    assert.equal(shownToModel.includes(CANARY), false, 'the secret reached the model')

    // 4. The trail is written to be public. It must carry the label and never the value.
    const trail = readFileSync(path, 'utf8')
    assert.equal(trail.includes(CANARY), false, 'the secret reached the public trail')
    assert.equal(trail.includes(KEY), true, 'the trail records which key was used, by label')
  })

  test('a refusal leaks nothing either — the path that stops is the path least looked at', async () => {
    const path = join(mkdtempSync(join(tmpdir(), 'tomoshibi-')), 'l.jsonl')
    const store = createStore(path)
    const permit = permitFor()
    const signature = await holder.signTypedData({ domain: DOMAIN, types: TYPES, primaryType: 'Permit', message: normalize(permit) })
    const request = { method: 'POST', url: 'https://evil.com/v1/charges', keyRef: KEY }
    const skillSignature = await skill.signMessage({ message: skillMessage(requestHash(permit, request)) })

    const weigh = async () => ({ ok: true, reachable: true, tier: 'routine', reason: 'test', requestId: 'r', model: 'fake', ms: 1, usage: null })
    const result = await use({ permit, signature, request, skillSignature }, { store, weigh })
    assert.equal(result.decision, 'DENIED')
    assert.equal(JSON.stringify(result).includes(CANARY), false)
    assert.equal(readFileSync(path, 'utf8').includes(CANARY), false)
  })
})
