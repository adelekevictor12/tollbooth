"use client";

import { useCallback, useEffect, useState } from "react";

interface Stats {
  mode: { paypal: string; apimatic: string };
  listings: any[];
  recentOrders: any[];
  recentUsage: any[];
  totals: { gross_cents: number; net_cents: number; total_calls: number; paid_orders: number; total_orders: number };
}

const usd = (c: number) => `$${(c / 100).toFixed(2)}`;

export default function DevDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [form, setForm] = useState({ name: "", tagline: "", specUrl: "", pricePerCallCents: 2, upstreamBaseUrl: "", devEmail: "" });
  const [publishMsg, setPublishMsg] = useState("");
  const [payoutEmail, setPayoutEmail] = useState("seller-demo@tollbooth.test");
  const [payoutMsg, setPayoutMsg] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/stats", { cache: "no-store" });
    setStats(await res.json());
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 4000); // live-ish updates while agents shop
    return () => clearInterval(t);
  }, [load]);

  async function publish(e: React.FormEvent) {
    e.preventDefault();
    setPublishMsg("Publishing… (APIMatic transform → context + SDKs)");
    const res = await fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    setPublishMsg(res.ok ? `✅ Listed as '${json.slug}' — ${json.apimatic?.transformNote ?? ""}` : `❌ ${json.error}`);
    if (res.ok) {
      setForm({ ...form, name: "", tagline: "", specUrl: "", upstreamBaseUrl: "" });
      load();
    }
  }

  async function payout() {
    setPayoutMsg("Sending…");
    const res = await fetch("/api/payouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: payoutEmail }),
    });
    const json = await res.json();
    setPayoutMsg(res.ok ? `✅ Paid ${usd(json.amountCents)} (batch ${json.batchId}, ${json.mode} mode)` : `❌ ${json.error ?? "nothing to withdraw"}`);
    load();
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Developer dashboard</h1>
      <p className="text-sm text-neutral-500 mt-1">
        mode: PayPal <span className="text-amber-400">{stats?.mode.paypal ?? "…"}</span> · APIMatic{" "}
        <span className="text-amber-400">{stats?.mode.apimatic ?? "…"}</span> · auto-refreshing
      </p>

      {/* KPI row */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          ["API calls", stats?.totals.total_calls ?? 0, "billed through the gateway"],
          ["Usage revenue", usd(stats?.totals.gross_cents ?? 0), "metered, per-call"],
          ["Your earnings", usd(stats?.totals.net_cents ?? 0), "after platform fee"],
          ["Credit packs sold", stats?.totals.paid_orders ?? 0, "paid via PayPal"],
        ].map(([label, value, sub]) => (
          <div key={String(label)} className="border border-neutral-800 rounded-lg p-4 bg-neutral-900/40">
            <div className="text-xs uppercase tracking-wide text-neutral-500">{label}</div>
            <div className="text-2xl font-bold mt-1 text-amber-400">{value}</div>
            <div className="text-xs text-neutral-500 mt-1">{sub}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid lg:grid-cols-2 gap-6">
        {/* Publish form */}
        <section className="border border-neutral-800 rounded-lg p-5 bg-neutral-900/40">
          <h2 className="font-semibold">Publish an API</h2>
          <p className="text-xs text-neutral-500 mt-1">Paste a spec URL — APIMatic transforms it, we generate the agent context + SDKs.</p>
          <form onSubmit={publish} className="mt-4 space-y-3 text-sm">
            <input required placeholder="API name (e.g. WeatherNow)" className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 focus:border-amber-400 outline-none"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input placeholder="Tagline" className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 focus:border-amber-400 outline-none"
              value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
            <input required placeholder="OpenAPI spec URL (or Postman collection URL)" className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 focus:border-amber-400 outline-none"
              value={form.specUrl} onChange={(e) => setForm({ ...form, specUrl: e.target.value })} />
            <input required placeholder="Upstream base URL (your real API)" className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 focus:border-amber-400 outline-none"
              value={form.upstreamBaseUrl} onChange={(e) => setForm({ ...form, upstreamBaseUrl: e.target.value })} />
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-neutral-500">Price per call (cents)</label>
                <input type="number" min={1} className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 focus:border-amber-400 outline-none"
                  value={form.pricePerCallCents} onChange={(e) => setForm({ ...form, pricePerCallCents: Number(e.target.value) })} />
              </div>
              <div className="flex-1">
                <label className="text-xs text-neutral-500">Payout email (PayPal)</label>
                <input className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 focus:border-amber-400 outline-none"
                  value={form.devEmail} onChange={(e) => setForm({ ...form, devEmail: e.target.value })} />
              </div>
            </div>
            <button className="w-full bg-amber-400 text-neutral-950 font-semibold rounded py-2 hover:bg-amber-300 transition-colors">
              Publish to marketplace
            </button>
            {publishMsg && <p className="text-xs text-neutral-400 break-words">{publishMsg}</p>}
          </form>
        </section>

        {/* Listings table */}
        <section className="border border-neutral-800 rounded-lg p-5 bg-neutral-900/40">
          <h2 className="font-semibold">Your listings</h2>
          <table className="w-full text-sm mt-3">
            <thead>
              <tr className="text-left text-xs text-neutral-500 uppercase tracking-wide">
                <th className="py-2">API</th><th>Price</th><th>Calls</th><th className="text-right">Earnings</th>
              </tr>
            </thead>
            <tbody>
              {(stats?.listings ?? []).map((l: any) => (
                <tr key={l.slug} className="border-t border-neutral-800">
                  <td className="py-2"><a className="hover:text-amber-400" href={`/listing/${l.slug}`}>{l.name}</a></td>
                  <td>{usd(l.price_per_call_cents)}</td>
                  <td>{l.calls}</td>
                  <td className="text-right text-amber-400 font-medium">{usd(l.net_cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Payout */}
          <div className="mt-6 pt-4 border-t border-neutral-800">
            <h3 className="font-semibold text-sm">Withdraw earnings</h3>
            <div className="flex gap-2 mt-2">
              <input className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-sm focus:border-amber-400 outline-none"
                value={payoutEmail} onChange={(e) => setPayoutEmail(e.target.value)} placeholder="your PayPal email" />
              <button onClick={payout} className="bg-amber-400 text-neutral-950 font-semibold rounded px-4 text-sm hover:bg-amber-300">
                Payout
              </button>
            </div>
            {payoutMsg && <p className="text-xs text-neutral-400 mt-2 break-words">{payoutMsg}</p>}
          </div>
        </section>
      </div>

      {/* Activity feeds */}
      <div className="mt-6 grid lg:grid-cols-2 gap-6">
        <section className="border border-neutral-800 rounded-lg p-5 bg-neutral-900/40">
          <h2 className="font-semibold">Agent purchases <span className="text-xs text-neutral-500 font-normal">(PayPal credit packs)</span></h2>
          <div className="mt-3 text-sm">
            {(stats?.recentOrders ?? []).length === 0 && <p className="text-neutral-500 text-xs">No orders yet — run the agent demo.</p>}
            {(stats?.recentOrders ?? []).map((o: any) => (
              <div key={o.id} className="flex justify-between border-t border-neutral-800 py-2">
                <span className="text-neutral-300">{o.agent} <span className="text-neutral-500">bought {o.pack_name} pack</span></span>
                <span className={o.status === "completed" ? "text-emerald-400" : "text-neutral-500"}>
                  {usd(o.amount_cents)} · {o.status}
                </span>
              </div>
            ))}
          </div>
        </section>
        <section className="border border-neutral-800 rounded-lg p-5 bg-neutral-900/40">
          <h2 className="font-semibold">Live gateway usage <span className="text-xs text-neutral-500 font-normal">(metered calls)</span></h2>
          <div className="mt-3 text-sm max-h-64 overflow-y-auto">
            {(stats?.recentUsage ?? []).length === 0 && <p className="text-neutral-500 text-xs">No calls yet.</p>}
            {(stats?.recentUsage ?? []).map((u: any, i: number) => (
              <div key={i} className="flex justify-between border-t border-neutral-800 py-2 text-xs">
                <span className="text-neutral-300">{u.agent} → {u.listing} <span className="text-neutral-500">{u.method} {u.path}</span></span>
                <span className="text-amber-400">{usd(u.cost_cents)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
