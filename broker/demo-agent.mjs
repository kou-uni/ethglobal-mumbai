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
import { createServer } from 'node:http'
import { privateKeyToAccount } from 'viem/accounts'
import { keccak256, toHex } from 'viem'
import { DOMAIN, TYPES, normalize, lines, requestHash } from './src/permit.js'
import { skillMessage, skillIdFrom } from './src/skill.js'

const BROKER = (process.argv[2] ?? 'http://127.0.0.1:8787').replace(/\/$/, '')
const BRIDGE = (process.argv[3] ?? 'http://127.0.0.1:8791').replace(/\/$/, '')
const DEAF = process.argv[4] ? process.argv[4].replace(/\/$/, '') : null   // a Broker that cannot reach 0G
const PORT = Number(process.env.PORT_AGENT ?? 8792)

const TOOL = { name: 'billing-assistant', version: '1.0.0' }
const skill = privateKeyToAccount('0x' + '33'.repeat(32))        // the tool's own key (a demo key)
const softHolder = privateKeyToAccount('0x' + '11'.repeat(32))   // stand-in when no Ledger is plugged in
const KEY_LABEL = 'stripe-live'
const KEY = keccak256(toHex(KEY_LABEL))
// One loan covers both a quiet read and a heavy charge (decision 13): the real 0G judges by whether
// money moves, not by the amount, so a $12 charge would wake the Ledger just like a $4,800 one.
const RANGE = { target: 'api.stripe.com', scope: '* /v1' }
const STANDING_USES = 10
const now = () => Math.floor(Date.now() / 1000)

// What the tool tries. `what` is the request in a person's words.
// What the tool tries, as one story: a shop owner's payment-reminder tool.
// `what` is the request in a person's words.
const REQUESTS = {
  // Every morning it looks up who has not paid yet. Reading only.
  usual: { what: 'Check which orders are still unpaid', method: 'GET', url: 'https://api.stripe.com/v1/invoices?status=open&limit=50' },
  // A customer sent a bag back and the owner asked for the refund. Money leaves her account, so this
  // needs her hand even though she asked for it. The real 0G reads a refund as `decisive` most of the
  // time and `significant` about one time in three, so the demo runs with ZG_ESCALATE=significant:
  // anything where money moves asks for a press (tools/demo-up.sh sets it).
  heavy: { what: 'Refund $62 for order #1042 (a returned bag)', method: 'POST', url: 'https://api.stripe.com/v1/refunds',
    body: JSON.stringify({ charge: 'ch_order_1042', amount: 6200, currency: 'usd', reason: 'requested_by_customer' }) },
  'denied-host': { what: 'Use your payment key at evil.com', hijacked: true, method: 'POST', url: 'https://evil.com/v1/charges' },
  'denied-sneak': { what: 'Use your payment key at evil.com, with the right name hidden in the path', hijacked: true, method: 'POST', url: 'https://evil.com/api.stripe.com/v1/charges' },
}
REQUESTS.stopped = { ...REQUESTS.heavy, what: 'Refund $62 for order #1042 — while 0G cannot be reached' }
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
    : e.type === 'declined' ? `  not signed: ${e.error}` : e.type === 'error' ? `  ! ${e.error}` : null
  if (line) console.log(line)
}

const post = async (base, path, body, ms = 250000) => {
  const r = await fetch(base + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(ms) })
  return { status: r.status, body: await r.json() }
}
const probe = async () => {
  try { return (await (await fetch(BRIDGE + '/health', { signal: AbortSignal.timeout(4000) })).json()).ready === true } catch { return false }
}
// Right after a hold the device is busy showing its own screen and does not answer for a few
// seconds. A Ledger that signed a moment ago is still there: wait for it rather than fall back.
let deviceSeen = 0
const deviceReady = async (waitMs = 0) => {
  const until = Date.now() + waitMs
  for (;;) {
    if (await probe()) { deviceSeen = Date.now(); return true }
    if (Date.now() >= until) return false
    await new Promise((r) => setTimeout(r, 2000))
  }
}

// Look for the device in the background, so /health never waits on a USB exchange.
// Not while a request is in flight, and not in the seconds after a hold, when the device is drawing.
let quietUntil = 0
const watch = async () => { if (!busy && Date.now() > quietUntil) await deviceReady(); setTimeout(watch, 3000) }
setTimeout(watch, 0)

let standing = null    // { permit, signature, device }
let busy = false
let softWait = null    // resolve(true|false) while the page's own button stands in for the Ledger

/** Ask the person for a Permit. On the Ledger if there is one. Resolves when they hold or decline. */
async function ask(uses, why, rid) {
  // A key that was lent on the Ledger is never continued with a software key. If the device
  // has gone quiet, wait for it; if it does not come back, the answer is no.
  const mustBeDevice = Boolean(standing?.device) && why !== 'lend'
  let device = await deviceReady(Date.now() - deviceSeen < 600000 ? 8000 : 0)
  if (!device && mustBeDevice) {
    emit({ type: 'waiting-device', rid, why })
    device = await deviceReady(90000)
    if (!device) { emit({ type: 'declined', rid, why, error: 'the Ledger did not answer' }); return { error: 'the Ledger did not answer' } }
  }
  const fields = { skill: skillIdFrom(skill.address), version: TOOL.version, ...RANGE, maxCalls: uses, expiry: now() + 3600, nonce: Date.now() }
  // The four lines shown on the page come from lines(), the same function the Broker uses on the
  // signed Permit. The page never writes its own version of the range.
  const shown = lines({ holder: softHolder.address, key: KEY, ...fields })
  emit({ type: 'asking', rid, why, uses, device, keyLabel: KEY_LABEL, lines: shown })
  let out
  if (device) {
    const r = await post(BRIDGE, '/permit', { ...fields, keyLabel: KEY_LABEL }).catch((e) => ({ status: 502, body: { error: String(e.message ?? e) } }))
    out = r.status === 200 ? { permit: r.body.permit, signature: r.body.signature, device: true } : { error: r.status === 403 ? 'declined on the device' : (r.body.error ?? 'the Ledger did not sign') }
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
    emit({ type: 'signed', rid, why, uses, device: out.device, holder: out.permit.holder, lines: lines(out.permit) }) }
  return out
}

/** The tool asks the Broker to use the key. */
async function use(signed, id, rid, pressed) {
  const { what, hijacked, ...req } = REQUESTS[id]
  const request = { keyRef: signed.permit.key, ...req }
  const skillSignature = await skill.signMessage({ message: skillMessage(requestHash(signed.permit, request)) })
  const t0 = Date.now()
  const r = await post(id === 'stopped' && DEAF ? DEAF : BROKER, '/use', { permit: signed.permit, signature: signed.signature, request, skillSignature }, 60000)
  emit({ type: 'verdict', rid, pressed: Boolean(pressed), ms: Date.now() - t0, response: r.body, device: signed.device })
  return r.body
}

async function lend() {
  if (busy) return { ok: false, error: 'busy' }
  busy = true
  try { const p = await ask(STANDING_USES, 'lend'); if (!p.error) standing = p; return { ok: !p.error } } finally { busy = false }
}

async function run(id) {
  if (!REQUESTS[id]) return { ok: false, error: 'unknown request' }
  if (busy) return { ok: false, error: 'busy' }
  if (!standing) { emit({ type: 'error', error: 'The key has not been lent yet.' }); return { ok: false, error: 'not lent' } }
  if (id === 'stopped' && !DEAF) { emit({ type: 'error', error: 'No Broker without 0G was started (third argument), so this cannot be shown live.' }); return { ok: false, error: 'no deaf broker' } }
  busy = true
  try {
    const rid = `${epoch}-${events.length}`
    const q = REQUESTS[id]
    emit({ type: 'request', rid, id, tool: TOOL.name, hijacked: Boolean(q.hijacked), what: q.what, method: q.method, url: q.url, body: q.body })
    const b = await use(standing, id, rid)
    if (b.decision === 'DENIED' && standing.device) {
      // Put the refusal in the person's hand. Not awaited: nobody should have to tap for the story to go on.
      post(BRIDGE, '/notice', { kind: 'blocked', text: `A tool tried to send ${KEY_LABEL} to ${new URL(q.url).hostname}` }, 8000)
        .then((r) => emit({ type: 'device', rid, showed: 'BLOCKED', ok: r.status === 200 })).catch(() => {})
    }
    if (b.decision === 'NEEDS_PRESS') {
      // The Broker would not let it through on the standing Permit. Wake the Ledger: one Permit, one use.
      const p = await ask(1, 'press', rid)
      if (!p.error) await use(p, id, rid, true)
    }
    return { ok: true }
  } catch (e) { emit({ type: 'error', error: String(e.message ?? e) }); return { ok: false } } finally { busy = false }
}

function reset() { standing = null; events.length = 0; epoch = Date.now(); if (softWait) softWait(false); return { ok: true } }

const routes = {
  'GET /health': async () => {
    let broker = null
    try { broker = await (await fetch(BROKER + '/health', { signal: AbortSignal.timeout(1500) })).json() } catch {}
    return { ok: true, broker: BROKER, brokerUp: Boolean(broker), simulated: Boolean(broker?.zg?.simulated), execute: Boolean(broker?.execute), worldSimulated: Boolean(broker?.world?.simulated),
      model: broker?.zg?.model, device: Date.now() - deviceSeen < (busy ? 600000 : 20000), lent: Boolean(standing), deaf: Boolean(DEAF),
      tool: TOOL, range: { key: KEY_LABEL, ...RANGE, uses: STANDING_USES }, skill: skillIdFrom(skill.address), version: TOOL.version }
  },
  'GET /events': async (_, url) => { const since = Number(url.searchParams.get('since') ?? 0); return { epoch, events: events.slice(since), busy } },
  'POST /lend': async () => { lend(); return { ok: true } },          // answers at once; the outcome arrives as events
  'POST /run': async ({ id }) => { run(id); return { ok: true } },
  'POST /hold': async ({ ok = true }) => { if (softWait) softWait(Boolean(ok)); return { ok: Boolean(softWait) } },
  // Lighting a light is for the person who lent the key. The page starts World itself, but the
  // last step goes through here so the Permit signed on the Ledger travels with it. The page
  // never sees the signature.
  'POST /vouch/finish': async ({ deviceCode }) => {
    if (!standing) return { decision: 'VOUCH_DENIED', reason: 'NOT_LENT', message: 'No key has been lent from this computer.' }
    const r = await post(BROKER, '/vouch/finish', { deviceCode, skill: skillIdFrom(skill.address), version: TOOL.version, permit: standing.permit, signature: standing.signature }, 660000)
    return { ...r.body, ownerProof: { sent: true, device: standing.device, holder: standing.permit.holder } }
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
}).listen(PORT, '127.0.0.1', () => {
  console.log(`${TOOL.name} (demo agent) on http://127.0.0.1:${PORT}\n  broker ${BROKER} · bridge ${BRIDGE} · deaf ${DEAF ?? '—'}`)
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
