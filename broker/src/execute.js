// 代理実行 — 鍵は Broker の外（本番は HW / TEE）にあり、平文の鍵はスキルに渡らない。
// スキルが受け取るのは「結果」と「内容証明」だけ。
import { keccak256, toHex } from 'viem'

/** 既定：網に出ない。デモと試験を決定的にするため。 */
export const stubExecutor = async (request) => ({
  status: 200,
  body: JSON.stringify({ stub: true, method: request.method, url: request.url }),
})

export const fetchExecutor = async (request, secret) => {
  const res = await fetch(request.url, {
    method: request.method,
    headers: { authorization: `Bearer ${secret}`, ...(request.headers ?? {}) },
    body: request.body,
  })
  return { status: res.status, body: await res.text() }
}

/** 返ってきた中身のハッシュ。何が返ったかを、後から言い逃れできなくする。 */
export const attest = (out) => ({ status: out.status, bodyHash: keccak256(toHex(out.body ?? '')) })
