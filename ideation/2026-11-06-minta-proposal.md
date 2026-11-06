# Proposal from Minta: make the star a "fact", not a "promise" (2026-11-06)

> This is a proposal written after reading `final-image.md`, `philosophy.md` and `review.md`.
> Markers: **[proposed]** not yet decided by the two of us / **[unverified]** not researched or confirmed
> The eight pillars of the philosophy are kept as they are. What I want to change is the content of the "guarantee", and the scope of what we build.

## In one line
**Don't make Arjun guarantee anything. Make the star the fact that Arjun has entrusted his own key.**

> A recommendation can be said out loud. Whether you entrusted your key cannot be faked.

There are three changes I propose.
1. **What the star contains**: from a promise that "this skill is good" → the fact that "I am using this with my own key"
2. **How betrayal is handled**: instead of lowering the guarantor's weight → inscribe it on the skill, and protect everyone using it at the same time
3. **Scope of what we build**: no deposit, no tipping, no secondary matching this time (mention them in one line during the presentation)

---

## 1. Problem: Arjun is carrying too much risk

In `final-image.md`, Arjun's one line is "I want to recommend good things. But I don't want to be betrayed after recommending them." The current design puts that "don't want to" squarely on him.

| What Arjun carries | What Arjun gets |
|---|---|
| Puts up a deposit | Thanks (tips) and matching |
| Weight drops if betrayed | A track record as a judge of quality |
| Even other skills he guaranteed get thinner | He learns about anomalies first |
| Loses a friend's trust | |

Arjun cannot stop a skill from being updated. It is **a shape where you bet your own name on a future you cannot control**. The more knowledgeable and careful a person is, the less they will give out stars. If no stars appear, the web of trust never grows.

---

## 2. Idea: the star = the fact that "I have entrusted my own key" [proposed]

When Arjun uses a skill for himself, he issues a permit on the Ledger anyway. **We just make that permit a star visible to the people he knows.** No extra work for the sake of guaranteeing.

| | Current plan (guarantee) | Proposal (fact) |
|---|---|---|
| What the star says | "This skill is good. It will stay good." | "I am, right now, using this version, with this scope, with my own key." |
| Can it be wrong | Yes (the future is unknown) | No (it is a present fact) |
| Effort | Ledger + World ID for the sake of guaranteeing | A by-product of the permit you issue for your own use. World ID only when you make it public |
| Hardness to fake | Can be issued with words alone | Cannot be issued without actually entrusting your own key |

### Three properties of the star
1. **It is a fact**: since no promise is made, Arjun has not lied even if the skill betrays him
2. **It is alive**: a star is tied to "the version of the skill" and "Arjun's permit". If the skill is updated, or the permit expires, the star disappears automatically. **An old star never lingers and gets used as a signboard for a version nobody has seen**
3. **The more you show it, the more you are protected**: warnings flow between people who show each other their stars (see 2.2 below)

### 2.1 "Trust is something you bet" (pillar 3) survives
We change what is bet. **The stake is neither a deposit nor a reputation — it is your own key itself.** Arjun is not a guarantor; he is someone on the same boat. The fact that he would also be harmed is what gives the star its weight.

Betrayal is still inscribed as a fact, but we change where it is inscribed.
- **Inscribe it on the skill**: evidence of an out-of-scope request. Every star on that version disappears, and permissions stop
- **Do not inscribe it on Arjun**: all that stays in the record is the fact that "Arjun was using it too. It stopped N minutes later." His weight is not lowered

### 2.2 The more you show it, the more you are protected (pillar 4's line works as is)
| Kind | How far it reaches | Basis |
|---|---|---|
| **Provable violation** (out-of-scope request) | Everyone. Permissions stop for everyone using that version | On-chain evidence |
| **A judgement that something is suspicious** (TeeML warning) | Only people who show each other their stars | "A warning appeared for this skill on Priya's device" |

Judgements are not used for punishment; they are only relayed along human connections. For Arjun, the more he shows his stars, the more eyes watch the skill on his behalf. **The act of taking on risk turns into the act of being protected.**

### 2.3 What's in it for Arjun (works with no money involved)
- **People stop asking**: to "which skill is good?", he can just show his sky
- **He is protected too**: warnings from acquaintances' devices reach him
- **He can choose more easily too**: everyone is both Priya and Arjun
- **A history remains**: "used it early, and nothing went wrong" remains in a verifiable form

### 2.4 Honest weaknesses
- **A star where the permit is issued but the skill is never used**: cheap to manufacture. The countermeasure is to count only stars that have a usage record (a 0G request ID) — the same as "only word of mouth with evidence of actual use" in `integrated.md`
- **Differences in scope**: Arjun may be read-only while Priya also sends money. We put the scope into the star and show "Arjun is using it read-only"
- **What you are using becomes visible**: we let you choose who sees it. Only the pseudonym goes on chain (unchanged from the current design)
- **A new skill has no stars**: someone has to be the first person. A skill with no stars simply starts with thin permissions; it is not unusable

---

## 3. Overall concept [proposed]

**An AI cannot hold a proof of humanity. So a human lends their own proof.**

The pitch in three lines (from pillars 2 and 5)
1. **Problem**: stars can be bought. $0.0027 each
2. **Answer**: an AI can press "allow" 100 times a second. This is the one button it cannot press
3. **Worldview**: not the number of stars, but whose star it is

A single star lights up only when three things line up. Each prevents a different kind of forgery.

| What lines up | What it carries | The forgery it prevents |
|---|---|---|
| **Being a human** | World ID | Mass production of fake accounts. One person can give one skill one star |
| **The key holder pressed it** | Ledger | Impersonation by the AI inside the person's own PC |
| **Actually using it** | 0G usage record | Recommendations made with words alone |

World and Ledger do not overlap in role. With World alone, the AI inside the PC could issue the star on the person's behalf. With Ledger alone, one person could create 1,000 keys.

---

## 4. Journey [proposed]

Built on the storyboard in `final-image.md`, with ★ marking what changed.

### Priya (the protagonist)
| # | Scene | What happens | Subtitle |
|---|---|---|---|
| 0 | Hook | The AI opens `.env`, hammers "allow", and manufactures 1,000 fake stars | "The AI is already inside your PC" |
| 1 ★ | Choosing | Switching to "people I know only" makes the sky full of stars vanish, leaving one. "Arjun using it read-only, 42 days" | "Not the number of stars, but whose star it is" |
| 2 | Installing | The scope appears on the Ledger screen. One press | "The key never leaves the Ledger" |
| 3 | Routine | It runs automatically with thin permissions. The Ledger stays quiet | "In routine use, you don't have to do anything" |
| 4 | The day of the accident (climax) | The skill is updated and requests something out of scope. 0G judges it and stops it, and `DENIED` goes to the Ledger | "This is the one button it cannot press" |
| 5 ★ | Ripple | Every star on that version disappears at once. **Arjun's key stops at the same time, and he is protected** | "Stars of the people on the same boat" |
| 6 | Verifying | A viewer traces the record | "No one can erase it" |

### Arjun (the person who gives stars) ★
1. **Uses it**: installs the skill for himself and issues a permit on the Ledger (up to here, this is what anybody does)
2. **Shows it**: chooses "show to people I know". One proof with World ID turns it into a star
3. **Does nothing**: the star shines only while he is using it. When the skill is updated the star disappears automatically, and it shines again when he re-permits the new version
4. **The day of the accident**: his own key stops too, so he is protected. Warnings from acquaintances' devices reach him. His weight does not drop

### How Arjun's one line changes
- Before: "I want to recommend good things. But I don't want to be betrayed after recommending them"
- After: "I'm not recommending anything. I'm just showing what I use"

---

## 5. Demo (4 minutes in the finals. The video is cut to under 3 minutes) [proposed]

Make it work with a single judge. **The judge plays Arjun.**

| Time | Content |
|---|---|
| 0:00–0:40 | **Buying stars**: have the AI manufacture 1,000 fake stars, and have it press the software "allow" itself as well |
| 0:40–1:20 | **The stars disappear**: switch to "humans only". The sky full of stars vanishes |
| 1:20–2:20 | **Using it makes a star**: the judge permits the skill for their own use (Ledger) and shows it with World ID. One star is added to the presenter's sky. Doing the same thing with an AI adds nothing |
| 2:20–3:30 | **The day of the accident**: the skill is updated and requests something out of scope. 0G stops it, `DENIED`. The judge's star disappears automatically, and the judge's key has stopped too. "You have lost nothing" |
| 3:30–4:00 | **Verifying**: the judge traces the record on their own phone |

- Video length: ETHGlobal says 2–4 minutes. 0G asks for under 3 minutes, so **we build it at 2:00–2:59**
- Finals presentation: 4 minutes of demo + 3 minutes of Q&A

---

## 6. Relationship to the prizes [proposed]

Partner prizes are capped at three. Whether World's two prizes are counted separately is [unverified].

| Prize | Amount | What is required (from the prize page) | Where this product shows it |
|---|---|---|---|
| **World ID Agent Pass** | $5,000 | Requiring a fresh proof at that moment / demonstrating the full flow / **a scene where a protected operation does not happen because of a denial, an expiry, etc.** / verification on the backend / a retrospective on the integration | The moment a star is shown, and approval of a decisive operation. Revoke the proof and the star does not appear, and the operation does not happen |
| **World Best Use of IDKit** | $2,500 (up to 2 teams at $1,250) | Solving a real "moment of trust" / **the reason for choosing the minimum necessary proof** / both the successes and the alternatives / a retrospective on the integration | The moment of trust = when a star is shown. All we want to know is "is this a unique human", so Proof of Human is enough — we explain that |
| **0G Physical AI** | $5,000 (one slot for a work with real hardware) | **Calling 0G inside the decision flow** / a record with a request ID per decision in 0G Storage / a fail-safe stop when 0G is unreachable (faking the judgement disqualifies you) / the contract address | For each request, 0G's AI decides the weight (routine / significant / decisive). If it doesn't get through, call a human or stop. The Ledger is the real hardware |
| **Finalist** | — | Technology, originality, practicality, usability, surprise | A problem statable in one line (stars can be bought) / a demo you can touch (press it and it becomes a star) / a number ($0.0027) |

### Don't make 0G a "record keeper"
0G's prize page excludes works that "use 0G only for recording". The TeeML in the current design only warns; it does not change the decision. **I propose putting the weight judgement itself on 0G.**
- This does not contradict pillar 4. The AI's judgement is only "call a human"; it is never used for punishment
- 0G becomes what decides the "is this significant?" of pillar 7 (a human appears only when it is significant)
- When 0G is unreachable, we do not let it through automatically; we require the Ledger

### Things that will sink us if forgotten
- Both World prizes require **a retrospective on the integration** (time to first success / where you got stuck / missing features or docs / the single most effective improvement). Take notes while working
- World proofs are mocked at the venue (the prize page says "mocking proofs" and "fake identities"). We talk about "preventing fake accounts" as a design-level claim
- The plan is to leave ENS out of our three. If we include it, we keep it minimal as the place for the skill's name and its declaration

---

## 7. What we build and what we don't [proposed]

### Build order
| # | What to build | Pass criteria |
|---|---|---|
| 1 | Signing a permit on the Ledger | The scope appears on screen in readable form |
| 2 | The Broker's `use` and scope check | `DENIED` appears for out-of-scope |
| 3 | Showing a permit as a star (World ID) | Both success and revocation work |
| 4 | 0G's judgement and record | The weight changes with the judgement, and it stops when unreachable |
| 5 | The starry-sky screen | Stars disappear and appear from real on-chain data |
| 6 | Sound and haptic devices | Only if there is time left |

The permit signature and the star signature can be merged into one, so there is less to build than in the current design.

### Not building this time (mention in one line in the presentation)
Deposit / thanks (tips) and secondary matching / zero-knowledge guarantees / automatic writes to ERC-8004 / ENS / Stack-chan

### How the Broker is handled
We state explicitly: "the Broker is a trust point. In production it goes in a TEE." 2-of-2 is incompatible with a design that runs automatically without pressing the Ledger in routine use, so the plan is to drop it this time.

---

## 8. Diff against the current documents

| Item | Current documents | This proposal |
|---|---|---|
| What the star contains | A guarantee (a promise) | The fact that I am using it with my own key |
| Effort of guaranteeing | Ledger + World ID done separately | A by-product of the permit for your own use |
| Deposit | Kept as the stake | Not built. The stake is your own key |
| Where betrayal lands | Lowers the guarantor's weight. Their other skills get thinner too | Inscribed on the skill. Everyone using it stops at the same time |
| Motivation | Tips and secondary matching | People stop asking / you are protected too (no money) |
| 0G | Recording, plus reading responses and warning | Carries the weight judgement (it is in the decision flow) |
| Thickness of connections | 3 levels (met / worked together / just know of) | 2 levels (met / know). Add more later if that is not enough |
| Hardware | The Ledger is the lead (agreed) | Same. Stack-chan can be forgotten |

## 9. Answers to the six questions in Issue #2
1. **Story**: go with Priya and Arjun. Two climaxes: "choosing (the stars disappear)" and "the day of the accident"
2. **First application**: API key management. The skill marketplace is talked about as who we sell to
3. **Thickness and deposit**: 2 levels. Drop the deposit this time
4. **Broker**: state it is a trust point. Drop 2-of-2
5. **What to cut**: the "not building this time" list above
6. **People without a Ledger**: don't show it this time. If asked, answer "a phone passkey could stand in, but the protection is weaker"

## 10. Unverified
- How readably the scope appears on the Ledger screen (verify this first)
- Whether World's two prizes are counted separately within the limit of three
- Whether a nullifier with a fixed action can be used as a pseudonym in IDKit
- Whether the time 0G's judgement takes is short enough to wait for in a demo
- At what granularity the fact of "using it" is shown to acquaintances
