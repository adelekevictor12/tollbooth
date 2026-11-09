import { NextRequest, NextResponse } from "next/server";
import { run, q } from "@/lib/db";
import { agentByApiKey } from "@/lib/auth";
import { createOrder, payPalMode } from "@/lib/paypal";
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
     VALUES (:agent, :pack, :credits, :amount, :ppid, 'created', :url)`,
    { agent: agent.id, pack: pack.name, credits: pack.credits_cents, amount: pack.amount_cents, ppid: order.paypalOrderId, url: order.approveUrl }
  );

  return NextResponse.json({
    ok: true,
    orderId: id,
    pack: pack.name,
    credits: pack.credits_cents,
    amountUsd: `$${(pack.amount_cents / 100).toFixed(2)}`,
    paypalOrderId: order.paypalOrderId,
    approveUrl: order.approveUrl,
    mode: payPalMode,
    next:
      payPalMode === "mock"
        ? "Mock mode: call tb_approve_order / POST /api/orders/{id}/approve to simulate payer approval."
        : "Sandbox mode: the payer must open approveUrl (PayPal buyer approval), then capture completes via webhook or approve endpoint.",
  }, { status: 201 });
}
