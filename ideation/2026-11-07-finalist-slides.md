# Finalist pitch — the 3-minute slide skeleton (2026-11-06)

> **Five slides. The middle of the talk has no slide at all, because the product is running.**
> The 4-minute running order with every spoken line is in `2026-11-07-finalist-4min.md`;
> this file is the structure and what each part is for. Built to land at **2:45**, so there is
> fifteen seconds of slack and no race at the end.
>
> Judged on **Technicality / Originality / Practicality / Usability / WOW**.
> What we are told matters most is **showing a working system**, so the live run is the spine and
> the slides only hold what a live screen cannot say.

---

## The shape

| | Time | What is on screen | What it is for |
|---|---|---|---|
| **S1** | 0:00–0:25 | **The problem.** One picture, one sentence | Everyone in the room has done this |
| **S2** | 0:25–0:45 | **The claim**, and three words | They know what they are about to watch |
| **— live —** | **0:45–2:15** | **No slide. The product** | Technicality · WOW · Usability |
| **S3** | 2:15–2:35 | **Who uses it, who pays** | Practicality |
| **S4** | 2:35–2:45 | **One closing line** | What they repeat to each other afterwards |

**Total 2:45.** If they cut you off anywhere after the press at ~1:30, the point has landed.

---

## S1 — The problem (0:00–0:25)

**On the slide:** a key taped to a robot hand — and **behind it, a dozen more.** Three short lines under it.

> **No limit. No expiry. No receipt.**

**Said:** *"I suspect there are people in this room who pasted an API key into an AI agent this
week. Maybe this morning. That key has no spending limit, it never expires, and it produces no
receipt. We would never hand a credit card over like that.*
>
> *And it is never just one. Every agent, every skill, every service wants its own. **The thing the
> AI era has quietly handed us to manage is not prompts, and not models. It is keys** — more of
> them, in more places, held by more software than any of us is actually keeping track of."*

**Do not put the product name on this slide.** The first twenty-five seconds belong to the problem.

---

## S2 — The claim (0:25–0:45)

**On the slide:** the name, one sentence, and three words.

> **TOMOSHIBI — the approval layer that keeps the key and gives the agent one approved action at a time.**
>
> **The key is never handed over · It asks only when it matters · Every refusal is on the record, with who tried**

**Said:** *"We keep the key. The agent gets one approved action at a time, and the approval is
signed on hardware it cannot press. Here it is running."*

---

## The live run (0:45–2:15) — **no slide**

Five beats. Each one is a different thing the system does, not a different step of a procedure.

| | ~ | What they see | The one sentence |
|---|---:|---|---|
| **1 Silent** | 10 s | A routine read passes. `0G: routine` | *"The key never reached the agent. The gate used it on its behalf."* |
| **2 Heavy → press** | 35 s | `0G: significant` → the real device rewrites itself, four lines → **a long press** → it goes through **once** | *"Money is about to move, so it asks. An agent can tap a hundred times a second. This is the one button it cannot press."* |
| **3 Refused** | 20 s | An out-of-scope request → `DENIED`, recorded **with the skill's own signature** | *"It stopped before it ran, and it has a name on it."* |
| **4 The flame** | 15 s | Bump the version → every star goes out at once | *"A star here is a fact, not a promise. Change the version and they all go out."* |
| **5 The trail** | 10 s | The record, and the transaction on 0G Storage | *"Allowed and refused sit in the same record, and it is on-chain."* |

**If the device misbehaves:** go on talking and show the same press on screen; the fallback ladder
is in `2026-11-06-storyboard.md` §"Order of degradation". **Never stop to fix hardware on stage.**

---

## S3 — Who uses it, who pays (2:15–2:35)

**On the slide:** two faces and one pricing line. Nothing else.

> **Today:** anyone who has handed an agent a real key — small shops, small teams.
> **Who pays:** marketplaces that have to answer for a stray skill.
> **How:** metered judgement and flame display. **We take no percentage of the money that moved.**

**Said:** *"We charge for judgement, not for volume — so we are never a company that loses money
the more it stops."*

---

## S4 — The close (2:35–2:45)

**On the slide:** the line alone, on ink.

> **A review score never expires. A flame goes out.**

---

## Where each criterion is earned

| | Where |
|---|---|
| **Technicality** | The press on real hardware, and `DENIED` carrying the skill's signature |
| **Originality** | Four distinct refusals, never collapsed — and stars that go out |
| **Practicality** | S3, twenty seconds, and the fact that it is running |
| **Usability** | Beat 1: on an ordinary day it asks nothing |
| **WOW** | Beat 4: every flame going out at once |

---

## What is deliberately not in the three minutes

Say these only if asked. Each has a ready answer in `2026-11-07-finalist-4min.md` §3.

- **`STOPPED`** — what happens when the sealed model cannot be reached (almost always asked)
- **Where the key actually lives**, and that a local Broker is a demo convenience → `ideation/2026-11-06-where-the-key-lives.md`
- **The architecture diagram** — one spoken sentence beats a slide: *"who knows what is separated by design"*
- **x402 and why budget control is left to the implementation**
