import { NextRequest, NextResponse } from "next/server";
import { run, q } from "@/lib/db";
import { newApiKey } from "@/lib/util";

/** POST /api/agents — register an agent, get an API key. Body: { name } */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const name = body?.name ?? "unnamed-agent";
  const apiKey = newApiKey();
  const id = run(`INSERT INTO agents (name, api_key, credits_cents) VALUES (:name, :key, 0)`, { name, key: apiKey });
  return NextResponse.json({ ok: true, agentId: id, name, apiKey, credits: 0 }, { status: 201 });
}
