# `spec/` — the two things that must not drift

These are frozen. Both sides of a signature depend on them being identical.

| File | Why it is frozen |
|---|---|
| `permit-signature.md` | The EIP-712 domain and types. `verifyingContract` is the zero address and `chainId` is 16602. **Changing any of it breaks the device and `ecrecover` at the same time.** §6 holds a cross-side test vector, which `broker/test` checks on every run |
| `world-agent-pass.md` | What Agent Pass actually is (plain OIDC with the `device_code` grant), and why that lets a Broker with no screen reach a human |

If you think something here is wrong, do not edit it — say so, and we change both sides together.
