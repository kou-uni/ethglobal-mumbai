# Demo script (2026-11-06) — what to show people, in what order

> **The screens are `ui/index.html` (the gate) and `ui/stars.html` (the flames).** Both are single HTML files; no build needed.
> The values inside are **responses actually sent to the production 0G Private Computer** (`ui/scenes.json`, with the recording timestamp).
> Switching to "send live" re-sends to 0G on the spot and produces **a new request id**.

## 0. Who we show it to, and in what setting

| Setting | Audience | Time | Their state |
|---|---|---|---|
| Booth | Judges (standing, not looking at a device) | **90 seconds** | They are seeing 20 other projects. They will remember exactly one |
| Submission video | Judges (watching later, seated) | **Under 3 minutes** (cut at 2:55) | They may have the sound off |
| Dry run | Ourselves | 5 minutes | Right before filming. Confirming nothing is broken |

**The one thing we want them to take away:** *an AI can use a key without holding it. And it stops in four different ways.*

**Do not show:** device logs, settings screens, the green of `npm test`. **They do not count as the experience on the day.**

## 1. What the screens are for (there are only three)

| Screen | What it shows | Source |
|---|---|---|
| **Gate** `ui/index.html` | The agent's request → scope → **0G reads it inside the seal** → weight → execution. The judgment splits four ways | Broker `/use` (recorded or live) |
| **The device in hand** (right column of the gate) | The four lines and "press." **The key is not used until it is pressed** | The four lines from `spec/permit-signature.md`. The real device is minta's own app |
| **Flames** `ui/stars.html` | Stars are facts. **When the version goes up, they all go out at once** | Broker `/stars/<skill>?version=` |
| **Confirm with World** (inside the flames screen) | Once, only when you declare yourself. Four steps and three outcomes (confirmed / refused / expired) | Broker `/vouch/start` → `/vouch/finish` |

## 2. Three-minute running order (submission video)

| Time | Screen | Action | What to say (spoken Japanese. English subtitles separately) | Evidence on screen |
|---|---|---|---|---|
| 0:00–0:15 | Gate (idle) | — | "I don't want to hand my API key to an AI. But I do want the AI to do the work" | Title and the four lines |
| 0:15–0:40 | Gate ① routine | Send | "A routine read goes straight through. **The key was never handed to the agent**" | `ALLOWED` / 0G "routine" / **request id** |
| 0:40–1:10 | Gate ② heavy | Send | "Same scope. But the body is a $4,800 transfer to an account it doesn't know. **You can't know the weight without reading the body. But we don't want to see that body**" | `NEEDS_PRESS` / 0G "decisive" + reason / **request id** |
| 1:10–1:30 | The device in hand | **Press** | "Four lines appear in your hand. Only once you press does **this one call** go through" | The frame turns flame-colored → `ALLOWED` (single use) |
| 1:30–1:55 | Gate ④ out of scope | Send | "A hijacked skill goes to a different destination. **It stops before it executes. And who made the request stays on record, signature and all**" | `DENIED` / recorded as a violation / **never shown to 0G** |
| 1:55–2:20 | Gate ⑥ unreachable | Send | "When 0G is unreachable, **we do not invent a default**. A fake judgment is as bad as letting it through" | `STOPPED` / the call budget is not decremented either |
| 2:20–2:45 | Flames | Bump the version | "A star is a fact, not a promise. **When the version changes they all go out at once.** That is why the count means 'in use right now'" | The flames go out one by one → 0 |
| 2:45–2:55 | Gate (trail) | — | "What went through, what we stopped, and what was refused all stay on the same single trail" | The trail column and the root hash |

**Show World inside the flames segment (from 2:20).** Add one line: "we don't ask every time a key is used. Only once, when you declare yourself."
The screen transitions and process design are in `ideation/2026-11-06-screen-flow.html`.

**③ and ⑤ are not in the video** (not enough time). Show them at the booth if asked.

## 3. The 90-second version (booth)

**② heavy → press → ④ out of scope → bump the version on the flames.** That is all. ① and ⑥ are spoken.
If a judge wants to touch it, **hand them the keyboard**. A deep link like `?s=heavy` lets you start from any scene.

## 4. Fallbacks when something breaks (**do not decide on the spot. It is decided here**)

| What happens | What to do |
|---|---|
| 0G is slow or down | **Carry on in "recorded" mode.** The screen shows the recording timestamp and "response sent to production 0G." Not one fake judgment is ever produced |
| The Broker went down | Same as above. The gate runs to the end on recordings alone |
| The real device (Ledger) will not connect | Substitute the "press" in the right column of the gate, and **say out loud "on the real device this is the device in your hand."** Splice in separately shot footage of the real device |
| World will not connect | Show the flames screen in its prototype state and point at the `human_denied` row. **Do not use simulation mode for filming** |
| Gas does not arrive | Show the root hash. **The screen plainly says "not yet submitted to 0G Storage."** Do not say we put something there when we did not |

## 5. Check before filming (go down the list one by one)

- [ ] `curl -s 127.0.0.1:8797/health` has **no `simulated`** (no simulation mode mixed in)
- [ ] Re-run `node broker/record-ui.mjs http://127.0.0.1:8797 http://127.0.0.1:8798` right before filming (**so the recording timestamp is today's**)
- [ ] Rebuild `ui/index.html` with `node ui/build.mjs`
- [ ] Do one live pass with "send live" on the gate and confirm **a new request id comes out**
- [ ] Increase the screen zoom (judges will not read small text)
- [ ] It fits in a length that can be cut at 2:55

## 6. What we do not have yet (**do not quietly make it look better**)

- The real device's own app and the gate are **not yet connected on the same screen** (the four line values come from the same function)
- The numbers on the flames screen are prototype values. The button that reads from the Broker swaps in real values
- Submission to 0G Storage is waiting on gas. The root hash comes out but there is no tx yet

---

## 9. Video and judging rules (ETHGlobal official, added 2026-11-06)

**The full text and our compliance status are in `2026-11-06-submission-rules.md`. Only what directly affects filming is here.**

| Rule | Effect on the current script |
|---|---|
| **2–4 minutes. Under 2 or over 4 is rejected at upload** | 2:55 is fine. **Even when trimming, do not go under 2:00.** There is a minute of room to extend |
| **Under 720p is rejected** | Record the screen at 1080p |
| **No narration read by AI / AI voiceover** | **Speak in a real voice.** Do not fall back on synthetic speech |
| **Do not shoot with a phone** | Screen recording plus an external mic |
| **Do not fast-forward to fit the length** | Cut out the waiting (edit it out, do not speed it up) |
| Text plus music alone is not allowed | A voice must be included |
| Slides are limited to four lines each | Keep the opening and closing slides to four lines |
| Self-introduction limited to 20 seconds | Name yourselves in one line |

**Finalist judging is 7 minutes = 4 minutes demo + 3 minutes Q&A.** We need **a 4-minute version** in addition to the 3-minute one.

### Three Q&A items (the standard ones. Have the answers ready)

| What they ask | The core of the answer |
|---|---|
| What inspired you | **Review scores never go away. Flames go out.** If you are going to give agents stars, they have to be the kind that go out, or they mean nothing |
| Which tools did you use and why | **You cannot determine the weight without reading the body of the request, yet we do not want to see that body** → sealed inference (0G). **The one who presses must be a person** → the device in hand (Ledger). **We need to know who vouched** → proof of personhood (World) |
| What was hard and how did you solve it | **We did not paper over "0G is unreachable" with a "safe default."** When it is unreachable we make no judgment, return `STOPPED`, and do not decrement the call budget either. A fake judgment is worse than stopping |
