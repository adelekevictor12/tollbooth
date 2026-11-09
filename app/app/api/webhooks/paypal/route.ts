import { NextRequest, NextResponse } from "next/server";
import { q, run } from "@/lib/db";
import { verifyWebhook } from "@/lib/paypal";

/**
 * POST /api/webhooks/paypal — PAYMENT.CAPTURE.COMPLETED tops up agent credits.
 * Configure this URL in the PayPal developer dashboard webhook subscription.
 */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const ok = await verifyWebhook(req.headers, raw);
  if (!ok) return NextResponse.json({ error: "invalid signature" }, { status: 401 });

  let event: any;
  try { event = JSON.parse(raw); } catch { return NextResponse.json({ error: "bad payload" }, { status: 400 }); }

  if (event?.event_type === "PAYMENT.CAPTURE.COMPLETED" || event?.event_type === "CHECKOUT.ORDER.APPROVED") {
    const ppOrderId =
      event.resource?.supplementary_data?.related_ids?.order_id ?? event.resource?.id ?? "";
    const order = q(`SELECT * FROM orders WHERE paypal_order_id = :p AND status != 'completed'`, { p: ppOrderId })[0];
    if (order) {
      run(`UPDATE orders SET status = 'completed', paid_at = datetime('now') WHERE id = :id`, { id: order.id });
      run(`UPDATE agents SET credits_cents = credits_cents + :c WHERE id = :a`, { c: order.credits_cents, a: order.agent_id });
    }
  }
  return NextResponse.json({ received: true });
}
