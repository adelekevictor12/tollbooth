import { NextRequest, NextResponse } from "next/server";
import { q, run } from "@/lib/db";
import { sendPayout, payPalMode } from "@/lib/paypal";

/**
 * POST /api/payouts — developer withdraws API earnings via PayPal Payouts API.
 * Body: { email } — sandbox or mock depending on mode.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = body?.email;
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  const fee = Number(process.env.PLATFORM_FEE_PCT ?? 10) / 100;
  const gross = (q(`SELECT COALESCE(SUM(cost_cents), 0) AS g FROM usage_events`)[0] as any).g ?? 0;
  const already = (q(`SELECT COALESCE(SUM(amount_cents), 0) AS p FROM payouts`)[0] as any).p ?? 0;
  const available = Math.round(gross * (1 - fee)) - already;
  if (available <= 0) return NextResponse.json({ error: "nothing available to withdraw", available }, { status: 400 });

  const batchId = await sendPayout(email, available, "Your Tollbooth API earnings");
  run(`INSERT INTO payouts (amount_cents, status, note) VALUES (:a, 'sent', :n)`, { a: available, n: `batch ${batchId} → ${email}` });
  return NextResponse.json({ ok: true, amountCents: available, batchId, mode: payPalMode });
}

/** GET /api/payouts — payout history + available balance. */
export async function GET() {
  const fee = Number(process.env.PLATFORM_FEE_PCT ?? 10) / 100;
  const gross = (q(`SELECT COALESCE(SUM(cost_cents), 0) AS g FROM usage_events`)[0] as any).g ?? 0;
  const paid = (q(`SELECT COALESCE(SUM(amount_cents), 0) AS p FROM payouts`)[0] as any).p ?? 0;
  const history = q(`SELECT * FROM payouts ORDER BY id DESC LIMIT 20`);
  return NextResponse.json({ availableCents: Math.round(gross * (1 - fee)) - paid, paidCents: paid, history });
}
