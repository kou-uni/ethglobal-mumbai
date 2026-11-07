# 提出動画のセリフ（スライド `ETHGlobalTokyo2026_1.pdf` 12枚。ウォークスルーは8枚目）

> **規則（`2026-11-06-submission-rules.md`）**: 2〜4分 / 720p 以上 / **自分の声**（AI 読み上げ不可）/
> 早回し不可 / 自己紹介は20秒以内 / スライドは1枚4行まで。**4:00 を1秒でも超えると upload で弾かれる。**
>
> **8枚目（黒いタイトルカード）に README のウォークスルーを差し込む前提。** その尺を **1:45** として全体 **3:52** で組んである。
> **README の表記は「1 min 56 s」**（`README.md:30`）。実尺が 1:56 だと全体 **4:03** で**弾かれる**。
> **1:56 版を使うなら、§3 の1番（S3 の短縮 −8秒）を必ず先に当てる。**
>
> **動画が流れている間は黙る。** しゃべるのは差し込みの前と後だけ（§2 に任意の差し込みセリフ）。
> 話すのは英語（スライドが英語のため）。日本語は読みのメモで、字幕にする文ではない。

## 1. スライド別の台本（全長 3:52）

### S1 タイトル（0:00–0:08）
> Our project is **tomoshibi**. One line: **give your agent the work, not the key.**

*読み:* `tomoshibi` はゆっくり。**名乗りは S10 だけ**（「We are nana and kou」。20秒ルールはそれで満たす）。

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
**3つ目の主体（World）はここで出さない。** S9 で出す。
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

*読み:* ここは「これから見るものの地図」。表の3行を順に指す。**個別の説明はしない（動画がやる）。**
1つ目は「返金だから」ではなく **「お金が動くから」** が条件。**動画では返金がその例として出る。**
**バージョンの話（`THE LIGHT GOES OUT`）は言わない。** 粒度が他の3つと違い、ここで出すと「で、何の話？」になる。
バージョンの行は新しいデッキで `ref: Other features` に移っているので、**指さない。**
**`0G が拒否する` とは言わないこと。** 範囲外は `broker/src/server.js:69` で 0G に渡る前に止まる（本体が外に出ず、クレジットも減らない）。
0G が読むのは**範囲内の**リクエストの重さだけ。「範囲外も 0G が見ている」と言うと、審査で辿られたときに嘘になる。
対応: `needs the hardware wallet` = NEEDS A PRESS / `steps outside the scope you signed` = REFUSED /
`pass silently` = ALLOWED・何も聞かれない / `puts every light out` = THE LIGHT GOES OUT。

*読み:* **`holds the press` とは言わない。** press は人の長押し（行為）で、端末が持っているものではない。
端末が持っているのは **許可に署名する鍵**（`spec/permit-signature.md`。画面の4行と署名する32バイトは同じ値から作る）。
**API キー自体は broker 側で、端末には入っていない。** ここを混ぜると「鍵が端末にある」と誤解される。
**World は「信頼できる人か」を判定しない。** 証明するのは**実在する一意の人間が後ろにいること**（一人一回）。
`trusted` / `trustworthy` と言うと World 賞の審査で突かれる。**評判（reputation）は灯の側にあり、World はそれに持ち主を与える。**
`evaluation` は使わない（英語では査定の意味になる）。

### S8 ウォークスルー（黒いカード）（1:26–3:17）
**（1:26–1:32 しゃべる）**
> Here is the whole thing, running.

**（1:32–3:17 = 1:45 無言。動画を流す）**

### S9 配線図（ダーク版）（3:17–3:35）
> Three parts, three jobs — and none of them is asked to trust the others.
> **Ledger** holds the key that says yes. **0G** weighs every request and seals the trail. **World** makes that reputation belong to one real human.
> **The key never crosses the network. The permission does.**

*読み:* 動画の音声が無いなら、§2 の差し込み3行だけ足す。**それ以上はかぶせない。**

### S10 Team: yohaku（3:35–3:47）
> We are nana and kou.
> We are not asking anyone to hand an agent everything.
> **What matters stays off the network — in your hand — and every use leaves a lineage.**
> That is the world we want to help build.

**日本語（意味の併記。読み上げない）**
> AI に全部を預け切ろうとは思っていない。
> **大事なものはネットワークから切り離して手元に置き、使われたことは系譜として残る。**
> その世界に寄与したい。

*読み:* **数字はここで言わない**（60/60 や tx は README にある。「よくテストしてます」で終わると小さく見える）。
`off the network` と `in your hand` で一度切り、`lineage` を置いてから最後の1文。

### S11 エンドカード（3:47–3:52）
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
3. **S9**（「who knows what is separated by design」1行に縮める） −10秒
4. **S6 の `not a mock`**（S10 の主張と重ならない範囲で短縮） −3秒

**絶対に削らない:** S4 の3つの答え／S8 のウォークスルー本体／**S10 のおわりの3行**。

## 4. スライド側の直し（収録前に）
- **行の入れ替わりは `_1.pdf` で直っている**（ALLOWED / NEEDS A PRESS / REFUSED の順。バージョンの行は `ref: Other features` に移動）。**台本と一致。**
- **残っている直し: `STARS GO OUT` → `THE LIGHT GOES OUT`**（star → light の統一。`2026-11-07-star-to-light.md`）。
  S9 の図中 `The only way a star is lit` も同じ。
- 差し込む動画は **1:45 の版か 1:56 の版か**を確定する（§冒頭）。
- **S5 の副題 `one flame = one approved action` は、この位置では効かない。**
  まだ何をするものか言っていない段階で比喩が来るため。差し替え案:
  **`API key management, guarded by a hardware wallet`**（炎の説明は S7 と動画に任せる）。
  **1枚目の副題は `_1.pdf` で `secure key management using HW wallet` に入った。** S5 も同じ線で揃えると、声（S5）と画面が一致する。
- **S12（`One call, through the switchboard`）は動画の中のコマ。** スライドとしてめくると、動画と同じ絵が二度出る。**S11 で終わる。**
