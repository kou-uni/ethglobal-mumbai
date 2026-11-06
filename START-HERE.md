# 続きはここから（2026-11-06 11:00 JST / 07:30 IST 更新）

**新しいセッションを開いたら、このファイルだけ読めば再開できる。**
作業ディレクトリは `~/ch/seeds/ethglobal-mumbai/repo`（この公開リポジトリのクローン）。

---

## 1. いまの一行

**Broker は本番の 0G につながって動いている。通しの5本も全部出る。
止まっているのは gas だけ。次にやるのは3分のピッチ台本。**

## 2. 動くことを確かめた手順（この順で打てば、そのまま再現する）

```bash
cd ~/ch/seeds/ethglobal-mumbai/repo/broker

# 本番の 0G につないだ Broker
(set -a; . ./.env.local; set +a; PORT=8797 EXECUTE=0 node src/server.js &)

# 「0G に届かない」Broker（STOPPED を実演するため。届かない宛先を渡すだけ）
(set -a; . ./.env.local; set +a; ZG_ENDPOINT=https://router-api.invalid/v1 PORT=8798 EXECUTE=0 node src/server.js &)

curl -s http://127.0.0.1:8797/health            # apiKey:true / storageKey:true / simulated が無いこと
node demo.mjs http://127.0.0.1:8797 http://127.0.0.1:8798   # 通しの5本
npm test                                        # 50/50
```

**注意:** 以前のセッションの古い Broker が 8787〜8789 に残っていることがある。
`kill` は環境に止められるので、**空いているポートを使う**（8797 / 8798 は空き）。
`.env.local` は gitignore。無い環境では `ZG_API_KEY` と `ZG_PRIVATE_KEY` を自分で置く。

## 3. 終わっていること

| | 状態 |
|---|---|
| Broker（範囲・回数・違反・代理実行・系譜） | 動く。テスト 50/50 |
| 0G Private Computer（重さ判定） | **本番キーで動作確認済**。1.3〜2.2秒、request id 取得済 |
| 通しの5本（ALLOWED / NEEDS_PRESS / 一押しで通る / DENIED 5種 / STOPPED） | **全部出る** |
| Ledger アプリ（minta） | 実機で動作。`origin/minta/ledger-app` |
| 提出フォームの初稿・アーキ1枚・TODO1枚・アドレス一覧 | ある（§6） |

## 4. 止まっていること

| 待ち | 影響 | 外れなかったら |
|---|---|---|
| **gas**（`0xdfcbC73bEC15dD080545f77f8B702832a2b142A4`） | 0G Storage に書けない。root hash は出るが tx が無い | 「系譜はローカル追記のみ」と提出文に書く。tx があるフリはしない |
| **World のクライアント登録** | 星の人証明が本番で動かない | 星は実演せず設計の説明に落とす |

gas は **0.0000002〜0.0000005 0G** で足りる（実測）。faucet（`https://faucet.0g.ai`）が来ないので
Telegram で直接送ってもらう依頼を出している。

## 5. 次にやること（上から順）

1. **3分のピッチ台本**（日本語で話す版＋英語で読む版）。`ideation/2026-11-06-storyboard.md` と
   アーキ v3 の「拒否が4種類」を土台にする
2. gas が着いたら `/seal` を1回回し、**tx と root hash を控える**（提出文に実物を貼る）
3. World のクライアント登録が済んだら device flow を通す
4. **撮影 11-06 22:00 IST**。その前に `/health` で `simulated` が出ていないことを目視
5. **仮提出 11-07 03:00 IST**（締切 09:00 IST）

## 6. どこに何があるか

| 見るもの | 場所 |
|---|---|
| **提出までのTODO（1枚・チェックできる）** | `ideation/2026-11-06-todo.html` |
| 提出フォームに貼る初稿（全項目） | `ideation/2026-11-06-submission-form.md` |
| 提出文の長い版（英語） | `ideation/2026-11-06-submission-draft.md` |
| **アーキテクチャ（いまの正）** | `ideation/2026-11-06-architecture-v3.md` ／ 1枚HTMLは同名 `.html` |
| アドレス・エンドポイント・環境変数の全部 | `ADDRESSES.md` |
| 端末と Broker の境界（**動かすと署名が壊れる**） | `spec/permit-signature.md`（§6 にテストベクタ） |
| 決めたこと・まだ確かめていないこと | `ideation/2026-11-06-decisions.md` |
| 手順書の正本（事務・賞要件・撮影） | `ideation/2026-11-06-submission-checklist.md` |

**古い資料**: `ideation/2026-11-06-architecture.md`（v2）は捨てた部品が残っている。先頭に印がある。

## 7. 動かしてはいけないもの

- `spec/permit-signature.md` の **domain**（`verifyingContract` はゼロアドレスで凍結、chainId 16602）。
  変えると minta の実機と `ecrecover` が合わなくなる
- **ETHGlobal Tokyo 2026 の成果物（別件・凍結中）とその公開経路**。TOMOSHIBI では一切使わない。
  デモ URL は GitHub Pages ＋ 動画で出す
- **インドの語・象徴を借りない**（🪔 を使わない理由。`interests/ethglobal-mumbai-hackathon-plan` に経緯）

## 8. 分担

- **minta** = 見えるもの（Ledger アプリ・星の画面・撮影）
- **kou + Claude** = 見えないもの（Broker・0G・World・設計・文章・提出）
