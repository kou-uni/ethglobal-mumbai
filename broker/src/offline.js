// 【模擬】0G が無いときの替え玉。**開発のためだけにある。**
//
// 0G の賞の原文に「決定を偽装するフォールバックは失格」とある。
// だからこれは**偽装しない**：出す記録すべてに `simulated: true` を押し、
// /health にも demo にも「模擬」と出る。**撮影と提出のときは使わない。**
// 使うには ZG_OFFLINE=1 を明示する。既定では動かない。
const HEAVY = [/delete/i, /transfer/i, /withdraw/i, /payout/i, /送金/, /解約/]
const MID = [/charge/i, /payment/i, /mail/i, /post/i, /publish/i]

export async function offlineWeigh(lines, request) {
  const s = `${request.method} ${request.url} ${request.body ?? ''}`
  const tier = HEAVY.some((r) => r.test(s)) ? '決定的' : MID.some((r) => r.test(s)) ? '大事' : 'ふだん'
  return {
    ok: true,
    reachable: false,
    simulated: true,          // ← これが記録に残る。0G に聞いた結果ではない
    tier,
    reason: '模擬（0G には聞いていない）',
    requestId: null,
    model: 'offline-stub',
    usage: null,
    ms: 0,
  }
}
