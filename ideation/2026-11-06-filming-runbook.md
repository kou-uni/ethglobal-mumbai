# Filming runbook (minta's part) — 2026-11-06

The script is [storyboard v3](2026-11-06-storyboard.md). This sheet covers only "on the day, which machine do I type what on, and what do I point the camera at."
**What is not done is written as not done.** What has been confirmed working is in §6.

---

## 1. Where the script and the real thing diverge (want to settle this with Kou first)

The real device's screen was built as **a small flame**, not a "constellation" (minta decided this after #11).
Storyboard v3 is still written in star language. **If the subtitles and the text on the device disagree, we reshoot.**

| Storyboard v3 | What the real device shows now | Proposal |
|---|---|---|
| Idle: "your sky" constellation, "2 stars" | A sleeping flame, `All quiet.`, `N lit` in the bottom right | Match the device |
| Permit: four lines of scope (KEY/TO/SCOPE/UNTIL) | Heading `Lend <key name>?`, rows `Goes to` / `Can` / `Ends` | Match the device |
| Long-press to sign | `Hold to light` (long press) | Same |
| The ★ stamp, "you have become a star" | A happy flame, `A light is lit.` | Match the device |
| Black-and-white inversion, ✕ and `DENIED` | Black-and-white inversion, a flame standing guard, `BLOCKED` | Change the subtitle to `BLOCKED` |
| (none) | A picture of a flame going out, `went out` (notification that the tool's version changed) | Can be used in the 2:18 scene |

**There is one proposal: the sky on the PC stays "stars," and the Ledger in your hand becomes "flames."**
A star you can buy is a cold dot. Only a tool that someone you know is actually using becomes a warm flame.
Screen A (the sky) already works this way (`Everyone` is 1,284 white dots, `People I know` is flames).
The tagline "not how many stars, but whose stars" does not need to change. For the closing line, "turn buyable stars into unbuyable flames" is a candidate.

## 2. What runs on which machine

| What to run | Machine | Why |
|---|---|---|
| Broker (`broker/`) | Kou's machine | The 0G and World keys are in `broker/.env.local` |
| bridge (`bridge/bridge.py`) | **The machine with the Ledger plugged in** | This is the only thing that speaks USB |
| Screens A and C (`web/`) | The PC in the background of the shot | Anywhere is fine |

**Undecided: the Broker and the bridge end up on different machines.** The current Broker and bridge listen on `127.0.0.1`.
**For filming it is safer to put everything on one machine** (plug the Ledger into Kou's machine. All that is needed is `pip install hidapi`).
If we split across two machines, open the screens with `?broker=http://<Kou's machine>:8787` and we need a change to expose the Broker on the LAN.

### Making the QR openable from phones at the venue (public screens + a tunnel)

The screens are hosted at `https://mintannn.github.io/tomoshibi/`. If you run a tunnel on the machine running the Broker,
the Broker gets a public HTTPS URL (no account needed; the key never leaves the machine).

```bash
brew install cloudflared
```

```bash
cloudflared tunnel --url http://127.0.0.1:8787
```

Take the `https://….trycloudflare.com` that comes out and append it to the screen's `?broker=`. The QR on the records screen becomes that public link.
**The URL changes every time you start it. Stopping the machine breaks it.** On 11/6, with a simulated Broker, we confirmed that it is readable from the public screens and that **the records really do open from the QR on an actual phone**.

### Running it through the production 0G (Kou's machine, Decisions 13–15)

Two Brokers are running on Kou's machine: **8797 = production 0G**, **8798 = the one deliberately playing "0G unreachable."** Plug the Ledger into that machine and add the following.

```bash
python3 bridge/bridge.py
```

```bash
cd broker && node demo-agent.mjs http://127.0.0.1:8797 http://127.0.0.1:8791 http://127.0.0.1:8798
```

```bash
python3 -m http.server 8790 --directory web
```

Open `http://localhost:8790/gate.html`. `L` to lend (one long press; scope is `* /v1`). `1` reads the balance (routine) → `2` a $4,800 charge (long press) → `3` hijack (BLOCKED on the real device) → `5` 0G unreachable (STOPPED).
After that, use `Show that you use it →` on the key screen to move to the flames screen and declare yourself with World. **This screen is the star of the video** (Decision 14). `ui/index.html` is the backup.

## 3. To do 30 minutes before filming

1. **Set FLEX auto-lock to 10 minutes** (Settings → Lock screen). The default is short and it will lock during filming.
2. Charge the FLEX. Use a **data** cable (a charge-only cable will not be recognized).
3. Open Tomoshibi on the FLEX. A sleeping flame showing is enough.
4. Start the three services.

```bash
cd broker && node src/server.js
```

```bash
python3 bridge/bridge.py
```

```bash
python3 -m http.server 8790 --directory web
```

5. **Check that it is not in simulation.** If `simulated` appears, that is not the real 0G / World.

```bash
curl -s http://127.0.0.1:8787/health
```

```bash
curl -s http://127.0.0.1:8791/health
```

   The second one must be `"ready": true`.

6. Open `http://localhost:8790/` in a browser. The top right must say `Broker · live` (`simulated mode` and `sample data` are not production).
7. **Do one full pass** (in the order of §4). The Ledger's `N lit` and the record count go up here. Note the numbers down before the real take.

## 4. Steps for each scene

| Script | What to shoot | Who does what |
|---|---|---|
| **S1 Silence** 0:20 | Background: screen A on `Everyone`. Foreground: the sleeping flame | Do nothing. Do not touch the Ledger |
| **A close-up** 0:30 | Screen A | Press `People I know`. The white dots disappear, leaving only the flames |
| **A detail** 0:52 | Screen A | Press one flame. Who / what / three circles |
| **S2 Birth** 1:08 | **The Ledger and the PC in the same frame** | On screen A's detail view, `Show that I use this` → the scope appears on the Ledger → **long press** → `A light is lit.` → confirmation by a person on the screen → one more flame in the sky |
| **S3 Routine** 1:38 | The sleeping flame, unchanged | The first half of `demo-ledger.mjs` below. The Ledger does not ask |
| **S4 Refusal** 1:48 | The Ledger macro | `demo-ledger.mjs` sends an out-of-scope request → black-and-white inversion and `BLOCKED`. **Keep fingers out of frame** |
| **A wide** 2:18 | Screen A | Press `Demo: the tool changes`. All flames on that version go out at once |
| **S5 In hand** 2:36 | Phone | Open the records (screen C) on the PC → scan the QR at the bottom with a phone → the same records appear in your hand (conditions in §5) |

S3 and S4 happen in sequence from a single script. There are two long presses (the initial permit, and the heavy request).

```bash
cd broker && node demo-ledger.mjs
```

At the end of the output a `…/trace/0x…` appears. Append that `0x…` to `http://localhost:8790/trace.html?thread=0x…` and open it to get the records for S5.

## 5. What is not done yet

| What is not done | Effect on filming | What to do |
|---|---|---|
| **The records QR only works inside the same Wi-Fi** | If a judge's phone is on a different venue network, it will not open | We put a QR on the records screen (homemade, no external library). Open it with the PC's network address, or append `&lan=<address>`. **Shoot with our own phone** |
| **Flames are not linked to the Ledger permit** | Two of the three circles stay dark | The screen says so. Say it out loud too. It needs a change on the Broker side |
| **The device does not verify notifications** | `BLOCKED` can be forged by any program on the same PC | It is in the README. Do not hide it if asked |
| **Unverified against the real 0G / World** | Only ever run through simulation | Do the §3 pass on the machine that has Kou's keys |
| **Gas** | Cannot write to 0G Storage | The balance of `0xdfcb…42A4` is 0 (11/6 02:00 UTC). The faucet requires a person to press it |

## 6. What has been confirmed

- Signed on the real FLEX device, and the Broker's code recovered the signer (`0x87b5…aFeb`).
- All four moments worked on the real device (permit → goes through → `BLOCKED` when out of scope → press again for a heavy request). The Broker was in simulation mode.
- **Button on screen A → long press on the real FLEX → confirmation by a person → one more flame in the sky: this worked** (11/6 02:09 UTC. The Broker was in simulation mode). S2 can be shot in this flow.
- The Broker's 50 tests pass.

## 7. Notes on the shot

- The FLEX is e-paper. **It does not light itself.** Put soft light on it at an angle. Lighting directly overhead reflects.
- The screen briefly inverts to black-and-white when it changes. We did not remove this (as in storyboard v3 §1, it stays as evidence).
  However, just before `A light is lit.` and just after `BLOCKED`, we redraw the whole screen to clear the ghosting.
- **Do not substitute a PC capture for the real device's screen.**
