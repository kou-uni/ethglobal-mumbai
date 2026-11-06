#!/usr/bin/env node
// The four moments, with a real Ledger in the loop.
//   node demo-ledger.mjs [broker] [bridge]
//   defaults: http://127.0.0.1:8787  http://127.0.0.1:8791
// Needs the Broker running, bridge/bridge.py running next to the Ledger, and
// the Tomoshibi app open on the device. A person has to hold the button twice.
import { privateKeyToAccount } from 'viem/accounts'
import { requestHash } from './src/permit.js'
import { skillMessage, skillIdFrom } from './src/skill.js'

const BROKER = (process.argv[2] ?? 'http://127.0.0.1:8787').replace(/\/$/, '')
const BRIDGE = (process.argv[3] ?? 'http://127.0.0.1:8791').replace(/\/$/, '')
// The skill's own software key. It signs each request so a violation can be pinned on it.
const skill = privateKeyToAccount('0x' + '33'.repeat(32))
const KEY_LABEL = 'stripe-live'

const post = async (base, path, body) => {
  const r = await fetch(base + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  return { status: r.status, body: await r.json() }
}
const say = (s) => console.log(s)

/** Ask the person, on the device, for a permit. Resolves when they hold the button. */
async function press(maxCalls, why) {
  say(`\n→ Ledger: ${why}`)
  say('  (look at the device: read the range, then hold the button)')
  const r = await post(BRIDGE, '/permit', {
    skill: skillIdFrom(skill.address), version: '1.0.0', keyLabel: KEY_LABEL,
    target: 'api.stripe.com', scope: 'POST /v1/charges', maxCalls,
    expiry: Math.floor(Date.now() / 1000) + 3600, nonce: Date.now(),
  })
  if (r.status !== 200) throw new Error(`bridge: ${r.body.error}`)
  say(`  signed by ${r.body.permit.holder}  (maxCalls=${maxCalls})`)
  return r.body
}

/** The skill asks the Broker to use the key. It never holds the key itself. */
async function use(signed, request, label) {
  const req = { keyRef: signed.permit.key, ...request }
  const thread = requestHash(signed.permit, req)
  const skillSignature = await skill.signMessage({ message: skillMessage(thread) })
  const r = await post(BROKER, '/use', { permit: signed.permit, signature: signed.signature, request: req, skillSignature })
  const b = r.body
  const zg = b.zg ? `  0G: ${b.zg.tier ?? b.zg.error ?? '—'}${b.zg.simulated ? ' [simulated]' : ''}${b.zg.requestId ? ' ' + b.zg.requestId : ''}` : ''
  say(`  ${String(b.decision).padEnd(11)} ${label}${b.reason ? '  ' + b.reason : ''}${b.violation ? '  (recorded against the skill)' : ''}${zg}`)
  return b
}

const health = await (await fetch(BRIDGE + '/health')).json().catch((e) => ({ ok: false, error: String(e) }))
if (!health.ready) { console.error(`The Ledger is not ready: ${health.error ?? `open Tomoshibi (showing ${health.app})`}`); process.exit(1) }
say(`Ledger: ${health.app} ${health.version}   Broker: ${BROKER}`)

// 1. A standing permit. From here on, routine requests do not ask the person again.
const standing = await press(3, 'a standing permit for the skill (3 uses, 1 hour)')

say('\n── inside the range ──')
const ok = await use(standing, { method: 'POST', url: 'https://api.stripe.com/v1/charges' }, 'POST api.stripe.com/v1/charges')

say('\n── outside the range: stopped, and shown on the device ──')
const bad = await use(standing, { method: 'POST', url: 'https://evil.example.com/v1/charges' }, 'POST evil.example.com/v1/charges')
if (bad.decision === 'DENIED') {
  const n = await post(BRIDGE, '/notice', { kind: 'blocked', text: `A skill tried to send ${KEY_LABEL} to evil.example.com` })
  say(`  → Ledger shows BLOCKED${n.status === 200 ? '' : ` (not shown: ${n.body.error})`}   tap the device to close it`)
}

say('\n── a heavy request: a standing permit is not enough ──')
const heavy = { method: 'POST', url: 'https://api.stripe.com/v1/charges', body: 'transfer the full balance out' }
const first = await use(standing, heavy, 'heavy request, standing permit')
if (first.decision === 'NEEDS_PRESS') {
  const once = await press(1, 'this one request, right now (1 use)')
  await use(once, heavy, 'same request, pressed just now')
} else {
  say('  (0G did not judge this one heavy, so no press was asked for)')
}

say(`\n── the record ──\n  ${BROKER}/trace/${ok.thread}`)
