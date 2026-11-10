/**
 * Next.js instrumentation — runs once when the server instance starts,
 * before it serves any request.
 *
 * Seeds the demo listing so a fresh deploy (including one on an ephemeral
 * disk, e.g. Render's free tier) always shows a browsable marketplace —
 * no manual `POST /api/seed` needed.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return; // node:sqlite is node-only

  // On Render the public URL is injected as RENDER_EXTERNAL_URL; expose it
  // to the rest of the app as APP_URL when the operator hasn't set one.
  if (!process.env.APP_URL && process.env.RENDER_EXTERNAL_URL) {
    process.env.APP_URL = process.env.RENDER_EXTERNAL_URL;
  }

  try {
    const { ensureSeeded } = await import("./lib/seed");
    ensureSeeded();
  } catch (err) {
    // Never block boot on seeding — the marketplace is just empty until
    // someone hits /api/seed or publishes a listing.
    console.error("[tollbooth] boot seed failed:", err);
  }
}
