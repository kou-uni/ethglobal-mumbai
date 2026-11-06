// Proxied execution — the key lives outside the Broker (HW / TEE in production) and the plaintext key
// never reaches the skill. All the skill receives is the result and an attestation of its contents.
import { keccak256, toHex } from 'viem'

/** Default: no network. Keeps the demo and the tests deterministic. */
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

/** Hash of the body that came back, so nobody can argue later about what was returned. */
export const attest = (out) => ({ status: out.status, bodyHash: keccak256(toHex(out.body ?? '')) })
