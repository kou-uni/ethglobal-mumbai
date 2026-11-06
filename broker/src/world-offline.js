// [SIMULATED] A stand-in for when World is unavailable. **It exists only for development.**
// Same promise as the 0G stand-in: it leaves `simulated: true` in the record and says so on screen.
// It only runs when WORLD_OFFLINE=1 is set explicitly. **Not used while filming or submitting.**
import { WORLD_DENIED } from './world.js'

const pending = new Map()
const code = () => Math.random().toString(36).slice(2, 6).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase()

export const offlineWorld = {
  async deviceStart() {
    const deviceCode = 'dev_' + Math.random().toString(16).slice(2, 10)
    const userCode = code()
    pending.set(deviceCode, userCode)
    return { ok: true, simulated: true, deviceCode, userCode, expiresIn: 600, interval: 1,
      verificationUri: `https://world.org/verify?code=${userCode} (simulated)` }
  },
  /** A deviceCode containing `deny` / `expire` lets the refusal paths be shown as they are */
  async waitForHuman(deviceCode) {
    if (String(deviceCode).includes('deny')) return { ok: false, simulated: true, denied: WORLD_DENIED.access_denied, error: 'access_denied' }
    if (String(deviceCode).includes('expire')) return { ok: false, simulated: true, denied: WORLD_DENIED.expired_token, error: 'expired_token' }
    return { ok: true, simulated: true, idToken: 'offline' }
  },
  async verifyIdToken(_t, opts = {}) {
    return { ok: true, simulated: true, nullifier: opts.nullifier ?? '0xsim_' + Math.random().toString(16).slice(2, 10),
      claims: { iss: 'offline', sub: 'simulated' } }
  },
}
