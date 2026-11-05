# 署名の契約（Permit）— 自作アプリと標準アプリで同じ形にする

**一言：画面に出ている4行と、署名される32バイトが、同じものから作られていること。**

#11 で Ledger の自作アプリを狙うことにした。アプリ側（minta・実機）と Broker 側（kou）が
別々に書くので、**ここが食い違うと「アプリは動くのに Broker が全部 DENIED にする」**。
30時間目に起きると直す時間がない。だから先に固定する。

**段3（標準 Ethereum アプリ）に落ちても、この契約は変わらない。** 変わるのは `source` の1語だけ。

---

## 1. 鍵（導出パス）

- **`m/44'/60'/0'/0/0`** — 標準 Ethereum アプリと同じ。curve は secp256k1
- **理由：自作アプリが落ちて段3に戻っても、同じアドレスが署名する。** 星の持ち主が変わらない
- 自作アプリ側は `APP_LOAD_PARAMS` に `--path "44'/60'"` が要る。
  無いと `os_perso_derive_node_bip32` が落ちる — **未確認。関門1で実機確認**

## 2. 署名するもの（EIP-712）

```
digest = keccak256( 0x19 ‖ 0x01 ‖ domainSeparator ‖ hashStruct(Permit) )
```

```solidity
EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)
  name              = "Tomoshibi"
  version           = "1"
  chainId           = 16602          // 0G Galileo Testnet【確】
  verifyingContract = <VouchRegistry のアドレス>

Permit(address holder,bytes32 skill,string version,bytes32 key,
       string target,string scope,uint32 maxCalls,uint64 expiry,uint256 nonce)
```

## 3. 画面の4行と、ハッシュの関係（ここが主張の本体）

| 行 | 値 |
|---|---|
| `KEY` | `key` のラベル |
| `TO` | `target` |
| `SCOPE` | `scope`（`maxCalls` を含む） |
| `UNTIL` | `expiry` |

**ハッシュは、この4行の元になった値そのものから、端末の中で計算する。**
`cx_keccak_init` / `cx_hash` を使う。

**PC が計算した32バイトを送って端末がそれに署名する形（ブラインド署名）にしない。**
それをすると、画面の4行とハッシュが一致している保証が端末側に無い。
**「範囲が読める」というこの作品の主張が、そこで成立しなくなる。**

→ **関門1の合格条件に入れる。**

**落ちたときの代替：** PC が digest を送り、端末は4行と digest を並べて出す。
その場合は**発表で1行言う**：「端末は4行を検証していません」。**黙って使わない。**

## 4. 返すもの

65バイト（`r` 32 ‖ `s` 32 ‖ `v` 1）。
`v` は recovery id（0 または 1）で返ることがある。**Broker 側で `v < 27` なら `+27` に正規化する。**

## 5. Broker に渡す JSON（標準アプリでも自作アプリでも同じ）

```json
{
  "permit": {
    "holder": "0x…", "skill": "0x…", "version": "1.4.2", "key": "0x…",
    "target": "api.example.com", "scope": "read", "maxCalls": 20,
    "expiry": 1762500000, "nonce": 7
  },
  "domain": { "name": "Tomoshibi", "version": "1", "chainId": 16602, "verifyingContract": "0x…" },
  "signature": "0x…",
  "signer": "0x…",
  "source": "ledger-app"
}
```

- `signer` は**検証に使わない。** 食い違ったときの診断用（期待したアドレス）
- `source` は `ledger-app` / `ledger-eth-app` の2値。系譜にそのまま残す

## 6. Broker の検証（この順で）

1. **digest を JSON の `permit` / `domain` から作り直す。** 送られてきた digest は使わない
2. `ecrecover(digest, v, r, s)` → `signer`
3. `signer == permit.holder` か
4. `expiry > now` ／ `nonce` が未使用 ／ `scope` が実際の要求と一致するか
5. どれか欠けたら `DENIED`。理由を1語で返す：`sig` / `expired` / `nonce` / `scope`

## 7. 合格条件（関門1に足す）

**実機で長押しして返った署名を、Broker の `ecrecover` に入れて、
標準 Ethereum アプリのアドレスと同じ値が出ること。**

画面が出た・長押しが返った、では通さない。**Broker が同じアドレスを出すまでが関門1。**

## chainId【確・2026-11-06 実測】

| 名前 | chainId | RPC |
|---|---|---|
| **0G Galileo Testnet** | **16602** | `https://evmrpc-testnet.0g.ai` |
| 0G Mainnet | 16661 | `https://evmrpc.0g.ai` |

**根拠：** `https://evmrpc-testnet.0g.ai` に `eth_chainId` を投げて `0x40da` = **16602**。
チェーン本体に聞いた値なので一次情報。

**注意：** 一覧サイトには **16601**（`0G-Galileo-Testnet`、RPC なし）という古い項目も残っている。
**16601 を使うと EIP-712 の domainSeparator が変わり、`ecrecover` が別のアドレスを返す。**
使うのは **16602**。

## 未確認

- 自作アプリで `44'/60'` を導出できるか（`APP_LOAD_PARAMS`）
- 雛形に端末内 keccak256 が入っているか

---

## 6. 試験ベクタ（**先に合わせる。30時間目に直さない**）

`verifyingContract` は **`0x0000000000000000000000000000000000000000` のまま凍結する。**
レジストリを出しても、今回は domain を変えない。**変えると署名が全部変わり、両側を同時に直すことになる。**
（Ledger 側 `ledger-app/src/eip712.rs` の `VERIFYING_CONTRACT` も同じ値。コメントで相互に縛ってある）

```json
{
  "holder":   "0x19E7E376E7C213B7E7e7e46cc70A5dD086DAff2A",
  "skill":    "0x166b4a98f5f1c72f1e05921caf802eb07395b2afee302ceaef74b29657e641c5",
  "version":  "1.0.0",
  "key":      "0x6d5f7d408f4fb5f31403c52734dad9172da58198ab1599f5b0b9754e79d37148",
  "target":   "api.stripe.com",
  "scope":    "POST /v1/charges",
  "maxCalls": 3,
  "expiry":   1794009600,
  "nonce":    42
}
```

| | 値 |
|---|---|
| `domainSeparator` | `0x86aa93392bc42c203b5e25afa33e6d85df9f1a884ee0e74c4f1bd0d781d8a470` |
| **`digest`（端末が署名する32バイト）** | **`0x8d63692146d1c78f08bfbe1ab6fa254130767260d83921f2d9ed8680a7889486`** |
| 画面の4行 | `KEY   0x6d5f7d40…` / `TO    api.stripe.com` / `SCOPE POST /v1/charges x3` / `UNTIL 2026-11-07 00:00Z` |
| 試験鍵 `0x11…11`（32バイト）の署名 | `0x9814354237a00bfe1d1b182f4a6d5974eb52c38b3d186f32bea0ca0a26341b981fd5acc30eac9f1eab839e75554a12d4ef726a4f120a6774b4dc92461ac812491c` |

- `skill` は `keccak256("skill:mail-digest")`、`key` は `keccak256("STRIPE_SECRET")`。
  **`key` は鍵そのものではなくラベルのハッシュ**
- **Broker 側はこの値を試験で固定してある**（`broker/test/broker.test.js` の「試験ベクタ」）。
  **Ledger 側も同じ digest が出ることを端末で1回確かめること。** ここが合えば、残りは配線
- `UNTIL` は UTC。端末と Broker で同じ文字列になる
