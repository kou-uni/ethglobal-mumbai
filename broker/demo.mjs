#!/usr/bin/env node
// 1コマンドで、通る／止まるの両方を出す。 node demo.mjs [http://127.0.0.1:8787]
import { privateKeyToAccount } from 'viem/accounts'
import { DOMAIN, TYPES, normalize, lines } from './src/permit.js'

const BASE = process.argv[2] ?? 'http://127.0.0.1:8787'
const me = privateKeyToAccount('0x' + '11'.repeat(32))
const KEY = '0x' + 'ab'.repeat(32)

const permit = {
  holder: me.address, skill: '0x' + 'cc'.repeat(32), version: '1.0.0', key: KEY,
  target: 'api.stripe.com', scope: 'POST /v1/charges', maxCalls: 2,
  expiry: Math.floor(Date.now() / 1000) + 3600, nonce: Date.now(),
}
const signature = await me.signTypedData({ domain: DOMAIN, types: TYPES, primaryType: 'Permit', message: normalize(permit) })

console.log('\n── 端末に出る4行（これと同じ値から32バイトが作られる） ──')
console.log(lines(permit).map((l) => '  ' + l).join('\n'))

const call = async (label, request) => {
  const r = await fetch(`${BASE}/use`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ permit, signature, request }),
  })
  const b = await r.json()
  const tag = b.decision === 'ALLOWED' ? '\x1b[32mALLOWED\x1b[0m' : '\x1b[31mDENIED \x1b[0m'
  console.log(`  ${tag} ${label}` + (b.decision === 'ALLOWED' ? `  残り ${b.remaining}` : `  ${b.reason} — ${b.message}`))
  return b
}

console.log('\n── 範囲の中 ──')
const ok = await call('POST api.stripe.com/v1/charges', { method: 'POST', url: 'https://api.stripe.com/v1/charges', keyRef: KEY })
await call('POST api.stripe.com/v1/charges', { method: 'POST', url: 'https://api.stripe.com/v1/charges', keyRef: KEY })

console.log('\n── 範囲の外（宣言した範囲を外れた要求。証拠ごと刻まれる） ──')
await call('回数を使い切った後', { method: 'POST', url: 'https://api.stripe.com/v1/charges', keyRef: KEY })
await call('別の宛先へ        ', { method: 'POST', url: 'https://evil.com/v1/charges', keyRef: KEY })
await call('ホスト名に紛れ込み', { method: 'POST', url: 'https://evil.com/api.stripe.com/v1/charges', keyRef: KEY })
await call('別の操作          ', { method: 'DELETE', url: 'https://api.stripe.com/v1/charges', keyRef: KEY })
await call('別の鍵            ', { method: 'POST', url: 'https://api.stripe.com/v1/charges', keyRef: '0x' + 'ee'.repeat(32) })

const trace = await (await fetch(`${BASE}/trace/${ok.thread}`)).json()
console.log(`\n── 系譜（QR はここを指す） ──\n  ${BASE}/trace/${ok.thread}`)
console.log(`  この糸に ${trace.records.length} 件。追記のみで、消す口が無い\n`)
