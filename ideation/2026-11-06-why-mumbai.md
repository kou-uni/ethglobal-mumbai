# なぜムンバイで、このプロダクトなのか（2026-11-06 調査）

**結論：偶然ではない。インドは、TOMOSHIBI の設計が「意見」ではなく「規則」になっている
世界で唯一の市場である。** しかも規則・プロトコル・提案の3段が、全部この1年に揃った。
**調べる前の想定（「インドは市場が大きい」）は、いちばん弱い根拠だった。**

---

## 1. 三段の一致 — 規則／プロトコル／提案

### ① 規則：エージェントが払っても、1回ごとに動的な認証が要る【確】

**RBI（Authentication Mechanisms for Digital Payment Transactions）Directions, 2025**
（2025-09-25 発出、**2026-04-01 から適用**）。

- デジタル決済は**2つ以上の独立した認証要素**を要する
- カード非提示の取引では、**少なくとも1つは「動的」＝その取引に固有であることが証明されるもの**
- そして報道によれば、これは **人が始めたか、エージェントが始めたかを問わず適用される**

> **TOMOSHIBI の許可は、まさにこの「動的な要素」そのものだ。**
> EIP-712 のダイジェストは「どの鍵・どの宛先・どの操作・何回・いつまで」から作られ、
> **その要求にしか対応しない。** 端末の画面に出る4行と、署名されるバイト列が同じであることは、
> 「uniquely proven for that specific transaction」の実装そのものである。

### ② プロトコル：NPCI が、エージェントに払わせる土台を作っている【確】

NPCI が **UPI 上のエージェント決済の枠組み**を準備している（Reuters 2026-09-01 報道）。
中身は **規則ベースの指示（いつ・いくらまで払ってよいか）＋ 上限 ＋ 監査証跡 ＋ 本人確認**、
そして **責任（liability）の枠組み**。土台は既存の2つ：

- **UPI Circle** — 口座の持ち主が、**エージェントを含む第三者に支払い権限を委譲する**
- **Reserve Pay** — 複数回の引き落としのために**資金を先にブロックする**

> **これは TOMOSHIBI の許可の、銀行側の対応物だ。**
> 「権限を委譲する」「上限を決める」「監査証跡を残す」「責任の所在を決める」——
> 我々が4種類の拒否を**混ぜずに**残しているのは、最後の1つ（責任の所在）のためだった。

### ③ 提案：閾値を超えたら人を挟め、監査証跡つきで【確・ただし規則ではない】

**CERT-In（IT省のサイバー部門）の Digital Threat Report 2025-26**：

> **"Mandate human-in-the-loop controls for agentic AI actions above defined financial
> thresholds, with full audit trails."**

**これは TOMOSHIBI の1文要約である。** 「定められた金額の閾値を超えるエージェントの行為には、
人を挟むことを義務づけ、完全な監査証跡を付けよ」。
我々の `NEEDS_PRESS`（重い要求は人が押すまで通さない）と、追記のみの系譜が、そのまま対応する。

**ただし正直に**：これは脅威報告書の**提案であって、規則ではない**。そう書く。

---

## 2. 一致を、こちらの部品と突き合わせる

| インド側（制度・インフラ） | TOMOSHIBI 側（実装） | 一致の度合い |
|---|---|---|
| AFA はマンデート**登録時**と**初回**に要る（e-mandate 2026） | **許可の署名（Ledger で1回押す）** | 構造が同じ |
| 登録後は **₹15,000/件まで** AFA 無しで自動引き落とし可 | **範囲・回数・期限の中は黙って通る** | 構造が同じ |
| 閾値を超える1件は、**都度の動的認証** | **`NEEDS_PRESS`** — 重い1件だけ人を起こす | 構造が同じ |
| 24時間前の**事前通知**（相手・金額・日時） | **端末に出る4行**（事前に、人が読んで押す） | 同じ目的・より強い（事前署名） |
| **監査証跡**（NPCI の枠組み・CERT-In の提案） | **追記のみの系譜 ＋ 0G Storage への封印** | 同じ。封印は本番チェーンに乗っている |
| **責任の枠組み**（NPCI・詳細未公開） | **4種類の拒否を混ぜない**（DENIED / STOPPED / NEEDS_PRESS / human_denied） | **ここが我々の固有**。止まり方が違えば責任の所在が違う |

**コードは1行も変えなくてよい。** 形がすでに合っている。提出文に、この対応表の上3行を入れる。

---

## 3. なぜ「ムンバイ」なのか — 都市の必然

- **RBI の中央事務所はムンバイにある。** 上の①を出した当局がこの街にいる
- **NPCI の本社はムンバイにある。** ②を作っている組織がこの街にいる
- NPCI のエージェント決済の枠組みは、**ムンバイの Global Fintech Fest で披露される流れ**にある

**規則を書く側と、鉄道を敷く側と、我々が、同じ週に同じ街にいる。**
これは「インドは大きい」より具体的で、審査員が検証できる。

---

## 4. 数字（桁だけ使う）

| | |
|---|---|
| UPI 2026年10月 | **254.7億件 / ₹31.53 lakh crore**（月。初めて250億件と₹30 lakh crore を超えた） |
| 1日あたり | **8.22億件**、1日の取引額が初めて **₹1 lakh crore** を超えた |
| インドの開発者（GitHub・2026年9月） | **3,200万人。** 米国 3,830万人に次ぐ**世界2位**で、1年で **+1,008万人**。2030年に米国を抜く見込み |

**開発者数が効く理由**：TOMOSHIBI の P2（スキルの作り手）は開発者だ。
**灯を点ける側も、灯される側も、ここにいる。**

---

## 5. 弱いところ（先に書く。聞かれてから認めない）

- **UPI にも Ledger にも、我々はまだ繋いでいない。** 上の一致は**構造の一致**であって、統合ではない。
  「UPI 対応」と言ったら嘘になる。言わない
- **CERT-In のは提案で、規則ではない。** 「義務化されている」と言わない
- **RBI の規則は決済の話で、TOMOSHIBI は API キー全般**。決済はその部分集合。
  広げすぎると「規制を根拠にした誇張」に見える。**決済を例として使い、主張は広げない**
- インド固有の通貨・言語・決済手段への対応は**何もしていない**。
  やったのは「インドの制度が、我々の設計を先に正解と呼んでいた」ことの確認だけ

## 6. ピッチでの使い方（メインにはしない）

**メインは変えない**（AIが審判になる世界と、灯が消えること）。インドは**1枚・20秒**で置く。

> "We did not pick this problem for India. But India picked it first.
> From April 2026, RBI requires a dynamic, per-transaction factor for non-card-present
> payments — and it applies whether a human or an agent starts it. NPCI is building agent
> payments on UPI with spending limits, audit trails and a liability framework. And CERT-In
> asked for human-in-the-loop above a financial threshold, with full audit trails.
> That last sentence is our product description. We just wrote it in code."

**質疑で来る突っ込みと答え：**
- 「UPI に繋いだのか」→ **繋いでいない。構造が同じだと示しただけ**（正直に）
- 「規制対応製品なのか」→ **違う。規制はこれが要ると言っている証拠として出している**
- 「インド向けに何を作ったのか」→ **何も。作ったものが、たまたまインドの制度と同じ形だった**

---

## 出典（2026-11-06 取得）

- RBI (Authentication mechanisms for digital payment transactions) Directions, 2025（2025-09-25 発出 / 2026-04-01 適用）
  — https://www.rbi.org.in/scripts/bs_viewcontent.aspx?Id=4477 ほか解説（Khaitan & Co / Saraf Partners / legal500）
- RBI Digital Payments – E-mandate Framework, 2026（2026-04-21）：AFA は登録時と初回。₹15,000/件（保険・投信・カード請求は₹1 lakh）。24時間前の事前通知
  — https://www.businesstoday.in/personal-finance/news/story/rbi-caps-recurring-payments-at-rs15000-without-otp-under-new-e-mandate-framework-526759-2026-04-21 / https://ksandk.com/newsletter/rbi-e-mandate-framework/
- NPCI のエージェント決済の枠組み（Reuters 2026-09-01 報道）：上限・監査証跡・本人確認・責任の枠組み／UPI Circle・Reserve Pay が土台
  — https://thepaypers.com/payments/news/india-prepares-agentic-payments-rollout-on-upi-network
- CERT-In Digital Threat Report 2025-26：human-in-the-loop の義務化**提案**
  — https://www.medianama.com/2026/07/223-meity-proposes-mandatory-human-interventions-agentic-ai-payments/
- UPI 2026年10月：254.7億件 / ₹31.53 lakh crore / 日次8.22億件
  — https://entrackr.com/news/upi-hits-record-2547-bn-transactions-in-october-daily-value-crosses-rs-1-lakh-crore-12772871
- GitHub Octoverse 2026：インド3,200万人（世界2位・+1,008万人/年）
  — https://github.blog/news-insights/octoverse/octoverse-commits-pushes-reach-new-highs-in-2026-as-developers-build-with-agents/ / https://www.digit.in/features/general/github-octoverse-2026-india-is-the-second-largest-developer-hub-and-growing-faster-than-the-us.html

**取得はすべて 2026-11-06。一次資料（RBI 原文 PDF・NPCI 発表・CERT-In 報告書本体）には当たっていない【未確認】。**
引用した条文の文言は報道と法律事務所の解説による。**ピッチでは「報道によれば」を落とさない。**
