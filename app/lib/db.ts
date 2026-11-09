/**
 * Tollbooth database — node:sqlite (built into Node 24), zero native deps.
 * Single file at app/data/tollbooth.db (gitignored).
 */
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");
mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(path.join(DATA_DIR, "tollbooth.db"), { open: true });

db.exec(`
CREATE TABLE IF NOT EXISTS agents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  api_key TEXT NOT NULL UNIQUE,
  credits_cents INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS listings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  tagline TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  context_md TEXT NOT NULL DEFAULT '',
  spec_url TEXT NOT NULL DEFAULT '',
  spec_format TEXT NOT NULL DEFAULT 'openapi3',
  sdk_languages TEXT NOT NULL DEFAULT '[]',          -- JSON array of generated SDK languages
  price_per_call_cents INTEGER NOT NULL DEFAULT 1,
  monthly_cents INTEGER NOT NULL DEFAULT 0,
  upstream_base_url TEXT NOT NULL,
  dev_email TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'live',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id INTEGER NOT NULL REFERENCES agents(id),
  pack_name TEXT NOT NULL,
  credits_cents INTEGER NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  paypal_order_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'created',            -- created|approved|completed|cancelled
  approve_url TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  paid_at TEXT
);
CREATE TABLE IF NOT EXISTS usage_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_id INTEGER NOT NULL REFERENCES listings(id),
  agent_id INTEGER NOT NULL REFERENCES agents(id),
  path TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  cost_cents INTEGER NOT NULL,
  ts TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS payouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  amount_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

export default db;

// ── tiny helpers ──────────────────────────────────────────────────────
export function q<T = any>(sql: string, params: Record<string, any> = {}): T[] {
  const stmt = db.prepare(sql);
  stmt.setAllowUnknownNamedParameters(true);
  return stmt.all(params as any) as T[];
}

export function run(sql: string, params: Record<string, any> = {}): number {
  const stmt = db.prepare(sql);
  stmt.setAllowUnknownNamedParameters(true);
  const res = stmt.run(params as any);
  return Number(res.lastInsertRowid);
}
