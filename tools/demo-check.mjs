#!/usr/bin/env node
// Is the demo ready to be filmed? One line per thing, and no secret is ever printed.
//   node tools/demo-check.mjs [bridge-port]
const BRIDGE = `http://127.0.0.1:${process.argv[2] ?? 8791}`
const get = async (u, ms = 5000) => { try { const r = await fetch(u, { signal: AbortSignal.timeout(ms) }); return { status: r.status, body: await r.json().catch(() => null) } } catch (e) { return { error: String(e.cause?.code ?? e.message ?? e) } } }
const post = async (u, b, ms = 40000) => { try { const r = await fetch(u, { method: 'POST', body: JSON.stringify(b ?? {}), signal: AbortSignal.timeout(ms) }); return { status: r.status, body: await r.json().catch(() => null) } } catch (e) { return { error: String(e.cause?.code ?? e.message ?? e) } } }
const rows = []
const say = (mark, what, note = '') => rows.push([mark, what, note])
const OK = 'ok  ', SIM = 'SIM ', NO = 'NO  '

const b = await get('http://127.0.0.1:8797/health')
if (!b.body?.ok) say(NO, 'Broker (8797)', b.error ?? `status ${b.status}`)
else {
  say(OK, 'Broker (8797)', `execute=${b.body.execute}`)
  const zg = b.body.zg ?? {}
  if (zg.simulated) say(SIM, '0G judgement', 'no ZG_API_KEY in broker/.env.local — a stand-in decides. Cannot be filmed.')
  else if (!zg.apiKey) say(NO, '0G judgement', 'no API key loaded')
  else say(OK, '0G judgement', `${zg.model} · key loaded`)
  say(zg.storageKey ? OK : NO, '0G Storage', zg.storageKey ? 'signing key loaded' : 'no ZG_PRIVATE_KEY — records stay local, and the page says "not uploaded"')
  const w = await post('http://127.0.0.1:8797/vouch/start')
  if (w.body?.simulated) say(SIM, 'World', 'no WORLD_CLIENT_ID in broker/.env.local — nobody is asked. Cannot be filmed.')
  else if (w.status === 200 && w.body?.userCode) say(OK, 'World', `device flow answered · code ${String(w.body.userCode).length} chars · link ${w.body.verificationUri ? 'given' : 'missing'}`)
  else say(NO, 'World', w.body?.error ?? w.error ?? `status ${w.status}`)
}
const d = await get('http://127.0.0.1:8798/health')
say(d.body?.ok ? OK : NO, 'Broker without 0G (8798)', d.body?.ok ? 'for the STOPPED scene' : (d.error ?? ''))
const br = await get(BRIDGE + '/health', 8000)
say(br.body?.ready ? OK : NO, 'Ledger', br.body?.ready ? `Tomoshibi ${br.body.version} open` : (br.body?.error ?? (br.body?.app ? `open app is ${br.body.app}, not Tomoshibi` : br.error ?? 'bridge not answering')))
const a = await get('http://127.0.0.1:8792/health')
say(a.body?.ok ? OK : NO, 'AI tool (agent, 8792)', a.body?.ok ? `sees Ledger: ${a.body.device} · STOPPED scene: ${a.body.deaf}` : (a.error ?? ''))
const p = await get('http://127.0.0.1:8790/scenes.json')
say(p.status === 200 ? OK : NO, 'Pages (8790)', p.status === 200 ? 'http://localhost:8790/app.html' : (p.error ?? `status ${p.status}`))

for (const [m, w, n] of rows) console.log(`${m} ${w.padEnd(26)} ${n}`)
const bad = rows.filter((r) => r[0] === NO).length, sim = rows.filter((r) => r[0] === SIM).length
console.log(bad || sim ? `\nNot ready to film: ${bad} missing, ${sim} simulated.` : '\nReady. Nothing is simulated.')
process.exit(bad ? 1 : 0)
