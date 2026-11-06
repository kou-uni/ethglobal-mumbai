# Philosophy — why we are building this (2026-11-06)

> The feature list is in `2026-11-06-review.md`. This file holds the **thinking** behind choosing those features.
> Features can be cut in 36 hours. What is written here does not get cut.

## 1. The premise changed
**The inside of a PC is no longer a place for humans only.**
An AI like Claude Code can read `.env`. Even if it says "I did not read it", nobody can guarantee that. The mechanism that would guarantee it sits inside the same PC as the thing doing the reading.

**Blockchains removed the third party. AI brought the third party back.**
Someone is standing between the person and the service again. The question is who guarantees that third party.

## 2. Trust moves from "what can it do" to "who vouched for it"
> Services are converging for people, so trust is going to be about who approved it, who said it was good.

> The way I choose things myself is, I trust what the people I trust chose.

**Not how many stars, but whose stars.**
Do not collapse reputation into one number. The same AI scores differently for each viewer. A reputation built only from the vouches of people you trust, computed on the viewer's own device. Who you know never leaves the device.

## 3. Trust is something you stake
> If that person you trusted betrays you, that fact gets recorded too. I want to make full use of verifiability.

A vouch is issued by staking your own credibility. If the AI you vouched for betrays, that is recorded against the voucher as well, and the other AIs that person vouched for get thinner too. **The record of the permit is itself the evidence of the violation, and it reaches all the way back to the voucher.** The parts are not new. What is new is that this loop closes.

## 4. Punish only provable betrayal; for anything merely suspicious, just report it
Punishment applies only to what is provable with a signature (a request outside the declared scope). We do not punish on a **judgement** that the content is shady or inflammatory. We only report it. A system that punishes on judgement will, eventually, punish an innocent party.

## 5. Keep one button on hand that the AI cannot press
**An AI can press "allow" a hundred times a second. This is the one button it cannot press.**
An AI can read keys, can click on-screen approvals itself, and can manufacture reputation in bulk (a fake reputation costs $0.0027 each). Anything a program can do, an AI can do at scale. The one thing it cannot do is press a physical button.

So the hardware is not a defensive ornament. It is **the part that makes reputation unforgeable**. Because only a person can press it, "who allowed this" becomes real. Take the hardware out and the whole trust record goes back to being worth $0.0027.

**The safe stays silent; the face does the talking.** Punishment comes from the Ledger (proof), reporting comes from Stack-chan (judgement). The line drawn in section 4 is exactly the line between the two devices.

## 6. Protect by not holding
> Ideally I do not want to put data in the cloud either. I think businesses do not want to hold excessive user information either. This feels like exactly the kind of world view web3 can defend.

Proof of personhood is used "only for that moment". It is not a login; it is a one-time receipt of consent. All the business receives is a zero-knowledge proof and a pseudonym — **because it does not hold anything, it cannot leak anything**. The Ledger proves "this was pressed here and now"; World ID proves "this is a unique human". Together they mean one human, on the spot, allowed this request.

## 7. Normally nothing happens. A person steps in only when it matters
A system that asks every time for safety's sake gets thrown out in three days. Normally it runs automatically on a thin token, so that an incident stays small. The person and the device step in only when it matters. **Not degrading convenience is part of safety too.**

## 8. Vouching is given, not sold

> **[This section predates 11/6 early morning]** Tips, quadratic matching and deposits were dropped in Decision 1.
> What is staked now is "your own key itself", and no money moves inside the product (`2026-11-06-actors-io.html` §03).
A vouch is **a donation of knowledge**. Money comes back to the voucher as a "thank you" from the person who was protected. We do not build a path from developers to vouchers. The moment that path exists, vouching turns back into "placement you can buy".

"A hundred people at one dollar each" counts for more than "one person at a hundred dollars" (quadratic funding). Its weakness, fake accounts, is closed by counting only unique humans. This is the same idea as "whose stars".

**GitHub's culture of giving, plus unforgeable stars and a mechanism by which betrayal comes back.**

## 9. What we hand over is "room to feel safe" (2026-11-06, the owner's words)

> "This product ends up giving both sides of the user room to feel safe."

**That room is created in opposite ways on the two sides.**

- **For the key holder (the side buying credibility), the room is "time they do not have to watch".**
  Nothing appearing, normally, is the product; the more time they spend looking at a screen, the less value there is.
  → **Notifications, always-on monitoring displays and dashboards are features that fill the room in. Adding them is equivalent to cutting the price.**
- **For the skill maker (the side selling credibility), the room is "being watched, safely".**
  They cannot step outside the declared scope, and if they do it is recorded along with their own signature.
  So **when they are suspected they can answer with evidence**, and innocence can be shown from the record too.
  → The flame going out when the version goes up is not a punishment; it means **you get to start from a clean floor every time**.

**Room cannot be created by adding. It is created by subtracting.**
There are only three moments of interruption (a heavy request / the flame went out / you find out afterwards that you were stopped).
Pricing follows the room too — **we do not charge for the time we stay silent** (metered verdicts only).

**And we do not sell the feeling of safety itself.** We do not reimburse, and we do not say "you are safe now".
We hand over exactly two things: **time you do not have to watch** and **evidence**. The moment safety becomes the product, it is a lie.

## What we did not choose
- **Paying the voucher every time the skill is used**: developers could buy vouchers
- **Punishing on judgement**: judgement is wrong sometimes. A wrong punishment is recorded against an innocent party
- **Collapsing reputation into one score**: it can be bought with fake accounts (ERC-8004 itself writes "Sybil attacks are possible")
- **Asking for approval every time**: safe, but nobody uses it
- **Collecting people's information in order to protect them**: the moment you collect it, you are a place it leaks from
