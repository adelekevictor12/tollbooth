/**
 * Tollbooth autonomous buyer agent — Claude (Anthropic API) driving the
 * Tollbooth MCP server as its tool surface. Give it a shopping mission:
 *
 *   npm run start -- "Find a sentiment analysis API and score these reviews:
 *   'love it', 'terrible support'. Budget: stay under $5."
 *
 * The agent discovers APIs, reads their context, buys credits with PayPal,
 * and calls them through the metered gateway — all via MCP tools.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const MCP_SERVER = path.resolve(here, "../../mcp/src/index.ts");
const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-5-5";
const TASK = process.argv[2] ?? "Find a sentiment analysis API on the Tollbooth marketplace and run 3 sentiment calls on sample product reviews. Keep total spend under $5.";

const client = new Anthropic();

// ── connect to the Tollbooth MCP server ───────────────────────────────
const mcp = new Client({ name: "tollbooth-buyer", version: "1.0.0" });
const transport = new StdioClientTransport({
  command: process.execPath,
  args: ["--import", "tsx", MCP_SERVER],
  env: { ...process.env, TOLLBOOTH_URL: process.env.TOLLBOOTH_URL ?? "http://localhost:3000" },
});
await mcp.connect(transport);
const { tools } = await mcp.listTools();
console.log(`🤖 Buyer agent online — ${tools.length} marketplace tools via MCP:`);
console.log(`   ${tools.map((t: any) => t.name).join(", ")}\n`);

const SYSTEM = `You are an autonomous software buyer agent operating on the Tollbooth API marketplace.
You have tools to search for APIs, read their documentation, buy credits with PayPal, and call them through a metered gateway.

Operating rules:
1. Register yourself first (tb_register_agent).
2. Search before you buy; read an API's context file (tb_get_api_context) before calling it.
3. Spend the user's budget responsibly: choose the smallest credit pack that covers the job, and respect any budget the user states.
4. Calls through the gateway are billed from your credit balance; failed calls are free.
5. When done, report: what you bought, what you paid, results of the calls, and credits remaining.
Be concise. Do not ask the user questions — make sensible decisions and proceed.`;

const anthropicTools = tools.map((t: any) => ({
  name: t.name,
  description: t.description ?? "",
  input_schema: t.inputSchema,
}));

const messages: any[] = [{ role: "user", content: TASK }];

async function run() {
  for (let step = 0; step < 16; step++) {
    const params = {
      model: MODEL,
      max_tokens: 16000,
      system: SYSTEM,
      tools: anthropicTools,
      messages,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
    } as unknown as any;

    let response: Anthropic.Beta.BetaMessage;
    try {
      response = await client.beta.messages.create(params);
    } catch (err: any) {
      // Older/overridden models may not accept the fallback beta — retry without it.
      if (err?.status === 400) {
        delete params.betas;
        delete params.fallbacks;
        response = await client.beta.messages.create(params);
      } else throw err;
    }

    messages.push({ role: "assistant", content: response.content as any });

    for (const block of response.content) {
      if (block.type === "text" && block.text.trim()) console.log(`💬 ${block.text}\n`);
    }
    if (response.stop_reason !== "tool_use") {
      console.log("🏁 Agent finished.");
      return;
    }

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of response.content) {
      if (block.type !== "tool_use") continue;
      console.log(`🔧 ${block.name}(${JSON.stringify(block.input).slice(0, 120)}…)`);
      try {
        const result = await mcp.callTool({ name: block.name, arguments: block.input as Record<string, unknown> });
        const text = (result.content as any[])
          ?.filter((c: any) => c.type === "text")
          .map((c: any) => c.text)
          .join("\n") ?? "(empty)";
        console.log(`   ↳ ${text.slice(0, 200).replace(/\n/g, " ")}`);
        toolResults.push({ type: "tool_result", tool_use_id: block.id, content: text.slice(0, 8000) });
      } catch (err: any) {
        console.log(`   ↳ ERROR: ${err.message}`);
        toolResults.push({ type: "tool_result", tool_use_id: block.id, content: `Error: ${err.message}`, is_error: true });
      }
    }
    messages.push({ role: "user", content: toolResults });
  }
  console.log("⏹ Step limit reached.");
}

run().catch((e) => {
  console.error("❌ Agent failed:", e.message);
  process.exit(1);
});
