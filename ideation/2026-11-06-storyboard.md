# Screens and scenes (demo script v3) — 2026-11-06

> v3: **integrated #8 (minta).** Changed the Ledger from "a panel that shows the 4 scope lines" to "**the place where the star is pressed**".
> **The red `DENIED` is withdrawn** (the real device is a black-and-white e-paper display; show it by inverting black and white).
> Figures: [view on a phone](https://htmlpreview.github.io/?https://github.com/kou-uni/ethglobal-mumbai/blob/main/ideation/2026-11-06-storyboard.html)
> Markers: **[decided]** agreed / **[proposed]** not yet decided by the two of us

---

## 0. In one line

> **0G decides the weight. The Ledger stops it last.**
> *0G decides how much it matters. The Ledger decides whether it happens.*

**The three circles** = the three sponsor companies. **A star lights up only when all three line up.** [decided, #7]

| Circle | What it says | Company | The forgery it prevents |
|---|---|---|---|
| ⬤ Is a human | One person can give one skill one star | **World** | Mass production of fake accounts |
| ⬤ The key holder pressed it | The AI inside the PC cannot reach this physical button | **Ledger** | Impersonation by the AI inside the PC |
| ⬤ Actually using it | Only things with a usage record become stars. 0G decides the weight every time | **0G** | Recommendations made with words alone |

---

## 1. The Ledger screen (the body of v3; #8 integrated) [proposed]

### The strongest image (found in v3)

> **In the black sky behind, 1,284 bought stars. On the white paper in your hand, 2 real ones.**

The real device is **black-and-white e-paper**. The starry sky on the PC is white on black; the constellation on the Ledger is **black on white**.
**Without using color, the fake and the real stand side by side as two inverted images.** That is the composition of the opening shot S1.

### Display per scene

| Scene | Display | What it conveys |
|---|---|---|
| **Idle** (0:00–0:58 / 1:28–1:42) | **"Your sky"** = your own constellation in black and white. As stars increase, lines connect them. "2 stars" | **It asks you nothing.** But it is alive |
| **Permit** (0:58–1:28) | "Let this skill use your key?" plus the 4 scope lines (KEY/TO/SCOPE/UNTIL). **Sign with a long press** (hold and the button fills in from one edge; release to cancel) | **The AI's 100 taps a second, versus a human's one long press** |
| **Right after approval** | **A ★ stamp** drops down: "it became a star". **At the same instant, one star is added to the sky behind** | The physical button and the star are directly connected |
| **Denial** (1:42–2:12) | **The whole screen inverts black and white.** A large ✕ and `DENIED`. The destination and the operation struck through | This is the one button it cannot press |
| **Verify** (2:32–2:50) | **Show nothing.** The QR appears in the detail of the sky (screen A) | The Ledger's role is only "scope" and "denial" |

**The flicker of the e-paper inverting black and white** appears at every screen transition. **Do not remove it.**
The sound and sight of the machine physically rewriting itself is the evidence that "this is not a software effect".

### Why show the denial on the Ledger (design rationale) [proposed]

An out-of-scope request is **stopped by the Broker**, so it should never reach the Ledger.
Even so, **we show the fact of the denial on the Ledger as a notification** (no signature required; just the ✕ and the reason).

> **A denial that doesn't appear in your hand is a denial you can't see.**

A signal shown on the PC is indistinguishable from characters written by the AI inside the PC. **The denial above all should appear in your hand.** [decided, #7]

### Order of degradation (if the custom app isn't ready in time) [proposed]

**Three things that cannot be dropped:** (1) the scope is readable (2) it doesn't go through unless you press (3) the denial appears in your hand

| Level | Contents | What is dropped |
|---|---|---|
| **Level 1** | Constellation + long press + ★ stamp + inverted `DENIED` | — |
| **Level 2** | Long press + ★ stamp + inverted `DENIED` | The constellation (idle can just be a dark screen) |
| **Level 3** | The standard app's 4 scope lines + the standard approval. The denial is shown by **"the Ledger never asks at all"** | Long press, stamp, inversion |

**The script does not break even at level 3.** Just swap one subtitle line:
"The Ledger **does not even show this request to a human**."

---

## 2. Don't make 0G a record keeper [proposed]

Put 0G in place as **"the brain that decides whether to wake the Ledger"**.

| 0G's judgement | Ledger |
|---|---|
| **Routine** | Stays on the constellation. Asks nothing. Goes through automatically |
| **Significant** | The screen changes. 4 scope lines → long press |
| **Decisive** | Requires the scope plus **World ID** |
| **Unreachable** | **The screen changes.** Does not go through automatically (fail-safe stop) |

`0G: decisive (req_8f2a…)` appears at the edge of the screen, and **one beat later** the Ledger rewrites itself.
**The order being visible on screen is the evidence that 0G is inside the decision flow.** The request ID goes straight into the trail.

> **Judgement in the cloud, denial in your hand.** / *Judgment in the cloud. Refusal in your hand.*

---

## 3. There are only three screens [decided, #7]

| | What appears | Who touches it |
|---|---|---|
| **A Sky** | One toggle (everyone / people I know). Tap a star → who / what / **the three grounds**. **The QR is here too** | The judge (the toggle) |
| **B Ledger (physical)** | Constellation → 4 scope lines → ★ stamp / inverted `DENIED` | The judge (one long press) |
| **C Record** | From the QR in A. The trail as a single vertical line: permit → use → return → **0G's judgement** → violation | The judge (their own phone) |

**We do not show a "star count" in the sky.** The moment you show a count, you are back on buyable ground. [decided, #7]
**Screens we do not build:** settings / dashboard / balance / log viewer / admin panel / Stack-chan.

---

## 4. Shot list (5 cuts) [proposed]

| # | Name | Image |
|---|---|---|
| **S1 Silence** | A desk. The PC behind shows **1,284 in a black sky**, the AI hammering "allow". **The Ledger in front shows a 2-star constellation on white paper, motionless** |
| **S2 Birth** | Long press → the button fills in from one edge → the ★ stamp → **in the same shot, a star lights up in the sky behind. Don't cut** |
| **S3 Routine** | Time passes. `0G: routine` keeps streaming by. **The Ledger stays on the constellation and never asks once** |
| **S4 Denial** | Macro. **Black and white invert** into ✕ and `DENIED`. The AI hammers away behind. **There is no finger pressing** |
| **S5 In the hand** | The judge's hands. The trail on a phone. The Ledger sits on the desk |

**Principles:** the camera's home position is the Ledger / the PC is behind and out of focus / **never substitute a PC capture for the real device's screen** / show all three states: pressing, not pressing, and **not being able to press**.

**⚠️ Decide the lighting after seeing the real device.** The e-paper may not be self-illuminating.
v2's "the Ledger screen is the only light source" is **withdrawn**. Replaced with the plan of **making it look like paper with angled ambient light** (confirm in #5).

---

## 5. The 3-minute video (0:00–2:55) [proposed]

| Time | Shot | What happens | Subtitle |
|---|---|---|---|
| 0:00–0:10 | **S0 Question** | Black screen. Text only. **Voice only** | **The AI tool you installed this week — whose advice did you pick it on?** |
| 0:10–0:20 | S0 (cont.) | Leave a 2-second beat, then answer it yourself | Probably because someone you trust was using it. **That is a star** |
| 0:20–0:30 | **S1 Silence** | Stars multiply in the black sky behind ($0.0027). The AI hammers away. **In front, 2 on white paper** | Stars can be bought. $0.0027 each |
| **0:30–0:52** | A (close) | The judge presses `people I know`. **The full sky vanishes in 0.6 seconds, leaving one** | **Not the number of stars, but whose star it is** |
| 0:52–1:08 | A (detail) | **The three circles light up in turn** | A single star lights up only when all three line up |
| **1:08–1:38** | **S2 Birth** | `0G: significant` → the Ledger rewrites itself → 4 scope lines → **long press** (fills in) → **★ stamp** → a star lights up in the sky behind. Having the AI do it doesn't rewrite anything | I'm not recommending it. I'm just showing you what I use |
| 1:38–1:48 | **S3 Routine** | A few days pass. `0G: routine`. **Stays on the constellation** | In routine use, it asks nothing |
| **1:48–2:18** | **S4 Denial** | An out-of-scope request. `0G: decisive` → **black and white invert** into ✕ `DENIED`. The AI keeps hammering. **There is no finger** | **This is the one button it cannot press** |
| **2:18–2:36** | A (wide) | Every star on that version goes out **at once**. The judge's key has stopped too | **If the tool you installed yesterday was quietly updated today, would you notice?** |
| **2:36–2:50** | **S5 In the hand** | The QR in A → the trail. Permit, use, return, **0G's request ID**, violation, in one line | No one can erase it |
| 2:50–2:55 | S1's composition | The Ledger's constellation gains one star, and it ends | **Judgement in the cloud, denial in your hand** |

**The one-shot principle:** from 1:08 on, **the Ledger and the PC screen are in the same frame at the same time.**

**Diff for the 4-minute final:** add 15 seconds at the top to **hand the Ledger to a judge.**
One line after 2:55: "That long press you just made is the button an AI cannot press."
**Add only verbally (not in the video):** "If you have a Ledger, raise your hand. From today it is also a key for your AI."
Whether hands go up is luck on the day, so **put it only where the video doesn't break if it misses.**

### What to show in the starry sky (#10 D, E) [proposed]

Make the demo's stars **the tools the two of us actually entrusted our keys to during these 36 hours.**
"Two real stars on the white paper in your hand" becomes a fact rather than a figure of speech. The trail becomes a real usage history too.

**There is one condition for putting them in:** **do not put a real key in until the Broker has succeeded at least once on a call that passed the scope check.**
Once we clear that, we keep developing with our own tools for the remaining time. At filming time both stars will be real.

The `$0.0027` at the top (the number from the paper) **gets replaced if we can measure "how many times our AI opened `.env` during these 36 hours".**
If we can't count it, it stays the number from the paper. **Don't show what you can't measure.**

---

## 6. Taglines [proposed]

> **Not the number of stars, but whose star it is.** / *Not how many stars. Whose.*

| Scene | Japanese | English |
|---|---|---|
| Problem | Stars can be bought. $0.0027 each | Stars are for sale. $0.0027 each. |
| Answer | An AI can press "allow" 100 times a second. This is the one button it cannot press | An AI can press "Allow" 100 times a second. It can't press this one. |
| The three circles | A single star lights up only when all three line up | One star. Three things that must all be true. |
| 0G | 0G decides the weight. The Ledger stops it last | 0G decides how much it matters. The Ledger decides whether it happens. |
| Inversion (v3) | 1,284 in the black sky behind. 2 on the white paper in your hand | 1,284 stars on the screen. Two in your hand. |
| Denial (v3) | A denial that doesn't appear in your hand is a denial you can't see | A refusal you can't see isn't a refusal. |
| What the star contains | I'm not recommending it. I'm just showing you what I use | I'm not recommending it. I'm showing you what I actually use. |
| Ripple | Stars from the people on the same boat | Stars from people in the same boat. |
| Privacy | Who you know never leaves here | Who you know never leaves your device. |
| Closer | From stars you can buy, to stars you can't | Stars you can't buy. |

---

## 7. Designed so that it doesn't look broken when it misses [proposed]

| What could happen | How it looks on the day | The script line |
|---|---|---|
| **0G unreachable or slow** | **The Ledger rewrites itself.** Does not go through automatically (= fail-safe stop) | "When it can't get through, we don't let it through; we call a human" |
| **The custom app isn't ready in time** | **Degrade from level 2 to level 3** (§1). The script doesn't break | "The Ledger does not even show this request to a human" |
| World is mocked at the venue | State it verbally as a design-level claim | "What this prevents is the mass production of fake accounts" |
| The scope doesn't render on the Ledger (#5) | Fold the scope into a single line of text | **Do not drop the readability of the scope itself** |
| Anon-RPC doesn't work (#6) | Demote reads to a toggle. For EF, go with CROPS alone | Drop it from the video |

---

## 8. Things not yet verified (put on #5)

- Whether the e-paper is **self-illuminating** (it changes how we decide the lighting)
- Whether a **custom app** can draw arbitrary figures (constellation, ★ stamp) / whether we can build a **long press** / whether it can keep the screen on while idle
- Whether the 4 scope lines are readable in the standard Ethereum app (the floor for level 3)
