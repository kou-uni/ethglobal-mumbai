// スキルの署名 — 「要求そのものがスキルの署名付きで残る」を、本当にそうする（#14-4）。
// permit を持っているだけの第三者に、そのスキルの違反を作らせない。
// これは端末（Ledger）とは無関係で、スキル側のソフト鍵。spec の JSON 1本は変わらない。
import { recoverMessageAddress, keccak256, toHex } from 'viem'

/** スキルが署名する文字列。thread（要求の糸）そのもの。 */
export const skillMessage = (thread) => `hoshi-request:${thread}`

/** @returns {{signer:string|null, bound:boolean}} */
export async function verifySkill(thread, skillSignature, expectedSigner) {
  if (!skillSignature) return { signer: null, bound: false }
  try {
    const who = await recoverMessageAddress({ message: skillMessage(thread), signature: skillSignature })
    if (expectedSigner && who.toLowerCase() !== String(expectedSigner).toLowerCase()) {
      return { signer: who, bound: false }
    }
    return { signer: who, bound: true }
  } catch {
    return { signer: null, bound: false }
  }
}

/** スキルの ID。登録鍵から導く（ERC-8004 に載せるときはこの値を使う）。 */
export const skillIdFrom = (address) => keccak256(toHex(String(address).toLowerCase()))
