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
//   - HEADFUL=1 opens a visible window, so a Stripe test key can be pasted by hand when the screen asks
//     (the recording pauses while it waits); otherwise the mock key is used, and the page says MOCK
// Env: PAGES (http://127.0.0.1:8790), CHROME, FFMPEG, HEADFUL, KEEP=1 (keep the frames)
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
const dir = mkdtempSync(join(tmpdir(), 'walkthrough-'))

const chrome = spawn(CHROME, [...(process.env.HEADFUL ? [] : ['--headless=new']), `--remote-debugging-port=${PORT}`, `--user-data-dir=${join(dir, 'profile')}`, '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', `--window-size=${W},${H + (process.env.HEADFUL ? 90 : 0)}`, 'about:blank'], { stdio: 'ignore' })
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
    #wttick{position:fixed;right:0;bottom:0;width:3px;height:3px;z-index:10000;background:#111}\`
  document.head.appendChild(st)
  for (const [tag, id] of [['div', 'wtcap'], ['div', 'wtcur'], ['div', 'wtcard'], ['div', 'wttick']]) { const e = document.createElement(tag); e.id = id; document.body.appendChild(e) }
  document.getElementById('wtcap').innerHTML = '<i></i><b></b>'; document.getElementById('wtcap').style.display = 'none'
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
    until: async (fn, ms) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { if (fn()) return true } catch {} await W(150) } return false },
    st: () => { const s = tomoshibi.reduce(); const c = s.cards[s.cards.length - 1]; return { lent: Boolean(s.lent), asking: s.asking ? s.asking.why : null, device: Boolean(s.asking && s.asking.device), last: c ? (c.verdicts.length ? c.verdicts[c.verdicts.length - 1].response.decision + (c.verdicts[c.verdicts.length - 1].pressed ? '+pressed' : '') : 'checking') : null, n: s.cards.length } },
  }
`)
const view = () => js('return wt.view()')
const say = (chip, text, ms = 0) => js(`await wt.say(${JSON.stringify(chip)}, ${JSON.stringify(text)}); await wt.W(${ms})`)
const click = (sel, ms = 0) => js(`const ok = await wt.click(${JSON.stringify(sel)}); await wt.W(${ms}); return ok`)
const wait = (ms) => sleep(ms)
const until = (cond, ms) => js(`return await wt.until(() => (${cond}), ${ms})`)
/** A hold. On the page's stand-in if there is no Ledger (the page says MOCK); otherwise wait for the real one, and leave the waiting out of the video. */
async function hold(what) {
  await until(`wt.st().asking === '${what}'`, 20000)
  await wait(900)
  if (await js('return Boolean(document.querySelector("[data-hold]"))')) { await js('await wt.hold()'); console.log(`  ${what}: the page's stand-in was held (no Ledger)`) }
  else { console.log(`  ${what}: waiting for the hold on the Ledger…`); await wait(2600); pause() }
  const ok = await until(what === 'lend' ? 'wt.st().lent' : `String(wt.st().last).includes('pressed')`, 180000)
  resume(); if (!ok) throw new Error(`no hold arrived for "${what}"`)
}

await send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: 1920, maxHeight: 1080, everyNthFrame: 1 })
const LOGO = `${PAGES}/logo-mark-light.svg`
await js(`wt.card('<img src="${LOGO}" alt=""><h1>tomoshibi</h1><p>The switchboard between your AI tools and your API keys.</p><small>A 90-SECOND WALKTHROUGH</small>')`)
await wait(500); resume()
console.log('recording…')
await wait(3900)
await say('WHO', 'Priya builds AI tools. Today: a billing tool on Stripe.')
await js('await wt.uncard()'); await wait(3500)
await say('THE PROBLEM', 'Her AI wants the Stripe key in a .env file. One more key, in one more file.', 4700)
await say('WHAT SHE DOES', 'She sends one link instead. The AI reads it, and decides to go through TOMOSHIBI.')
await click('[data-act="chat-send"]'); await wait(5900)
await click('.aibtn[data-act="open-tomo"]')
await say('TOMOSHIBI', 'It sits between her tools and her keys. A tool calls by label; the key stays here.', 3300)
await click('[data-act="onb:key"]')
await say('1 · ADD A ROW', 'Only supported APIs. The others are not supported yet…', 300)
await js(`await wt.pick('#api', 'openai')`); await wait(1900)
await js(`await wt.pick('#api', 'stripe')`)
await say('1 · ADD A ROW', 'Stripe is on the list, so it already knows where the key goes. She parks the key once.', 400)
const canType = Boolean(process.env.HEADFUL) && await js('return tomoshibi.mode === "live"')
if (canType) { console.log('  paste the Stripe test key into the window now (or click "Use a mock key")'); await wait(1500); pause(); await until('document.getElementById("keyIn") && document.getElementById("keyIn").value.trim().length > 6', 240000); resume(); await wait(900) }
else { await click('[data-act="key-test"]'); await wait(2300) }
await click('[data-act="park"]')
await say('2 · APPROVE', 'Only her Ledger can add the row. An AI cannot press this button.')
await hold('lend')
await until(`wt.view() === 'lit'`, 15000)
await say('THE LABEL', 'Her tool gets a label, never the key. The .env file can go.', 4600)
await click('[data-act="back-ai"]', 1600)
await say('3 · A ROUTINE CALL', 'The tool reads the unpaid invoices. 0G weighs the call: routine.')
await js(`document.querySelector('[data-act="run:usual"]').click()`)
await until(`wt.st().n === 1 && wt.st().last === 'ALLOWED'`, 45000); await wait(1700)
await click('.tabs [data-act="open-tomo"]')
await say('3 · A ROUTINE CALL', 'The label goes in, the key is swapped in, the answer comes back. She is not asked.', 4300)
await say('4 · A HEAVY CALL', 'A refund is heavy. A sealed model on 0G says so, and it waits for her Ledger.')
await js(`document.querySelector('[data-act="run:heavy"]').click()`)
await until(`wt.st().asking === 'press' || wt.st().last === 'STOPPED' || wt.st().last === 'ALLOWED'`, 45000); await wait(2600)
if ((await js('return wt.st().asking')) === 'press') { await hold('press'); await until(`wt.view() === 'paid'`, 15000); await say('4 · A HEAVY CALL', 'One hold. It goes out once.', 3600); await click('[data-act="seen"]') }
else { console.log('  the heavy call did not ask for a press:', await js('return wt.st().last')); await wait(2500); await click('[data-act="seen"]') }
await say('5 · REFUSED', 'Another destination? This label only reaches Stripe. Refused, and recorded.')
await js(`document.querySelector('[data-act="run:denied-host"]').click()`)
await until(`wt.st().last === 'DENIED'`, 30000); await wait(4000)
await click('[data-act="seen"]')
const stored = await js(`return tomoshibi.events.some((e) => e.type === 'sealed' && e.uploaded)`)
await say('THE TRAIL', `Every call, put through or refused, with its reason.${stored ? ' Sealed in 0G Storage.' : ''}`)
await click('[data-act="tab:activity"]', 4300)
await say('THE VALUE', 'She lights the tool she built. World says: one real person. The trail says: she really runs it.')
await click('[data-act="tab:lights"]', 4600)
await say('THE VALUE', 'Others choose a tool by who built it, and who really runs it.')
await js(`document.querySelector('[data-act="friend:1"]').click()`); await wait(4000)
await say('THE VALUE', 'Every light is trust in her as a builder.')
await click('[data-act="friend:2"]', 3400)
await js(`wt.card('<img src="${LOGO}" alt=""><h1>tomoshibi</h1><p>No key in a <b>.env</b> file.<br>Heavy calls wait for a <b>human</b>.<br>Trust that <b>cannot be bought</b>.</p><small>LEDGER · 0G · WORLD</small>')`)
await wait(4800)
pause(); const end = Date.now() / 1000 - cut
await send('Page.stopScreencast'); ws.close(); chrome.kill()

// ── frames → video: each frame stays on screen until the next one arrives ──
if (!frames.length) throw new Error('no frames were recorded')
const t0 = frames[0].t
const list = frames.map((f, i) => `file '${f.name}'\nduration ${Math.max(0.001, ((frames[i + 1]?.t ?? end) - f.t)).toFixed(4)}`).join('\n') + `\nfile '${frames[frames.length - 1].name}'\n`
writeFileSync(join(dir, 'frames.txt'), 'ffconcat version 1.0\n' + list)
console.log(`${frames.length} frames, ${(end - t0).toFixed(1)} s`)
const r = spawnSync(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', 'frames.txt', '-vf', 'fps=30,scale=1920:1080:flags=lanczos,format=yuv420p', '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-movflags', '+faststart', OUT], { cwd: dir, stdio: 'inherit' })
if (r.status !== 0) throw new Error('ffmpeg failed')
if (!process.env.KEEP) rmSync(dir, { recursive: true, force: true }); else console.log('frames kept in', dir)
console.log('wrote', OUT)
