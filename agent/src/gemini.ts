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

const here = path.dirname(fileURLToPath(import.meta.url));
const MCP_SERVER = path.resolve(here, "../../mcp/src/index.ts");
const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
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
1. Register yourself first (tb_register_agent).
2. Search before you buy; read an API's context file (tb_get_api_context) before calling it.
3. Spend the user's budget responsibly: choose the smallest credit pack that covers the job, and respect any budget the user states.
4. Calls through the gateway are billed from your credit balance; failed calls are free.
5. When done, report: what you bought, what you paid, results of the calls, and credits remaining.
Be concise. Do not ask the user questions — make sensible decisions and proceed.`;

const contents: any[] = [{ role: "user", parts: [{ text: TASK }] }];
const text = (r: any) =>
  (r.content ?? []).filter((c: any) => c.type === "text").map((c: any) => c.text).join("\n");

async function run() {
  for (let step = 0; step < 16; step++) {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: {
        systemInstruction: SYSTEM,
        tools: [{ functionDeclarations }],
      },
    });

    // Echo the model turn back unchanged (preserves thought signatures).
    const modelParts = response.candidates?.[0]?.content?.parts ?? [];
    contents.push({ role: "model", parts: modelParts.length ? modelParts : [{ text: response.text ?? "" }] });
    if (response.text?.trim()) console.log(`💬 ${response.text}\n`);

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
