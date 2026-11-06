// Episode log — put the records of one use (one thread) into 0G Storage's Log layer (append only).
//
// **Only write "stored" when it actually stored.** If it did not, keep the reason alongside.
// The root hash can be computed locally, but that is not evidence of storing, so it goes in its own field.
import { Wallet, JsonRpcProvider } from 'ethers'

export const RPC = process.env.ZG_RPC ?? 'https://evmrpc-testnet.0g.ai'
export const INDEXER = process.env.ZG_INDEXER ?? 'https://indexer-storage-testnet-turbo.0g.ai'
export const EXPLORER = process.env.ZG_EXPLORER ?? 'https://chainscan-galileo.0g.ai'

/** Turn a thread's records into a single JSONL blob. **No keys and no bodies** (the trail is meant to be public). */
export const serialize = (thread, records) =>
  records.map((r) => JSON.stringify({ thread, ...r })).join('\n') + '\n'

/** Produce only the root hash, without storing. **This value does not mean it was stored.** */
export async function rootOf(bytes) {
  const { MemData } = await import('@0gfoundation/0g-storage-ts-sdk')
  const [tree, err] = await new MemData(bytes).merkleTree()
  if (err) throw err
  return tree?.rootHash() ?? null
}

/**
 * Store into 0G Storage.
 * @returns {Promise<{uploaded:boolean, rootHash:string|null, tx?:string, url?:string, reason?:string}>}
 */
export async function store(thread, records, opts = {}) {
  const key = opts.privateKey ?? process.env.ZG_PRIVATE_KEY
  const bytes = new TextEncoder().encode(serialize(thread, records))
  let rootHash = null
  try { rootHash = await rootOf(bytes) } catch (e) { return { uploaded: false, rootHash: null, reason: `cannot compute root: ${e.message}` } }

  if (!key) return { uploaded: false, rootHash, reason: 'no ZG_PRIVATE_KEY (nothing was stored)' }

  try {
    const { Indexer, MemData } = await import('@0gfoundation/0g-storage-ts-sdk')
    const signer = new Wallet(key, new JsonRpcProvider(opts.rpc ?? RPC))
    const indexer = new Indexer(opts.indexer ?? INDEXER)
    const [tx, err] = await indexer.upload(new MemData(bytes), opts.rpc ?? RPC, signer)
    if (err) return { uploaded: false, rootHash, reason: String(err.message ?? err) }
    const hash = typeof tx === 'string' ? tx : (tx?.txHash ?? tx?.hash ?? null)
    return {
      uploaded: true,
      rootHash,
      tx: hash,
      url: hash ? `${EXPLORER}/tx/${hash}` : undefined,
      indexer: opts.indexer ?? INDEXER,
    }
  } catch (e) {
    return { uploaded: false, rootHash, reason: `cannot reach 0G Storage: ${e.message}` }
  }
}
