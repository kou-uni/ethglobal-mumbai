# TOMOSHIBI — ETHGlobal Mumbai 2026

ETHGlobal Mumbai 2026（kou-uni × mintannn）。ハックは 11/5 21:00 → 11/7 09:00 IST。

> **作業を再開するときは [START-HERE.md](START-HERE.md) を先に読む。**
> いまの状態・動かし方・次の一手がそこに全部ある。

**TOMOSHIBI**（灯火 / a small flame that can go out）

**AIが見られない場所を手元に持ち、AIには「誰が信頼したか」を持たせる。** — 星の数ではなく、誰の星か。

レビューの点数は消えない。**灯は消える。だから意味がある。**

| 場所 | 中身 |
|---|---|
| `ideation/2026-11-06-decisions.md` | **決定の記録。** 何を決めたか（最新） |
| **`ideation/2026-11-07-finalist-4min.md`** | **Finalist 審査（7分）の台本。** デモ4分の進行表・押されたら捨てる順・質疑3分（定番3つ＋来るとわかっている突っ込み6つ） |
| **`ideation/2026-11-06-submission-rules.md`** | **提出と審査の規則（ETHGlobal 公式）。** 締切・禁止事項・審査基準・動画の規則と、こちらの適合状況 |
| **`ideation/2026-11-06-stack.html`** | **システムスタック。** 7段（プロトコル／ツール／プロダクト）と、借りものが落ちたときの振る舞い |
| `ideation/2026-11-06-minta-proposal.md` | minta の提案：星は約束ではなく事実にする（採用） |
| **`ui/`** | **動くデモ画面（試作）。** `index.html`＝門（4通りの止まり方が見える）／`stars.html`＝灯（版が上がると消える）。値は本番の 0G に実際に投げた応答 |
| **`ideation/2026-11-06-market-and-model.html`** | **市場規模（TAM/SAM/SOM）とビジネスモデル。** TAM $43B・SAM $2–7B・SOM $1.4M（3年目）／収益3本と、1判定の原価（実測300トークン）／やらないこと |
| **`ideation/2026-11-06-diagrams.html`** | **アーキテクチャ図と5つのシーケンス図。** 通る／押させる／止める／決めない／灯をともす（生成: `ideation/build-diagrams.py`） |
| `ideation/2026-11-06-touchpoints.html` | **誰が・いつ・どの画面に出会い、何を変えるか。** 決めてほしいこと9個の内訳／スタックチャンを入れるなら③だけ |
| `ideation/2026-11-06-screen-flow.html` | **画面遷移とプロセス。** 画面5枚・遷移表・使用のプロセス・World のプロセス・決めてほしいこと3つ |
| `ideation/2026-11-06-demo-scenario.md` | **デモの筋書き。** 3分の進行表・90秒版・壊れたときの退避・撮影前の確認 |
| `ideation/2026-11-06-storyboard.md` | **デモ台本。** 画面3つ・3分の絵コンテ・映え5つ・キャッチコピー（[スマホで見る](https://htmlpreview.github.io/?https://github.com/kou-uni/ethglobal-mumbai/blob/main/ideation/2026-11-06-storyboard.html)） |
| `ideation/2026-11-06-final-image.md` | **仕上がり。** アーキテクチャ図・ビジネスモデル・ペルソナ・ジャーニー（動画の絵コンテ） |
| `ideation/2026-11-06-philosophy.md` | **思想。** なぜこれを作るのか（機能は削れても、ここは削らない） |
| `ideation/2026-11-06-review.md` | **まず読む。** ストーリーと機能を1枚に（合意／提案の印つき） |
| `ideation/2026-11-06-integrated.md` | 議論の統合版 |
| `ideation/2026-11-06-architecture.md` | アーキテクチャ（叩き台 v2） |
| `ideation/2026-11-06-architecture-v2.html` | 図（ダウンロードしてブラウザで開く） |
| `research/10-ef-fit.md` | EF の賞との適合性（CROPS ＞ Anon-RPC） |

## いま決まっていること・作るもの

| 場所 | 中身 |
|---|---|
| `ideation/2026-11-06-plan.md` | **実施方針と時間割。** 分担・関門・捨てるもの |
| `ideation/2026-11-06-tech-value-review.md` | **World / Ledger / 0G の位置づけと、実装に載っているかの再評価** |
| `research/11-prize-gap.md` | **賞ごとの「狙えるか・足りないもの・埋め方」**（上限 $11,250） |
| **`broker/`** | **動くもの。** `use` → 範囲チェック → **0G が重さを決める** → 代理実行 → 系譜、と **World で星を出す**。`npm test` 47件 / `node demo.mjs` |
| `ideation/2026-11-06-world-integration-notes.md` | **World 導入の振り返り**（両方の World 賞で必須。§6 は提出用の英語） |
| `spec/permit-signature.md` | **署名の契約。** 導出パス・EIP-712・Broker の検証。Ledger と Broker の境界 |
| `spec/world-agent-pass.md` | **World Agent Pass の正体と入れ方**（OIDC / device flow） |

**分担（#12）：人が見るものは minta、人が見ないものは kou。**
境界は `spec/permit-signature.md` の JSON 1本と Broker の HTTP。


## プライバシー（EF CROPS）

**誰が、何を知るか。設計で分けてある。**

| | 知っているもの | 知らないもの |
|---|---|---|
| **Ledger（手元の機器）** | 範囲の4行（鍵のラベル・宛先・操作・期限）と、押したかどうか | 要求の本文。鍵の平文も外に出ない |
| **World** | **人であること・同じ人であること**（sector 単位の仮名） | 何のスキルに星を出したか・何の鍵か・いつ使ったか |
| **0G Private Computer（TeeML）** | 要求の本文（**封印された中で**。重さを決めるため） | 鍵の平文。**我々も読めない**（TEE の中で完結する） |
| **Broker** | 範囲・判定・系譜 | — **ここが唯一の信頼点。今回は TEE に載せていない**（下の「黙って良く見せない」） |
| **系譜（0G Storage）** | 誰が許し、何を要求し、通ったか止まったか | **本文も鍵も入れない。** 公開前提で書いている |

- **星は仮名でしか結ばない。** World の `sub`（sector 単位）だけを刻む。氏名・メール・ウォレットは要らない
- **トラッカーは使っていない。** 解析スクリプト・ピクセル・サードパーティ Cookie いずれも無し
- **OSS。** MIT（`LICENSE`）。依存は `viem` / `jose` / `ethers` / `@0gfoundation/0g-storage-ts-sdk`
- **照会で漏らさない。** 星の読み取りは既定で Anon-RPC 経由にし、全件を取って端末で絞る方針
  （**未実装。** `research/10-ef-fit.md`、判定は #6）

## 0G（なぜ要るのか・なぜ明日も来るのか）

**0G を外すと何が壊れるか（1文）:**
**要求の中身を読まないと重さは決まらないのに、中身を我々に見せたくない。封印された推論でしか成り立たない。**
0G を外すと、重さを決めるために Broker が本文を平文で読むことになる — この作品の前提が壊れる。

**また来る理由（2行）:**
星は1回では意味がない。**同じ鍵で使い続けている事実が積み上がるほど重くなる。**
そして版が変われば星は一斉に消えるので、**使い続けている人だけが、消えたことに気づいて出し直す。**

## どう作ったか（ETHGlobal の規定に沿った開示）

**ハック期間中（11/5 21:00 IST 以降）に作った。** 事前のプロジェクト固有のコードは使っていない。

### 再利用したもの（公開のスターターキット・ライブラリ）

| 場所 | 由来 | ライセンス |
|---|---|---|
| `ledger-app/` | LedgerHQ **`app-boilerplate-rust`** から開始（アプリの中身は今回書いた） | Apache-2.0 |
| `broker/` の依存 | `viem` / `jose` / `ethers` / `@0gfoundation/0g-storage-ts-sdk` | 各 OSS |
| `bridge/bridge.py` | `hidapi`（Python） | 各 OSS |

本体（`broker/src/`・`web/`・`ui/`・`spec/`・`ideation/`）は**今回書いたもの**。

### AI ツールの使い方

**使った：Claude Code（Anthropic）。2人のうち、人が見ない側の実装と文書で使っている。**

| 範囲 | 使い方 |
|---|---|
| `broker/src/`・`broker/test/` | **人が設計を決め、AI に書かせ、人がテストで検証した。** 判定の境界（4つの止まり方・範囲照合・回数）は人が仕様として先に書いた（`spec/`） |
| `ideation/`・`research/` | 構成と文章の起草に使用。**数字・判定・実測値は人が実行して確かめたものだけを載せている**（【確】の印） |
| `web/`・`ui/` | **minta が設計・実装**（画面は人の手） |
| `ledger-app/`（Rust） | **minta が実機で実装**（AI 補助あり） |

**spec 駆動の成果物は全部このリポジトリにある：**
`spec/permit-signature.md`（Ledger と Broker の契約）・`spec/world-agent-pass.md`・
`ideation/2026-11-06-decisions.md`（何を決め、何を捨てたか・18件）・
`ideation/2026-11-06-plan.md`（時間割と関門）。
**生成物だけでなく、どう指示し、何を却下したかが残っている。**

AI が作って人が確かめていないものは、提出物に入れていない。
実測していない数字には【未確認】と書いてある。
