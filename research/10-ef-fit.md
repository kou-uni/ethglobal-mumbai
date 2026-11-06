# Fit with the EF (Ethereum Foundation) prizes (2026-11-06)

> How this was made: a subagent read the primary sources (official docs, GitHub, the ETHGlobal prize pages) and reported back. [verified] means read in a primary source; [unverified] means not confirmed.

## Conclusion
**Fit order is CROPS > Anon-RPC > Alt mempool.** The chain can stay 0G.
**EF gives one prize per project**, so enter both CROPS and Anon-RPC and let the judges pick.

**The main bet is CROPS.** Its requirements are about "how you build" (public repository, a README section, a license, no trackers, keys inside the device),
and **they overlap with what we are already doing. Roughly one extra hour of work.** Add Anon-RPC only if #6 passes within 30 minutes.

| # | Prize | Total / slots (**amount for 1st**) | Fit | Changes needed |
|---|---|---|---|---|
| 1 | Best CROPS App | $3,500 / 3 slots (**$2,000** / 1,000 / 500) | High | A CROPS section in the README (1–2 lines for each of the four letters; the Private line states what the Ledger, World and 0G each learn), an OSS license, no trackers, a demo video of 3 minutes or less |
| 2 | Best Use of Anon-RPC | $5,000 / 3 slots (**$2,500** / 1,500 / 1,000) | Medium to high | Make star reads go through Anon-RPC by default. Fetch everything and filter on the device |
| 3 | Alt mempool | $5,000 / 3 slots (**$2,500** / 1,500 / 1,000) | Low | Needs a separate implementation on a devnet. Off the main line (not taking it) |
| — | CROPS Upgrade to Existing Project | $1,500 | Not eligible | It targets improvements to an existing project. We are building from zero, so it doesn't apply |

**Correction 2026-11-06 (re-read the prize pages).** The amounts above are **the total divided across 3 slots**, and what one project can take is $2,000 (CROPS) / $2,500 (Anon-RPC) even at 1st place.
**The earlier note wrote the totals as-is.** → **The gap between CROPS's and Anon-RPC's first places is only $500.**
Betting implementation time on Anon-RPC is not worth much. **The 30-minute time box on #6 can stay as it is** (this reinforces `plan.md` D4).

**[verified] Official wording:** "One EF prize per project. You can submit to anon-rpc, the alt mempool and CROPS, but you will be placed in at most one."
→ **We may enter all three. We can win one.** There is no cost to entering itself.

## Anon-RPC
- [verified] Pass it a specifier (a contract for designating the network) and it returns an anonymized `fetch`. It runs in a Worker inside a null-origin iframe. https://ethereum.github.io/anon-rpc/
- [verified] It is a browser-only mechanism, used via npm's `@anon-rpc/browser-harness`. The destination can be any URL and can be passed to viem's custom transport. So 0G's RPC should also be usable as a destination (we have not run it against 0G)
- [verified] To read the specifier you need a mainnet provider once at the start (Sepolia for Nox). The anonymizing networks are Tor and Nym (mainnet) and Nox (Sepolia). The Tor gateway is for demos and has small capacity. https://ethereum.github.io/anon-rpc/wallets/ and https://ethereum.github.io/anon-rpc/adopters/
- **Note**: what is hidden is "who made the query". The contents — "which pseudonym, which skill was queried" — are visible to the RPC. So to keep information about acquaintances from leaving, the design has to **fetch all the registry's events and filter on the device**
- [unverified] The official maturity designation

## Prize requirements [verified] https://ethglobal.com/events/mumbai/prizes
- Anon-RPC: make the app's RPC reads go through Anon-RPC by default
- CROPS: a public repository with an OSS license, a CROPS section in the README, a demo video of 3 minutes or less, no trackers, keys and personal data kept inside the device. We are building from zero, so this slot fits (the Continuity slot for existing projects is separate)
- Neither text specifies a chain
- [unverified] Whether EF uses one of the three partner slots (the Arkiv entry explicitly says "counts as one partner")

## Alt mempool / EIP-8141, Kohaku
- [verified] Frame transactions are native account abstraction separating validation, gas payment and execution. https://eips.ethereum.org/EIPS/eip-8141 . The alt mempool (ERC-8421, draft) accepts transactions the public mempool won't, using stake and reputation. https://docs.altmempool.wtf/ . Conceptually close to scoped permissions, but it needs to be built separately on a devnet
- [verified] Kohaku is a set of JS privacy tools. Its README says "not production-ready, not audited". https://github.com/ethereum/kohaku . Only a weak direct connection

## Which part of CROPS we embody
- [verified] censorship resistant / open source / private / secure. https://blog.ethereum.org/2026/03/13/ef-mandate
- The most persuasive one is **Private**. "Who you know never leaves the device" is not a setting; it is the mechanism itself
