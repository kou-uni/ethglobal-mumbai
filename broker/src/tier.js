// The weight tiers, and what changes at each tier.
// **This is the one place that turns 0G from a log store into part of the decision loop.**
// 0G's answer decides whether the Ledger is woken up.
export const TIERS = ['routine', 'significant', 'decisive']
export const ROUTINE = 'routine'

/** From which tier upward a press right now (a single-use permit) becomes required. */
export const ESCALATE_FROM = process.env.ZG_ESCALATE ?? 'decisive'

export const rank = (tier) => TIERS.indexOf(tier)

/**
 * Whether a standing permit (worth maxCalls calls) is enough on its own.
 * **A heavy request passes only on a single-use permit pressed right now.**
 * Single-use = maxCalls === 1. The signature contract (spec/permit-signature.md) does not change.
 */
export function needsPress(tier, permit) {
  if (rank(tier) < rank(ESCALATE_FROM)) return false
  return Number(permit.maxCalls) !== 1
}
