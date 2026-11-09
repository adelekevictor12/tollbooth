/**
 * OpenAPI → agent-readable context file (llms.txt-style markdown).
 *
 * This is the always-available local generator. When APIMATIC_API_KEY is set,
 * lib/apimatic.ts additionally produces APIMatic's official Code Context
 * artifacts and multi-language SDKs — this local generator is the fallback
 * that guarantees every listing is agent-legible even without a key.
 */
interface Endpoint {
  method: string;
  path: string;
  summary?: string;
  operationId?: string;
}

export function generateContextMd(input: {
  name: string;
  tagline: string;
  description: string;
  pricePerCallCents: number;
  spec: any;
}): string {
  const endpoints = extractEndpoints(input.spec);
  const lines: string[] = [];

  lines.push(`# ${input.name}`);
  lines.push("");
  lines.push(`> ${input.tagline}`);
  lines.push("");
  lines.push("## Overview");
  lines.push(input.description || `${input.name} is an API available on the Tollbooth marketplace.`);
  lines.push("");
  lines.push("## Pricing");
  lines.push(`- Cost: $${(input.pricePerCallCents / 100).toFixed(2)} per successful call, metered by the Tollbooth gateway.`);
  lines.push("- Pay by purchasing credit packs through PayPal (see tb_create_order / tb_check_credits tools).");
  lines.push("");
  lines.push("## Calling this API");
  lines.push("- Route calls through the Tollbooth gateway, NOT the upstream URL directly.");
  lines.push("- Use the `tb_call_api` MCP tool:  tb_call_api(slug, method, path, body).");
  lines.push("- Include your Tollbooth API key; the gateway meters usage and enforces your credit balance.");
  lines.push("");

  lines.push("## Endpoints");
  if (endpoints.length === 0) {
    lines.push("_(No endpoints parsed from the spec — see listing page.)_");
  }
  for (const e of endpoints) {
    lines.push(`### ${e.method.toUpperCase()} ${e.path}`);
    if (e.summary) lines.push(`- ${e.summary}`);
    lines.push("");
  }

  const servers = input.spec?.servers?.map((s: any) => s.url) ?? [];
  if (servers.length) {
    lines.push("## Upstream server (proxied by gateway)");
    for (const s of servers) lines.push(`- ${s}`);
    lines.push("");
  }

  lines.push("## Response convention");
  lines.push("Non-2xx responses are not billed. Calls that exhaust your credit balance return HTTP 402 with a top-up hint.");
  lines.push("");
  return lines.join("\n");
}

function extractEndpoints(spec: any): Endpoint[] {
  const out: Endpoint[] = [];
  const paths = spec?.paths ?? {};
  for (const [path, item] of Object.entries<any>(paths)) {
    for (const [method, op] of Object.entries<any>(item)) {
      if (!["get", "post", "put", "patch", "delete"].includes(method)) continue;
      out.push({ method, path, summary: op?.summary ?? op?.description?.slice(0, 120), operationId: op?.operationId });
    }
  }
  return out;
}
