// Tomoshibi Broker — use → 範囲チェック → **0G に重さを聞く** → 代理実行 → 系譜。
// ここは信頼点。本番は TEE に載せる（今回は載せていない。README に明記）。
import { createServer } from 'node:http'
import { check, REASONS } from './scope.js'
import { createStore } from './store.js'
import { lines, requestHash, normalize } from './permit.js'
import { verifySkill, skillIdFrom, skillMessage } from './skill.js'
import { stubExecutor, fetchExecutor, attest } from './execute.js'
import { weigh, balance, MODEL, ENDPOINT } from './weigh.js'
import { needsPress, ESCALATE_FROM } from './tier.js'
import { store as storeEpisode } from './episode.js'
import { offlineWeigh } from './offline.js'

const ledger = createStore()
const EXECUTE = process.env.EXECUTE === '1'
// 【模擬】0G を呼ばない開発モード。記録に simulated: true が残る（撮影では使わない）
const OFFLINE = process.env.ZG_OFFLINE === '1'
const weigher = OFFLINE ? offlineWeigh : weigh
const secrets = JSON.parse(process.env.SECRETS ?? '{}')

const json = (res, code, body) => {
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' })
  res.end(JSON.stringify(body, (_, v) => (typeof v === 'bigint' ? String(v) : v), 2))
}

/** 1件の使用要求を処理する。判定 → **0G に重さを聞く** → 回数を押さえる → 実行 → 記録。 */
export async function use({ permit, signature, request, skillSignature }, deps = {}) {
  const store = deps.store ?? ledger
  const judge = deps.weigh ?? weigher
  const thread = requestHash(permit, request)
  const verdict = await check(permit, signature, request, store)
  const p = normalize(permit)
  const shown = lines(permit)

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

  const stop = (decision, reason, message, extra = {}) => ({
    ...store.append({ ...base, decision, reason, message, ...extra }),
    lines: shown,
  })

  const denied = (reason, outOfRange, extra = {}) =>
    stop('DENIED', reason, REASONS[reason], {
      // 刻むのは「宣言した範囲を外れた要求」で、かつスキルの署名が付いているものだけ
      violation: Boolean(outOfRange && skillBound),
      unsignedRequest: outOfRange && !skillBound ? true : undefined,
      ...extra,
    })

  // 範囲を外れた要求は、0G に見せる前に止める。中身を外に出さないし、クレジットも使わない
  if (!verdict.ok) return denied(verdict.reason, verdict.outOfRange, { detail: verdict.detail })

  // ── 0G Private Computer（TeeML）。**中身を読んで重さを決めるのはここだけ** ──
  const w = await judge(shown, request)
  const zg = {
    simulated: w.simulated ? true : undefined,
    model: w.model,
    requestId: w.requestId,
    ms: w.ms,
    usage: w.usage ?? undefined,
    sealed: w.sealed ?? undefined,
  }

  // 届かない／答えが読めない → **判断を作らない。止まる。**（偽装したフォールバックは失格）
  if (!w.ok) {
    return stop('STOPPED', 'ZG_UNREACHABLE', '重さを決められないので止めた', {
      zg: { ...zg, error: w.error, reachable: w.reachable },
      safeStop: true,
    })
  }

  zg.tier = w.tier
  zg.reason = w.reason

  // 重い要求は、その場で押された使い切りの許可でしか通さない（立っている許可では通さない）
  if (needsPress(w.tier, p)) {
    return stop('NEEDS_PRESS', 'ESCALATED', `${w.tier}：その場の一押しが要る`, {
      zg,
      press: { from: ESCALATE_FROM, need: 'maxCalls=1 の許可に、いま署名する', lines: shown },
    })
  }

  // 回数は実行の前に押さえる。確認と記録のあいだに await を挟まない（#14-3）
  const slot = store.reserve(p.holder, p.nonce, p.maxCalls)
  if (!slot) return denied('EXHAUSTED', false, { zg, detail: `${p.maxCalls}/${p.maxCalls}` })

  const exec = deps.execute ?? (EXECUTE ? fetchExecutor : stubExecutor)
  const out = await exec(request, secrets[p.key])
  return {
    ...store.append({ ...base, decision: 'ALLOWED', zg, remaining: slot.remaining, attestation: attest(out) }),
    lines: shown,
    result: out,
  }
}

/** 糸ひと組を 0G Storage に置き、置けたかどうかを系譜にも刻む。 */
export async function seal(thread, deps = {}) {
  const store = deps.store ?? ledger
  const records = store.trace(thread)
  if (!records.length) return { thread, uploaded: false, reason: 'その糸の記録が無い' }
  const put = await (deps.put ?? storeEpisode)(thread, records)
  store.append({ thread, decision: 'SEALED', storage: put })
  return { thread, ...put }
}

const read = (req) => new Promise((ok, ng) => {
  let b = ''
  req.on('data', (c) => { b += c; if (b.length > 1e6) { ng(new Error('too large')); req.destroy() } })
  req.on('end', () => { try { ok(JSON.parse(b || '{}')) } catch (e) { ng(e) } })
})

const CODE = { ALLOWED: 200, NEEDS_PRESS: 409, STOPPED: 503, DENIED: 403 }

export const app = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x')
  try {
    if (req.method === 'OPTIONS') return json(res, 204, {})
    if (url.pathname === '/health') {
      return json(res, 200, {
        ok: true,
        execute: EXECUTE,
        ledger: ledger.path,
        zg: {
          endpoint: ENDPOINT,
          model: MODEL,
          apiKey: Boolean(process.env.ZG_API_KEY),
          storageKey: Boolean(process.env.ZG_PRIVATE_KEY),
          escalateFrom: ESCALATE_FROM,
          simulated: OFFLINE || undefined,
        },
      })
    }
    if (url.pathname === '/use' && req.method === 'POST') {
      const out = await use(await read(req))
      return json(res, CODE[out.decision] ?? 400, out)
    }
    // 系譜。QR はここを指す（一覧 UI は作らない。D7）
    if (url.pathname.startsWith('/trace/')) {
      const t = url.pathname.slice(7)
      return json(res, 200, { thread: t, records: ledger.trace(t) })
    }
    // 0G Storage へ置く（root hash と tx を返す）
    if (url.pathname === '/seal' && req.method === 'POST') {
      const { thread } = await read(req)
      return json(res, 200, await seal(thread))
    }
    // credits が減るのを画面に出すため（0G PC の iAI ボーナス）
    if (url.pathname === '/zg/balance') return json(res, 200, { balance: await balance() })
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
  app.listen(port, () => console.log(`broker on http://127.0.0.1:${port}  execute=${EXECUTE}  zg=${MODEL}`))
}
