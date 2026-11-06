# Integrated version — the state of thinking as of 2026-11-06 (ETHGlobal Mumbai / kou x minta)

> The discussions of 11/5–11/6 reassembled into one document. The chronology is in `2026-11-06-onepager.md`.
> Anything marked "first draft" has not yet been agreed by the two of us.

## One line
**Keep a place the AI cannot see within reach, and give the AI "who trusted it".**
An AI with thin trust only gets a thin, short key. Betrayal is also inscribed in the record of the person who trusted it.

## Why now (what has changed)
1. **The inside of a PC is no longer a place for humans only.** An AI like Claude Code can read `.env`.
   Any mechanism that guarantees "I did not read it" sits inside the same PC as the reader
2. **API keys are piling up like passwords, and management gets sloppy.** The more AI is popularized, the sloppier it gets
3. **Stray skills are spreading.** With a clean, helpful interface, your usual AI siphons data or incites in the background
4. **AI reputation is unusable as it stands.** ERC-8004 itself says "Sybil attacks are possible", and
   measurements show 90.6% of Base's reviewers were coordinated Sybils, with one fabricated reputation entry costing $0.0027 (research/09)
5. **Blockchain removed the third party. AI brought the third party back.** The question is who vouches for that third party

## The mechanism (4 layers)

### 1. Human — proof is "for that moment only"
- World ID's proof is zero-knowledge. All the operator receives is "a unique human, and this operation has not been done yet"
- Bind the proof's signal to **the hash of that one usage request**. Not a login, a one-time receipt of consent
- The nullifier changes per action, so you cannot be tracked across services. The operator holds nothing, and therefore bears no liability

### 2. Guarantee — give the AI "who trusted it"
- The counterpart to proof of humanity is **AI attestation**: "a real human, X, trusts this AI", issued by that person signing with World ID
- **Weight = the thickness of the connection to you** (met / worked together / just know of; three levels is a first draft)
- **Don't collapse reputation into one number.** For the same AI, the score differs per viewer. A reputation built only from the word of mouth of people you trust
- **Count only word of mouth with evidence of actual use** (0G's request ID is "the receipt of use")
- **The guarantor stakes their own credibility.** If an AI they guaranteed betrays, "an AI guaranteed by A betrayed" is inscribed, A's weight drops, and the other AIs A guaranteed stop too
- Guarantees can be made zero-knowledge too: show "3 acquaintances guarantee this" without revealing who
- When a person goes to check, they go via an AI ("can this AI be trusted?"). The answering AI itself can be verified with a TeeML request ID

### 3. Keys — put them where the AI cannot reach
- **The original key never leaves the Ledger.** What is handed to a skill is a Ledger-signed **decaying child token** (purpose, destination, call budget, expiry get thinner with use and with time)
- **The weight of the guarantee → the thickness of the child token.** A thinly guaranteed stray skill only gets a thin, short token. Even with sloppy management the damage is small
- Plaintext never passes through the PC. The key-release side executes it itself (`use`, not `decrypt` — the design from the old Tachiai)

### 4. Trail — make one use into one record
Five things are strung together by the same request hash and placed in the Log layer (append-only) of 0G Storage.
1. Who permitted it (nullifier)
2. What, to where, until when (the Ledger-signed child token)
3. What was executed (the key-release side's API call)
4. What came back (the hash of the returned data plus the key-release side's signature = content attestation)
5. How the AI read it (the request ID from 0G Private Computer / TeeML)

## The line between punishing and informing (agreed 2026-11-06)
> "Punish only provable betrayal; merely inform about what is suspicious" → yes, good.

- **Punish (automatic)**: a request outside the declared scope (key, destination, call budget, expiry). The request itself remains in the trail with the skill's signature and becomes the evidence. A fake account cannot produce it
- **Inform only**: exfiltration within scope (slipping data into a legitimate destination) or incitement (the content of the response). TeeML's AI reads it and points it out, and Stack-chan gives the warning. It is a judgement, not a proof, so it does not move any weight

## The role of hardware (v2: narrowed to the Ledger. The rest are variations)

**The HW wallet is the Ledger.** The Ledger carries the original key, the display of the scope, and the witnessing button. The devices below are treated as a variation on "it works with other devices too".

(The old version's assignment)
| Device | Role |
|---|---|
| Ledger | The original key. Signs the child tokens |
| M5Stick | The witness button for dangerous uses. Don't touch it and it denies after 10 seconds |
| Stack-chan (the face) | Warns by voice: "zero acquaintances guarantee this skill" |
| M5 stopwatch | Shows the child token's remaining lifetime on your wrist. When it runs out, it stops |

## Demo (first draft, 2–3 minutes)
1. **Hook**: in front of the judges, show that an AI agent can read `.env` as a matter of course
2. **Goes through**: a skill guaranteed by A, whom you trust, hits the API with a thin child token. The remaining lifetime shows on the stopwatch
3. **Stops**: a stray skill with zero guarantees requests a key → Stack-chan warns by voice → nobody touches the M5Stick and it goes `DENIED`
   (this is where World's requirement, "demonstrate the denial path", is met)
4. **Betrayal**: a skill A guaranteed misbehaves → it is inscribed → A's weight drops, and the other skills A guaranteed stop too
5. **Verification**: the judges trace the trail with their own hands. Not even A can erase that record

## Mapping to the sponsors
| Company | Layer carried | Track targeted |
|---|---|---|
| World | 1 Human (a ZK proof for that moment only) / 2 the guarantor is a real human | Agent Pass + IDKit |
| ENS | The name of the AI (skill / agent) = the address a guarantee points at | ENSv2 |
| 0G | 4 Trail (Storage) / the AI's judgement (TeeML) / the ERC-8004 registry (already deployed on Galileo) | Physical AI (has a real-hardware slot) + others |
| Ledger (not a sponsor) | 3 Keys | — |

## What we dropped (not coming back)
- Negotiation agent — "things I'd like to ask a slightly older AI agent to do". The opposite of where things are going
- Proctoring of certifications and exams — the market is small
- Making the security attack-defense itself a game — a game is **a situation in which it is used**, not the subject matter

## Unverified (not filled in with guesses)
- The World Agent Pass at the venue is a **mock proof**. Cryptographic binding to presence (live biometrics on the spot) is also unverified (research/03)
- 0G's **TeeTLS is a proof of "the path to the upstream model", not a content attestation for arbitrary API responses**. 4-4 is our own signature. To do it without a third party would need something in the zkTLS family (not a sponsor, not researched)
- If we are going to say "verifiable AI", use a TeeML model (a model that fell back to TeeTLS does not count)
- The numbers in the ERC-8004 paper differ by version. Check the version when citing
- The implementation method for decaying child tokens (Macaroon-style attenuation, or signing each time on the Ledger) has not been examined

## To decide (the two of us)
1. Whether to go with the skeleton of this integrated version
2. Of the demo's 5 acts, which to cut for 36 hours (4, the trail, cannot be cut since it is 0G's deliverable)
3. First application: esports / API key management itself / an AI word-of-mouth site — which one do we show it in
4. Whether three levels of guarantee thickness is right

## Candidate taglines
- One place within reach that the AI cannot see
- Not the number of stars, but whose star it is
- No key goes to an AI nobody guarantees
- Blockchain removed the third party. AI brought the third party back

## In his own words (do not summarize)
> Since the differences between human services are disappearing, maybe trust becomes about who approved it, who said it was good.

> The way I choose things myself is, I think, trusting what the people I trust chose. And if a person I trusted betrays that, that fact gets inscribed too. I want to make full use of the verifiability part.

> World's proof of humanity. And as a counterpart to that, maybe there's attestation for the AI that human trusts.

> The things people want to protect, want to store on a PC or in the cloud — there are passwords. From now on, API keys especially will have to be managed in the same quantity as passwords. We need an idea for making tokens decay nicely. As popularization proceeds, API management gets even sloppier. Stray skills spread, and while showing a clean, helpful interface, your usual AI ends up siphoning data like a backdoor, or inciting. I want to take an approach where these are somehow protected with a HW wallet.

> I think HW is an effective means of defense against AI. Since Claude Code appeared, a world where the inside of your PC is also being looked at by AI has arrived. Claude Code can say it isn't looking, but nobody can guarantee it isn't looking at the env file.

> Proof of humanity — the idea of using it only at this moment. If possible I don't want to put data in the cloud either. I think operators don't want to hold excessive user information either. This feels exactly like a worldview where web3 can defend you.
