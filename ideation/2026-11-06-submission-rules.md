# Submission and judging rules (ETHGlobal official, received 2026-11-06)

**Source:** https://ethglobal.com/events/mumbai/info/details
(Key information / Important rules / Submitting / Judging / Demo video)
**This document is a summary of the original plus our compliance status. If it conflicts with the original, the original is right.**

## 1. Deadline and how to submit

| | |
|---|---|
| **Submission deadline** | **11/7 09:00 IST. Late submissions are not accepted** (no extensions) |
| Where | The form in the Hacker Dashboard (ethglobal.com/events/mumbai/home) |
| Required | Title, description, **repository URL** |
| Video | **Optional, but strongly recommended** (it appears in the Showcase) |
| Partner prizes | **Up to 3 partners.** **You can apply to all tracks of the same partner and it only uses one slot** |
| How | (1) Finalist + partner prizes (enter Finalist judging) / (2) partner prizes only |

**Partner judging is done on the submission alone. Visiting the booth is optional** (for feedback and networking).
→ **Anything you did not get to say at the booth does not count toward the evaluation. Put all of it in the submission.**

## 2. Prohibited and required (conditions that disqualify or exclude you)

- **Classic "From Scratch": work must begin after the hack starts.** Pre-existing code, design or assets are
  **not allowed except public libraries and starter kits**. Pre-built work can still participate but is
  **excluded from partner prizes and Finalist**
- **Use version control. One giant commit or a missing history can disqualify you**
- **State explicitly what you reused.** Separate what is new from what is borrowed
- **AI tools (Claude Code etc.) are allowed, but:**
  - **State in the submission where and how you used them** (which code, which files, which assets)
  - **Something built by AI alone can be excluded from partner prizes and Finalist**
  - **If you built it spec-driven, put the spec, the prompts and the planning artifacts in the repository.**
    Judges look not at "the output" but at "how you instructed it"

## 3. Judging

**Finalist: 7 minutes per team = 4-minute demo + 3-minute Q&A.**

| Criterion | What it means |
|---|---|
| Technicality | How hard the problem is, and how refined the solution is |
| Originality | Is it new, or does it solve an existing problem creatively |
| **Practicality** | **Is it finished. Can the target person use it today** |
| Usability (UI/UX/DX) | Is it intuitive. Has it been made easy to use |
| WOW Factor | Is it memorable |

**The three standard questions: what inspired you / which tools you used and why / what difficulty you solved and how.**

## 4. Video rules (breaking them means being asked to resubmit)

- **2–4 minutes.** Under 2 or over 4 minutes **gets rejected at upload**
- **Below 720p is rejected**
- **Do not fast-forward to fit the length**
- **Text plus music only (no speaking) is not allowed**
- **Do not film on a phone**
- **Text-to-speech / AI voiceover is not allowed** (speak in your own voice)
- Speak slowly / avoid noise and echo / self-introduction up to 20 seconds / edit out waiting time /
  slides are **4 lines max per slide**

## 5. Our compliance status (as of 2026-11-06)

| Rule | Status | What was fixed / what remains |
|---|---|---|
| 11/7 09:00 IST deadline | OK | Our own deadline stays at 06:00 (3 hours of slack) |
| From Scratch | OK | Started after 11/5 21:00. The prior research notes are not in a public place |
| Version control history | OK | Small commits accumulated. No giant single commit |
| Stating reuse | **fixed** | `ledger-app/` derives from LedgerHQ's `app-boilerplate-rust` (Apache-2.0). Section added to the README |
| **Stating AI usage** | **fixed** | Added an "AI usage" section to the README. The spec and the planning (`spec/`, `ideation/`) are all in the repository |
| 3 partner prizes | OK | World / 0G / EF. **Now that multiple tracks of the same partner are confirmed to use one slot, we can go for World's 2 tracks and several 0G tracks at once** (the "unverified" note in `research/11-prize-gap.md` is resolved) |
| Video 2–4 min | **watch out** | The current script is **2:55**. It is over 2 minutes so it is fine. **Do not shorten it into the 1-minute range** |
| 720p, own voice, no phone | **watch out** | Screen recording at 1080p, **speaking in my own voice**. No text-to-speech software |
| Finalist 4 min + 3 min Q&A | **fixed** | **Decided to enter (Decision 19).** The 4-minute script and the Q&A answers → `2026-11-07-finalist-4min.md` |

## 6. What changes in the plan because of this

1. **The text written in the submission form counts for more than what is said at the booth.** Partners judge on the submission alone
2. **The video is in my own voice, 2–4 minutes.** No escaping into text-to-speech
3. **A 4-minute demo plus three Q&A answers** is prepared (`2026-11-07-finalist-4min.md`). The 3-minute version stays for the Showcase.
   **On the submission form pick "Finalist and Partner Prizes"**
4. **Write the AI usage in the README** (without it we could be excluded from partner prizes and Finalist)
