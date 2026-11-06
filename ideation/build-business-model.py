#!/usr/bin/env python3
"""Builds ideation/2026-11-06-business-model.html.

Everything numeric on that page is computed here, so the page and the
arithmetic cannot drift apart. Each input is tagged:

  [verified]   we ran it and read the result
  [assumption] we chose it; it is a guess with a stated reason
  [unverified] someone else published it and we have not checked it
"""
import pathlib, html as H

OUT = pathlib.Path(__file__).with_name('2026-11-06-business-model.html')

# ---------------------------------------------------------------- inputs
UNIT = 0.000036          # [verified] USD per judgement, 467 measured calls
FREE_J = 2_000           # [assumption] free tier, judgements/month
PAID_J_CEIL = 50_000     # [assumption] included in plan A, judgements/month
PAID_J_USE = 10_000      # [assumption] what a paying P1 actually uses = 20% of ceiling
FREE_PER_PAID = 10       # [assumption] free users per paying user

PRICE_A = 108            # USD/year, billed once      (was $9/month; same amount, new shape)
PRICE_B = 348            # USD/year ($29/month) per skill
PRICE_C = 20_000         # USD/year

# [assumption] the ramp. Year 3 is pinned to the published SOM, not invented here.
USERS = {1: (500, 50, 0), 2: (2_500, 300, 2), 3: (8_000, 1_000, 10)}

FTE_COST = 80_000        # [assumption] USD/year, fully loaded, one person
OPEX = {1: (0, 6_000), 2: (1, 12_000), 3: (3, 30_000)}   # (FTE count, infra USD)

BUNDLED_SHARE = 0.50     # [assumption] half of P1 arrive through a device partner
REV_SHARE = 0.30         # [assumption] what the partner keeps
CAC_DIRECT = 40          # [assumption] USD to acquire one paying P1 directly

# ---------------------------------------------------------------- model
def model():
    rows, prev_a = [], 0
    for y in (1, 2, 3):
        a, b, c = USERS[y]
        rev_a, rev_b, rev_c = a * PRICE_A, b * PRICE_B, c * PRICE_C
        rev = rev_a + rev_b + rev_c

        j_paid = a * PAID_J_USE * 12
        j_free = a * FREE_PER_PAID * FREE_J * 12
        cogs = (j_paid + j_free) * UNIT

        fte, infra = OPEX[y]
        opex = fte * FTE_COST + infra

        new_a = a - prev_a
        chan = a * BUNDLED_SHARE * PRICE_A * REV_SHARE + new_a * BUNDLED_SHARE * CAC_DIRECT
        prev_a = a

        rows.append(dict(y=y, a=a, b=b, c=c, rev_a=rev_a, rev_b=rev_b, rev_c=rev_c,
                         rev=rev, j=j_paid + j_free, cogs=cogs, fte=fte, infra=infra,
                         opex=opex, chan=chan, net=rev - cogs - opex - chan))
    return rows

ROWS = model()
BE_USERS = -(-(FTE_COST + OPEX[2][1]) // PRICE_A)      # P1 needed to fund one person
BE_MAKERS = -(-(FTE_COST + OPEX[2][1]) // PRICE_B)
MARGIN_CEIL = 1 - (PAID_J_CEIL * 12 * UNIT) / PRICE_A  # margin if a user maxes the plan
FREE_COST_M = FREE_J * UNIT                            # cost of one free user per month

def usd(v, dp=0):
    return f'${v:,.{dp}f}'

# ---------------------------------------------------------------- figures
def fig_flow():
    """Who pays whom, and the four things we refuse to sell."""
    p = []
    p.append('<svg viewBox="0 0 760 330" role="img" aria-label="Who pays whom, and what we refuse to sell">')
    p.append('<defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" '
             'orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#173f66"/></marker>'
             '<marker id="arx" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" '
             'orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#8e8e8e"/></marker></defs>')
    p.append('<style>.b{font-size:12px;font-weight:700}.s{font-size:10.5px;fill:#555}'
             '.l{font-size:10px;fill:#173f66;font-weight:700}.x{font-size:10px;fill:#8e8e8e}</style>')
    # payers
    payers = [(20, 'P1 the key holder', f'{usd(PRICE_A)}/yr, billed once'),
              (118, 'P2 the maker', f'{usd(PRICE_B)}/yr per skill'),
              (216, 'P3 the company', f'from {usd(PRICE_C)}/yr')]
    for y, t, s in payers:
        p.append(f'<rect x="8" y="{y}" width="196" height="80" rx="6" fill="#eef3f8" stroke="#173f66"/>')
        p.append(f'<text x="22" y="{y+28}" class="b">{t}</text>')
        p.append(f'<text x="22" y="{y+48}" class="s">{s}</text>')
    # us
    p.append('<rect x="290" y="56" width="180" height="200" rx="6" fill="#fff" stroke="#1a1a1a" stroke-width="1.5"/>')
    p.append('<text x="380" y="92" class="b" text-anchor="middle">TOMOSHIBI</text>')
    p.append('<text x="380" y="114" class="s" text-anchor="middle">We are paid for</text>')
    p.append('<text x="380" y="134" class="b" text-anchor="middle">deciding</text>')
    p.append('<text x="380" y="162" class="s" text-anchor="middle">ALLOWED / NEEDS_PRESS</text>')
    p.append('<text x="380" y="178" class="s" text-anchor="middle">/ DENIED: all billed alike</text>')
    p.append('<text x="380" y="206" class="s" text-anchor="middle">STOPPED: not billed</text>')
    p.append('<text x="380" y="222" class="s" text-anchor="middle">(no verdict exists)</text>')
    for y in (60, 158, 256):
        p.append(f'<path d="M204 {y} H286" stroke="#173f66" marker-end="url(#ar)" fill="none"/>')
    p.append('<text x="214" y="52" class="l">money</text>')
    # supplier
    p.append('<rect x="556" y="56" width="196" height="92" rx="6" fill="#e7e9ec" stroke="#8e8e8e"/>')
    p.append('<text x="570" y="84" class="b">0G Private Computer</text>')
    p.append(f'<text x="570" y="104" class="s">{usd(UNIT,6)} per judgement</text>')
    p.append('<text x="570" y="122" class="s">[verified] 467 calls</text>')
    p.append('<path d="M470 100 H552" stroke="#173f66" marker-end="url(#ar)" fill="none"/>')
    p.append('<text x="482" y="92" class="l">cost</text>')
    # never sold
    p.append('<rect x="556" y="170" width="196" height="120" rx="6" fill="#fff" stroke="#8e8e8e" stroke-dasharray="4 3"/>')
    p.append('<text x="570" y="196" class="b" fill="#8e8e8e">Never sold</text>')
    for i, t in enumerate(['% of anything that moves', 'custody of keys or funds',
                           'the contents of requests', 'stars']):
        p.append(f'<text x="570" y="{216+i*18}" class="x">&#215; {t}</text>')
    p.append('<path d="M470 215 H552" stroke="#8e8e8e" stroke-dasharray="4 3" marker-end="url(#arx)" fill="none"/>')
    p.append('<text x="474" y="208" class="x">cut off by design</text>')
    p.append('</svg>')
    return '\n'.join(p)

def fig_cash():
    """Three-year revenue, cost and cash, to scale."""
    BASE, TOP = 232, 34
    hi = max(r['rev'] for r in ROWS)
    sc = (BASE - TOP) / hi
    p = ['<svg viewBox="0 0 760 316" role="img" aria-label="Revenue, cost and cash left over, years 1 to 3">']
    p.append('<style>.b{font-size:11px;font-weight:700}.s{font-size:10px;fill:#555}'
             '.n{font-size:10.5px;font-variant-numeric:tabular-nums}</style>')
    p.append(f'<path d="M40 {BASE} H740" stroke="#1a1a1a"/>')
    for i, r in enumerate(ROWS):
        x = 80 + i * 225
        hr = r['rev'] * sc
        hc = (r['cogs'] + r['opex'] + r['chan']) * sc
        hn = r['net'] * sc
        p.append(f'<rect x="{x}" y="{BASE-hr:.1f}" width="54" height="{hr:.1f}" fill="#173f66"/>')
        p.append(f'<rect x="{x+60}" y="{BASE-hc:.1f}" width="54" height="{hc:.1f}" fill="#e7e9ec" stroke="#8e8e8e"/>')
        p.append(f'<rect x="{x+120}" y="{BASE-hn:.1f}" width="54" height="{hn:.1f}" fill="#fff" stroke="#173f66" stroke-width="1.5"/>')
        p.append(f'<text x="{x+27}" y="{BASE-hr-8:.1f}" class="n" text-anchor="middle">{usd(r["rev"])}</text>')
        p.append(f'<text x="{x+87}" y="{BASE-hc-8:.1f}" class="n" text-anchor="middle">{usd(r["cogs"]+r["opex"]+r["chan"])}</text>')
        p.append(f'<text x="{x+147}" y="{BASE-hn-8:.1f}" class="n" text-anchor="middle">{usd(r["net"])}</text>')
        p.append(f'<text x="{x+87}" y="{BASE+20}" class="b" text-anchor="middle">Year {r["y"]}</text>')
        p.append(f'<text x="{x+87}" y="{BASE+36}" class="s" text-anchor="middle">'
                 f'{r["a"]:,} key holders &#183; {r["b"]:,} makers &#183; {r["c"]} companies</text>')
    p.append('<rect x="40" y="300" width="12" height="12" fill="#173f66"/><text x="58" y="310" class="s">revenue</text>')
    p.append('<rect x="130" y="300" width="12" height="12" fill="#e7e9ec" stroke="#8e8e8e"/><text x="148" y="310" class="s">all costs</text>')
    p.append('<rect x="226" y="300" width="12" height="12" fill="#fff" stroke="#173f66" stroke-width="1.5"/><text x="244" y="310" class="s">cash left over</text>')
    p.append('</svg>')
    return '\n'.join(p)

# ---------------------------------------------------------------- canvas
CANVAS = [
    ('Problem', 2, 2, [
        'A key is a <b>standing</b> permission. There is no way to hand over less',
        'Every refusal says the same word: &ldquo;failed&rdquo;',
        'Trust numbers never expire &#8212; and cost <b>$0.0027</b> each']),
    ('Solution', 1, 1, [
        'A permit signed on a device: key / destination / operation / call budget / expiry',
        'Proxy execution &#8212; the skill never gets the secret',
        '<b>Four refusals, never collapsed</b>',
        'An append-only trail, sealed on chain']),
    ('Unique value proposition', 1, 2, [
        '<b>Hand an agent one use instead of the key</b> &#8212; and keep every refusal, named and signed',
        '<i>3-D Secure for everything a key can do</i>']),
    ('Unfair advantage', 1, 1, [
        'A trust signal that <b>cannot be bought and does not keep</b>',
        'We structurally cannot read request bodies',
        'The refusal corpus &#8212; a flow-priced rival cannot afford to collect it']),
    ('Customer segments', 2, 1, [
        '<b>P2 the maker</b> &#8212; early adopter, already pays to be trusted',
        'P1 the key holder &#8212; the sympathetic persona, zero evidence of paying',
        'P3 the company &#8212; later, pays most']),
    ('Key metrics', 1, 1, [
        'Judgements per day',
        '<b>NEEDS_PRESS press-through rate</b> (100% means we built theatre)',
        'Relight rate after a version bump',
        'STOPPED rate &#8212; unbilled, so a clean SLO']),
    ('Channels', 1, 1, [
        '1. Device bundling &#8212; <b>the customer decides nothing</b>',
        '2. The repo and three live pages',
        '3. The embeddable badge (the only loop that compounds)']),
    ('Cost structure', 1, 2, [
        f'<b>{usd(UNIT,6)}</b> per judgement [verified]',
        f'A free user costs <b>{usd(FREE_COST_M,2)}</b>/month',
        '0G Storage fee model <b>[unverified]</b> &#8212; the one cost that could turn C into a liability',
        '<b>The real cost is distribution</b>']),
    ('Revenue streams', 1, 2, [
        f'A. {usd(PRICE_A)}/yr billed once &#8212; <b>every verdict billed alike</b>',
        f'B. {usd(PRICE_B)}/yr &#8212; badge and analytics. <b>The flame is free to see</b>',
        f'C. from {usd(PRICE_C)}/yr &#8212; for the duration of the contract',
        'D. device bundling &#8212; attempted first']),
]

AREAS = {'Problem': '1/1/3/3', 'Solution': '1/3/2/5', 'Unique value proposition': '1/5/3/7',
         'Unfair advantage': '1/7/2/9', 'Customer segments': '1/9/3/11',
         'Key metrics': '2/3/3/5', 'Channels': '2/7/3/9',
         'Cost structure': '3/1/4/6', 'Revenue streams': '3/6/4/11'}

def canvas_html():
    out = ['<div class="lc">']
    for name, _, _, items in CANVAS:
        area = AREAS[name]
        lis = ''.join(f'<li>{t}</li>' for t in items)
        out.append(f'<div class="lc-box" style="grid-area:{area}">'
                   f'<div class="lc-h">{name}</div><ul>{lis}</ul></div>')
    out.append('</div>')
    return '\n'.join(out)

def calc_rows():
    """Every number on the page, as formula -> inputs -> result."""
    r3 = ROWS[2]
    return [
        ('Cost of one judgement',
         '283.9 input tokens &#215; $0.08/M + 28.0 output tokens &#215; $0.48/M',
         usd(UNIT, 6), 'verified',
         'Token counts averaged over <b>467</b> production calls; unit prices read from '
         '<span class="mono">GET router-api.0g.ai/v1/models &rarr; pricing_usd</span>'),
        ('Cost of one free user, per month',
         f'{FREE_J:,} judgements &#215; {usd(UNIT,6)}',
         usd(FREE_COST_M, 2), 'verified',
         'Arithmetic on the row above. This is why the free tier can be generous'),
        ('Gross margin if a plan-A user maxes the plan',
         f'1 &minus; ({PAID_J_CEIL:,} &#215; 12 &#215; {usd(UNIT,6)}) / {usd(PRICE_A)}',
         f'{MARGIN_CEIL*100:.0f}%', 'verified',
         'Worst case for us, not the expected case'),
        ('Year-3 revenue (= the published SOM)',
         f'8,000 &#215; {usd(PRICE_A)} + 1,000 &#215; {usd(PRICE_B)} + 10 &#215; {usd(PRICE_C)}',
         usd(r3['rev']), 'assumption',
         'The user counts come from the SOM build in the market deck, not from this page. '
         '<b>Changing the price would change this number</b> &#8212; which is why A moved from '
         '$9/month to $108/year and <b>not</b> to $79/year'),
        ('Where 8,000 key holders comes from',
         '8,000,000 hardware wallets shipped &#215; 5% use an agent &#215; 2% of those pay',
         '8,000', 'assumption',
         'Two chained percentages, both chosen by us. <b>This is the softest number on the page</b>'),
        ('Year-3 judgements served',
         f'8,000 paying &#215; {PAID_J_USE:,}/mo + 80,000 free &#215; {FREE_J:,}/mo, &#215; 12',
         f'{r3["j"]/1e9:.2f}B', 'assumption',
         f'Free users assumed at {FREE_PER_PAID}&#215; paying users. '
         '<b>[unverified]</b> whether $0.08/M still holds at this volume'),
        ('Year-3 cost of inference',
         f'{r3["j"]/1e9:.2f}B judgements &#215; {usd(UNIT,6)}',
         usd(r3['cogs']), 'assumption',
         f'<b>{r3["cogs"]/r3["rev"]*100:.1f}% of revenue.</b> Inference is not the business risk'),
        ('Year-3 channel cost',
         f'4,000 bundled users &#215; {usd(PRICE_A)} &#215; {REV_SHARE:.0%} + '
         f'2,750 new direct users &#215; {usd(CAC_DIRECT)}',
         usd(r3['chan']), 'assumption',
         'The revenue share is the price of the only channel where the customer decides nothing'),
        ('People one paying cohort funds',
         f'({usd(FTE_COST)} + {usd(OPEX[2][1])}) / {usd(PRICE_A)}',
         f'{BE_USERS:,.0f} key holders', 'assumption',
         f'Or <b>{BE_MAKERS:,.0f} makers</b>, or <b>{(FTE_COST+OPEX[2][1])/PRICE_C:.1f} companies</b>. '
         'This is the number to aim at first, not the SOM'),
    ]

SOURCES = [
    ('0G model pricing', 'GET https://router-api.0g.ai/v1/models &rarr; pricing_usd '
     '($0.08/M input, $0.48/M output, model 0gm-1.0-35b-a3b)',
     'https://router-api.0g.ai/v1/models', 'verified',
     'Read by the Broker on every request. Measured again over 467 calls'),
    ('Machine identity security market', '$9.85B (2025), CAGR 10.62%',
     'https://www.snsinsider.com/reports/machine-identity-security-market', 'unverified',
     'Vendor report. Used only for TAM order of magnitude'),
    ('Agent payments, 2026&rarr;2030', '$8B &rarr; $1.5T (188&#215;)',
     'https://www.juniperresearch.com/', 'unverified',
     'Juniper Research, as reported. <b>We cite the growth shape, not the absolute number</b>'),
    ('Compliance automation spend', 'Vanta $18.8k/company/yr, Drata $12.5k',
     'https://www.vanta.com/pricing', 'unverified',
     'The existing budget line B competes for'),
    ('Cyber insurance market', '$16.3B/yr; average incident cost $4.44M',
     'https://www.ibm.com/reports/data-breach', 'unverified',
     'Used to size the loss-shifting side of the market, not as our revenue'),
    ('Hardware wallets shipped', '~8M units',
     'https://www.ledger.com/', 'unverified',
     'The base of the 8,000-user funnel. <b>The weakest link in the SOM chain</b>'),
    ('Stars for sale', '$0.0027 per star',
     '', 'verified', 'Listed price on an open marketplace, read 2026-11-05'),
]

CSS = pathlib.Path('/tmp/css.txt').read_text(encoding='utf-8')

def build():
    r1, r2, r3 = ROWS
    p = []
    p.append('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">')
    p.append('<meta name="viewport" content="width=device-width,initial-scale=1">')
    p.append('<title>TOMOSHIBI &#8212; Business model, lean canvas and cash flow</title>')
    p.append(CSS)
    p.append('</head>\n<body>\n<div class="page">')
    p.append('<header class="doc-header"><p class="eyebrow">Business model &#183; drawn, with the arithmetic</p>'
             '<h1>Who pays, what it costs, and what is left over</h1>'
             '<p class="lead">Three pictures of one model, and then every number on them traced back to '
             'where it came from. Generated by <span class="mono">ideation/build-business-model.py</span> &#8212; '
             'the page cannot drift from the arithmetic, because the arithmetic writes the page.</p>'
             '<div class="doc-meta"><span>2026-11-06</span>'
             '<span>Rule: <b>[verified]</b> we ran it &#183; <b>[assumption]</b> we chose it &#183; '
             '<b>[unverified]</b> someone else published it</span></div></header>')

    # 01 business model
    p.append('<section><h2><span class="no">01</span>The business model</h2>')
    p.append('<p class="msg">We are paid for deciding &#8212; the same for yes as for no. '
             'Four things are cut off by design, and each one, sold, would end the sentence the product is made of.</p>')
    p.append('<figure><figcaption>Figure 1&emsp;Money in, cost out, and the four doors we closed</figcaption>'
             '<div class="fig-scroll">' + fig_flow() + '</div></figure>')
    p.append('<p class="note"><b>Why <span class="mono">STOPPED</span> is not billed.</b> '
             'It means our own sealed model was unreachable, so no verdict exists. Billing it would mean '
             '<b>we earn when we are down</b> &#8212; and a company that earns while failing stops noticing that it failed.</p>')
    p.append('</section>')

    # 02 lean canvas
    p.append('<section><h2><span class="no">02</span>Lean canvas</h2>')
    p.append('<p class="msg">The full text, with the gaps it had to decide and the contradiction register, '
             'is in <span class="mono">LEAN-CANVAS.md</span>. This is the one-page view.</p>')
    p.append('<figure><figcaption>Figure 2&emsp;Lean canvas</figcaption>'
             '<div class="fig-scroll">' + canvas_html() + '</div></figure>')
    p.append('<p class="note"><b>The early adopter is P2, the maker &#8212; not P1.</b> '
             'P1 is the sympathetic persona and the evidence that P1 pays a subscription is <b>zero</b>. '
             'P2 already has a recurring budget line for being trusted. Sell to the side that already pays for trust.</p>')
    p.append('</section>')

    # 03 cash flow
    p.append('<section><h2><span class="no">03</span>Cash flow</h2>')
    p.append('<p class="msg">This is not a capital-intensive business. '
             'Inference is <b>'
             f'{r3["cogs"]/r3["rev"]*100:.0f}% of year-3 revenue</b>, and the only thing that can kill it '
             'is that nobody pays.</p>')
    p.append('<div class="kpis">'
             f'<div class="kpi"><div class="v">{usd(UNIT,6)}</div><div class="l">PER JUDGEMENT [VERIFIED]</div></div>'
             f'<div class="kpi"><div class="v">{BE_USERS:,.0f}</div><div class="l">PAYING KEY HOLDERS FUND ONE PERSON</div></div>'
             f'<div class="kpi"><div class="v">{r3["cogs"]/r3["rev"]*100:.1f}<small>%</small></div>'
             '<div class="l">YEAR-3 INFERENCE AS A SHARE OF REVENUE</div></div></div>')
    p.append('<figure><figcaption>Figure 3&emsp;Revenue, every cost, and the cash left over</figcaption>'
             '<div class="fig-scroll">' + fig_cash() + '</div></figure>')
    p.append('<div class="tbl"><table><caption>Table 1&emsp;The same three years, as numbers</caption>'
             '<thead><tr><th>Year</th><th class="num">A. key holders</th><th class="num">B. makers</th>'
             '<th class="num">C. companies</th><th class="num">Revenue</th><th class="num">Inference</th>'
             '<th class="num">People + infra</th><th class="num">Channel</th><th class="num">Cash left</th></tr></thead><tbody>')
    for r in ROWS:
        p.append(f'<tr><td><b>Year {r["y"]}</b></td><td class="num">{r["a"]:,}</td><td class="num">{r["b"]:,}</td>'
                 f'<td class="num">{r["c"]}</td><td class="num">{usd(r["rev"])}</td>'
                 f'<td class="num">{usd(r["cogs"])}</td><td class="num">{usd(r["opex"])}</td>'
                 f'<td class="num">{usd(r["chan"])}</td><td class="num"><b>{usd(r["net"])}</b></td></tr>')
    p.append('</tbody></table></div>')
    p.append('<p class="note"><b>The cash point that made us change A\'s shape.</b> '
             f'{usd(PRICE_A)} billed once arrives <b>at the start</b> of the year it covers. '
             'The same amount at $9/month arrives twelve times, after the cost of serving it. '
             '<b>Annual billing is not a pricing trick here; it is the working capital.</b></p>')
    p.append('<p class="note"><b>What this table does not contain.</b> No funding round, no salary for the two of us '
             'in year 1, no enterprise sales team. If any of the three were needed, the shape of row 3 changes '
             'before the margin does.</p>')
    p.append('</section>')

    # 04 calculation logic
    p.append('<section><h2><span class="no">04</span>Where every number comes from</h2>')
    p.append('<p class="msg">If a number here cannot be reproduced from the column next to it, it should not be in a pitch.</p>')
    p.append('<div class="tbl"><table><caption>Table 2&emsp;Formula, inputs, result</caption>'
             '<thead><tr><th>What</th><th>How it is computed</th><th class="num">Result</th>'
             '<th>Standing</th><th>Note</th></tr></thead><tbody>')
    for what, how, res, tag, note in calc_rows():
        p.append(f'<tr><td><b>{what}</b></td><td class="mono">{how}</td><td class="num"><b>{res}</b></td>'
                 f'<td><span class="tag {tag}">{tag}</span></td><td>{note}</td></tr>')
    p.append('</tbody></table></div>')
    p.append('<p class="note"><b>Read the standings in order of danger.</b> Every [verified] number is a cost; '
             'every [assumption] is a revenue. <b>That is the correct way round, and it is still the whole risk.</b></p>')
    p.append('</section>')

    # 05 sources
    p.append('<section><h2><span class="no">05</span>Sources</h2>')
    p.append('<div class="tbl"><table><caption>Table 3&emsp;Everything taken from outside this repository</caption>'
             '<thead><tr><th>Source</th><th>What we took</th><th>Standing</th><th>How we use it</th></tr></thead><tbody>')
    for name, took, url, tag, note in SOURCES:
        link = f'<a href="{url}">{name}</a>' if url else name
        p.append(f'<tr><td><b>{link}</b></td><td>{took}</td>'
                 f'<td><span class="tag {tag}">{tag}</span></td><td>{note}</td></tr>')
    p.append('</tbody></table></div>')
    p.append('<p class="src">Retrieved 2026-11-06. Market sizes marked [unverified] are vendor or analyst '
             'publications we have not independently checked; we use them for order of magnitude and say so. '
             'The SOM is ours, and it is deliberately the smallest number we publish.</p>')
    p.append('</section>')

    p.append('<footer class="doc-footer"><span>TOMOSHIBI &#8212; ETHGlobal Mumbai 2026</span>'
             '<span>Generated by ideation/build-business-model.py</span></footer>')
    p.append('</div>\n</body>\n</html>')
    return '\n'.join(p)

if __name__ == '__main__':
    OUT.write_text(build(), encoding='utf-8')
    print(f'wrote {OUT} ({OUT.stat().st_size} bytes)')
    for r in ROWS:
        print(f'  Y{r["y"]}: rev {usd(r["rev"])}  cogs {usd(r["cogs"])}  opex {usd(r["opex"])}  '
              f'chan {usd(r["chan"])}  net {usd(r["net"])}')
    print(f'  break-even: {BE_USERS:.0f} key holders or {BE_MAKERS:.0f} makers fund one person')
