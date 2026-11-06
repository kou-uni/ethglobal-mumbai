# Tomoshibi bridge

The Ledger speaks USB. The Broker and the web pages speak HTTP. `bridge.py` sits between
them, on the machine the Ledger is plugged into. It holds no keys and decides nothing.

```bash
pip install hidapi                 # the only dependency
python3 bridge/bridge.py           # http://127.0.0.1:8791
python3 bridge/bridge.py --selftest
```

| | |
|---|---|
| `GET /health` | which app is open on the device (`ready` is true when it is Tomoshibi) |
| `POST /permit` | `{skill, version, keyLabel, target, scope, maxCalls, expiry, nonce}` → the device shows the range; if the person holds the button, returns the signed Permit in the shape of `spec/permit-signature.md` §5. `403` if they decline |
| `POST /notice` | `{kind: "blocked" \| "went-out", text}` → puts a notice on the device screen |

What it does to the device's answer:
- turns the DER signature into `r ‖ s ‖ v` (`v = 27 + parity`), and normalises to the low `s`
- fills `permit.key` with `keccak256(keyLabel)`, the same value the device hashed
- fills `permit.holder` with the address the device reported. **The Broker recovers the signer again and does not trust this field.**

## The four moments with a real Ledger

```bash
cd broker && node src/server.js                 # the Broker
python3 bridge/bridge.py                        # next to the Ledger, Tomoshibi open
cd broker && node demo-ledger.mjs               # standing permit → allowed → blocked → heavy request → press again
```

## Limits

- It listens on `127.0.0.1` only. `--host` can widen that; anyone who can reach it can make the
  device ask its owner for a signature (they cannot sign for them).
- **Notices are not verified by the device.** The text is shown as it arrives. A program on the
  same machine can show a false notice or hold back a real one.
- One exchange at a time. While the device is waiting for a person, other calls get `409`.
