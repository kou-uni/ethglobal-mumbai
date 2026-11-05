// 系譜 — 追記のみ。消す口を作らない。
// いまはファイル1本。0G Storage の Log 層に置き換えるときも、append だけを差し替える。
import { appendFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

export function createStore(path = process.env.LEDGER_PATH ?? 'data/ledger.jsonl') {
  mkdirSync(dirname(path), { recursive: true })
  const counts = new Map()  // `${holder}:${nonce}` → 使用回数
  const nonces = new Map()  // `${holder}:${nonce}` → { skill }
  const byThread = new Map()

  const key = (holder, nonce) => `${String(holder).toLowerCase()}:${nonce}`

  // 再起動しても回数が戻らないように、起動時に読み直す
  if (existsSync(path)) {
    for (const l of readFileSync(path, 'utf8').split('\n').filter(Boolean)) {
      try { replay(JSON.parse(l)) } catch {}
    }
  }

  function replay(rec) {
    const k = key(rec.holder, rec.nonce)
    if (!nonces.has(k) && rec.skill) nonces.set(k, { skill: rec.skill })
    if (rec.decision === 'ALLOWED') counts.set(k, (counts.get(k) ?? 0) + 1)
    const t = byThread.get(rec.thread) ?? []
    t.push(rec)
    byThread.set(rec.thread, t)
  }

  return {
    used: (holder, nonce) => counts.get(key(holder, nonce)) ?? 0,
    nonceDigest: (holder, nonce) => nonces.get(key(holder, nonce)) ?? null,
    /** 1件を刻む。ALLOWED のときだけ回数が減る。 */
    append(rec) {
      const row = { at: new Date().toISOString(), ...rec }
      appendFileSync(path, JSON.stringify(row) + '\n')
      replay(row)
      return row
    },
    trace: (thread) => byThread.get(thread) ?? [],
    path,
  }
}
