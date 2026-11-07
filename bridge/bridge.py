#!/usr/bin/env python3
"""Tomoshibi bridge: a small local HTTP door to the Ledger on this machine.

The Ledger speaks USB. The Broker and the web pages speak HTTP. This sits between
them on the machine the Ledger is plugged into, and does three things:

    GET  /health   which app is open on the device
    POST /permit   show a range on the device; if the person holds the button,
                   return the signed Permit in the shape of spec/permit-signature.md §5
    POST /notice   put a notice on the device screen (blocked / went-out)

It holds no keys and decides nothing. The device computes the digest and signs;
this only carries bytes and turns the device's DER signature into r ‖ s ‖ v.

    python3 bridge/bridge.py            # listens on 127.0.0.1:8791
    python3 bridge/bridge.py --selftest # check the keccak256 used for key labels

Needs the `hid` module (pip install hidapi). Everything else is the standard library.
"""
import argparse
import json
import struct
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

LEDGER_VENDOR = 0x2C97
APP_NAME = "Tomoshibi"
BUSY = object()  # the app is open but showing a screen that has to finish first
DOMAIN = {"name": "Tomoshibi", "version": "1", "chainId": 16602,
          "verifyingContract": "0x0000000000000000000000000000000000000000"}
PATH = [44 | 0x80000000, 60 | 0x80000000, 0x80000000, 0, 0]  # m/44'/60'/0'/0/0
SECP256K1_N = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141
SW = {0x9000: "ok", 0x6985: "declined", 0x6FAA: "busy", 0x5515: "locked",
      0xB005: "the device could not read the permit", 0xB004: "the permit is too long"}

# ---------------------------------------------------------------- keccak256
_RC = [0x0000000000000001, 0x0000000000008082, 0x800000000000808A, 0x8000000080008000,
       0x000000000000808B, 0x0000000080000001, 0x8000000080008081, 0x8000000000008009,
       0x000000000000008A, 0x0000000000000088, 0x0000000080008009, 0x000000008000000A,
       0x000000008000808B, 0x800000000000008B, 0x8000000000008089, 0x8000000000008003,
       0x8000000000008002, 0x8000000000000080, 0x000000000000800A, 0x800000008000000A,
       0x8000000080008081, 0x8000000000008080, 0x0000000080000001, 0x8000000080008008]
_ROT = [[0, 36, 3, 41, 18], [1, 44, 10, 45, 2], [62, 6, 43, 15, 61], [28, 55, 25, 21, 56], [27, 20, 39, 8, 14]]
_M = (1 << 64) - 1


def _rol(v, n):
    return ((v << n) | (v >> (64 - n))) & _M if n else v


def _permute(a):
    for rc in _RC:
        c = [a[x][0] ^ a[x][1] ^ a[x][2] ^ a[x][3] ^ a[x][4] for x in range(5)]
        d = [c[(x - 1) % 5] ^ _rol(c[(x + 1) % 5], 1) for x in range(5)]
        a = [[a[x][y] ^ d[x] for y in range(5)] for x in range(5)]
        b = [[0] * 5 for _ in range(5)]
        for x in range(5):
            for y in range(5):
                b[y][(2 * x + 3 * y) % 5] = _rol(a[x][y], _ROT[x][y])
        a = [[b[x][y] ^ ((~b[(x + 1) % 5][y]) & b[(x + 2) % 5][y] & _M) for y in range(5)] for x in range(5)]
        a[0][0] ^= rc
    return a


def keccak256(data: bytes) -> bytes:
    """Keccak-256 as Ethereum uses it (not hashlib's sha3_256, which pads differently)."""
    rate = 136
    padded = bytearray(data) + b"\x01" + b"\x00" * ((-len(data) - 2) % rate) + b"\x80" \
        if (len(data) + 1) % rate else bytearray(data) + b"\x81"
    a = [[0] * 5 for _ in range(5)]
    for off in range(0, len(padded), rate):
        block = padded[off:off + rate]
        for i in range(rate // 8):
            a[i % 5][i // 5] ^= int.from_bytes(block[8 * i:8 * i + 8], "little")
        a = _permute(a)
    return b"".join(a[i % 5][i // 5].to_bytes(8, "little") for i in range(4))


def checksum_address(raw20: bytes) -> str:
    h = raw20.hex()
    k = keccak256(h.encode()).hex()
    return "0x" + "".join(c.upper() if c.isalpha() and int(k[i], 16) >= 8 else c for i, c in enumerate(h))


# ---------------------------------------------------------------- the device
class DeviceError(Exception):
    def __init__(self, code, message):
        super().__init__(message)
        self.code, self.message = code, message


# Every call into hidapi happens on this one thread. On macOS, IOKit schedules the HID manager
# on the run loop of the thread that first enumerates; enumerating again from another thread
# (each HTTP request gets its own) crashes the process the moment the device list changes.
_HID = ThreadPoolExecutor(max_workers=1, thread_name_prefix="hid")


def on_hid(fn, *args):
    return _HID.submit(fn, *args).result()


class Ledger:
    """One exchange at a time over USB HID (the framing Ledger devices use)."""
    lock = threading.Lock()

    def __init__(self):
        import hid  # imported here so --selftest works without it
        found = [d for d in hid.enumerate(LEDGER_VENDOR) if d["interface_number"] == 0 or d["usage_page"] == 0xFFA0]
        if not found:
            raise DeviceError(503, "no Ledger is connected to this machine")
        self.h = hid.device()
        self.h.open_path(found[0]["path"])

    def close(self):
        try:
            self.h.close()
        except Exception:
            pass

    def exchange(self, apdu: bytes, timeout_ms=3000) -> bytes:
        data = len(apdu).to_bytes(2, "big") + apdu
        seq, i = 0, 0
        while i < len(data):
            chunk = data[i:i + 59]
            i += len(chunk)
            self.h.write(b"\0" + (bytes([1, 1, 5]) + seq.to_bytes(2, "big") + chunk).ljust(64, b"\0"))
            seq += 1
        first = bytes(self.h.read(64, timeout_ms))
        if not first:
            raise DeviceError(504, "the device did not answer in time")
        n = int.from_bytes(first[5:7], "big")
        out = first[7:]
        while len(out) < n:
            more = bytes(self.h.read(64, timeout_ms))
            if not more:
                raise DeviceError(504, "the device stopped answering")
            out += more[5:]
        return out[:n]

    def app(self):
        r = self.exchange(bytes.fromhex("b001000000"), 2000)
        if len(r) == 2 and int.from_bytes(r, "big") == 0x5515:
            raise DeviceError(423, "the Ledger is locked")
        if len(r) == 2 and int.from_bytes(r, "big") == 0x6FAA:
            return BUSY, None   # Tomoshibi is open, and a screen is waiting for the person
        if r and r[0] == 1:
            name = r[2:2 + r[1]].decode()
            ver = r[3 + r[1]:3 + r[1] + r[2 + r[1]]].decode()
            return name, ver
        return None, None

    def need_app(self, wait_s=90):
        """Make sure Tomoshibi is open and free. If it is showing a screen that
        closes by itself or waits for a tap (lit, blocked), wait for that first."""
        until = time.time() + wait_s
        while True:
            name, _ = self.app()
            if name == APP_NAME:
                return
            if name is not BUSY:
                raise DeviceError(409, f"open {APP_NAME} on the Ledger (it is showing {name or 'something else'})")
            if time.time() > until:
                raise DeviceError(409, "the device is still showing another screen; close it on the device")
            time.sleep(0.5)


def _status(resp: bytes):
    return int.from_bytes(resp[-2:], "big")


def _raise_for(sw):
    if sw == 0x6985:
        raise DeviceError(403, "declined on the device; nothing was signed")
    if sw == 0x6FAA:
        raise DeviceError(409, "the device is showing another screen; finish it first")
    if sw == 0x5515:
        raise DeviceError(423, "the Ledger is locked")
    raise DeviceError(502, SW.get(sw, f"the device answered {sw:04x}"))


def sign_permit(req: dict, wait_s=240) -> dict:
    """Ask the device to show the range and sign it. Blocks until the person
    holds the button, declines, or `wait_s` passes."""
    for f in ("skill", "version", "keyLabel", "target", "scope", "maxCalls", "expiry", "nonce"):
        if req.get(f) in (None, ""):
            raise DeviceError(400, f"missing {f}")
    skill = str(req["skill"]).lower().removeprefix("0x")
    if len(skill) != 64:
        raise DeviceError(400, "skill must be 32 bytes of hex")
    body = json.dumps({"skill": skill, "version": str(req["version"]), "key": str(req["keyLabel"]),
                       "target": str(req["target"]), "scope": str(req["scope"]),
                       "maxCalls": int(req["maxCalls"]), "expiry": int(req["expiry"]),
                       "nonce": int(req["nonce"])}, separators=(",", ":")).encode()
    if len(body) > 510:
        raise DeviceError(400, "the permit is too long for the device (510 bytes)")
    path = bytes([len(PATH)]) + b"".join(struct.pack(">I", c) for c in PATH)
    chunks = [body[i:i + 250] for i in range(0, len(body), 250)]

    with Ledger.lock:
        dev = Ledger()
        try:
            dev.need_app()
            r = dev.exchange(bytes([0xE0, 0x06, 0x00, 0x80, len(path)]) + path)
            if _status(r) != 0x9000:
                _raise_for(_status(r))
            for i, chunk in enumerate(chunks):
                last = i == len(chunks) - 1
                r = dev.exchange(bytes([0xE0, 0x06, i + 1, 0x00 if last else 0x80, len(chunk)]) + chunk,
                                 wait_s * 1000 if last else 3000)
                if _status(r) != 0x9000:
                    _raise_for(_status(r))
        finally:
            dev.close()

    # siglen ‖ DER(r, s) ‖ parity ‖ holder(20) ‖ 9000
    siglen = r[0]
    der, parity, holder = r[1:1 + siglen], r[1 + siglen], r[2 + siglen:22 + siglen]
    rl = der[3]
    rr = int.from_bytes(der[4:4 + rl], "big")
    sl = der[5 + rl]
    ss = int.from_bytes(der[6 + rl:6 + rl + sl], "big")
    if ss > SECP256K1_N // 2:  # Ethereum wants the low s; flipping s flips the parity
        ss, parity = SECP256K1_N - ss, parity ^ 1
    signature = "0x" + rr.to_bytes(32, "big").hex() + ss.to_bytes(32, "big").hex() + f"{27 + parity:02x}"
    holder_addr = checksum_address(holder)
    return {
        "permit": {"holder": holder_addr, "skill": "0x" + skill, "version": str(req["version"]),
                   "key": "0x" + keccak256(str(req["keyLabel"]).encode()).hex(),
                   "target": str(req["target"]), "scope": str(req["scope"]),
                   "maxCalls": int(req["maxCalls"]), "expiry": int(req["expiry"]), "nonce": int(req["nonce"])},
        "domain": DOMAIN,
        "signature": signature,
        "signer": holder_addr,   # what the device says it is; the Broker recovers it again and does not trust this
        "source": "ledger-app",
        "keyLabel": str(req["keyLabel"]),
    }


def notice(kind: str, text: str) -> dict:
    p1 = {"blocked": 1, "went-out": 2}.get(kind)
    if not p1:
        raise DeviceError(400, "kind must be 'blocked' or 'went-out'")
    body = str(text).encode()[:250]
    with Ledger.lock:
        dev = Ledger()
        try:
            dev.need_app()
            r = dev.exchange(bytes([0xE0, 0x07, p1, 0x00, len(body)]) + body, 5000)
        finally:
            dev.close()
    if _status(r) != 0x9000:
        _raise_for(_status(r))
    # The device shows this text as it arrives. It does not verify who sent it.
    return {"shown": True, "verifiedByDevice": False}


def health() -> dict:
    with Ledger.lock:
        dev = Ledger()
        try:
            name, ver = dev.app()
        finally:
            dev.close()
    if name is BUSY:
        return {"ok": True, "app": APP_NAME, "version": None, "ready": False, "busy": True}
    return {"ok": True, "app": name, "version": ver, "ready": name == APP_NAME}


# ---------------------------------------------------------------- HTTP
class Handler(BaseHTTPRequestHandler):
    def _send(self, code, body):
        raw = json.dumps(body, ensure_ascii=False, indent=2).encode()
        self.send_response(code)
        self.send_header("content-type", "application/json; charset=utf-8")
        self.send_header("access-control-allow-origin", "*")
        self.send_header("access-control-allow-headers", "content-type")
        self.send_header("content-length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def _run(self, fn):
        try:
            self._send(200, on_hid(fn))
        except DeviceError as e:
            self._send(e.code, {"ok": False, "error": e.message})
        except Exception as e:  # a USB hiccup should not take the bridge down
            self._send(502, {"ok": False, "error": f"{type(e).__name__}: {e}"})

    def do_OPTIONS(self):
        self._send(204, {})

    def do_GET(self):
        if self.path.split("?")[0] == "/health":
            if Ledger.lock.locked():   # a permit or notice is on the device: answer at once, do not queue behind it
                return self._send(200, {"ok": True, "app": APP_NAME, "version": None, "ready": False, "busy": True})
            return self._run(health)
        self._send(404, {"error": "not found"})

    def do_POST(self):
        n = int(self.headers.get("content-length") or 0)
        try:
            body = json.loads(self.rfile.read(n) or b"{}")
        except Exception:
            return self._send(400, {"error": "the body is not JSON"})
        route = self.path.split("?")[0]
        if route == "/permit":
            return self._run(lambda: sign_permit(body))
        if route == "/notice":
            return self._run(lambda: notice(body.get("kind"), body.get("text", "")))
        self._send(404, {"error": "not found"})

    def log_message(self, fmt, *args):
        sys.stderr.write("%s %s\n" % (time.strftime("%H:%M:%S"), fmt % args))


def selftest():
    assert keccak256(b"").hex() == "c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470"
    assert keccak256(b"STRIPE_SECRET").hex() == "6d5f7d408f4fb5f31403c52734dad9172da58198ab1599f5b0b9754e79d37148"  # spec §6
    assert keccak256(b"a" * 135).hex() == keccak256(b"a" * 135).hex() and len(keccak256(b"a" * 136)) == 32
    assert checksum_address(bytes.fromhex("87b5f1a0e0f45b9806dbcf8244dbb1f0ce1aafeb")) == "0x87b5f1a0e0F45B9806dbCf8244dbB1f0CE1aaFeb"
    print("selftest ok")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--host", default="127.0.0.1", help="address to listen on (default: this machine only)")
    ap.add_argument("--port", type=int, default=8791)
    ap.add_argument("--selftest", action="store_true")
    args = ap.parse_args()
    if args.selftest:
        selftest()
        sys.exit(0)
    print(f"tomoshibi bridge on http://{args.host}:{args.port}  (Ledger app: {APP_NAME})", flush=True)
    ThreadingHTTPServer((args.host, args.port), Handler).serve_forever()
