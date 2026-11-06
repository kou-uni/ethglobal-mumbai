// Tests for World (Agent Pass). **No network** (fetch and JWKS are stubbed out).
import { test, before, describe } from 'node:test'
import assert from 'node:assert/strict'
import { generateKeyPair, SignJWT, exportJWK, createLocalJWKSet } from 'jose'
import { deviceStart, pollOnce, waitForHuman, verifyIdToken, WORLD_DENIED } from '../src/world.js'
import { createStore } from '../src/store.js'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

let vouch
before(async () => { ({ vouch } = await import('../src/server.js')) })

const reply = (status, body) => async () => ({ status, text: async () => JSON.stringify(body) })
const CLIENT = 'app_tomoshibi'
const freshStore = () => createStore(join(mkdtempSync(join(tmpdir(), 'tomoshibi-')), 'l.jsonl'))

describe('the cue shown on the owner\'s device', () => {
  test('receives a device_code and a user_code', async () => {
    const r = await deviceStart({ clientId: CLIENT, fetch: reply(200, {
      device_code: 'dc_1', user_code: 'WXYZ-1234', verification_uri: 'https://world.org/device', expires_in: 600, interval: 5,
    }) })
    assert.equal(r.ok, true)
    assert.equal(r.userCode, 'WXYZ-1234')
    assert.equal(r.interval, 5)
  })

  test('with no client_id it fails without calling out', async () => {
    const r = await deviceStart({ clientId: '', fetch: async () => { throw new Error('must not be called') } })
    assert.equal(r.ok, false)
    assert.equal(r.error.includes('WORLD_CLIENT_ID'), true)
  })
})

describe('refusing and not pressing are kept apart', () => {
  test('while waiting it is pending', async () => {
    const r = await pollOnce('dc_1', { clientId: CLIENT, fetch: reply(400, { error: 'authorization_pending' }) })
    assert.equal(r.pending, true)
    assert.equal(r.denied, undefined)
  })

  test('if the owner refuses, human_denied', async () => {
    const r = await pollOnce('dc_1', { clientId: CLIENT, fetch: reply(400, { error: 'access_denied' }) })
    assert.equal(r.denied, WORLD_DENIED.access_denied)
  })

  test('an expiry becomes proof_expired', async () => {
    const r = await pollOnce('dc_1', { clientId: CLIENT, fetch: reply(400, { error: 'expired_token' }) })
    assert.equal(r.denied, WORLD_DENIED.expired_token)
  })

  test('when the wait runs out it becomes expired (never let through on our own)', async () => {
    const r = await waitForHuman('dc_1', {
      clientId: CLIENT, interval: 1, expiresIn: 1, sleep: 0,
      fetch: reply(400, { error: 'authorization_pending' }),
    })
    assert.equal(r.ok, false)
    assert.equal(r.denied, WORLD_DENIED.expired_token)
  })
})

describe('an id_token is only trusted via JWKS', () => {
  const make = async (over = {}) => {
    const { publicKey, privateKey } = await generateKeyPair('RS256')
    const jwk = { ...(await exportJWK(publicKey)), alg: 'RS256', kid: 'k1' }
    const token = await new SignJWT({ ...over.claims })
      .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
      .setIssuer(over.iss ?? 'https://auth.world.org')
      .setAudience(over.aud ?? CLIENT)
      .setSubject(over.sub ?? '0xsector_abc')
      .setExpirationTime(over.exp ?? '5m')
      .sign(privateKey)
    return { token, jwks: createLocalJWKSet({ keys: [jwk] }) }
  }

  test('a correct signature, issuer and audience pass, and sub becomes the pseudonym', async () => {
    const { token, jwks } = await make()
    const r = await verifyIdToken(token, { clientId: CLIENT, jwks })
    assert.equal(r.ok, true)
    assert.equal(r.nullifier, '0xsector_abc')
  })

  test('a wrong audience does not pass', async () => {
    const { token, jwks } = await make({ aud: 'someone_else' })
    const r = await verifyIdToken(token, { clientId: CLIENT, jwks })
    assert.equal(r.ok, false)
  })

  test('a wrong issuer does not pass', async () => {
    const { token, jwks } = await make({ iss: 'https://evil.example' })
    const r = await verifyIdToken(token, { clientId: CLIENT, jwks })
    assert.equal(r.ok, false)
  })

  test('an expired token does not pass', async () => {
    const { token, jwks } = await make({ exp: Math.floor(Date.now() / 1000) - 10 })
    const r = await verifyIdToken(token, { clientId: CLIENT, jwks })
    assert.equal(r.ok, false)
  })
})

describe('a star only appears once it is confirmed', () => {
  const human = (nullifier) => ({
    waitForHuman: async () => ({ ok: true, idToken: 't' }),
    verifyIdToken: async () => ({ ok: true, nullifier }),
  })

  test('a STAR is recorded and counted per version', async () => {
    const store = freshStore()
    const r = await vouch({ deviceCode: 'dc', skill: 'skill_a', version: '1.0.0' }, { store, world: human('0xA') })
    assert.equal(r.decision, 'STAR')
    assert.equal(store.starCount('skill_a', '1.0.0'), 1)
  })

  test('the same person cannot star the same version twice', async () => {
    const store = freshStore()
    await vouch({ deviceCode: 'dc', skill: 'skill_a', version: '1.0.0' }, { store, world: human('0xA') })
    const again = await vouch({ deviceCode: 'dc', skill: 'skill_a', version: '1.0.0' }, { store, world: human('0xA') })
    assert.equal(again.decision, 'VOUCH_DENIED')
    assert.equal(again.reason, 'ALREADY_VOUCHED')
    assert.equal(store.starCount('skill_a', '1.0.0'), 1)
  })

  test('**when the version changes, the stars all go out at once** (the previous count stays)', async () => {
    const store = freshStore()
    await vouch({ deviceCode: 'd1', skill: 'skill_a', version: '1.0.0' }, { store, world: human('0xA') })
    await vouch({ deviceCode: 'd2', skill: 'skill_a', version: '1.0.0' }, { store, world: human('0xB') })
    assert.equal(store.starCount('skill_a', '1.0.0'), 2)
    assert.equal(store.starCount('skill_a', '1.0.1'), 0)
    assert.deepEqual(store.starsOf('skill_a'), { '1.0.0': 2 })
  })

  test('if the owner refuses, the refusal stays in the trail (and no star appears)', async () => {
    const store = freshStore()
    const denied = { waitForHuman: async () => ({ ok: false, denied: 'human_denied', error: 'access_denied' }) }
    const r = await vouch({ deviceCode: 'dc', skill: 'skill_a', version: '1.0.0' }, { store, world: denied })
    assert.equal(r.decision, 'VOUCH_DENIED')
    assert.equal(r.reason, 'human_denied')
    assert.equal(store.starCount('skill_a', '1.0.0'), 0)
  })

  test('no star appears if the id_token cannot be trusted', async () => {
    const store = freshStore()
    const bad = { waitForHuman: async () => ({ ok: true, idToken: 't' }), verifyIdToken: async () => ({ ok: false, error: 'wrong signature' }) }
    const r = await vouch({ deviceCode: 'dc', skill: 'skill_a', version: '1.0.0' }, { store, world: bad })
    assert.equal(r.reason, 'BAD_ID_TOKEN')
  })
})
