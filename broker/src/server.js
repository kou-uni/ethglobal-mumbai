// Tomoshibi Broker — use -> scope check -> **ask 0G for the weight** -> proxied execution -> the trail.
// This is the trust point. In production it runs in a TEE (it does not here; that is stated in the README).
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
import { deviceStart, waitForHuman, verifyIdToken, ISSUER } from './world.js'
import { offlineWorld } from './world-offline.js'
import { ownerOf, OWNER_REASONS } from './owner.js'

const ledger = createStore()
const EXECUTE = process.env.EXECUTE === '1'
// [SIMULATED] A development mode that never calls 0G. Records carry simulated: true (not used while filming)
const OFFLINE = process.env.ZG_OFFLINE === '1'
const weigher = OFFLINE ? offlineWeigh : weigh
// [SIMULATED] A development mode that never calls World (turned off while filming)
const WORLD_OFF = process.env.WORLD_OFFLINE === '1'
const world = WORLD_OFF ? offlineWorld : { deviceStart, waitForHuman, verifyIdToken }
const secrets = JSON.parse(process.env.SECRETS ?? '{}')

const json = (res, code, body) => {
  // allow-headers: answers the browser's preflight before it POSTs JSON. Without it the page cannot call /vouch or /use
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type' })
  res.end(JSON.stringify(body, (_, v) => (typeof v === 'bigint' ? String(v) : v), 2))
}

/** Handle one use request: judge -> **ask 0G for the weight** -> reserve a call -> execute -> record. */
export async function use({ permit, signature, request, skillSignature }, deps = {}) {
  const store = deps.store ?? ledger
  const judge = deps.weigh ?? weigher
  const thread = requestHash(permit, request)
  const verdict = await check(permit, signature, request, store)
  const p = normalize(permit)
  const shown = lines(permit)

  // Does the request itself carry the skill's signature? If not, it is not recorded as a violation (#14-4)
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
      // Only a request outside the declared scope that also carries the skill's signature gets recorded as one
      violation: Boolean(outOfRange && skillBound),
      unsignedRequest: outOfRange && !skillBound ? true : undefined,
      ...extra,
    })

  // A request outside the scope is stopped before 0G ever sees it: the body never leaves, and no credits are spent
  if (!verdict.ok) return denied(verdict.reason, verdict.outOfRange, { detail: verdict.detail })

  // -- 0G Private Computer (TeeML). **This is the only place that reads the body to decide the weight** --
  const w = await judge(shown, request)
  const zg = {
    simulated: w.simulated ? true : undefined,
    model: w.model,
    requestId: w.requestId,
    ms: w.ms,
    usage: w.usage ?? undefined,
    sealed: w.sealed ?? undefined,
  }

  // Unreachable, or the answer cannot be read -> **make no judgement. Stop.** (a faked fallback is disqualifying)
  if (!w.ok) {
    return stop('STOPPED', 'ZG_UNREACHABLE', 'stopped: the weight could not be decided', {
      zg: { ...zg, error: w.error, reachable: w.reachable },
      safeStop: true,
    })
  }

  zg.tier = w.tier
  zg.reason = w.reason

  // A heavy request passes only on a single-use permit pressed right now (never on a standing permit)
  if (needsPress(w.tier, p)) {
    return stop('NEEDS_PRESS', 'ESCALATED', `${w.tier}: a press right now is required`, {
      zg,
      press: { from: ESCALATE_FROM, need: 'sign a maxCalls=1 permit, now', lines: shown },
    })
  }

  // Reserve the call before executing. No await between the check and the write (#14-3)
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

/** Put one thread's records into 0G Storage, and record in the trail whether that worked. */
export async function seal(thread, deps = {}) {
  const store = deps.store ?? ledger
  const records = store.trace(thread)
  if (!records.length) return { thread, uploaded: false, reason: 'there are no records for that thread' }
  const put = await (deps.put ?? storeEpisode)(thread, records)
  store.append({ thread, decision: 'SEALED', storage: put })
  return { thread, ...put }
}

/**
 * Give a star — **confirm who the person is through World, once, and record only if that is confirmed.**
 * Refusals and expiries go into the same trail (the refusal path is not invented; it comes from the device flow).
 */
export async function vouch({ deviceCode, skill, version, permit, signature }, deps = {}) {
  const store = deps.store ?? ledger
  const w = deps.world ?? world
  const base = { skill, version, world: { issuer: ISSUER } }

  // Only the key owner can light a star (Q1-b = B). Checked **before World is asked**, so nobody is
  // bothered on their phone for a request that would be refused anyway.
  // VOUCH_OWNER=0 switches it off (for the prototype page that shows World alone).
  const ownerOnly = deps.ownerOnly ?? process.env.VOUCH_OWNER !== '0'
  if (ownerOnly) {
    const o = await ownerOf({ permit, signature, skill, version }, store)
    if (!o.ok) return store.append({ ...base, decision: 'VOUCH_DENIED', reason: o.reason, message: OWNER_REASONS[o.reason], detail: o.detail })
  }

  const waited = await w.waitForHuman(deviceCode, deps.pollOpts ?? {})
  if (!waited.ok) {
    return store.append({
      ...base,
      decision: 'VOUCH_DENIED',
      reason: waited.denied ?? 'WORLD_ERROR',
      message: waited.denied === 'human_denied' ? 'the owner refused (no star given)'
        : waited.denied === 'proof_expired' ? 'expired (no star given)'
        : (waited.error ?? 'cannot reach World'),
      world: { ...base.world, simulated: waited.simulated || undefined },
    })
  }

  const v = await w.verifyIdToken(waited.idToken, {})
  if (!v.ok) {
    return store.append({ ...base, decision: 'VOUCH_DENIED', reason: 'BAD_ID_TOKEN', message: v.error })
  }

  // The same person cannot star the same version twice (already-used identifiers are rejected atomically)
  if (!store.claimStar(v.nullifier, skill, version)) {
    return store.append({ ...base, decision: 'VOUCH_DENIED', reason: 'ALREADY_VOUCHED', message: 'this version has already been starred by you', nullifier: v.nullifier })
  }

  return store.append({
    ...base,
    decision: 'STAR',
    nullifier: v.nullifier,
    // Was this star issued after the owner check? **The owner's address is not recorded**, so the
    // World pseudonym is never tied to a wallet.
    ownerChecked: ownerOnly || undefined,
    stars: store.starCount(skill, version),
    world: { ...base.world, simulated: v.simulated || undefined },
  })
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
        world: { issuer: ISSUER, clientId: Boolean(process.env.WORLD_CLIENT_ID), simulated: WORLD_OFF || undefined },
      })
    }
    if (url.pathname === '/use' && req.method === 'POST') {
      const out = await use(await read(req))
      return json(res, CODE[out.decision] ?? 400, out)
    }
    // The trail. The QR points here (no index UI is built; D7)
    if (url.pathname.startsWith('/trace/')) {
      const t = url.pathname.slice(7)
      return json(res, 200, { thread: t, records: ledger.trace(t) })
    }
    // Store into 0G Storage (returns the root hash and the tx)
    if (url.pathname === '/seal' && req.method === 'POST') {
      const { thread } = await read(req)
      return json(res, 200, await seal(thread))
    }
    // Give a star (World). Not called every time the key is used. **Only when a star is given**
    if (url.pathname === '/vouch/start' && req.method === 'POST') {
      const started = await world.deviceStart({})
      return json(res, started.ok ? 200 : 503, started)
    }
    if (url.pathname === '/vouch/finish' && req.method === 'POST') {
      const out = await vouch(await read(req))
      return json(res, out.decision === 'STAR' ? 200 : 403, out)
    }
    // Stars per version. **When the version changes, the previous version's stars stop counting**
    if (url.pathname.startsWith('/stars/')) {
      const skill = url.pathname.slice(7)
      const version = url.searchParams.get('version')
      return json(res, 200, {
        skill,
        version,
        stars: version ? ledger.starCount(skill, version) : undefined,
        who: version ? ledger.starWho(skill, version) : undefined,
        ownerChecked: version ? ledger.starChecked(skill, version) : undefined,
        byVersion: ledger.starsOf(skill),
      })
    }
    // For showing the credits going down on screen (the 0G PC iAI bonus)
    if (url.pathname === '/zg/balance') return json(res, 200, { balance: await balance() })
    // The Broker renders the device's four lines with the same function (so screen and hash never take different paths)
    if (url.pathname === '/lines' && req.method === 'POST') return json(res, 200, { lines: lines(await read(req)) })
    // The string a skill should sign (for implementing the skill side)
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
