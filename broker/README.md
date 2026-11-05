# Hoshi Broker

**AI には押せないボタンを、鍵の前に1つ置く。**

スキルは鍵を受け取らない。`use` を投げるだけ。Broker は **人が署名した範囲**と見比べ、
外れていれば実行せずに止め、**止めたこと自体を証拠ごと残す**。

```
スキル ──use──▶ Broker ──範囲チェック──▶ 外部 API
                   │                        │
                   └──── 系譜（追記のみ）◀──┘
```

## 1分で動かす

```bash
npm install
npm test                       # 19 件
node src/server.js &           # http://127.0.0.1:8787
node demo.mjs                  # 通る2件／刻む5件／刻まない2件／連打100本
```

## HTTP

| | |
|---|---|
| `POST /use` | `{permit, signature, request, skillSignature}` → `200 ALLOWED` / `403 DENIED`。本体は刻まれた記録そのもの |
| `GET /trace/:thread` | 1回の使用に紐づく記録。**QR はここを指す** |
| `POST /lines` | permit → 端末に出る4行。画面とハッシュを別経路にしないための確認用 |
| `POST /skill-message` | `{permit, request}` → スキルが署名すべき文字列 |
| `GET /health` | |

`request` は `{method, url, keyRef}`。`keyRef` は `permit.key` と一致していなければならない。

## 2つの署名

| | 誰の鍵 | 何のため |
|---|---|---|
| `signature` | **人**（Ledger） | 範囲を許す。EIP-712。[`../spec/permit-signature.md`](../spec/permit-signature.md) |
| `skillSignature` | **スキル**（ソフト鍵） | 要求が本当にそのスキルから出たことを示す。`personal_sign("hoshi-request:<thread>")` |

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

- **0G Storage** — 系譜はいまローカルの JSONL（`data/ledger.jsonl`）。`store.js` の `append` だけを差し替える
- **World** — 人間証明から星へ。未接続
- **Ledger 実機** — `demo.mjs` は試験鍵で署名している。実機は `spec/permit-signature.md` の JSON 1本で入る
- **版の照合** — `version` は見ていない。`VERSION_CHANGED` と星の消灯は未実装（issue #14 穴3）
- **拒否の署名** — `DENIED` は PC 経由で端末に届く。端末側で検証していない（issue #14 穴1）
- **Broker は信頼点** — 鍵を持つのはここ。本番は TEE に載せる。今回は載せていない

## ライセンス

MIT。トラッカーは使っていない。
