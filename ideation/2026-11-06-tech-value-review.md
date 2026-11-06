# The three technologies: their position, their value as experience, and whether they are really in the implementation

**In one line: all three are in the experience. But because the Broker knows everything,
the three circles end up merely standing on a single pillar called "trust the Broker".**

**And we are currently putting World in the wrong place.** → §4.

---

## 0. The conclusion table

| | Technical position | Value as experience (what happens to the person) | Is it in the implementation |
|---|---|---|---|
| **World** | "A human is here right now" via Agent Pass (OIDC device flow) / using IDKit's nullifier as a pseudonym | **It makes stars unbuyable.** This is what defines "real" against the 1,284 fake stars | **The pseudonym is in. But it is placed in the wrong spot (§4)** |
| **Ledger** | EIP-712 signature. The key stays inside the device. The 4 scope lines are hashed inside the device | The single point that **there is a place the AI physically cannot reach**. Without it, everything becomes a software promise | **It's in. But what it protects is the "permit", not the "key" (§3)** |
| **0G** | Judges the weight in Private Computer / the trail in Storage / the registry on Galileo | **Quiet.** In routine use it asks nothing. This is the only reason "handing your keys to an AI doesn't wreck your life" | **It is in the decision loop. But the "reason it has to be 0G" is weak (§2)** |

---

## 1. World — it makes stars unbuyable

### Technical position
- **IDKit's nullifier** is inscribed on the star directly as a **pseudonym**. No name needed
- **Agent Pass** (`device_code`) confirms "a human is here, immediately before a protected action"

### Value as experience

**The first line of this work is "stars can be bought. $0.0027 each."** World is the answer to that.
**As long as "one per human" holds, stars cannot be multiplied with money.**

**Not showing a name is also value.** For "whose star it is", **it is enough that "stars from the same person have piled up", not the real name.**
The nullifier is exactly that granularity, and **it knows nothing beyond it.** Minimal and sufficient (exactly the IDKit prize's requirement).

### Is it in → **the pseudonym is in. Its placement is wrong (see §4)**

---

## 2. 0G — it creates the quiet. But the reason is weak

### Technical position
- **Judges the weight in Private Computer** (routine / significant / decisive / unreachable)
- **The trail in Storage** (append-only; permit → use → return → judgement → violation)
- VouchRegistry / ViolationRegistry on Galileo

### Value as experience

**0G is what creates "not being asked".**

If the Ledger lit up every time, nobody would use it. **It stays silent in routine use and wakes only when it is significant.**
0G is what draws that line, and **this is the only "practical" part of this work.**

And **the Ledger showing "cannot judge" when 0G is unreachable** means
"it stops when it breaks" is visible in your hand. **Safety is in your hand, not on a screen.**

### Is it in → **it is in. But the "reason it has to be 0G" is weak**

**The current weight judgement could also be written as rules.**
Out of scope? Large amount? First time with this counterparty? **Then no inference is needed.**
If a judge asks "why 0G?", answering "we put the logs there" sinks us.

**There is one way to make it strong. Make the input to the weight judgement something you don't want anyone to see.**

> The weight cannot be decided without reading the **contents** of this request.
> But we don't want to show those contents to the Broker or to ourselves.
> **So we judge it in Private Computer.**

**If that holds, the reason for the dependency stands in one sentence** (0G's required item).
**And there is only one way to make it hold → §5.**

---

## 3. Ledger — what it protects is the "permit", not the "key"

### Technical position
An EIP-712 signature. **The hash is computed inside the device from the original values of the 4 scope lines** (`spec/permit-signature.md`).
So **the 4 lines shown on screen and the thing being signed are the same.**

### Value as experience

**There is a place the AI physically cannot reach.** It has no fingers, so it cannot press.
Software "permissions" can be bypassed by software, but **what has not been pressed has not been pressed.**

**Without this, the work goes back to being a "promise".** Of the three, **it is the only one software cannot substitute for.**

### Is it in → **it's in. But there is a weakness we should state honestly**

**What the Ledger protects is the signature on the permit, not the API key itself.**
The key is inside the Broker. **The Ledger protects the "permit"; it does not protect the "key".**

Hide this and CROPS will hit it. **Write it in the README ourselves.** If §5 is solved, this is solved along with it.

---

## 4. What we are getting wrong right now: where to put World

In `spec/world-agent-pass.md` §2, it is written so that Agent Pass is called **immediately before the key is used**.
**That is wrong. It duplicates the function of the Ledger's long press.**

**From the person's point of view, they are asked twice for the same single act.** We cannot explain what the second one is for.

### Sorted out

| | What it confirms | When |
|---|---|---|
| **World** | **Who they are** (that they are a human, that they are the same human) | **When giving a star (once)** |
| **Ledger** | **Do I permit this, right now** (scope and expiry) | **When a key is used (every time)** |

**Giving a star is a heavy act.** You stake your own reputation to say "I am using this".
**Putting proof of humanity here is natural, and it also satisfies the prize requirement (verification immediately before a protected action).**
**The protected action = giving a star** (writing to VouchRegistry).

**Don't call World every time a key is used.** That is the Ledger's job.

→ Fix `spec/world-agent-pass.md` §2. S2 in script v4 (the star is born) becomes the order
**Agent Pass → the Ledger's long press → ★ stamp.** **This is the only place where the three circles light up at once.**

---

## 5. The three circles are standing on a single pillar

**World, Ledger and 0G all sit on the premise of trusting the Broker.**

The Broker holds the plaintext API key, executes the calls, and writes the trail.
**If the Broker lies, all three are meaningless.**

| | If the Broker lied |
|---|---|
| World | It could insist it verified the proof |
| Ledger | It could execute without checking the signature |
| 0G | It could fake the weight and get away with never waking the Ledger |

**The three circles do not distribute trust. They merely stand next to each other.**

### One move solves this, and §2 and §3 too

**Put the Broker inside 0G Private Computer (a TEE).**

| What it solves | How it solves it |
|---|---|
| **§2 "why 0G"** | **Decide the weight and execute the call without showing the contents to anyone.** Only a TEE can do this. The reason for the dependency stands in one sentence |
| **§3 the key isn't protected** | The key is still at the Broker, but **nobody can peek into that Broker.** "Not in the person's hands, but not in anyone's hands either" |
| **The P in CROPS** | The foul against "keys and personal data stay inside the device" **disappears in the implementation, rather than in an explanation of an exception** |
| **§5 one pillar** | The Broker stops being a trust point. **The three circles really become three** |

**This is the core of the design.** Whether it fits in the time is a separate matter, and **if it doesn't, write it honestly in the README**
("in production it goes in a TEE. This time it is not").
**But always write which one we chose. Don't choose silently.**

---

## 6. Where in the journey each one matters

| Where the person is | World | Ledger | 0G |
|---|:--:|:--:|:--:|
| **Looking at the sky and choosing a skill** (Priya) | ○ pseudonym | — | ○ trail |
| **Giving a star** (the guaranteeing side) | **◎** | **◎** | ○ |
| **Continuing to use the key** (routine) | — | ○ it asks nothing | **◎ quiet** |
| **A significant request arrives** | — | **◎ long press** | **◎ weight judgement** |
| **A violation appears** (the stars go out at once) | — | — | **◎ trail** |

**The only place all three matter at once is "the moment a star is given".** This is not a defect.
**A tool that demands all three all the time doesn't get used.**

**So the climax of the demo can be "the moment a star is given"** (S2 in script v4). **That's right.**

---

## 7. What to do

| | What to do | Where it helps |
|---|---|---|
| **1** | **Fix `spec/world-agent-pass.md` §2.** Put Agent Pass at "when a star is given" | The duplication in the experience disappears. It also satisfies the prize requirement |
| **2** | **Make the input to the weight judgement "something you don't want seen"** (include the body of the request) | "Why 0G" stands in one sentence |
| **3** | **Spend exactly one hour trying whether the Broker can go on Private Computer** | §2, §3, CROPS and §5 all get solved at once |
| **4** | If 3 falls through, write in the README ourselves that "the Broker is a trust point" | Stronger than holding a weakness silently |
