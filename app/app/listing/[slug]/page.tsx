import Link from "next/link";
import { notFound } from "next/navigation";
import { q } from "@/lib/db";
import { money } from "@/lib/util";

export const dynamic = "force-dynamic";

export default async function ListingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const listing = q(`SELECT * FROM listings WHERE slug = :slug AND status = 'live'`, { slug })[0];
  if (!listing) notFound();

  const sdkLanguages: string[] = JSON.parse(listing.sdk_languages ?? "[]");
  const curl = `curl -X POST ${process.env.APP_URL ?? "http://localhost:3000"}/api/gw/${listing.slug}/sentiment \\
  -H "x-api-key: <your-tollbooth-key>" \\
  -H "Content-Type: application/json" \\
  -d '{"text": "I love this product, absolutely great!"}'`;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <Link href="/" className="text-sm text-neutral-500 hover:text-amber-400">← Marketplace</Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{listing.name}</h1>
          <p className="text-neutral-400 mt-2 max-w-xl leading-relaxed">{listing.tagline}</p>
        </div>
        <div className="border border-amber-400/40 rounded-lg px-5 py-4 text-center bg-amber-400/5">
          <div className="text-2xl font-bold text-amber-400">{money(listing.price_per_call_cents)}</div>
          <div className="text-xs text-neutral-400">per successful call</div>
        </div>
      </div>

      <p className="mt-6 text-neutral-300 leading-relaxed">{listing.description}</p>

      {/* SDK + context */}
      <div className="mt-8 grid md:grid-cols-2 gap-4">
        <div className="border border-neutral-800 rounded-lg p-5 bg-neutral-900/40">
          <div className="text-xs uppercase tracking-wide text-amber-400 font-semibold">Typed SDKs (APIMatic)</div>
          {sdkLanguages.length > 0 ? (
            <ul className="mt-3 text-sm space-y-2">
              {sdkLanguages.map((lang) => (
                <li key={lang}>
                  <a className="text-blue-400 hover:underline" href={`/sdks/${listing.slug}/${listing.slug}-${lang}-sdk.zip`}>
                    ↓ {listing.slug}-{lang}-sdk.zip
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-neutral-400">
              SDK generation runs via the APIMatic Codegen API when <code className="text-neutral-200">APIMATIC_API_KEY</code> is configured.
            </p>
          )}
        </div>
        <div className="border border-neutral-800 rounded-lg p-5 bg-neutral-900/40">
          <div className="text-xs uppercase tracking-wide text-amber-400 font-semibold">Agent context (llms.txt)</div>
          <a className="mt-3 inline-block text-sm text-blue-400 hover:underline" href={`/api/context/${listing.slug}`}>
            /api/context/{listing.slug} →
          </a>
          <p className="mt-2 text-xs text-neutral-500">Served to agents through the Tollbooth MCP server (tb_get_api_context).</p>
        </div>
      </div>

      {/* Call example */}
      <div className="mt-8 border border-neutral-800 rounded-lg p-5 bg-neutral-900/40">
        <div className="text-xs uppercase tracking-wide text-amber-400 font-semibold mb-3">Call it through the gateway</div>
        <pre className="text-xs text-neutral-300 overflow-x-auto leading-relaxed">{curl}</pre>
      </div>

      {/* Context preview */}
      <div className="mt-8">
        <div className="text-xs uppercase tracking-wide text-neutral-500 font-semibold mb-2">Context file preview</div>
        <pre className="border border-neutral-800 rounded-lg p-5 bg-neutral-900/40 text-xs text-neutral-400 overflow-x-auto max-h-96 overflow-y-auto whitespace-pre-wrap">
          {listing.context_md}
        </pre>
      </div>
    </div>
  );
}
