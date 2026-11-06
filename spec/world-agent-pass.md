# World ID Agent Pass — what it is and how to wire it in (researched 2026-11-06)

**In one line: Agent Pass is not IDKit; underneath it is plain OIDC.
It has the `device_code` grant, so the Broker — which has no screen — can call it directly.**

Sources (primary):
- Prize page https://ethglobal.com/events/mumbai/prizes/world
- https://auth.world.org/docs and https://auth.world.org/docs/guides/getting-started
- **https://auth.world.org/.well-known/openid-configuration** (read directly)

---

## 1. What it actually is

**An OIDC identity provider.** The issuer is `https://auth.world.org`.
It is a different entry point from IDKit (`docs.world.org` / `developer.worldcoin.org`).

| | Value |
|---|---|
| issuer | `https://auth.world.org` |
| discovery | `https://auth.world.org/.well-known/openid-configuration` |
| authorization | `https://auth.world.org/api/v1/authorize` |
| token | `https://auth.world.org/api/v1/token` |
| userinfo | `https://auth.world.org/api/v1/userinfo` |
| JWKS | `https://auth.world.org/.well-known/jwks.json` |
| **device_authorization** | **`https://auth.world.org/api/v1/device_authorization`** |
| revoke | `https://auth.world.org/api/v1/revoke` |
| scope | `openid` **only** |
| grant | `authorization_code` and **`urn:ietf:params:oauth:grant-type:device_code`** |
| response_type | `code` |

Clients are registered in the portal (`https://auth.world.org/portal`).

What comes back is **a signed authentication result** and **a per-sector account identifier**.
Which credentials to accept (Orb / Selfie Check) is our choice.
**For one-time uses, the docs say to reject already-used nullifiers atomically.**

---

## 2. Where it goes (**corrected 2026-11-06**)

> **The first version got this wrong.** It said "call Agent Pass right before the key is used",
> but **that duplicates what the long press on the Ledger already does.**
> To a person it looks like being asked twice for one single act, with no way to explain why.
> → `ideation/2026-11-06-tech-value-review.md` §4

**Split the roles.**

| | What it confirms | When |
|---|---|---|
| **Agent Pass (World)** | **who you are** (that you are a person, and the same person) | **when a star is given. Once** |
| **Ledger** | **whether you allow this, now** (scope and expiry) | **every time the key is used** |

**The protected action is giving a star** (writing to the VouchRegistry).

**Giving a star is a heavy act.** You stake your own reputation to say "I use this".
**Putting proof of personhood here is natural, and it lines the prize requirements up in a row
(request → the owner completes it → verification → protected action).**

```
someone tries to give a star, saying "I use this skill"
  → the Broker calls device_authorization
  → the World confirmation appears on the owner's device
  → the owner completes it
  → the Broker takes the token and verifies it against JWKS
  → it writes to the VouchRegistry (= the star appears)
```

**Do not call World every time the key is used. That is the Ledger's job.**

**What the `device_code` grant buys us does not change.**
The Broker, which has no screen, starts the authentication, and the person completes it on their own device.

## 3. Where each prize requirement is met

| Requirement (original wording) | Where it is met |
|---|---|
| Integrate the official Agent Pass | Register an OIDC client in the portal and drive it with `device_code` |
| **Show the whole flow** (request → the owner completes it → verifying the result → protected action) | The five lines above, exactly. **Protected action = the API call** |
| **Denial / expiry / revocation / failure paths** | **Built into the device flow already.** `access_denied` (the owner refuses) and `expired_token` (the `device_code` expires). **We get them without building them** |
| **Verify in a secure backend. Do not expose the client secret** | The Broker verifies the signature against JWKS. The client secret stays inside the Broker. **It never reaches the browser** |
| Write-up of the integration | Separately (D6) |

**The big win is that the denial path is in the device flow from the start.**
`research/11-prize-gap.md` listed "no denial path for World" as a gap, but
**if we use Agent Pass there is nothing to build.** If the owner refuses in the World app, `access_denied` comes back.

→ **That gives us two kinds of denial.** "Refused" and "not pressed" are different things.
**The first is a person refusing (World / no star given); the second is nobody being there (Ledger / the key cannot be used).**

## 4. The minimum implementation (Broker side — ours to write)

1. Register a client in the portal (`client_id` / `client_secret`)
2. `POST /api/v1/device_authorization` (`client_id`, `scope=openid`)
   → `device_code` / `user_code` / `verification_uri` / `expires_in` / `interval`
3. **Show `verification_uri` and `user_code` on screen A** (a QR is fine)
4. Poll `POST /api/v1/token` (`grant_type=urn:ietf:params:oauth:grant-type:device_code`, `device_code`)
   every `interval` seconds
   - `authorization_pending` → keep going
   - **`access_denied` → the owner refused. `DENIED: human_denied`**
   - **`expired_token` → expired. `DENIED: proof_expired`**
   - success → `id_token`
5. **Verify the `id_token` against JWKS** (`iss` is `https://auth.world.org`, `aud` is our `client_id`, and `exp`)
6. **Engrave the per-sector identifier on the star as a pseudonym.** Reject it if already used

## 5. Not yet confirmed

- **On-site proof is mocked.** Whether the `device_code` flow runs against the mock
- The claim name in the `id_token` (which claim carries the per-sector identifier)
  → `https://auth.world.org/docs/guides/id-token`
- Whether the sandbox (`https://auth.world.org/docs/guides/testing`) runs without production keys
- **Whether the same project can enter both the IDKit prize and the Agent Pass prize**
