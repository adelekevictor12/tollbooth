import { NextRequest, NextResponse } from "next/server";
import { q } from "@/lib/db";

/** GET /api/context/[slug] — the agent-legible context file for a listing. */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const row = q(`SELECT name, context_md FROM listings WHERE slug = :slug AND status = 'live'`, { slug });
  if (!row.length) return NextResponse.json({ error: "not found" }, { status: 404 });
  return new NextResponse(row[0].context_md, { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
}
