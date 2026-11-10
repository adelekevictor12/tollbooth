/**
 * Tollbooth scripted buyer demo — runs the full agent purchase journey with
 * NO LLM key required (deterministic, always works — ideal for the video).
 *
 * Journey: register → search → read context → buy credits (PayPal order) →
 * approve/capture → call the API through the metered gateway → report spend.
 */
const BASE = process.env.TOLLBOOTH_URL ?? "http://localhost:3000";

let apiKey = "";

async function api(path: string, init: RequestInit = {}): Promise<any> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { "x-api-key": apiKey } : {}),
      ...(init.headers ?? {}),
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${res.status}: ${JSON.stringify(json)}`);
  return json;
}

const log = (icon: string, msg: string) => console.log(`${icon}  ${msg}`);
const rule = () => console.log("─".repeat(64));

async function main() {
  rule();
  log("🤖", "Tollbooth buyer agent — autonomous purchase journey");
  rule();

  // 1. Register
  const agent = await api("/api/agents", { method: "POST", body: JSON.stringify({ name: "claude-buyer-agent" }) });
  apiKey = agent.apiKey;
  log("1", `Registered as '${agent.name}' — got API key ${agent.apiKey.slice(0, 12)}…`);

  // 2. Search
  const results = await api("/api/search?q=sentiment analysis");
  log("2", `Searched marketplace for 'sentiment analysis' → ${results.results.length} match(es)`);
  for (const r of results.results) console.log(`   • ${r.name} (${r.slug}) — ${r.price}/call: ${r.tagline}`);
  const target = results.results.find((r: any) => r.slug === "sentimentscan") ?? results.results[0];

  // 3. Read the agent-legible context
  const ctxRes = await fetch(`${BASE}/api/context/${target.slug}`);
  const context = await ctxRes.text();
  log("3", `Read context file for ${target.name} (${context.length} chars) — endpoints, pricing, gateway usage`);

  // 4. Buy credits (PayPal)
  const order = await api("/api/orders", { method: "POST", body: JSON.stringify({ pack: "starter" }) });
  log("4", `Created PayPal order ${order.paypalOrderId} — ${order.amountUsd} for ${order.credits} credits (mode: ${order.mode})`);

  // 5. Approve + capture
  const approve = await api(`/api/orders/${order.orderId}/approve`, { method: "POST" });
  const creditsAdded = approve.creditsAdded ?? approve.credits;
  if (approve.status === "completed") {
    log("5", `Payment captured ✓ — balance topped up by ${creditsAdded} credits`);
  } else {
    log("5", `Awaiting payer approval — open in a browser, then re-run: ${approve.approveUrl}`);
    return;
  }

  // 6. Call the API through the metered gateway
  const texts = [
    "I absolutely love this product, it works perfectly and the support is amazing!",
    "The item arrived broken and support has been frustrating to deal with.",
    "It's a mug. It holds coffee.",
  ];
  log("6", `Calling ${target.slug} through the Tollbooth gateway (metered per call):`);
  for (const text of texts) {
    const res = await fetch(`${BASE}/api/gw/${target.slug}/sentiment`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify({ text }),
    });
    const billed = res.headers.get("x-tollbooth-billed-cents");
    const json = await res.json();
    console.log(`   → ${json.label.padEnd(8)} (${json.score})  [billed ${billed} credits]  "${text.slice(0, 48)}…"`);
  }

  // 7. Report
  const credits = await api("/api/credits");
  rule();
  log("✅", `Done. Credits remaining: ${credits.credits} (started at 500).`);
  log("📊", `Developer dashboard: ${BASE}/dev — watch the revenue update live.`);
  rule();
}

main().catch((e) => {
  console.error("\n❌ Demo failed:", e.message);
  console.error(`   Is the Tollbooth app running at ${BASE}?  (npm run dev in app/)`);
  process.exit(1);
});
