# The 90-second walkthrough — what is on screen, and what to say

Made by `node tools/walkthrough.mjs out.mp4`: the real app, driven click by click, with one caption line under it.
The captions carry the story on their own; the lines below are for a real voice over the same picture.
Nothing in it is faked: where a part is a stand-in, the app itself says `MOCK` on the screen.

The order is the journey: **who she is → what bothers her → what she does → what TOMOSHIBI does (five things) → what she gets.**

| Time | On screen | Caption | Say |
|---|---|---|---|
| 0:00 | Title card | The switchboard between your AI tools and your API keys | "This is TOMOSHIBI, in ninety seconds." |
| 0:04 | The chat | **WHO** Priya builds AI tools. Today: a billing tool on Stripe. | "Priya builds AI tools. Today it is a billing tool on Stripe." |
| 0:08 | The `.env` message | **THE PROBLEM** Her AI wants the Stripe key in a .env file. One more key, in one more file. | "And the AI asks for what every tool asks for: her API key, in a .env file. Another key, in another file, good for everything, forever." |
| 0:13 | She sends the link; four ticks | **WHAT SHE DOES** She sends one link instead. The AI reads it, and decides to go through TOMOSHIBI. | "So she sends one link. The AI reads it, sees that Stripe is supported, and decides to go through TOMOSHIBI instead." |
| 0:21 | Welcome | **TOMOSHIBI** It sits between her tools and her keys. A tool calls by label; the key stays here. | "TOMOSHIBI sits between her tools and her keys." |
| 0:26 | Add a row; the list of APIs | **1 · ADD A ROW** Only supported APIs… Stripe is on the list, so it already knows where the key goes. | "She adds a row. Only supported APIs: Stripe works today, and TOMOSHIBI already knows where a Stripe key may go. She parks the key once." |
| 0:36 | Approve | **2 · APPROVE** Only her Ledger can add the row. An AI cannot press this button. | "The row is only added when she holds the button on her Ledger. That is the one button an AI cannot press." |
| 0:42 | The label | **THE LABEL** Her tool gets a label, never the key. The .env file can go. | "Her tool gets a label. Never the key. The .env file can go." |
| 0:49 | A routine call; Home | **3 · A ROUTINE CALL** The label goes in, the key is swapped in, the answer comes back. She is not asked. | "A routine call. 0G weighs it. The label goes in, the key is swapped in at the last moment, the answer comes back. She is not asked." |
| 0:59 | A refund waits; she holds | **4 · A HEAVY CALL** A refund is heavy. A sealed model on 0G says so, and it waits for her Ledger. | "A refund is different. A sealed model on 0G says it is heavy, so it waits for her Ledger. One hold, and it goes out once." |
| 1:10 | Refused | **5 · REFUSED** Another destination? This label only reaches Stripe. Refused, and recorded. | "And if the tool reaches for somewhere else, this label only goes to Stripe. Refused, and recorded." |
| 1:16 | Trail | **THE TRAIL** Every call, put through or refused, with its reason. | "Every call is on the trail, with its reason." |
| 1:21 | Lights | **THE VALUE** She lights the tool she built. World says: one real person. The trail says: she really runs it. | "Then the part that pays her back. She lights the tool she built. World says she is one real person; the trail says she really runs it." |
| 1:26 | What someone else sees (`MOCK`) | **THE VALUE** Others choose a tool by who built it, and who really runs it. Every light is trust in her as a builder. | "Other people choose tools by that. Every light is trust in her, as a builder." |
| 1:33 | End card | No key in a .env file. Heavy calls wait for a human. Trust that cannot be bought. | "No key in a .env file. Heavy calls wait for a human. Trust that cannot be bought." |

## Taking it for real

On the laptop with the Ledger: `BRIDGE_PORT=8793 tools/demo-up.sh`, then

```
HEADFUL=1 node tools/walkthrough.mjs walkthrough.mp4
```

- A window opens and plays the walkthrough. When the *Add a row* screen is up, paste the Stripe test key into it
  (the recording pauses while it waits). Without `HEADFUL=1` the mock key is used and the page says `MOCK`.
- At *Approve* and at the refund, hold the button on the Ledger when it shows the four lines. The recording waits for the
  real hold and leaves the waiting out. With no Ledger connected, the page's stand-in button is pressed and the page
  says `MOCK`.
- The camera shot of the hand on the Ledger is not in this video. Film it separately and lay it over 0:36 and 0:59.
