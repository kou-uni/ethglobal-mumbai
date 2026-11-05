// Hoshi Broker — use → 範囲チェック → 代理実行 → 系譜。
// ここは信頼点。本番は TEE に載せる（今回は載せていない。README に明記）。
import { createServer } from 'node:http'
import { check } from './scope.js'
import { createStore } from './store.js'
import { lines, requestHash, normalize } from './permit.js'
import { stubExecutor, fetchExecutor, attest } from './execute.js'

const store = createStore()
const EXECUTE = process.env.EXECUTE === '1'
const secrets = JSON.parse(process.env.SECRETS ?? '{}')

const json = (res, code, body) => {
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' })
  res.end(JSON.stringify(body, (_, v) => (typeof v === 'bigint' ? String(v) : v), 2))
}

/** 1件の使用要求を処理する。判定・実行・記録をこの順で。 */
export async function use({ permit, signature, request }) {
  const thread = requestHash(permit, request)
  const verdict = await check(permit, signature, request, store)
  const p = normalize(permit)

  const base = {
    thread,
    holder: p.holder,
    skill: p.skill,
    nonce: String(p.nonce),
    request: { method: request.method, url: request.url, keyRef: request.keyRef },
    decision: verdict.decision,
  }

  if (!verdict.ok) {
    const rec = store.append({ ...base, reason: verdict.reason, message: verdict.message, detail: verdict.detail, violation: verdict.violation })
    // 違反はスキルに刻む。保証人の重みは下げない（decisions 2026-11-06 #1）
    return { ...rec, lines: lines(permit) }
  }

  const exec = EXECUTE ? fetchExecutor : stubExecutor
  const out = await exec(request, secrets[p.key])
  const rec = store.append({ ...base, remaining: verdict.remaining, attestation: attest(out) })
  return { ...rec, lines: lines(permit), result: out }
}

const read = (req) => new Promise((ok, ng) => {
  let b = ''
  req.on('data', (c) => { b += c; if (b.length > 1e6) { ng(new Error('too large')); req.destroy() } })
  req.on('end', () => { try { ok(JSON.parse(b || '{}')) } catch (e) { ng(e) } })
})

export const app = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x')
  try {
    if (req.method === 'OPTIONS') return json(res, 204, {})
    if (url.pathname === '/health') return json(res, 200, { ok: true, execute: EXECUTE, ledger: store.path })
    if (url.pathname === '/use' && req.method === 'POST') {
      const body = await read(req)
      const out = await use(body)
      return json(res, out.decision === 'ALLOWED' ? 200 : 403, out)
    }
    // 系譜。QR はここを指す（一覧 UI は作らない。D7）
    if (url.pathname.startsWith('/trace/')) {
      return json(res, 200, { thread: url.pathname.slice(7), records: store.trace(url.pathname.slice(7)) })
    }
    // 端末に出る4行を、Broker 側からも同じ関数で出す（画面とハッシュを別経路にしない）
    if (url.pathname === '/lines' && req.method === 'POST') {
      return json(res, 200, { lines: lines(await read(req)) })
    }
    json(res, 404, { error: 'not found' })
  } catch (e) {
    json(res, 400, { error: String(e.message ?? e) })
  }
})

if (process.argv[1]?.endsWith('server.js')) {
  const port = Number(process.env.PORT ?? 8787)
  app.listen(port, () => console.log(`broker on http://127.0.0.1:${port}  execute=${EXECUTE}`))
}
