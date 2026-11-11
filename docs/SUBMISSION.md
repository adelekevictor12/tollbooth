# Devpost submission draft — Tollbooth

*(Fill in the video URL after recording — shot-by-shot plan in [VIDEO.md](VIDEO.md). Submit before Nov 12, 12:00pm PST.)*

---

## Project title

**Tollbooth — give your API a cash register for the AI-agent economy**

## One-sentence pitch

Paste an OpenAPI spec; Tollbooth turns your API into a typed SDK + agent-readable context (via APIMatic), lists it in an MCP-discoverable marketplace, and lets AI agents discover, pay for, and consume it per call through PayPal — no human in the loop.

## Description (text field)

AI agents are about to consume millions of APIs, but the commerce layer for that flow doesn't exist: agents can't discover APIs natively, can't read human-oriented docs, and have no way to pay per call. Tollbooth is that layer.

**How it works**

1. **Publish (APIMatic):** A developer pastes an OpenAPI spec or Postman collection. Tollbooth's publish pipeline is built on APIMatic's Transformer and Codegen APIs — it normalizes the spec and generates typed multi-language SDKs — and produces an LLM-legible context file (llms.txt-style) that serves as machine-native documentation. It ships with a key-optional built-in generator so judges can publish with zero setup; adding `APIMATIC_API_KEY` switches transform + SDK generation to APIMatic's live APIs with no code changes. The repo's `portal/` workspace is a live APIMatic artifact: a full developer portal for the demo API — docs, downloadable C#/TypeScript/Python SDKs, `llms.txt` agent docs, and AI context plugins — generated with the APIMatic CLI from the same OpenAPI spec.
2. **Discover (MCP):** The API is listed in the marketplace and exposed to any AI agent through the Tollbooth MCP server — search the catalog, read an API's context, compare per-call pricing.
3. **Pay (PayPal):** The agent buys credit packs paying with its own funded card through the PayPal Orders API (`payment_source.card`) — the order is created and captured in a single autonomous call, and the payment routes directly to the API seller's account (marketplace payee). Every call through the Tollbooth gateway is metered and billed from the agent's balance (failed calls are never billed). A PayPal-wallet mode with human buyer approval is also supported. Developers withdraw earnings via PayPal Payouts.

**The demo (in the video):**
A Claude agent is given a mission: *"Find a sentiment analysis API and run 3 calls, keep spend under $5."* With no human involvement it searches the marketplace via MCP, reads the API's agent-legible context file, creates a PayPal order for a 500-credit pack, captures payment, receives its API key, and calls the API through the metered gateway — while the developer dashboard shows revenue accruing in real time.

**Technologies:**
- PayPal: Orders API (agent-initiated checkout), Webhooks (auto credit top-up), Payouts API (developer earnings), sandbox throughout — with a zero-credentials mock mode so anyone can run the demo instantly.
- APIMatic: Transformer + Codegen API + Code Context — the supply-side engine that makes every listed API typed (SDKs) and machine-legible (context files).
- AI: Claude (Anthropic API) as the autonomous buyer agent, driving the Tollbooth MCP server as its tool surface.

**Why it matters:** Stripe made it trivial for websites to take payments. Tollbooth makes it trivial for APIs to take payments — from machines. As agentic commerce grows, every API needs a tollbooth.

## Video script (under 3 minutes)

No-voiceover version: the beats below are realized as on-screen captions (full track in [captions.srt](captions.srt), shot plan in [VIDEO.md](VIDEO.md)).

| Time | Beat |
|---|---|
| 0:00–0:20 | Problem: "AI agents will consume millions of APIs. Today they can't discover them, can't read them, and can't pay for them. Humans hand-copy API keys — that doesn't scale to machines." |
| 0:20–0:55 | Supply side (screen: app + dashboard): paste OpenAPI spec URL → APIMatic transform + SDK generation + context file → listing live with per-call pricing. Show the context file — "this is what agents read instead of HTML docs." |
| 0:55–2:10 | Demand side (screen: terminal): the agent gets the mission. Show it call tb_search_apis, tb_get_api_context, tb_create_order — the PayPal order completes with a real sandbox capture (agent card) — credits land — agent calls the API through the gateway, metered. Zero human involvement. |
| 2:10–2:40 | Split screen: developer dashboard updating live (revenue, usage, agent purchases). Payout via PayPal. |
| 2:40–2:55 | Tagline: "Every API, ready for the machine economy. Tollbooth." GitHub URL on screen. |

## Tools used (required field)

- PayPal REST APIs: Orders, Webhooks, Payouts (sandbox)
- APIMatic: Transformer + Codegen APIs, plus a CLI-generated developer portal (`portal/`) with downloadable SDKs (C#/TypeScript/Python), `llms.txt` agent docs, and AI context plugins
- AI: Gemini (Google AI Studio) autonomous buyer agent — Claude also supported — and the Model Context Protocol (MCP)
- Next.js, TypeScript, node:sqlite

## Judge run instructions (also in README)

```bash
npm install
cp .env.example app/.env   # optional — mock mode needs no keys
npm run dev                # terminal 1 → http://localhost:3000
npm run demo               # terminal 2 — full agent purchase journey
npm run smoke              # terminal 3 — verifies the MCP tool surface
```

Hosted demo: **https://tollbooth-gljd.onrender.com** — live PayPal sandbox payments, webhook-verified (PAYMENT.CAPTURE.COMPLETED). Verified end-to-end: agent purchase → capture → metered gateway calls. Free tier: sleeps after ~15 min idle (first load may take ~30s), and the demo data resets on each service restart (ephemeral disk) — the marketplace always re-seeds itself. Developer portal (APIMatic-generated): _add the tollbooth-docs static site URL after the Render blueprint sync._

## Checklist

- [x] Public repo, MIT LICENSE visible in About section
- [x] Hosted demo URL on Render — https://tollbooth-gljd.onrender.com (sandbox mode, self-seeding)
- [ ] Video <3 min on YouTube, public, linked in submission — captions ready in docs/captions.srt
- [ ] Text description above pasted
- [ ] Tools identified
- [ ] Submit before Nov 12 12:00pm PST
