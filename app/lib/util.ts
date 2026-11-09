import crypto from "node:crypto";

export function newApiKey(): string {
  return "tbk_" + crypto.randomBytes(24).toString("hex");
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "api-" + crypto.randomBytes(3).toString("hex");
}

export function money(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/** Credit packs the marketplace sells to agents (credits are cents). */
export const CREDIT_PACKS = [
  { name: "starter", credits_cents: 500, amount_cents: 500, label: "500 credits — $5.00" },
  { name: "pro", credits_cents: 2000, amount_cents: 1800, label: "2,000 credits — $18.00" },
  { name: "mega", credits_cents: 5000, amount_cents: 4000, label: "5,000 credits — $40.00" },
] as const;

export function packByName(name: string) {
  return CREDIT_PACKS.find((p) => p.name === name) ?? CREDIT_PACKS[0];
}
