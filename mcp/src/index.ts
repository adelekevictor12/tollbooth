#!/usr/bin/env node
/**
 * Tollbooth MCP server.
 *
 * Exposes the Tollbooth API marketplace to any MCP client (Claude Code,
 * Claude Desktop, custom agents):
 *   - discover APIs and read their agent-legible context files
 *   - buy credit packs through PayPal (Orders API)
 *   - call metered APIs through the gateway
 *
 * Run against a Tollbooth app instance:
 *   TOLLBOOTH_URL=http://localhost:3000 npm run dev
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const BASE = process.env.TOLLBOOTH_URL ?? "http://localhost:3000";
let agentApiKey = process.env.TOLLBOOTH_API_KEY ?? "";

async function api(path: string, init: RequestInit = {}): Promise<any> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(agentApiKey ? { "x-api-key": agentApiKey } : {}),
      ...(init.headers ?? {}),
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${res.status}: ${JSON.stringify(json)}`);
  return json;
}

const server = new McpServer({ name: "tollbooth", version: "1.0.0" });

server.tool(
  "tb_register_agent",
  "Register this agent with Tollbooth to get an API key (needed before buying credits or calling APIs).",
  { name: z.string().describe("A human-readable name for this agent") },
  async ({ name }) => {
    const json = await api("/api/agents", { method: "POST", body: JSON.stringify({ name }) });
    agentApiKey = json.apiKey;
    return { content: [{ type: "text", text: `Registered. API key: ${json.apiKey} (stored for this session). Credits: 0.` }] };
  }
);

server.tool(
  "tb_search_apis",
  "Search the Tollbooth API marketplace. Returns matching APIs with per-call pricing.",
  { query: z.string().describe("What you need, e.g. 'sentiment analysis' or 'weather'") },
  async ({ query }) => {
    const json = await api(`/api/search?q=${encodeURIComponent(query)}`);
    if (!json.results.length) return { content: [{ type: "text", text: "No matching APIs found." }] };
    return {
      content: [{
        type: "text",
        text: json.results
          .map((r: any) => `${r.name} (slug: ${r.slug}) — ${r.price}/call\n  ${r.tagline}`)
          .join("\n\n"),
      }],
    };
  }
);

server.tool(
  "tb_get_api_context",
  "Read an API's full agent-legible context file (endpoints, request shapes, pricing, how to call it through the gateway).",
  { slug: z.string().describe("API slug from tb_search_apis") },
  async ({ slug }) => {
    const res = await fetch(`${BASE}/api/context/${slug}`);
    const text = await res.text();
    return { content: [{ type: "text", text }] };
  }
);

server.tool(
  "tb_list_packs",
  "List the PayPal credit packs an agent can buy (credits = cents, spent per API call).",
  {},
  async () => {
    const json = await api("/api/orders");
    return {
      content: [{
        type: "text",
        text: json.packs.map((p: any) => `${p.name}: ${p.label}`).join("\n") + `\n(payment mode: ${json.mode})`,
      }],
    };
  }
);

server.tool(
  "tb_create_order",
  "Buy a credit pack, paying with the agent's funded card through PayPal. In agent-card mode the payment captures immediately and credits are added on success. Returns the order id, amount, and status.",
  { pack: z.enum(["starter", "pro", "mega"]).describe("Which credit pack to buy") },
  async ({ pack }) => {
    const json = await api("/api/orders", { method: "POST", body: JSON.stringify({ pack }) });
    return {
      content: [{
        type: "text",
        text: `Order ${json.orderId} (${json.pack}, ${json.amountUsd}, ${json.credits} credits) — status: ${json.status}. Payment method: ${json.paymentMethod}. ${json.next}`,
      }],
    };
  }
);

server.tool(
  "tb_approve_order",
  "Complete a purchase. In mock mode it instantly approves+captures. In PayPal sandbox mode it polls for up to ~75 seconds while a human completes PayPal buyer approval in their browser — call it and stay patient; it returns 'completed' once payment is captured.",
  { orderId: z.number().int().describe("Order id from tb_create_order") },
  async ({ orderId }) => {
    for (let i = 0; i < 15; i++) {
      const json = await api(`/api/orders/${orderId}/approve`, { method: "POST" });
      if (json.ok) return { content: [{ type: "text", text: JSON.stringify(json) }] };
      if (i < 14) await new Promise((r) => setTimeout(r, 5000));
    }
    return {
      content: [{
        type: "text",
        text: `Order ${orderId} is still awaiting payer approval. The payer must open the approve URL (see tb_create_order output) in a browser and complete PayPal checkout. Call this tool again afterwards.`,
      }],
    };
  }
);

server.tool(
  "tb_check_credits",
  "Check this agent's remaining credit balance and recent metered usage.",
  {},
  async () => {
    const json = await api("/api/credits");
    return {
      content: [{
        type: "text",
        text: `Credits remaining: ${json.credits}\nRecent usage: ${json.recentUsage.length} metered calls.`,
      }],
    };
  }
);

server.tool(
  "tb_call_api",
  "Call a marketplace API through the Tollbooth gateway (metered + billed from your credit balance). Only successful calls are billed.",
  {
    slug: z.string().describe("API slug"),
    method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).describe("HTTP method"),
    path: z.string().describe("Endpoint path relative to the API root, e.g. 'sentiment' (no leading slash)"),
    body: z.record(z.any()).optional().describe("JSON request body (for POST/PUT/PATCH)"),
  },
  async ({ slug, method, path, body }) => {
    const res = await fetch(`${BASE}/api/gw/${slug}/${path}`, {
      method,
      headers: { "Content-Type": "application/json", "x-api-key": agentApiKey },
      body: body && method !== "GET" ? JSON.stringify(body) : undefined,
    });
    const billed = res.headers.get("x-tollbooth-billed-cents");
    const text = await res.text();
    return {
      content: [{
        type: "text",
        text: `HTTP ${res.status}${billed ? ` (billed ${billed} credits)` : ""}\n${text.slice(0, 4000)}`,
      }],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error(`Tollbooth MCP server ready → ${BASE}`);
