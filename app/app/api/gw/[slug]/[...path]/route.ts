import { NextRequest, NextResponse } from "next/server";
import { q, run } from "@/lib/db";
import { agentByApiKey } from "@/lib/auth";

/**
 * The Tollbooth gateway — /api/gw/{slug}/{...path}
 * Every agent call to a listed API goes through here:
 *   auth (x-api-key) → credit check → proxy to upstream → meter usage → bill.
 * Only successful (2xx) upstream responses are billed.
 */
async function proxy(req: NextRequest, slug: string, restPath: string[]) {
  const agent = agentByApiKey(req.headers.get("x-api-key"));
  if (!agent) return NextResponse.json({ error: "invalid or missing x-api-key header" }, { status: 401 });

  const listing = q(`SELECT * FROM listings WHERE slug = :slug AND status = 'live'`, { slug })[0];
  if (!listing) return NextResponse.json({ error: `listing '${slug}' not found` }, { status: 404 });

  const price = listing.price_per_call_cents;
  if (agent.credits_cents < price) {
    return NextResponse.json(
      {
        error: "insufficient credits",
        hint: "Top up with tb_create_order (PayPal credit packs), then retry.",
        credits: agent.credits_cents,
        pricePerCallCents: price,
      },
      { status: 402 }
    );
  }

  // Build the upstream URL (path + query passthrough).
  const url = new URL(req.nextUrl);
  const target = `${listing.upstream_base_url.replace(/\/$/, "")}/${restPath.join("/")}${url.search}`;

  const upstream = await fetch(target, {
    method: req.method,
    headers: { "Content-Type": req.headers.get("content-type") ?? "application/json" },
    body: ["GET", "HEAD"].includes(req.method) ? undefined : await req.text(),
  });

  const body = await upstream.text();
  const billed = upstream.ok ? price : 0;
  run(`INSERT INTO usage_events (listing_id, agent_id, path, method, status_code, cost_cents) VALUES (:l, :a, :p, :m, :s, :c)`,
    { l: listing.id, a: agent.id, p: `/${restPath.join("/")}`, m: req.method, s: upstream.status, c: billed });
  if (billed > 0) run(`UPDATE agents SET credits_cents = credits_cents - :c WHERE id = :a`, { c: billed, a: agent.id });

  return new NextResponse(body, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "application/json",
      "X-Tollbooth-Billed-Cents": String(billed),
    },
  });
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ slug: string; path: string[] }> }) {
  const { slug, path } = await ctx.params;
  return proxy(req, slug, path);
}
export async function POST(req: NextRequest, ctx: { params: Promise<{ slug: string; path: string[] }> }) {
  const { slug, path } = await ctx.params;
  return proxy(req, slug, path);
}
export async function PUT(req: NextRequest, ctx: { params: Promise<{ slug: string; path: string[] }> }) {
  const { slug, path } = await ctx.params;
  return proxy(req, slug, path);
}
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ slug: string; path: string[] }> }) {
  const { slug, path } = await ctx.params;
  return proxy(req, slug, path);
}
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ slug: string; path: string[] }> }) {
  const { slug, path } = await ctx.params;
  return proxy(req, slug, path);
}
