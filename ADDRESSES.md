# アドレスと宛先の一覧（TOMOSHIBI / ETHGlobal Mumbai 2026）

**値を書いてよいのは公開情報だけ。** 秘密鍵・API キーの**中身はここに書かない**。
置き場（どのファイルの、どの変数か）だけを書く。
最終確認 2026-11-06。確認方法は各行の末尾にある。

---

## 1. ウォレット（Galileo テストネット）

| 用途 | アドレス | 中身 |
|---|---|---|
| **Broker の署名鍵**（0G Storage の tx） | `0xdfcbC73bEC15dD080545f77f8B702832a2b142A4` | 使い捨て。鍵は `broker/.env.local` の `ZG_PRIVATE_KEY`（gitignore・600）|
| faucet 申請用（本人） | `0xc94A3b555f355fA16B992b8447e4a873c208F8AC` | 本人保有 |

**gas を入れるのは上段。** 1回のアップロードに **0.0000002〜0.0000005 0G**
（実測 245,869,159,696〜430,271,029,468 wei。記録の大きさで変わる。2026-11-06 `/seal` の
`eth_estimateGas` が返した "want" の実値）。**0.01 もあれば撮影も通しも足りる。**
残高確認:

```bash
curl -s -X POST https://evmrpc-testnet.0g.ai -H 'content-type: application/json' \
 -d '{"jsonrpc":"2.0","id":1,"method":"eth_getBalance","params":["0xdfcbC73bEC15dD080545f77f8B702832a2b142A4","latest"]}'
```

## 2. コントラクト

| 何 | アドレス | 備考 |
|---|---|---|
| 0G Storage **Flow** | `0x22E03a6A89B950F1c82ec5e74F8eCa321a105296` | Galileo。Indexer が内部で解決する |
| EIP-712 `verifyingContract` | `0x0000000000000000000000000000000000000000` | **ゼロアドレスで凍結。** 変えると署名が全部変わる |
| VouchRegistry（星） | 未デプロイ | `VOUCH_REGISTRY` を置けば差し替わる |

## 3. チェーン・エンドポイント

| 何 | 値 |
|---|---|
| チェーン | 0G **Galileo**、chain id **16602**（16601 は別物。`spec/permit-signature.md` 参照）|
| RPC | `https://evmrpc-testnet.0g.ai` |
| エクスプローラ | `https://chainscan-galileo.0g.ai` |
| Storage Indexer | `https://indexer-storage-testnet-turbo.0g.ai` |
| 推論（OpenAI 互換） | `https://router-api.0g.ai/v1` |
| モデル | `0gm-1.0-35b-a3b`（TeeML・Intel TDX）|
| faucet | `https://faucet.0g.ai`（Turnstile あり・0.1 0G/日・**人が押す**）|
| 0G コンソール | `https://pc.0g.ai/dashboard/api-keys` ／ 使用量は `/dashboard/activity` |
| World（OIDC） | `https://auth.world.org`、JWKS は `/.well-known/jwks.json` |

## 4. 鍵とアカウント（**値は書かない**）

| 何 | 置き場 | 状態 |
|---|---|---|
| `ZG_API_KEY` | `broker/.env.local` | **発行済・動作確認済**。`tomoshibi-broker`／Trust mode **Private（TEE）**／2026-11-06 作成 |
| 0G の残高 | pc.0g.ai のアカウント（メールログイン・Privy） | $6.00（2026-11-06 確認）。gas とは**別勘定** |
| `ZG_PRIVATE_KEY` | `broker/.env.local` | 使い捨て。上の §1 のアドレス |
| `WORLD_CLIENT_ID` / `WORLD_CLIENT_SECRET` | `broker/.env.local` | **未取得**（auth.world.org の portal で登録）|

**API キーを再表示する手段はない。** 無くしたら pc.0g.ai で作り直す。
ハッカソン後に失効させること（チャットに平文で流れている）。

## 5. リポジトリ

| 何 | 場所 |
|---|---|
| 公開（提出に出すもの） | `github.com/kou-uni/ethglobal-mumbai` |
| minta の Ledger アプリ | 同リポジトリ `origin/minta/ledger-app` |
| 非公開（着想・日本の角度） | `github.com/kou-uni/Mumbai-ideation-2026` |

## 6. 署名の固定値（`spec/permit-signature.md` §6）

| 何 | 値 |
|---|---|
| domain | `name: Tomoshibi` / `version: 1` / `chainId: 16602` / `verifyingContract: 0x0…0` |
| 導出パス | `m/44'/60'/0'/0/0` |
| `domainSeparator` | `0x86aa93392bc42c203b5e25afa33e6d85df9f1a884ee0e74c4f1bd0d781d8a470` |
| `digest`（端末が署名する32バイト） | `0x8d63692146d1c78f08bfbe1ab6fa254130767260d83921f2d9ed8680a7889486` |

**ここが端末と Broker の境界。** どちらかが値を変えたら `ecrecover` が別人を返す。

## 7. 環境変数の全部（`broker/src/` から抽出）

`ZG_API_KEY` `ZG_PRIVATE_KEY` `ZG_ENDPOINT` `ZG_MODEL` `ZG_RPC` `ZG_INDEXER` `ZG_EXPLORER`
`ZG_TIMEOUT_MS`(30000) `ZG_THINKING`(1で思考を戻す) `ZG_ESCALATE`(既定 `決定的`) `ZG_BODY_LIMIT`(4000)
`ZG_OFFLINE` `WORLD_CLIENT_ID` `WORLD_CLIENT_SECRET` `WORLD_ISSUER` `WORLD_JWKS` `WORLD_OFFLINE`
`VOUCH_REGISTRY` `LEDGER_PATH` `SECRETS` `EXECUTE` `PORT`

**撮影前に `ZG_OFFLINE` と `WORLD_OFFLINE` が立っていないことを `/health` で目視する。**
