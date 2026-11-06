// Weight judgement — read what is being requested and decide its weight (one of routine / significant / decisive).
//
// **The only thing that gets to read it is the 0G Private Computer (TeeML, sealed).**
// The body passes through the Broker, but it never leaves the Broker: not to us, not to logs, not to a screen.
// This is what backs the claim that the weight is decided without us seeing the contents.
//
// **If it cannot be reached, no judgement is made.** The 0G prize text says a fallback that fakes a decision
// is disqualifying. We neither pass on a default nor substitute a rule. We stop (safe-stop).
import { TIERS, ROUTINE } from './tier.js'

export const ENDPOINT = process.env.ZG_ENDPOINT ?? 'https://router-api.0g.ai/v1'
// TeeML, tee_attested: true, TDX / dstack [verified, measured 2026-11-06 GET /v1/models]
export const MODEL = process.env.ZG_MODEL ?? '0gm-1.0-35b-a3b'
const TIMEOUT_MS = Number(process.env.ZG_TIMEOUT_MS ?? 30000)
const BODY_LIMIT = Number(process.env.ZG_BODY_LIMIT ?? 4000)

// The tiers are defined by **who can undo it**, not by "can it be undone".
// A literal translation of the earlier Japanese prompt let the model read a refund as an undo
// and drop it to `significant` in 4 of 6 runs — the unsafe direction. Measured, then fixed.
// See Decision 25 in ideation/2026-11-06-decisions.md (120 production calls, 58/60 agreement).
const SYSTEM = [
  'You decide the weight of a request made by an agent.',
  'The weight is exactly one of three levels:',
  '  routine     = the owner can undo it alone. The effect stays with the owner. Fine to repeat every day',
  '  significant = money, publication, or contact with a third party moves, and undoing it takes work but is still possible',
  '  decisive    = the owner cannot undo it alone. Assets leave, data is deleted, something becomes public, authority is delegated, or a message is sent that cannot be recalled',
  'Read the body of the request, not only the destination and the method.',
  'Output exactly one JSON object: {"tier":"routine|significant|decisive","reason":"under 12 words"}',
].join('\n')

const clip = (s, n) => (typeof s === 'string' && s.length > n ? s.slice(0, n) + `…(+${s.length - n})` : s)

/** What 0G is shown. **The plaintext key is never in here.** keyRef is a label, not a key. */
export const promptFor = (lines, request) => JSON.stringify({
  permit_four_lines: lines,
  operation: `${request.method} ${request.url}`,
  body: clip(request.body ?? null, BODY_LIMIT),
}, null, 1)

const stripThink = (s) => String(s ?? '').replace(/<think>[\s\S]*?<\/think>/g, '').trim()

const pickJson = (text) => {
  const t = stripThink(text)
  const m = t.match(/\{[\s\S]*\}/)
  if (!m) throw new Error('no JSON came back')
  return JSON.parse(m[0])
}

/**
 * Ask 0G for the weight of one request. **No side effects.**
 * @returns {Promise<{ok:boolean, tier?:string, reason?:string, requestId:string|null,
 *                     model:string, usage:object|null, ms:number, error?:string, reachable:boolean}>}
 */
export async function weigh(lines, request, opts = {}) {
  const key = opts.apiKey ?? process.env.ZG_API_KEY
  const fetchImpl = opts.fetch ?? fetch
  const started = Date.now()
  const base = { model: opts.model ?? MODEL, requestId: null, usage: null, reachable: false }

  if (!key) return { ...base, ok: false, ms: 0, error: 'no ZG_API_KEY (issue one at pc.0g.ai)' }

  const ac = new AbortController()
  const timer = setTimeout(() => ac.abort(), opts.timeoutMs ?? TIMEOUT_MS)
  // Do not mix "could not reach it" with "reached it but cannot read the answer". Both stop, but they are recorded differently
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
        // Turn reasoning off. Without this it spends 1,700 tokens reasoning and takes 17 seconds, which
        // hits the 20 second wall and turns into "could not decide" = STOPPED. Measured: 17.2s with, 2.0s without (2026-11-06)
        ...(process.env.ZG_THINKING === '1' ? {} : { chat_template_kwargs: { enable_thinking: false } }),
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: promptFor(lines, request) },
        ],
      }),
    })
    reached = true
    // The header is authoritative for the request ID; the body id is a fallback (a required field for the 0G prize)
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
    if (!TIERS.includes(out.tier)) throw new Error(`unknown weight: ${out.tier}`)
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
    const why = aborted ? `0G did not respond within ${opts.timeoutMs ?? TIMEOUT_MS}ms`
      : reached ? `cannot read 0G's answer: ${e.message}` : `cannot reach 0G: ${e.message}`
    return { ...base, ok: false, reachable: reached, requestId: id, ms: Date.now() - started, error: why }
  } finally {
    clearTimeout(timer)
  }
}

/** How much has been spent. For showing the credits going down on screen (the 0G PC iAI bonus). */
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
