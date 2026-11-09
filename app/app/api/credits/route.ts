import { NextRequest, NextResponse } from "next/server";
import { q, run } from "@/lib/db";
import { agentByApiKey } from "@/lib/auth";
import { verifyWebhook } from "@/lib/paypal";

/** GET /api/credits — agent's balance + burn history. Header: x-api-key */
export async function GET(req: NextRequest) {
  const agent = agentByApiKey(req.headers.get("x-api-key"));
  if (!agent) return NextResponse.json({ error: "invalid or missing x-api-key" }, { status: 401 });
  const burn = q(
    `SELECT u.ts, l.name AS listing, u.path, u.cost_cents FROM usage_events u
     JOIN listings l ON l.id = u.listing_id WHERE u.agent_id = :a ORDER BY u.id DESC LIMIT 20`,
    { a: agent.id }
  );
  return NextResponse.json({ credits: agent.credits_cents, recentUsage: burn });
}
