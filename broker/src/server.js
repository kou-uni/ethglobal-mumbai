// Hoshi Broker — use → 範囲チェック → 代理実行 → 系譜。
// ここは信頼点。本番は TEE に載せる（今回は載せていない。README に明記）。
import { createServer } from 'node:http'
import { check, REASONS } from './scope.js'
import { createStore } from './store.js'
import { lines, requestHash, normalize } from './permit.js'
import { verifySkill, skillIdFrom, skillMessage } from './skill.js'
import { stubExecutor, fetchExecutor, attest } from './execute.js'

const store = createStore()
const EXECUTE = process.env.EXECUTE === '1'
const secrets = JSON.parse(process.env.SECRETS ?? '{}')

const json = (res, code, body) => {
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' })
  res.end(JSON.stringify(body, (_, v) => (typeof v === 'bigint' ? String(v) : v), 2))
}

/** 1件の使用要求を処理する。判定 → 回数を押さえる → 実行 → 記録。 */
export async function use({ permit, signature, request, skillSignature }) {
  const thread = requestHash(permit, request)
  const verdict = await check(permit, signature, request, store)
  const p = normalize(permit)

  // 要求そのものがスキルの署名付きか。付いていなければ、違反としては刻まない（#14-4）
  const skill = await verifySkill(thread, skillSignature)
  const skillBound = skill.bound && skillIdFrom(skill.signer) === p.skill

  const base = {
    thread,
    holder: p.holder,
    skill: p.skill,
    nonce: String(p.nonce),
    holderValid: verdict.holderValid === true,
    skillSigner: skillBound ? skill.signer : null,
    request: { method: request.method, url: request.url, keyRef: request.keyRef },
  }

  const stop = (reason, outOfRange, extra = {}) => ({
    ...store.append({
      ...base,
      decision: 'DENIED',
      reason,
      message: REASONS[reason],
      // 刻むのは「宣言した範囲を外れた要求」で、かつスキルの署名が付いているものだけ
      violation: Boolean(outOfRange && skillBound),
      unsignedRequest: outOfRange && !skillBound ? true : undefined,
      ...extra,
    }),
    lines: lines(permit),
  })

  if (!verdict.ok) return stop(verdict.reason, verdict.outOfRange, { detail: verdict.detail })

  // 回数は実行の前に押さえる。確認と記録のあいだに await を挟まない（#14-3）
  const slot = store.reserve(p.holder, p.nonce, p.maxCalls)
  if (!slot) return stop('EXHAUSTED', false, { detail: `${p.maxCalls}/${p.maxCalls}` })

  const exec = EXECUTE ? fetchExecutor : stubExecutor
  const out = await exec(request, secrets[p.key])
  return {
    ...store.append({ ...base, decision: 'ALLOWED', remaining: slot.remaining, attestation: attest(out) }),
    lines: lines(permit),
    result: out,
  }
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
      const out = await use(await read(req))
      return json(res, out.decision === 'ALLOWED' ? 200 : 403, out)
    }
    // 系譜。QR はここを指す（一覧 UI は作らない。D7）
    if (url.pathname.startsWith('/trace/')) {
      const t = url.pathname.slice(7)
      return json(res, 200, { thread: t, records: store.trace(t) })
    }
    // 端末に出る4行を、Broker 側からも同じ関数で出す（画面とハッシュを別経路にしない）
    if (url.pathname === '/lines' && req.method === 'POST') return json(res, 200, { lines: lines(await read(req)) })
    // スキルが署名すべき文字列（スキル側の実装用）
    if (url.pathname === '/skill-message' && req.method === 'POST') {
      const { permit, request } = await read(req)
      return json(res, 200, { message: skillMessage(requestHash(permit, request)) })
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
