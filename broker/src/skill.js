// The skill's signature — actually making "the request itself is recorded with the skill's signature" true (#14-4).
// A third party who merely holds the permit cannot manufacture a violation against that skill.
// This has nothing to do with the device (Ledger); it is a software key on the skill side. The spec's JSON does not change.
import { recoverMessageAddress, keccak256, toHex } from 'viem'

/** The string the skill signs. The thread (the request's thread) itself. */
export const skillMessage = (thread) => `tomoshibi-request:${thread}`

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

/** The skill's ID, derived from its registration key (this is the value to use on ERC-8004). */
export const skillIdFrom = (address) => keccak256(toHex(String(address).toLowerCase()))
