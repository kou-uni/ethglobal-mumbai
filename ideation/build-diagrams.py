#!/usr/bin/env python3
"""Render the sequence diagrams and the architecture diagram into one HTML file.

    python3 ideation/build-diagrams.py

Hand-written SVG hides a misplaced arrow from everyone. Here the flows are written
as tables and the machine draws the lines. To change a diagram, change SEQUENCES below.
"""
import html, re
from pathlib import Path

HERE = Path(__file__).resolve().parent
INK, INK2, INK3, ACC, HAIR, FILL = '#1a1a1a', '#555555', '#8e8e8e', '#173f66', '#d9d9d9', '#e7e9ec'

def esc(s): return html.escape(s, quote=False)

def seq_svg(actors, steps, width=740):
    """actors: [(key, top, sub)]  steps: [(from, to, text, kind)] kind=call|ret|self|note"""
    n = len(actors)
    pad, head = 10, 56
    colw = (width - pad * 2) / n
    x = {k: pad + colw * (i + 0.5) for i, (k, _, _) in enumerate(actors)}
    rows = [s for s in steps]
    y0 = head + 34
    dy = 36
    h = y0 + dy * len(rows) + 14
    out = [f'<svg viewBox="0 0 {width} {h:.0f}" role="img" aria-label="sequence">']
    # lifelines
    for k, top, sub in actors:
        bx, bw = x[k] - colw / 2 + 6, colw - 12
        main = k == 'broker'
        out.append(f'<rect x="{bx:.1f}" y="10" width="{bw:.1f}" height="{head - 18}" fill="{ACC if main else FILL}"/>')
        tc = '#ffffff' if main else INK
        sc = '#ffffff' if main else INK3
        out.append(f'<text x="{x[k]:.1f}" y="30" text-anchor="middle" font-size="11.5" font-weight="700" fill="{tc}">{esc(top)}</text>')
        out.append(f'<text x="{x[k]:.1f}" y="45" text-anchor="middle" font-size="9.5" fill="{sc}" opacity="{0.8 if main else 1}">{esc(sub)}</text>')
        out.append(f'<line x1="{x[k]:.1f}" y1="{head}" x2="{x[k]:.1f}" y2="{h - 8}" stroke="{HAIR}" stroke-dasharray="3 4"/>')
    # arrows
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

AG = ('agent', 'Agent', 'The skill itself')
BR = ('broker', 'Gate (Broker)', 'Only trusted point')
ZG = ('zg', '0G', 'Sealed inference')
LD = ('ledger', 'Device', 'Ledger Flex')
AP = ('api', 'Their API', 'api.stripe.com')
ST = ('store', 'Trail', '0G Storage')

SEQUENCES = [
  dict(no='01', title='A routine request — it passes in silence', verdict='ALLOWED 200',
       msg='A request inside scope that 0G read as routine. <b>The person does nothing. No screen appears.</b>',
       actors=[AG, BR, ZG, AP, ST],
       steps=[('agent','broker','1 Request + permit + two signatures','call'),
              ('broker','broker','2 Verify signatures (holder, skill)','self'),
              ('broker','broker','3 Check scope and call budget','self'),
              ('broker','zg','4 Body into the seal (no key handed over)','call'),
              ('zg','broker','5 "routine" + request id','ret'),
              ('broker','api','6 Call on its behalf','call'),
              ('api','broker','7 Result','ret'),
              ('broker','store','8 Append to the trail (body excluded)','call'),
              ('broker','agent','9 ALLOWED + calls remaining','ret')]),
  dict(no='02', title='A heavy request — nothing passes until it is pressed', verdict='409 NEEDS_PRESS -> 200 ALLOWED',
       msg='A request 0G read as decisive <b>does not pass on a standing permit</b>. It needs a <b>single-use permit</b> — a press on the spot.',
       actors=[AG, BR, ZG, LD, AP, ST],
       steps=[('agent','broker','1 Requests a $4,800 transfer','call'),
              ('broker','zg','2 Body into the seal','call'),
              ('zg','broker','3 "decisive"','ret'),
              ('broker','agent','4 NEEDS_PRESS (not passed)','ret'),
              ('broker','ledger','5 Four lines to the device','call'),
              ('ledger','ledger','6 Person long-presses (5s)','self'),
              ('ledger','broker','7 Signs a single-use permit','ret'),
              ('broker','api','8 Runs this one call only','call'),
              ('broker','store','9 Appends who pressed','call'),
              ('broker','agent','10 ALLOWED (0 left)','ret')]),
  dict(no='03', title='Outside scope — stopped, and recorded as a violation', verdict='DENIED 403',
       msg='A request outside the declared scope is recorded <b>together with the skill\'s own signature</b>. <b>0G is not asked</b> (it is already out of scope).',
       actors=[AG, BR, ST],
       steps=[('agent','broker','1 To a different target (evil.com)','call'),
              ('broker','broker','2 Fails the scope check','self'),
              ('broker','store','3 Append as a violation (with skill signature)','call'),
              ('broker','agent','4 DENIED + reason','ret'),
              ('broker','broker','5 Call budget not decremented','self')]),
  dict(no='04', title='0G unreachable — stop instead of deciding', verdict='STOPPED 503',
       msg='<b>No default is created.</b> "Probably light, let it through" and "stop just in case" are both false verdicts.',
       actors=[AG, BR, ZG],
       steps=[('agent','broker','1 A routine request','call'),
              ('broker','zg','2 Query','call'),
              ('zg','broker','3 No response (30s)','ret'),
              ('broker','agent','4 STOPPED "could not decide, so stopped"','ret'),
              ('broker','broker','5 Budget intact, kept in the trail','self')]),
  dict(no='05', title='Lighting a flame — naming yourself once with World', verdict='verified / human_denied / proof_expired',
       msg='<b>Not asked on every use of the key.</b> World appears only when a flame is lit.',
       actors=[('me','Key holder','Flame sky'), BR, ('world','World','Agent Pass'), ('phone','Their phone','World App')],
       steps=[('me','broker','1 I want to light a flame on this version','call'),
              ('broker','world','2 Start the device flow','call'),
              ('world','broker','3 Code and polling','ret'),
              ('broker','me','4 Show the code and wait (10 min left)','ret'),
              ('phone','world','5 Key holder approves on their device','call'),
              ('world','broker','6 Signature with a pseudonym (sub)','ret'),
              ('broker','broker','7 Verify it, add one flame to (skill, version)','self'),
              ('broker','me','8 The flame lights (whose it is stays pseudonymous)','ret')]),
]

ARCH = f'''
<svg viewBox="0 0 760 468" role="img" aria-label="architecture">
  <text x="8" y="14" font-size="10.5" letter-spacing="0.08em" fill="{INK3}">Near side (person and key)</text>
  <text x="268" y="14" font-size="10.5" letter-spacing="0.08em" fill="{INK3}">The gate</text>
  <text x="520" y="14" font-size="10.5" letter-spacing="0.08em" fill="{INK3}">Outside (parties we need not trust)</text>
  <line x1="0" y1="20" x2="760" y2="20" stroke="{HAIR}"/>

  <rect x="8" y="40" width="200" height="66" fill="{FILL}"/>
  <text x="20" y="62" font-size="12" font-weight="700" fill="{INK}">Agent</text>
  <text x="20" y="80" font-size="10.5" fill="{INK2}">The skill itself. Holds no key</text>
  <text x="20" y="96" font-size="10.5" fill="{INK2}">Signs each request itself</text>

  <rect x="8" y="124" width="200" height="88" fill="{FILL}"/>
  <text x="20" y="146" font-size="12" font-weight="700" fill="{INK}">Device (Ledger)</text>
  <text x="20" y="164" font-size="10.5" fill="{INK2}">Shows 4 lines; long press signs</text>
  <text x="20" y="180" font-size="10.5" fill="{INK2}">The key never leaves</text>
  <text x="20" y="198" font-size="10.5" fill="{INK3}">bridge (127.0.0.1, USB HID)</text>

  <rect x="8" y="230" width="200" height="66" fill="{FILL}"/>
  <text x="20" y="252" font-size="12" font-weight="700" fill="{INK}">Key holder's screen</text>
  <text x="20" y="270" font-size="10.5" fill="{INK2}">Flame sky / trail (read only)</text>
  <text x="20" y="286" font-size="10.5" fill="{INK2}">Names themselves once in World</text>

  <rect x="248" y="40" width="200" height="256" fill="{ACC}"/>
  <text x="262" y="64" font-size="13" font-weight="700" fill="#ffffff">Broker (the gate)</text>
  <text x="262" y="82" font-size="10" fill="#ffffff" opacity="0.75">Holds no key. Invents no verdict</text>
  <text x="262" y="112" font-size="11" fill="#ffffff">1 Verify the two signatures</text>
  <text x="262" y="136" font-size="11" fill="#ffffff">2 Check scope and call budget</text>
  <text x="262" y="160" font-size="11" fill="#ffffff">3 Ask 0G for the weight</text>
  <text x="262" y="184" font-size="11" fill="#ffffff">4 Pass / require a press / stop</text>
  <text x="262" y="208" font-size="11" fill="#ffffff">5 Append-only trail (no delete)</text>
  <text x="262" y="232" font-size="11" fill="#ffffff">6 Add flames to (skill, version)</text>
  <text x="262" y="262" font-size="10" fill="#ffffff" opacity="0.75">Only trusted point. Not on a TEE</text>
  <text x="262" y="280" font-size="10" fill="#ffffff" opacity="0.75">(we do not quietly oversell it)</text>

  <rect x="488" y="40" width="264" height="56" fill="{FILL}"/>
  <text x="500" y="60" font-size="12" font-weight="700" fill="{INK}">0G Private Computer (TeeML)</text>
  <text x="500" y="78" font-size="10.5" fill="{INK2}">Decides weight. The body stays sealed from us</text>

  <rect x="488" y="110" width="264" height="56" fill="{FILL}"/>
  <text x="500" y="130" font-size="12" font-weight="700" fill="{INK}">World (Agent Pass)</text>
  <text x="500" y="148" font-size="10.5" fill="{INK2}">Humanness only. Returns a pseudonym (sub)</text>

  <rect x="488" y="180" width="264" height="56" fill="{FILL}"/>
  <text x="500" y="200" font-size="12" font-weight="700" fill="{INK}">The counterparty API</text>
  <text x="500" y="218" font-size="10.5" fill="{INK2}">Called on its behalf (e.g. api.stripe.com)</text>

  <rect x="488" y="250" width="264" height="56" fill="{FILL}"/>
  <text x="500" y="270" font-size="12" font-weight="700" fill="{INK}">0G Storage (the trail)</text>
  <text x="500" y="288" font-size="10.5" fill="{INK2}">Who permitted what, and whether it passed</text>

  <defs><marker id="c" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="{INK}"/></marker></defs>
  <line x1="208" y1="73" x2="240" y2="73" stroke="{INK}" marker-end="url(#c)"/>
  <text x="224" y="64" text-anchor="middle" font-size="9" fill="{INK2}">request</text>
  <line x1="240" y1="168" x2="210" y2="168" stroke="{INK}" marker-end="url(#c)"/>
  <text x="224" y="159" text-anchor="middle" font-size="9" fill="{INK2}">4 lines</text>
  <line x1="208" y1="186" x2="240" y2="186" stroke="{INK}" marker-end="url(#c)"/>
  <text x="224" y="202" text-anchor="middle" font-size="9" fill="{INK2}">signed</text>
  <line x1="208" y1="262" x2="240" y2="262" stroke="{INK}" marker-end="url(#c)"/>
  <text x="224" y="253" text-anchor="middle" font-size="9" fill="{INK2}">flames</text>

  <line x1="448" y1="68" x2="480" y2="68" stroke="{INK}" marker-end="url(#c)"/>
  <text x="464" y="59" text-anchor="middle" font-size="9" fill="{INK2}">body</text>
  <line x1="448" y1="138" x2="480" y2="138" stroke="{INK}" marker-end="url(#c)"/>
  <text x="464" y="129" text-anchor="middle" font-size="9" fill="{INK2}">sign-in</text>
  <line x1="448" y1="208" x2="480" y2="208" stroke="{INK}" marker-end="url(#c)"/>
  <text x="464" y="199" text-anchor="middle" font-size="9" fill="{INK2}">proxy</text>
  <line x1="448" y1="278" x2="480" y2="278" stroke="{INK}" marker-end="url(#c)"/>
  <text x="464" y="269" text-anchor="middle" font-size="9" fill="{INK2}">append</text>

  <line x1="0" y1="330" x2="760" y2="330" stroke="{HAIR}"/>
  <text x="8" y="352" font-size="11" font-weight="700" fill="{INK}">What never crosses this line</text>
  <text x="8" y="374" font-size="10.5" fill="{INK2}">Key material — never leaves the device. Not the Broker, not 0G, not the agent ever receives it</text>
  <text x="8" y="392" font-size="10.5" fill="{INK2}">The request body — inside the 0G seal only. Never in the trail, never in our logs</text>
  <text x="8" y="410" font-size="10.5" fill="{INK2}">The key holder's identity — World returns only a pseudonym (sub). No name, email or wallet</text>
  <text x="8" y="428" font-size="10.5" fill="{INK2}">Funds — never held. No path inside TOMOSHIBI moves money</text>
  <text x="8" y="452" font-size="10.5" fill="{INK3}">Note: when 0G cannot be reached, the Broker invents no verdict and returns STOPPED (no default)</text>
</svg>
'''

def build():
    head = (HERE / '2026-11-06-touchpoints.html').read_text().split('<body>')[0]
    head = head.replace('<html lang="ja">', '<html lang="en">')
    head = re.sub(r'<title>.*?</title>', '<title>TOMOSHIBI — Architecture and sequences</title>', head, flags=re.S)
    parts = [head, '<body>\n<div class="page">\n']
    parts.append('''
<header class="doc-header">
  <p class="eyebrow">TOMOSHIBI / diagrams / 2026-11-06</p>
  <h1>The architecture, and the five flows</h1>
  <p class="lead">The design written out in prose (inputs and outputs, screen flow, market) turned into <b>lines and order</b>. Five flows: <b>passes, requires a press, stops, declines to decide, lights a flame</b>. The diagrams are not drawn by hand; they are generated from <span class="mono">ideation/build-diagrams.py</span> (change a flow by changing the script).</p>
  <div class="doc-meta"><span>2026-11-06</span><span>kou</span><span>Implementation: broker/src/server.js, bridge/bridge.py</span></div>
</header>

<section>
  <h2>Executive summary</h2>
  <ol class="summary">
    <li><b>One gate, four answers.</b> Let through / not until it is pressed / stopped / could not decide, so stopped. <b>Never inventing a fifth answer</b> is the core of the design.</li>
    <li><b>Keys and bodies do not cross the gate.</b> The key never leaves the device, and the request body stays inside the 0G seal. <b>The Broker receives a weight without reading the content.</b></li>
    <li><b>A person appears in two places only.</b> The long press on a heavy request, and the single sign-in that lights a flame. <b>No person appears in the routine flow</b> — that there is no person in diagram 01 is the answer.</li>
  </ol>
</section>

<section>
  <h2><span class="no">01</span>Architecture</h2>
  <p class="msg"><b>Left is the near side, the middle is the gate, the right is the parties we need not trust.</b> Trust is required at one point only, and nothing is deposited there.</p>
  <figure>
    <figcaption>Figure 1 — The parts, and what does and does not cross the boundary</figcaption>
''' + ARCH + '''
    <p class="src">Sources: <span class="mono">broker/src/server.js</span> (the list of endpoints), <span class="mono">bridge/bridge.py</span> (USB HID, 127.0.0.1), <span class="mono">spec/permit-signature.md</span> (the signature contract).</p>
  </figure>
</section>
''')
    for i, s in enumerate(SEQUENCES, start=2):
        parts.append(f'''
<section>
  <h2><span class="no">{i:02d}</span>Flow {s["no"]} — {esc(s["title"])}</h2>
  <p class="msg">{s["msg"]}</p>
  <figure>
    <figcaption>Figure {i} — {esc(s["title"])} (returns: <span class="mono">{esc(s["verdict"])}</span>)</figcaption>
    <div class="fig-scroll">{seq_svg(s["actors"], s["steps"])}</div>
  </figure>
</section>
''')
    parts.append('''
<section>
  <h2><span class="no">07</span>When the version rises, the flames go out</h2>
  <p class="msg"><b>This is the specification, not a fault.</b> Because they go out, you can see <b>whether a skill is in use now</b>.</p>
  <div class="fig-scroll"><div class="chevrons">
    <div class="chev">42 flames on v1.0.0<small>they accumulate</small></div>
    <div class="chev on">The maker ships v1.1.0<small>(skill, version) changes</small></div>
    <div class="chev on">All 42 flames go out at once<small>the fact of 42 on the old version remains</small></div>
    <div class="chev">People still using it light one again<small>once, with World</small></div>
    <div class="chev">New flames accumulate<small>a fact about the current version</small></div>
  </div></div>
  <p class="note"><b>What this means for the buyer (P3).</b> Zero flames means "a new version that nobody is using yet". It is a device for <b>not mistaking an old rating for a current one</b>, not a punishment for the maker.</p>
</section>

<section>
  <h2><span class="no">08</span>Next actions</h2>
  <div class="tbl"><table>
    <thead><tr><th>Action</th><th style="width:96px">Who</th><th style="width:120px">By when</th></tr></thead>
    <tbody>
      <tr><td>Run steps 5-7 of diagram 02 (the heavy request) <b>on real hardware and confirm the order matches</b></td><td>kou, minta</td><td>Before filming</td></tr>
      <tr><td>Run diagram 05 (World) once with a real client registration</td><td>kou</td><td>During 11/6</td></tr>
      <tr><td>Show the video in the order 01 -> 02 -> 03 (the way it stops is the lead)</td><td>minta</td><td>11/6 22:00 IST</td></tr>
    </tbody>
  </table></div>
</section>

<footer class="doc-footer">
  <span>TOMOSHIBI — Architecture and sequences (2026-11-06)</span>
  <span>Generated by ideation/build-diagrams.py / related: actors-io.html, screen-flow.html</span>
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
