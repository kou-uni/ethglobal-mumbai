// 重さの段と、その段で何が変わるか。
// **ここが 0G を「ログ置き場」から「判断ループ」に変えている唯一の場所。**
// 0G の答えで、Ledger を起こすかどうかが変わる。
export const TIERS = ['ふだん', '大事', '決定的']
export const ROUTINE = 'ふだん'

/** どの段から、その場の一押し（使い切りの許可）を要るようにするか。 */
export const ESCALATE_FROM = process.env.ZG_ESCALATE ?? '決定的'

export const rank = (tier) => TIERS.indexOf(tier)

/**
 * 立っている許可（maxCalls 回ぶん）だけで通してよいか。
 * **重い要求は、その場で押された使い切りの許可でしか通さない。**
 * 使い切り = maxCalls === 1。署名の契約（spec/permit-signature.md）は変えない。
 */
export function needsPress(tier, permit) {
  if (rank(tier) < rank(ESCALATE_FROM)) return false
  return Number(permit.maxCalls) !== 1
}
