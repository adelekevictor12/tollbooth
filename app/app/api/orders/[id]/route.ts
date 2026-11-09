import { NextRequest, NextResponse } from "next/server";
import { q } from "@/lib/db";

/** GET /api/orders/[id] — order status for the agent. */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const row = q(
    `SELECT o.id, o.pack_name, o.credits_cents, o.amount_cents, o.paypal_order_id, o.status, o.approve_url, o.created_at, o.paid_at
     FROM orders o WHERE o.id = :id`,
    { id }
  );
  if (!row.length) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(row[0]);
}
