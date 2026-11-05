// World（Agent Pass）の試験。**網には出ない**（fetch と JWKS を替え玉にする）。
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

describe('本人の端末に出す合図', () => {
  test('device_code と user_code を受け取る', async () => {
    const r = await deviceStart({ clientId: CLIENT, fetch: reply(200, {
      device_code: 'dc_1', user_code: 'WXYZ-1234', verification_uri: 'https://world.org/device', expires_in: 600, interval: 5,
    }) })
    assert.equal(r.ok, true)
    assert.equal(r.userCode, 'WXYZ-1234')
    assert.equal(r.interval, 5)
  })

  test('client_id が無ければ、呼ばずに失敗を返す', async () => {
    const r = await deviceStart({ clientId: '', fetch: async () => { throw new Error('呼んではいけない') } })
    assert.equal(r.ok, false)
    assert.equal(r.error.includes('WORLD_CLIENT_ID'), true)
  })
})

describe('「断る」と「押さない」を混ぜない', () => {
  test('待っている間は pending', async () => {
    const r = await pollOnce('dc_1', { clientId: CLIENT, fetch: reply(400, { error: 'authorization_pending' }) })
    assert.equal(r.pending, true)
    assert.equal(r.denied, undefined)
  })

  test('本人が断れば human_denied', async () => {
    const r = await pollOnce('dc_1', { clientId: CLIENT, fetch: reply(400, { error: 'access_denied' }) })
    assert.equal(r.denied, WORLD_DENIED.access_denied)
  })

  test('期限切れは proof_expired', async () => {
    const r = await pollOnce('dc_1', { clientId: CLIENT, fetch: reply(400, { error: 'expired_token' }) })
    assert.equal(r.denied, WORLD_DENIED.expired_token)
  })

  test('待ち切れなければ expired にする（勝手に通さない）', async () => {
    const r = await waitForHuman('dc_1', {
      clientId: CLIENT, interval: 1, expiresIn: 1, sleep: 0,
      fetch: reply(400, { error: 'authorization_pending' }),
    })
    assert.equal(r.ok, false)
    assert.equal(r.denied, WORLD_DENIED.expired_token)
  })
})

describe('id_token は JWKS でしか信じない', () => {
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

  test('正しい署名・発行者・宛先なら通り、sub を仮名にする', async () => {
    const { token, jwks } = await make()
    const r = await verifyIdToken(token, { clientId: CLIENT, jwks })
    assert.equal(r.ok, true)
    assert.equal(r.nullifier, '0xsector_abc')
  })

  test('宛先が違えば通さない', async () => {
    const { token, jwks } = await make({ aud: 'someone_else' })
    const r = await verifyIdToken(token, { clientId: CLIENT, jwks })
    assert.equal(r.ok, false)
  })

  test('発行者が違えば通さない', async () => {
    const { token, jwks } = await make({ iss: 'https://evil.example' })
    const r = await verifyIdToken(token, { clientId: CLIENT, jwks })
    assert.equal(r.ok, false)
  })

  test('期限が切れていれば通さない', async () => {
    const { token, jwks } = await make({ exp: Math.floor(Date.now() / 1000) - 10 })
    const r = await verifyIdToken(token, { clientId: CLIENT, jwks })
    assert.equal(r.ok, false)
  })
})

describe('星は、確かめられたときだけ出る', () => {
  const human = (nullifier) => ({
    waitForHuman: async () => ({ ok: true, idToken: 't' }),
    verifyIdToken: async () => ({ ok: true, nullifier }),
  })

  test('STAR が刻まれ、版ごとに数えられる', async () => {
    const store = freshStore()
    const r = await vouch({ deviceCode: 'dc', skill: 'skill_a', version: '1.0.0' }, { store, world: human('0xA') })
    assert.equal(r.decision, 'STAR')
    assert.equal(store.starCount('skill_a', '1.0.0'), 1)
  })

  test('同じ人は、同じ版に二度出せない', async () => {
    const store = freshStore()
    await vouch({ deviceCode: 'dc', skill: 'skill_a', version: '1.0.0' }, { store, world: human('0xA') })
    const again = await vouch({ deviceCode: 'dc', skill: 'skill_a', version: '1.0.0' }, { store, world: human('0xA') })
    assert.equal(again.decision, 'VOUCH_DENIED')
    assert.equal(again.reason, 'ALREADY_VOUCHED')
    assert.equal(store.starCount('skill_a', '1.0.0'), 1)
  })

  test('**版が変われば、星は一斉に消える**（前の版の数は残る）', async () => {
    const store = freshStore()
    await vouch({ deviceCode: 'd1', skill: 'skill_a', version: '1.0.0' }, { store, world: human('0xA') })
    await vouch({ deviceCode: 'd2', skill: 'skill_a', version: '1.0.0' }, { store, world: human('0xB') })
    assert.equal(store.starCount('skill_a', '1.0.0'), 2)
    assert.equal(store.starCount('skill_a', '1.0.1'), 0)
    assert.deepEqual(store.starsOf('skill_a'), { '1.0.0': 2 })
  })

  test('本人が断れば、断ったことが系譜に残る（星は出ない）', async () => {
    const store = freshStore()
    const denied = { waitForHuman: async () => ({ ok: false, denied: 'human_denied', error: 'access_denied' }) }
    const r = await vouch({ deviceCode: 'dc', skill: 'skill_a', version: '1.0.0' }, { store, world: denied })
    assert.equal(r.decision, 'VOUCH_DENIED')
    assert.equal(r.reason, 'human_denied')
    assert.equal(store.starCount('skill_a', '1.0.0'), 0)
  })

  test('id_token を信用できなければ星は出ない', async () => {
    const store = freshStore()
    const bad = { waitForHuman: async () => ({ ok: true, idToken: 't' }), verifyIdToken: async () => ({ ok: false, error: '署名が違う' }) }
    const r = await vouch({ deviceCode: 'dc', skill: 'skill_a', version: '1.0.0' }, { store, world: bad })
    assert.equal(r.reason, 'BAD_ID_TOKEN')
  })
})
