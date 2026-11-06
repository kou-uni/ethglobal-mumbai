# The social problem, the novelty, and the sponsor tech being the core

**These three are not separate stories. They connect into one line.**

> **We are heading toward a world where "who did it" cannot be answered.** (the social problem)
> **Stop trying to tell fakes apart. Count only the real ones.** (the novelty)
> **To count the real ones you need World, Ledger and 0G, all of them.** (the sponsors are the core)

---

## 1. The social problem — not a developer inconvenience

### Framed as a developer tool, this always comes out small

"Key management is a hassle", "dependencies are scary". **Those are symptoms.**

### The real problem: the chain of responsibility is broken

**Up to now, credibility was backed by the fact that a person was there.**

- There was a person who made the introduction
- There was a person standing in the shop
- The person who wrote the review was a person (**a liar, maybe, but a person**)

**AI removed that premise.**
**Without a person there, the shape of credibility can be manufactured perfectly.**

And **when something happens, there is no answer to "who did it".**
The person didn't do it. The AI did. The tool the AI used did.
**Someone who quietly rewrote that tool did.**

### This is not a hypothesis

| Fact | Meaning |
|---|---|
| **43,012** MCP servers (2026-10) / **11,809** added per month | **The number of agents is growing faster than the number of people** |
| **Zero governance** across the 15,465 analyzed | **Nobody is taking responsibility** |
| **6 servers resolving to unregistered domains** | **Anyone who grabs that domain becomes that tool. At that moment, thousands of agents are acting as real people, with those people's keys** |
| **62% shipped one version only** | **The remaining 38% are moving. Quietly** |

**When something happens here, nobody can say "I did it",
and nobody can say "you did it".**

### So this is a problem for society

> **When the world started moving without people in it,
> the fact that a person is there became information for the first time.**

**What this work does is not improving ratings.
It is returning actions to a state where they can be traced back to a person.**

**And in building that traceable state, we must not ourselves become the peeping tom.**
→ 0G in §3.

---

## 2. The novelty — proving the downstream, not the upstream

### The four existing approaches

| Approach | What it looks at | Limit |
|---|---|---|
| **Scanning** (Socket / Snyk) | Reads the **contents** by machine | Always a cat-and-mouse game. **It can only beat new techniques after the fact** |
| **Provenance** (Sigstore / provenance) | **Who built it** | **It doesn't solve whether the builder is trustworthy.** And it is **a one-time fact about the past** |
| **Reputation** (stars / download counts) | **How many people said so** | **Buyable. Never decays. Unrelated to the version** |
| **Isolation** (sandbox) | The blast radius | **Functionality shrinks by exactly the same amount** |

### Our approach

> **Prove not who "built" it,
> but who is "using it right now, with their own key".**

**Not upstream (provenance), but downstream (attestation of use).**

| | Provenance | This star |
|---|---|---|
| Who it looks at | **The builder** | **The user** |
| What time it refers to | **The past (the moment of signing)** | **The present (still using it)** |
| Revocation | **Revoked by hand** | **Goes out automatically the moment you stop using it** |
| Price paid | None | **The person is in the position of being harmed first** |

**This is what is new. "Reputation that expires automatically" barely exists.**

### Why the novelty holds up

**Telling fakes apart is already a losing game.** Detection cannot keep up with the speed of generation.

> **Stop telling them apart. Count only the real ones.**

**For that you need a unit in which "real" can be counted.** → §3.

---

## 3. The sponsor tech being the core (the deletion test)

**Write it not as "we used it" but as "what breaks if you pull it out".**

### World — this is not a feature, it is the **unit**

| | |
|---|---|
| **Pull it out** | One person can give 10,000 stars. **Weight stops working, and we're back to GitHub stars** |
| **In other words** | **World is the definition of "one vote" itself.** With no votes, there is nothing to count |
| **Being minimal** | No name, no country, no age needed. **All we want is "the same person hasn't pressed twice".** The nullifier is exactly that granularity |
| **How we use it** | **Put Agent Pass at "the moment a star is given"** (`spec/world-agent-pass.md` §2). Not every time a key is used |

> **If you cannot count people, not one line of this work holds up.**

### Ledger — **the only evidence that "a human did it"**

| | |
|---|---|
| **Pull it out** | **Software can give the star.** An AI holding the key can award itself a star |
| **In other words** | **"Someone is still inside" becomes unprovable.** The star goes back to being words |
| **Why it is core** | **Of the three, it is the only one software cannot substitute for.** An AI has no fingers |
| **How we use it** | Hash and sign the 4 scope lines **inside the device** (`spec/permit-signature.md`). **What is shown on screen and what is signed are the same thing** |

### 0G — **the part that makes the contradiction of "judging without reading the contents" work**

**This is the most easily misunderstood part, so let's be explicit.**

> **0G is not a "place to put records".**

**This work has to decide the weight based on "what is being requested".**
**But the moment we read those contents, we become the new peeping tom.**
**This is what §1 meant by "in building a traceable state, we must not become the peeping tom".**

| | |
|---|---|
| **Pull out 0G Private Computer** | **We end up reading the contents in order to decide the weight. The tool meant to stop surveillance becomes a surveillance device. The work contradicts itself** |
| **Pull out 0G Storage** | **We can rewrite the trail ourselves.** This is a story about recovering "who did it", and yet we would hold the record. **It contradicts itself again** |
| **Why it is in the decision loop** | **0G's judgement decides whether the Ledger wakes up.** Not a record, a **branch**. If 0G is unreachable, the Ledger does not let it through automatically (safe-stop) |

> **Why 0G: because we have to decide the weight without looking at the contents.
> The moment we read them, we become the new peeping tom.**

**That is the one-sentence answer** (0G's required item, "the reason for the dependency in one sentence").

### EF / CROPS — **the trust layer must not be owned by anyone's company**

| | |
|---|---|
| **Pull it out** | **Our company owns the layer of credibility.** That is just a new gatekeeper. **We would become the gatekeeper while talking about reducing gatekeepers** |
| **In other words** | **Open, censorship-resistant, keys stay in your hand — these are not decoration; they are the conditions this work imposes on itself** |
| **What to write honestly** | **The Broker is currently a trust point.** Write that until it is in a TEE. **Don't go quiet about it** |

### EF / Anon-RPC — **anonymity to protect the canary**

| | |
|---|---|
| **Pull it out** | **Just looking at the sky reveals a person's entire toolkit.** The person who goes first gets identified by what they are trying. **The one who is helping becomes the one most at risk** |
| **In other words** | **Anonymous reads are part of the safety equipment for the person who goes first** (`2026-11-06-the-twist.md` §2) |
| **Implementation** | Fetch everything and filter locally. **Don't let the content of the query leave** |

### Summary: what is left if you pull it out

| What is pulled | What is left |
|---|---|
| World | **GitHub stars** (buyable) |
| Ledger | **A star software gives itself** (back to words) |
| 0G Private Computer | **A surveillance device that reads the contents** |
| 0G Storage | **A ledger we can rewrite** |
| EF (open, censorship-resistant) | **A new gatekeeper** |
| Anon-RPC | **A roster for targeting canaries** |

**Pull out any one of them and the work contradicts its own claim.**
**Not "we use it", but "without it the claim collapses".**

---

## 4. How to lay it out in 4 minutes

| Second | What to say | Who it lands on |
|---|---|---|
| 0:00 | **"That API key — where did you put it?"** (a beat) **"There isn't a good place, is there."** | Everyone (empathy) |
| 0:20 | I thought it was a question of where to put it. **It wasn't a question of where** | Everyone (inversion 1) |
| 0:40 | **"It's a GitHub star. Except you can't press it unless you're using it with your own key, and it goes out when you stop."** | Developers (instant comprehension) |
| 1:00 | **43,012 / governance 0 / 6 unregistered domains** | Judges (scale) |
| 1:20 | **The shape of credibility can be made without a person. So "a person is there" became information for the first time** | Judges (the social problem) |
| 1:50 | **Stop telling them apart, count only the real ones** (downstream, not upstream) | Judges (novelty) |
| 2:10 | **The deletion test.** Three of "what is left if you pull it out" | **Sponsors (this is the real part)** |
| 2:40 | Live demo: long press → ★ → star | Everyone (WOW) |
| 3:10 | **The stars go out all at once. "Someone got out first"** | Everyone (climax) |
| 3:40 | **The person who goes first is already paying in risk. We convert that payment into equipment** | Judges (Practicality) |
| 3:55 | The Ledger in a judge's hand. **"What you just pressed is the button an AI cannot press"** | Everyone |

---

## 5. Objections that will come, and the answers

| Objection | Answer |
|---|---|
| **"If the Broker can see everything, isn't it the same?"** | **Correct. It is a trust point right now.** That is why the design puts it in a TEE, and until it is in one we write exactly that. **We're not hiding it** |
| "If it needs hardware it won't get adopted" | **It isn't needed until stage 3.** The MVP (`2026-11-06-product-mvp.md`) works without hardware. **The hardware comes in at the stage where unforgeability is needed** |
| "Won't there be too few stars to be useful?" | **It isn't useful at first. Which is why the MVP doesn't start from stars.** It starts from detection that is worth something alone, and **just using it accumulates the web** |
| "Scanning is faster in the end" | **Scanning looks at the contents. We look at people.** A new technique gets past scanning, but **it doesn't get past the person who stepped on it first** |
| **"What if World goes down?"** | **You can't give stars, but existing stars and the detection keep working.** Only issuance stops |
| **"What if 0G goes down?"** | **The Ledger does not let it through automatically (safe-stop).** Appearing to stop is the correct behavior |
