# Structure — parts, functions, sequences

Three figures of the same system, so that the pages, the Broker and the pitch describe one thing.

Written from [`HOW-IT-RUNS.md`](HOW-IT-RUNS.md) and the code. It adds what that page leaves out:
the pages a person sees (`web/app.html`) and how they reach the rest. About the Broker, if this
page disagrees with `HOW-IT-RUNS.md`, that page is right. Section 6 lists where the branch
`minta/story` is different from it today.

The figures are also kept as pictures in [`figures/`](figures/), for the deck.
Pictures of the same system on main: `assets/architecture.svg` (one request), `assets/states.svg`
(what one attempt can end as), `assets/journey.svg` (where she is at each step), `assets/lending.svg`.

Sources: `broker/src/server.js`, `scope.js`, `tier.js`, `weigh.js`, `owner.js`, `world.js`,
`broker/demo-agent.mjs`, `bridge/bridge.py`, `web/flow.js`, `tools/demo-up.sh`, `tools/hosted-start.sh`.

## 1. Words

One meaning each. The left column is what the README ("four parts") and the journey fixed.
The app uses the left column.

| Word | It means | The same thing is also written as | No longer used in the app |
|---|---|---|---|
| **key** | The API secret. It stays with the Broker. | secret | |
| **handle** | What the tool holds instead of the key: `keyRef`, plus the signed permit. | *label* (`HOW-IT-RUNS.md`, the figures) | |
| **permit** | The EIP-712 message she signs: `holder, skill, version, key, target, scope, maxCalls, expiry, nonce`. Shown as four lines: `KEY / TO / SCOPE / UNTIL`. | | |
| **scope** | Where the key may go and what it may do there, how many times, until when. | *range* | |
| **sign the permit** | The hold on the Ledger that makes a standing permit (`maxCalls` > 1). | *lending the key* (journey heading, `assets/lending.svg`), *she lends a range* (`assets/journey.svg`); `/lend` and `standing` in the tool's code | *lend*, *lent* |
| **press** | The hold on the Ledger for one heavy request: a permit with `maxCalls = 1`, signed now. | | *your hand* |
| **weight** | `routine` / `significant` / `decisive`, said by the sealed model on 0G. | | |
| **trail** | The append-only record of every request, allowed or refused. | the record | *your week*, *activity* |
| **star** | What the owner lights on one version after using it, through World ID. **Flame** is the name of that function. | *a flame on that version* (`assets/architecture.svg`), *a light* (`assets/journey.svg`) | *light* |
| **the stops** | `DENIED`, `NEEDS_PRESS`, `STOPPED`, `human_denied` / `proof_expired` | | *blocked*, *no verdict* |

## 2. Parts

Who exists, where it runs, and who talks to whom.

```mermaid
flowchart TB
  subgraph HER["Hers"]
    direction LR
    P["Pages - web/app.html<br/>tab 1: the AI tool's chat<br/>tab 2: TOMOSHIBI"]
    L["Ledger Flex<br/>TOMOSHIBI app (Rust)<br/>four lines, one button"]
    WA["World App<br/>on her phone"]
  end
  subgraph PC["Her computer - tools/demo-up.sh"]
    direction LR
    T["The tool - demo-agent.mjs - 8792<br/>agent + skill<br/>holds a handle, never a key"]
    BR["Bridge - bridge.py - 127.0.0.1<br/>USB to HTTP"]
    B["Broker - server.js - 8797<br/>holds the key<br/>scope, weight, press, reserve, execute, trail"]
    D[("data/ledger.jsonl<br/>append-only trail")]
  end
  subgraph OUT["Outside"]
    direction LR
    ZC["0G Private Computer<br/>sealed model (TeeML)"]
    ZS["0G Storage"]
    API["The real API<br/>(Stripe)"]
    W["World<br/>OIDC device flow"]
  end
  P -- "start a permit, demo buttons,<br/>read events" --> T
  P -- "stars: read, light one" --> B
  L <-- "USB" --> BR
  T -- "permit to sign, notice" --> BR
  T -- "POST /use<br/>permit + signature + request<br/>+ the skill's signature" --> B
  B -- "append" --> D
  B -- "four lines<br/>+ the request" --> ZC
  B -- "POST /seal:<br/>one thread" --> ZS
  B -- "the request, key put in<br/>(EXECUTE=1 only)" --> API
  B -- "device code,<br/>wait, verify" --> W
  WA -- "she confirms" --> W
```

- **The Broker never talks to the bridge or to her device.** The tool does, over `127.0.0.1`.
- **The pages decide nothing.** They read the tool's events (`GET /events`) and draw them. They never talk to 0G,
  World or the API. For stars they ask the Broker (`/stars`, `/vouch/start`), and the tool for the finish.
- **While filming there is no real key and no real call**: `EXECUTE=0`, `SECRETS` unset. The *Custody* screen
  sends and stores nothing.
- The Broker without 0G (8798, to show `STOPPED`) and the static file server (8790) are left out of the figure.
- Where each of these runs, what it is made of, and where 0G is used: section 3.

## 3. Where things run, and what they are made of

### 3.1 Where the Broker is

The Broker is one small program, `broker/src/server.js`. It is not a contract and not a cloud service.

```mermaid
flowchart TB
  subgraph AIR["Filming - one laptop - tools/demo-up.sh"]
    direction LR
    A1["Pages<br/>static files, 8790"]
    A2["The tool<br/>8792"]
    A3["BROKER<br/>8797<br/>data/ledger.jsonl"]
    A4["Broker without 0G<br/>8798, to show STOPPED"]
    A5["Bridge<br/>127.0.0.1"]
    A6["Ledger Flex"]
    A1 --> A2
    A2 --> A3
    A2 --> A4
    A2 --> A5
    A5 -- "USB" --> A6
  end
  subgraph HOSTED["Hosted copy - to try the pages from any device - tools/hosted-start.sh"]
    direction LR
    H1["Pages<br/>GitHub Pages"]
    subgraph BOX["One container"]
      direction LR
      H2["The tool<br/>the only public port"]
      H3["BROKER<br/>8797, inside only<br/>data/ledger.jsonl"]
    end
    H4["Ledger Flex<br/>opened by the page"]
    H1 --> H2
    H2 --> H3
    H1 -- "WebHID" --> H4
  end
  subgraph LATER["Design, not built"]
    T1["BROKER in a TEE<br/>away from the agent (A2)"]
  end
```

| Where | How it is started | Address | Its state | Who can reach it |
|---|---|---|---|---|
| **Filming laptop** | `tools/demo-up.sh` → `node broker/src/server.js` | port 8797 (a second one on 8798 that cannot reach 0G) | `broker/data/ledger.jsonl` on that laptop | The tool on the same machine. The pages, for stars and the record page. It listens on every interface of the laptop, not only `127.0.0.1`. |
| **Hosted copy** | `tools/hosted-start.sh`, inside one container (`Dockerfile`) | 8797 inside the container, not published | `data/ledger.jsonl` inside the container. It is gone when the free instance sleeps. | Only the tool beside it. From outside, the tool passes on reads and the two World calls (`/vouch/start`, `/vouch/finish`), nothing else. |
| **Design** | not built | a TEE, away from the agent | | On a laptop where the agent has a shell, the agent can read the Broker's environment. The README says so (A2). |

### 3.2 What each part is made of

| Part | Language, libraries | Size | Where its state is | Real, or stubbed while filming |
|---|---|---|---|---|
| **Broker** `broker/src/` | Node.js, plain `node:http`. No framework, no database. `viem` (EIP-712 signature check, hashes), `jose` (World id token), `ethers` + `@0gfoundation/0g-storage-ts-sdk` (0G Storage). | about 990 lines in 13 files | One append-only file, `data/ledger.jsonl`, re-read at start. Counts and stars are derived from it in memory. | Scope check, 0G weighing, press rule, trail, World: **real**. The call to the real API: **stub** (`EXECUTE=0`, `SECRETS` unset), so no real key exists anywhere. |
| **The tool** `broker/demo-agent.mjs` | Node.js. A scripted agent called `billing-assistant` with four fixed requests. It signs every request with its own skill key. | 339 lines | In memory: the signed permit and the list of events. | The requests are scripted. Everything it asks the Broker and the Ledger is real. |
| **Bridge** `bridge/bridge.py` | Python. Speaks the Ledger's USB protocol on one side and HTTP on the other (`/permit`, `/notice`, `/health`). | 324 lines | None | Real |
| **Ledger app** `ledger-app/` | Rust, on a Ledger Flex. Shows the four lines and signs the permit (EIP-712) after a long press. | | The device's own key | Real, on a development device with no funds |
| **Pages** `web/` | Static HTML, CSS and JavaScript. No build step. `app.html` + `flow.js`. | `flow.js` 592 lines | The browser only | Real when a tool answers. Otherwise a recorded replay, marked as a preview. |

### 3.3 Where 0G is used

Two places, both inside the Broker. Nothing else talks to 0G.

```mermaid
flowchart LR
  U["POST /use"] --> S{"scope check<br/>scope.js"}
  S -- "outside" --> DN["DENIED<br/>0G is not asked"]
  S -- "inside" --> WZ["weigh()<br/>weigh.js"]
  WZ == "four lines + method, URL, body<br/>never the key" ==> ZC[["0G PRIVATE COMPUTER<br/>sealed model (TeeML)<br/>router-api.0g.ai/v1"]]
  ZC == "weight + reason + request id" ==> WZ
  WZ -- "no answer" --> ST["STOPPED"]
  WZ -- "heavier" --> NP["NEEDS_PRESS"]
  WZ -- "routine" --> AL["reserve, execute<br/>ALLOWED"]
  SE["POST /seal"] --> EP["store()<br/>episode.js"]
  EP == "one thread of the trail<br/>no keys, no bodies" ==> ZS[["0G STORAGE<br/>Galileo testnet"]]
  ZS == "root hash + transaction" ==> EP
  EP --> SL["SEALED<br/>appended to the trail"]
```

| | **1. 0G Private Computer** | **2. 0G Storage** |
|---|---|---|
| What for | To decide the weight of a request: `routine`, `significant` or `decisive`. This is what decides whether her Ledger is woken up. | To keep one thread of the trail where it cannot be quietly changed. |
| Code | `broker/src/weigh.js`, called from `use()` in `server.js` | `broker/src/episode.js`, called from `seal()` in `server.js` |
| When | Once for every request that is inside the scope, and once more for the same request after a press. Never for a request the scope check refused. | Only when someone calls `POST /seal` with a thread. |
| How | `POST {ZG_ENDPOINT}/chat/completions` with `ZG_API_KEY`. Model `ZG_MODEL` (TeeML), temperature 0, reasoning off. | `Indexer.upload()` from the 0G Storage SDK, paid from the wallet in `ZG_PRIVATE_KEY`, on the Galileo testnet. |
| What is sent | The four lines of the permit, the method and URL, and the body (cut at 4,000 characters). **Never the key.** | The records of that thread as JSON lines. **No keys and no bodies.** |
| What comes back, and where it goes | The weight and a short reason, the 0G request id, the time taken, the token count and the `x-0g-e2ee` header. All of it is written into the trail record as `zg{…}`. | The root hash and the transaction. Appended to the trail as `SEALED` with `storage{…}`. If it was not stored, the record says so and why. |
| If 0G does not answer | `STOPPED`. No default, and no rule in its place. | `SEALED` with `uploaded: false` and the reason. |
| Who triggers it today | Every request from the tool, so every button in the app except a refused one. | `broker/demo.mjs` and `broker/record-ui.mjs` only. **The app and the tool do not call it**, and the hosted copy has no wallet key. |

Also from 0G: the Broker can read the remaining credits (`GET /zg/balance`), and the permit's EIP-712 domain
uses chain id 16602. Neither is a call on the request path.

## 4. Functions

The four parts of the README, the six functions of the journey, and the code behind each.

```mermaid
flowchart LR
  subgraph F1["1 - Custody"]
    CP["Custody + Permit<br/>permit.js, execute.js<br/>bridge.py, Ledger app"]
  end
  subgraph F3a["3 - Trail and attribution"]
    SC["Scope + Attribution<br/>scope.js, skill.js"]
  end
  subgraph F2["2 - Weight and press"]
    WE["Weight<br/>weigh.js"]
    PR["Press<br/>tier.js"]
  end
  subgraph F3b["3 - Trail and attribution"]
    TR["Trail<br/>store.js, episode.js"]
  end
  subgraph F4["4 - Flame"]
    FL["Flame<br/>owner.js, world.js"]
  end
  CP -- "the tool presents<br/>the signed permit" --> SC
  SC -- "inside the scope" --> WE
  SC -- "outside: DENIED" --> TR
  WE -- "routine:<br/>key put in, sent" --> TR
  WE -- "no answer: STOPPED" --> TR
  WE -- "heavier:<br/>NEEDS_PRESS" --> PR
  PR -- "pressed: sent once" --> TR
  TR -- "the permit<br/>was used" --> FL
  L(["Ledger"]) -.- CP
  L -.- PR
  ZC(["0G Private Computer"]) -.- WE
  TR -.- ZS(["0G Storage"])
  FL -.- W(["World"])
```

| Function | What it does | Code | Outside | What it answers | Screen (the bar under the name) | What she gets |
|---|---|---|---|---|---|---|
| **Custody + Permit** | The key stays with the Broker and the tool gets a handle. The permit is signed on hardware, as four lines built from the bytes that are signed. The key is put in only at the moment of sending. | `permit.js`, `execute.js`, `bridge.py`, the Ledger app | Ledger | a signature, or nothing | `CUSTODY` → `PERMIT` → `PERMIT SIGNED` | You never hand the key over. You hand over one use of it. |
| **Scope + Attribution** | Before anything runs: the holder's signature, expiry, key, target, https, operation, nonce. A request outside the scope is recorded with the skill's own signature. | `scope.js`, `skill.js` | none | `DENIED`: `BAD_SIGNATURE`, `EXPIRED`, `WRONG_KEY`, `OUT_OF_TARGET`, `INSECURE_TRANSPORT`, `OUT_OF_SCOPE`, `REPLAY`, and `EXHAUSTED` when the count is used up | `SCOPE + ATTRIBUTION` | It did not get anywhere, and it has a name on it. |
| **Weight** | A sealed model reads the four lines and the request and says how much it matters. No answer means no verdict. | `weigh.js` | 0G Private Computer | `routine` / `significant` / `decisive`, or `STOPPED` (`ZG_UNREACHABLE`) | `WEIGHT` | On an ordinary day it asks you nothing. |
| **Press** | From `ZG_ESCALATE` upward (`decisive` by default, `significant` in the demo) a standing permit is not enough. It needs a permit for one call, signed now. | `tier.js` | Ledger | `NEEDS_PRESS` (`ESCALATED`) | `PRESS` | Money cannot move while you are away. |
| **Trail** | Every request, allowed or refused, is appended with its reason. A thread can be sealed into 0G Storage. | `store.js`, `episode.js` | 0G Storage | `ALLOWED`, `DENIED`, `NEEDS_PRESS`, `STOPPED`, `SEALED` in one file | `TRAIL` (tab) | You can say what was stopped, and whose code tried it. |
| **Flame** | A star on one version. Only the owner of a permit that was used can light it, confirmed once through World. Stars are counted per version. | `owner.js`, `world.js` | World | `STAR`, or `VOUCH_DENIED`: `NOT_OWNER`, `NOT_USED`, `human_denied`, `proof_expired`, `BAD_ID_TOKEN`, `ALREADY_VOUCHED` | `FLAME` (tab) | You choose by whose star it is, not by how many. |

## 5. Sequences

### 5.1 Once: the key, then the permit (Monday)

```mermaid
sequenceDiagram
  autonumber
  actor P as Priya
  participant C as AI tool chat (page)
  participant G as TOMOSHIBI (page)
  participant T as The tool
  participant BR as Bridge
  participant L as Ledger
  P->>C: Chase the unpaid orders
  C-->>P: Put your Stripe key into a .env file
  P->>C: Can you use TOMOSHIBI instead?
  C-->>P: Approve in TOMOSHIBI
  P->>G: CUSTODY - the key, once
  Note over G,T: Design - the key goes to the Broker and nowhere else. Demo - nothing is sent or stored.
  P->>G: PERMIT - key, to, scope, until
  G->>T: POST /lend (uses, days)
  T->>BR: POST /permit (the permit fields)
  BR->>L: the permit, over USB
  L-->>P: KEY / TO / SCOPE / UNTIL
  P->>L: holds the button
  L-->>BR: signature (EIP-712)
  BR-->>T: signature
  T-->>G: event - signed
  G-->>P: PERMIT SIGNED
  Note over T: The tool holds the permit, the signature and a handle. Never the key.
```

Steps 1 to 5 are pages only: the chat is a scripted conversation, and the key field sends and stores nothing.
`assets/journey.svg` marks the same two moments (its cards 2 and 3) as not built, and that is still true behind the
screens. From step 6 on, everything is real.

The route is still called `/lend` in the tool's code. Nothing a person reads says so.

### 5.2 One request (every time)

```mermaid
sequenceDiagram
  autonumber
  participant T as The tool
  participant B as Broker
  participant Z as 0G Private Computer
  participant A as The real API
  participant D as Trail
  T->>B: POST /use (permit, signature, request, skill signature)
  B->>B: check - signature, expiry, key, target, https, scope, nonce
  alt outside the signed scope
    B->>D: DENIED + reason + whose code
    B-->>T: 403 DENIED (0G is never asked)
  else inside the scope
    B->>Z: the four lines + the request
    alt no answer, or one that cannot be read
      B->>D: STOPPED
      B-->>T: 503 STOPPED
    else heavier, on a standing permit
      Z-->>B: significant or decisive
      B->>D: NEEDS_PRESS
      B-->>T: 409 NEEDS_PRESS
    else routine
      Z-->>B: routine
      B->>B: reserve one call of the count
      B->>A: the request, key put in
      A-->>B: response
      B->>D: ALLOWED + remaining + attestation
      B-->>T: 200 ALLOWED + result
    end
  end
```

- No call left in the count: `DENIED / EXHAUSTED`, at the reserve step.
- While `EXECUTE=0` the request to the real API is a stub.
- After a `DENIED`, the tool asks the bridge to show a notice on her Ledger (`POST /notice`). Nobody has to tap.

### 5.3 A press (Wednesday)

```mermaid
sequenceDiagram
  autonumber
  actor P as Priya
  participant G as TOMOSHIBI (page)
  participant T as The tool
  participant BR as Bridge
  participant L as Ledger
  participant B as Broker
  participant Z as 0G Private Computer
  B-->>T: 409 NEEDS_PRESS (the request is not held open)
  T-->>G: events - NEEDS_PRESS, asking for a press
  G-->>P: PRESS - the refund is waiting
  T->>BR: POST /permit (same key and target, maxCalls = 1)
  BR->>L: the permit, over USB
  L-->>P: four lines
  alt she holds the button
    L-->>BR: signature
    BR-->>T: signature
    T->>B: POST /use - the same request, on the permit for one call
    B->>Z: asked a second time
    Z-->>B: still heavy
    B->>B: reserve, execute
    B-->>T: 200 ALLOWED (remaining 0)
    T-->>G: event - ALLOWED, pressed
    G-->>P: BY HAND - sent once
  else she does not
    L-->>BR: declined
    BR-->>T: declined
    T-->>G: event - declined
    G-->>P: YOU SAID NO - nothing was sent
  end
```

### 5.4 A star (Friday)

```mermaid
sequenceDiagram
  autonumber
  actor P as Priya
  participant G as TOMOSHIBI (page)
  participant T as The tool
  participant B as Broker
  participant W as World
  participant A as World App (phone)
  P->>G: FLAME - Light a star with World
  G->>B: POST /vouch/start
  B->>W: start the device flow
  W-->>B: device code + address
  B-->>G: the address, drawn as a QR code
  G->>T: POST /vouch/finish (device code)
  T->>B: POST /vouch/finish (device code, skill, version, permit, signature)
  B->>B: ownerOf - signed by the owner, and used?
  alt not the owner, or never used
    B-->>T: VOUCH_DENIED - NOT_OWNER or NOT_USED (World is not asked)
  else the owner, who used it
    P->>A: scans the code, confirms
    A->>W: confirmed
    B->>W: asks until confirmed, refused or expired
    alt confirmed
      W-->>B: id token
      B->>B: verify, one star per person per version
      B-->>T: STAR (or VOUCH_DENIED - ALREADY_VOUCHED)
    else refused, or the code ran out
      B-->>T: VOUCH_DENIED - human_denied or proof_expired
    end
  end
  T-->>G: event - the outcome
  G->>B: GET /stars (skill, version)
  G-->>P: Your star is lit
```

Her wallet address is never written into the star. When the version changes, the stars of the old version are
simply not counted any more.

## 6. Where the branch `minta/story` differs from `HOW-IT-RUNS.md`

To settle between us. Each row is a fact about the branch, not a proposal.

| Topic | `HOW-IT-RUNS.md` (main) | `minta/story` |
|---|---|---|
| Words | *label*, *range*, *count*, *she lends a range*, *a flame* / *a light* on a version | *handle*, *scope*, *sign the permit*, *star*: the README "four parts" words. Same things. One set should win everywhere; the app follows whichever it is. |
| The agent asks for a key, and she answers with a URL (`journey.svg` card 2) | Not built | A page exists: the first tab is a chat where the tool asks for a `.env` file and she answers "use TOMOSHIBI". It is scripted. No agent reads a setup guide. |
| She parks the key (`journey.svg` card 3) | Not built: an env var, not a screen | A screen exists (`CUSTODY`), with a key field. It sends and stores nothing, and the Broker still reads `SECRETS` from its environment. |
| Bridge port | 8791 | 8791 by default. The filming laptop runs it on 8793 (`BRIDGE_PORT=8793 tools/demo-up.sh`). |
| "None of it is a service in the cloud" | True | Still true for filming. The branch adds an optional hosted copy so the pages can be tried from any device: Broker and tool in one container (`tools/hosted-start.sh`), no bridge, no wallet key (`ZG_PRIVATE_KEY` is dropped), `EXECUTE=0`, rate-limited, and only `/vouch/start` and `/vouch/finish` are passed through to the Broker. |
| The Ledger without a bridge | Not described | Only on the hosted copy, which has no USB: the page opens the device itself and carries the same bytes. Where a bridge runs, only the bridge talks to the device. |
| 0G model | `0gm-1.0-35b-a3b` | That model has been removed from 0G (404 since 17:32 IST on 6 Nov). The branch defaults to `0gm-1.0-35b-a3b-sia` with `ZG_JSON_MODE=0`. |
| The end of the World flow | `/vouch/finish` answers its caller | The tool keeps the outcome and also sends it as an event, so a page that lost the long request still changes. |
| `POST /seal` | Listed | The app does not call it. Only `broker/demo.mjs` does. |
