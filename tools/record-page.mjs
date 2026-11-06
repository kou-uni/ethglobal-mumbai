#!/usr/bin/env node
// Records a page that plays by itself (web/switchboard.html?rec=1) as a 1920×1080 video.
//   node tools/record-page.mjs <url> <out.mp4> [expression that turns true when the page is done] [longest, in seconds]
// The page is opened in headless Chrome and its frames are kept as they are drawn; ffmpeg joins them.
import { spawn, spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const [url, out, done = 'window.switchboardDone === true', longest = '120'] = process.argv.slice(2)
if (!url || !out) { console.error('usage: record-page.mjs <url> <out.mp4> [done expression] [longest seconds]'); process.exit(1) }
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', FFMPEG = process.env.FFMPEG || 'ffmpeg', PORT = 9335
const sleep = (ms) => new Promise((r) => setTimeout(r, ms)), dir = mkdtempSync(join(tmpdir(), 'record-'))
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${join(dir, 'profile')}`, '--no-first-run', '--hide-scrollbars', '--window-size=1920,1080', 'about:blank'], { stdio: 'ignore' })
let page = null
for (let i = 0; i < 60 && !page; i++) { await sleep(250); try { page = (await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()).find((t) => t.type === 'page') } catch {} }
if (!page) { chrome.kill(); throw new Error('Chrome did not start') }
const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise((r) => { ws.onopen = r })
let id = 0; const waiting = new Map(), frames = []; let recording = false
ws.onmessage = (m) => {
  const d = JSON.parse(m.data)
  if (d.id && waiting.has(d.id)) { waiting.get(d.id)(d); waiting.delete(d.id); return }
  if (d.method === 'Page.screencastFrame') {
    ws.send(JSON.stringify({ id: ++id, method: 'Page.screencastFrameAck', params: { sessionId: d.params.sessionId } }))
    if (!recording) return
    const name = `f${String(frames.length).padStart(5, '0')}.jpg`; writeFileSync(join(dir, name), Buffer.from(d.params.data, 'base64')); frames.push({ name, t: Date.now() / 1000 })
  }
}
const send = (method, params = {}) => new Promise((r) => { const n = ++id; waiting.set(n, r); ws.send(JSON.stringify({ id: n, method, params })) })
const js = async (expression) => (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.result?.value
await send('Page.enable')
await send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false })
await send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: 1920, maxHeight: 1080, everyNthFrame: 1 })
await send('Page.navigate', { url })
await sleep(350); recording = true
// a picture that stands still sends no frames: something tiny keeps changing, so a held scene keeps its length
await js(`(() => { const d = document.createElement('div'); d.style.cssText = 'position:fixed;right:0;bottom:0;width:3px;height:3px;z-index:99999;background:#111'; document.documentElement.appendChild(d); let k = 0; setInterval(() => { d.style.background = (k ^= 1) ? '#121212' : '#111' }, 90) })()`)
const t0 = Date.now()
while (Date.now() - t0 < Number(longest) * 1000) { await sleep(300); if (await js(`Boolean(${done})`).catch(() => false)) break }
await sleep(400); recording = false; const end = Date.now() / 1000
// the page may say where its scenes begin (on the same clock): written next to the video, so it can be cut scene by scene
const marks = JSON.parse(await js('JSON.stringify(window.switchboardMarks || [])').catch(() => '[]') || '[]')
await send('Page.stopScreencast'); ws.close(); chrome.kill()
if (!frames.length) throw new Error('no frames were recorded')
writeFileSync(join(dir, 'frames.txt'), 'ffconcat version 1.0\n' + frames.map((f, i) => `file '${f.name}'\nduration ${Math.max(0.001, (frames[i + 1]?.t ?? end) - f.t).toFixed(4)}`).join('\n') + `\nfile '${frames[frames.length - 1].name}'\n`)
const r = spawnSync(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', 'frames.txt', '-vf', 'fps=30,scale=1920:1080:flags=lanczos,format=yuv420p', '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-movflags', '+faststart', resolve(out)], { cwd: dir, stdio: 'inherit' })
rmSync(dir, { recursive: true, force: true })
if (r.status !== 0) throw new Error('ffmpeg failed')
if (marks.length) writeFileSync(resolve(out).replace(/\.mp4$/, '') + '.marks.json', JSON.stringify(marks.map((m) => ({ name: m.name, t: +(m.t - frames[0].t).toFixed(2) })), null, 1))
console.log(`${frames.length} frames, ${(end - frames[0].t).toFixed(1)} s ->`, resolve(out))
