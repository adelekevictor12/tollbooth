import { NextRequest, NextResponse } from "next/server";
import { q, run } from "@/lib/db";
import { agentByApiKey } from "@/lib/auth";
import { payPalMode, captureOrder, getOrderStatus } from "@/lib/paypal";

/**
 * POST /api/orders/[id]/approve — the agent-driven payment completion step.
 *  - Mock mode: simulates payer approval + capture instantly (tops up credits).
 *  - Sandbox mode: if the payer has approved via PayPal, captures the order;
 *    otherwise returns the approveUrl for a human/buyer session to open.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const agent = agentByApiKey(req.headers.get("x-api-key"));
  const order = q(`SELECT * FROM orders WHERE id = :id`, { id })[0];
  if (!order) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (agent && agent.id !== order.agent_id) return NextResponse.json({ error: "not your order" }, { status: 403 });
  if (order.status === "completed") return NextResponse.json({ ok: true, status: "completed", credits: order.credits_cents });

  if (payPalMode === "mock") {
    run(`UPDATE orders SET status = 'completed', paid_at = datetime('now') WHERE id = :id`, { id });
    run(`UPDATE agents SET credits_cents = credits_cents + :c WHERE id = :a`, { c: order.credits_cents, a: order.agent_id });
    return NextResponse.json({ ok: true, status: "completed", creditsAdded: order.credits_cents, note: "simulated PayPal capture (mock mode)" });
  }

  const status = await getOrderStatus(order.paypal_order_id);
  if (status === "APPROVED" || status === "COMPLETED") {
    const captured = status === "COMPLETED" || (await captureOrder(order.paypal_order_id));
    if (captured) {
      run(`UPDATE orders SET status = 'completed', paid_at = datetime('now') WHERE id = :id`, { id });
      run(`UPDATE agents SET credits_cents = credits_cents + :c WHERE id = :a`, { c: order.credits_cents, a: order.agent_id });
      return NextResponse.json({ ok: true, status: "completed", creditsAdded: order.credits_cents });
    }
  }
  return NextResponse.json({
    ok: false,
    status: "awaiting_payer",
    approveUrl: order.approve_url,
    note: "Open approveUrl in a browser (PayPal sandbox buyer) to approve, then call this endpoint again.",
  });
}
