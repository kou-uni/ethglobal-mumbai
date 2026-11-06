#!/usr/bin/env python3
"""Build the two load-bearing figures in both languages from one source, so they cannot drift.

    python3 assets/build-figures.py        # writes assets/nat-*.svg and assets/sequence-*.svg

The repo is written in English, so only the English figures are committed (assets/nat.svg,
assets/sequence.svg). The Japanese copies are written one directory above the repo and are
for reading, not for the submission.
"""
import pathlib

OUT = pathlib.Path(__file__).parent

T = {
 'en': {
  'font': 'Figtree, Helvetica, Arial, sans-serif',
  'nat_title': 'TOMOSHIBI is NAT for API keys',
  'nat_sub': 'The tools speak in labels. The real key exists on the far side of one table, and crossing it is the only thing a person is asked about.',
  'inside': 'INSIDE · ONE LAPTOP',
  'outside': 'OUTSIDE · THE REAL SERVICES',
  'box': 'TOMOSHIBI · the table, and the crossing',
  'tools': [('an agent + its skills', 'asks with: stripe-live'),
            ('a tool you wrote', 'asks with: gh-readonly'),
            ('a tool someone else wrote', 'asks with: resend-tx')],
  'thead': ('LABEL', 'WHAT IT MAY DO', 'THE REAL KEY'),
  'rows': [('stripe-live', 'api.stripe.com · * /v1 · 20 calls · 7 days', 'sk_live_••••'),
           ('gh-readonly', 'api.github.com · GET /repos · 200 calls', 'ghp_••••'),
           ('resend-tx', 'api.resend.com · POST /emails · 50 calls', 're_••••')],
  'keynote': 'The right column is never printed, never logged, never returned to a tool, and never shown on a screen.',
  'ledger': 'THE LEDGER · plugged into the same laptop',
  'ledger_l1': 'The only thing that can add a row,',
  'ledger_l2': 'and the only thing that can approve a heavy crossing.',
  'map_title': 'The analogy, line by line',
  'map': [('a private address, 10.x', 'a label — meaningless anywhere else'),
          ('the public address', 'the real API key'),
          ('the NAT box', 'the Broker, on the laptop'),
          ('the translation table', 'label → range → secret'),
          ('the firewall rules', 'the signed permit: target, operation, count, expiry'),
          ('nothing gets in by itself', 'no label works without a signature that is still good'),
          ('the administrator', 'the Ledger. Not a password, and not the agent')],
  'who_title': 'Who it is for',
  'who': ['Someone who builds with APIs and runs a dozen keys at once:',
          'their own tools, other people\'s tools, and an agent that calls both.',
          'Today those keys sit in .env files, in chat history and in CI secrets,',
          'each one good for everything, forever. One table replaces all of it,',
          'and the only thing that interrupts the work is the heavy crossing.'],
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
 },
 'ja': {
  'font': 'Hiragino Sans, Hiragino Kaku Gothic ProN, Helvetica, sans-serif',
  'nat_title': '灯火は、APIキーの NAT',
  'nat_sub': '道具はラベルで話す。本物のキーは表の向こう側にしかなく、そこを越えるときだけ人に尋ねる。',
  'inside': '内側 · ノートパソコン1台',
  'outside': '外側 · 本物のサービス',
  'box': '灯火 · 変換表と、越える場所',
  'tools': [('エージェントとスキル', '要求は stripe-live で'),
            ('自分で書いた道具', '要求は gh-readonly で'),
            ('他人が書いた道具', '要求は resend-tx で')],
  'thead': ('ラベル', '許す範囲', '本物のキー'),
  'rows': [('stripe-live', 'api.stripe.com · * /v1 · 20回 · 7日', 'sk_live_••••'),
           ('gh-readonly', 'api.github.com · GET /repos · 200回', 'ghp_••••'),
           ('resend-tx', 'api.resend.com · POST /emails · 50回', 're_••••')],
  'keynote': '右の列は、表示もログも道具への返却も画面表示も、一度もしない。',
  'ledger': 'Ledger · 同じノートパソコンに挿さっている',
  'ledger_l1': '表に1行を足せる唯一のもので、',
  'ledger_l2': '重い越境を許可できる唯一のもの。',
  'map_title': '対応表',
  'map': [('プライベートアドレス 10.x', 'ラベル — 外では何の意味も持たない'),
          ('グローバルアドレス', '本物のAPIキー'),
          ('NAT の箱', 'ノートパソコンの中の Broker'),
          ('変換表', 'ラベル → 範囲 → 秘密'),
          ('ファイアウォールの規則', '署名された許可：宛先・操作・回数・期限'),
          ('外からは勝手に入れない', '有効な署名が無ければ、どのラベルも効かない'),
          ('管理者', 'Ledger。パスワードでも、エージェントでもない')],
  'who_title': '誰のためのものか',
  'who': ['API を使って物を作り、同時に十数本のキーを抱えている人。',
          '自分の道具、他人の道具、その両方を呼ぶエージェント。',
          'いまそれらは .env とチャット履歴と CI の秘密に散っていて、',
          '1本ずつが「全部・永久に」使える。表1枚がその全部を置き換え、',
          '作業を止めるのは重い越境のときだけになる。'],
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

def nat(L):
    w, h = 1680, 1180
    o = [HEAD.format(w=w, h=h, font=L['font'], css=CSS.format())]
    a = o.append
    a(f'<text class="ttl" x="60" y="54">{esc(L["nat_title"])}</text>')
    a(f'<text class="sub" x="60" y="88">{esc(L["nat_sub"])}</text>')

    # the Ledger, above the table it governs
    a('<rect x="560" y="130" width="700" height="112" rx="16" fill="#FFF4EA" stroke="#f2600c" stroke-width="2.5"/>')
    a(f'<text class="k" x="584" y="164" fill="#c2410c">{esc(L["ledger"])}</text>')
    a(f'<text class="t" x="584" y="196">{esc(L["ledger_l1"])}</text>')
    a(f'<text class="t" x="584" y="222">{esc(L["ledger_l2"])}</text>')
    a('<path d="M910 242 L910 286" stroke="#f2600c" stroke-width="2.5" marker-end="url(#af)"/>')

    # inside
    a(f'<text class="k" x="60" y="320">{esc(L["inside"])}</text>')
    for i, (t1, t2) in enumerate(L['tools']):
        y = 340 + i * 110
        a(f'<rect class="card" x="60" y="{y}" width="340" height="88" rx="14"/>')
        a(f'<text class="h" x="84" y="{y+36}">{esc(t1)}</text>')
        a(f'<text class="m" x="84" y="{y+66}">{esc(t2)}</text>')
        a(f'<path d="M400 {y+44} L476 {y+44}" stroke="#1b1630" stroke-width="2.5" marker-end="url(#a)"/>')

    # the table
    a('<rect class="card" x="480" y="286" width="860" height="382" rx="18" fill="#fffdf8"/>')
    a(f'<text class="h" x="504" y="324">{esc(L["box"])}</text>')
    th = L['thead']
    a(f'<text class="k" x="504" y="368">{esc(th[0])}</text>')
    a(f'<text class="k" x="700" y="368">{esc(th[1])}</text>')
    a(f'<text class="k" x="1150" y="368">{esc(th[2])}</text>')
    a('<path d="M504 382 L1316 382" stroke="#d8d2c6" stroke-width="2"/>')
    for i, (lab, rng, key) in enumerate(L['rows']):
        y = 418 + i * 52
        a(f'<text class="lab" x="504" y="{y}">{esc(lab)}</text>')
        a(f'<text class="m" x="700" y="{y}">{esc(rng)}</text>')
        a(f'<text class="key" x="1150" y="{y}">{esc(key)}</text>')
    a('<path d="M1120 392 L1120 594" stroke="#8f1d14" stroke-width="2.5" stroke-dasharray="7 6"/>')
    a(f'<text class="note" x="504" y="624">{esc(L["keynote"])}</text>')

    # outside
    a(f'<text class="k" x="1400" y="320">{esc(L["outside"])}</text>')
    for i, host in enumerate(['api.stripe.com', 'api.github.com', 'api.resend.com']):
        y = 340 + i * 110
        a(f'<rect class="card" x="1400" y="{y}" width="220" height="88" rx="14"/>')
        a(f'<text class="lab" x="1424" y="{y+52}">{esc(host)}</text>')
        a(f'<path d="M1340 {y+44} L1396 {y+44}" stroke="#1b1630" stroke-width="2.5" marker-end="url(#a)"/>')

    # the analogy
    a(f'<text class="k" x="60" y="740">{esc(L["map_title"])}</text>')
    a('<rect class="card" x="60" y="760" width="860" height="364" rx="16" fill="#fffdf8"/>')
    a('<text class="k" x="84" y="794">NAT</text>')
    a('<text class="k" x="470" y="794">TOMOSHIBI</text>')
    a('<path d="M84 808 L896 808" stroke="#d8d2c6" stroke-width="2"/>')
    for i, (l, r) in enumerate(L['map']):
        y = 842 + i * 40
        a(f'<text class="m" x="84" y="{y}">{esc(l)}</text>')
        a(f'<text class="m" x="470" y="{y}">{esc(r)}</text>')

    # who
    a(f'<text class="k" x="960" y="740">{esc(L["who_title"])}</text>')
    a('<rect x="960" y="760" width="660" height="364" rx="16" fill="#fffdf8" stroke="#1b1630" stroke-width="2.5" stroke-dasharray="8 7"/>')
    for i, line in enumerate(L['who']):
        a(f'<text class="t" x="984" y="{806 + i * 34}">{esc(line)}</text>')
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

for lang, L in T.items():
    out = OUT if lang == 'en' else OUT.parent.parent
    suffix = '' if lang == 'en' else '-ja'
    for name, build in (('nat', nat), ('sequence', sequence)):
        path = out / f'{name}{suffix}.svg'
        path.write_text(build(L), encoding='utf-8')
        print('wrote', path)
