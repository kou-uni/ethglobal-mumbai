# The README loop — before / after, design before building

**What this is:** the moving thing at the top of the README. **It is not the demo video.**
The demo video is `2026-11-06-storyboard.md` §5 (2:55, voice, uploaded to ETHGlobal). This one has
no sound, loops forever, and has about **four seconds** to make someone understand the product
before they scroll.

---

## 1. The constraints, which decide most of the design

| Constraint | Consequence |
|---|---|
| GitHub **strips animation from SVG** in a README | It has to be a **GIF**. `ffmpeg` with `palettegen`/`paletteuse` is available |
| A README GIF **autoplays and loops, with no controls** | No build-up. **Every loop must start from a state that explains itself** |
| **No audio, ever** | Every idea has to survive as text on screen |
| Rendered at roughly **900 px wide**, often on a phone | Draw at **1200×600**, minimum type size ~28 px. Two columns means ~550 px each |
| People scroll | **Under 15 seconds and under 5 MB**, or it is a wall |
| It must not drift from the product | **Generate it from a script**, the way `build-business-model.py` generates the figures |

## 2. The three candidate designs

### A. Split screen, three beats, ~12 s · **recommended**

Left is with TOMOSHIBI, right is without. The same story runs in both columns at the same time.

| | Left — with it | Right — without it |
|---|---|---|
| **0:00–0:04** | A tool asks for your payment key. You lend **one use**: this host, this operation, 5 calls, until Friday | A tool asks for your payment key. You **paste `sk_live_…`** into a chat box |
| **0:04–0:08** | The tool is updated and tries a different host. **BLOCKED** — named, and recorded against the tool's own signature | The same request. It **goes through.** $4,800 moves |
| **0:08–0:12** | Morning: **"2 things were stopped. You were asked once."** | Morning: **"✓ done · ✓ done · ✓ done"** — nothing to read, nothing to check |
| **hold 2 s** | **Don't hand over the key. Approve one use at a time.** | |

**Why this one.** The product is a *refusal*, and a refusal is invisible unless you can see the
same moment without it. The right-hand column is what makes the left column mean anything. It also
holds the three things we most want believed — scope, a named stop, and a morning you can read —
without showing a single step of procedure.

**The risk:** two columns of text at 550 px is tight. Mitigation: **never more than one line of
new text per column per beat**, and the left and right lines sit at the same height so the eye
compares them instead of reading them.

### B. One column, "key versus permit", ~6 s

A `sk_live_…` string on screen, then it is replaced by the four signed lines. Short, very legible,
no second column to fight for space.

**Rejected as the main loop:** it shows what we replace, but not what it buys you. Nothing stops,
nothing is recorded, and the flame never appears. It is a good *second* image further down the
README, not the top one.

### C. A real screen recording of the two cases side by side

The most honest option: it is literally the product.

**Rejected for the top:** at 550 px a real UI is unreadable, it needs the Broker running to
reproduce, and it would have to be re-recorded every time a screen changes. **This is what the
2:55 demo video is for.** Honesty at full size, clarity at thumbnail size — different jobs.

## 3. Look

From `web/pop.css`, so the loop and the product are the same thing:

- Ground `#FBF7F1` · ink `#1B1630` · muted `#726C88`
- **Flame `#F2600C`** — the one that goes through, and the product itself
- **Cold `#3B5BDB`** — stopped · **Danger `#D92D20`** — blocked · **Green `#0E9F6E`** — allowed
- Rounded sans, flat: **no shadows, no outlines, no gradients, no logo animation.** Colour is the surface
- The only glyph is 🕯️. No borrowed words or symbols

**The right-hand column is not drawn as "evil".** It is drawn as ordinary and slightly convenient,
because that is why people do it. It only looks bad in the third beat, and only because of what it
cannot tell you.

## 4. How it gets built, once the design is agreed

1. `ideation/build-readme-loop.py` writes a self-contained HTML timeline (one keyframe per beat)
2. Chrome headless screenshots **N frames at 1200×600, `deviceScaleFactor: 1`**
3. `ffmpeg -i frame%03d.png -vf palettegen` then `paletteuse` → `assets/readme-loop.gif`
4. **Look at the GIF** before committing — the figure legend overlapping the year labels in the
   business-model page was only caught by opening the image, not by trusting the generator
5. `README.md` gets it directly under the title, above the pitch blockquote

**Frame rate:** 12 fps is enough — the beats are holds, not motion. Three beats plus the hold at
roughly 12 fps and 1200×600 should land near 2–3 MB.

## 5. What has to be decided before building

1. **A or B or C** (recommendation: **A**)
2. **Does the flame appear at all?** Three beats is already the limit; adding "stars go out when
   the version changes" makes four and pushes past 15 s. **Proposal: leave it out of the loop** and
   let the second beat's `BLOCKED` carry the weight. The flame has its own screen and its own
   section in the README
3. **$4,800 or the refund?** The demo script moved to a **refund**, because money leaving your own
   account needs no explanation. The loop has no narration, so the bigger, blunter number may read
   faster here. **Proposal: use the refund, to stay consistent with the video**
