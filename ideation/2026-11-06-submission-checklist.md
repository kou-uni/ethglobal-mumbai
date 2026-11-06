# Everything to do before submission (as of 2026-11-06 05:16 IST)

**Deadline = 2026-11-07 09:00 IST** (`research/00-event-facts.md`, measured from ETHGlobal's own feed data).
About **27 hours left**. With filming at 11-06 22:00 IST, the technical freeze is **11-06 20:00 IST**.

**Marker meanings**: [verified] = confirmed against a primary source / [customary] = ETHGlobal's usual practice, unverified for this event /
[must-check] = we are stuck if we do not confirm it. Resolve with venue staff or on Discord.

---

## 0. Timeline, worked backwards

| Time (IST) | What | Who |
|---|---|---|
| 11-06 morning | Faucet funds arrive → one production seal. Record the tx and root hash | kou |
| 11-06 morning | 0G API key, World client registration → turn off simulation mode | kou |
| 11-06 afternoon | Star screen and record screen implemented | minta |
| 11-06 17:00 | **Two full run-throughs** (the 5 paths: ALLOWED / DENIED / STOPPED / NEEDS_PRESS / stars) | both |
| 11-06 20:00 | **Technical freeze.** From here it is filming and writing only | both |
| 11-06 22:00 | Filming (within 2:55) | both |
| 11-07 00:00 | Upload the video, fill in the submission form | kou |
| 11-07 **03:00** | **Complete a provisional submission** (6 hours before the deadline; fix the rest by editing) | kou |
| 11-07 09:00 | Deadline | — |

**Getting the provisional submission in early is the single most effective piece of admin.** [customary] ETHGlobal lets you edit until the deadline,
so submitting once with blanks at least removes "forgot to submit". [must-check] Confirm at the venue whether editing is allowed.

---

## 1. What is currently blocked (nothing else moves until these clear)

| Blocked thing | What it needs | Status |
|---|---|---|
| Real write to 0G Storage | Gas from the faucet (0.1 0G/day is enough) | Requested for both addresses, not yet arrived |
| 0G weight judgement (production) | `ZG_API_KEY` | issue #15, not obtained |
| World proof of personhood (production) | `WORLD_CLIENT_ID` / `SECRET` | Awaiting registration |
| Removing simulation mode | All three of the above | If `simulated: true` remains, **the submission becomes a lie** |

**Where we draw the line if funds and keys are not all in place by the afternoon of 11-06** (decide this in advance):
- 0G Storage cannot be written → write in the submission text that **the trail is local append-only**. Do not pretend there is a tx
- No 0G API → **do not film in simulation mode.** Shift the emphasis to demonstrating `STOPPED`
  (nothing happening when 0G cannot be reached is the prize requirement itself, so **this makes a fine highlight in its own right**)
- No World → the star demo becomes **an explanation of the design**, not a mock of the OIDC denial path

---

## 2. ETHGlobal admin (platform)

- [ ] **Create the project** (Project inside the event page on ethglobal.com)
- [ ] **Add every team member.** [customary] Each one needs an ETHGlobal account, and **they cannot be added after the deadline**.
      Add minta early
- [ ] **Select 3 partner prizes** → **0G / World / Ethereum Foundation (CROPS)**
      [verified] Up to 3 per project (`research/00-event-facts.md`)
- [ ] Form fields (an English draft is in `ideation/2026-11-06-submission-draft.md`)
  - [ ] Project name: **TOMOSHIBI**
  - [ ] Tagline (one line)
  - [ ] Short description
  - [ ] **How it's made** (prize judging reads this. The 0G / World / CROPS paragraphs are in there)
  - [ ] **Source code**: make `github.com/kou-uni/ethglobal-mumbai` **public**
  - [ ] **Live demo URL** → **undecided. See §4 below**
  - [ ] **Video URL** (YouTube. Unlisted is fine, but it **must be viewable without logging in**)
  - [ ] Cover image / logo (one flame image) [must-check] whether it is required
- [ ] **Check-in / wristband** (at the venue. Top priority if not done)
- [ ] **Register the prize payout address** in the profile. [customary] Without it you do not get paid even if you win.
      **ETHGlobal often pays to a single team-representative address** → agree the split with minta verbally in advance
- [ ] [must-check] The format and time of judging. A 2–3 minute pitch plus Q&A at a venue table, or video judging only.
      **Be sure to ask whether there are separate sponsor-specific judging slots (0G / World)**

---

## 3. Per-prize hard requirements (miss one and you are disqualified or marked down)

**0G**
- [ ] 0G must **affect the decision** (not be a log sink). Show the path where weight changes the outcome
- [ ] **A fallback that fakes a decision is disqualifying** [verified]. This is why `STOPPED` is implemented.
      **Turn off `ZG_OFFLINE` before filming**
- [ ] Show the 0G **request id** on screen. Paste one real one into the submission text too
- [ ] What we used: Private Computer (TeeML `0gm-1.0-35b-a3b`) / Storage Log layer / Galileo 16602

**World**
- [ ] **Demonstrating the refusal paths is a requirement** [verified]. Film `human_denied` (a person refuses) and `proof_expired` (nobody there)
      **as two separate events**. This is the core of the World slot
- [ ] Say in one sentence why proof of personhood sits at star issuance rather than at every key use
- [ ] "One per person per version" via sector-scoped pseudonym

**Ethereum Foundation (CROPS)**
- [ ] Put an **OSS license** (MIT) in the repository
- [ ] **Zero trackers and analytics.** Already stated in the README
- [ ] The "who knows what" separation table (in the architecture slide and the README)
- [ ] [must-check] Re-read the prize page for any extra CROPS form or condition at submission time

---

## 4. What to do about the demo URL (undecided, decide today)

**The main machine's Tailscale Funnel is frozen** (do not touch it until the ETHGlobal Tokyo rewards are distributed, the owner's instruction).
So TOMOSHIBI's public URL needs **a different outlet**. Options:

1. **GitHub Pages** (only the static parts: the star screen and the record screen) — safe. The Broker does not run
2. **A temporary cloudflared / ngrok tunnel** — shows the Broker itself. Depends on the venue network and on tokens
3. **Give no URL** — submit with the video plus the repository. [customary] A live demo is often not mandatory, but
   **a blank field is weak in judging**

→ **Default is 1 + the video.** Swap to 2 if it works.

---

## 5. Filming (11-06 22:00 IST)

- [ ] **Within 2:55.** [customary] 3-minute cap
- [ ] Shooting order: (1) the key was never handed over (2) the four lines on the Ledger and the press (3) out of scope → `DENIED`
      (4) 0G weight → `NEEDS_PRESS` (5) 0G unreachable → `STOPPED` (6) stars, and the version changing so they go out
- [ ] **A request id and a root hash must appear on screen at least once**
- [ ] `simulated: true` must appear nowhere (**eyeball health right before filming**)
- [ ] Physical: Ledger charged / cable (**left at home, unresolved**) / a quiet place / screen recording resolution
- [ ] Decide whether audio is dubbed afterwards or recorded live. English narration

---

## 6. Writing and assets (what is left)

- [ ] Clear every `[to confirm]` in the submission text (`ideation/2026-11-06-submission-draft.md`)
- [ ] **The 3-minute pitch script** (a version spoken in Japanese plus a version read in English) — **not written. Next thing to write**
- [ ] One-slide architecture (English, HTML) **done** → `ideation/2026-11-06-architecture-v3.html`
- [ ] Hand the spec §6 test vectors to minta (the issue comment is blocked by permissions; **handing them over directly is fine**)
- [ ] Final re-read of the README (it is the first thing judges look at)

---

## 7. After submission

- [ ] Record the showcase page URL
- [ ] **Post the submission link** in each of the 0G / World / EF Discords and Telegrams. [customary] Sponsor
      mentors pick it up and try it before judging. Many teams skip this
- [ ] Feedback form [customary]
- [ ] Bring out the Japan angle **only during the team introduction** (`JAPAN-ANGLE.md`. Do not mix it into the product explanation)
