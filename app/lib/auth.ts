import { q } from "@/lib/db";

export function agentByApiKey(key: string | null | undefined) {
  if (!key) return null;
  const raw = key.replace(/^Bearer\s+/i, "");
  return q(`SELECT id, name, api_key, credits_cents FROM agents WHERE api_key = :key`, { key: raw })[0] ?? null;
}
