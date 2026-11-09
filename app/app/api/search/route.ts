import { NextRequest, NextResponse } from "next/server";
import { q } from "@/lib/db";
import { money } from "@/lib/util";

/** Naive but effective keyword search over listings (name, tagline, description, context). */
export async function GET(req: NextRequest) {
  const query = (req.nextUrl.searchParams.get("q") ?? "").toLowerCase().trim();
  const rows = q(`SELECT slug, name, tagline, price_per_call_cents FROM listings WHERE status = 'live'`);
  if (!query) return NextResponse.json({ results: rows.map(r => ({ ...r, price: money(r.price_per_call_cents) })) });

  const terms = query.split(/\s+/);
  const scored = rows
    .map((r: any) => {
      const hay = `${r.name} ${r.tagline}`.toLowerCase();
      const ctx = (q(`SELECT context_md FROM listings WHERE slug = :slug`, { slug: r.slug })[0]?.context_md ?? "").toLowerCase();
      const score = terms.reduce((s: number, t: string) => s + (hay.includes(t) ? 3 : 0) + (ctx.includes(t) ? 1 : 0), 0);
      return { slug: r.slug, name: r.name, tagline: r.tagline, price: money(r.price_per_call_cents), score };
    })
    .filter((r: any) => r.score > 0)
    .sort((a: any, b: any) => b.score - a.score);

  return NextResponse.json({ results: scored.map(({ score, ...r }: any) => r) });
}
