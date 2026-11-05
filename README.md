# TOMOSHIBI — ETHGlobal Mumbai 2026

ETHGlobal Mumbai 2026（kou-uni × mintannn）。ハックは 11/5 21:00 → 11/7 09:00 IST。

**TOMOSHIBI**（灯火 / a small flame that can go out）

**AIが見られない場所を手元に持ち、AIには「誰が信頼したか」を持たせる。** — 星の数ではなく、誰の星か。

レビューの点数は消えない。**灯は消える。だから意味がある。**

| 場所 | 中身 |
|---|---|
| `ideation/2026-11-06-decisions.md` | **決定の記録。** 何を決めたか（最新） |
| `ideation/2026-11-06-minta-proposal.md` | minta の提案：星は約束ではなく事実にする（採用） |
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
| **`broker/`** | **動くもの第1号。** `use` → 範囲チェック → 代理実行 → 系譜。`npm test` 14件 / `node demo.mjs` で通る2件・止まる5件 |
| `spec/permit-signature.md` | **署名の契約。** 導出パス・EIP-712・Broker の検証。Ledger と Broker の境界 |
| `spec/world-agent-pass.md` | **World Agent Pass の正体と入れ方**（OIDC / device flow） |

**分担（#12）：人が見るものは minta、人が見ないものは kou。**
境界は `spec/permit-signature.md` の JSON 1本と Broker の HTTP。
