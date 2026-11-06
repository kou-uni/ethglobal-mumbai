// [SIMULATED] A stand-in for when 0G is unavailable. **It exists only for development.**
//
// The 0G prize text says a fallback that fakes a decision is disqualifying.
// So this one **does not fake anything**: every record it produces is stamped `simulated: true`,
// and both /health and the demo say so. **Do not use it while filming or submitting.**
// Using it requires ZG_OFFLINE=1 explicitly. It is off by default.
const HEAVY = [/delete/i, /transfer/i, /withdraw/i, /payout/i, /refund/i, /送金/, /解約/]
const MID = [/charge/i, /payment/i, /mail/i, /post/i, /publish/i]

export async function offlineWeigh(lines, request) {
  const s = `${request.method} ${request.url} ${request.body ?? ''}`
  const tier = HEAVY.some((r) => r.test(s)) ? 'decisive' : MID.some((r) => r.test(s)) ? 'significant' : 'routine'
  return {
    ok: true,
    reachable: false,
    simulated: true,          // <- this stays in the record. It is not an answer from 0G
    tier,
    reason: 'simulated (0G was never asked)',
    requestId: null,
    model: 'offline-stub',
    usage: null,
    ms: 0,
  }
}
