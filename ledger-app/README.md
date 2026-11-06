# Tomoshibi — the Ledger app

A small Rust app for Ledger Flex (and Stax). It does three things:

1. **Shows what is being lent, in words a person can read**, and signs only if they hold the button.
2. **Stays quiet the rest of the time.** A small flame sleeps on the screen.
3. **Shows a refusal in your hand**, on a screen an AI on the PC cannot draw on.

Started from [LedgerHQ/app-boilerplate-rust](https://github.com/LedgerHQ/app-boilerplate-rust) (Apache-2.0).
The signing contract with the Broker is [`spec/permit-signature.md`](../spec/permit-signature.md).

## The screens

| Screen | When | What it says |
|---|---|---|
| Idle | nothing is being asked | sleeping flame, `All quiet.`, how many lights are lit. Tap the flame and it wakes |
| Ask | a Permit arrives | `Lend <key name>?` |
| Review | after Ask | `Goes to` (host) · `Can` (`POST /v1/charges, up to 3x`) · `Ends` (`7 Nov 2026, 09:00 UTC`) · **Hold to light** |
| Lit | the button was held | `A light is lit.` |
| Not lit | declined | nothing was signed |
| Blocked | the Broker refused a request | inverted screen, guard flame, `BLOCKED`, and the reason |
| Went out | a tool's version changed | the light for that version is gone |

Flex is e-ink. The app does a full clean refresh before **Lit** and after **Blocked**, so the
big black areas do not leave a ghost. Other transitions use the fast refresh.

## What is signed

The device computes the EIP-712 digest itself from the fields it shows (`src/eip712.rs`). The PC
never sends a hash to sign. Domain: `Tomoshibi` / `1` / chain `16602` / verifying contract zero.
Path: `m/44'/60'/0'/0/0`. The holder address is derived on the device and returned with the signature.

## APDUs (CLA `E0`)

| INS | | Data |
|---|---|---|
| `03` / `04` | version / app name | — |
| `05` | public key | path |
| `06` | **sign a Permit** | `P1=0`: path. `P1=1..`: JSON chunks `{skill, version, key, target, scope, maxCalls, expiry, nonce}` (`P2=80` more, `00` last). Returns `len ‖ DER signature ‖ parity ‖ holder(20)` |
| `07` | **notice** | `P1=1` blocked, `P1=2` went out. UTF-8 text |

Status words: `6985` declined · `6FAA` a screen is waiting for the person · `5515` device locked.

## Build and run

```bash
docker run --rm -v "$PWD:/app" -w /app ghcr.io/ledgerhq/ledger-app-builder/ledger-app-dev-tools:latest cargo ledger build flex
```

```bash
tools/speculos_walk.sh shots
```

The second command walks every screen in the Speculos emulator and saves a screenshot of each.
`tools/draw_flame.py` redraws the flame glyphs. `tools/apdus.py` prints the APDUs for a Permit.
To talk to the app from HTTP, use [`bridge/`](../bridge/) (on the `minta/screens` branch).

## Checked on a real Flex

- A Permit signed on the device is recovered by the Broker's own code to the device's address.
- All seven screens were shown on the device.
- The four moments (lend → allowed → out of range, `BLOCKED` → heavy request, press again) ran
  end to end with the Broker in simulated mode.

## Limits

- **Notices are not verified.** `07` shows whatever text arrives. A program on the same PC can
  show a false `BLOCKED` or hold back a real one. Signing is not affected: the range on the
  Review screen is what gets signed.
- **Use a development device with an unfunded seed.** This app is sideloaded and unaudited.
- The count of lights on the idle screen lives in RAM and resets when the app closes.
- **Nano X cannot run it.** Nano X does not allow installing apps outside Ledger Live, and it has
  no touch screen. `tools/sideload/` (from the boilerplate) lists the devices that can.
