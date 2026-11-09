import { NextRequest, NextResponse } from "next/server";
import { q, run } from "@/lib/db";
import { slugify } from "@/lib/util";
import { transformSpec, generateSdks, apimaticEnabled } from "@/lib/apimatic";
import { generateContextMd } from "@/lib/context";

/** GET /api/listings — public marketplace catalog. */
export async function GET() {
  const rows = q(`SELECT slug, name, tagline, price_per_call_cents, status, created_at FROM listings WHERE status = 'live' ORDER BY id DESC`);
  return NextResponse.json({ listings: rows });
}

/**
 * POST /api/listings — publish an API.
 * Body: { name, tagline?, description?, specUrl?, spec? (inline), pricePerCallCents, upstreamBaseUrl, devEmail? }
 * Pipeline: APIMatic Transformer → context generation (+ APIMatic Codegen SDKs when key present).
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.name || !body?.upstreamBaseUrl) {
    return NextResponse.json({ error: "name and upstreamBaseUrl are required" }, { status: 400 });
  }

  // 1. Obtain the raw spec (inline or fetched).
  let rawSpec: unknown = body.spec ?? null;
  if (!rawSpec && body.specUrl) {
    const res = await fetch(body.specUrl, { headers: { Accept: "application/json" } });
    if (!res.ok) return NextResponse.json({ error: `Could not fetch spec: ${res.status}` }, { status: 400 });
    rawSpec = await res.json().catch(() => null);
  }
  if (!rawSpec) return NextResponse.json({ error: "Provide specUrl or inline spec" }, { status: 400 });

  // 2. APIMatic Transformer (normalizes any format → OpenAPI 3). Falls back locally.
  const transformed = await transformSpec(rawSpec, body.specFormat ?? "openapi3");

  // 3. Agent-legible context + typed SDKs.
  const slug = slugify(body.name);
  const contextMd = generateContextMd({
    name: body.name,
    tagline: body.tagline ?? "",
    description: body.description ?? "",
    pricePerCallCents: body.pricePerCallCents ?? 1,
    spec: transformed.spec,
  });
  const sdk = await generateSdks(slug, transformed.spec);

  const id = run(
    `INSERT INTO listings (slug, name, tagline, description, context_md, spec_url, spec_format, sdk_languages, price_per_call_cents, upstream_base_url, dev_email)
     VALUES (:slug, :name, :tagline, :description, :context_md, :spec_url, :spec_format, :sdk_languages, :price, :upstream, :email)`,
    {
      slug,
      name: body.name,
      tagline: body.tagline ?? "",
      description: body.description ?? "",
      context_md: contextMd,
      spec_url: body.specUrl ?? "inline",
      spec_format: body.specFormat ?? "openapi3",
      sdk_languages: JSON.stringify(sdk.languages),
      price: body.pricePerCallCents ?? 1,
      upstream: body.upstreamBaseUrl,
      email: body.devEmail ?? "",
    }
  );

  return NextResponse.json({
    ok: true,
    id,
    slug,
    apimatic: { enabled: apimaticEnabled, transform: transformed.status, transformNote: transformed.note, sdk: sdk.status, sdkNote: sdk.note },
  }, { status: 201 });
}
