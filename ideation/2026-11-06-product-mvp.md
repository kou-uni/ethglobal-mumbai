# MVP as a product, the hard technical parts, backlog, and plan

**In one line: the MVP is neither the star nor the key.
**It is something that just tells you "when and how the AI tools you use changed."**
It is worth using alone, and **just by using it alone, the data for the web accumulates.**

---

## 1. Market — the numbers are there. Only the trust layer is missing

| | Value | Source |
|---|---:|---|
| Live servers in the official MCP registry (2026-10) | **43,012** | [DevToolHub](https://devtoolhub.com/mcp-registry-by-the-numbers/) |
| Same (2026-07) | 18,843 | ibid. |
| New per month (2026-03 → 2026-09) | **1,894 → 11,809** | ibid. |
| Governance across the 15,465 servers analyzed | **Zero** | [ox.security](https://www.ox.security/ebooks/15465-mcp-servers-0-governance/) |
| Share that shipped one version and were never revised | **62%** | ibid. |
| **Servers resolving to unregistered domains** | **6** | ibid. |
| Share held by the top 50 publishers | **25%** | [DevToolHub](https://devtoolhub.com/mcp-registry-by-the-numbers/) |
| Scanning in the official registry | **None** | ibid. |

### How to read it

**2.3x in three months. 12,000 a month keep being added.** And **governance is zero.**

**"Six servers resolving to unregistered domains" is the scariest one.**
**Anyone who grabs that domain becomes that server.**

**Every package ecosystem eventually grew a trust layer.**
npm got lockfiles, Dependabot and Socket; PyPI grew the same.
**MCP and skills have nothing yet.**

**And this is the first time the one doing the installing is not a human.**

### The shape of the market (estimates; needs verification)

- **Primary**: people building with AI agents. **This is where it actually hurts them personally**
- **Secondary**: people made to approve the team's tools (tech leads / IT). **This is where the budget is**
- **Tertiary**: the 43,012 people building tools (the top 50 take 25%, so **the rest are buried**).
  **This is who pays for distribution**

⚠️ **We are not putting a dollar estimate down yet.** We don't write a TAM with no basis.
**What we can state goes as far as the fact that "the numbers are growing exponentially and a trust layer does not exist."**

---

## 2. Cast — in a form that makes people say "that's me"

### Amit (32) / the one who goes first ← **the real customer**

Found an MCP server while browsing someone's dotfiles on GitHub. Installed it with `npx`.
It asked for a key, so he pasted one. **After pasting it, he realized this process can read everything under his home directory.**
Deleting it was a hassle, so he left it.

**He has 17 tools installed. He cannot state what any one of them is allowed to do.**

Three months ago one of them broke and he burned half a day. He tracked down the cause, filed an issue, and it got fixed.
**Nobody said anything to him.**

> **"I'm always the one stepping on it first."**

### Sarah (38) / tech lead ← **holds the budget**

Someone on the team asks in Slack: "Can I install this skill?"

**There is no way to evaluate it.** No time to read the source, and no guarantee she'd understand it if she did.
**Say NO and she's an obstacle. Say YES and the responsibility is hers.**

The `#ai-tools` channel has **400 messages** backed up, and nobody has reviewed any of them.

> **"I'm made to approve things I can't evaluate."**

### Kenji (29) / the one building tools ← **pays for distribution**

Built something good. **It doesn't get installed.**
Stars can be bought. **He loses to people who bought them.** There is also no way to prove it is safe.

> **"'Build something good and it gets adopted' was a lie."**

### Priya (26) / the one who only chooses ← **not a customer. A free rider**

She gets the result of someone else stepping on it first, for free. **That's fine.**
**We are not building for her. Her being helped is a by-product.**

### The four most effective "yeah, exactly"s

1. **"After I pasted the key, I realized this thing can read my entire home directory"**
2. **"npm has Dependabot. MCP servers have nothing"**
3. **"It changed, and I never updated it"** ← the technical core of §3
4. **"#ai-tools has 400 messages and nobody reads them"**

---

## 3. MVP — the Canary (no stars and no keys yet)

### What it does

**It goes and looks at the AI tools you use, every day,
and tells you when their contents change. That's all.**

```
$ canary watch
Watching 17 tools.

2026-11-09  github-mcp      no change
2026-11-09  notion-mcp      no change
2026-11-09  web-search-mcp  ⚠ the tool description changed
                            "search(query)" → "search(query, context)"
                            142 characters added to the description
```

### Why this is the MVP

| | |
|---|---|
| **It is worth something alone** | No web, no other people, no hardware needed. **It works from day one** |
| **Just using it alone accumulates the data for the web** | "Who uses what" gets collected as a by-product. **The stars grow later** |
| **It hits the most painful spot directly** | "It changed and I never updated it." Number 1 in §4 |
| **It is small to build** | As described below, there is only one hard part |

**Something usable on its own creates the collective data.** This is the center of the design.
**If you start from the stars, you start with an empty sky.**

### What is deliberately left out of the MVP

- **Stars** (meaningless until people gather)
- **Key brokering (Broker)** (latency is the real wall. Number 5 in §4)
- **Hardware** (needing signatures to be unforgeable starts once you show things to other people)
- **Chain** (not needed for the first 100 people)

**The demo we build at the hackathon builds items 3 to 5 of this order first.**
**That is the order for the prizes, not the order for the product.** Don't conflate them.

---

## 4. The technical things to get over (most lethal first)

| | Hard part | Why it is hard | Answer | Kills us? |
|---|---|---|---|:--:|
| **1** | **How to detect that a remote tool changed** | Unlike local npm, **there is no lockfile.** If the server side changes something quietly, the version on your machine doesn't move | **Hash the tool manifest (name, description, argument schema).** You can fetch it, and **prompt injection lives in the description itself.** The attack surface falls exactly inside the hash | **Without solving this there is no product** |
| **2** | **How to prove "actually using it"** | Self-reporting can be faked | **Degrade honestly in three stages.** v1: the client reports it (weak — say so) / v2: the Broker sees the actual calls / v3: TEE. **Don't hide which stage you're at** | High |
| **3** | **Who uses what leaks** | If stars are public, your whole toolkit is visible | **Fetch everything and filter locally** (Anon-RPC). **Don't let the content of the query leave** | Medium |
| **4** | **The Broker holds all the keys** | The trust points collect into one place | **Put it in a TEE (0G Private Computer).** Until it is in one, write that "it is a trust point" | Medium |
| **5** | **Latency** | It sits in the path of a tool call. **Go over 50 ms and you get removed** | **Detection (the MVP) is not in the path.** What is in the path starts at the Broker. **Which is why it comes later** | High (at the Broker stage) |
| **6** | **Stars get bought** | Sybil | World (one per person) | Medium |
| **7** | **Speed of revocation** | Between the version changing and the star disappearing, people are not protected | **The detection interval is exactly the exposure window.** Daily → hourly → push | Medium |

**Solve 1 and there is a product. Fail 1 and there is nothing.**
**And 1 is probably the cheapest to solve** (just fetch the manifest and hash it).

---

## 5. Backlog

### Stage 0: hackathon (through 11/7) — not the product order

Ordered backwards from the prize requirements. As in `ideation/2026-11-06-plan.md`.

### Stage 1: Canary standalone (2 weeks)

| | Item | Value | Hard part |
|---|---|---|---|
| 1.1 | Count the MCP servers / skills in use | Show "17" to the person | Small |
| **1.2** | **Fetch the manifest and hash it** | **The core of the product** | **§4-1** |
| 1.3 | Run it daily and produce the diff | You can tell "it changed" | Small |
| 1.4 | Show the diff **in a human-readable form** (diff of the description) | **You can tell what is dangerous** | Medium |
| 1.5 | Notification (a device notification is fine) | You notice | Small |

**Condition for moving on:** the two of us **have kept using it for 2 weeks**.
**And we have caught at least one real change ahead of time.**
**"We use it because we built it" does not count as a condition.**

### Stage 2: you can see who went first (2 months)

| | Item | Value | Hard part |
|---|---|---|---|
| 2.1 | Choose whether to publish your own "using it" | **This is where other people first appear** | Small |
| 2.2 | Filter by the circle of people you know (follows) | "Whose" | Medium |
| 2.3 | **When the version changes, that version's listing drops for everyone at once** | **The climax scene itself** | §4-7 |
| 2.4 | World (one per person) | Makes it unbuyable | §4-6 |
| 2.5 | Reads over an anonymous path | Doesn't leak your toolkit | §4-3 |

**Condition for moving on:** **10 people we don't know are still there in week 4.**
**Measure the number who stayed, not the number who installed.**

### Stage 3: route the keys (6 months)

| | Item | Value | Hard part |
|---|---|---|---|
| 3.1 | Broker (scoped child tokens) | **"Using it" becomes a fact** | §4-2 |
| 3.2 | Latency under 50 ms | **You don't get removed** | **§4-5** |
| 3.3 | Put it in a TEE | The trust point disappears | §4-4 |
| 3.4 | Approval on hardware (Ledger) | Unforgeable | Medium |

**Condition for moving on:** **we can keep routing our own production keys through it for a month.**

### Stage 4: the people who pay (after that)

| Who | Why they pay | Concern |
|---|---|---|
| **Sarah (tech lead)** | She needs a record of approvals. **It removes her accountability for things she can't evaluate** | **The budget is here. But lean toward being a "control tool" and Amit leaves** |
| **Kenji (the builder)** | Distribution. **He wants the Canary to come to him** | If paying gives you an advantage, we are back to buyable stars |
| **Amit** | **Doesn't pay.** He is the one creating the value | Charge him and the foundation disappears |

**The honest tension: the money is with Sarah, and the soul is with Amit.**
**Sell to Sarah and lose Amit, and there is nothing left to sell.**
→ **Free forever for Amit. Sell records and control to Sarah. Design them separately.**

---

## 6. Plan (with dates)

| When | What | Done criterion |
|---|---|---|
| **11/7** | Hackathon submission | Submitted |
| **11/8–11/10** | **Stop.** Decide whether to do Stage 1 | Yes/no from the two of us |
| 11/11–11/24 | **Stage 1: Canary standalone** | **We kept using it for 2 weeks and caught one change** |
| 11/25–12/01 | Hand it to 10 people | **Start watching whether they're there in week 4** |
| Dec–Jan | **Stage 2: you can see who went first** | **10 people we don't know stayed through week 4** |
| Feb–Apr | **Stage 3: route the keys** | **We routed our own production keys for a month** |
| After that | Stage 4 | — |

**Each stage's done criterion is written in terms of whether it kept being used, not whether we built it.**
**To avoid "it worked, so move on without measuring."**

---

## 7. Unverified (the plan collapses if these aren't filled in)

- **Whether a remote MCP server's manifest can be fetched without authentication** (§4-1. **Life or death for the product**)
- **Whether the list of installed tools can be fetched mechanically from the major clients (Claude Code / others)** (1.1)
- Of the 43,012, **the share of servers whose contents actually change**
  (62% shipped one version only = the remaining 38% are moving. **Of those, how many "changed quietly"**)
- The dollar size of the market (**not writing it now**)
