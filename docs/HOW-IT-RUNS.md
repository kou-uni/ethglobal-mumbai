# How it runs — processes, state, sequence

One page, read off the code. Everything else that describes the system (the README, the
figures in `assets/`, the deck) is written from this page. If something disagrees with it,
this page is right and the other thing is a bug.

Sources: `broker/src/server.js`, `broker/src/store.js`, `broker/src/scope.js`,
`broker/src/weigh.js`, `broker/src/tier.js`, `broker/src/world.js`, `broker/demo-agent.mjs`,
`tools/demo-up.sh`.

## 1. Processes

`tools/demo-up.sh` starts five of them on one machine. None of it is a service in the cloud.

| Process | Port | What it is |
|---|---|---|
| Broker | 8797 | `node broker/src/server.js`. The trust point: the only thing that holds an API key. `EXECUTE=0` and `SECRETS` unset while filming, so there is no real key and no real call. |
| Broker, deafened | 8798 | The same binary with `ZG_ENDPOINT` pointed at an address that does not resolve. It exists to show `STOPPED` on stage. |
| Bridge | 8791 | `bridge/bridge.py`, bound to `127.0.0.1` only. Carries a permit to the Ledger device and the signature back. **The Broker never talks to it.** |
| The tool | 8792 | `broker/demo-agent.mjs` — the agent and its skill. Holds a label, a range and a count. Never a key. |
| Pages | 8790 | `python3 -m http.server` over `web/`. |

Run on its own, the Broker listens on 8787 (`PORT`).

## 2. State

An append-only file, `data/ledger.jsonl`. No deletion path is provided. On start-up the
Broker re-reads it, so a restart cannot hand back a call budget that was already spent.
Everything else is derived from it, in memory (`store.js`):

| Derived | Keyed by | What it answers |
|---|---|---|
| `counts` | `holder:nonce` | how many calls of this permit are spent |
| `owners` | `holder:nonce` | which skill owns this nonce — **written only when the holder's signature checked out** |
| `byHolder` | holder | everything that happened with that person's key, in order |
| `stars` | `skill:version` | which pseudonyms lit this version. A separate set per version, so a version bump puts them all out at once |
| `checked` | `skill:version` | how many of those were issued after the owner check |

One record carries `thread`, `holder`, `skill`, `nonce`, `holderValid`, `skillSigner`,
`request{method,url,keyRef}`, `decision`, `reason`, `message`, and, where they apply,
`zg{model,requestId,ms,usage,tier,reason,sealed}`, `remaining`, `attestation`,
`violation`, `unsignedRequest`, `safeStop`, `storage`.

Decisions that can appear: `ALLOWED`, `DENIED`, `NEEDS_PRESS`, `STOPPED`, `SEALED`,
`STAR`, `VOUCH_DENIED`. Refusals live in the same file as permissions.

## 3. Sequence

`POST /use { permit, signature, request, skillSignature }` — `use()` in `server.js`:

1. `requestHash(permit, request)` → `thread`, the id every record about this attempt carries.
2. `check()` — the holder's signature over the permit, expiry, target, scope, and whether
   this nonce already belongs to another skill.
3. `verifySkill()` — did the tool sign this exact request. If not, a breach is recorded as
   `unsignedRequest` rather than as that skill's violation.
4. Outside the declared range → `DENIED`, **before 0G is asked**. The body never leaves the
   machine and no credits are spent.
5. `weigh()` → 0G Private Computer (TeeML), given the four lines and the request. Unreachable,
   or an answer that cannot be read → `STOPPED` (`safeStop: true`). There is no fallback
   judgement; a faked one would be disqualifying.
6. `needsPress(tier, permit)` → `NEEDS_PRESS`, carrying the four lines and
   `need: 'sign a maxCalls=1 permit, now'`. A heavy request never passes on a standing permit.
7. `store.reserve()` — one call is taken from the count, with no `await` between the check and
   the write. Nothing left → `DENIED / EXHAUSTED`.
8. `exec(request, secrets[p.key])` — the only moment a secret exists inside a request. In the
   demo this is the stub executor.
9. `store.append()` → `ALLOWED`, with `remaining` and an attestation of what came back.

What happens around a press is **not** a line from the Broker to her device:

```
Broker -> tool        NEEDS_PRESS (the request is not held open)
tool   -> bridge      127.0.0.1 only
bridge -> device      the four lines; the device builds the digest itself
device -> bridge      the signature, after a long press
tool   -> Broker      the same request again, on a permit good for one call
Broker                0G is asked a second time, and the answer is still heavy
Broker                reserve -> execute -> ALLOWED (remaining 0)
```

Other endpoints: `POST /lines` (the four lines for a permit), `POST /seal` (put one thread
into 0G Storage and append `SEALED`), `POST /vouch/start` + `POST /vouch/finish` (the World
device flow — the owner check runs **before** World is asked, so nobody is bothered on their
phone for a request that would be refused anyway), `GET /health`, `GET /zg/balance`.
