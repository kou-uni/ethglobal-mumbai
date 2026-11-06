# Repository refactor — strategy (proposal, needs minta's agreement)

**Written 2026-11-06. Nothing here is done yet.** The goal is that an AI first-pass reader and a
human judge can both find the case for this project in under a minute, **without moving a single
file before the submission deadline.**

---

## 1. Who we are optimising for, and what they actually see

| Reader | What they see | What they never see |
|---|---|---|
| **AI first-pass grader** | The submission text, the **first few hundred words of README.md**, and the **directory listing** | The video, the device, the booth |
| **Human judge, in a queue** | The README first screen, then two or three clicks | Anything that takes longer than that |
| **minta and kou** | Everything | — |

**So the directory listing is a document.** Right now it reads: `ideation/` (40 files, all prefixed
with a date), `ui/`, `web/`, `research/`, `spec/`, `broker/`, `ledger-app/`, `bridge/`, `assets/`.
A reader cannot tell which of `ui/` and `web/` is the demo, cannot tell that `ideation/` holds the
submission text, and has no reason to think a folder called "ideation" contains anything finished.

---

## 2. The constraint that shapes everything: what breaks if we move files

**These URLs are already written into the submission draft and are live right now:**

- `https://kou-uni.github.io/ethglobal-mumbai/ui/index.html`
- `https://kou-uni.github.io/ethglobal-mumbai/ui/stars.html`
- `https://kou-uni.github.io/ethglobal-mumbai/web/gate.html`
- `https://htmlpreview.github.io/?…/blob/main/ideation/2026-11-06-storyboard.html`

Moving `ui/`, `web/` or `ideation/` **changes all four**, during the hours when they matter most.

**And three of minta's branches are open:** `minta/ledger-app`, `minta/screens`,
`minta/star-as-fact`. Any move under `ledger-app/`, `web/` or `ui/` turns their next merge into a
rename conflict — the kind git resolves badly when the file content also changed.

**Conclusion: no file moves before submission. The readability win has to come from additions.**
That is not a compromise; the two things that actually get read — the README first screen and the
folder listing — can both be fixed without moving anything.

---

## 3. Phase 1 — before submission. Additive only, zero path changes

| # | Change | Risk |
|---|---|---|
| 1 | **A README.md in every directory that lacks one**: `ideation/`, `ui/`, `spec/`, `research/`, `assets/`. Five short files: what is in here, what to open first, what is finished vs working notes | **None.** New files only |
| 2 | **`ideation/README.md` becomes the index of those 40 files**, grouped by purpose — submission / design / market / research / superseded — so nobody has to read date prefixes to find the submission text | None |
| 3 | **A "read this in 30 seconds / 5 minutes / 30 minutes" table near the top of the root README**, pointing at exactly three, then six, then everything | Edits README only. Reviewable in one diff |
| 4 | **A one-line banner on superseded documents** (`architecture.md`, `architecture-v2.html`, older drafts): *"Superseded by X."* **We delete nothing** — the history of what was rejected is part of what we are showing | None |
| 5 | **Repository description and topics** set on GitHub. This is the first line an AI reader and a judge both see, and it is currently empty | None |
| 6 | `ui/README.md` states plainly **which of `ui/` and `web/` is the demo being judged**, and that the other is the earlier screen set | None |

**Every item is a new file or a README edit. No path that anyone has linked to changes.**

## 4. Phase 2 — after the submission lands. Moves, on a branch, with minta

Proposed target, for discussion — **not to be executed before the deadline**:

```
README.md  LICENSE
docs/      START-HERE.md  STORY.md  LEAN-CANVAS.md  ADDRESSES.md
           design/   (ideation/*.md, date prefixes dropped)
           diagrams/ (ideation/*.html)
           research/
spec/      broker/   ledger-app/   bridge/
demo/      (ui/ and web/ merged, one of them retired)
```

Conditions, all of which must hold first:

1. **The submission is in.** The live URLs no longer matter minute-to-minute.
2. **minta's three branches are merged**, so no rename lands on top of open work.
3. **Redirect stubs stay at every old Pages path** for as long as the links are public.
4. It is done as **one branch, one PR, reviewed by both** — not as a sequence of small moves.

---

## 5. What we are explicitly not doing

- **Not deleting anything**, including superseded drafts. The rejected versions are evidence of how
  the thing was decided, and the submission makes that claim out loud.
- **Not renaming `ideation/` before the deadline**, even though the name undersells it.
- **Not touching `ledger-app/`, `web/` or `ui/` file paths** while minta has branches open.
- **Not reorganising `broker/`.** It is the part that runs, the tests reference its paths, and the
  spec links into it. There is no readability problem there worth a regression risk.

---

## 6. How we will know it worked

Open the repository in a fresh browser session and, **without scrolling past the first screen**,
answer: what is this, does it run, what can I check, and where is the thing I should read next.
If any of the four needs a scroll or a guess, Phase 1 is not finished.
