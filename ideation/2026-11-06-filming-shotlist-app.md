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

Every TOMOSHIBI screen shows its value in the bar under the name (for example **No hold, no money.**). If the voice
says only one thing per shot, let it be that line.

| # | Screen | What you do | One line to say |
|---|---|---|---|
| 1 | AI chat | Nothing. Let the `.env` message sit for two seconds | "My AI asks me to put a key in a file. Which file? Where?" |
| 2 | AI chat | **Send**, then **Approve in TOMOSHIBI** | "I say: use TOMOSHIBI. No file." |
| 3 | Welcome | **Let's go** | "Three small steps." |
| 4 | Custody | **Use a test key**, **Keep it with me** | "The key stays here. The AI gets a handle, never the key." |
| 5 | Choose | **Continue on my Ledger** | "I never hand the key over. I hand over one use of it." |
| 6 | **Continue on your Ledger** | Camera on the device: **See it**, read, **hold three seconds** | "Nothing starts until I hold. The AI cannot press this." |
| 7 | Permit signed | **Back to Billing assistant** | "Signed. I pasted once, signed one permit, and held." |
| 8 | AI chat | Press `1` | "An ordinary request goes through. Nobody asks me." |
| 9 | AI chat → toast | Press `2`, click the toast, camera on the device, **hold** | "Money is about to move, so it waits for my hand. One hold, one refund." |
| 10 | TOMOSHIBI | Press `3` | "At 3 a.m. the AI makes a mistake. It is stopped, and I did nothing." |
| 11 | Trail | Click **Trail** | "The trail in three numbers. I can say what was stopped, and whose code tried it." |
| 12 | Flame | Click **Flame**, **Light a star with World**, scan the code with World App, **Confirm** | "It worked for me, so I light a star. One real person, who owned the key and used it." |
| 13 | Flame (sample) | **Later: a friend chooses** in the bottom bar, then **Use it with TOMOSHIBI** | "My friend chooses by whose star it is, not by how many." |

Shots 6 and 9 are the centre of the film: keep the device and the screen in the same frame if you can.

## If 0G is down

(On 2026-11-06 the model the Broker was measured on left 0G; `tools/demo-up.sh` now picks its sealed sibling.)
The app shows **No verdict. Nothing ran.** That is the product working, and it is worth ten seconds on camera
(press `5` shows the same screen on purpose). But shots 8, 9 and 12 need a verdict. Wait and try again; do not
switch the Broker to simulated mode for the film without saying so on screen.

## What is sample data

Shot 13 only (the bar says `SAMPLE`). Everything else is live when the check says so.
