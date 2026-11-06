#!/usr/bin/env node
// The AI tool in the demo, as its own small process. The gate page (web/gate.html) tells it
// which request to try; it signs the request with the tool's own key and sends it to the Broker.
// It never holds the API key, and it cannot sign a Permit: only the Ledger can.
//
//   node demo-agent.mjs [broker] [bridge] [deaf-broker]
//   defaults: http://127.0.0.1:8787  http://127.0.0.1:8791  (none)
//   listens on 127.0.0.1:8792 (PORT_AGENT to change)
//
// With bridge/bridge.py running and Tomoshibi open on the device, Permits are signed on the
// Ledger. Without a device it falls back to a software key and says so in every answer
// (`device: false`). The page shows that; it is not hidden.
import { createServer } from 'node:http'
import { privateKeyToAccount } from 'viem/accounts'
import { keccak256, toHex } from 'viem'
import { DOMAIN, TYPES, normalize, lines, requestHash } from './src/permit.js'
import { skillMessage, skillIdFrom } from './src/skill.js'

const BROKER = (process.argv[2] ?? 'http://127.0.0.1:8787').replace(/\/$/, '')
const BRIDGE = (process.argv[3] ?? 'http://127.0.0.1:8791').replace(/\/$/, '')
const DEAF = process.argv[4] ? process.argv[4].replace(/\/$/, '') : null   // a Broker that cannot reach 0G
const PORT = Number(process.env.PORT_AGENT ?? 8792)

const skill = privateKeyToAccount('0x' + '33'.repeat(32))        // the tool's own key (a demo key)
const softHolder = privateKeyToAccount('0x' + '11'.repeat(32))   // stand-in when no Ledger is plugged in
const KEY_LABEL = 'stripe-live'
const KEY = keccak256(toHex(KEY_LABEL))
const RANGE = { target: 'api.stripe.com', scope: 'POST /v1/charges' }
const now = () => Math.floor(Date.now() / 1000)

// What the tool tries, in the order the page shows them.
const REQUESTS = {
  usual: { method: 'POST', url: 'https://api.stripe.com/v1/charges',
    body: JSON.stringify({ amount: 1200, currency: 'usd', customer: 'cus_regular_monthly', description: 'Monthly plan' }) },
  heavy: { method: 'POST', url: 'https://api.stripe.com/v1/charges',
    body: JSON.stringify({ amount: 480000, currency: 'usd', transfer_destination: 'acct_unknown' }) },
  'denied-host': { method: 'POST', url: 'https://evil.com/v1/charges' },
  'denied-sneak': { method: 'POST', url: 'https://evil.com/api.stripe.com/v1/charges' },
}
REQUESTS.stopped = REQUESTS.heavy

const post = async (base, path, body, ms = 250000) => {
  const r = await fetch(base + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(ms) })
  return { status: r.status, body: await r.json() }
}
const deviceReady = async () => {
  try { return (await (await fetch(BRIDGE + '/health', { signal: AbortSignal.timeout(4000) })).json()).ready === true } catch { return false }
}

let standing = null   // { permit, signature, device }

/** A Permit, signed on the Ledger if there is one. Resolves when the person holds the button. */
async function permitFor(maxCalls) {
  const fields = { skill: skillIdFrom(skill.address), version: '1.0.0', ...RANGE, maxCalls, expiry: now() + 3600, nonce: Date.now() }
  if (await deviceReady()) {
    const r = await post(BRIDGE, '/permit', { ...fields, keyLabel: KEY_LABEL })
    if (r.status !== 200) return { error: r.body.error ?? 'the Ledger did not sign', declined: r.status === 403 }
    return { permit: r.body.permit, signature: r.body.signature, device: true }
  }
  const permit = { holder: softHolder.address, key: KEY, ...fields }
  const signature = await softHolder.signTypedData({ domain: DOMAIN, types: TYPES, primaryType: 'Permit', message: normalize(permit) })
  return { permit, signature, device: false }
}

/** The tool asks the Broker to use the key. */
async function use(signed, id) {
  const request = { keyRef: signed.permit.key, ...REQUESTS[id] }
  const skillSignature = await skill.signMessage({ message: skillMessage(requestHash(signed.permit, request)) })
  const base = id === 'stopped' && DEAF ? DEAF : BROKER
  const t0 = Date.now()
  const r = await post(base, '/use', { permit: signed.permit, signature: signed.signature, request, skillSignature }, 60000)
  return { status: r.status, ms: Date.now() - t0, response: r.body, request, device: signed.device, lines: lines(signed.permit) }
}

const routes = {
  'GET /health': async () => {
    let broker = null
    try { broker = await (await fetch(BROKER + '/health', { signal: AbortSignal.timeout(4000) })).json() } catch {}
    return { ok: true, broker: BROKER, brokerUp: Boolean(broker), simulated: Boolean(broker?.zg?.simulated), model: broker?.zg?.model,
      device: await deviceReady(), lent: Boolean(standing), holder: standing?.permit.holder, deaf: Boolean(DEAF),
      range: { key: KEY_LABEL, ...RANGE }, skill: skillIdFrom(skill.address), version: '1.0.0' }
  },
  // The first hold: lend the key within a range. Everything after rides on this Permit.
  'POST /lend': async () => {
    const p = await permitFor(5)
    if (p.error) return { ok: false, ...p }
    standing = p
    return { ok: true, device: p.device, holder: p.permit.holder, lines: lines(p.permit) }
  },
  'POST /run': async ({ id }) => {
    if (!REQUESTS[id]) return { ok: false, error: 'unknown request' }
    if (!standing) return { ok: false, error: 'nothing has been lent yet' }
    if (id === 'stopped' && !DEAF) return { ok: false, error: 'no Broker without 0G was given (third argument)', noDeaf: true }
    const out = await use(standing, id)
    if (out.response.decision === 'DENIED' && standing.device) {
      // Show the refusal in the person's hand. Not awaited: the page should not wait for a tap.
      post(BRIDGE, '/notice', { kind: 'blocked', text: `A tool tried to send ${KEY_LABEL} to ${new URL(out.request.url).hostname}` }, 8000).catch(() => {})
      out.shownOnDevice = true
    }
    return { ok: true, ...out }
  },
  // The second hold: one Permit, one use, for the request the Broker would not let through.
  'POST /press': async ({ id = 'heavy' }) => {
    const p = await permitFor(1)
    if (p.error) return { ok: false, ...p }
    return { ok: true, ...(await use(p, id)) }
  },
  'POST /reset': async () => { standing = null; return { ok: true } },
}

createServer(async (req, res) => {
  const send = (code, obj) => { res.writeHead(code, { 'content-type': 'application/json', 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type' }); res.end(JSON.stringify(obj)) }
  if (req.method === 'OPTIONS') return send(204, {})
  const route = routes[`${req.method} ${new URL(req.url, 'http://x').pathname}`]
  if (!route) return send(404, { error: 'not found' })
  let raw = ''
  for await (const c of req) raw += c
  try { send(200, await route(raw ? JSON.parse(raw) : {})) } catch (e) { send(502, { ok: false, error: String(e.message ?? e) }) }
}).listen(PORT, '127.0.0.1', () => console.log(`demo agent on http://127.0.0.1:${PORT}  broker=${BROKER}  bridge=${BRIDGE}  deaf=${DEAF ?? '—'}`))
