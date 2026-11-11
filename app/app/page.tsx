import Link from "next/link";
import { q } from "@/lib/db";
import { ensureSeeded } from "@/lib/seed";
import { money } from "@/lib/util";
import { payPalMode } from "@/lib/paypal";
import { apimaticEnabled } from "@/lib/apimatic";

export const dynamic = "force-dynamic";

export default function Home() {
  ensureSeeded();
  const listings = q(
    `SELECT slug, name, tagline, price_per_call_cents FROM listings WHERE status = 'live' ORDER BY id DESC`
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Hero */}
      <section className="mb-14">
        <p className="text-amber-400 text-sm font-medium mb-3 tracking-wide uppercase">
          The agent economy needs a cash register
        </p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight max-w-3xl">
          Give your API a tollbooth.
          <br />
          <span className="text-neutral-400">Let AI agents discover it, read it, and pay for it.</span>
        </h1>
        <p className="mt-5 text-neutral-400 max-w-2xl leading-relaxed">
          Paste an OpenAPI spec. Tollbooth generates a typed SDK and an LLM-readable context file via
          <span className="text-neutral-200"> APIMatic</span>, lists your API in an
          <span className="text-neutral-200"> MCP-discoverable marketplace</span>, and meters per-call billing through
          <span className="text-neutral-200"> PayPal</span> — so autonomous agents can buy and consume your API with no human in the loop.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/dev"
            className="bg-amber-400 text-neutral-950 font-semibold px-5 py-2.5 rounded-md hover:bg-amber-300 transition-colors"
          >
            Publish an API
          </Link>
          <Link
            href="/listing/sentimentscan"
            className="border border-neutral-700 px-5 py-2.5 rounded-md hover:border-amber-400 transition-colors"
          >
            Explore a live listing →
          </Link>
        </div>
        <div className="mt-6 flex gap-4 text-xs text-neutral-500">
          <span className={`px-2 py-1 rounded border ${payPalMode === "live" ? "border-sky-700 text-sky-400" : payPalMode === "sandbox" ? "border-emerald-700 text-emerald-400" : "border-neutral-700"}`}>
            PayPal: {payPalMode}
          </span>
          <span className={`px-2 py-1 rounded border ${apimaticEnabled ? "border-emerald-700 text-emerald-400" : "border-neutral-700"}`}>
            APIMatic: {apimaticEnabled ? "live" : "local mode"}
          </span>
        </div>
      </section>

      {/* Marketplace */}
      <section>
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="text-xl font-semibold">Marketplace</h2>
          <span className="text-xs text-neutral-500">agents browse this catalog via the Tollbooth MCP server</span>
        </div>
        {listings.length === 0 ? (
          <p className="text-neutral-500">No APIs listed yet — publish one from the Developer dashboard.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map((l: any) => (
              <Link
                key={l.slug}
                href={`/listing/${l.slug}`}
                className="border border-neutral-800 rounded-lg p-5 hover:border-amber-400/60 transition-colors bg-neutral-900/40"
              >
                <div className="font-semibold">{l.name}</div>
                <p className="text-sm text-neutral-400 mt-1.5 leading-relaxed">{l.tagline}</p>
                <div className="mt-4 text-amber-400 text-sm font-medium">{money(l.price_per_call_cents)} / call</div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="mt-16 grid md:grid-cols-3 gap-4">
        {[
          {
            step: "1 · Publish",
            title: "Spec in, product out",
            body: "APIMatic transforms your spec (Postman, Swagger, OpenAPI…) and generates TypeScript + Python SDKs plus a Code Context file agents can actually read.",
          },
          {
            step: "2 · Discover",
            title: "Agents find you via MCP",
            body: "The Tollbooth MCP server exposes your catalog and context files to Claude, GPT and any MCP client. Agents compare pricing and read your docs themselves.",
          },
          {
            step: "3 · Get paid",
            title: "PayPal per call",
            body: "Agents buy credit packs through PayPal Orders, the gateway meters every call, and you withdraw earnings via PayPal Payouts. Failed calls are never billed.",
          },
        ].map((c) => (
          <div key={c.step} className="border border-neutral-800 rounded-lg p-5 bg-neutral-900/40">
            <div className="text-amber-400 text-xs font-semibold tracking-wide uppercase">{c.step}</div>
            <div className="font-semibold mt-2">{c.title}</div>
            <p className="text-sm text-neutral-400 mt-2 leading-relaxed">{c.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
