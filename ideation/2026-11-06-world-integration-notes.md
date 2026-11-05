# World 導入の振り返り（D6・両方の World 賞で必須）

**2026-11-06 IST。書いている時点で実装済みのことだけを書く。** 未確認は未確認と書く。
提出にそのまま貼れる英語版は末尾（§6）。

---

## 1. どこから入ったか

`docs.world.org`（IDKit）ではなく **`auth.world.org`（Agent Pass）** から入った。
**この2つが別の入口だと気づくのに時間がかかった。** 賞ページの「Agent Pass」で検索すると
IDKit の記事が混ざって出てくる。

**いちばん効いたのは `/.well-known/openid-configuration` を直接読んだこと。**
文章を読むより速く、確実だった（`grant_types_supported` に
`urn:ietf:params:oauth:grant-type:device_code` があることを、ここで確かめた【実測】）。

## 2. 入れてよかった点

- **標準の OIDC そのもの。** 独自 SDK を入れずに、`fetch` と `jose` だけで終わった。
  Broker 側の実装は `src/world.js` の 1 ファイル・約110行
- **`device_code` グラントがあること。** Broker は画面を持たないので、
  ブラウザのリダイレクトを前提にした方式だと設計が歪む。
  **「機械が始めて、人が自分の端末で終える」が最初から用意されている**
- **拒否の経路を自分で作らなくていい。** `access_denied` と `expired_token` が
  プロトコルに入っているので、「本人が断った」と「期限が切れた」を**別のものとして**扱える。
  我々はこの2つを別の記録として系譜に残した（`human_denied` / `proof_expired`）
- **scope が `openid` だけ**なのは、こちらの設計（仮名しか要らない）と合っていた。
  余計なものを要求しない作りになっている

## 3. 詰まった点（正直に）

- **IDKit と Agent Pass の関係が、入口のページから読み取れない。**
  「どちらを使うべきか」を1枚で示すページが欲しい。
  我々は賞の要件を読んで初めて「別物」と分かった
- **エラーが返るまで、登録が要ることに気づけない。**
  未登録の `client_id` で `POST /api/v1/device_authorization` を叩くと
  `400 invalid_client`（"Check the environment, registered authentication method, and credentials."）【実測】。
  **文言自体は親切だが、「portal で登録する」という次の一手は書いていない**
- **`verification_uri_complete` が返るかどうかが、ドキュメントから判断できなかった。**
  QR を出す側（画面 A）は、これが有るかないかで作りが変わる。**未確認**（登録後に実測する）
- **sector 単位の識別子がどの claim に入るか**が、実際に `id_token` を取るまで確定できなかった。
  我々は `sub` を仮名として扱う実装にしてある。**未確認**
- **会場の証明は mock** と聞いている。mock で device flow が最後まで回るかは**未確認**

## 4. 我々が置いた場所（設計の判断）

**初版は「鍵を使う直前に Agent Pass を呼ぶ」だった。これは間違いだったので直した。**
Ledger の長押しと機能が重複し、人から見ると同じ1回の行為に2回聞かれる。

| | 何を確かめるか | いつ |
|---|---|---|
| **World** | **誰であるか**（人であること・同じ人であること） | **星を出すとき。1回** |
| **Ledger** | **いま、これを許すか**（範囲と期限） | **鍵を使うとき。毎回** |

**守られる動作＝星を出すこと。** 自分の評判を賭けて「私はこれを使っている」と言う行為に
人の証明を置いた。**鍵を使うたびには World を呼ばない。**

## 5. 安全側の扱い

- `id_token` は **JWKS で検証**する（`iss` / `aud` / `exp`）。読んで済ませない
- **client secret は Broker の中だけ。** ブラウザにもスキルにも出さない
- **同じ仮名は、同じ版に二度星を出せない**（`store.claimStar` が atomic に弾く）
- **待ち切れないときは通さない。** 期限切れとして扱う

---

## 6. 提出用（英語・そのまま貼る）

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
