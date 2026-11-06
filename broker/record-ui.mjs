#!/usr/bin/env node
// Builds the scenes.json the demo page reads. **Nothing is made up: the responses from the live 0G are saved as they came back.**
//   node record-ui.mjs http://127.0.0.1:8797 http://127.0.0.1:8798
// The second argument is a Broker that cannot reach 0G. It is needed to record a real STOPPED.
import { writeFileSync, existsSync } from 'node:fs'
import { privateKeyToAccount } from 'viem/accounts'
import { DOMAIN, TYPES, normalize, lines, requestHash } from './src/permit.js'
import { skillMessage, skillIdFrom } from './src/skill.js'

const BASE = process.argv[2] ?? 'http://127.0.0.1:8787'
const DEAF = process.argv[3] ?? null
const me = privateKeyToAccount('0x' + '11'.repeat(32))
const skill = privateKeyToAccount('0x' + '33'.repeat(32))
const KEY = '0x' + 'ab'.repeat(32)
const now = () => Math.floor(Date.now() / 1000)

const mk = (over) => ({
  holder: me.address, skill: skillIdFrom(skill.address), version: '1.0.0', key: KEY,
  target: 'api.stripe.com', scope: 'POST /v1/charges', maxCalls: 2,
  expiry: now() + 3600, nonce: Date.now() + Math.floor(Math.random() * 1000), ...over,
})
const sign = (p) => me.signTypedData({ domain: DOMAIN, types: TYPES, primaryType: 'Permit', message: normalize(p) })

const scenes = []
const shot = async (s) => {
  const { base = BASE, permit, request, signSkill = true } = s
  const body = { permit, signature: await sign(permit), request }
  if (signSkill) body.skillSignature = await skill.signMessage({ message: skillMessage(requestHash(permit, request)) })
  const t0 = Date.now()
  const r = await fetch(`${base}/use`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  const out = await r.json()
  scenes.push({
    id: s.id, title: s.title, say: s.say, caption: s.caption,
    agent: s.agent, request, permitLines: lines(permit), status: r.status,
    ms: Date.now() - t0, response: out,
  })
  console.log(`  ${out.decision.padEnd(11)} ${s.id}  ${Date.now() - t0}ms`)
  return out
}

const standing = mk({ target: 'api.github.com', scope: 'GET /user/repos' })
const heavyPermit = mk({ maxCalls: 5 })
const pressPermit = mk({ maxCalls: 1 })
const getRepos = { method: 'GET', url: 'https://api.github.com/user/repos', keyRef: KEY }
const charge = { method: 'POST', url: 'https://api.stripe.com/v1/charges', keyRef: KEY,
  body: JSON.stringify({ amount: 480000, currency: 'usd', transfer_destination: 'acct_unknown' }) }

console.log('recording (these go to the live 0G)…')
const ok = await shot({ id: 'usual', title: 'inside the scope, a routine request', agent: 'research helper',
  say: 'A routine read just passes. The key was never handed to this agent.',
  caption: '0G read it as routine, so it passes on the standing permit', permit: standing, request: getRepos })

await shot({ id: 'heavy', title: 'inside the scope, but the body is heavy', agent: 'bookkeeping automation',
  say: 'The same scope. But the body is a $4,800 transfer to an account nobody has seen.',
  caption: '0G read it as decisive. A standing permit is not enough', permit: heavyPermit, request: charge })

await shot({ id: 'pressed', title: 'pressed right now', agent: 'bookkeeping automation',
  say: 'The four lines appear on the device in your hand. Only once you press does this one call go through.',
  caption: 'A single-use permit (maxCalls=1). Without the press the key is not used', permit: pressPermit, request: charge })

await shot({ id: 'denied-host', title: 'a request outside the declared scope', agent: 'hijacked skill',
  say: 'The target is wrong. It stops here. And who asked for it stays on the record, signature and all.',
  caption: '0G never saw it. Out of scope is stopped before the body leaves',
  permit: mk({}), request: { method: 'POST', url: 'https://evil.com/v1/charges', keyRef: KEY } })

await shot({ id: 'denied-sneak', title: 'a request with the name hidden in the hostname', agent: 'hijacked skill',
  say: 'Slipping the right target into the middle of the URL does not get through.',
  caption: 'The match is on the host, not on the string',
  permit: mk({}), request: { method: 'POST', url: 'https://evil.com/api.stripe.com/v1/charges', keyRef: KEY } })

if (DEAF) {
  await shot({ id: 'stopped', title: 'when 0G cannot be reached', agent: 'bookkeeping automation', base: DEAF,
    say: 'The thing that decides the weight is unreachable. No default is invented here. It stops.',
    caption: 'Better to stop than to fake a judgement. The call budget is untouched', permit: mk({ maxCalls: 5 }), request: charge })
}

// ── pre-signed bodies, so the page can re-send them live ──
// The page (the browser) holds no key, and never will. So we hand it something signed here.
// For the press case, prepare **20 single-use permits** (one is spent per press; that matches the real thing).
const bundle = async (permit, request, base = BASE) => ({
  base, request, lines: lines(permit),
  body: {
    permit, signature: await sign(permit), request,
    skillSignature: await skill.signMessage({ message: skillMessage(requestHash(permit, request)) }),
  },
})
const many = (over) => mk({ ...over, maxCalls: 50, expiry: now() + 86400 })
const live = {
  usual: await bundle(many({ target: 'api.github.com', scope: 'GET /user/repos' }), getRepos),
  heavy: await bundle(many({}), charge),
  'denied-host': await bundle(many({}), { method: 'POST', url: 'https://evil.com/v1/charges', keyRef: KEY }),
  'denied-sneak': await bundle(many({}), { method: 'POST', url: 'https://evil.com/api.stripe.com/v1/charges', keyRef: KEY }),
  stopped: DEAF ? await bundle(many({}), charge, DEAF) : null,
  presses: [],
}
for (let i = 0; i < 20; i++) {
  live.presses.push(await bundle(mk({ maxCalls: 1, expiry: now() + 86400, nonce: Date.now() + 10000 + i }), charge))
}

const seal = await (await fetch(`${BASE}/seal`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ thread: ok.thread }) })).json()
const trace = await (await fetch(`${BASE}/trace/${ok.thread}`)).json()
const health = await (await fetch(`${BASE}/health`)).json()

// ui/scenes.json is the source of truth for the recording. If web/ exists, put the same file there (**so the two recordings never disagree**)
const payload = JSON.stringify({
  recordedAt: new Date().toISOString(),
  note: 'Responses from the live 0G Private Computer (TeeML), saved exactly as they came back. Nothing is made up.',
  endpoint: health.zg.endpoint, model: health.zg.model, simulated: Boolean(health.zg.simulated),
  scenes, live, seal, trace: { thread: trace.thread, count: trace.records.length, records: trace.records },
}, null, 2) + '\n'
writeFileSync(new URL('../ui/scenes.json', import.meta.url), payload)
if (existsSync(new URL('../web/', import.meta.url))) writeFileSync(new URL('../web/scenes.json', import.meta.url), payload)
console.log(`\n${scenes.length} scenes in ../ui/scenes.json. root ${seal.rootHash ?? '—'}`)
