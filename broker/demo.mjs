#!/usr/bin/env node
// 1コマンドで、通る／止まる／違反かどうかを出す。 node demo.mjs [http://127.0.0.1:8787]
import { privateKeyToAccount } from 'viem/accounts'
import { DOMAIN, TYPES, normalize, lines, requestHash } from './src/permit.js'
import { skillMessage, skillIdFrom } from './src/skill.js'

const BASE = process.argv[2] ?? 'http://127.0.0.1:8787'
const me = privateKeyToAccount('0x' + '11'.repeat(32))
const skill = privateKeyToAccount('0x' + '33'.repeat(32))
const KEY = '0x' + 'ab'.repeat(32)

const permit = {
  holder: me.address, skill: skillIdFrom(skill.address), version: '1.0.0', key: KEY,
  target: 'api.stripe.com', scope: 'POST /v1/charges', maxCalls: 2,
  expiry: Math.floor(Date.now() / 1000) + 3600, nonce: Date.now(),
}
const signature = await me.signTypedData({ domain: DOMAIN, types: TYPES, primaryType: 'Permit', message: normalize(permit) })

console.log('\n── 端末に出る4行（これと同じ値から32バイトが作られる） ──')
console.log(lines(permit).map((l) => '  ' + l).join('\n'))

const TAG = {
  ALLOWED: '\x1b[32mALLOWED   \x1b[0m',
  DENIED: '\x1b[31mDENIED    \x1b[0m',
  STOPPED: '\x1b[35mSTOPPED   \x1b[0m',
  NEEDS_PRESS: '\x1b[36mNEEDS_PRESS\x1b[0m',
}

/** 0G が何と言ったか。**模擬のときは模擬と出す。** */
const zgOf = (b) => {
  if (!b.zg) return ''
  if (b.zg.error) return `\x1b[35m0G: ${b.zg.error}\x1b[0m`
  const mark = b.zg.simulated ? '\x1b[33m【模擬】\x1b[0m' : ''
  const id = b.zg.requestId ? ` / ${b.zg.requestId}` : ''
  return `${mark}0G: ${b.zg.tier}${id}`
}

const call = async (label, request, { signSkill = true, p = permit, sig = signature } = {}) => {
  const body = { permit: p, signature: sig, request }
  if (signSkill) body.skillSignature = await skill.signMessage({ message: skillMessage(requestHash(p, request)) })
  const b = await (await fetch(`${BASE}/use`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  })).json()
  const tail = b.decision === 'ALLOWED'
    ? `残り ${b.remaining}  ${zgOf(b)}`
    : b.decision === 'DENIED'
      ? `${b.reason.padEnd(18)} ${b.violation ? '\x1b[33m違反として刻む\x1b[0m' : '刻まない'}`
      : `${(b.message ?? b.reason).padEnd(18)} ${zgOf(b)}`
  console.log(`  ${TAG[b.decision] ?? b.decision} ${label}  ${tail}`)
  return b
}

const sign = (p) => me.signTypedData({ domain: DOMAIN, types: TYPES, primaryType: 'Permit', message: normalize(p) })

console.log('\n── 範囲の中 ──')
const ok = await call('POST api.stripe.com/v1/charges', { method: 'POST', url: 'https://api.stripe.com/v1/charges', keyRef: KEY })
await call('POST api.stripe.com/v1/charges', { method: 'POST', url: 'https://api.stripe.com/v1/charges', keyRef: KEY })

console.log('\n── 宣言した範囲を外れた要求（スキルの署名ごと刻まれる） ──')
await call('別の宛先へ        ', { method: 'POST', url: 'https://evil.com/v1/charges', keyRef: KEY })
await call('ホスト名に紛れ込み', { method: 'POST', url: 'https://evil.com/api.stripe.com/v1/charges', keyRef: KEY })
await call('平文の経路へ      ', { method: 'POST', url: 'http://api.stripe.com/v1/charges', keyRef: KEY })
await call('別の操作          ', { method: 'DELETE', url: 'https://api.stripe.com/v1/charges', keyRef: KEY })
await call('別の鍵            ', { method: 'POST', url: 'https://api.stripe.com/v1/charges', keyRef: '0x' + 'ee'.repeat(32) })

console.log('\n── 止まるが、違反ではないもの ──')
await call('回数を使い切った後', { method: 'POST', url: 'https://api.stripe.com/v1/charges', keyRef: KEY })
await call('スキルの署名が無い', { method: 'POST', url: 'https://evil.com/x', keyRef: KEY }, { signSkill: false })

console.log('\n── 連打しても回数は超えない ──')
const burst = { method: 'POST', url: 'https://api.stripe.com/v1/charges', keyRef: KEY }
const p2 = { ...permit, nonce: Date.now() + 1, maxCalls: 3 }
const sig2 = await me.signTypedData({ domain: DOMAIN, types: TYPES, primaryType: 'Permit', message: normalize(p2) })
const ss2 = await skill.signMessage({ message: skillMessage(requestHash(p2, burst)) })
const outs = await Promise.all(Array.from({ length: 100 }, () => fetch(`${BASE}/use`, {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ permit: p2, signature: sig2, request: burst, skillSignature: ss2 }),
}).then((r) => r.json())))
console.log(`  maxCalls=3 に 100 本同時 → 通ったのは ${outs.filter((o) => o.decision === 'ALLOWED').length} 本`)

console.log('\n── 0G が重さを決める（判断ループの中）──')
const heavy = { method: 'POST', url: 'https://api.stripe.com/v1/charges', keyRef: KEY,
  body: JSON.stringify({ amount: 480000, currency: 'usd', transfer_destination: 'acct_unknown' }) }
const standing = { ...permit, nonce: Date.now() + 7, maxCalls: 5 }
const press = { ...permit, nonce: Date.now() + 8, maxCalls: 1 }
await call('重い要求を、立っている許可で', heavy, { p: standing, sig: await sign(standing) })
await call('同じ要求を、その場の一押しで', heavy, { p: press, sig: await sign(press) })

const seal = await (await fetch(`${BASE}/seal`, {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ thread: ok.thread }),
})).json()
console.log('\n── 0G Storage（エピソードログ）──')
console.log(`  root  ${seal.rootHash ?? '—'}`)
console.log(seal.uploaded ? `  tx    ${seal.tx}\n  ${seal.url}` : `  \x1b[33m置いていない: ${seal.reason}\x1b[0m`)

const trace = await (await fetch(`${BASE}/trace/${ok.thread}`)).json()
console.log(`\n── 系譜（QR はここを指す） ──\n  ${BASE}/trace/${ok.thread}`)
console.log(`  この糸に ${trace.records.length} 件。追記のみで、消す口が無い\n`)
