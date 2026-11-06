#!/usr/bin/env python3
"""Build the two SIGN_PERMIT APDUs (path, then permit JSON) as hex, one per line."""
import json, struct, sys

PATH = [44 | 0x80000000, 60 | 0x80000000, 0x80000000, 0, 0]  # m/44'/60'/0'/0/0

def permit_apdus(permit: dict) -> list[str]:
    path = bytes([len(PATH)]) + b"".join(struct.pack(">I", c) for c in PATH)
    body = json.dumps(permit, separators=(",", ":")).encode()
    if len(body) > 255:
        raise SystemExit("permit JSON is over 255 bytes; split into chunks")
    return [
        (bytes([0xE0, 0x06, 0x00, 0x80, len(path)]) + path).hex(),
        (bytes([0xE0, 0x06, 0x01, 0x00, len(body)]) + body).hex(),
    ]

if __name__ == "__main__":
    permit = json.load(open(sys.argv[1])) if len(sys.argv) > 1 else {
        "skill": "cc" * 32, "version": "1.0.0", "key": "stripe-live",
        "target": "api.stripe.com", "scope": "POST /v1/charges",
        "maxCalls": 3, "expiry": 1794042000, "nonce": 7,
    }
    print("\n".join(permit_apdus(permit)))
