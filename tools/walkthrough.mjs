#!/usr/bin/env node
// Records the 90-second walkthrough of the app as a video: who she is, what bothers her, what she does,
// what TOMOSHIBI does, and what she gets. The screens are the real app, driven click by click; the captions
// are laid over it. Nothing is faked on the way: where a part is a stand-in, the app itself says MOCK.
//
//   node tools/walkthrough.mjs [out.mp4]
//
// Needs the demo running (tools/demo-up.sh) and ffmpeg. It uses whatever is really there:
//   - a Ledger, if one is connected: the recording waits for the real hold (and cuts the waiting out);
//     with none, the page's stand-in button is pressed, and the page says MOCK
//   - HEADFUL=1 opens a visible window, so the person can follow it (and scan World's code from it)
//   - PASTE=1 (with HEADFUL) waits for a Stripe test key to be pasted by hand when the screen asks; otherwise the
//     mock key is used, and the page says MOCK
//   - WORLD=1 lights the tool for real: it shows World's code and waits for the confirmation on the phone
//   - REAL=1 refuses the stand-in: it waits until the Ledger is awake before the row is asked for, and stops if
//     the page had to offer its stand-in button. Use it for the take that is shown to people.
// Next to the video it writes <out>.cues.json: the moments of the two holds, so footage of the hand on the
// Ledger can be laid in at the right places (tools/walkthrough-edit.mjs).
//   - SCENE=row | refuse records one scene only (to lay into an existing take): choosing the API from the list, or
//     the chat where an email sends the tool somewhere else. Everything before the scene runs off camera.
// Env: PAGES (http://127.0.0.1:8790), CHROME, FFMPEG, HEADFUL, REAL, PASTE, WORLD, SCENE, KEEP=1 (keep the frames)
import { spawn, spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const FFMPEG = process.env.FFMPEG || 'ffmpeg'
const PAGES = process.env.PAGES || 'http://127.0.0.1:8790'
const OUT = resolve(process.argv[2] || 'walkthrough.mp4'), PORT = 9334
const W = 1440, H = 810, SCALE = 1920 / W            // a 16:9 page, recorded at 1920×1080
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const REAL = Boolean(process.env.REAL)
const SCENE = process.env.SCENE || ''
const PROOF = Boolean(process.env.PROOF)   // show the proof scenes even where the answers are simulated (to look at the layout)
const dir = mkdtempSync(join(tmpdir(), 'walkthrough-'))

const chrome = spawn(CHROME, [...(process.env.HEADFUL ? [] : ['--headless=new']), `--remote-debugging-port=${PORT}`, `--user-data-dir=${join(dir, 'profile')}`, '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--window-position=0,0', `--window-size=${W},${H + (process.env.HEADFUL ? 90 : 0)}`, 'about:blank'], { stdio: 'ignore' })
let page = null
for (let i = 0; i < 60 && !page; i++) { await sleep(250); try { page = (await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()).find((t) => t.type === 'page') } catch {} }
if (!page) { chrome.kill(); throw new Error('Chrome did not start') }
const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise((r) => { ws.onopen = r })
let id = 0; const waiting = new Map()
// ── frames: Chrome sends one whenever the picture changes. Each is kept with the moment it was shown. ──
const frames = []; let recording = false, cut = 0, pausedAt = 0
ws.onmessage = (m) => {
  const d = JSON.parse(m.data)
  if (d.id && waiting.has(d.id)) { waiting.get(d.id)(d); waiting.delete(d.id); return }
  if (d.method === 'Page.screencastFrame') {
    ws.send(JSON.stringify({ id: ++id, method: 'Page.screencastFrameAck', params: { sessionId: d.params.sessionId } }))
    if (!recording) return
    const name = `f${String(frames.length).padStart(5, '0')}.jpg`
    writeFileSync(join(dir, name), Buffer.from(d.params.data, 'base64'))
    frames.push({ name, t: Date.now() / 1000 - cut })
  }
}
const send = (method, params = {}) => new Promise((r) => { const n = ++id; waiting.set(n, r); ws.send(JSON.stringify({ id: n, method, params })) })
const js = async (expression) => { const r = await send('Runtime.evaluate', { expression: `(async () => { ${expression} })()`, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || 'page error'); return r.result?.result?.value }
const pause = () => { if (recording) { recording = false; pausedAt = Date.now() / 1000 } }
const resume = () => { if (!recording) { if (pausedAt) cut += Date.now() / 1000 - pausedAt; pausedAt = 0; recording = true } }
// The moments worth finding again in the finished video (on the video's own clock).
const cues = []; const cue = (name) => cues.push({ name, t: Date.now() / 1000 - cut })

await send('Page.enable')
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: SCALE, mobile: false })
await send('Page.navigate', { url: `${PAGES}/app.html` })
let mode = null
for (let i = 0; i < 80; i++) { await sleep(300); mode = await js('return window.tomoshibi && tomoshibi.mode').catch(() => null); if (mode === 'live' || mode === 'preview') break }
if (mode !== 'live' && mode !== 'preview') { chrome.kill(); throw new Error('the app did not start') }
console.log('the app is', mode)

// ── what is laid over the app: one caption line, a pointer that shows where the click lands, and two cards ──
await js(`
  sessionStorage.clear(); document.querySelector('[data-act="reset"]')?.click(); await new Promise((r) => setTimeout(r, 2200)); document.querySelector('[data-act="reset"]')?.click()
  const st = document.createElement('style'); st.textContent = \`
    #demo{display:none!important} .shared{display:none!important}
    #wtcap{position:fixed;left:0;right:0;bottom:0;height:116px;background:#111;color:#fff;display:flex;align-items:center;gap:22px;padding:0 60px;z-index:9998}
    #wtcap i{font-style:normal;background:#FFF05A;color:#111;font-weight:800;font-size:14px;letter-spacing:.12em;padding:7px 15px;border-radius:99px;white-space:nowrap;flex:none}
    #wtcap b{font-size:28px;line-height:1.28;font-weight:700;letter-spacing:-.01em;transition:opacity .22s}
    #wtcard{position:fixed;inset:0;background:#111;color:#fff;z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px;text-align:center;transition:opacity .45s;padding:0 120px}
    #wtcard img{width:92px;height:92px} #wtcard h1{font-size:68px;margin:0;letter-spacing:-.035em;line-height:1.05} #wtcard p{font-size:31px;margin:0;line-height:1.4;color:#e9e6df} #wtcard p b{color:#FFF05A}
    #wtcard small{font-size:17px;color:#FFF05A;letter-spacing:.16em;font-weight:800}
    #wtcur{position:fixed;width:30px;height:30px;margin:-15px 0 0 -15px;border-radius:50%;background:rgba(255,240,90,.6);border:3px solid #111;box-shadow:0 0 0 3px rgba(255,255,255,.7);z-index:9997;pointer-events:none;left:62%;top:55%;transition:left .5s cubic-bezier(.3,.8,.3,1),top .5s cubic-bezier(.3,.8,.3,1),transform .14s}
    #wtcur.down{transform:scale(.62)}
    #wttick{position:fixed;right:0;bottom:0;width:3px;height:3px;z-index:10000;background:#111}
    #wtring{position:fixed;border:4px solid #FFF05A;border-radius:12px;box-shadow:0 0 0 3px #111,0 0 0 9999px rgba(17,17,17,.42);z-index:9996;display:none;pointer-events:none}
    #wtframe{position:fixed;left:50%;top:20px;transform:translateX(-50%);width:1080px;height:654px;z-index:9996;display:none;border:4px solid #111;border-radius:18px;overflow:hidden;box-shadow:0 0 0 9999px rgba(17,17,17,.6);background:#fff}
    #wtframe iframe,#wtframe img{width:100%;height:100%;border:0;display:block;object-fit:cover;object-position:top left}
    #wtframe .ev{padding:26px 34px;font-size:19px;color:#111;height:100%;box-sizing:border-box;background:#fff}
    #wtframe .ev h2{margin:0 0 4px;font-size:27px;letter-spacing:-.02em} #wtframe .ev p{margin:0 0 14px;color:#6b6580;font-size:15px}
    #wtframe .ev h3{margin:16px 0 6px;font-size:13px;letter-spacing:.12em;color:#111;background:#FFF05A;display:inline-block;padding:4px 12px;border-radius:99px}
    #wtframe .ev dl{margin:0;display:grid;grid-template-columns:230px 1fr;gap:7px 18px;align-items:baseline} #wtframe .ev dt{color:#6b6580;font-size:16px} #wtframe .ev dd{margin:0;font:600 16.5px/1.35 ui-monospace,Menlo,monospace;word-break:break-all}\`
  document.head.appendChild(st)
  for (const [tag, id] of [['div', 'wtcap'], ['div', 'wtcur'], ['div', 'wtcard'], ['div', 'wttick'], ['div', 'wtring'], ['div', 'wtframe']]) { const e = document.createElement(tag); e.id = id; document.body.appendChild(e) }
  document.getElementById('wtcap').innerHTML = '<i></i><b></b>'; document.getElementById('wtcap').style.display = 'none'; document.getElementById('wtcard').style.display = 'none'
  const W = (ms) => new Promise((r) => setTimeout(r, ms)), cur = document.getElementById('wtcur')
  let tick = 0; setInterval(() => { document.getElementById('wttick').style.background = (tick ^= 1) ? '#121212' : '#111' }, 90)
  const to = async (el) => { const r = el.getBoundingClientRect(); cur.style.left = (r.left + Math.min(r.width / 2, 260)) + 'px'; cur.style.top = (r.top + r.height / 2) + 'px'; await W(620) }
  window.wt = {
    W, view: () => document.querySelector('#root .frame')?.dataset.view,
    say: async (chip, text) => { const c = document.getElementById('wtcap'); c.style.display = 'flex'; const b = c.querySelector('b'); b.style.opacity = 0; await W(180); c.querySelector('i').textContent = chip; b.textContent = text; b.style.opacity = 1 },
    card: (html) => { const c = document.getElementById('wtcard'); c.innerHTML = html; c.style.display = 'flex'; c.style.opacity = 1 },
    uncard: async () => { const c = document.getElementById('wtcard'); c.style.opacity = 0; await W(480); c.style.display = 'none' },
    click: async (sel) => { const el = document.querySelector(sel); if (!el) return false; await to(el); cur.classList.add('down'); await W(150); el.click(); cur.classList.remove('down'); await W(120); return true },
    pick: async (sel, value) => { const el = document.querySelector(sel); if (!el) return false; await to(el); cur.classList.add('down'); await W(150); el.value = value; el.dispatchEvent(new Event('change', { bubbles: true })); cur.classList.remove('down'); return true },
    hold: async () => { const el = document.querySelector('[data-hold]'); if (!el) return false; await to(el); cur.classList.add('down'); el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); await W(1400); document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true })); cur.classList.remove('down'); return true },
    ring: (sel) => { const el = document.querySelector(sel); if (!el) return false; const r = el.getBoundingClientRect(), d = document.getElementById('wtring'); Object.assign(d.style, { display: 'block', left: (r.left - 10) + 'px', top: (r.top - 7) + 'px', width: (r.width + 20) + 'px', height: (r.height + 14) + 'px' }); cur.style.opacity = 0; return true },
    unring: () => { document.getElementById('wtring').style.display = 'none'; cur.style.opacity = 1 },
    frame: (html) => { const f = document.getElementById('wtframe'); f.innerHTML = html; f.style.display = 'block'; cur.style.opacity = 0 },
    unframe: () => { const f = document.getElementById('wtframe'); f.style.display = 'none'; f.innerHTML = ''; cur.style.opacity = 1 },
    until: async (fn, ms) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { if (fn()) return true } catch {} await W(150) } return false },
    st: () => { const s = tomoshibi.reduce(); const c = s.cards[s.cards.length - 1]; return { lent: Boolean(s.lent), asking: s.asking ? s.asking.why : null, device: Boolean(s.asking && s.asking.device), last: c ? (c.verdicts.length ? c.verdicts[c.verdicts.length - 1].response.decision + (c.verdicts[c.verdicts.length - 1].pressed ? '+pressed' : '') : 'checking') : null, n: s.cards.length } },
  }
`)
const view = () => js('return wt.view()')
const say = (chip, text, ms = 0) => js(`await wt.say(${JSON.stringify(chip)}, ${JSON.stringify(text)}); await wt.W(${ms})`)
const click = (sel, ms = 0) => js(`const ok = await wt.click(${JSON.stringify(sel)}); await wt.W(${ms}); return ok`)
const wait = (ms) => sleep(ms)
const until = (cond, ms) => js(`return await wt.until(() => (${cond}), ${ms})`)
/** Wait for an answer. A little of the waiting is shown; if 0G is slow, the rest is left out of the video. */
async function answer(cond, keepMs = 1500, max = 150000) {
  await wait(keepMs); if (await until(cond, 500)) return true
  pause(); const ok = await until(cond, max); await sleep(300); resume(); return ok
}
/** REAL: the first row is only real if the tool can see the Ledger at the moment it asks. Wait for it, off camera. */
async function ledgerAwake() {
  if (!REAL) return
  const seen = () => js(`try { return (await (await fetch(window.appAgent + '/health', { cache: 'no-store' })).json()).device === true } catch { return false }`)
  if (await seen()) return
  console.log('  waiting for the Ledger: unlock it and open TOMOSHIBI…'); pause()
  for (let i = 0; i < 240 && !(await seen()); i++) await sleep(1500)
  if (!(await seen())) throw new Error('no Ledger was seen')
  await sleep(1500); resume(); console.log('  the Ledger is there')
}
/** A hold. On the page's stand-in if there is no Ledger (the page says MOCK); otherwise wait for the real one, and leave the waiting out of the video. */
async function hold(what) {
  // If the Ledger went to sleep, the tool waits for it before it asks. That waiting is left out too.
  if (!(await until(`wt.st().asking === '${what}'`, 6000))) { pause(); const asked = await until(`wt.st().asking === '${what}'`, 120000); resume(); if (!asked) throw new Error(`"${what}" was never asked for`) }
  cue(`${what}-asked`)
  await wait(900)
  if (await js('return Boolean(document.querySelector("[data-hold]"))')) {
    if (REAL) throw new Error(`the Ledger was not there for "${what}": the page offered its stand-in`)
    await js('await wt.hold()'); console.log(`  ${what}: the page's stand-in was held (no Ledger)`)
  } else { console.log(`  ${what}: waiting for the hold on the Ledger…`); await wait(2600); cue(`${what}-waiting`); pause() }
  // A slip on the device (a tap on "reject") is not the end of the take: the same thing is asked for again, off camera.
  const done = what === 'lend' ? 'wt.st().lent' : `String(wt.st().last).includes('pressed')`
  const declines = () => js(`return tomoshibi.events.filter((e) => e.type === 'declined').length`)
  for (let tries = 0, n0 = await declines(); ; tries++) {
    const got = await js(`const ok = await wt.until(() => (${done}) || tomoshibi.events.filter((e) => e.type === 'declined').length > ${n0}, 240000); return ok ? ((${done}) ? 'done' : 'declined') : 'timeout'`)
    if (got === 'done') break
    if (got === 'timeout' || tries >= 4) { resume(); throw new Error(`no hold arrived for "${what}"`) }
    console.log(`  ${what}: declined on the device. Asking again…`); pause(); n0 = await declines(); await sleep(2500)
    if (what === 'lend') { await js(`document.querySelector('[data-act="key-test"]')?.click(); await wt.W(400); document.querySelector('[data-act="park"]')?.click()`) }
    else { await js(`document.querySelector('[data-act="seen"]')?.click(); await wt.W(600); document.querySelector('[data-act="run:heavy"]')?.click()`) }
    if (!(await until(`wt.st().asking === '${what}'`, 150000))) { resume(); throw new Error(`"${what}" could not be asked for again`) }
    console.log(`  ${what}: on the Ledger again`)
  }
  resume()
  cue(`${what}-done`)
}

/** A picture of another page, taken in its own tab while the recording is paused. Null if it would not load. */
async function snap(url, ms = 11000) {
  try {
    const t = await (await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' })).json()
    const w2 = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r, j) => { w2.onopen = r; w2.onerror = j })
    let n = 0; const pend = new Map(); w2.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id) } }
    const s2 = (method, params = {}) => new Promise((r) => { const i = ++n; pend.set(i, r); w2.send(JSON.stringify({ id: i, method, params })) })
    await s2('Emulation.setDeviceMetricsOverride', { width: 1180, height: 715, deviceScaleFactor: 1.5, mobile: false })
    await sleep(ms)
    const text = (await s2('Runtime.evaluate', { expression: 'document.body ? document.body.innerText.slice(0, 4000) : ""', returnByValue: true })).result?.result?.value || ''
    const r = await s2('Page.captureScreenshot', { format: 'jpeg', quality: 86 })
    w2.close(); await fetch(`http://127.0.0.1:${PORT}/json/close/${t.id}`).catch(() => {})
    await send('Page.bringToFront'); await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: SCALE, mobile: false }); await sleep(600)
    return r.result?.data ? { data: r.result.data, text } : null
  } catch (e) { console.log('  the other page could not be pictured:', String(e.message ?? e)); return null }
}

await send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: 1920, maxHeight: 1080, everyNthFrame: 1 })
const quiet = (sel) => js(`document.querySelector(${JSON.stringify(sel)})?.click(); await wt.W(350)`)
if (SCENE === 'row') {
  await quiet('[data-act="chat-send"]'); await wait(3400); await quiet('.aibtn[data-act="open-tomo"]'); await quiet('[data-act="onb:key"]'); await wait(700)
  await say('1 · ADD A ROW', 'She picks the API from a list. Only supported APIs can be added.'); await wait(500); resume(); await wait(1000)
  await click('.pickbtn', 1900)
  await click('[data-act="api:openai"]'); await say('1 · ADD A ROW', 'The others are not supported yet…', 1700)
  await click('.pickbtn', 1300)
  await js(`await wt.click('[data-act="api:stripe"]')`); await wait(150)
} else if (SCENE === 'refuse') {
  await quiet('[data-act="chat-send"]'); await wait(3400); await quiet('.aibtn[data-act="open-tomo"]'); await quiet('[data-act="onb:key"]'); await quiet('[data-act="key-test"]'); await quiet('[data-act="park"]')
  await until(`wt.st().asking === 'lend'`, 20000); await js('await wt.hold()'); await until('wt.st().lent', 20000); await quiet('[data-act="back-ai"]')
  await quiet('[data-act="run:usual"]'); await until(`wt.st().n === 1 && wt.st().last === 'ALLOWED'`, 60000)
  await quiet('[data-act="run:heavy"]'); await until(`wt.st().asking === 'press'`, 60000); await quiet('.tabs [data-act="open-tomo"]'); await js('await wt.hold()'); await until(`String(wt.st().last).includes('pressed')`, 30000)
  await quiet('[data-act="seen"]'); await quiet('[data-act="open-ai"]'); await wait(900)
  await say('5 · REFUSED', 'Then an email tells the tool to send her customer list somewhere else.'); await wait(500); resume(); await wait(1500)
  await js(`document.querySelector('[data-act="run:denied-host"]').click()`); await until(`wt.st().last === 'DENIED'`, 30000); await wait(3600)
} else {
const LOGO = `${PAGES}/logo-mark-light.svg`
await js(`wt.card('<img src="${LOGO}" alt=""><h1>tomoshibi</h1><p>The switchboard between your AI tools and your API keys.</p><small>A 90-SECOND WALKTHROUGH</small>')`)
await wait(500); resume()
console.log('recording…')
await wait(3000)
await say('WHO', 'Priya builds AI tools. Today: a billing tool on Stripe.')
await js('await wt.uncard()'); await wait(3000)
await say('THE PROBLEM', 'Her AI wants the Stripe key in a .env file. One more key, in one more file.', 4200)
await say('WHAT SHE DOES', 'She sends one link instead. The AI reads it, and decides to go through TOMOSHIBI.')
await click('[data-act="chat-send"]'); await wait(5400)
await click('.aibtn[data-act="open-tomo"]')
await say('TOMOSHIBI', 'It sits between her tools and her keys. A tool calls by label; the key stays here.', 2700)
await click('[data-act="onb:key"]')
await say('1 · ADD A ROW', 'She picks the API from a list. Only supported APIs can be added.', 300)
await click('.pickbtn', 1500)
await click('[data-act="api:openai"]'); await say('1 · ADD A ROW', 'The others are not supported yet…', 1500)
await click('.pickbtn', 1100)
await click('[data-act="api:stripe"]')
await say('1 · ADD A ROW', 'Stripe is on the list, so it already knows where the key goes. She parks the key once.', 400)
const canType = Boolean(process.env.PASTE) && Boolean(process.env.HEADFUL) && await js('return tomoshibi.mode === "live"')
if (canType) { console.log('  paste the Stripe test key into the window now (or click "Use a mock key")'); await wait(1500); pause(); await until('document.getElementById("keyIn") && document.getElementById("keyIn").value.trim().length > 6', 240000); resume(); await wait(900) }
else { await click('[data-act="key-test"]'); await wait(2300) }
await ledgerAwake()
await click('[data-act="park"]')
await say('2 · APPROVE', 'Only her Ledger can add the row. An AI cannot press this button.')
await hold('lend')
await until(`wt.view() === 'lit'`, 15000)
await say('THE LABEL', 'Her tool gets a label, never the key. The .env file can go.', 3800)
await click('[data-act="back-ai"]', 1600)
await say('3 · A ROUTINE CALL', 'The tool reads the unpaid invoices. 0G weighs the call: routine.')
await js(`document.querySelector('[data-act="run:usual"]').click()`)
await answer(`wt.st().n === 1 && wt.st().last === 'ALLOWED'`); await wait(1500)
await click('.tabs [data-act="open-tomo"]')
await say('3 · A ROUTINE CALL', 'The label goes in, the key is swapped in, the answer comes back. She is not asked.', 3600)
// Proof, where it is real: the line the app shows carries 0G's own request id for this call.
const zgReal = PROOF || await js(`return Boolean(document.querySelector('.zg b'))`)
if (zgReal && await js(`return wt.ring('.zg')`)) { await say('PROOF · 0G PRIVATE COMPUTER', 'A sealed model on 0G weighed this call. Its answer and its request id are on the screen.', 3800); await js('wt.unring()') }
await say('4 · A HEAVY CALL', 'A refund is heavy. A sealed model on 0G says so, and it waits for her Ledger.')
await js(`document.querySelector('[data-act="run:heavy"]').click()`)
const heavyDone = `wt.st().n >= 2 && ['NEEDS_PRESS', 'STOPPED', 'ALLOWED', 'DENIED'].includes(wt.st().last)`
await answer(heavyDone)
// 0G did not answer in time: that is a STOPPED, which is honest but not this scene. Ask again, off camera, twice at most.
for (let i = 0; REAL && i < 2 && (await js('return wt.st().last')) === 'STOPPED'; i++) { console.log('  the refund was STOPPED (0G did not answer). Asking again…'); pause(); const n = await js('return wt.st().n'); await js(`document.querySelector('[data-act="seen"]')?.click(); await wt.W(500); document.querySelector('[data-act="run:heavy"]')?.click()`); await until(`wt.st().n > ${n} && ['NEEDS_PRESS', 'STOPPED', 'ALLOWED', 'DENIED'].includes(wt.st().last)`, 150000); await sleep(400); resume() }
await wait(1500)
if ((await js('return wt.st().last')) === 'NEEDS_PRESS') { await hold('press'); await until(`wt.view() === 'paid'`, 15000); await say('4 · A HEAVY CALL', 'One hold. It goes out once.', 3600); await click('[data-act="seen"]') }
else { console.log('  the heavy call did not ask for a press:', await js('return wt.st().last')); await wait(2500); await click('[data-act="seen"]') }
await say('5 · REFUSED', 'Another destination? This label only reaches Stripe. Refused, and recorded.')
await js(`document.querySelector('[data-act="run:denied-host"]').click()`)
await answer(`wt.st().last === 'DENIED'`, 800); await wait(3000)
await click('[data-act="seen"]')
// The tool puts every finished thread into 0G Storage, about 20 seconds each. Wait for the refund's, off camera.
const canStore = await js(`try { return (await (await fetch(window.appAgent + '/health', { cache: 'no-store' })).json()).storage === true } catch { return false }`)
if (canStore) { pause(); await until(`tomoshibi.events.filter((e) => e.type === 'sealed').length >= 3`, 150000); resume() }
const stored = await js(`return tomoshibi.events.some((e) => e.type === 'sealed' && e.uploaded)`)
await say('THE TRAIL', `Every call, put through or refused, with its reason.${stored ? ' Each one sealed in 0G Storage.' : ''}`)
await click('[data-act="tab:activity"]', 3300)
if (stored || PROOF) {
  // Proof: the record of the refund, as the Broker wrote it, and the same transaction on 0G's own explorer.
  // The record is read from the Broker's own trail (GET /trace/<thread>) and shown as it is written there.
  const ev = await js(`
    const s = tomoshibi.reduce(), c = s.cards.filter((x) => x.verdicts.some((v) => v.pressed)).pop() || s.cards.filter((x) => x.verdicts.length).pop()
    if (!c) return null
    const thread = c.verdicts[c.verdicts.length - 1].response.thread, broker = (await (await fetch(window.appAgent + '/health')).json()).broker
    const base = window.appAgentIsRemote ? window.appAgent + '/b' : broker
    let recs = []; try { const j = await (await fetch(base + '/trace/' + thread, { cache: 'no-store' })).json(); recs = Array.isArray(j) ? j : (j.records || j.trace || []) } catch {}
    const a = recs.find((r) => r.decision === 'ALLOWED') || c.verdicts[c.verdicts.length - 1].response, z = a.zg || {}, st = (recs.find((r) => r.decision === 'SEALED') || {}).storage || (c.sealed ? { uploaded: c.sealed.uploaded, rootHash: c.sealed.rootHash, tx: (c.sealed.url || '').split('/tx/')[1] } : null)
    const e = (x) => String(x ?? '').replace(/[&<>]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]))
    const row = (k, v) => v ? '<dt>' + k + '</dt><dd>' + e(v) + '</dd>' : ''
    return '<div class="ev"><h2>' + e(c.what) + '</h2><p>From the Broker’s trail · thread ' + e(String(thread).slice(0, 26)) + '…</p>'
      + '<h3>0G PRIVATE COMPUTER</h3><dl>' + row('verdict', z.simulated ? 'simulated here' : (z.tier ? z.tier + (z.reason ? ' — ' + z.reason : '') : '')) + row('request id', z.requestId) + row('model', z.model) + row('answered in', z.ms ? z.ms + ' ms' : '') + row('tokens', z.usage ? z.usage.total_tokens : '') + '</dl>'
      + '<h3>THE CALL</h3><dl>' + row('decision', a.decision + (a.live ? ' · Stripe ' + a.live + ' mode' : '')) + row('calls left on this permit', a.remaining === 0 ? '0' : a.remaining) + row('answer, hashed', a.attestation ? 'status ' + a.attestation.status + ' · ' + a.attestation.bodyHash : '') + '</dl>'
      + '<h3>0G STORAGE</h3><dl>' + (st ? row('stored', st.uploaded ? 'yes' : 'no' + (st.reason ? ' — ' + st.reason : '')) + row('root hash', st.rootHash) + row('transaction', st.tx) : row('stored', 'not asked on this Broker')) + '</dl></div>'
  `)
  const tx = process.env.PROOF_TX || await js(`const e = tomoshibi.events.filter((x) => x.type === 'sealed' && x.uploaded && x.url).pop(); return e ? e.url : null`)
  if (ev) {
    await say('PROOF · THE RECORD', 'The refund, as the Broker wrote it: 0G’s verdict with its request id, and the 0G Storage transaction.')
    await js(`wt.frame(${JSON.stringify(ev)})`); await wait(5600)
  }
  if (tx) {
    pause(); console.log('  picturing', tx); const pic = await snap(tx); resume()
    if (pic && /0x[0-9a-fA-F]{8}/.test(pic.text)) {
      await say('PROOF · 0G STORAGE', 'The same transaction on 0G’s chain explorer. Anyone can look it up.')
      await js(`wt.frame('<img src="data:image/jpeg;base64,${pic.data}" alt="">')`); await wait(4200)
    } else console.log('  the explorer page did not show the transaction: left out')
  }
  await js('wt.unframe()')
}
if (process.env.WORLD) {
  // For real: World's code is shown, she confirms in World App on her own phone, and the page changes by itself.
  await say('THE VALUE', 'She lights the tool she built. World checks one thing: is this one real person?')
  await click('[data-act="tab:lights"]', 2000)
  if (await click('[data-act="show-light"]')) {
    await until(`tomoshibi.ui.world && tomoshibi.ui.world.step !== 'starting'`, 40000)
    await say('LIGHT IT', 'She scans the code, and confirms in World App on her own phone.', 3400)
    cue('world-waiting'); pause(); console.log('  World: scan the code, confirm in World App, then go back to World’s page on the phone…')
    // World's code lasts ten minutes. If it runs out (or the confirmation never arrived), ask again, off camera:
    // a new code is shown, and the phone can scan that one. Three codes at most.
    let w = null
    for (let i = 0; i < 3; i++) {
      w = await js(`await wt.until(() => tomoshibi.ui.world && ['done', 'end', 'preview'].includes(tomoshibi.ui.world.step), 660000); return tomoshibi.ui.world ? tomoshibi.ui.world.step : null`)
      if (w !== 'end' || i === 2) break
      console.log('  World: no confirmation arrived (' + await js(`return tomoshibi.ui.world.title`) + '). A new code is on the screen: scan it again.')
      await js(`document.querySelector('[data-act="show-light"]')?.click()`); await until(`tomoshibi.ui.world && tomoshibi.ui.world.step === 'confirm'`, 40000)
    }
    await sleep(700); resume(); cue(`world-${w}`); console.log('  World:', w)
    if (w === 'done') await say('THE VALUE', 'Her tool is lit. World says: one real person. The trail says: she really runs it.', 4600)
    else await wait(2500)
  }
} else {
  await say('THE VALUE', 'She lights the tool she built. World says: one real person. The trail says: she really runs it.')
  await click('[data-act="tab:lights"]', 3900)
}
await say('THE VALUE', 'Others choose a tool by who built it, and who really runs it.')
await js(`document.querySelector('[data-act="friend:1"]').click()`); await wait(3300)
await say('THE VALUE', 'Every light is trust in her as a builder.')
await click('[data-act="friend:2"]', 2900)
await js(`wt.card('<img src="${LOGO}" alt=""><h1>tomoshibi</h1><p>No key in a <b>.env</b> file.<br>Heavy calls wait for a <b>human</b>.<br>Trust that <b>cannot be bought</b>.</p><small>LEDGER · 0G · WORLD</small>')`)
await wait(4200)
}
pause(); const end = Date.now() / 1000 - cut
await send('Page.stopScreencast'); ws.close(); chrome.kill()

// ── frames → video: each frame stays on screen until the next one arrives ──
if (!frames.length) throw new Error('no frames were recorded')
const t0 = frames[0].t
const list = frames.map((f, i) => `file '${f.name}'\nduration ${Math.max(0.001, ((frames[i + 1]?.t ?? end) - f.t)).toFixed(4)}`).join('\n') + `\nfile '${frames[frames.length - 1].name}'\n`
writeFileSync(join(dir, 'frames.txt'), 'ffconcat version 1.0\n' + list)
console.log(`${frames.length} frames, ${(end - t0).toFixed(1)} s`)
writeFileSync(OUT.replace(/\.mp4$/, '') + '.cues.json', JSON.stringify({ duration: +(end - t0).toFixed(2), real: REAL, cues: cues.map((c) => ({ name: c.name, t: +(c.t - t0).toFixed(2) })) }, null, 1))
const r = spawnSync(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', 'frames.txt', '-vf', 'fps=30,scale=1920:1080:flags=lanczos,format=yuv420p', '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-movflags', '+faststart', OUT], { cwd: dir, stdio: 'inherit' })
if (r.status !== 0) throw new Error('ffmpeg failed')
if (!process.env.KEEP) rmSync(dir, { recursive: true, force: true }); else console.log('frames kept in', dir)
console.log('wrote', OUT)
