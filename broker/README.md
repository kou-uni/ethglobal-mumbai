# Tomoshibi Broker

**AI には押せないボタンを、鍵の前に1つ置く。**

スキルは鍵を受け取らない。`use` を投げるだけ。Broker は **人が署名した範囲**と見比べ、
外れていれば実行せずに止め、**止めたこと自体を証拠ごと残す**。

**範囲の中なら、次は重さを 0G に聞く。** 重いものは、その場で押された使い切りの許可でしか通さない。
**0G に届かなければ、判断を作らずに止まる**（safe-stop）。

```
スキル ──use──▶ Broker ──範囲チェック──▶ 0G Private Computer（TeeML）
                   │          │                    │ 重さ（ふだん／大事／決定的）
                   │          └──▶ 外部 API ◀──────┘
                   └──── 系譜（追記のみ）──▶ 0G Storage
```

## 1分で動かす

```bash
npm install
npm test                       # 32 件

# 本番：0G に本当に聞く（pc.0g.ai の API キーが要る）
ZG_API_KEY=sk-… node src/server.js &

# 開発：0G を呼ばない【模擬】。記録と画面に「模擬」と出る。**撮影・提出では使わない**
ZG_OFFLINE=1 node src/server.js &

node demo.mjs                  # 通る／刻む／止まる／一押しが要る／root hash
```

## HTTP

| | |
|---|---|
| `POST /use` | `{permit, signature, request, skillSignature}` → `200 ALLOWED` / `403 DENIED`。本体は刻まれた記録そのもの |
| `GET /trace/:thread` | 1回の使用に紐づく記録。**QR はここを指す** |
| `POST /lines` | permit → 端末に出る4行。画面とハッシュを別経路にしないための確認用 |
| `POST /skill-message` | `{permit, request}` → スキルが署名すべき文字列 |
| `POST /seal` | `{thread}` → 系譜を 0G Storage へ。`rootHash` と `tx` を返す |
| `GET /zg/balance` | 0G の残高（credits が減るのを画面に出すため） |
| `GET /health` | 0G の宛先・モデル・鍵の有無・模擬かどうか |

`request` は `{method, url, keyRef, body?}`。`keyRef` は `permit.key` と一致していなければならない。
返る `decision` は `ALLOWED` / `DENIED`(403) / `NEEDS_PRESS`(409) / `STOPPED`(503) の4つ。

## 0G（ここが判断ループ）

| | |
|---|---|
| **重さを決める** | `src/weigh.js`。`0gm-1.0-35b-a3b`（**TeeML・`tee_attested: true`・TDX / dstack**【実測 2026-11-06】） |
| **渡すもの** | 端末に出る4行 ＋ 操作 ＋ **要求の本文**。**鍵の平文は渡さない** |
| **なぜ 0G か** | **中身を読まないと重さは決まらない。その中身を、我々にも見せずに読ませられるのは封印された推論だけ** |
| **request ID** | 応答の `x-request-id`（無ければ body の `id`）。`ALLOWED` / `NEEDS_PRESS` / `STOPPED` の記録に残る |
| **効き目** | `src/tier.js`。`決定的` は立っている許可では通さない（`NEEDS_PRESS`）。**0G の答えで結果が変わる** |
| **届かないとき** | **判断を作らない。** `STOPPED` ＋ `safeStop: true`。既定値で通すこともルールで代用することもしない |
| **エピソードログ** | `src/episode.js`。`POST /seal` で 0G Storage（Log 層）へ。`rootHash` と `tx` を返す |

```bash
ZG_API_KEY=sk-…         # pc.0g.ai（無いと全部 STOPPED。黙って通さない）
ZG_PRIVATE_KEY=0x…      # 0G Galileo の試験鍵。/seal の tx を出す
ZG_MODEL=0gm-1.0-35b-a3b
ZG_ESCALATE=決定的       # この段から「その場の一押し」を要る
ZG_OFFLINE=1            # 【模擬】0G を呼ばない。記録に simulated: true が残る
```

**safe-stop を見る:**

```bash
ZG_API_KEY=sk-dummy ZG_ENDPOINT=https://127.0.0.1:1/v1 node src/server.js &
node demo.mjs   # 範囲の中でも STOPPED。実行もしないし、回数も減らない
```

## 2つの署名

| | 誰の鍵 | 何のため |
|---|---|---|
| `signature` | **人**（Ledger） | 範囲を許す。EIP-712。[`../spec/permit-signature.md`](../spec/permit-signature.md) |
| `skillSignature` | **スキル**（ソフト鍵） | 要求が本当にそのスキルから出たことを示す。`personal_sign("tomoshibi-request:<thread>")` |

`skillSignature` が無い／`permit.skill`（= `keccak256(署名者アドレス)`）と一致しない要求も**止める**。
ただし**違反としては刻まない**。permit を手に入れただけの第三者に、そのスキルの違反を作らせないため。

## 止める理由

| reason | | 刻む |
|---|---|---|
| `WRONG_KEY` | 許可されていない鍵 | ◯ |
| `OUT_OF_TARGET` | 許可されていない宛先（**ホスト完全一致**） | ◯ |
| `INSECURE_TRANSPORT` | `https` ではない（平文では鍵が流れる） | ◯ |
| `OUT_OF_SCOPE` | 許可されていない操作（**パスは区切りまでの前方一致**） | ◯ |
| `REPLAY` | 同じ nonce を別のスキルが使い回した | ◯ |
| `EXPIRED` | 期限切れ | — |
| `EXHAUSTED` | 回数を使い切った | — |
| `BAD_SIGNATURE` | 署名が holder のものではない | — |

**刻むのは「宣言した範囲を外れた要求」だけ。**
`EXPIRED` と `EXHAUSTED` は**設計どおりに細った状態**で、普通に使い切ったスキルを違反者にしない。
`BAD_SIGNATURE` は誰の要求か確定しないので、刻む相手がいない。
返答の中身が怪しい（持ち出し・扇動）は**知らせるだけ**で、ここでは扱わない。

## 境界

- **署名の契約は [`../spec/permit-signature.md`](../spec/permit-signature.md)。** `src/permit.js` がその実装。
  EIP-712・`m/44'/60'/0'/0/0`・chainId 16602（0G Galileo）
- **送られてきた digest は使わない。** permit から作り直して `ecrecover` する
- **端末の4行と 32 バイトは同じ値から作る。** `lines()` と `digest()` が同じ `normalize()` を通る
- **回数は実行の前に押さえる**（`store.reserve`）。確認と記録のあいだに `await` を挟まないので、
  連打しても `maxCalls` を超えない。実行が失敗しても戻さない（fail-closed）
- **nonce の持ち主は、holder の署名が通った要求だけが決める。** 偽署名の要求で先に結び付けて、
  あとから来る正規の要求を `REPLAY` にできない

## まだ載っていないもの（黙って良く見せない）

- **0G Storage は手で封をする。** 記録は常にローカルの JSONL（`data/ledger.jsonl`）に追記し、
  `POST /seal` を呼んだ分だけ 0G Storage に上がる。**毎回は上げていない**（Galileo の faucet が 0.1 0G/日）
- **`ZG_PRIVATE_KEY` が無いと root hash だけ出て、`uploaded: false` になる。** 置いたことにはしない
- **World** — 人間証明から星へ。未接続
- **Ledger 実機** — `demo.mjs` は試験鍵で署名している。実機は `spec/permit-signature.md` の JSON 1本で入る
- **版の照合** — `version` は見ていない。`VERSION_CHANGED` と星の消灯は未実装（issue #14 穴3）
- **拒否の署名** — `DENIED` は PC 経由で端末に届く。端末側で検証していない（issue #14 穴1）
- **Broker は信頼点** — 鍵を持つのはここ。本番は TEE に載せる。今回は載せていない

## ライセンス

MIT。トラッカーは使っていない。
