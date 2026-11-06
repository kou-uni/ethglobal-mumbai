# Structure — parts, functions, sequences

Three figures of the same system, so that the pages, the Broker and the pitch describe one thing.

Written from [`HOW-IT-RUNS.md`](HOW-IT-RUNS.md) and the code. It adds what that page leaves out:
the pages a person sees (`web/app.html`) and how they reach the rest. About the Broker, if this
page disagrees with `HOW-IT-RUNS.md`, that page is right. Section 5 lists where the branch
`minta/story` is different from it today.

The figures are also kept as pictures in [`figures/`](figures/), for the deck.

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
| **sign the permit** | The hold on the Ledger that makes a standing permit (`maxCalls` > 1). | *lending the key* (journey heading, `assets/lending.svg`); `/lend` and `standing` in the tool's code | *lend*, *lent* |
| **press** | The hold on the Ledger for one heavy request: a permit with `maxCalls = 1`, signed now. | | *your hand* |
| **weight** | `routine` / `significant` / `decisive`, said by the sealed model on 0G. | | |
| **trail** | The append-only record of every request, allowed or refused. | the record | *your week*, *activity* |
| **star** | What the owner lights on one version after using it, through World ID. **Flame** is the name of that function. | *a flame on that version* (the figure) | *light* |
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
- A hosted copy exists on the branch only. See section 5.

## 3. Functions

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

## 4. Sequences

### 4.1 Once: the key, then the permit (Monday)

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

The route is still called `/lend` in the tool's code. Nothing a person reads says so.

### 4.2 One request (every time)

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

### 4.3 A press (Wednesday)

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

### 4.4 A star (Friday)

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

## 5. Where the branch `minta/story` differs from `HOW-IT-RUNS.md`

To settle between us. Each row is a fact about the branch, not a proposal.

| Topic | `HOW-IT-RUNS.md` (main) | `minta/story` |
|---|---|---|
| Words | *label*, *range*, *a flame on that version* | *handle*, *scope*, *star*: the README "four parts" words. Same things. One set should win everywhere; the app follows whichever it is. |
| Bridge port | 8791 | 8791 by default. The filming laptop runs it on 8793 (`BRIDGE_PORT=8793 tools/demo-up.sh`). |
| "None of it is a service in the cloud" | True | Still true for filming. The branch adds an optional hosted copy so the pages can be tried from any device: Broker and tool in one container (`tools/hosted-start.sh`), no bridge, no wallet key (`ZG_PRIVATE_KEY` is dropped), `EXECUTE=0`, rate-limited, and only `/vouch/start` and `/vouch/finish` are passed through to the Broker. |
| The Ledger without a bridge | Not described | Only on the hosted copy, which has no USB: the page opens the device itself and carries the same bytes. Where a bridge runs, only the bridge talks to the device. |
| 0G model | `0gm-1.0-35b-a3b` | That model has been removed from 0G (404 since 17:32 IST on 6 Nov). The branch defaults to `0gm-1.0-35b-a3b-sia` with `ZG_JSON_MODE=0`. |
| The end of the World flow | `/vouch/finish` answers its caller | The tool keeps the outcome and also sends it as an event, so a page that lost the long request still changes. |
| `POST /seal` | Listed | The app does not call it. Only `broker/demo.mjs` does. |
