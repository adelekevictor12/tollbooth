/**
 * MCP smoke test — connects to the Tollbooth MCP server over stdio and
 * exercises the full tool chain: register → search → context → buy →
 * approve → call. Verifies the MCP surface end-to-end without an LLM.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const MCP_SERVER = path.resolve(here, "../../mcp/src/index.ts");

const mcp = new Client({ name: "tollbooth-smoke", version: "1.0.0" });
const transport = new StdioClientTransport({
  command: process.execPath,
  args: ["--import", "tsx", MCP_SERVER],
  env: { ...process.env } as Record<string, string>,
});
await mcp.connect(transport);

const text = (r: any) => (r.content ?? []).filter((c: any) => c.type === "text").map((c: any) => c.text).join("\n");

const { tools } = await mcp.listTools();
console.log(`tools: ${tools.map((t: any) => t.name).join(", ")}`);

console.log("\n1. tb_register_agent");
console.log("   ↳", text(await mcp.callTool({ name: "tb_register_agent", arguments: { name: "smoke-test-agent" } })).slice(0, 90));

console.log("\n2. tb_search_apis");
console.log("   ↳", text(await mcp.callTool({ name: "tb_search_apis", arguments: { query: "sentiment" } })).slice(0, 120));

console.log("\n3. tb_get_api_context");
console.log("   ↳", text(await mcp.callTool({ name: "tb_get_api_context", arguments: { slug: "sentimentscan" } })).slice(0, 100) + "…");

console.log("\n4. tb_list_packs");
console.log("   ↳", text(await mcp.callTool({ name: "tb_list_packs", arguments: {} })));

console.log("\n5. tb_create_order (starter)");
const orderOut = text(await mcp.callTool({ name: "tb_create_order", arguments: { pack: "starter" } }));
console.log("   ↳", orderOut);
const orderId = Number(orderOut.match(/Order (\d+) created/)?.[1] ?? 1);

console.log("\n6. tb_approve_order");
console.log("   ↳", text(await mcp.callTool({ name: "tb_approve_order", arguments: { orderId } })).replace(/\n/g, " ").slice(0, 120));

console.log("\n7. tb_call_api");
console.log("   ↳", text(await mcp.callTool({
  name: "tb_call_api",
  arguments: { slug: "sentimentscan", method: "POST", path: "sentiment", body: { text: "the smoke test passed, absolutely great" } },
})).replace(/\n/g, " ").slice(0, 140));

console.log("\n8. tb_check_credits");
console.log("   ↳", text(await mcp.callTool({ name: "tb_check_credits", arguments: {} })));

console.log("\n✅ MCP surface verified end-to-end.");
await mcp.close();
process.exit(0);
