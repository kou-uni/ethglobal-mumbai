// 【模擬】World が無いときの替え玉。**開発のためだけにある。**
// 0G の模擬と同じ約束：記録に `simulated: true` を残し、画面にも「模擬」と出す。
// WORLD_OFFLINE=1 を明示したときだけ動く。**撮影・提出では使わない。**
import { WORLD_DENIED } from './world.js'

const pending = new Map()
const code = () => Math.random().toString(36).slice(2, 6).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase()

export const offlineWorld = {
  async deviceStart() {
    const deviceCode = 'dev_' + Math.random().toString(16).slice(2, 10)
    const userCode = code()
    pending.set(deviceCode, userCode)
    return { ok: true, simulated: true, deviceCode, userCode, expiresIn: 600, interval: 1,
      verificationUri: `https://world.org/verify?code=${userCode}（模擬）` }
  },
  /** `deny` / `expire` を含む deviceCode なら、拒否の経路をそのまま出せる */
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
