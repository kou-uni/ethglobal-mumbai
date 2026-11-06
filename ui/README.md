# `ui/` — the earlier screen set. **Not the demo being judged.**

**The demo being judged is `web/`**, served at
**https://mintannn.github.io/tomoshibi/start.html**. Decision 14.

`ui/` stays here on purpose, for two reasons:

1. **It is the fallback.** If the judged host is unreachable at 09:30 IST, these pages still open
   from this repository and show the same four refusals.
2. Its links are already in the submission, so **nothing here moves before the deadline.**

| File | What it shows |
|---|---|
| `index.html` | The gate — the four ways a request stops |
| `stars.html` | The flame — stars go out when the version changes |
| `scenes.json` | **Verbatim responses recorded from production 0G.** Do not edit: editing it would falsify a measurement. The Japanese in it is what the model actually returned; the page renders an English gloss beside it |
| `build.mjs` | Builds `index.html` from `index.template.html`. Run it after editing the template, never edit the output |

Live: https://kou-uni.github.io/ethglobal-mumbai/ui/index.html
