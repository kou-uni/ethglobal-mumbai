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
npm test                       # 14 件
node src/server.js &           # http://127.0.0.1:8787
node demo.mjs                  # 通る2件・止まる5件・系譜の URL
```

## HTTP

| | |
|---|---|
| `POST /use` | `{permit, signature, request}` → `200 ALLOWED` / `403 DENIED`。本体は刻まれた記録そのもの |
| `GET /trace/:thread` | 1回の使用に紐づく記録。**QR はここを指す** |
| `POST /lines` | permit → 端末に出る4行。画面とハッシュを別経路にしないための確認用 |
| `GET /health` | |

`request` は `{method, url, keyRef}`。`keyRef` は `permit.key` と一致していなければならない。

## 止める理由（全部、宣言した範囲から出る）

| reason | | violation |
|---|---|---|
| `BAD_SIGNATURE` | 署名が holder のものではない | — |
| `EXPIRED` | 期限切れ | ◯ |
| `WRONG_KEY` | 許可されていない鍵 | ◯ |
| `OUT_OF_TARGET` | 許可されていない宛先（**ホスト完全一致**） | ◯ |
| `OUT_OF_SCOPE` | 許可されていない操作（**パスは区切りまでの前方一致**） | ◯ |
| `EXHAUSTED` | 回数を使い切った | ◯ |
| `REPLAY` | 同じ nonce を別のスキルが使い回した | ◯ |

**罰するのは、宣言した範囲を外れた要求だけ。** 要求そのものがスキルの署名付きで残るので、
偽アカウントでは作れない証拠になる。返答の中身が怪しい（持ち出し・扇動）は**知らせるだけ**で、
ここでは扱わない。署名の不一致を違反に数えないのは、**誰の要求かが確定せず、刻む相手がいない**ため。

## 境界

- **署名の契約は [`../spec/permit-signature.md`](../spec/permit-signature.md)。** `src/permit.js` がその実装。
  EIP-712・`m/44'/60'/0'/0/0`・chainId 16602（0G Galileo）
- **送られてきた digest は使わない。** permit から作り直して `ecrecover` する
- **端末の4行と 32 バイトは同じ値から作る。** `lines()` と `digest()` が同じ `normalize()` を通る。
  別経路にした瞬間、「範囲が読める」という主張が成立しなくなる

## まだ載っていないもの（黙って良く見せない）

- **0G Storage** — 系譜はいまローカルの JSONL（`data/ledger.jsonl`）。`store.js` の `append` だけを差し替える
- **World** — 人間証明から星へ。未接続
- **Ledger 実機** — `demo.mjs` は試験鍵で署名している。実機は `spec/permit-signature.md` の JSON 1本で入る
- **Broker は信頼点** — 鍵を持つのはここ。本番は TEE に載せる。今回は載せていない

## ライセンス

MIT。トラッカーは使っていない。
