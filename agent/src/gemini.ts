/**
 * Tollbooth buyer agent — Gemini edition (Google AI Studio / @google/genai).
 * Same mission, same MCP tool surface as the Anthropic agent:
 *
 *   GEMINI_API_KEY=... npm run start -- "Find a sentiment API and run 3 calls. Budget $5."
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleGenAI } from "@google/genai";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import "./env.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const MCP_SERVER = path.resolve(here, "../../mcp/src/index.ts");
const MODEL = process.env.GEMINI_MODEL ?? "gemini-3.5-flash";
const TASK =
  process.argv[2] ??
  "Find a sentiment analysis API on the Tollbooth marketplace and run 3 sentiment calls on sample product reviews. Keep total spend under $5.";

if (!process.env.GEMINI_API_KEY) {
  console.error("Set GEMINI_API_KEY (aistudio.google.com → Get API key) in agent/.env");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ── connect to the Tollbooth MCP server ───────────────────────────────
const mcp = new Client({ name: "tollbooth-buyer-gemini", version: "1.0.0" });
const transport = new StdioClientTransport({
  command: process.execPath,
  args: ["--import", "tsx", MCP_SERVER],
  env: { ...process.env, TOLLBOOTH_URL: process.env.TOLLBOOTH_URL ?? "http://localhost:3000" },
});
await mcp.connect(transport);
const { tools } = await mcp.listTools();
console.log(`🤖 Buyer agent (Gemini) online — ${tools.length} marketplace tools via MCP:`);
console.log(`   ${tools.map((t: any) => t.name).join(", ")}\n`);

// MCP inputSchema is JSON Schema — pass straight through (minus $schema).
const clean = (s: any) => {
  const { $schema, ...rest } = s ?? {};
  return rest;
};
const functionDeclarations = tools.map((t: any) => ({
  name: t.name,
  description: t.description ?? "",
  parametersJsonSchema: clean(t.inputSchema),
}));

const SYSTEM = `You are an autonomous software buyer agent operating on the Tollbooth API marketplace.
You have tools to search for APIs, read their documentation, buy credits with PayPal, and call them through a metered gateway.

Operating rules:
1. Register yourself exactly once at the start (tb_register_agent). Never register again — re-registering loses your credits.
2. Search before you buy; read an API's context file (tb_get_api_context) before calling it.
3. Spend the user's budget responsibly: choose the smallest credit pack that covers the job, and respect any budget the user states.
4. Payment needs one human step: after tb_create_order, call tb_approve_order — it polls for up to 75 seconds while a person completes PayPal approval in their browser. If it still reports awaiting_payer, call it again. Do not abandon the order.
5. Calls through the gateway are billed from your credit balance; failed calls are free.
6. When done, report: what you bought, what you paid, results of the calls, and credits remaining.
Be concise. Do not ask the user questions — make sensible decisions and proceed.`;

const contents: any[] = [{ role: "user", parts: [{ text: TASK }] }];
const text = (r: any) =>
  (r.content ?? []).filter((c: any) => c.type === "text").map((c: any) => c.text).join("\n");

/** generateContent with tolerance for 503 demand spikes (no silent SDK retries). */
async function generate(contents: any[], config: any) {
  let lastErr: any;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      return await Promise.race([
        ai.models.generateContent({ model: MODEL, contents, config }),
        new Promise((_, rej) => setTimeout(() => rej(new Error("model call timed out after 90s")), 90_000)),
      ]);
    } catch (err: any) {
      lastErr = err;
      const msg = String(err?.message ?? err);
      const retryable = /503|UNAVAILABLE|high demand|timed out|overload/i.test(msg);
      console.log(`   ⚠ model call failed (${msg.slice(0, 80)}) — ${retryable ? `retry ${attempt}/4 in 8s` : "giving up"}`);
      if (!retryable) break;
      await new Promise((r) => setTimeout(r, 8000));
    }
  }
  throw lastErr;
}

async function run() {
  for (let step = 0; step < 24; step++) {
    const response: any = await generate(contents, {
      systemInstruction: SYSTEM,
      tools: [{ functionDeclarations }],
    });

    // Echo the model turn back unchanged (preserves thought signatures).
    const modelParts = response.candidates?.[0]?.content?.parts ?? [];
    contents.push({ role: "model", parts: modelParts.length ? modelParts : [{ text: response.text ?? "" }] });
    const spoken = modelParts
      .filter((p: any) => p.text && !p.thought)
      .map((p: any) => p.text)
      .join("\n")
      .trim();
    if (spoken) console.log(`💬 ${spoken}\n`);

    const calls = response.functionCalls ?? [];
    if (calls.length === 0) {
      console.log("🏁 Agent finished.");
      return;
    }

    const resultParts: any[] = [];
    for (const call of calls) {
      console.log(`🔧 ${call.name}(${JSON.stringify(call.args ?? {}).slice(0, 120)}…)`);
      try {
        const result = await mcp.callTool({ name: call.name ?? "unknown", arguments: (call.args ?? {}) as Record<string, unknown> });
        const out = text(result) || "(empty)";
        console.log(`   ↳ ${out.slice(0, 200).replace(/\n/g, " ")}`);
        resultParts.push({ functionResponse: { name: call.name ?? "unknown", response: { result: out.slice(0, 8000) } } });
      } catch (err: any) {
        console.log(`   ↳ ERROR: ${err.message}`);
        resultParts.push({ functionResponse: { name: call.name, response: { error: err.message } } });
      }
    }
    contents.push({ role: "user", parts: resultParts });
  }
  console.log("⏹ Step limit reached.");
}

run()
  .then(() => mcp.close())
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("❌ Agent failed:", e.message);
    process.exit(1);
  });
