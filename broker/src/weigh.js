// 重さ判定 — 「何を要求しているか」を読んで、重さ（ふだん／大事／決定的）を決める。
//
// **読ませるのは 0G Private Computer（TeeML・封印）だけ。**
// 本文は Broker の中を通るが、Broker の外（我々・ログ・画面）には出さない。
// 中身を見ずに重さを決める、という主張はここが支えている。
//
// **届かなければ、判断を作らない。** 0G 賞の原文に「決定を偽装するフォールバックは失格」とある。
// 既定値で通すことも、ルールで代用することもしない。止まる（safe-stop）。
import { TIERS, ROUTINE } from './tier.js'

export const ENDPOINT = process.env.ZG_ENDPOINT ?? 'https://router-api.0g.ai/v1'
// TeeML・tee_attested: true・TDX / dstack【実測 2026-11-06 GET /v1/models】
export const MODEL = process.env.ZG_MODEL ?? '0gm-1.0-35b-a3b'
const TIMEOUT_MS = Number(process.env.ZG_TIMEOUT_MS ?? 20000)
const BODY_LIMIT = Number(process.env.ZG_BODY_LIMIT ?? 4000)

const SYSTEM = [
  'あなたは、エージェントの要求の「重さ」を決める審査器です。',
  '重さは次の3段階のいずれか：',
  '  ふだん  = 取り消せる。影響が本人に閉じている。日常的に繰り返してよい',
  '  大事    = お金・外部への公開・第三者への連絡が動く。取り消しに手間がいる',
  '  決定的  = 取り消せない。資産の移転・削除・公開・権限の委譲・不可逆な送信',
  '要求の本文まで読んで決めること。宛先と操作だけでは決めないこと。',
  '出力は JSON ひとつだけ: {"tier":"ふだん|大事|決定的","reason":"日本語20字以内"}',
].join('\n')

const clip = (s, n) => (typeof s === 'string' && s.length > n ? s.slice(0, n) + `…(+${s.length - n})` : s)

/** 0G に見せるもの。**鍵の平文は入れない。** keyRef はラベルであって鍵ではない。 */
export const promptFor = (lines, request) => JSON.stringify({
  許可の4行: lines,
  操作: `${request.method} ${request.url}`,
  本文: clip(request.body ?? null, BODY_LIMIT),
}, null, 1)

const stripThink = (s) => String(s ?? '').replace(/<think>[\s\S]*?<\/think>/g, '').trim()

const pickJson = (text) => {
  const t = stripThink(text)
  const m = t.match(/\{[\s\S]*\}/)
  if (!m) throw new Error('JSON が返っていない')
  return JSON.parse(m[0])
}

/**
 * 1件の要求の重さを 0G に聞く。**副作用なし。**
 * @returns {Promise<{ok:boolean, tier?:string, reason?:string, requestId:string|null,
 *                     model:string, usage:object|null, ms:number, error?:string, reachable:boolean}>}
 */
export async function weigh(lines, request, opts = {}) {
  const key = opts.apiKey ?? process.env.ZG_API_KEY
  const fetchImpl = opts.fetch ?? fetch
  const started = Date.now()
  const base = { model: opts.model ?? MODEL, requestId: null, usage: null, reachable: false }

  if (!key) return { ...base, ok: false, ms: 0, error: 'ZG_API_KEY がない（pc.0g.ai で発行する）' }

  const ac = new AbortController()
  const timer = setTimeout(() => ac.abort(), opts.timeoutMs ?? TIMEOUT_MS)
  // 「届かなかった」と「届いたが答えが読めない」を混ぜない。どちらも止めるが、記録は別もの
  let reached = false
  let id = null
  try {
    const res = await fetchImpl(`${opts.endpoint ?? ENDPOINT}/chat/completions`, {
      method: 'POST',
      signal: ac.signal,
      headers: {
        authorization: `Bearer ${key}`,
        'content-type': 'application/json',
        'x-0g-provider-sort': 'latency',
      },
      body: JSON.stringify({
        model: base.model,
        temperature: 0,
        max_tokens: opts.maxTokens ?? 2048,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: promptFor(lines, request) },
        ],
      }),
    })
    reached = true
    // request ID は header が正。body の id は保険（0G 賞の必須項目）
    const requestId = res.headers?.get?.('x-request-id') ?? null
    const text = await res.text()
    let body = null
    try { body = JSON.parse(text) } catch {}
    const ms = Date.now() - started
    id = requestId ?? body?.id ?? null

    if (!res.ok) {
      return { ...base, requestId: id, ok: false, reachable: true, ms,
        error: `0G ${res.status}: ${body?.error?.message ?? clip(text, 200)}` }
    }

    const out = pickJson(body?.choices?.[0]?.message?.content)
    if (!TIERS.includes(out.tier)) throw new Error(`知らない重さ: ${out.tier}`)
    return {
      ...base, ok: true, reachable: true, ms,
      tier: out.tier,
      reason: clip(String(out.reason ?? ''), 60),
      requestId: id,
      usage: body?.usage ?? null,
      sealed: res.headers?.get?.('x-0g-e2ee') ?? null,
    }
  } catch (e) {
    const aborted = e?.name === 'AbortError'
    const why = aborted ? `0G が ${opts.timeoutMs ?? TIMEOUT_MS}ms で応答しない`
      : reached ? `0G の答えが読めない: ${e.message}` : `0G に届かない: ${e.message}`
    return { ...base, ok: false, reachable: reached, requestId: id, ms: Date.now() - started, error: why }
  } finally {
    clearTimeout(timer)
  }
}

/** 使った分。credits が減るのを画面に出すため（0G PC の iAI ボーナス）。 */
export async function balance(opts = {}) {
  const key = opts.apiKey ?? process.env.ZG_API_KEY
  if (!key) return null
  try {
    const res = await (opts.fetch ?? fetch)(`${opts.endpoint ?? ENDPOINT}/account/balance`, {
      headers: { authorization: `Bearer ${key}` },
    })
    return res.ok ? await res.json() : null
  } catch { return null }
}

export { TIERS, ROUTINE }
