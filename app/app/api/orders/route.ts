import { NextRequest, NextResponse } from "next/server";
import { run, q } from "@/lib/db";
import { agentByApiKey } from "@/lib/auth";
import { createOrder, payPalMode, agentCardEnabled } from "@/lib/paypal";
import { packByName, CREDIT_PACKS } from "@/lib/util";

/** GET /api/orders — credit packs (public). */
export async function GET() {
  return NextResponse.json({ packs: CREDIT_PACKS, mode: payPalMode });
}

/** POST /api/orders — agent buys a credit pack via PayPal. Body: { pack } Header: x-api-key */
export async function POST(req: NextRequest) {
  const agent = agentByApiKey(req.headers.get("x-api-key"));
  if (!agent) return NextResponse.json({ error: "invalid or missing x-api-key (register first)" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const pack = packByName(body?.pack);
  const order = await createOrder(pack.amount_cents, pack.name);

  const id = run(
    `INSERT INTO orders (agent_id, pack_name, credits_cents, amount_cents, paypal_order_id, status, approve_url)
     VALUES (:agent, :pack, :credits, :amount, :ppid, :status, :url)`,
    {
      agent: agent.id,
      pack: pack.name,
      credits: pack.credits_cents,
      amount: pack.amount_cents,
      ppid: order.paypalOrderId,
      url: order.approveUrl,
      status: order.completed ? "completed" : "created",
    }
  );

  // Agent-card flow: PayPal captured the payment at order creation —
  // credit the agent's balance immediately.
  if (order.completed) {
    run(`UPDATE orders SET paid_at = datetime('now') WHERE id = :id`, { id });
    run(`UPDATE agents SET credits_cents = credits_cents + :c WHERE id = :a`, { c: pack.credits_cents, a: agent.id });
  }

  return NextResponse.json({
    ok: true,
    orderId: id,
    pack: pack.name,
    credits: pack.credits_cents,
    amountUsd: `$${(pack.amount_cents / 100).toFixed(2)}`,
    paypalOrderId: order.paypalOrderId,
    approveUrl: order.approveUrl,
    status: order.completed ? "completed" : "created",
    mode: payPalMode,
    paymentMethod: payPalMode === "mock" ? "mock" : agentCardEnabled ? "agent card (PayPal Orders API, payment_source.card)" : "paypal wallet",
    next: order.completed
      ? "Payment captured by PayPal — credits already added. Optionally confirm with tb_approve_order."
      : payPalMode === "mock"
        ? "Mock mode: call tb_approve_order / POST /api/orders/{id}/approve to simulate payer approval."
        : "Sandbox mode: the payer must open approveUrl (PayPal buyer approval), then capture completes via webhook or approve endpoint.",
  }, { status: 201 });
}
