# Analyzing the judging criteria on the assumption that an AI does the scoring (2026-11-06)

**Premise** (the owner, 2026-11-06): **assume the first round of judging is scored by an AI.**
The original criteria are in `2026-11-06-submission-rules.md` §3 (Technicality / Originality /
Practicality / Usability / WOW Factor). Here we break those criteria down **from the side of
"what an LLM actually reads."**

---

## 1. The most important premise — the AI does not watch the demo

The official rules say **partner judging is done on the submission alone** (rules §1).
If an AI does the scoring, what it can see is narrower still:

| What the AI sees | Confidence |
|---|---|
| Submission form Name / Short description / Description / How it's made | **Near certain** |
| The repository URL → **the first few hundred words of the README** | High |
| Repository structure (file names, directory names, commit history) | Medium |
| Screenshots (if embedded in the README; if multimodal) | Medium |
| **The content of the video, the live hardware demo, conversations at the booth** | **Almost certainly not seen** |

**Consequence: the persuasive weight currently carried by the 2:55 video and the live hardware demo
scores zero points in the first round.**
The video is for the Showcase and the Finalist round (where humans watch). **What AI scoring looks at
is the prose and the structure.**

---

## 2. What the AI scores, criterion by criterion

### Technicality — difficulty of the problem and sophistication of the solution

An LLM **cannot estimate** difficulty. It is decided by whether it is written down.
The current `How it's made` says what we built, but **it does not say what was hard.**

**Add (just three, named explicitly):**
1. **The screen and the signature cannot disagree** (the EIP-712 digest is computed on the device from
   four values. The host never sends a digest = blind signing is structurally impossible)
2. The **call budget constraint with no `await` between the check and the record** (100 concurrent
   requests still cannot exceed the limit. Proven by test)
3. **Not building a fallback** is itself hard (if 0G is unreachable, `STOPPED`.
   We do not let things through on a default value. **A fake judgment is worse than no judgment**)

### Originality — newness

An LLM can only judge "new" **as a difference from the neighbors**. If the difference is not written,
it gets rounded off into an existing product.
`market-and-model.html` §01 has a table of the three adjacent markets, but **it is not in the
submission text.** Put it in as one paragraph.

> Secrets managers decide where a key lives. Certificate systems decide which machine it is.
> Agent payment rails decide that it can pay. **None of them decide whether this one request,
> right now, was allowed by a human — and none of them keep the refusals.**

### Practicality — is it finished / can the target user use it today

**The easiest points to win and the easiest to drop.** An LLM proxies "can this be used today" by
**the density of verifiable signals**. Signals we already have in hand but that are not in the
submission text:

| Signal | Value |
|---|---|
| The seal tx on mainnet | `0x74c7cdf9…` / block **64103318** / `status 0x1` |
| 0G Storage root hash | `0xc0e0c7a9…` |
| Tests | **50/50** |
| Measured against production 0G | **467 calls**, 2.0 s and **$0.000036** per judgment |
| Screens you can touch (**all three confirmed 200 on 2026-11-06**) | `/ui/index.html` `/ui/stars.html` `/web/gate.html` |
| Reproduction steps | **3 commands** (`START-HERE.md` §2) |

**Hashes and counts work on an LLM simply because they have the shape of something verifiable.**
Adjectives (robust, production-ready) backfire. **Replace them with numbers and hashes.**

### Usability (UI/UX/DX) — this is where we currently score lowest

**Zero images in the README.** An AI cannot score a UI it does not see.
There are SVGs in `assets/`, but they are not embedded in the README.

**Work (30 minutes):**
- Embed **three screenshots** at the top of the README (the four ways the gate stops / the four lines
  on the device / before and after a flame goes out)
- **DX in three lines**: `git clone` → `npm i` → `node src/server.js`, and `npm test` is 50/50
- If the UI is in Japanese, **add a one-line English caption under the image** (the AI reads the
  caption rather than the Japanese inside the image)

### WOW Factor — decided by one sentence. Position is everything

An LLM is strongly pulled by **the beginning** of a long text (position bias).
Our strongest sentence already exists: **"Review scores never go away. Flames go out. That is why
they mean something."**

**Right now it is on line 11 of the README**, with a Japanese heading and a table above it.
**Move it into the first three lines.**

---

## 3. The biggest structural problem — the first screen of the README

**The first 200 words of the current README are a Japanese table of contents for 20 `ideation/` files.**

To an AI scorer, and to a human judge in a hurry, this looks like
**a pile of notes, not a product.** Japanese ratio: 54%.

**Fix (highest priority):** replace the top of the README.
1. One sentence of English copy
2. One paragraph of English explanation (= the same text as the submission form's Short description)
3. **Three screenshots**
4. **Try it now** (3 demo URLs + the 3-command reproduction steps)
5. **Verifiable facts** (tx hash, block, tests 50/50, 467 measured calls)
6. Then "What was hard / Why it's new"
7. **The table of contents goes below that.** With one line of explanation:
   "Design records below are in Japanese — that is the team's working language."

**Do not translate all of the Japanese.** All of the value left in the remaining time is in
English-ifying the opening and in the screenshots.

---

## 4. Where the AI-usage disclosure could turn into a deduction

The rules say **"anything made purely by AI may be excluded from partner prizes and the Finalist
round"** and at the same time **"put all specs, prompts and plans in the repository. Judges look at
how you instructed it, not at the output."**

**The current disclosure (README §How we used AI tools) is good. But one thing is missing:
a concrete example of where a human changed a decision.**

**Add (two lines):**
- **The design changed in minta's PR #4** ("make stars facts, not promises") — a human proposal
  reversed the direction
- **We keep 23 decisions, with reasons for the rejections** (`ideation/2026-11-06-decisions.md`).
  **What we threw away**: escrow deposits, insurance, percentage-of-payment pricing, Stack-chan, ENS

**"What we rejected" does not appear in something made purely by AI.** That is the strongest trace
of a human.

## 5. Order of work (priority for the remaining time)

| | What to do | Time | Criteria it hits |
|---|---|---|---|
| 1 | **Replace the first screen of the README with English + 3 screenshots** | 40 min | WOW / Usability / Practicality |
| 2 | Put **the tx hash, block, 50/50 and 467 calls** into the submission text | 15 min | Practicality / Technicality |
| 3 | Put **the three "what was hard" items** and **one paragraph of difference from the three adjacent markets** into the submission text | 20 min | Technicality / Originality |
| 4 | Add **two lines of "a concrete example where a human changed a decision"** to the disclosure | 5 min | Avoiding disqualification |
| 5 | Add the India alignment (`2026-11-06-why-mumbai.md`) as **one slide, 20 seconds** | 10 min | Originality / WOW |

**1 through 4 touch only the submission text and the README, no code.** They finish before filming
(22:00 IST).
