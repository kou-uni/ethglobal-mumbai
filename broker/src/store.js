// 系譜 — 追記のみ。消す口を作らない。
// いまはファイル1本。0G Storage の Log 層に置き換えるときも、append だけを差し替える。
import { appendFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

export function createStore(path = process.env.LEDGER_PATH ?? 'data/ledger.jsonl') {
  mkdirSync(dirname(path), { recursive: true })
  const counts = new Map()   // `${holder}:${nonce}` → 押さえた回数
  const owners = new Map()   // `${holder}:${nonce}` → { skill }。**holder の署名が通った要求だけ**
  const byThread = new Map()
  const stars = new Map()    // `${skill}:${version}` → Set(nullifier)。**版ごとに別の集合**

  const key = (holder, nonce) => `${String(holder).toLowerCase()}:${nonce}`
  const starKey = (skill, version) => `${skill}:${version}`

  // 再起動しても回数が戻らないように、起動時に読み直す
  if (existsSync(path)) {
    for (const l of readFileSync(path, 'utf8').split('\n').filter(Boolean)) {
      try {
        const rec = JSON.parse(l)
        index(rec)
        if (rec.decision === 'ALLOWED') {
          const k = key(rec.holder, rec.nonce)
          counts.set(k, (counts.get(k) ?? 0) + 1)
        }
      } catch {}
    }
  }

  function index(rec) {
    // nonce の持ち主は、holder の署名が通った要求だけが決める。
    // 署名なしの要求で結び付けると、正規の要求をあとから REPLAY にできてしまう（#14-2）
    const k = key(rec.holder, rec.nonce)
    if (rec.holderValid && rec.skill && !owners.has(k)) owners.set(k, { skill: rec.skill })
    // 星は版ごとに持つ。**版が変われば、前の版の星は数えられない**（一斉に消える）
    if (rec.decision === 'STAR' && rec.nullifier) {
      const k = starKey(rec.skill, rec.version)
      if (!stars.has(k)) stars.set(k, new Set())
      stars.get(k).add(rec.nullifier)
    }
    if (!rec.thread) return
    const t = byThread.get(rec.thread) ?? []
    t.push(rec)
    byThread.set(rec.thread, t)
  }

  return {
    nonceOwner: (holder, nonce) => owners.get(key(holder, nonce)) ?? null,
    used: (holder, nonce) => counts.get(key(holder, nonce)) ?? 0,

    /**
     * 回数を1つ押さえる。**実行の前に呼ぶ。** 確認と記録のあいだに await を挟まないので、
     * 連打しても maxCalls を超えない（#14-3）。取れなければ null。
     * 実行が失敗しても戻さない（fail-closed。細ったまま）。
     */
    reserve(holder, nonce, maxCalls) {
      const k = key(holder, nonce)
      const used = counts.get(k) ?? 0
      if (used >= Number(maxCalls)) return null
      counts.set(k, used + 1)
      return { used: used + 1, remaining: Number(maxCalls) - used - 1 }
    },

    /** 1件を刻む。回数には触れない（押さえるのは reserve の仕事）。 */
    append(rec) {
      const row = { at: new Date().toISOString(), ...rec }
      appendFileSync(path, JSON.stringify(row) + '\n')
      index(row)
      return row
    },

    /**
     * 星をひとつ取る。**同じ人は、同じ版に二度星を出せない。**
     * 確認と記録のあいだに await を挟まない（回数と同じ理由）。取れなければ false。
     */
    claimStar(nullifier, skill, version) {
      const k = starKey(skill, version)
      if (!stars.has(k)) stars.set(k, new Set())
      const set = stars.get(k)
      if (set.has(nullifier)) return false
      set.add(nullifier)
      return true
    },

    starCount: (skill, version) => stars.get(starKey(skill, version))?.size ?? 0,

    /** 版ごとの星の数。**前の版に何個あったかも残す**（消えたことが見えるように） */
    starsOf(skill) {
      const out = {}
      for (const [k, set] of stars) {
        const [s, v] = [k.slice(0, k.lastIndexOf(':')), k.slice(k.lastIndexOf(':') + 1)]
        if (s === skill) out[v] = set.size
      }
      return out
    },

    trace: (thread) => byThread.get(thread) ?? [],
    path,
  }
}
