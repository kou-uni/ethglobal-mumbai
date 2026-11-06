INK='#1B1630'
DISH=f'<path d="M20 92 H100 C98 105 85 111 60 111 C35 111 22 105 20 92 Z" fill="#fff" stroke="{INK}" stroke-width="5" stroke-linejoin="round"/>'
BODY=f'<path d="M60 10 C64 30 97 44 97 68 C97 84 83 92 60 92 C37 92 23 84 23 68 C23 44 56 30 60 10 Z" fill="#F2600C" stroke="{INK}" stroke-width="5" stroke-linejoin="round"/><path d="M60 40 C62 50 80 58 80 72 C80 81 72 86 60 86 C48 86 40 81 40 72 C40 58 58 50 60 40 Z" fill="#FFC24A"/>'
CK=f'<ellipse cx="38" cy="76" rx="5" ry="3" fill="#ff8f6b" opacity=".8"/><ellipse cx="82" cy="76" rx="5" ry="3" fill="#ff8f6b" opacity=".8"/>'
SPK=f'<path d="M8 30 v14 M1 37 h14 M108 18 v12 M102 24 h12 M110 52 v10 M105 57 h10" stroke="{INK}" stroke-width="3.5" stroke-linecap="round"/>'
FACE={
'awake':f'<circle cx="49" cy="68" r="5" fill="{INK}"/><circle cx="71" cy="68" r="5" fill="{INK}"/><circle cx="50.5" cy="66.5" r="1.6" fill="#fff"/><circle cx="72.5" cy="66.5" r="1.6" fill="#fff"/><path d="M54 78 q6 5 12 0" fill="none" stroke="{INK}" stroke-width="3.5" stroke-linecap="round"/>'+CK,
'happy':f'<path d="M43 69 q6 -8 12 0 M65 69 q6 -8 12 0" fill="none" stroke="{INK}" stroke-width="4" stroke-linecap="round"/><path d="M52 77 q8 9 16 0 z" fill="{INK}"/>'+CK,
'guard':f'<path d="M40 58 l15 6 M80 58 l-15 6" stroke="{INK}" stroke-width="4.5" stroke-linecap="round"/><circle cx="50" cy="70" r="4.5" fill="{INK}"/><circle cx="70" cy="70" r="4.5" fill="{INK}"/><path d="M53 81 h14" stroke="{INK}" stroke-width="4" stroke-linecap="round"/>',
'alert':f'<circle cx="48" cy="67" r="7" fill="#fff" stroke="{INK}" stroke-width="3"/><circle cx="72" cy="67" r="7" fill="#fff" stroke="{INK}" stroke-width="3"/><circle cx="49" cy="68" r="2.8" fill="{INK}"/><circle cx="71" cy="68" r="2.8" fill="{INK}"/><ellipse cx="60" cy="81" rx="4" ry="5" fill="{INK}"/>'+CK,
}
WICK=f'<path d="M60 92 v-9" stroke="{INK}" stroke-width="5" stroke-linecap="round"/>'
def ch(m='awake',s=120):
    v=f'<svg viewBox="0 0 120 120" width="{s}" height="{s}" aria-hidden="true">'
    if m=='asleep': return v+f'<g transform="translate(0 44) scale(1 .52)">{BODY}</g><path d="M42 74 q5 4 10 0 M68 74 q5 4 10 0" fill="none" stroke="{INK}" stroke-width="3.5" stroke-linecap="round"/><path d="M56 82 q4 3 8 0" fill="none" stroke="{INK}" stroke-width="3" stroke-linecap="round"/>{DISH}<text x="92" y="44" font-size="18" font-weight="800" fill="{INK}">z</text><text x="104" y="28" font-size="13" font-weight="800" fill="{INK}">z</text></svg>'
    if m=='unlit': return v+WICK+DISH+'</svg>'
    return v+BODY+FACE[m]+(SPK if m=='happy' else '')+DISH+'</svg>'

def nav(mode, cur, who="Priya's shop"):
    if mode=='steps':
        items=['Leave your key','Choose what it may do','Hold to light']
        mid='<div class="stepper">'+''.join(f'<span class="{"on" if i==cur else "done" if i<cur else ""}"><em>{"✓" if i<cur else i+1}</em>{t}</span>' for i,t in enumerate(items))+'</div>'
    else:
        mid='<div class="links">'+''.join(f'<span class="{"on" if t==cur else ""}">{t}</span>' for t in ['Home','Activity','Lights'])+'</div>'
    return f'<div class="nav"><div class="logo">{ch("awake",30)}<b>tomoshibi</b></div>{mid}<div class="who">{who}</div></div>'
def nowbar(now,why): return f'<div class="nowbar"><div><i>NOW</i><b>{now}</b></div><div class="y"><i>WHY IT MATTERS</i><b>{why}</b></div></div>'
def chrome(active='t'):
    return f'<div class="chrome"><i></i><i></i><i></i><span class="tab {"off" if active=="t" else ""}">Billing assistant</span>'+(f'<span class="tab">tomoshibi.app</span>' if active=='t' else '')+'</div>'
def win(navmode,cur,now,why,bg,left,right,strip='',who="Priya's shop"):
    return f'<div class="win">{chrome()}{nav(navmode,cur,who)}{nowbar(now,why)}<div class="body" style="background:{bg}"><div class="l">{left}</div><div class="r">{right}</div></div>{strip}</div>'
def hero(m,say,h,p,size=150): return f'<div class="hero"><div class="c">{ch(m,size)}</div><div class="say">{say}</div></div><h3>{h}</h3><p>{p}</p>'
def ai(msgs,thoughts=''):
    b=''.join(f'<div class="m {c}">{t}</div>' for c,t in msgs)
    return f'<div class="win ai">{chrome("a")}<div class="aibody"><div class="aihd"><span class="bot"></span>Billing assistant <small>an AI tool for small shops</small></div>{b}{thoughts}<div class="aiin">Message Billing assistant…</div></div></div>'
kv=lambda k,v,c='': f'<div class="kv {c}"><span>{k}</span><b>{v}</b></div>'
tag=lambda t,c: f'<span class="tag {c}">{t}</span>'
LS=[('Plug in your Ledger','USB cable'),('Unlock it','Enter your PIN'),('Open TOMOSHIBI','Tap the flame on the Ledger'),('Tap “See it”','Check the lines match'),('Hold to light','Keep holding for 3 seconds')]
def strip(now): return '<div class="steps"><b class="lt">ON YOUR LEDGER</b>'+''.join(f'<div class="st {"ok" if j<now else "now" if j==now else ""}"><em>{"✓" if j<now else j+1}</em><span>{t}</span></div>' for j,(t,_) in enumerate(LS))+'</div>'
MOCK,REAL='<span class="kind mock">モック（絵だけ）</span>','<span class="kind real">本物で動かす</span>'

# ---------- the hold: the one scene that is interactive
HOLD=f'''<div class="win hero5" id="hero5">{chrome()}{nav('steps',2)}
{nowbar('Step 3 of 3 · Hold to light','Nothing starts without your hand. Your AI cannot press this button.')}
<div class="stage">
  <div class="headline"><small class="eyebrow">THE ONE THING ONLY YOU CAN DO</small>
    <h3><span class="d">Nothing starts until you hold.</span><span class="lt2">It’s lit.</span></h3>
    <p><span class="d">Your AI can type, click and read anything on this computer. It cannot press the button on your Ledger.</span><span class="lt2">Billing assistant may now read invoices on Stripe, up to 20 times, until 13 Nov. It holds a pass, not your key.</span></p></div>
  <div class="cols">
    <ol class="st5">{''.join(f'<li class="{"ok" if i<2 else "now" if i==2 else ""}"><em>{"✓" if i<2 else i+1}</em><div><b>{t}</b><small>{s}</small></div></li>' for i,(t,s) in enumerate(LS))}</ol>
    <div class="mid"><div class="hold" id="hold" role="button" tabindex="0" aria-label="Hold for three seconds">
        <svg viewBox="0 0 220 220" class="ring" aria-hidden="true"><circle cx="110" cy="110" r="98" class="tr"/><circle cx="110" cy="110" r="98" class="pr" id="pr" transform="rotate(-90 110 110)"/></svg>
        <svg viewBox="0 0 120 120" class="lamp" aria-hidden="true">{WICK}<g id="hf">{BODY}<g class="fa">{FACE['awake']}</g><g class="fh">{FACE['happy']}{SPK}</g></g>{DISH}</svg></div>
      <div class="status" id="st">Waiting for your hold…</div></div>
    <div class="onledger"><i>YOUR LEDGER SHOWS</i><b class="q">Lend Stripe?</b>{kv('Goes to','api.stripe.com')}{kv('Can','Read invoices, up to 20x')}{kv('Ends','13 Nov')}<div class="pill">Hold to light</div><small>Same lines as you chose. If anything differs, do not hold.</small></div>
  </div>
  <div class="reasons"><span>Your AI cannot press it</span><span>You sign exactly what you see</span><span>One hold, one permission</span></div>
  <div class="after"><button>Back to Billing assistant ↗</button><a id="again">もう一度見る</a></div>
</div></div>
<p class="try">↑ <b>試せます：</b>真ん中の器を <b>3秒 長押し</b>してください。本番では、Ledger を長押ししたときに同じことが起きます。</p>'''

P=[]  # phases: (now, why, star, [scenes]); scene=(when,title,kind,story,screen,arrow)
P.append(('キーのことを、TOMOSHIBI に丸投げする','.env も、フォルダも、書き方も知らなくていい。貼るのは1回だけ。',False,[
 ('月曜 09:10、台所のテーブル','AI に「.env にキーを書いて」と言われる',MOCK,
  'Priya は30歳。ひとりで小さなネットショップをやっている。エンジニアではない。未払いの注文がたまっていて、いつもの AI に頼んだ。返ってきたのは「フォルダに .env というファイルを作って、キーを書いてください」。——.env って何？ どのフォルダ？ どう書くの？ <b>ここから急に難しくなる。</b>',
  ai([('me','Chase the unpaid orders from last week.'),('bot','Happy to. First I need to connect to Stripe:<ol><li>Open the folder <code>shop-tools</code></li><li>Create a file named <code>.env</code></li><li>Add the line <code>STRIPE_SECRET_KEY=sk_live_…</code></li><li>Tell me when it is done</li></ol>')],
     '<div class="thoughts"><span>What is a .env?</span><span>Which folder…?</span><span>How do I even write that?</span></div>'),
  'ファイルは探さない。代わりに1行だけ返す'),
 ('同じチャットで','「TOMOSHIBI を使って」と1行だけ返す',MOCK,
  'Priya は自分の TOMOSHIBI のアドレスを1行貼るだけ。AI は「それならファイルは要りません」と、許可のボタンを返す。<b>キーのことは、ここから先ぜんぶ TOMOSHIBI に任せる。</b>',
  ai([('me','Can you use TOMOSHIBI instead? <span class="link">tomoshibi.app/priya</span>'),('bot','Yes. Then there is no file to create, and I never hold your key.<br>Approve what I may do here:<div class="aibtn">'+ch('awake',22)+' Approve in TOMOSHIBI ↗</div>')]),
  'ボタンを押す → 新しいタブで TOMOSHIBI が開く（ここで初めて登場）'),
 ('TOMOSHIBI のタブ（初回だけ）','キーは、ここに1回貼るだけ',REAL,
  'はじめてなので、キーを1回だけ預ける。どこで手に入れるかも、画面が教えてくれる。ファイルもフォルダも出てこない。AI は、このキーを一度も見ない。',
  win('steps',0,'Step 1 of 3 · Leave your key with TOMOSHIBI','No file to edit. Your AI never sees the key.','#FFF3E4',
   hero('awake','Leave the key stuff to me!','No files. No folders.<br>Just paste it here, once.','Billing assistant asked for your Stripe key. Give it to me instead. It will never see it.'),
   '<div class="card"><div class="cardh">Get your key <span>about a minute</span></div><ol class="how"><li>Open <u>Stripe → API keys ↗</u></li><li>Copy the <b>Secret key</b></li><li>Paste it below</li></ol><div class="inp"><span>sk_live_••••••••••••••••</span><em>Pasted</em></div><button>Keep it with me</button><small>Only once. It stays with me — never in a file, never with your AI.</small></div>'),
  '続けて、同じタブで'),
 ('TOMOSHIBI のタブ','何をしていいか、ふつうの言葉で選ぶ',REAL,
  '「請求書を読む・20回まで・7日間」。選んだ内容が、1つの文になって出る。渡すのはキーではなく、この小さな許可だけ。',
  win('steps',1,'Step 2 of 3 · Choose what it may do','You lend one small job, not the key.','#FFF3E4',
   hero('awake','What may it do?','Lend one small job.','Pick in plain words. This is all Billing assistant gets.'),
   '<div class="card">'+kv('Key','Stripe ▾')+kv('Goes to','api.stripe.com ▾')+kv('Can','Read invoices ▾')+kv('Ends','20 uses · 7 days ▾')+'<div class="sentence">Billing assistant may <b>read invoices</b> on <b>Stripe</b>, up to <b>20 times</b>, until <b>13 Nov</b>.</div><button>Next: hold to light →</button></div>'),
  'いよいよ、長押し'),
]))
P.append(('Ledger を長押しして、光をともす','これがないと、何も始まらない。AI には押せない、あなただけのボタン。',True,[
 ('TOMOSHIBI のタブ ＋ Ledger','長押しするまで、何も始まらない','<span class="kind star">★ 最大の見せ場</span>',
  '画面の真ん中の器には、まだ光がない。Priya は引き出しから Ledger を出してつなぎ、ロックを外し、TOMOSHIBI アプリを開く。Ledger の小さな画面に、PC と同じ内容が出る。確かめて、3秒、長押しする。<b>その瞬間、PC の画面にも光がともる。</b>'
  '<div class="whyhold"><h4>なぜ、長押しが要るの？</h4><div><em>1</em><b>AI には押せないから</b>AI は、この PC の中のことなら何でもできる。打つ・押す・読む。でも、Ledger のボタンだけは押せない。</div><div><em>2</em><b>見たものにだけサインするから</b>PC の画面と Ledger の画面に、同じ内容が出る。違っていたら、押さない。</div><div><em>3</em><b>長押し1回 ＝ 許可1つだから</b>長押ししなければ、AI も TOMOSHIBI も、何も始められない。</div></div>',
  HOLD,'光がともると'),
 ('TOMOSHIBI のタブ → AI に戻る','光がともった。AI が動き出す',REAL,
  'TOMOSHIBI は「AI に戻ってください」と言う。AI はすぐ仕事を始める。Priya がやったのは「貼る・選ぶ・長押し」の3つ。<b>ファイルは1つも触っていない。</b>',
  win('steps',3,'Lit · Billing assistant is working','You pasted once, chose, and held. That is all.','#EAF7EF',
   hero('happy','A light is lit!','Done. Go back<br>to your AI.','Billing assistant holds a pass, not your key. I will only call you when money is about to move.'),
   '<div class="card"><div class="did"><div><i>YOU DID</i><span class="y">Pasted a key, once</span><span class="y">Chose what it may do</span><span class="y">Held your Ledger</span></div><div><i>YOU DID NOT</i><span class="n">Create a file</span><span class="n">Look for a folder</span><span class="n">Give your key to an AI</span></div></div><button>Back to Billing assistant ↗</button></div>')
  +'<div class="mini">'+ai([('bot','Thank you. I am connected through TOMOSHIBI, no file needed. Found <b>7 unpaid orders</b> from last week. Drafting reminders now…')])+'</div>',
  'タブを閉じる。ここから TOMOSHIBI は見えなくなる'),
]))
P.append(('あとは、忘れていい','ふつうの日は、何も聞かれない。',False,[
 ('火曜、1日中','何も出てこない',REAL,
  'Priya は梱包と発送で手いっぱい。そのあいだに AI は請求書を12回読んだ。毎回、0G の中のモデルが「これはふつうの用事」と判定した。Priya のところには何も来ない。（下は、もし開いたらこう見える、という画面）',
  win('links','Home','Nothing needs you','On an ordinary day, I never ask.','#EAF7EF',
   hero('asleep','zzz… all quiet.','All quiet.','12 requests went through today. None of them needed you.'),
   '<div class="card">'+tag('ROUTINE','ok')+kv('Read unpaid invoices','× 12')+'<small>Each one was read by a sealed model on 0G before it ran.</small></div><div class="card soft">You can close this tab. I will only call you when money is about to move.</div>'),
  '水曜、お金が動こうとする'),
]))
P.append(('お金が動くときだけ、呼ばれる','あなたの指なしに、お金は動かない。',False,[
 ('水曜 14:20、郵便局の列 → 18:40 帰宅','知らせを押すと TOMOSHIBI が開く。もう一度、長押し',REAL,
  'お客さんが「届いたバッグを返品したい」。AI は ₹4,800 を返金しようとする。0G が「これは重い」と判定して、そこで止まる。Priya には知らせが1行だけ届く。急がなくていい、まだ何も起きていないから。帰宅して知らせを押し、Ledger をつないで長押しすると、返金は<b>1回だけ</b>出ていく。',
  '<div class="toast">'+ch('alert',34)+'<div><b>TOMOSHIBI</b><br>A refund of ₹4,800 is waiting for you.</div><span>Open ↗</span></div>'+
  win('links','Home','Money is about to move','It waits for your hold. One hold, one refund.','#FFE9DC',
   hero('alert','Money is about to move. Your call!','A refund of ₹4,800<br>is waiting for you.','Order #1042, a returned bag. Nothing happens until you hold your Ledger.'),
   '<div class="card">'+tag('NEEDS YOUR HAND','hand')+kv('What','Refund ₹4,800')+kv('For','Order #1042')+kv('How many times','Once')+'<div class="two"><button>Send to my Ledger</button><button class="ghost">Not now</button></div><small>Your AI cannot press this button.</small></div>',strip(2)),
  '長押しが済むと、また見えなくなる'),
]))
P.append(('何かあっても、止まって、残る','何が起きたか、自分で説明できる。',False,[
 ('木曜 03:00、Priya は寝ている','何も出てこない（止めて、記録だけ残す）',REAL,
  '夜中、AI が判断を誤った。お客さんの情報を、見たこともない宛先へ送ろうとする。悪意ではなく、まちがい。でも Priya が月曜に光をともしたのは「api.stripe.com だけ」。TOMOSHIBI は中身を読む前に断る。Priya は起こされない。',
  win('links','Activity','Something was stopped','Outside what you lit, nothing gets through.','#ECEAFB',
   hero('guard','Blocked it. Sleep on.','Stopped while<br>you slept.','Billing assistant tried to send data to a place you never allowed.'),
   '<div class="card">'+tag('BLOCKED','no')+kv('Tried','POST files.unknown-host.io')+kv('You allowed','api.stripe.com only')+kv('Tried by','billing-assistant 1.0.0')+'<small>Nothing was sent. Nothing was charged.</small></div>'),
  '朝、気になって自分で開く'),
 ('木曜 08:30、朝ごはん','自分で開くと、数が3つ',REAL,
  '「夜中に何かあったんだ」。行を押すと、何が・いつ・なぜ止まったかが、自分の言葉で読める。',
  win('links','Activity','Your week','You can explain what happened, yourself.','#FFF3E4',
   hero('awake','Morning! Here is your week.','Your week so far','Tap a line to see the full record.'),
   '<div class="nums"><div><b class="n no">1</b>stopped</div><div><b class="n ok">12</b>went through<br>without asking</div><div><b class="n hand">1</b>you let through<br>by hand</div></div><div class="card">'+f'<div class="li">{tag("BLOCKED","no")} Tried to send data to a new place</div><div class="li">{tag("BY HAND","hand")} Refund ₹4,800</div><small>Kept on 0G Storage, so it cannot be quietly changed.</small></div>'),
  '金曜、1週間たった'),
]))
P.append(('自分の光を、ほかの人に見せる','次の人は、数ではなく「誰の光か」で選べる。',False,[
 ('金曜','World App で確かめて、光を見せる',REAL,
  '1週間、ちゃんと仕事をした。1度まちがえたときは、止まった。Priya は使いつづける。そして、となり町で雑貨店をやっている友だちにも見えるように、自分の光を見せる。<b>光を持てるのは、自分のキーで本当に使った人だけ。</b>',
  win('links','Lights','Show your light','Others choose by whose light it is, not by how many.','#FFF3E4',
   hero('happy','Your light is on!','Show your light<br>to others?','Only people who really used a tool with their own key have a light. That is why a light means something.'),
   '<div class="card">'+kv('Tool','billing-assistant 1.0.0')+kv('You used it','13 times this week')+'<div class="qrrow"><div class="qr"></div><div><b>Confirm you are one real person</b><ol><li>Open World App on your phone</li><li>Scan this code</li><li>Tap Confirm</li></ol></div></div><small>Your wallet address is never written into the light.</small></div>'),
  ''),
]))

# ---------- lights that are lit, and the friend who chooses by them
lamps=lambda names,others: '<div class="field">'+''.join(f'<div class="me">{ch("happy" if i==0 else "awake",66)}<b>{nm}</b></div>' for i,nm in enumerate(names))+''.join(f'<div class="an">{ch("awake",34)}</div>' for _ in range(others))+'</div>'
tgl=lambda on: '<div class="tgl">'+''.join(f'<span class="{"on" if t==on else ""}">{t}</span>' for t in ['Everyone','People I know'])+'</div>'
DEMO='<span class="kind mock">デモ用のデータで見せる</span>'
now6,why6,star6,sc6=P[5]
P[5]=(now6,'光は、本当に使った人だけのもの。だから意味がある。',star6,sc6)
_s=list(sc6[0]); _s[5]='World App で Confirm を押すと'; sc6[0]=tuple(_s)
sc6.append(('金曜、そのあと','ともっている光が、見える',REAL,
 'Lights のページに、このツールにともっている光が並ぶ。1つ1つが、自分のキーで本当に使った、実在する1人。その中の1つが Priya の光。光は買えない。版が変わると、いったん全部消える。',
 win('links','Lights','Your light is showing','Every light is one real person who really used this tool.','#FFF3E4',
  hero('happy','There you are!','14 lights are on<br>for this tool.','Each one is a real person who used billing-assistant 1.0.0 with their own key. One of them is you.'),
  '<div class="card"><div class="cardh2"><b>billing-assistant 1.0.0</b>'+tgl('Everyone')+'</div>'+lamps(['You'],13)+'<small>Lights cannot be bought. They all go out when the version changes, and are earned again.</small></div>'),
 '金曜の夜、Priya は友だちの Arjun にこの話をする'))
P.append(('友だちが、あなたの光を見て選ぶ','数ではなく「誰の光か」で選べる。人への信頼が、光になる。',False,[
 ('次の週、Arjun の PC','Arjun は、Priya の光があるほうを選ぶ',DEMO,
  'となり町で雑貨店をやっている Arjun も、同じことで困っていた。ツールを探すと、光が212個ついたものもある。でも Arjun が選んだのは、光が14個のほう。<b>その中に、Priya の光があったから。</b>知らない212人より、会ったことのある1人。',
  win('links','Lights','Choosing a tool','Choose by whose light it is, not by how many.','#FFF3E4',
   hero('awake','Someone you know uses this.','Priya’s light<br>is on.','You met Priya in person. She has used this tool with her own key, 13 times this month.'),
   '<div class="card"><div class="cardh2"><b>Tools for chasing unpaid orders</b>'+tgl('People I know')+'</div>'
   '<div class="tool"><b>invoice-wizard 2.3</b><span>212 lights</span><em>nobody you know</em></div>'
   '<div class="tool pick"><b>billing-assistant 1.0.0</b><span>14 lights</span><em>'+ch('happy',30)+' Priya</em></div>'
   '<div class="tool"><b>pay-helper 0.9</b><span>3 lights</span><em>nobody you know</em></div>'
   '<button>Use it with TOMOSHIBI →</button></div>',who="Arjun's shop"),
  'Arjun も、キーを預けて、選んで、自分の Ledger を長押しする'),
 ('その次の週、Priya の PC','Arjun の光も、ともっている',DEMO,
  'Priya が Lights を開くと、自分の光のとなりに、Arjun の光がともっている。キーを AI に貼らずに済む人が、1人ふえた。次にだれかが探すときは、2人の光が見える。<b>人への信頼が、光になる。</b>',
  win('links','Lights','Lights from people you know','Trust between people becomes the light.','#FFF3E4',
   hero('happy','Look who is here!','Arjun’s light<br>is on, too.','He chose this tool because your light was on. The next person will see both of you.'),
   '<div class="card"><div class="cardh2"><b>billing-assistant 1.0.0</b>'+tgl('People I know')+'</div>'+lamps(['You','Arjun'],0)+'<small>15 lights in all · 2 from people you know</small></div>'),
  ''),
]))

n=0; body=[]; rows=[]
DO=['AI に頼む','1行貼る','キーを1回貼る','4つ選ぶ','Ledger を3秒 長押し','タブを閉じる','何もしない','帰宅して1回 長押し','寝ている','10秒見る','World App で確認','見るだけ','（Arjun が選んで、長押し）','見るだけ']
for pi,(now,why,star,scenes) in enumerate(P,1):
    body.append(f'<div class="phase {"star" if star else ""}" id="p{pi}"><span class="pn">{pi}</span><div class="now"><small>今していること</small><b>{now}</b></div><span class="to">→</span><div class="why"><small>だから、こういう価値</small><b>{why}</b></div></div>')
    for (w,t,k,st,scr,arr) in scenes:
        n+=1
        body.append(f'<article class="scene"><header><span class="sn">{n}</span><div><small>{w}</small><h3>{t}</h3></div>{k}</header><div class="story">{st}</div>{scr}</article>')
        rows.append(f'<tr><td>{n}</td><td>{t}</td><td>{DO[n-1]}</td><td><b>{why}</b></td></tr>')
        if arr: body.append(f'<div class="arrow"><i>↓</i>{arr}</div>')
pmap=''.join(f'<a class="mp {"star" if s else ""}" href="#p{i}"><em>{i}</em><b>{now}</b><span>{why}</span></a>' for i,(now,why,s,_) in enumerate(P,1))
faces=''.join(f'<div>{ch(m,78)}<small>{t}</small></div>' for m,t in [('unlit','ともす前'),('awake','いつも'),('asleep','ふつうの日'),('alert','お金が動く'),('guard','止めた'),('happy','光がともった')])

CSS=open(__file__.replace('gen_flow.py','flow3.css')).read()
JS=open(__file__.replace('gen_flow.py','flow3.js')).read()
html=f'''<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>TOMOSHIBI — アプリの流れ（PC・Priya の1週間）</title><style>{CSS}</style><div class="wrap">
<div class="top"><div>{ch('happy',120)}</div><div><small>TOMOSHIBI — アプリの流れ（PC の Web 画面）</small><h1>キーのことは、ぜんぶ TOMOSHIBI に丸投げ。<br>あなたがやるのは、長押しだけ。</h1><p class="en">Leave the key stuff to TOMOSHIBI. All you do is hold.</p></div></div>
<div class="ba"><div class="b"><small>今まで</small><b>「このフォルダの .env にキーを書いてください」</b>どのファイル？ どう書くの？ ここで止まる。なんとか書けても、そのキーは期限なし・上限なし・記録なしで、ずっと AI の手元に残る。</div><div class="a"><small>TOMOSHIBI があると</small><b>「TOMOSHIBI を使って」と1行返すだけ</b>キーは TOMOSHIBI に1回貼るだけ。ファイルは触らない。あとは Ledger を長押しして、許可するだけ。お金が動くときだけ、また呼ばれる。</div></div>
<h2 class="sec">流れの全体 — 今していること → だから、こういう価値</h2>
<div class="map">{pmap}</div>
<p class="note">灰色の枠は AI のチャット（モック）。黒い枠が TOMOSHIBI（本物で動かす）。TOMOSHIBI の画面には、いつも上に「NOW（今していること）」と「WHY IT MATTERS（その価値）」が出ます。案内役は、Ledger の中にいるのと同じ「器にのった光」です。</p>
<div class="faces">{faces}</div>
{''.join(body)}
<h2 class="sec">まとめ</h2>
<div class="sum"><table><tr><th></th><th>場面</th><th>Priya の手</th><th>価値</th></tr>{''.join(rows)}</table></div>
</div><script>{JS}</script></html>'''
open('ideation/2026-11-06-app-flow-pc.html','w').write(html); print(len(html))
