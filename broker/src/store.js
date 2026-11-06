// The trail — append only. No deletion path is provided.
// For now it is a single file. Swapping in 0G Storage's Log layer only replaces append.
import { appendFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

export function createStore(path = process.env.LEDGER_PATH ?? 'data/ledger.jsonl') {
  mkdirSync(dirname(path), { recursive: true })
  const counts = new Map()   // `${holder}:${nonce}` -> calls reserved so far
  const owners = new Map()   // `${holder}:${nonce}` -> { skill }. **Only requests whose holder signature checked out**
  const byThread = new Map()
  const stars = new Map()    // `${skill}:${version}` -> Set(nullifier). **A separate set per version**

  const key = (holder, nonce) => `${String(holder).toLowerCase()}:${nonce}`
  const starKey = (skill, version) => `${skill}:${version}`

  // Re-read at startup so a restart does not hand back a spent call budget
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
    // Only a request whose holder signature checked out decides who owns a nonce.
    // Binding it from an unsigned request would let a legitimate request be turned into a REPLAY afterwards (#14-2)
    const k = key(rec.holder, rec.nonce)
    if (rec.holderValid && rec.skill && !owners.has(k)) owners.set(k, { skill: rec.skill })
    // Stars are held per version. **When the version changes, the previous version's stars no longer count** (they all go out at once)
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
     * Reserve one call. **Call this before execution.** There is no await between the check and the write,
     * so hammering it cannot exceed maxCalls (#14-3). Returns null if nothing is left.
     * A failed execution does not give the call back (fail-closed: the budget stays narrowed).
     */
    reserve(holder, nonce, maxCalls) {
      const k = key(holder, nonce)
      const used = counts.get(k) ?? 0
      if (used >= Number(maxCalls)) return null
      counts.set(k, used + 1)
      return { used: used + 1, remaining: Number(maxCalls) - used - 1 }
    },

    /** Record one entry. Does not touch the call budget (reserving is reserve's job). */
    append(rec) {
      const row = { at: new Date().toISOString(), ...rec }
      appendFileSync(path, JSON.stringify(row) + '\n')
      index(row)
      return row
    },

    /**
     * Claim one star. **The same person cannot star the same version twice.**
     * No await between the check and the write (same reason as the call budget). Returns false if it cannot be claimed.
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

    /**
     * The pseudonyms (World identifiers) of the people who starred that version. **A way to show whose, not how many.**
     * Pseudonyms only; no names. Who among them you know is something only the viewer's own device knows.
     */
    starWho: (skill, version) => [...(stars.get(starKey(skill, version)) ?? [])],

    /** Star counts per version. **It keeps how many the previous version had too**, so that going out is visible */
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
