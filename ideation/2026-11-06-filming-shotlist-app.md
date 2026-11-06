# Filming with the app (`web/app.html`) — shot list (2026-11-06)

Replaces the screen order in `2026-11-06-filming-runbook.md`. The rules there still hold: 2–4 minutes,
720p or better, a real voice, no music. Storyboard with the story text: `2026-11-06-app-flow-pc.html`.

## Before the camera rolls

1. On the Air: `BRIDGE_PORT=8793 tools/demo-up.sh`, then read the check. It must end with **Ready. Nothing is simulated.**
   `SIM` on any line means that service is simulated: do not film until it says `ok`.
2. Ledger: plugged in, unlocked, **TOMOSHIBI open** (the sleeping flame). The bottom bar of the app says *Ledger connected*.
3. Chrome on the Air: `http://localhost:8790/app.html`. Press **Start over** once. Zoom so the frame fills the screen.
4. Phone: World App signed in, on the same table.
5. The permit needs a real hold: after **Start over** the earlier permit is gone. That is shot 6.
6. Ask 0G once before filming (press `1` after signing the permit, then **Start over**). If the answer is *STOPPED*, 0G is
   not answering: see "If 0G is down".

## The shots

The person is a builder: Priya builds `billing-assistant` with an AI, and is tired of keeping API keys in `.env` files.
Every TOMOSHIBI screen shows its value in the bar under the name. If the voice says only one thing per shot, let it be that line.

| # | Screen | What you do | One line to say |
|---|---|---|---|
| 1 | AI chat | Nothing. Let the `.env` message sit for two seconds | "My AI wants my Stripe key in a .env file. Another key, another file." |
| 2 | AI chat | **Send**. Wait while it reads the link (four ticks). Then **Add the row in TOMOSHIBI** | "I send it the TOMOSHIBI link. It reads it, sees Stripe is supported, and decides to go through TOMOSHIBI." |
| 3 | Welcome | **Start** | "TOMOSHIBI is the switchboard between my tools and my keys." |
| 4 | Add a row | Open the **API** list once (the others say *not supported yet*), keep Stripe. Paste your Stripe **test** key (`sk_test_…`; without one, **Use a mock key** and the page says MOCK). Look at label, goes to, until. **Approve on my Ledger** | "Stripe is on the list, so it already knows where the key goes. I park the key once." |
| 5 | **Approve** | Camera on the device: **See it**, read, **hold three seconds** | "Only my Ledger can add a row. The AI cannot press this." |
| 6 | The label | Read the code box. **Back to the AI** | "My tool gets a label, never the key. I can delete the .env file." |
| 7 | AI chat, then Home | Press `1`. Click the **tomoshibi** tab | "A routine call is put through: the label goes in, the key is swapped in, Stripe's answer comes back. Nobody asks me." |
| 8 | AI chat → toast | Press `2`, click the toast, camera on the device, **hold** | "A refund is heavy, so it waits for my Ledger. One hold, and it goes out once." |
| 9 | TOMOSHIBI | Press `3` | "The tool tries another destination. This label only reaches Stripe, so it is refused, and I did nothing." |
| 10 | Trail | Click **Trail** | "Every call, put through or refused, with its reason. Sealed in 0G Storage." |
| 11 | Lights | Click **Lights**, **Light it with World**, scan the code with World App, **Confirm**, go back to World's page on the phone | "It works for me, so I light the tool I built. World says I am one real person; the trail says I really ran it." |
| 12 | Lights (sample) | **Later: someone chooses** in the bottom bar, then **Use it with TOMOSHIBI** | "Arjun picks my tool because I built it and I run it. Every light is trust in me as a builder." |

Shots 5 and 8 are the centre of the film: keep the device and the screen in the same frame if you can.

## If 0G is down

(On 2026-11-06 the model the Broker was measured on left 0G; `tools/demo-up.sh` now picks its sealed sibling.)
The app shows **No verdict. Nothing ran.** That is the product working, and it is worth ten seconds on camera
(press `5` shows the same screen on purpose). But shots 8, 9 and 12 need a verdict. Wait and try again; do not
switch the Broker to simulated mode for the film without saying so on screen.

## What is sample data

Shot 13 only (the bar says `SAMPLE`). Everything else is live when the check says so.
