# Finalist judging (7 minutes) script — 4-minute demo + 3-minute Q&A

> **Decision: enter Finalist judging** (2026-11-06, the owner). On the submission form pick
> **"Finalist and Partner Prizes"**. The three partner prize slots (World / 0G / EF) are unchanged.
> The judging time and place **appear on the Hacker Dashboard after submission**, so do not delay submitting (target 11/7 06:00 IST).
>
> The 2:55 submission video is a different thing (`2026-11-06-demo-scenario.md` §2). **This one is the version where a person stands and talks.**

## 0. The axis we are going to win on in these 4 minutes

Judging has five criteria (Technicality / Originality / Practicality / Usability / WOW).
**The 3-minute version is thin on Practicality.** The 4-minute version **spends the last 45 seconds on "who can use this today, and who pays".**

**The one thing they should take away:**
*Let the AI use the key without handing it the key. There are four distinct ways it can stop, and **a stop is never hidden**.*

## 1. Running order (4:00. The end of each block is a safe place to be cut off)

| Time | Screen | Action | What to say | Evidence on screen |
|---|---|---:|---|---|
| 0:00–0:15 | Gate (idle) | — | "I do not want to hand my API key to an AI. But I do want the AI to do the work. **TOMOSHIBI is a gate that lets it use the key without holding it**" (one line of self-introduction) | Title and four lines |
| 0:15–0:40 | Gate (1) routine | send | "A routine read passes silently. **The key never reached the agent.** The gate uses it on its behalf" | `ALLOWED` / 0G "routine" / **request id** |
| 0:40–1:15 | Gate (2) heavy | send | "Inside the same scope. But the body is a $4,800 transfer to an account it does not know. **You cannot determine weight without reading the body. But we do not want to be shown that body.** So we have it read inside sealed inference" | `NEEDS_PRESS` / 0G "decisive" + reason / **request id** |
| 1:15–1:40 | **Real device** | **press** | "Four lines, and only four, appear on the device in your hand. Key label, destination, operation, expiry. **Only once you press does this one call go through.** The key never leaves the device" | The frame turns flame-colored → `ALLOWED` (single use) |
| 1:40–2:05 | Gate (4) out of scope | send | "A hijacked skill goes for a different destination. **It stops before it executes.** And **who requested it is recorded along with the skill's signature**. We did not show this one to 0G either" | `DENIED` / recorded as a violation |
| 2:05–2:25 | Gate (6) unreachable | send | "When 0G cannot be reached, **we do not invent a default.** Not pass, not refuse — it says 'could not decide', and the call budget is not decremented. **A fabricated verdict is as bad as letting it through**" | `STOPPED` / remaining call budget unchanged |
| 2:25–2:50 | Flame | bump the version | "A star is not a promise, it is **a fact**. **When the version changes they all go out at once.** That is why the count means 'in use right now'. Being a human is checked once, at the moment you put your name on it" | The flames go out one by one → 0 |
| 2:50–3:05 | Trail | QR / tx | "What was let through and what was stopped stay in the same single trail. **This is actually on 0G Storage**" | Root hash and the **tx on chainscan** |
| 3:05–3:25 | Diagram (one slide) | — | "**Who does not know what** is separated by design. The device does not know the body of the request. World does not know which key it is. **0G reads the body, but we cannot**" | The single slide from `2026-11-06-stack.html` |
| 3:25–3:55 | Pricing slide | — | "Who can use it today: **small teams who have handed an API key to a person, and makers who are distributing skills.** We charge for **metered judgement and for displaying the flame**. **We take no percentage of the amount that moved. So that we are not a company that loses money the more it stops things**" | Unit economics (one verdict ≈ 300 tokens) |
| 3:55–4:00 | Gate (idle) | — | "**A review score never goes out. A flame does. That is why it means something.**" | Title |

**If they stop you, any point is a fine place to cut.** If you got as far as 1:40, the core of the message is out.

## 2. What to drop if you are running over

1. **The diagram at 3:05–3:25** (reduce it to one spoken sentence: "who knows what is separated by design")
2. **The `STOPPED` at 2:05–2:25** (it is almost always asked in Q&A, so show it there)
3. **The routine case at 0:15–0:40** (open (2) with one line: "routine requests pass silently")

**Never drop:** (2) heavy → press → (4) out of scope → bumping the flame's version.

## 3. Q&A, 3 minutes (the three standard questions + the pushback we know is coming)

### Standard

| What they ask | The core of the answer (in 15 seconds) |
|---|---|
| **What inspired you** | "**A review score never goes out. A flame does.** If you are going to give an agent a reputation, it has to be something that can go out, or it means nothing" |
| **Which tools you used and why** | "**You cannot determine weight without reading the body, but we do not want to be shown it** → 0G's sealed inference. **The press has to come from a human** → the device in your hand (a custom Ledger app). **You need to know who vouched** → World. All three sit **where removing them breaks the design**" |
| **What difficulty you solved and how** | "Not papering over '0G is unreachable' **with a safe-side default**. Papering over it makes the implementation easier, but **it makes the stop invisible.** When it is unreachable we do not manufacture a verdict — it becomes `STOPPED`, and the call budget is not decremented" |

### The pushback we know is coming (**admit it openly, then answer**)

| Pushback | Answer |
|---|---|
| **"If the Broker holds the key, isn't that the trust point after all?"** | "**Exactly right, and in this build the Broker is not inside a TEE.** The README says so. What is separated right now is **the device, World, 0G and the trail**; the gate is the one point left. That is the next thing to move in" |
| "What happens to the demo if 0G goes down?" | "**We show it down.** `STOPPED` appears and the call budget does not decrease. We built no path that hides it" |
| "Do stars survive sybil attacks?" | "A star is **the fact that a key was used**, and we look not at the count but at **whose stars they are**. To light a flame you have to pass **World once, to prove you are a human**" |
| "Who pays?" | "**Metered judgement** (one verdict ≈ 300 tokens) and **the maker's display (the flame)**. We take no percentage of flow" |
| "Is the device real?" | "**A custom app is running on a real Ledger Flex.** When we substitute an on-screen 'press', **we say on screen that it is a substitute**" |
| "How much did AI write?" | "**The README's 'how it was made' says which files were used and how.** The spec (`spec/`) and the decision log (`ideation/`) are **all in the repository**" |

## 4. What to bring on the day, and the procedure

- [ ] **Submit first** (the judging time appears on the Dashboard after submission)
- [ ] The real device (Flex) + cable. Open the browser on **the same machine** that `bridge.py` runs on (**you cannot press from a phone**)
- [ ] `/health` must have no `simulated`
- [ ] Set up deep links like `?s=heavy` so you can **start from any scene**
- [ ] Increase the screen zoom (judges standing up will not read small text)
- [ ] **Assume you get cut off at 4 minutes; get the core out by 1:40**
