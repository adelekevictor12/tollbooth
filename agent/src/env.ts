/** Loads agent/.env into process.env (Node 24 built-in, no dependency). */
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const envPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", ".env");
try {
  process.loadEnvFile(envPath);
} catch {
  // no .env file — rely on real environment variables
}
export {};
