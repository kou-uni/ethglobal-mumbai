// エピソードログ — 1回の使用（糸）の記録を、0G Storage の Log 層（追記専用）へ置く。
//
// **置けたときだけ「置いた」と書く。** 置けなければ理由ごと残す。
// root hash は手元でも計算できるが、それは「置いた証拠」ではないので別の欄に書く。
import { Wallet, JsonRpcProvider } from 'ethers'

export const RPC = process.env.ZG_RPC ?? 'https://evmrpc-testnet.0g.ai'
export const INDEXER = process.env.ZG_INDEXER ?? 'https://indexer-storage-testnet-turbo.0g.ai'
export const EXPLORER = process.env.ZG_EXPLORER ?? 'https://chainscan-galileo.0g.ai'

/** 糸の記録を JSONL の1枚にする。**鍵も本文も入れない**（系譜は公開前提）。 */
export const serialize = (thread, records) =>
  records.map((r) => JSON.stringify({ thread, ...r })).join('\n') + '\n'

/** 置かずに root hash だけ出す。**「置いた」とは言えない値。** */
export async function rootOf(bytes) {
  const { MemData } = await import('@0gfoundation/0g-storage-ts-sdk')
  const [tree, err] = await new MemData(bytes).merkleTree()
  if (err) throw err
  return tree?.rootHash() ?? null
}

/**
 * 0G Storage へ置く。
 * @returns {Promise<{uploaded:boolean, rootHash:string|null, tx?:string, url?:string, reason?:string}>}
 */
export async function store(thread, records, opts = {}) {
  const key = opts.privateKey ?? process.env.ZG_PRIVATE_KEY
  const bytes = new TextEncoder().encode(serialize(thread, records))
  let rootHash = null
  try { rootHash = await rootOf(bytes) } catch (e) { return { uploaded: false, rootHash: null, reason: `root が出せない: ${e.message}` } }

  if (!key) return { uploaded: false, rootHash, reason: 'ZG_PRIVATE_KEY がない（置いていない）' }

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
    return { uploaded: false, rootHash, reason: `0G Storage に届かない: ${e.message}` }
  }
}
