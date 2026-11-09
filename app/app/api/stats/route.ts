import { NextResponse } from "next/server";
import { q } from "@/lib/db";
import { payPalMode } from "@/lib/paypal";
import { apimaticEnabled } from "@/lib/apimatic";

/** GET /api/stats — everything the developer dashboard shows, in one call. */
export async function GET() {
  const listings = q(
    `SELECT l.*, COALESCE(SUM(u.cost_cents), 0) AS gross_cents,
            COUNT(u.id) AS calls
     FROM listings l LEFT JOIN usage_events u ON u.listing_id = l.id
     GROUP BY l.id ORDER BY l.id DESC`
  ).map((l: any) => ({
    ...l,
    net_cents: Math.round(l.gross_cents * (1 - (Number(process.env.PLATFORM_FEE_PCT ?? 10) / 100))),
  }));

  const recentOrders = q(
    `SELECT o.id, o.pack_name, o.amount_cents, o.status, o.created_at, a.name AS agent
     FROM orders o JOIN agents a ON a.id = o.agent_id ORDER BY o.id DESC LIMIT 20`
  );

  const recentUsage = q(
    `SELECT u.ts, l.name AS listing, a.name AS agent, u.method, u.path, u.status_code, u.cost_cents
     FROM usage_events u JOIN listings l ON l.id = u.listing_id JOIN agents a ON a.id = u.agent_id
     ORDER BY u.id DESC LIMIT 30`
  );

  const totals = q(
    `SELECT COALESCE(SUM(amount_cents), 0) AS order_volume,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS paid_orders,
            COUNT(*) AS total_orders FROM orders`
  )[0];

  const grossCents = listings.reduce((s: number, l: any) => s + l.gross_cents, 0);

  return NextResponse.json({
    mode: { paypal: payPalMode, apimatic: apimaticEnabled ? "live" : "local" },
    listings,
    recentOrders,
    recentUsage,
    totals: {
      ...totals,
      gross_cents: grossCents,
      net_cents: Math.round(grossCents * (1 - (Number(process.env.PLATFORM_FEE_PCT ?? 10) / 100))),
      total_calls: listings.reduce((s: number, l: any) => s + l.calls, 0),
    },
  });
}
