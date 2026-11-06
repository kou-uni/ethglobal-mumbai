# Reply to minta (body to paste into issues #18 / #19, 2026-11-06)

> **This is a draft to paste into the issues.** Posting comments to GitHub from this environment was blocked by permissions, so it is kept here and the URL is handed over.

# Reply to issue #18

This is kou. **Thanks for finishing gate.html. I read it, and I'm replying after measuring.**

## 0. Measured first — "the $12 charge" came out as **decisive** on the real 0G (3/3)

minta's "unverified" is settled here. **Measured with the real key, on the real 0G (`0gm-1.0-35b-a3b`):**

| Request | 0G's reading | Reason (0G's words) |
|---|---|---|
| `POST /v1/charges` $12 | **decisive** (3/3) | An instruction to move funds to the Stripe payments API |
| `POST /v1/charges` $4,800 | decisive | A large payment execution, irreversible |
| `POST /v1/charges` **$1** | decisive | Funds can be moved |
| `POST /v1/customers` | significant | Creates customer data |
| `GET /v1/charges?limit=10` | **routine** | Read-only and reversible |
| `GET /v1/balance` | **routine** | Balance query only, with no asset movement or disclosure |

**It reads "does money move", not the amount.** So even $12 requires a long press.

## 1. Solution: one long press is still enough (make `scope` `* /v1`)

`scope` is **a prefix match on `METHOD /path`, and `*` can be used for the method** (`broker/src/scope.js:34`).
Lending once gives you both "it goes through silently in routine use" and "it wakes up because this is heavy". **The number of long presses on the real device does not go up.**

The 4 lines that appear on the device (lend it in this shape):

```
KEY   0xabababab…
TO    api.stripe.com
SCOPE * /v1 x5
UNTIL 2026-11-06 03:57Z
```

**Result of running it through the real 0G (measured just now):**

```
① GET  /v1/balance          ALLOWED      routine    req a78db4d373d500e4
② POST /v1/charges $4,800   NEEDS_PRESS  decisive   req 1e24d54d82eef9a7
③ POST evil.com/v1/charges  DENIED       OUT_OF_TARGET (never shown to 0G)
```

Replacing scene ① from "the $12 charge" with **"read the balance"** is the cheapest fix (the tool looks the same).

## 2. Replies to the three things to decide

**1 (align the star and the flame) → yes.** Please handle the diff, minta. One request only:
**keep the word humans read as `BLOCKED`, and the judgement code the Broker returns as `DENIED`.**
Separating machine words from human words means that if the trail's JSON and the subtitles disagree, the explanation takes one line.

**2 (a public host) → yes. But we are not putting the Broker on the Funnel.**
The main machine's Tailscale Funnel (443 → 8402) is **frozen for an unrelated matter** (don't touch it). Instead:

- Put HTTPS on the Broker with **a temporary `cloudflared` URL** (no account needed, one command) only during filming and judging
- **Don't put `SECRETS` in, and leave `EXECUTE` off** (I agree with minta's warning)
- **Don't write that URL in the public repository.** The Broker can spend 0G credits ($6 left), so posting it lets anyone run it. What goes in the submission is **only the screen URL and the video**

**3 (consolidate onto one machine) → it disappears now that 2 is a yes.** We run just the bridge and the screens on the Air.

## 3. The lead screen → **yes to `web/gate.html`**

The one connected to the real device is stronger. `ui/index.html` stays **as a design prototype and as filming insurance**
(with deep links like `?s=heavy` it can be played standalone from any scene). For the flames, yes to `web/index.html`.

## 4. On running it through the real 0G — **our Broker is already connected to production and running**

Two instances are up on the main machine. **8797 = the real 0G** / **8798 = the role that deliberately cannot reach 0G** (for `STOPPED`).
`ZG_API_KEY` and `ZG_PRIVATE_KEY` are in the main machine's `broker/.env.local` (not committed, 600).

```bash
cd broker && (set -a; . ./.env.local; set +a; PORT=8797 node src/server.js &)
cd broker && (set -a; . ./.env.local; set +a; ZG_ENDPOINT=https://router-api.invalid/v1 PORT=8798 node src/server.js &)
curl -s 127.0.0.1:8797/health   # apiKey:true / storageKey:true / no "simulated"
```

If we pull in `minta/screens` we can run `bridge.py` and `demo-agent.mjs` here too.
**If you bring the Ledger over, we can record a single take straight through on the real 0G.**

## 5. The two Broker spots in PR #17 — read them. **Yes to both**

- **CORS `access-control-allow-headers`**: needed for preflight. Yes
- **`who` on `/stars` (`starWho`)**: the opening we need for "not the count, but whose flame". Yes

One thing for the record. **Returning `who` means the same pseudonym lines up across versions and skills, so "this person gives flames to both A and B" becomes visible from outside.**
This is **a premise of the feature** (so the viewer can match acquaintances), so we are not blocking it, but
**we will write honestly in the README's privacy section that "pseudonyms do link up inside this app".** So that we don't quietly write "they don't link up".

## 6. Our status

- 0G Storage goes as far as the root hash. **Gas is still 0** (`0xdfcb…42A4`). Let's both hit the faucet
- World client registration is not done. The policy of **not filming with a mock** has not changed
- I put the screen design (who / when / which screen they meet / the transition table / 9 things to decide) in #19

---

# Addition for issue #19 (design sync)

**I've put up the screen transitions and processes, and the touchpoint design.**

- Screen transitions and processes https://kou-uni.github.io/ethglobal-mumbai/ideation/2026-11-06-screen-flow.html
- Who / when / which screen they meet, and what they change https://kou-uni.github.io/ethglobal-mumbai/ideation/2026-11-06-touchpoints.html

Just the key points:

- **There are only two scenes where we ask a human.** Pressing (every time, the device in hand, do I permit this now) and identifying yourself (once, World, who you are). Don't ask twice for the same single act
- **Five screens. No more.** Don't add a new screen for when it stops; show the four ways of stopping as **states** of the gate
- **There are only three scenes where interrupting is allowed** (a heavy request / a flame went out / noticing after the fact that you were stopped). Nothing appearing in routine use is the shape of success
- **I split what I want decided into 9 items** (with options, what changes, the effort, and the default if there is no reply). Only about 4 actually need a reply: Q1-a (where to put the button that gives a flame) / Q1-b (whether only the owner can give a flame) / Q2-a (whether the World wait is a code or a QR) / Q3-a (when to bring out the stand-in for the real device)
- **If we include Stack-chan, make it just one signal, "a heavy request arrived"** (give it neither judgement nor approval). **We are not building it this time.** We keep it only as a verbal answer if asked at the booth

---

# Reply to the merge proposal (`ideation/2026-11-06-screens-merge.md`)

**Conclusion: it merges cleanly. I verified it.**

- Merged both `minta/screens` and `minta/ledger-app` into main **locally → zero conflicts** (GitHub also says `mergeable=CLEAN`)
- After the merge, **the Broker tests are 50/50 pass** (`npm test` in `broker/`)
- The only collisions are `broker/src/server.js` (+4/-1) and `store.js` (+6), and **both are reviewed and fine**

## Replies to the three items in §5

1. **May I touch `ui/` to connect the gate's "press" to the real device → no (please don't touch it).**
   The reason is not disagreement but **division of labor.** Let's go with **`web/gate.html` alone** for the gate connected to the real device (it already exists).
   `ui/index.html` gets **frozen as filming insurance** (play scenes standalone with `?s=heavy`; it runs to the end even with no real device).
   Twelve hours before submission, the most effective thing is for the two of us not to touch the same file.
2. **Film the flames as "whose", not as a "count" → yes.** We'll use `web/index.html`.
   `ui/stars.html` stays as a prototype, but **please carry just the presentation of World's 4 steps (signal → the key holder's device → verifying the signature → flame) and
   the 3 endings (verified / `human_denied` / `proof_expired`) over into `web/`.**
   The World prize looks at whether "the denied path" is real.
3. **Merge PR #16 and #17 into main → yes. Let's do it.**

## Things to do right after merging (3, small)

| What to do | Why | Who |
|---|---|---|
| Change the demo URL on the submission form to `…/web/gate.html` | It currently says `ui/index.html` | kou |
| Consolidate the canonical recording into `ui/scenes.json` | `web/scenes.json` is a copy of the same content. **Re-recording makes them disagree.** I made `record-ui.mjs` write to both (done) | kou (done) |
| Publish at `kou-uni.github.io/ethglobal-mumbai/` only; `mintannn.github.io/tomoshibi/` is the backup | Hand judges two and they'll look at the stale one | Both |

**The real remaining hurdle is not the merge.** It is the World client registration, and one straight take on the real 0G with the real device in it.

---

## 追記 2026-11-07 — 提出動画の台本（minta さんへ）

スライド10枚（`ETHGlobalTokyo2026.pdf`）に合わせたセリフを2枚置きました。**目立つ所には出していません。**

- **`ideation/2026-11-07-video-script-readaloud.md`** — 読み上げ用。時刻と喋る文だけ。録るときはこれだけ
- `ideation/2026-11-07-video-script.md` — 注記つき（日本語併記・言ってはいけないこと・削る順・スライドの直し）

**9枚目に README のウォークスルーを差し込む前提で、全長 3:52。** 4:00 を超えると upload で弾かれます。
README の表記は「1 min 56 s」なので、**1:56 版を使うなら S3 を8秒短くしてから**（削る順は §3）。

**声が言ってはいけないこと（審査で辿られると嘘になる）:**

- **「0G が範囲外を拒否する」** — 範囲外は `broker/src/server.js:69` で 0G に渡る前に止まります（本体が外に出ず、クレジットも減らない）。0G が読むのは範囲内の重さだけ
- **炎の比喩を、製品の定義より先に出すこと** — S5 は「API key management, guarded by a hardware wallet」で言い切る形にしました

**スライド側で直してほしい2点（録る前に）:**

1. Demo 表の3行目と4行目が**入れ替わっています**。`runs the day's orders → ALLOWED / Nothing is asked`、
   `ships a new version → THE LIGHT GOES OUT / Praise does not carry to new code` が正
2. `STARS GO OUT` → **`THE LIGHT GOES OUT`**（star → light の統一）。配線図の中の `The only way a star is lit` も同じ
