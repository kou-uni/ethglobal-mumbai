#!/usr/bin/env python3
"""Build the two load-bearing figures in both languages from one source, so they cannot drift.

    python3 assets/build-figures.py        # writes nat / sequence / trust, both languages

The repo is written in English, so only the English figures are committed (assets/nat.svg,
assets/sequence.svg, assets/trust.svg). The Japanese copies are written one directory above the repo and are
for reading, not for the submission.
"""
import pathlib

OUT = pathlib.Path(__file__).parent

T = {
 'en': {
  'font': 'Figtree, Helvetica, Arial, sans-serif',
  'nat_title': 'TOMOSHIBI — the switchboard between your agents and your keys',
  'nat_sub': 'Your tools call by label. TOMOSHIBI puts the call through to the real service — or puts it to you first, when it is heavy.',
  'inside': 'INSIDE THIS LAPTOP',
  'outside': 'OUTSIDE · OVER THE NETWORK',
  'cloud': [('0G PRIVATE COMPUTER', ['weighs every request before it runs:', 'routine · significant · decisive.', 'Its operator cannot read the body']),
            ('0G STORAGE', ['where the trail is sealed — the lineage', 'of one version of one tool']),
            ('WORLD ID', ['one person, once. The only way a star', 'is lit, and the holder\'s address is', 'never written into it']),
            ('THE REAL SERVICES', ['api.anthropic.com · api.stripe.com', 'api.resend.com'])],
  'ledger_where': 'hardware, in your hand — not in the laptop, and not in the cloud',
  'flow_hint': 'One call, moving through the same figure. It loops. Step 4, in orange, is the only one a person is in — and most calls never reach it.',
  'box': 'TOMOSHIBI · the switchboard, on the laptop',
  'box_sub': 'two parts: the page you look at, and the broker that holds this table',
  'box_foot': 'What leaves this laptop: the request itself, its weight, and the trail. Never the right column.',
  'tools': [('Claude Code, on this PC', 'calls: model-main'),
            ('the tool you are building', 'calls: stripe-live'),
            ('a tool you handed out', 'calls: resend-tx')],
  'thead': ('LABEL', 'WHAT IT MAY DO', 'THE REAL KEY'),
  'rows': [('model-main', 'api.anthropic.com · POST /v1/messages · 2,000 calls', 'sk-ant-••••'),
           ('stripe-live', 'api.stripe.com · * /v1 · 20 calls · 7 days', 'sk_live_••••'),
           ('resend-tx', 'api.resend.com · POST /emails · 50 calls', 're_••••')],
  'keynote': 'The right column is never printed, never logged, and never returned to a tool.',
  'ledger': 'THE LEDGER · plugged into the same laptop',
  'ledger_l1': 'The only thing that can add a row,',
  'ledger_l2': 'and the only thing that can approve a heavy crossing.',
  'map_title': 'If you know NAT, it is that',
  'map': [('a private address, 10.x', 'a label — meaningless anywhere else'),
          ('the public address', 'the real API key'),
          ('the NAT box', 'the Broker, on the laptop'),
          ('the translation table', 'label → range → secret'),
          ('the firewall rules', 'the signed permit: target, operation, count, expiry'),
          ('nothing gets in by itself', 'no label works without a signature that is still good'),
          ('the administrator', 'the Ledger. Not a password, and not the agent')],
  'who_title': 'Who it is for',
  'who': ['You build with Claude Code on this laptop. Shipping anything means',
          'collecting keys first — the model API itself, Stripe, mail — and the',
          'pile grows as you go. Hand a tool to someone and you are carrying',
          'their usage on your key. TOMOSHIBI is where those keys live: every',
          'tool is given a label, each label keeps a history, and only the heavy',
          'calls reach your hand.'],
  'seq_title': 'One outbound call, end to end',
  'seq_sub': 'Read down. Each refusal is a terminal answer — nothing is held open while it waits.',
  'actors': ['THE TOOL', 'TOMOSHIBI', '0G PRIVATE COMPUTER', 'THE LEDGER', 'THE REAL SERVICE'],
  'steps': [
    (0, 1, 'POST /use — the label, and what it wants to do', ''),
    (1, 1, 'look up the row · check the range', 'no row, or outside it → DENIED, recorded. 0G is never asked'),
    (1, 2, 'the four lines + the body of the request', ''),
    (2, 1, 'routine · significant · decisive', 'no answer → STOPPED. There is no fallback judgement'),
    (1, 0, 'NEEDS_PRESS — come back with a signature for this one call', 'only when it came back heavy'),
    (0, 3, 'over 127.0.0.1 — the four lines', 'TOMOSHIBI cannot reach the device. The tool carries it'),
    (3, 0, 'the signature, after a long press', 'or she does not press, and it simply never happens'),
    (0, 1, 'the same request again, on a permit good for one call', 'every check runs again, 0G included'),
    (1, 1, 'reserve one call of the count', 'nothing left → DENIED · EXHAUSTED'),
    (1, 4, 'the label is swapped for the key — here, and only here', ''),
    (4, 1, 'the result', ''),
    (1, 0, 'the result, and a hash of it. Never the key', ''),
    (1, 1, 'append to the trail → 0G Storage', 'allowed and refused, in the same place'),
  ],
  'tr_title': 'What the switchboard leaves behind',
  'tr_sub': 'Every call is a row. The rows are a lineage. A lineage is the only thing a person can vouch for.',
  'tr_cards': [('the call happened', 'on a permit this person signed,', 'inside a range they set themselves'),
               ('the heavy ones were pressed', '0G called it decisive, and the Ledger in', 'their hand said yes — or it never ran'),
               ('the thread is sealed', '0G Storage. The lineage of this version,', 'and nobody can go back and tidy it'),
               ('one person, once', 'World ID. A star they can light only for', 'a version they actually used')],
  'tr_why_t': 'Why the number means something here',
  'tr_why': ['A star count means nothing when anyone can make a star.',
             'Here one star costs a real key, a range signed on a device,',
             'calls actually spent, and a human who can only do it once.',
             'So it is not a review count. It is a lineage of real use with a',
             'person at the end of it — the first thing in this market you',
             'can check instead of believe.'],
  'tr_keep_t': 'And what is never kept',
  'tr_keep': ['The key is never given to a tool.',
              'The body of a request is weighed',
              'and kept nowhere.',
              'The holder\'s address is never',
              'written into a star.',
              'Nothing is asked of the person on',
              'an ordinary call. Only the heavy',
              'ones reach their hand.'],
  'tr_foot': 'When the version changes, the stars go out. Nobody inherits a reputation from code they did not run.',
  'order_title': 'The order of one call',
  'order': ['a tool calls, with a label — never a key',
            'the row is found and the range checked · outside it → DENIED, recorded',
            '0G weighs it: routine · significant · decisive · no answer → STOPPED',
            'heavy? the tool fetches a signature from the Ledger over 127.0.0.1 — good for one call',
            'one call of the count is reserved, the label is swapped for the key, and it is sent',
            'the result comes back to the tool, with a hash of it. Never the key',
            'the row is appended, and the thread sealed into 0G Storage',
            'afterwards: World ID, one person once — a star on this version'],
 },
 'ja': {
  'font': 'Hiragino Sans, Hiragino Kaku Gothic ProN, Helvetica, sans-serif',
  'nat_title': '灯火 — エージェントとキーのあいだの交換台',
  'nat_sub': '道具はラベルで呼ぶ。灯火が本物のサービスにつなぐ。重いときは、先に人につなぐ。',
  'inside': 'このノートパソコンの中',
  'outside': '外側 · ネットワークの向こう',
  'cloud': [('0G Private Computer', ['走る前に、要求の重さを測る。', 'routine・significant・decisive。', '運用者にも本文は読めない']),
            ('0G Storage', ['台帳が封じられる場所。道具の', '1バージョンぶんの系譜']),
            ('World ID', ['一人の人間が、一度だけ。星に灯が', 'ともる唯一の道。保有者の', 'アドレスは書かない']),
            ('本物のサービス', ['api.anthropic.com · api.stripe.com', 'api.resend.com'])],
  'ledger_where': '手元のハードウェア — パソコンの中でも、クラウドでもない',
  'flow_hint': '同じ図の上を、1回の呼び出しが通っていく。橙の段だけが、人のいる段。クリックで停まる。',
  'box': '灯火 · 交換台（ノートパソコンの中）',
  'box_sub': '2つからなる：人が見る画面と、この表を持つ Broker',
  'box_foot': 'このパソコンを出るのは、要求そのものと、その重さと、台帳。右の列は出ない。',
  'tools': [('この PC の Claude Code', '呼ぶのは model-main'),
            ('いま作っている道具', '呼ぶのは stripe-live'),
            ('誰かに配った道具', '呼ぶのは resend-tx')],
  'thead': ('ラベル', '許す範囲', '本物のキー'),
  'rows': [('model-main', 'api.anthropic.com · POST /v1/messages · 2,000回', 'sk-ant-••••'),
           ('stripe-live', 'api.stripe.com · * /v1 · 20回 · 7日', 'sk_live_••••'),
           ('resend-tx', 'api.resend.com · POST /emails · 50回', 're_••••')],
  'keynote': '右の列は、表示もログも道具への返却も、一度もしない。',
  'ledger': 'Ledger · 同じノートパソコンに挿さっている',
  'ledger_l1': '表に1行を足せる唯一のもので、',
  'ledger_l2': '重い越境を許可できる唯一のもの。',
  'map_title': 'NAT を知っているなら、それ',
  'map': [('プライベートアドレス 10.x', 'ラベル — 外では何の意味も持たない'),
          ('グローバルアドレス', '本物のAPIキー'),
          ('NAT の箱', 'ノートパソコンの中の Broker'),
          ('変換表', 'ラベル → 範囲 → 秘密'),
          ('ファイアウォールの規則', '署名された許可：宛先・操作・回数・期限'),
          ('外からは勝手に入れない', '有効な署名が無ければ、どのラベルも効かない'),
          ('管理者', 'Ledger。パスワードでも、エージェントでもない')],
  'who_title': '誰のためのものか',
  'who': ['このノートパソコンで Claude Code を使って物を作っている人。',
          '何かを出すたびにキーが増える。モデルの API そのもの、Stripe、メール。',
          'さらに道具を誰かに配れば、その人の利用を自分のキーで背負う。',
          '灯火はそのキーの置き場。自分の道具も他人の道具もラベルだけを持ち、',
          'ラベルごとに履歴が残り、重い呼び出しだけが手元に来る。'],
  'seq_title': '外へ出る1回の呼び出し、最初から最後まで',
  'seq_sub': '上から下へ。どの拒否も、そこで終わる答え。待っている間に何かを開いたままにはしない。',
  'actors': ['道具', '灯火', '0G Private Computer', 'Ledger', '本物のサービス'],
  'steps': [
    (0, 1, 'POST /use — ラベルと、やりたいこと', ''),
    (1, 1, '表の行を引く · 範囲を確かめる', '行が無い／範囲の外 → DENIED・記録。0G には一切聞かない'),
    (1, 2, '4行と、要求の本文', ''),
    (2, 1, 'routine · significant · decisive', '答えが無い → STOPPED。代替の判断は作らない'),
    (1, 0, 'NEEDS_PRESS — この1回ぶんの署名を取ってこい', '重いと返ってきたときだけ'),
    (0, 3, '127.0.0.1 経由 — 4行を渡す', '灯火から端末へは届かない。運ぶのは道具'),
    (3, 0, '長押しのあとの署名', '押さなければ、それは起きないだけ'),
    (0, 1, '同じ要求を、1回だけ有効な許可で出し直す', '検査は全部もう一度。0G も含めて'),
    (1, 1, '回数を1つ確保する', '残りが無ければ DENIED · EXHAUSTED'),
    (1, 4, 'ここで、ここだけで、ラベルがキーに入れ替わる', ''),
    (4, 1, '結果', ''),
    (1, 0, '結果と、そのハッシュ。キーは返さない', ''),
    (1, 1, '台帳に追記 → 0G Storage', '許可も拒否も、同じ場所に'),
  ],
  'tr_title': '交換台が、あとに残すもの',
  'tr_sub': '呼び出しは1行になる。行は系譜になる。人が保証できるのは、系譜だけ。',
  'tr_cards': [('使われた、という事実', '本人が署名した許可の上で、', '本人が決めた範囲の中で'),
               ('重いものは、押された', '0G が decisive と言い、手元の Ledger', 'がはいと言った。でなければ走っていない'),
               ('履歴が封じられる', '0G Storage。このバージョンの系譜で、', 'あとから整え直せない'),
               ('一人の人間が、一度だけ', 'World ID。実際に使ったバージョンに', 'しか灯をともせない')],
  'tr_why_t': 'ここでは、なぜ数に意味があるのか',
  'tr_why': ['誰でも星を作れるなら、星の数には何の意味もない。',
             'ここで星1つに要るのは、本物のキー、端末で署名した範囲、',
             '実際に使った回数、そして一度しか押せない人間が一人。',
             'だからこれはレビュー件数ではなく、実際の利用の系譜で、',
             'その端に人がいる。この市場で初めて、信じるのではなく',
             '確かめられるもの。'],
  'tr_keep_t': '逆に、残さないもの',
  'tr_keep': ['キーを道具に渡すことはない。',
              '要求の本文は、重さを測るだけで',
              'どこにも残さない。',
              '星に保有者のアドレスは書かない。',
              '普通の呼び出しでは、人に何も',
              '聞かない。重いものだけが',
              '手元に来る。'],
  'tr_foot': 'バージョンが変われば、灯は消える。走らせていないコードの評判を、誰も引き継げない。',
  'order_title': '1回の呼び出しの順番',
  'order': ['道具がラベルで呼ぶ。キーは持たない',
            '行を引き、範囲を確かめる。外なら DENIED・記録',
            '0G が重さを測る：routine・significant・decisive。答えが無ければ STOPPED',
            '重い？ 道具が 127.0.0.1 で Ledger の署名を取ってくる（1回ぶん）',
            '回数を１つ確保し、ラベルをキーに入れ替えて送る',
            '結果とそのハッシュが道具に返る。キーは返らない',
            '台帳に1行追記し、0G Storage に封じる',
            'あとで：World ID で一人一度 — このバージョンに灯'],
 },
}

CSS = """
    .card{{fill:#fff;stroke:#1b1630;stroke-width:2.5}}
    .h{{font-size:21px;font-weight:600;fill:#1b1630}}
    .k{{font-size:14px;font-weight:600;letter-spacing:.08em;fill:#8b8498}}
    .t{{font-size:17px;fill:#4a4357}}
    .m{{font-size:16px;fill:#4a4357}}
    .key{{font-size:16px;fill:#8f1d14;font-weight:600}}
    .ttl{{font-size:30px;font-weight:600;fill:#1b1630}}
    .sub{{font-size:19px;fill:#6b6478}}
    .num{{font-size:16px;font-weight:600;fill:#fff}}
    .lab{{font-size:16px;fill:#1b1630}}
    .note{{font-size:15px;fill:#8f1d14}}
"""

HEAD = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" font-family="{font}">
  <defs>
    <marker id="a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 10 5 0 10z" fill="#1b1630"/></marker>
    <marker id="af" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 10 5 0 10z" fill="#f2600c"/></marker>
  </defs>
  <style>{css}</style>
  <rect width="{w}" height="{h}" fill="#F3EEE6"/>
'''

def esc(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')

BADGE_XY = {}


def badge(n, cx, cy, fill='#1b1630', bid=''):
    BADGE_XY[n] = (cx, cy)
    i = f' id="{bid}"' if bid else ''
    return (f'<g{i}><circle cx="{cx}" cy="{cy}" r="14" fill="{fill}"/>'
            f'<text class="num" x="{cx}" y="{cy+5}" text-anchor="middle">{n}</text></g>')


def nat(L):
    """Everyone who touches a call, and which side of the laptop they are on."""
    w, h = 1680, 1180
    o = [HEAD.format(w=w, h=h, font=L['font'], css=CSS.format())]
    a = o.append
    a(f'<text class="ttl" x="60" y="54">{esc(L["nat_title"])}</text>')
    a(f'<text class="sub" x="60" y="88">{esc(L["nat_sub"])}</text>')

    # the Ledger: neither of the two zones. A thing in a hand.
    a('<rect x="390" y="108" width="750" height="84" rx="16" fill="#FFF4EA" stroke="#f2600c" stroke-width="2.5"/>')
    a(f'<text class="k" x="414" y="138" fill="#c2410c">{esc(L["ledger"])}</text>')
    a(f'<text class="m" x="414" y="172">{esc(L["ledger_where"])}</text>')

    # zone 1 — the laptop
    a('<rect x="40" y="200" width="1120" height="545" rx="22" fill="#fffdf8" stroke="#1b1630" stroke-width="2.5" stroke-dasharray="10 8"/>')
    a(f'<text class="k" x="64" y="234">{esc(L["inside"])}</text>')
    # drawn after the zone, or the zone's fill paints over it
    a('<path d="M765 192 L765 246" stroke="#f2600c" stroke-width="2.5" marker-end="url(#af)"/>')
    a(badge(4, 765, 219, '#f2600c', 'b4'))
    for i, (t1, t2) in enumerate(L['tools']):
        y = 290 + i * 104
        a(f'<rect class="card" x="64" y="{y}" width="280" height="84" rx="14"/>')
        a(f'<text class="h" x="86" y="{y+34}" font-size="19">{esc(t1)}</text>')
        a(f'<text class="m" x="86" y="{y+64}">{esc(t2)}</text>')
        a(f'<path d="M344 {y+42} L386 {y+42}" stroke="#1b1630" stroke-width="2.5" marker-end="url(#a)"/>')
        if i == 1:
            a(badge(1, 365, y + 42, bid='b1'))

    a('<rect class="card" x="390" y="250" width="750" height="470" rx="18"/>')
    a(f'<text class="h" x="414" y="288">{esc(L["box"])}</text>')
    a(f'<text class="m" x="414" y="316">{esc(L["box_sub"])}</text>')
    th = L['thead']
    a(f'<text class="k" x="450" y="360">{esc(th[0])}</text>')
    a(f'<text class="k" x="590" y="360">{esc(th[1])}</text>')
    a(f'<text class="k" x="1010" y="360">{esc(th[2])}</text>')
    a('<path d="M414 374 L1116 374" stroke="#d8d2c6" stroke-width="2"/>')
    a(badge(2, 424, 358, bid='b2'))
    for i, (lab, rng, key) in enumerate(L['rows']):
        y = 412 + i * 52
        a(f'<text class="lab" x="450" y="{y}">{esc(lab)}</text>')
        a(f'<text class="m" x="590" y="{y}">{esc(rng)}</text>')
        a(f'<text class="key" x="1010" y="{y}">{esc(key)}</text>')
    a('<path d="M980 386 L980 588" stroke="#8f1d14" stroke-width="2.5" stroke-dasharray="7 6"/>')
    a(f'<text class="note" x="414" y="620">{esc(L["keynote"])}</text>')
    a(f'<text class="m" x="414" y="672">{esc(L["box_foot"])}</text>')

    # zone 2 — everything that is somewhere else
    a(f'<text class="k" x="1200" y="234">{esc(L["outside"])}</text>')
    for i, (title, lines) in enumerate(L['cloud']):
        y = 250 + i * 122
        a(f'<rect class="card" x="1200" y="{y}" width="440" height="116" rx="14" style="fill:#fffdf8"/>')
        a(f'<text class="k" x="1222" y="{y+30}">{esc(title)}</text>')
        for j, line in enumerate(lines):
            a(f'<text class="m" x="1222" y="{y+56 + j * 22}">{esc(line)}</text>')
        n, both = ((3, True), (7, False), (8, False), (5, True))[i]
        start = ' marker-start="url(#a)"' if both else ''
        a(f'<path d="M1146 {y+56} L1196 {y+56}" stroke="#1b1630" stroke-width="2.5" marker-end="url(#a)"{start}/>')
        a(badge(n, 1171, y + 32, bid=f'b{n}'))
        if i == 3:  # the answer comes back the same way
            a(badge(6, 1171, y + 80, bid='b6'))

    # the order, as numbered on the figure
    a(f'<text class="k" x="60" y="790">{esc(L["order_title"])}</text>')
    a('<rect class="card" x="60" y="810" width="860" height="314" rx="16"/>')
    for i, line in enumerate(L['order']):
        y = 856 + i * 34
        a(f'<g id="o{i + 1}">')
        a(badge(i + 1, 96, y - 6, '#f2600c' if i == 3 else '#1b1630'))
        a(f'<text class="m" x="124" y="{y}">{esc(line)}</text>')
        a('</g>')

    # who it is for
    a(f'<text class="k" x="960" y="790">{esc(L["who_title"])}</text>')
    a('<rect x="960" y="810" width="680" height="314" rx="16" fill="#fffdf8" stroke="#1b1630" stroke-width="2.5" stroke-dasharray="8 7"/>')
    for i, line in enumerate(L['who']):
        a(f'<text class="t" x="984" y="{852 + i * 34}">{esc(line)}</text>')
    a('</svg>')
    return '\n'.join(o)

def sequence(L):
    w, h = 1680, 1180
    xs = [140, 470, 820, 1140, 1480]
    o = [HEAD.format(w=w, h=h, font=L['font'], css=CSS.format())]
    a = o.append
    a(f'<text class="ttl" x="60" y="54">{esc(L["seq_title"])}</text>')
    a(f'<text class="sub" x="60" y="88">{esc(L["seq_sub"])}</text>')
    top, bottom = 150, 1130
    for x, name in zip(xs, L['actors']):
        a(f'<rect class="card" x="{x-130}" y="{top}" width="260" height="62" rx="14" fill="#fffdf8"/>')
        a(f'<text class="k" x="{x}" y="{top+38}" text-anchor="middle">{esc(name)}</text>')
        a(f'<path d="M{x} {top+62} L{x} {bottom}" stroke="#b9b3a6" stroke-width="2" stroke-dasharray="6 7"/>')
    y = top + 112
    for i, (frm, to, text, note) in enumerate(L['steps']):
        n = i + 1
        if frm == to:  # something it does to itself
            x = xs[frm]
            a(f'<path d="M{x} {y-14} L{x+70} {y-14} L{x+70} {y+18} L{x+6} {y+18}" stroke="#1b1630" stroke-width="2.5" fill="none" marker-end="url(#a)"/>')
            tx, anchor = x + 86, 'start'
        else:
            x1, x2 = xs[frm], xs[to]
            colour = '#f2600c' if (frm == 3 or to == 3) else '#1b1630'
            mark = 'af' if colour == '#f2600c' else 'a'
            a(f'<path d="M{x1} {y} L{x2 + (-10 if x2 > x1 else 10)} {y}" stroke="{colour}" stroke-width="2.5" marker-end="url(#{mark})"/>')
            tx, anchor = (x1 + x2) / 2, 'middle'
        a(f'<circle cx="80" cy="{y}" r="15" fill="#1b1630"/><text class="num" x="80" y="{y+5}" text-anchor="middle">{n}</text>')
        a(f'<text class="t" x="{tx}" y="{y-12}" text-anchor="{anchor}">{esc(text)}</text>')
        if note:
            a(f'<text class="note" x="{tx}" y="{y+34 if frm == to else y+22}" text-anchor="{anchor}">{esc(note)}</text>')
        y += 76 if note else 62
    a('</svg>')
    return '\n'.join(o)

def trust(L):
    w, h = 1680, 860
    o = [HEAD.format(w=w, h=h, font=L['font'], css=CSS.format())]
    a = o.append
    a(f'<text class="ttl" x="60" y="54">{esc(L["tr_title"])}</text>')
    a(f'<text class="sub" x="60" y="88">{esc(L["tr_sub"])}</text>')

    for i, (title, l1, l2) in enumerate(L['tr_cards']):
        x = 60 + i * 393
        # a class rule beats a presentation attribute in SVG, so the highlight goes in style=
        a(f'<rect class="card" x="{x}" y="150" width="350" height="186" rx="16" style="fill:{"#ffd0ad" if i == 3 else "#fffdf8"}"/>')
        a(f'<circle cx="{x+34}" cy="190" r="17" fill="#1b1630"/>')
        a(f'<text class="num" x="{x+34}" y="196" text-anchor="middle">{i+1}</text>')
        a(f'<text class="h" x="{x+24}" y="256">{esc(title)}</text>')
        a(f'<text class="m" x="{x+24}" y="290">{esc(l1)}</text>')
        a(f'<text class="m" x="{x+24}" y="316">{esc(l2)}</text>')
        if i < 3:
            a(f'<path d="M{x+350} 243 L{x+387} 243" stroke="#1b1630" stroke-width="2.5" marker-end="url(#a)"/>')

    a(f'<text class="k" x="60" y="396">{esc(L["tr_why_t"])}</text>')
    a('<rect class="card" x="60" y="416" width="960" height="264" rx="16" fill="#fffdf8"/>')
    for i, line in enumerate(L['tr_why']):
        a(f'<text class="t" x="84" y="{460 + i * 36}">{esc(line)}</text>')

    a(f'<text class="k" x="1060" y="396">{esc(L["tr_keep_t"])}</text>')
    a('<rect x="1060" y="416" width="560" height="264" rx="16" fill="#fffdf8" stroke="#8f1d14" stroke-width="2.5" stroke-dasharray="8 7"/>')
    for i, line in enumerate(L['tr_keep']):
        a(f'<text class="t" x="1084" y="{456 + i * 30}">{esc(line)}</text>')

    a('<rect x="60" y="716" width="1560" height="88" rx="16" fill="#FFF4EA" stroke="#f2600c" stroke-width="2.5"/>')
    a(f'<text class="t" x="84" y="768">{esc(L["tr_foot"])}</text>')
    a('</svg>')
    return '\n'.join(o)


# One call, moving. Straight segments between the coordinates the figure is
# already drawn with, so the dot cannot drift off it. Plain SMIL, no script:
# it animates in a browser, in an <img>, and in a screenshot of either.
LEGS = [
    (1, [(344, 436), (470, 436)], 900),
    (2, [(470, 436), (424, 358)], 700),
    (3, [(424, 358), (1146, 306), (1420, 306)], 1500),
    (0, [(1420, 306), (1146, 306), (800, 470)], 1100),
    (4, [(800, 470), (765, 246), (765, 204)], 1200),
    (0, [(765, 204), (765, 246), (800, 470)], 1000),
    (5, [(800, 470), (1146, 672), (1420, 672)], 1500),
    (6, [(1420, 672), (1146, 672), (800, 470)], 1300),
    (7, [(800, 470), (1146, 428), (1420, 428)], 1300),
    (8, [(800, 470), (1146, 550), (1420, 550)], 1300),
    (0, [(800, 470), (800, 470)], 900),
]


def flow(L, svg):
    """The same figure, with one call walking through it."""
    total = sum(d for _, _, d in LEGS) / 1000
    t, o = 0.0, []
    for n, pts, ms in LEGS:
        a, b = t / total, (t + ms / 1000) / total
        t += ms / 1000
        path = 'M' + ' L'.join(f'{x} {y}' for x, y in pts)
        o.append(
            f'<g opacity="0"><circle r="13" fill="#f2600c" stroke="#fff" stroke-width="3"/>'
            f'<animate attributeName="opacity" dur="{total}s" repeatCount="indefinite"'
            f' values="0;0;1;1;0;0" keyTimes="0;{a:.4f};{a:.4f};{b:.4f};{b:.4f};1"/>'
            f'<animateMotion dur="{total}s" repeatCount="indefinite" path="{path}"'
            f' calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;{a:.4f};{b:.4f};1"/></g>')
        if n:  # a ring on the number this leg belongs to, and its line lit in the list
            cx, cy = BADGE_XY[n]
            o.append(
                f'<circle cx="{cx}" cy="{cy}" r="20" fill="none" stroke="#f2600c" stroke-width="3" opacity="0">'
                f'<animate attributeName="opacity" dur="{total}s" repeatCount="indefinite"'
                f' values="0;0;1;1;0;0" keyTimes="0;{a:.4f};{a:.4f};{b:.4f};{b:.4f};1"/></circle>')
            svg = svg.replace(
                f'<g id="o{n}">',
                f'<g id="o{n}" opacity="0.32"><animate attributeName="opacity" dur="{total}s"'
                f' repeatCount="indefinite" values=".32;.32;1;1;.32;.32"'
                f' keyTimes="0;{a:.4f};{a:.4f};{b:.4f};{b:.4f};1"/>')
    return svg.replace('</svg>', ''.join(o) + '</svg>')


PAGE = """<!doctype html>
<meta charset="utf-8">
<title>{title}</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{{margin:0;background:#F3EEE6;font-family:{font};display:grid;place-items:center;min-height:100vh}}
  main{{width:min(100vw,1680px)}}
  svg{{width:100%;height:auto;display:block}}
  p{{font-size:clamp(13px,1.1vw,17px);color:#6b6478;padding:10px 4vw 24px;text-align:center;margin:0}}
</style>
<main>
{svg}
<p>{hint}</p>
</main>
"""


for lang, L in T.items():
    out = OUT if lang == 'en' else OUT.parent.parent
    suffix = '' if lang == 'en' else '-ja'
    svgs = {}
    for name, build in (('nat', nat), ('sequence', sequence), ('trust', trust)):
        path = out / f'{name}{suffix}.svg'
        svgs[name] = build(L)
        path.write_text(svgs[name], encoding='utf-8')
        print('wrote', path)
    moving = flow(L, svgs['nat'])
    (out / f'flow{suffix}.svg').write_text(moving, encoding='utf-8')
    page = (OUT.parent / 'web' / 'flow.html') if lang == 'en' else (out / 'flow-ja.html')
    page.write_text(PAGE.format(title=esc(L['nat_title']), hint=esc(L['flow_hint']),
                                svg=moving, font=L['font']), encoding='utf-8')
    print('wrote', out / f'flow{suffix}.svg', 'and', page)
