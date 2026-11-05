# World ID Agent Pass — 何者で、どう入れるか（2026-11-06 調査）

**一言：Agent Pass は IDKit と別物で、中身は標準の OIDC。
`device_code` グラントがあるので、Broker（画面を持たない側）からそのまま呼べる。**

出典（一次）：
- 賞ページ https://ethglobal.com/events/mumbai/prizes/world
- https://auth.world.org/docs ／ https://auth.world.org/docs/guides/getting-started
- **https://auth.world.org/.well-known/openid-configuration**（実際に読んだ）

---

## 1. 正体

**OIDC の Identity Provider。** 発行者は `https://auth.world.org`。
IDKit（`docs.world.org` / `developer.worldcoin.org`）とは別の入口。

| | 値 |
|---|---|
| issuer | `https://auth.world.org` |
| discovery | `https://auth.world.org/.well-known/openid-configuration` |
| authorization | `https://auth.world.org/api/v1/authorize` |
| token | `https://auth.world.org/api/v1/token` |
| userinfo | `https://auth.world.org/api/v1/userinfo` |
| JWKS | `https://auth.world.org/.well-known/jwks.json` |
| **device_authorization** | **`https://auth.world.org/api/v1/device_authorization`** |
| revoke | `https://auth.world.org/api/v1/revoke` |
| scope | `openid` **だけ** |
| grant | `authorization_code` ／ **`urn:ietf:params:oauth:grant-type:device_code`** |
| response_type | `code` |

クライアント登録は portal（`https://auth.world.org/portal`）。

返るのは「**署名された認証の結果**」と「**sector 単位の口座識別子**」。
受け入れる credential（Orb / Selfie Check）はこちら側で選ぶ。
**一度きりの用途では、使用済みの nullifier を atomic に弾く**のがドキュメントの指示。

---

## 2. なぜこれが、この作品に効くのか

**`device_code` グラントがある。** つまり「画面を持たない側（Broker）が認証を開始し、
人は自分の端末で完了する」が、標準の形でできる。

**これは、この作品がやりたかったことそのもの。**

```
AI が鍵を使おうとする
  → Broker が device_authorization を叩く
  → 人の端末に「あなたですか？」が出る
  → 人が完了する
  → Broker が token を取り、検証する
  → そこで初めて Ledger に署名を求める
```

**「人が居ないと通らない」が、World 側でも成立する。**
いままで Ledger の長押しだけで表現していたものに、**人である証明が1段加わる。**

## 3. 賞の要件が、どこで埋まるか

| 要件（原文） | どこで埋まるか |
|---|---|
| 公式の Agent Pass に統合する | OIDC クライアントを portal で登録して `device_code` で回す |
| **一連の流れを全部見せる**（要求 → 本人が完了 → 結果の検証 → 保護された動作） | 上の5行がそのまま。**保護された動作＝API 呼び出し** |
| **拒否／期限切れ／取り消し／失敗の経路** | **device flow に標準で入っている。** `access_denied`（本人が断る）／`expired_token`（`device_code` の期限切れ）。**作らなくても手に入る** |
| **安全なバックエンドで検証。client secret を晒さない** | Broker が JWKS で署名を検証する。client secret は Broker の中。**ブラウザに出さない** |
| 導入の振り返り | 別途（D6） |

**「拒否の経路」が device flow に最初から入っているのが大きい。**
`research/11-prize-gap.md` では「World の拒否経路が無い」を抜けとして挙げたが、
**Agent Pass を使うなら作る必要がない。** 本人が World アプリで断れば `access_denied` が返る。

→ **台本の S4（拒否）に、Ledger の `DENIED` とは別の拒否がもう1つ増える。**
「断る」と「押さない」は違う。**前者は人が拒否した、後者は人が居ない。**

## 4. 最小の実装（Broker 側・こちらが書く）

1. portal でクライアントを登録（`client_id` / `client_secret`）
2. `POST /api/v1/device_authorization`（`client_id`, `scope=openid`）
   → `device_code` / `user_code` / `verification_uri` / `expires_in` / `interval`
3. `verification_uri` と `user_code` を**画面 A に出す**（QR でよい）
4. `POST /api/v1/token`（`grant_type=urn:ietf:params:oauth:grant-type:device_code`, `device_code`）を
   `interval` 秒ごとに叩く
   - `authorization_pending` → 続ける
   - **`access_denied` → 本人が断った。`DENIED: human_denied`**
   - **`expired_token` → 期限切れ。`DENIED: proof_expired`**
   - 成功 → `id_token`
5. `id_token` を **JWKS で検証**（`iss` が `https://auth.world.org`、`aud` が自分の `client_id`、`exp`）
6. sector 単位の識別子を**仮名として星に刻む**。使用済みなら弾く

## 5. まだ確かめていないこと

- **会場の証明は mock。** mock で `device_code` フローが回るか
- `id_token` の claim 名（sector 単位の識別子がどの claim に入るか）
  → `https://auth.world.org/docs/guides/id-token`
- Sandbox（`https://auth.world.org/docs/guides/testing`）で本番鍵なしに回せるか
- **IDKit 賞と Agent Pass 賞の両方に、同じプロジェクトで出せるか**
