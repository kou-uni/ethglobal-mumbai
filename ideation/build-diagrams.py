#!/usr/bin/env python3
"""シーケンス図とアーキテクチャ図を1枚の HTML にする。

    python3 ideation/build-diagrams.py

手で SVG を書くと、矢印が1本ずれても誰も気づかない。ここでは流れを表で書き、
線は機械に引かせる。図を直すときは下の SEQUENCES を直すこと。
"""
import html, re
from pathlib import Path

HERE = Path(__file__).resolve().parent
INK, INK2, INK3, ACC, HAIR, FILL = '#1a1a1a', '#555555', '#8e8e8e', '#173f66', '#d9d9d9', '#e7e9ec'

def esc(s): return html.escape(s, quote=False)

def seq_svg(actors, steps, width=740):
    """actors: [(key, 上段, 下段)]  steps: [(from, to, 文, kind)] kind=call|ret|self|note"""
    n = len(actors)
    pad, head = 10, 56
    colw = (width - pad * 2) / n
    x = {k: pad + colw * (i + 0.5) for i, (k, _, _) in enumerate(actors)}
    rows = [s for s in steps]
    y0 = head + 34
    dy = 36
    h = y0 + dy * len(rows) + 14
    out = [f'<svg viewBox="0 0 {width} {h:.0f}" role="img" aria-label="sequence">']
    # 柱
    for k, top, sub in actors:
        bx, bw = x[k] - colw / 2 + 6, colw - 12
        main = k == 'broker'
        out.append(f'<rect x="{bx:.1f}" y="10" width="{bw:.1f}" height="{head - 18}" fill="{ACC if main else FILL}"/>')
        tc = '#ffffff' if main else INK
        sc = '#ffffff' if main else INK3
        out.append(f'<text x="{x[k]:.1f}" y="30" text-anchor="middle" font-size="11.5" font-weight="700" fill="{tc}">{esc(top)}</text>')
        out.append(f'<text x="{x[k]:.1f}" y="45" text-anchor="middle" font-size="9.5" fill="{sc}" opacity="{0.8 if main else 1}">{esc(sub)}</text>')
        out.append(f'<line x1="{x[k]:.1f}" y1="{head}" x2="{x[k]:.1f}" y2="{h - 8}" stroke="{HAIR}" stroke-dasharray="3 4"/>')
    # 矢印
    out.append(f'<defs><marker id="a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="{INK}"/></marker>'
               f'<marker id="b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="{ACC}"/></marker></defs>')
    for i, (a, b, text, kind) in enumerate(rows):
        y = y0 + dy * i
        strong = kind == 'ret'
        col = ACC if strong else INK
        mark = 'b' if strong else 'a'
        if kind == 'note':
            out.append(f'<rect x="{x[a] - colw/2 + 10:.1f}" y="{y - 13:.1f}" width="{colw - 20:.1f}" height="22" fill="{FILL}"/>')
            out.append(f'<text x="{x[a]:.1f}" y="{y + 2:.1f}" text-anchor="middle" font-size="10" fill="{INK2}">{esc(text)}</text>')
            continue
        if a == b:
            x1 = x[a]
            out.append(f'<path d="M{x1:.1f} {y - 8:.1f} h 26 v 16 h -26" fill="none" stroke="{col}" marker-end="url(#{mark})"/>')
            out.append(f'<text x="{x1 + 32:.1f}" y="{y + 3:.1f}" font-size="10.5" fill="{col}">{esc(text)}</text>')
            continue
        x1, x2 = x[a], x[b]
        sign = 1 if x2 > x1 else -1
        out.append(f'<line x1="{x1 + sign*4:.1f}" y1="{y:.1f}" x2="{x2 - sign*8:.1f}" y2="{y:.1f}" stroke="{col}" '
                   f'{"stroke-dasharray=\"5 4\"" if kind == "ret" else ""} marker-end="url(#{mark})"/>')
        mid = (x1 + x2) / 2
        weight = '700' if strong else '400'
        out.append(f'<text x="{mid:.1f}" y="{y - 7:.1f}" text-anchor="middle" font-size="10.5" font-weight="{weight}" fill="{col}">{esc(text)}</text>')
    out.append('</svg>')
    return '\n'.join(out)

AG = ('agent', 'エージェント', 'スキルの実体')
BR = ('broker', '門（Broker）', '唯一の信頼点')
ZG = ('zg', '0G', '封印された推論')
LD = ('ledger', '手元の機器', 'Ledger Flex')
AP = ('api', '相手の API', 'api.stripe.com')
ST = ('store', '系譜', '0G Storage')

SEQUENCES = [
  dict(no='01', title='ふだんの要求 — 黙って通る', verdict='ALLOWED 200',
       msg='範囲の中で、0G が「ふだん」と読んだ要求。<b>人は何もしない。画面も出ない。</b>',
       actors=[AG, BR, ZG, AP, ST],
       steps=[('agent','broker','① 要求 ＋ 許可 ＋ 2つの署名','call'),
              ('broker','broker','② 署名を検証（持ち主・スキル）','self'),
              ('broker','broker','③ 範囲と回数を照合','self'),
              ('broker','zg','④ 本文を封印の中へ（鍵は渡さない）','call'),
              ('zg','broker','⑤「ふだん」＋ request id','ret'),
              ('broker','api','⑥ 代理で実行','call'),
              ('api','broker','⑦ 結果','ret'),
              ('broker','store','⑧ 系譜に追記（本文は入れない）','call'),
              ('broker','agent','⑨ ALLOWED ＋ 残り回数','ret')]),
  dict(no='02', title='重い要求 — 押されるまで通さない', verdict='409 NEEDS_PRESS → 200 ALLOWED',
       msg='0G が「決定的」と読んだ要求は、<b>立っている許可では通らない</b>。要るのは<b>使い切りの許可</b>＝その場の一押し。',
       actors=[AG, BR, ZG, LD, AP, ST],
       steps=[('agent','broker','① $4,800 の送金を要求','call'),
              ('broker','zg','② 本文を封印の中へ','call'),
              ('zg','broker','③「決定的」','ret'),
              ('broker','agent','④ NEEDS_PRESS（通さない）','ret'),
              ('broker','ledger','⑤ 4行を機器に出す','call'),
              ('ledger','ledger','⑥ 人が長押し（5秒）','self'),
              ('ledger','broker','⑦ 使い切りの許可に署名','ret'),
              ('broker','api','⑧ この1回だけ実行','call'),
              ('broker','store','⑨ 誰が押したかを追記','call'),
              ('broker','agent','⑩ ALLOWED（残り 0）','ret')]),
  dict(no='03', title='範囲の外 — 止めて、違反として刻む', verdict='DENIED 403',
       msg='宣言した範囲を外れた要求は、<b>スキル自身の署名ごと</b>記録に残る。<b>0G には聞かない</b>（聞く前に外れている）。',
       actors=[AG, BR, ST],
       steps=[('agent','broker','① 別の宛先（evil.com）へ','call'),
              ('broker','broker','② 範囲の照合で落ちる','self'),
              ('broker','store','③ 違反として追記（スキルの署名つき）','call'),
              ('broker','agent','④ DENIED ＋ 理由','ret'),
              ('broker','broker','⑤ 回数は減らさない','self')]),
  dict(no='04', title='0G に届かない — 決めないで止める', verdict='STOPPED 503',
       msg='<b>既定値を作らない。</b>「たぶん軽いから通す」も「とりあえず止める」も、どちらも偽の判断になる。',
       actors=[AG, BR, ZG],
       steps=[('agent','broker','① ふだんの要求','call'),
              ('broker','zg','② 問い合わせ','call'),
              ('zg','broker','③ 応答なし（30秒）','ret'),
              ('broker','agent','④ STOPPED「決められないので止めた」','ret'),
              ('broker','broker','⑤ 回数は減らさない・系譜には残す','self')]),
  dict(no='05', title='灯をともす — World で1回だけ名乗る', verdict='確かめられた ／ human_denied ／ proof_expired',
       msg='<b>鍵を使うたびには聞かない。</b>World に出るのは、灯を1つ出すときだけ。',
       actors=[('me','本人の画面','灯の空'), BR, ('world','World','Agent Pass'), ('phone','本人のスマホ','World App')],
       steps=[('me','broker','① この版に灯をともしたい','call'),
              ('broker','world','② device flow を開始','call'),
              ('world','broker','③ コードと待ち受け','ret'),
              ('broker','me','④ コードを出して待つ（残り10分）','ret'),
              ('phone','world','⑤ 本人が端末で承認する','call'),
              ('world','broker','⑥ 仮名（sub）つきの署名','ret'),
              ('broker','broker','⑦ 署名を検証し、(スキル,版) に灯を1つ','self'),
              ('broker','me','⑧ 灯がともる（誰のかは仮名のまま）','ret')]),
]

ARCH = f'''
<svg viewBox="0 0 760 468" role="img" aria-label="architecture">
  <text x="8" y="14" font-size="10.5" letter-spacing="0.08em" fill="{INK3}">手元（人と鍵）</text>
  <text x="268" y="14" font-size="10.5" letter-spacing="0.08em" fill="{INK3}">門</text>
  <text x="520" y="14" font-size="10.5" letter-spacing="0.08em" fill="{INK3}">外（我々が信じなくてよい相手）</text>
  <line x1="0" y1="20" x2="760" y2="20" stroke="{HAIR}"/>

  <rect x="8" y="40" width="200" height="66" fill="{FILL}"/>
  <text x="20" y="62" font-size="12" font-weight="700" fill="{INK}">エージェント</text>
  <text x="20" y="80" font-size="10.5" fill="{INK2}">スキルの実体。鍵は持てない</text>
  <text x="20" y="96" font-size="10.5" fill="{INK2}">要求に自分の署名を付ける</text>

  <rect x="8" y="124" width="200" height="88" fill="{FILL}"/>
  <text x="20" y="146" font-size="12" font-weight="700" fill="{INK}">手元の機器（Ledger）</text>
  <text x="20" y="164" font-size="10.5" fill="{INK2}">4行を表示し、長押しで署名</text>
  <text x="20" y="180" font-size="10.5" fill="{INK2}">鍵は外に出ない</text>
  <text x="20" y="198" font-size="10.5" fill="{INK3}">bridge（127.0.0.1・USB HID）</text>

  <rect x="8" y="230" width="200" height="66" fill="{FILL}"/>
  <text x="20" y="252" font-size="12" font-weight="700" fill="{INK}">本人の画面・スマホ</text>
  <text x="20" y="270" font-size="10.5" fill="{INK2}">灯の空／系譜（読むだけ）</text>
  <text x="20" y="286" font-size="10.5" fill="{INK2}">World App で1回だけ名乗る</text>

  <rect x="248" y="40" width="200" height="256" fill="{ACC}"/>
  <text x="262" y="64" font-size="13" font-weight="700" fill="#ffffff">Broker（門）</text>
  <text x="262" y="82" font-size="10" fill="#ffffff" opacity="0.75">鍵を預からない。判断を作らない</text>
  <text x="262" y="112" font-size="11" fill="#ffffff">① 2つの署名を検証する</text>
  <text x="262" y="136" font-size="11" fill="#ffffff">② 範囲と回数を照合する</text>
  <text x="262" y="160" font-size="11" fill="#ffffff">③ 重さを 0G に聞く</text>
  <text x="262" y="184" font-size="11" fill="#ffffff">④ 通す／押させる／止める</text>
  <text x="262" y="208" font-size="11" fill="#ffffff">⑤ 系譜に追記する（消す口なし）</text>
  <text x="262" y="232" font-size="11" fill="#ffffff">⑥ 灯を (スキル, 版) に積む</text>
  <text x="262" y="262" font-size="10" fill="#ffffff" opacity="0.75">唯一の信頼点。TEE には載せていない</text>
  <text x="262" y="280" font-size="10" fill="#ffffff" opacity="0.75">（黙って良く見せない）</text>

  <rect x="488" y="40" width="264" height="56" fill="{FILL}"/>
  <text x="500" y="60" font-size="12" font-weight="700" fill="{INK}">0G Private Computer（TeeML）</text>
  <text x="500" y="78" font-size="10.5" fill="{INK2}">重さを決める。本文は封印の中。我々も読めない</text>

  <rect x="488" y="110" width="264" height="56" fill="{FILL}"/>
  <text x="500" y="130" font-size="12" font-weight="700" fill="{INK}">World（Agent Pass）</text>
  <text x="500" y="148" font-size="10.5" fill="{INK2}">人であることだけ。仮名（sub）を返す</text>

  <rect x="488" y="180" width="264" height="56" fill="{FILL}"/>
  <text x="500" y="200" font-size="12" font-weight="700" fill="{INK}">相手の API</text>
  <text x="500" y="218" font-size="10.5" fill="{INK2}">代理で叩く先（api.stripe.com など）</text>

  <rect x="488" y="250" width="264" height="56" fill="{FILL}"/>
  <text x="500" y="270" font-size="12" font-weight="700" fill="{INK}">0G Storage（系譜）</text>
  <text x="500" y="288" font-size="10.5" fill="{INK2}">誰が許し、何を要求し、通ったか止まったか</text>

  <defs><marker id="c" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="{INK}"/></marker></defs>
  <line x1="208" y1="73" x2="240" y2="73" stroke="{INK}" marker-end="url(#c)"/>
  <text x="224" y="64" text-anchor="middle" font-size="9.5" fill="{INK2}">要求</text>
  <line x1="240" y1="168" x2="210" y2="168" stroke="{INK}" marker-end="url(#c)"/>
  <text x="224" y="159" text-anchor="middle" font-size="9.5" fill="{INK2}">4行</text>
  <line x1="208" y1="186" x2="240" y2="186" stroke="{INK}" marker-end="url(#c)"/>
  <text x="224" y="202" text-anchor="middle" font-size="9.5" fill="{INK2}">署名</text>
  <line x1="208" y1="262" x2="240" y2="262" stroke="{INK}" marker-end="url(#c)"/>
  <text x="224" y="253" text-anchor="middle" font-size="9.5" fill="{INK2}">灯・系譜</text>

  <line x1="448" y1="68" x2="480" y2="68" stroke="{INK}" marker-end="url(#c)"/>
  <text x="464" y="59" text-anchor="middle" font-size="9.5" fill="{INK2}">本文</text>
  <line x1="448" y1="138" x2="480" y2="138" stroke="{INK}" marker-end="url(#c)"/>
  <text x="464" y="129" text-anchor="middle" font-size="9.5" fill="{INK2}">名乗り</text>
  <line x1="448" y1="208" x2="480" y2="208" stroke="{INK}" marker-end="url(#c)"/>
  <text x="464" y="199" text-anchor="middle" font-size="9.5" fill="{INK2}">代理実行</text>
  <line x1="448" y1="278" x2="480" y2="278" stroke="{INK}" marker-end="url(#c)"/>
  <text x="464" y="269" text-anchor="middle" font-size="9.5" fill="{INK2}">追記</text>

  <line x1="0" y1="330" x2="760" y2="330" stroke="{HAIR}"/>
  <text x="8" y="352" font-size="11" font-weight="700" fill="{INK}">この線を、絶対に越えないもの</text>
  <text x="8" y="374" font-size="10.5" fill="{INK2}">鍵の平文 — 手元の機器から出ない。Broker も 0G も、エージェントも受け取らない</text>
  <text x="8" y="392" font-size="10.5" fill="{INK2}">要求の本文 — 0G の封印の中だけ。系譜にも、我々のログにも入れない</text>
  <text x="8" y="410" font-size="10.5" fill="{INK2}">本人の身元 — World は仮名（sub）しか返さない。氏名・メール・ウォレットは要らない</text>
  <text x="8" y="428" font-size="10.5" fill="{INK2}">資金 — 預からない。TOMOSHIBI の中で金が動く経路は存在しない</text>
  <text x="8" y="452" font-size="10.5" fill="{INK3}">※ 0G に届かないとき、Broker は判断を作らずに STOPPED を返す（既定値を置かない）</text>
</svg>
'''

def build():
    head = (HERE / '2026-11-06-touchpoints.html').read_text().split('<body>')[0]
    head = re.sub(r'<title>.*?</title>', '<title>TOMOSHIBI — アーキテクチャとシーケンス</title>', head, flags=re.S)
    parts = [head, '<body>\n<div class="page">\n']
    parts.append('''
<header class="doc-header">
  <p class="eyebrow">TOMOSHIBI ／ 図 ／ 2026-11-06</p>
  <h1>アーキテクチャと、5つの流れ</h1>
  <p class="lead">文章で書いた設計（入出力・画面遷移・市場）を、<b>線と順番</b>にした。<b>通る・押させる・止める・決めない・灯をともす</b>の5本。図は手で描かず <span class="mono">ideation/build-diagrams.py</span> から生成している（流れを直したらスクリプトを直す）。</p>
  <div class="doc-meta"><span>2026-11-06</span><span>kou</span><span>実装: broker/src/server.js ・ bridge/bridge.py</span></div>
</header>

<section>
  <h2>エグゼクティブサマリー</h2>
  <ol class="summary">
    <li><b>門はひとつ、答えは4つ。</b>通した／押されるまで通さない／止めた／決められないので止めた。<b>5つ目の答えを作らない</b>ことが設計の芯。</li>
    <li><b>鍵と本文は、門を越えない。</b>鍵は手元の機器から出ず、要求の本文は 0G の封印の中だけ。<b>Broker は中身を読まずに重さを受け取る</b>。</li>
    <li><b>人が出てくるのは2か所だけ。</b>重い要求の長押しと、灯をともす1回の名乗り。<b>ふだんの流れに人は登場しない</b>（図01に人がいないことが答え）。</li>
  </ol>
</section>

<section>
  <h2><span class="no">01</span>アーキテクチャ</h2>
  <p class="msg"><b>左が手元、真ん中が門、右が「信じなくてよい相手」。</b>信頼が要るのは真ん中の1点だけで、そこに何も預けない。</p>
  <figure>
    <figcaption>図表1　構成と、境界を越えるもの／越えないもの</figcaption>
''' + ARCH + '''
    <p class="src">出所: <span class="mono">broker/src/server.js</span>（口の一覧）・<span class="mono">bridge/bridge.py</span>（USB HID・127.0.0.1）・<span class="mono">spec/permit-signature.md</span>（署名の契約）。</p>
  </figure>
</section>
''')
    for i, s in enumerate(SEQUENCES, start=2):
        parts.append(f'''
<section>
  <h2><span class="no">{i:02d}</span>流れ{s["no"]} — {esc(s["title"])}</h2>
  <p class="msg">{s["msg"]}</p>
  <figure>
    <figcaption>図表{i}　{esc(s["title"])}（返り: <span class="mono">{esc(s["verdict"])}</span>）</figcaption>
    <div class="fig-scroll">{seq_svg(s["actors"], s["steps"])}</div>
  </figure>
</section>
''')
    parts.append('''
<section>
  <h2><span class="no">07</span>版が上がると、灯は消える</h2>
  <p class="msg"><b>これは障害ではなく仕様。</b>消えるから、<b>いま使われているか</b>が分かる。</p>
  <div class="fig-scroll"><div class="chevrons">
    <div class="chev">v1.0.0 に灯が42<small>積み上がる</small></div>
    <div class="chev on">作り手が v1.1.0 を出す<small>(スキル, 版) が変わる</small></div>
    <div class="chev on">42の灯が一斉に消える<small>前の版に42あった事実は残る</small></div>
    <div class="chev">使い続けている人が出し直す<small>World で1回</small></div>
    <div class="chev">新しい灯が積み上がる<small>いまの版の事実</small></div>
  </div></div>
  <p class="note"><b>買う側（P3）にとっての意味。</b>灯が0なら「新しい版で、まだ誰も使っていない」。<b>古い評価を新しいと勘違いしない</b>ための仕掛けで、作り手への罰ではない。</p>
</section>

<section>
  <h2><span class="no">08</span>次のアクション</h2>
  <div class="tbl"><table>
    <thead><tr><th>やること</th><th style="width:96px">誰</th><th style="width:120px">いつまで</th></tr></thead>
    <tbody>
      <tr><td>図02（重い要求）の⑤〜⑦を<b>実機で通して、同じ順番か確かめる</b></td><td>kou・minta</td><td>撮影前</td></tr>
      <tr><td>図05（World）を本物のクライアント登録で1回通す</td><td>kou</td><td>11/6 中</td></tr>
      <tr><td>動画は図01 →図02 →図03 の順で見せる（止まり方が主役）</td><td>minta</td><td>11/6 22:00 IST</td></tr>
    </tbody>
  </table></div>
</section>

<footer class="doc-footer">
  <span>TOMOSHIBI — アーキテクチャとシーケンス（2026-11-06）</span>
  <span>生成: ideation/build-diagrams.py ／ 関連: actors-io.html ・ screen-flow.html</span>
</footer>

</div>
</body>
</html>
''')
    out = HERE / '2026-11-06-diagrams.html'
    out.write_text(''.join(parts))
    print(f'wrote {out} ({out.stat().st_size} bytes)')

if __name__ == '__main__':
    build()
