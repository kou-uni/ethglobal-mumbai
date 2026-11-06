// 灯（星）を出せるのは、鍵の持ち主だけ（決定 Q1-b = B）。
// 「使っている」と名乗る人が、**その版への許可に自分で署名していて、その許可が実際に1回は使われている**ことを確かめる。
// World が確かめるのは「人であること」。ここで確かめるのは「その人が持ち主で、本当に使っていること」。
//
// 確かめられないこと（黙って良く見せない）:
// - 署名した鍵が Ledger の中にあるかどうか。Broker に見えるのは署名だけで、機器の証明は受け取っていない
// - World の本人と、この鍵の持ち主が同じ人かどうか。同じ1回の要求に両方が揃っている、までしか言えない
import { signer, normalize } from './permit.js'

export const OWNER_REASONS = {
  NOT_OWNER: '鍵の持ち主が署名した、この版への許可が添えられていない（星を出さない）',
  NOT_USED: 'その許可は、まだ一度も使われていない（星を出さない）',
}

/** 持ち主で、使っているか。`{ ok }` か `{ ok:false, reason, detail }`。World を呼ぶ**前**に確かめる。 */
export async function ownerOf({ permit, signature, skill, version }, store, now = Date.now()) {
  const no = (detail) => ({ ok: false, reason: 'NOT_OWNER', detail })
  if (!permit || !signature) return no('許可か署名が無い')
  let p, who
  try { p = normalize(permit) } catch { return no('許可の形が違う') }
  try { who = await signer(p, signature) } catch { return no('署名を読めない') }
  if (String(who).toLowerCase() !== String(p.holder).toLowerCase()) return no('署名したのは持ち主ではない')
  if (p.skill !== skill || p.version !== version) return no('別のスキルか、別の版への許可')
  if (Number(p.expiry) * 1000 <= now) return no('許可の期限が切れている')
  if (store.used(p.holder, String(p.nonce)) < 1) return { ok: false, reason: 'NOT_USED', detail: 'ALLOWED が1件も無い' }
  return { ok: true }
}
