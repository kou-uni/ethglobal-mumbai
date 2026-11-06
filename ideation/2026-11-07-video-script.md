# 提出動画のセリフ（スライド `ETHGlobalTokyo2026.pdf` 10枚 ＋ 9枚目のウォークスルー動画）

> **規則（`2026-11-06-submission-rules.md`）**: 2〜4分 / 720p 以上 / **自分の声**（AI 読み上げ不可）/
> 早回し不可 / 自己紹介は20秒以内 / スライドは1枚4行まで。**4:00 を1秒でも超えると upload で弾かれる。**
>
> **9枚目に README のウォークスルーを差し込む前提。** その尺を **1:45** として全体 **3:52** で組んである。
> **README の表記は「1 min 56 s」**（`README.md:30`）。実尺が 1:56 だと全体 **4:03** で**弾かれる**。
> **1:56 版を使うなら、§3 の1番（S3 の短縮 −8秒）を必ず先に当てる。**
>
> **動画が流れている間は黙る。** しゃべるのは差し込みの前と後だけ（§2 に任意の差し込みセリフ）。
> 話すのは英語（スライドが英語のため）。日本語は読みのメモで、字幕にする文ではない。

## 1. スライド別の台本（全長 3:52）

### S1 タイトル（0:00–0:08）
> Our project is **tomoshibi**. One line: **give your agent the work, not the key.**

*読み:* `tomoshibi` はゆっくり。**名乗りは S9 だけ**（「We are nana and kou」。20秒ルールはそれで満たす）。

### S2 You gave it the API key.（0:08–0:23）
> An API key is not permission — it **is** the key.
> Hand it over once, and you have handed over everything it can do.
> **No limit. No expiry. No receipt.** It never asks again.

*読み:* 一番効かせるのは **"not permission — it is the key"**。ここで「渡した瞬間に制限が無くなる」が立つ。
3つの No は一拍ずつ置いて、最後の `It never asks again.` は落として言う。**「貼り付ける」場面の説明はしない**（説明すると他人事になる）。

### S3 It's not just you.（0:23–0:36）
> And this is not one careless person. **One in three** workers has put a login or an API key into an AI chat,
> and **two thirds** of the keys leaked in 2022 still work today.

*読み:* 28.65M は読まない（画面に出ている。読むと13秒に収まらない）。

### S4 But now it asks.（0:36–0:54）
> tomoshibi does not take the work away from the agent. It takes **the key**.
> The agent holds a **label** — say, `stripe-live` — never the secret behind it.
> Every call gets one of three answers: **allowed, needs a press, or refused.**

*読み:* `label` と `the secret` を対にして強く。`stripe-live` は**例として**軽く置く（"say," を落として言わない）。

### S5 ロゴ（0:54–1:06）
> **tomoshibi is API key management, guarded by a hardware wallet.**
> **0G** weighs every request and seals the trail; the heavy ones are approved in your hand.

*読み:* **ここが「で、何をするもの？」への唯一の答え。** 1文目を言い切ってから、2文目。
`API key management` と `hardware wallet` を同じ息で言う（これが製品の定義）。
2文目は **weighs（重要度の判定）/ seals the trail（系譜の記録）/ in your hand（押下）** の3語だけ立てる。
**3つ目の主体（World）はここで出さない。** S8 で出す。
「one flame = one approved action」は**言わない**（比喩を先に出すと、何をするものか分からなくなる）。
炎の話は S7 と動画で、**動いているところを見せてから**で足りる。

### S6 Demo（1:06–1:13）
> The real app — not a mock: **live against production 0G**, with **every verdict sealed on-chain**.

*読み:* `not a mock` と `on-chain` の2語だけ立てる。**ここで初めて「本番につながっている」と言い切る**ので、
この先は「つながっているか」を疑われない前提で話せる。**数字（tx・ブロック・60/60）は動画では言わない**（README にある）。

### S7 Demo 表（1:13–1:26）
> **Three big moves.** Anything that moves money needs **the hardware wallet**.
> A tool that steps outside the scope you signed is **refused before it leaves the laptop**.
> Routine orders **pass silently**.

**日本語（意味の併記。読み上げない）**
> **大きな動きは3つ。** お金が動くものは、**ハードウェアウォレットでの承認を必須にする。**
> 署名した範囲の外に出た動きは、**このノートPCから出る前に拒否される。**
> 定型の注文は、**何も聞かずに通る。**

*読み:* ここは「これから見るものの地図」。表の4行を順に指す。**個別の説明はしない（動画がやる）。**
1つ目は「返金だから」ではなく **「お金が動くから」** が条件。**動画では返金がその例として出る。**
**バージョンの話（`THE LIGHT GOES OUT`）は言わない。** 粒度が他の3つと違い、ここで出すと「で、何の話？」になる。
表の4行目は画面に出たままでよく、**動画と S9 の「灯は消える」で足りる。**
**`0G が拒否する` とは言わないこと。** 範囲外は `broker/src/server.js:69` で 0G に渡る前に止まる（本体が外に出ず、クレジットも減らない）。
0G が読むのは**範囲内の**リクエストの重さだけ。「範囲外も 0G が見ている」と言うと、審査で辿られたときに嘘になる。
対応: `needs the hardware wallet` = NEEDS A PRESS / `steps outside the scope you signed` = REFUSED /
`pass silently` = ALLOWED・何も聞かれない / `puts every light out` = THE LIGHT GOES OUT。

### S8 配線図（1:26–1:44）
> Three parts, three jobs — and none of them is asked to trust the others.
> **Ledger** holds the press. **0G** weighs every request and seals the trail. **World** proves a person — once.
> **The key never crosses the network. The permission does.**

### S9 Team: yohaku ＋ ウォークスルー（1:44–3:35）
**（1:44–1:50 しゃべる）**
> We are nana and kou. Here is the whole thing, running.

**（1:50–3:35 = 1:45 無言。動画を流す）**

*読み:* 動画の音声が無いなら、§2 の差し込み3行だけ足す。**それ以上はかぶせない。**

### S9 おわり（3:35–3:47）
> We are not asking anyone to hand an agent everything.
> **What matters stays off the network — in your hand — and every use leaves a lineage.**
> That is the world we want to help build.

**日本語（意味の併記。読み上げない）**
> AI に全部を預け切ろうとは思っていない。
> **大事なものはネットワークから切り離して手元に置き、使われたことは系譜として残る。**
> その世界に寄与したい。

*読み:* **数字はここで言わない**（60/60 や tx は README にある。「よくテストしてます」で終わると小さく見える）。
`off the network` と `in your hand` で一度切り、`lineage` を置いてから最後の1文。

### S10 エンドカード（3:47–3:52）
> tomoshibi. **Give your agent the work, not the key.**

## 2. 動画にかぶせる差し込み（任意・3行だけ。尺は増えない）
動画に声が入っていない場合のみ。**該当のカットに合わせて1行ずつ。**

| かぶせる場所 | 1行 |
|---|---|
| `.env` に鍵を貼ろうとするところ | "She never sends the key. She sends a link." |
| Ledger に4行が出るところ | "Four lines, and the device signs **exactly those bytes**." |
| 別ホストへの呼び出しが止まるところ | "Refused — and the caller's signature is on the record." |

## 3. 4:00 を超えそうなとき、削る順
1. **S3 の読み上げ**（「And this is not one careless person.」1行だけにする） −8秒
2. **S7 の3行目**（`Routine orders pass silently` は動画が見せる） −4秒
3. **S8**（「who knows what is separated by design」1行に縮める） −10秒
4. **S6 の `not a mock`**（S9 の主張と重ならない範囲で短縮） −3秒

**絶対に削らない:** S4 の3つの答え／S9 のウォークスルー本体／**S9 のおわりの3行**。

## 4. スライド側の直し（収録前に）
- **S7 の3行目と4行目が入れ替わっている。**「runs the day's orders → STARS GO OUT」と
  「ships a new version → ALLOWED / Nothing is asked」が逆。正しくは
  「runs the day's orders → ALLOWED / Nothing is asked」「ships a new version → THE LIGHT GOES OUT / Praise does not carry to new code」。
  **台本（S7）は正しい順で書いてあるので、直さないとスライドと声が食い違う。**
- **`STARS GO OUT` → `THE LIGHT GOES OUT`**（star → light の統一。`2026-11-07-star-to-light.md`）。
  S8 の図中 `The only way a star is lit` も同じ。
- 差し込む動画は **1:45 の版か 1:56 の版か**を確定する（§冒頭）。
- **S5 の副題 `one flame = one approved action` は、この位置では効かない。**
  まだ何をするものか言っていない段階で比喩が来るため。差し替え案:
  **`API key management, guarded by a hardware wallet`**（炎の説明は S7 と動画に任せる）。
