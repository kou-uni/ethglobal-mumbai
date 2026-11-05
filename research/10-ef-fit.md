# EF（Ethereum Foundation）の賞との適合性（2026-11-06）

> 作り方：サブエージェントが一次情報（公式ドキュメント・GitHub・ETHGlobal の賞ページ）を読んで報告したもの。【確】は一次情報で読んだもの、【未確認】は確かめていないもの。

## 結論
**合う順は CROPS ＞ Anon-RPC ＞ Alt mempool。** チェーンは 0G のままでよい。
**EF の賞は1プロジェクトにつき1つ**なので、CROPS と Anon-RPC の両方に出して、審査員に選んでもらう。

| 順 | 賞 | 適合 | 必要な変更 |
|---|---|---|---|
| 1 | Best CROPS App $3.5k | 高 | README に CROPS 節（4文字それぞれ1〜2行。Private の行に Ledger・World・0G がそれぞれ何を知るかを書く）、OSS ライセンス、トラッカーなし、3分以内のデモ動画 |
| 2 | Best Use of Anon-RPC $5k | 中〜高 | 星の読み取りを既定で Anon-RPC 経由にする。全件を取得して端末で絞り込む |
| 3 | Alt mempool $5k | 低 | devnet で別に実装が要る。本筋から外れる（採らない） |

## Anon-RPC
- 【確】specifier（ネットワーク指定用のコントラクト）を渡すと、匿名化された `fetch` が返る。null-origin の iframe 内の Worker で動く。https://ethereum.github.io/anon-rpc/
- 【確】npm の `@anon-rpc/browser-harness` を使う、ブラウザ専用の仕組み。宛先は任意の URL で、viem の custom transport に渡せる。そのため 0G の RPC も宛先にできるはず（0G では動かしていない）
- 【確】specifier を読むために、最初に一度だけ mainnet（Nox は Sepolia）の provider が要る。匿名化ネットワークは Tor・Nym（mainnet）と Nox（Sepolia）。Tor のゲートウェイはデモ用で、容量が小さい。https://ethereum.github.io/anon-rpc/wallets/ ・ https://ethereum.github.io/anon-rpc/adopters/
- **注意**：隠れるのは「誰が照会したか」。「どの仮名・どのスキルを照会したか」という中身は RPC から見える。だから、知り合いの情報を外に出さないには、**レジストリの全イベントを取って端末で絞る**設計にする
- 【未確認】成熟度の正式な表記

## 賞の要件 【確】https://ethglobal.com/events/mumbai/prizes
- Anon-RPC：アプリの RPC 読み取りを、既定で Anon-RPC 経由にする
- CROPS：OSS ライセンスの公開リポジトリ、README の CROPS 節、3分以内のデモ動画、トラッカーなし、鍵と個人データを端末内に置く。ゼロから作るのでこの枠で合っている（既存プロジェクト向けの Continuity 枠は別）
- どちらの本文にもチェーンの指定は無い
- 【未確認】EF がパートナー枠3つのうち1つを使うか（Arkiv の欄には「1パートナーとして数える」と明記されている）

## Alt mempool / EIP-8141・Kohaku
- 【確】フレームトランザクションは、検証・ガス支払い・実行を分けた、ネイティブのアカウント抽象。https://eips.ethereum.org/EIPS/eip-8141 。alt mempool（ERC-8421、ドラフト）は、ステークと評判で、公開 mempool が通さないトランザクションを受け付ける。https://docs.altmempool.wtf/ 。範囲付きの権限とは考え方が近いが、devnet で別に作る必要がある
- 【確】Kohaku は JS のプライバシー用ツール群。README に「本番には使えない・監査を受けていない」とある。https://github.com/ethereum/kohaku 。直接の関わりは薄い

## CROPS のどこを体現するか
- 【確】censorship resistant / open source / private / secure。https://blog.ethereum.org/2026/03/13/ef-mandate
- いちばん説得力があるのは **Private**。「誰を知っているかが端末から出ない」のは設定ではなく、仕組みそのものだから
