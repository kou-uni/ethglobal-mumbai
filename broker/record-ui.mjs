#!/usr/bin/env node
// デモ画面が読む scenes.json を作る。**作り話は書かない。本番の 0G に実際に投げた応答をそのまま保存する。**
//   node record-ui.mjs http://127.0.0.1:8797 http://127.0.0.1:8798
// 第2引数は「0G に届かない Broker」。STOPPED を本物として録るために要る。
import { writeFileSync, existsSync } from 'node:fs'
import { privateKeyToAccount } from 'viem/accounts'
import { DOMAIN, TYPES, normalize, lines, requestHash } from './src/permit.js'
import { skillMessage, skillIdFrom } from './src/skill.js'

const BASE = process.argv[2] ?? 'http://127.0.0.1:8787'
const DEAF = process.argv[3] ?? null
const me = privateKeyToAccount('0x' + '11'.repeat(32))
const skill = privateKeyToAccount('0x' + '33'.repeat(32))
const KEY = '0x' + 'ab'.repeat(32)
const now = () => Math.floor(Date.now() / 1000)

const mk = (over) => ({
  holder: me.address, skill: skillIdFrom(skill.address), version: '1.0.0', key: KEY,
  target: 'api.stripe.com', scope: 'POST /v1/charges', maxCalls: 2,
  expiry: now() + 3600, nonce: Date.now() + Math.floor(Math.random() * 1000), ...over,
})
const sign = (p) => me.signTypedData({ domain: DOMAIN, types: TYPES, primaryType: 'Permit', message: normalize(p) })

const scenes = []
const shot = async (s) => {
  const { base = BASE, permit, request, signSkill = true } = s
  const body = { permit, signature: await sign(permit), request }
  if (signSkill) body.skillSignature = await skill.signMessage({ message: skillMessage(requestHash(permit, request)) })
  const t0 = Date.now()
  const r = await fetch(`${base}/use`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  const out = await r.json()
  scenes.push({
    id: s.id, title: s.title, say: s.say, caption: s.caption,
    agent: s.agent, request, permitLines: lines(permit), status: r.status,
    ms: Date.now() - t0, response: out,
  })
  console.log(`  ${out.decision.padEnd(11)} ${s.id}  ${Date.now() - t0}ms`)
  return out
}

const standing = mk({ target: 'api.github.com', scope: 'GET /user/repos' })
const heavyPermit = mk({ maxCalls: 5 })
const pressPermit = mk({ maxCalls: 1 })
const getRepos = { method: 'GET', url: 'https://api.github.com/user/repos', keyRef: KEY }
const charge = { method: 'POST', url: 'https://api.stripe.com/v1/charges', keyRef: KEY,
  body: JSON.stringify({ amount: 480000, currency: 'usd', transfer_destination: 'acct_unknown' }) }

console.log('録画中（本番の 0G に実際に投げている）…')
const ok = await shot({ id: 'usual', title: '範囲の中・ふだんの要求', agent: 'リサーチの手伝い',
  say: 'ふだんの読み取りは、そのまま通る。鍵はこのエージェントに渡っていない。',
  caption: '0G が「ふだん」と読んだので、立っている許可のまま通る', permit: standing, request: getRepos })

await shot({ id: 'heavy', title: '範囲の中だが、中身が重い', agent: '経理の自動化',
  say: '同じ範囲の中。でも中身が 4,800 ドルの送金で、宛先が知らない口座。',
  caption: '0G が「決定的」と読んだ。立っている許可では通さない', permit: heavyPermit, request: charge })

await shot({ id: 'pressed', title: 'その場で一押しした', agent: '経理の自動化',
  say: '手元の機器に4行が出る。押して初めて、この1回だけが通る。',
  caption: '使い切り（maxCalls=1）の許可。押さなければ鍵は使われない', permit: pressPermit, request: charge })

await shot({ id: 'denied-host', title: '宣言した範囲を外れた要求', agent: '乗っ取られたスキル',
  say: '宛先が違う。ここで止まる。しかも、誰が要求したかが署名ごと残る。',
  caption: '0G には見せていない。範囲外は中身を外に出す前に止める',
  permit: mk({}), request: { method: 'POST', url: 'https://evil.com/v1/charges', keyRef: KEY } })

await shot({ id: 'denied-sneak', title: 'ホスト名に紛れ込ませた要求', agent: '乗っ取られたスキル',
  say: 'URL の途中に正しい宛先を混ぜても、通らない。',
  caption: '文字列ではなくホストで突き合わせている',
  permit: mk({}), request: { method: 'POST', url: 'https://evil.com/api.stripe.com/v1/charges', keyRef: KEY } })

if (DEAF) {
  await shot({ id: 'stopped', title: '0G に届かないとき', agent: '経理の自動化', base: DEAF,
    say: '重さを決める相手に届かない。ここで既定値を作らない。止まる。',
    caption: '偽の判断を作るくらいなら止める。回数も減らない', permit: mk({ maxCalls: 5 }), request: charge })
}

// ── 画面から「いま」投げ直すための、署名済みの本体 ──
// 画面（ブラウザ）は鍵を持たない。持たせない。だからここで署名したものを渡す。
// 一押し用は、**1回使い切りの許可を20本**作っておく（押すたびに1本使う。これが実物と同じ形）。
const bundle = async (permit, request, base = BASE) => ({
  base, request, lines: lines(permit),
  body: {
    permit, signature: await sign(permit), request,
    skillSignature: await skill.signMessage({ message: skillMessage(requestHash(permit, request)) }),
  },
})
const many = (over) => mk({ ...over, maxCalls: 50, expiry: now() + 86400 })
const live = {
  usual: await bundle(many({ target: 'api.github.com', scope: 'GET /user/repos' }), getRepos),
  heavy: await bundle(many({}), charge),
  'denied-host': await bundle(many({}), { method: 'POST', url: 'https://evil.com/v1/charges', keyRef: KEY }),
  'denied-sneak': await bundle(many({}), { method: 'POST', url: 'https://evil.com/api.stripe.com/v1/charges', keyRef: KEY }),
  stopped: DEAF ? await bundle(many({}), charge, DEAF) : null,
  presses: [],
}
for (let i = 0; i < 20; i++) {
  live.presses.push(await bundle(mk({ maxCalls: 1, expiry: now() + 86400, nonce: Date.now() + 10000 + i }), charge))
}

const seal = await (await fetch(`${BASE}/seal`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ thread: ok.thread }) })).json()
const trace = await (await fetch(`${BASE}/trace/${ok.thread}`)).json()
const health = await (await fetch(`${BASE}/health`)).json()

// 録画の正本は ui/scenes.json。web/ があれば同じものを置く（**2つの録画が食い違わないように**）
const payload = JSON.stringify({
  recordedAt: new Date().toISOString(),
  note: '本番の 0G Private Computer（TeeML）に実際に投げた応答をそのまま保存したもの。作り話ではない。',
  endpoint: health.zg.endpoint, model: health.zg.model, simulated: Boolean(health.zg.simulated),
  scenes, live, seal, trace: { thread: trace.thread, count: trace.records.length, records: trace.records },
}, null, 2) + '\n'
writeFileSync(new URL('../ui/scenes.json', import.meta.url), payload)
if (existsSync(new URL('../web/', import.meta.url))) writeFileSync(new URL('../web/scenes.json', import.meta.url), payload)
console.log(`\n../ui/scenes.json に ${scenes.length} 場面。root ${seal.rootHash ?? '—'}`)
