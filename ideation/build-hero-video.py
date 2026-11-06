#!/usr/bin/env python3
"""Builds ideation/2026-11-06-hero-video.html — the rough sketch for the top video.

Split screen the whole way through: LEFT is with TOMOSHIBI, RIGHT is the same
moment without it. The cut list is about value, not procedure: every beat is a
thing that happens to the viewer, not a step in our flow.
"""
import pathlib

OUT = pathlib.Path(__file__).with_name('2026-11-06-hero-video.html')
CSS = pathlib.Path('/tmp/css.txt').read_text(encoding='utf-8')

# (seconds, title, left lines, right lines, voice-over, what must be real)
BEATS = [
 (0, 6, 'The same agent, the same job',
  [('AGENT', 'Pay the invoice from my account.'), ('', ''), ('OK', 'One permit, signed')],
  [('AGENT', 'Pay the invoice from my account.'), ('', ''), ('BAD', 'Here is my key')],
  'Two people. Same agent. Same job.',
  'Both sides run the same request body. Record them in one session so the timestamps match.'),

 (6, 14, 'What you handed over',
  [('DEV', 'key: stripe-live'), ('DEV', 'to: api.stripe.com'), ('DEV', 'charge x1, until 18:00')],
  [('BAD', 'sk_live_51H...'), ('', 'no destination'), ('', 'no count, no expiry')],
  'On the left you hand over one use. On the right you hand over the key.',
  'Left: the real four lines on the device screen. Right: a real key string, blurred after the first six characters.'),

 (14, 24, 'The agent asks for something else',
  [('STOP', 'DENIED'), ('', 'out of target: evil.com'), ('OK', 'Nothing left the machine')],
  [('', 'POST evil.com ... 200 OK'), ('BAD', 'It worked.'), ('', 'Nobody was asked')],
  'Now the agent asks for something you never approved.',
  'A real DENIED from the Broker, with the destination visible. The right side is a real 200.'),

 (24, 34, 'Money is about to move, and nobody has pressed',
  [('STOP', 'NEEDS_PRESS'), ('', '$4,800 refund'), ('OK', 'Waiting for a human')],
  [('', 'refund issued'), ('BAD', '$4,800 gone'), ('', 'You find out later')],
  'Irreversible. On the left it waits for a person. On the right it is already done.',
  'The press has to be a real press on the device. No cut between the screen and the finger.'),

 (34, 42, 'Our own checker goes down',
  [('STOP', 'STOPPED'), ('', 'no verdict exists'), ('OK', 'Nothing changed. Not billed')],
  [('', 'there is no such state'), ('BAD', 'It just goes through'), ('', '')],
  'When we cannot decide, we stop and change nothing. We do not guess, and we do not charge.',
  'Point the Broker at an unreachable endpoint. Do not fake the error.'),

 (42, 52, 'The morning after',
  [('DEV', 'DENIED x1  out of target'), ('DEV', 'NEEDS_PRESS x1  pressed'), ('OK', 'sealed: 0x74c7cdf9...aef1')],
  [('', 'failed'), ('', 'failed'), ('BAD', 'failed  -  whose fault?')],
  'Something went wrong. On the right, every line says failed. On the left, each stop has a name and an owner.',
  'Show the real trail and the real transaction hash. It has to be clickable on the explorer.'),

 (52, 60, 'A new version ships',
  [('', 'v1.3 released'), ('OK', 'every flame goes out'), ('DEV', 'earned again, by real people')],
  [('', 'v1.3 released'), ('BAD', '4.8 stars, unchanged'), ('', 'from code nobody runs now')],
  'A review score never expires. A flame goes out.',
  'The stars screen before and after a version bump. One take, no cut.'),

 (60, 68, 'The line',
  [('OK', 'Hand over one use,'), ('OK', 'not the key.'), ('', 'tomoshibi')],
  [('', ''), ('BAD', 'Or hand over the key.'), ('', '')],
  'Your agent is holding a spare key that works until you cancel it. It does not have to.',
  'Last frame holds the repo URL for three full seconds.'),
]

COL = {'OK': '#173f66', 'STOP': '#173f66', 'BAD': '#8e8e8e', 'DEV': '#1a1a1a', 'AGENT': '#1a1a1a', '': '#555555'}

def frame(i, b):
    t0, t1, title, left, right, vo, real = b
    p = [f'<svg viewBox="0 0 760 210" role="img" aria-label="Beat {i+1}: {title}">']
    p.append('<style>.t{font-size:11px;font-weight:700;letter-spacing:.08em}'
             '.c{font-size:12px}.m{font-family:ui-monospace,Menlo,monospace;font-size:11.5px}'
             '.k{font-size:9.5px;font-weight:700;letter-spacing:.06em}</style>')
    # panels
    p.append('<rect x="0" y="0" width="372" height="210" rx="6" fill="#eef3f8" stroke="#173f66"/>')
    p.append('<rect x="388" y="0" width="372" height="210" rx="6" fill="#fff" stroke="#d9d9d9" stroke-dasharray="4 3"/>')
    p.append('<text x="20" y="28" class="t" fill="#173f66">WITH TOMOSHIBI</text>')
    p.append('<text x="408" y="28" class="t" fill="#8e8e8e">WITHOUT</text>')
    p.append('<path d="M20 42 H352" stroke="#173f66" opacity=".35"/>')
    p.append('<path d="M408 42 H740" stroke="#d9d9d9"/>')
    for col, lines in ((20, left), (408, right)):
        y = 82
        for kind, text in lines:
            if text:
                if kind:
                    p.append(f'<text x="{col}" y="{y}" class="k" fill="{COL[kind]}">{kind}</text>')
                    p.append(f'<text x="{col+52}" y="{y}" class="m" fill="{COL[kind]}">{text}</text>')
                else:
                    p.append(f'<text x="{col+52}" y="{y}" class="m" fill="#8e8e8e">{text}</text>')
            y += 34
    p.append('</svg>')
    return '\n'.join(p)

def build():
    p = ['<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">',
         '<meta name="viewport" content="width=device-width,initial-scale=1">',
         '<title>TOMOSHIBI &#8212; Hero video, rough sketch</title>', CSS, '</head>\n<body>\n<div class="page">']
    p.append('<header class="doc-header"><p class="eyebrow">Hero video &#183; rough sketch</p>'
             '<h1>With it on the left. Without it on the right. 68 seconds.</h1>'
             '<p class="lead">The split never breaks. Every beat is a thing that happens to the viewer, '
             'not a step in our flow &#8212; nobody watching a hero video wants to learn a procedure. '
             'This is the loop at the top of the page; the 2&#8211;4 minute judged video is separate '
             'and sits in <span class="mono">ideation/2026-11-06-storyboard.html</span>.</p>'
             '<div class="doc-meta"><span>2026-11-06</span><span>8 beats &#183; 68 s &#183; no narration track required</span>'
             '<span>Rough sketch &#8212; layout and wording, not final art</span></div></header>')

    p.append('<section><h2><span class="no">01</span>Why this shape</h2>')
    p.append('<p class="msg">A hero video has about four seconds to be understood. '
             'A split screen is the only format where <b>the viewer does the comparing</b> and we do not have to explain.</p>')
    p.append('<ul><li><b>Value, not procedure.</b> We never show how a permit is constructed. '
             'We show what is different on the morning after</li>'
             '<li><b>The right side is not a strawman.</b> It is what everyone does today, and it works '
             '&#8212; right up until beat 3</li>'
             '<li><b>Nothing is mocked.</b> Every verdict on the left is a real response from the running Broker. '
             'If a frame cannot be produced for real, the frame is cut, not faked</li>'
             '<li><b>It reads with the sound off.</b> Judges scroll. The voice-over is a bonus, not the carrier</li></ul>')
    p.append('</section>')

    p.append('<section><h2><span class="no">02</span>The cut list</h2>')
    p.append('<p class="msg">Eight beats. The first three carry it; if time runs short, cut beats 5 and 7, in that order.</p>')
    for i, b in enumerate(BEATS):
        t0, t1, title, _, _, vo, real = b
        p.append(f'<h3>{t0:02d}:{t0%60:02d} &#8211; {t1//60:02d}:{t1%60:02d}&emsp;{i+1}. {title}</h3>'
                 .replace(f'{t0:02d}:{t0%60:02d}', f'{t0//60:02d}:{t0%60:02d}'))
        p.append(f'<figure>{frame(i, b)}</figure>')
        p.append(f'<p class="note"><b>Voice:</b> &ldquo;{vo}&rdquo;<br><b>Must be real:</b> {real}</p>')
    p.append('</section>')

    p.append('<section><h2><span class="no">03</span>What to shoot, in one pass</h2>')
    p.append('<div class="tbl"><table><caption>Table 1&emsp;Capture list</caption>'
             '<thead><tr><th>Shot</th><th>Source</th><th>Note</th></tr></thead><tbody>'
             '<tr><td>The four lines on the device</td><td>Ledger, filmed</td>'
             '<td><b>The only shot that cannot be screen-captured.</b> Shoot it first, while the battery is full</td></tr>'
             '<tr><td>The press</td><td>Ledger, filmed</td><td>Finger and screen in the same frame, no cut</td></tr>'
             '<tr><td>DENIED / NEEDS_PRESS / STOPPED</td><td><span class="mono">node demo.mjs</span></td>'
             '<td>One run produces all of them. Capture the terminal at 2x font</td></tr>'
             '<tr><td>The right-hand side</td><td>A plain <span class="mono">curl</span> with the key in the header</td>'
             '<td>Blur after six characters. Use a revoked key</td></tr>'
             '<tr><td>Flames going out</td><td><span class="mono">ui/stars.html</span></td>'
             '<td>Bump the version live. One take</td></tr>'
             '<tr><td>The sealed trail</td><td>Explorer, <span class="mono">0x74c7cdf9&#8230;aef1</span></td>'
             '<td>Let the page finish loading on camera. A spinner reads as a mock</td></tr>'
             '</tbody></table></div>')
    p.append('<p class="note"><b>Order of filming is the reverse of the cut list.</b> '
             'Shoot the device beats first and the title card last, because the title is the only thing '
             'we can still produce at 03:00 with a flat battery.</p>')
    p.append('</section>')

    p.append('<section><h2><span class="no">04</span>What this video must not do</h2>')
    p.append('<ul><li><b>No architecture diagram.</b> Not one box. It is in the README for the reader who wants it</li>'
             '<li><b>No logo animation.</b> Four seconds of brand is four seconds of the budget</li>'
             '<li><b>No claim we cannot click.</b> If a number appears on screen it appears in the README too</li>'
             '<li><b>Do not say &ldquo;secure&rdquo;.</b> Show a refusal instead</li></ul>')
    p.append('</section>')

    p.append('<footer class="doc-footer"><span>TOMOSHIBI &#8212; ETHGlobal Mumbai 2026</span>'
             '<span>Generated by ideation/build-hero-video.py</span></footer></div>\n</body>\n</html>')
    return '\n'.join(p)

if __name__ == '__main__':
    OUT.write_text(build(), encoding='utf-8')
    print(f'wrote {OUT} ({OUT.stat().st_size} bytes)')
