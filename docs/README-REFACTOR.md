# README — a refactoring proposal (7 Nov)

The README is 433 lines under 30 headings, and two generations of the idea stand side by side in it.
Someone who opens the repository for thirty seconds should get, in this order: **what it is → see it work →
why it is different → what is real.** This is a plan for getting there. Nothing in it is applied yet, except the
video at the top.

## 1. Where the old and the new are mixed

| Where | Old (still there) | New (agreed on 6 Nov) |
|---|---|---|
| The first screen (lines 16–32) | "the approval layer that hands over **one use** instead of the key", for "anyone who hands an AI agent a real key — a Stripe secret, a wallet, a logged-in session" | A **switchboard** between a builder's tools and her keys. A tool calls by **label**. |
| The person | Anyone with an agent; a shop owner in `POSITION.md` | A **builder**, with Claude Code on one laptop, tired of managing keys |
| What she signs | "which key, which destination, **which operation, how many times**, until when" | The key, where it goes, until when. (The device still shows a `SCOPE` line.) |
| Try it now (lines 34–42) | "**lend** a key, get woken, read the morning after" → `start.html`; `gate.html`; `ui/stars.html` | The app is `app.html`. The three old pages are prototypes. |
| The reputation | **star** everywhere | **light** (see section 2) |
| Structure | "four parts" (Custody / Weight and press / Trail and attribution / Flame) | the switchboard, eight steps, and what accumulates |
| Sponsors | Explained twice: "What each sponsor's technology does here" (line 130) and "Why these three…" (lines 280–333) | Once |
| "What we concentrated on, criterion by criterion" (lines 334–400) | Speaks to the judges directly, criterion by criterion | The same content, placed where a reader meets each claim |
| Facts | "60 tests"; "the anonymous read path for stars"; `demo.mjs` as the way in | 65 tests; the app and the walkthrough are the way in |

## 2. One rule for *light* and *star*

**Light is ours. Star stays in two places only.**

| Keep **star** | Why |
|---|---|
| Where it means an ordinary rating: "not by star count", "a star count means nothing when anyone can make a star" | That is the thing we are contrasted with. Calling it a light would erase the contrast. |
| Names in the code and in the record: `STAR`, `VOUCH_DENIED`, `/stars/…`, `stars` in `store.js`, `ui/stars.html` | They are already written into trails, and some of those trails are sealed in 0G Storage. A document that renamed them would disagree with its own record. |

| Change to **light** | Example |
|---|---|
| Our own thing, in prose and in figures | "A ~~star~~ **light** can be lit only by the person who…", "every ~~star~~ **light** goes out when the version changes", "Not how many ~~stars~~. Whose ~~star~~ **light**." |

The device and the app already say *light* ("A light is lit.", "Light it with World"). When the code's name has to
appear next to the prose, say it once: "a light (`STAR` in the trail)".

## 3. The order proposed (about 200 lines)

| # | Section | What goes in | From today's README |
|---|---|---|---|
| 0 | Title, one line, **the video**, three links | Done | — |
| 1 | **In 30 seconds** | A five-row table: who it is for · what bothers her · what it does · what she gets · what is real today | lines 16–32, rewritten; `POSITION.md` |
| 2 | **How it works** | `nat.png`; the eight steps as one table with *what each step refuses*; the four answers (`ALLOWED` / `NEEDS_PRESS` / `DENIED` / `STOPPED`); `sequence.png` folded | "What it is", "One request", "four parts", "four ways it stops" merged |
| 3 | **What accumulates: lights** | `trust.png`; why a light cannot be bought; why it goes out | "What accumulates", "Why people come back tomorrow" |
| 4 | **What is real, what is a mock, what is not built** | One table, and the facts that can be checked (0G Storage transactions, request ids, 65 tests, 100 concurrent requests against a budget of 3) | "Verifiable facts", "Where this is now", the "did not finish" notes scattered in four places |
| 5 | **Built on** | Ledger · 0G Private Computer · 0G Storage · World ID. For each: what it does here · what happens without it · where in the code · the proof | the two sponsor sections, merged |
| 6 | **Privacy: who learns what** | The table (Ledger / World / 0G / Broker) and the one exception, said plainly | "Privacy (EF CROPS)" |
| 7 | **Why this is not the thing next to it** | Three rows: a secrets manager · a key proxy (they exist) · approval on hardware for transactions only | "Why this is not the thing next to it", Originality |
| 8 | **Run it** | `tools/demo-up.sh`, `npm test`, `node tools/walkthrough.mjs` | "Try it now" |
| 9 | **Where it goes next** | The Broker in a TEE · a drop-in proxy · more APIs · lights per builder | "Where this is now, and where it goes" |
| 10 | **How we built it** | Disclosure: what was reused, how AI tools were used | unchanged |
| 11 | **Further reading** | `docs/HOW-IT-RUNS.md`, `POSITION.md`, the decisions, the business model | "Design and decision records", "Reference" |

**Moved out of the README, linked from section 11:** "Why India picked this problem before we did", "What was hard",
"Design and decision records" (the 20-row table), "Where to look, by how long you have", and the criterion-by-criterion
section. None of it is lost; it is one click away instead of in the way.

## 4. Where the content that matters for judging lands

The README should not address the judges. Each point below is simply true of the product, so it sits where a reader
would look for it.

| What has to be visible | Where it goes |
|---|---|
| **Who uses it, and who pays** (practicality) | §1: builders, who want lights on the tools they ship |
| **The flow with a person in it**: request → she completes it on her own device → verified on the back end → the protected action | §2 step 4 (the hold) and §5 World (the light); the video shows both |
| **Refusals are answers, not errors**: `DENIED`, `STOPPED`, `human_denied`, `proof_expired`, `NOT_USED` | §2, one table |
| **Inference on 0G Private Computer inside the main flow, with a request id** | §2 step 3; §4 lists a real request id |
| **Why 0G, in one sentence** | §5: it is the only place the request body can be read without us, or anyone, keeping it |
| **A safe stop when 0G cannot be reached** | §2: `STOPPED`, no fallback verdict |
| **The trail in 0G Storage, one record per decision** | §4: two transactions from the recorded take, with links |
| **Real hardware** | The video; §5 Ledger; `ledger-app/` |
| **Why come back tomorrow** | §3: a light is only worth something while the tool is still being run |
| **What each outside party learns**, and the exception | §6 |
| **Open source, no trackers** | §8 and the licence line; the pages load nothing from outside |
| **Originality** | §3 (a reputation that can go out) and §7 (the comparison) |
| **What is not finished** | §4, in one place instead of four |

## 5. The first screen, ready to paste

```markdown
# TOMOSHIBI 🕯️

**The switchboard between your AI tools and your API keys.**
A tool calls by label. The key is swapped in only when a call is put through. A heavy call waits for your hand on a Ledger.

[the video block, as it is now]

## In 30 seconds

| | |
|---|---|
| **Who it is for** | A builder who ships AI tools from one laptop, and collects API keys to do it: the model, Stripe, mail. |
| **What bothers her** | Every tool wants a key in a `.env` file. Each key is good for everything, forever, and she cannot say afterwards what it was used for. |
| **What TOMOSHIBI does** | It keeps one table: *label → where it goes → the real key*. A tool holds a label. Routine calls go through. A heavy one, such as a refund, waits until she holds a button on her Ledger. A call to anywhere else is refused, and recorded. |
| **What she gets** | No key in a `.env` file. No heavy call without her. A trail she can read. And a **light** on the tool she built: proof that a real person really runs it, which other people choose by. |
| **What is real today** | A real Ledger, 0G Private Computer, 0G Storage and World ID, end to end. One API on the list (Stripe, in test mode). The Broker runs on her own laptop and is not yet in a TEE. |
```

## 6. Order of work

1. The video at the top. **Done.**
2. The first screen (section 5) and *Try it* pointing at `app.html`.
3. *star* → *light* by the rule in section 2 (README, `POSITION.md`, the figures' source).
4. Merge the eight steps and the four answers into one section; merge the two sponsor sections.
5. Move the long sections to `docs/` and link them.
6. Bring the facts up to date (65 tests; the 0G model in use; what the app does now).

One thing that is not about the README: the submission asks for a video of 2 to 4 minutes, and the walkthrough is
1 min 56 s. If it is submitted on its own, it needs four more seconds.
