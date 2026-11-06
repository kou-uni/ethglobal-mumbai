# Retrospective on the World integration (D6, required for both World prizes)

**2026-11-06 IST. Only what is implemented as of writing is written here.** What is unverified is written as unverified.
The English version you can paste straight into the submission is at the end (§6).

---

## 1. Where we came in

We came in through **`auth.world.org` (Agent Pass)**, not `docs.world.org` (IDKit).
**It took time to realize these are two different entry points.** Searching for "Agent Pass" on the prize page turns up IDKit articles mixed in.

**The single most effective thing was reading `/.well-known/openid-configuration` directly.**
Faster and more certain than reading prose (this is where we confirmed that `grant_types_supported` contains `urn:ietf:params:oauth:grant-type:device_code` [measured]).

## 2. What was good about adopting it

- **It is plain standard OIDC.** No proprietary SDK; it was done with just `fetch` and `jose`.
  The Broker-side implementation is one file, `src/world.js`, about 110 lines
- **The `device_code` grant exists.** The Broker has no screen, so a scheme that assumes a browser redirect distorts the design.
  **"The machine starts it, the person finishes it on their own device" is available from the start**
- **We did not have to build the refusal paths ourselves.** `access_denied` and `expired_token` are part of the protocol, so we can treat "the owner refused" and "it expired" as **different things**.
  We kept these two as separate records in the trail (`human_denied` / `proof_expired`)
- **The scope being only `openid`** matched our design (we only need a pseudonym).
  It is built so that it asks for nothing extra

## 3. Where we got stuck (honestly)

- **The relationship between IDKit and Agent Pass cannot be worked out from the entry pages.**
  We want one page that shows "which one should you use."
  We only found out they are separate products by reading the prize requirements
- **You cannot tell that registration is required until an error comes back.**
  Calling `POST /api/v1/device_authorization` with an unregistered `client_id` returns `400 invalid_client` ("Check the environment, registered authentication method, and credentials.") [measured].
  **The message itself is helpful, but it does not state the next step, "register in the portal"**
- **We could not determine from the documentation whether `verification_uri_complete` is returned.**
  The side that shows the QR (screen A) is built differently depending on whether it is there. **Unverified** (we will measure after registration)
- **Which claim carries the sector-scoped identifier** could not be settled until we obtained a real `id_token`.
  Our implementation treats `sub` as the pseudonym. **Unverified**
- **We hear that proofs at the venue are mocks.** Whether the device flow runs to the end with a mock is **unverified**

## 4. Where we put it (a design decision)

**The first version called Agent Pass right before a key was used. That was wrong, so we fixed it.**
It duplicates the function of the Ledger's long press, and from a person's point of view they are asked twice for a single action.

| | What it confirms | When |
|---|---|---|
| **World** | **Who you are** (that you are a person, and the same person) | **When issuing a star. Once** |
| **Ledger** | **Whether you permit this, now** (scope and expiry) | **Every time a key is used** |

**The action being protected is issuing a star.** We put proof of personhood on the act of staking your own reputation to say "I use this."
**We do not call World every time a key is used.**

## 5. Fail-safe handling

- The `id_token` is **verified against the JWKS** (`iss` / `aud` / `exp`). We do not just read it
- **The client secret stays inside the Broker.** It is never exposed to the browser or to a skill
- **The same pseudonym cannot issue a star twice for the same version** (`store.claimStar` rejects it atomically)
- **If we cannot wait any longer, we do not let it through.** We treat it as expired

---

## 6. For the submission (English, paste as is)

**What we built with World ID**

Agent Pass is the gate for *issuing a star* — the moment a person stakes their own reputation to say
"I use this skill." It is not called when the agent uses a key; that is the Ledger's job. Putting the
human proof on the key-use path would duplicate the hardware confirmation and ask the same person
twice for one action.

**Flow:** Broker (headless) calls `POST /api/v1/device_authorization` → the person completes the check
on their own phone → Broker polls `POST /api/v1/token` with the `device_code` grant → verifies the
`id_token` against the JWKS (`iss`, `aud`, `exp`) → writes the star. The client secret never leaves the
backend.

**Denial paths came for free.** We did not build them: `access_denied` (the person refused) and
`expired_token` (the request timed out) are part of the device flow. We record them as two *different*
outcomes — `human_denied` and `proof_expired` — because "a person said no" and "nobody was there"
are not the same event, and both belong in the audit trail.

**What went well**

- It is plain OIDC. No SDK. ~110 lines with `fetch` + `jose`.
- `/.well-known/openid-configuration` is the fastest way in — we confirmed the `device_code` grant there
  before writing any code.
- `scope=openid` only. The IdP asks for nothing we do not need, which matched our pseudonym-only design.

**What was hard**

- **IDKit vs Agent Pass is not clear from the entry pages.** We only learned they are separate products
  by reading the prize requirements. One page that says "use this one when…" would have saved an hour.
- `400 invalid_client` is a good message, but it does not say *register the client in the portal* —
  the next step is missing for a first-time integrator.
- We could not tell from the docs whether `verification_uri_complete` is returned. The QR screen is built
  differently depending on the answer. (Still unverified at the time of writing.)
- Which claim carries the sector-scoped identifier was not determinable before obtaining a real token;
  we treat `sub` as the pseudonym. (Still unverified.)
