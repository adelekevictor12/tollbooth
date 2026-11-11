# Narration script — voiceover edition

Timed to the beats in [RECORDING.md](RECORDING.md). ~350 words total; word counts fit the beat windows at a relaxed speaking pace. When narrating, skip the burned-in captions (speech + identical on-screen text compete) but still upload [captions.srt](captions.srt) as YouTube subtitles for muted viewers.

## The mental model (speak from this, not from memory of the script)

Three walls for agents: **can't discover** APIs, **can't read** human docs, **can't pay** per call. Tollbooth removes the human from all three: publish via APIMatic (transform + SDKs + machine-readable context file), discover via the MCP server, pay via PayPal (agent-card order create+capture in one call, metered gateway, Payouts for sellers). One-liner: *Stripe made it trivial for websites to take payments; Tollbooth makes it trivial for APIs to take payments — from machines.*

## The script

**Beat 1 (0:00–0:20) · marketplace home**
"AI agents are about to make millions of API calls a day. But they can't discover APIs, they can't read human documentation, and they have no way to pay. Every one of those steps still needs a human. Tollbooth removes the human — it's the commerce layer for the machine economy."

**Beat 2 (0:20–0:41) · listing page (scroll to context file)**
"Here's how an API gets listed. A developer pastes an OpenAPI spec. APIMatic's Transformer normalizes it, Codegen generates typed SDKs, and Tollbooth produces this — a context file written for machines. This is what an agent reads instead of HTML docs. And just like that, the API is live, with per-call pricing."

**Beat 3 (0:41–0:47) · APIMatic portal (SDKs page)**
"APIMatic also generates the full developer portal — docs and downloadable SDKs for C-sharp, TypeScript and Python, all from that same spec."

**Beat 4 (0:47–0:59) · terminal, type the mission**
"Now the demand side. I'm giving an AI agent one mission: find a sentiment API, run three calls, and stay under five dollars."

**Beat 5 (0:59–1:43) · run the demo — narrate as lines print**
"Watch the terminal. The agent registers itself… searches the marketplace through the Tollbooth MCP server… reads the context file… and decides to buy the starter pack — five hundred credits for five dollars. It creates a PayPal order with its own card, through the Orders API — and there: PayPal captures the payment. No browser, no checkout page, no human. Credits land instantly. Now it calls the API through the metered gateway — every successful call billed at two cents, failed calls never billed."

**Beat 6 (1:43–1:59) · developer dashboard, refresh**
"Meanwhile, on the developer side — the dashboard shows the purchase and the metered calls arriving in real time. The seller withdraws earnings through PayPal Payouts."

**Beat 7 (1:59–2:05) · hold**
"Zero humans touched that transaction."

**Beat 8 (2:05–2:32) · close**
"And that's the thesis. Stripe made it trivial for websites to take payments. Tollbooth makes it trivial for APIs to take payments — from machines. Every API, ready for the agent economy. This is Tollbooth — the repo and the live demo are linked below."

## Delivery notes

1. Match speech to screen, not the clock — pause on `Payment captured ✓` while finishing the sentence; silence over the key line is fine.
2. Numbers say it best ("five hundred credits for five dollars", "two cents a call") — say them slowly.
3. The one breath never to rush: after "PayPal captures the payment," let the line sit on screen. That's the proof moment.
