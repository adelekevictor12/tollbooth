# Tollbooth 🛣️

**Give your API a tollbooth — let AI agents discover it, read it, and pay for it.**

*Built for the [PayPal AI Hackathon 2026](https://paypalaihackathon.devpost.com/).*

AI agents are about to consume millions of APIs. Today that flow is broken for machines: no way to **discover** an API (agent-native catalog), no way to **read** one (LLM-legible docs), and no way to **pay** for one (per-call billing with autonomous checkout). Tollbooth is the missing commerce layer:

1. **Publish** — a developer pastes an OpenAPI spec. **APIMatic** transforms it and generates typed **TypeScript + Python SDKs** plus an LLM-readable **context file** (`llms.txt`-style) that agents consume.
2. **Discover** — the API is listed in the Tollbooth marketplace, exposed to any AI agent through an **MCP server** (search, read context, compare pricing).
3. **Pay** — the agent buys credit packs through **PayPal** (Orders API, agent-initiated checkout), and every call is metered and billed by the **Tollbooth gateway**. The developer withdraws earnings via **PayPal Payouts**.

No human in the loop. Watch a Claude agent do the whole journey: search → read docs → create a PayPal order → get credits → call the API → get billed per call.

---

## Quickstart (5 minutes)

**Prerequisites:** Node.js 24+, npm.

```bash
git clone <this repo> && cd tollbooth
npm install                 # installs all three workspaces (app, mcp, agent)
cp .env.example app/.env    # optional — works with zero keys (mock mode)

# Terminal 1 — the marketplace + gateway + dashboard
npm run dev                 # → http://localhost:3000

# Terminal 2 — the scripted buyer-agent demo (no AI key needed)
npm run demo                # full autonomous purchase journey

# Terminal 3 (optional) — the LLM-driven autonomous buyer agent
#   works with a Gemini key (free: aistudio.google.com) OR an Anthropic key
cd agent && GEMINI_API_KEY=... npm run start -- "Find a sentiment API and run 3 calls. Budget $5."
```

Open **http://localhost:3000/dev** before running the demo — watch revenue, usage, and agent purchases update live.

**Verify the MCP surface** (no LLM needed):

```bash
cd agent && npm run smoke
```

### Using the MCP server in Claude Code

```bash
claude mcp add tollbooth -- node --import tsx C:/path/to/tollbooth/mcp/src/index.ts
```

Then just ask Claude: *"Search the Tollbooth marketplace for a sentiment API, buy the smallest credit pack, and score this review: '…'"*

---

## Modes

| Mode | When | Behavior |
|---|---|---|
| **Mock** (default) | no PayPal credentials set | Orders are simulated locally (instant approve + capture). The whole demo runs with **zero keys**. |
| **Sandbox** | `PAYPAL_CLIENT_ID` + `PAYPAL_CLIENT_SECRET` set | Real PayPal sandbox: the agent creates an order, the payer approves via PayPal, capture completes via webhook (`PAYMENT.CAPTURE.COMPLETED`), credits top up automatically. |

APIMatic likewise degrades gracefully: without `APIMATIC_API_KEY`, listings use the built-in local context generator; with a key, the APIMatic **Transformer** normalizes specs and the **Codegen API** produces downloadable SDKs per listing.

## Environment variables

See [.env.example](.env.example). Copy it to `app/.env` (and `agent/.env` for the LLM agent). Nothing is required for mock mode; add keys to go live:

- `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` / `PAYPAL_WEBHOOK_ID` — PayPal sandbox app credentials
- `APIMATIC_API_KEY` — live spec transformation + SDK generation
- `ANTHROPIC_API_KEY` — the autonomous buyer agent (`agent/`)

## Architecture

```
 Developer (supply)                          AI agent (demand)
 ───────────────────                         ──────────────────
 OpenAPI spec / Postman URL                  Claude (Anthropic API)
       │                                          │  "find a sentiment API,
       ▼                                          │   run 3 calls, stay under $5"
 APIMatic Transformer (normalize)                ▼
       │                                    Tollbooth MCP server
       ▼                                    ├─ tb_search_apis
 APIMatic Codegen API                       ├─ tb_get_api_context   ← context file (llms.txt)
 ├─ SDK: TypeScript + Python                ├─ tb_create_order      → PayPal Orders API
 └─ Context Plugin: llms.txt                ├─ tb_approve_order     → capture / approve URL
       │                                    ├─ tb_call_api          → Tollbooth gateway
       ▼                                    └─ tb_check_credits
 Tollbooth listing + pricing                      │
 (per-call, metered)                              ▼
                                        Gateway: x-api-key auth → credit check
 Dashboard: revenue, usage,                → proxy to upstream API → meter & bill
 payouts via PayPal Payouts API       PayPal webhook: PAYMENT.CAPTURE.COMPLETED
                                      → auto top-up agent credits
```

**Workspaces:**

| Path | What |
|---|---|
| `app/` | Next.js 16 app — marketplace, developer dashboard, REST API, PayPal integration (Orders + Webhooks + Payouts), metering gateway, bundled demo API |
| `mcp/` | Standalone MCP server (stdio) — the agent-facing tool surface |
| `agent/` | The buyer agent: scripted demo (`npm run demo`), MCP smoke test (`npm run smoke`), and the autonomous Claude agent (`npm run start`) |

## How each technology is used

- **PayPal** — Orders API (agent-initiated credit-pack purchases), webhooks (`PAYMENT.CAPTURE.COMPLETED` → automatic credit top-up), Payouts API (developer earnings withdrawal), sandbox credentials throughout. Mock mode exists purely so judges can run everything with zero setup.
- **APIMatic** — the supply-side engine: Transformer (spec normalization from any format), Codegen API (typed multi-language SDKs per listing), Code Context / context plugins (the LLM-legible `llms.txt` served to agents via `tb_get_api_context`). Endpoint URLs are configurable via env (`APIMATIC_TRANSFORM_URL` / `APIMATIC_CODEGEN_URL`) — point them at your account's API docs.
- **AI** — the buyer agent runs on the LLM of your choice: **Gemini** (`GEMINI_API_KEY`, default `gemini-3.8-flash`) or **Claude** (`ANTHROPIC_API_KEY`) — driving the Tollbooth MCP server as its tool surface; discovery uses the agent-legible context files; the marketplace UI updates live as agents purchase and consume.

## Submission checklist mapping

- ✅ Meaningful PayPal integration: Orders, Webhooks, Payouts, sandbox-ready
- ✅ Meaningful AI: autonomous Claude agent + agent-native discovery/docs
- ✅ Working prototype: `npm run demo` (zero keys) or sandbox mode with credentials
- ✅ Public repo, MIT license, complete run instructions
- 🎬 Demo video: see `docs/SUBMISSION.md` for the script

## License

MIT — see [LICENSE](LICENSE).
