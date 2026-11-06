#!/usr/bin/env node
// Renders the app screenshots with headless Chrome, at 1x, without browser chrome.
//   node tools/shots.mjs            (needs the pages served: python3 -m http.server 8790 --directory web)
// The app is opened with ?preview=1, so it stays on the recorded answers. Each state below is set through the
// page's own debug handle (window.tomoshibi); the screens are the real ones, the data in them is sample data.
import { spawn } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const PAGES = process.env.PAGES || 'http://127.0.0.1:8790'
const OUT = resolve('assets'), PORT = 9333
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'shots-'))}`, '--no-first-run', '--hide-scrollbars', '--force-device-scale-factor=1', 'about:blank'], { stdio: 'ignore' })
let page = null
for (let i = 0; i < 40 && !page; i++) { await sleep(250); try { page = (await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()).find((t) => t.type === 'page') } catch {} }
if (!page) { chrome.kill(); throw new Error('Chrome did not start') }
const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise((r) => { ws.onopen = r })
let id = 0; const waiting = new Map()
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && waiting.has(d.id)) { waiting.get(d.id)(d); waiting.delete(d.id) } }
const send = (method, params = {}) => new Promise((r) => { const n = ++id; waiting.set(n, r); ws.send(JSON.stringify({ id: n, method, params })) })
const evalJs = async (expression) => { const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || 'page error'); return r.result?.result?.value }
const size = (width, height) => send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false })
const shot = async (name, clip) => { const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, ...(clip ? { clip: { ...clip, scale: 1 } } : {}) }); writeFileSync(join(OUT, name), Buffer.from(r.result.data, 'base64')); console.log('wrote', name) }

await send('Page.enable')
// The cover is no longer rendered here: assets/tomoshibi-cover.png is the cover drawn with the logo (assets/logo/cover).

// ── the app, 1280 wide
await size(1280, 900)
await send('Page.navigate', { url: `${PAGES}/app.html?preview=1` })
for (let i = 0; i < 80; i++) { await sleep(300); if (await evalJs('window.tomoshibi && tomoshibi.mode') === 'preview') break }
await evalJs(`tomoshibi.instant=true; document.getElementById('demo').style.display='none'; const s=document.createElement('style'); s.textContent='*{animation:none!important;transition:none!important}.lit-in #hf{transform:scale(1)!important}'; document.head.appendChild(s); 1`)
const L = ['KEY stripe-live', 'TO api.stripe.com', 'SCOPE * /v1 x20', 'UNTIL 2026-11-13 09:10Z']
const set = (events, ui, extra = '') => evalJs(`(()=>{ const t=window.tomoshibi; t.events.length=0; for (const [i,e] of ${JSON.stringify(events)}.entries()) t.events.push({ n:i, at:new Date().toISOString(), ...e }); Object.assign(t.ui, ${JSON.stringify(ui)}); ${extra}; t.paint(); return document.querySelector('.frame').dataset.view })()`)
const clip = async () => JSON.parse(await evalJs(`(()=>{ const r=document.querySelector('.shell').getBoundingClientRect(), f=document.querySelector('.frame').getBoundingClientRect(); return JSON.stringify({ x: Math.max(0, r.left), y: 0, width: Math.min(1280, r.width), height: Math.ceil(f.bottom + 22) }) })()`))
const ASK = { type: 'asking', why: 'lend', uses: 20, device: true, lines: L }, SIGNED = { type: 'signed', why: 'lend', uses: 20, device: true, holder: '0x19E7…ff2A', lines: L }
const req = (rid, id, what, method, url) => ({ type: 'request', rid, id, tool: 'billing-assistant', what, method, url })
const zg = (tier) => ({ tier, requestId: '809187a22e0429c2' })
const WEEK = [ASK, SIGNED,
  req('r1', 'usual', 'Read the unpaid invoices', 'GET', 'https://api.stripe.com/v1/invoices'), { type: 'verdict', rid: 'r1', ms: 2000, response: { decision: 'ALLOWED', zg: zg('routine') } },
  req('r2', 'usual', 'Read the unpaid invoices', 'GET', 'https://api.stripe.com/v1/invoices'), { type: 'verdict', rid: 'r2', ms: 2000, response: { decision: 'ALLOWED', zg: zg('routine') } },
  req('r3', 'heavy', 'Refund ₹4,800 for order #1042 (a returned bag)', 'POST', 'https://api.stripe.com/v1/refunds'), { type: 'verdict', rid: 'r3', ms: 2100, response: { decision: 'NEEDS_PRESS', reason: 'ESCALATED', zg: zg('decisive') } },
  { type: 'asking', rid: 'r3', why: 'press', uses: 1, device: true, lines: L }]
const base = { surface: 'tomo', opened: true, chat: 1, onb: 'choose', ackLit: true, tab: 'home', friend: 0, world: null, seenRid: null, pending: null, busy: null, gain: null }

console.log(await set([], { ...base, surface: 'ai', chat: 0, opened: false })); await shot('shots/1-the-ai-asks-for-a-file.png', await clip())
console.log(await set([ASK], base)); await shot('shots/2-continue-on-your-ledger.png', await clip())
console.log(await set(WEEK, base)); await shot('shots/3-money-waits-for-your-hand.png', await clip())
const DONE = [...WEEK, { type: 'signed', rid: 'r3', why: 'press', uses: 1, device: true, holder: '0x19E7…ff2A', lines: L }, { type: 'verdict', rid: 'r3', pressed: true, ms: 900, response: { decision: 'ALLOWED', zg: zg('decisive') } },
  req('r4', 'denied-host', 'Send customer data to files.unknown-host.example', 'POST', 'https://files.unknown-host.example/upload'), { type: 'verdict', rid: 'r4', ms: 40, response: { decision: 'DENIED', reason: 'OUT_OF_TARGET' } }]
console.log(await set(DONE, base)); await shot('shots/4-stopped-while-you-slept.png', await clip())
const ALL = [...DONE, req('r5', 'stopped', 'Refund ₹4,800 for order #1042 — while 0G cannot be reached', 'POST', 'https://api.stripe.com/v1/refunds'), { type: 'verdict', rid: 'r5', ms: 2500, response: { decision: 'STOPPED', reason: 'ZG_UNREACHABLE' } }]
console.log(await set(ALL, { ...base, tab: 'activity' })); await shot('shots/5-your-week-four-outcomes.png', await clip())
console.log(await set(ALL, { ...base, tab: 'lights', world: { step: 'done' } }, `t.lights = { ok: true, count: 14, who: [] }`)); await shot('shots/6-you-are-a-guidepost.png', await clip())

ws.close(); chrome.kill()
