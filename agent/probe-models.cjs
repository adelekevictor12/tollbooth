const p = require("node:process");
p.loadEnvFile("C:/Users/Victor/tollbooth/agent/.env");
const key = p.env.GEMINI_API_KEY;

const models = [
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-flash-latest",
  "gemini-3-flash-preview",
  "gemini-2.5-pro",
  "gemini-3.1-pro-preview",
];

(async () => {
  for (const m of models) {
    const t0 = Date.now();
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: "Say OK" }] }] }),
          signal: AbortSignal.timeout(30_000),
        }
      );
      const body = await res.json();
      const text = body.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      console.log(`${m.padEnd(24)} HTTP ${res.status} in ${Date.now() - t0}ms ${text ? "→ " + text.slice(0, 20) : body.error?.message?.slice(0, 60) ?? ""}`);
    } catch (e) {
      console.log(`${m.padEnd(24)} ERROR ${e.message}`);
    }
  }
})();
