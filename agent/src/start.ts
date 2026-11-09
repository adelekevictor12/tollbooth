/**
 * Provider dispatcher — picks the LLM backend for the buyer agent.
 *   AI_PROVIDER=gemini|anthropic (explicit), otherwise auto:
 *   GEMINI_API_KEY → Gemini, ANTHROPIC_API_KEY → Claude.
 */
const provider =
  process.env.AI_PROVIDER ??
  (process.env.GEMINI_API_KEY ? "gemini" : process.env.ANTHROPIC_API_KEY ? "anthropic" : null);

if (!provider) {
  console.error(
    "No AI key found. Set GEMINI_API_KEY (aistudio.google.com) or ANTHROPIC_API_KEY (console.anthropic.com) in agent/.env"
  );
  process.exit(1);
}

console.log(`provider: ${provider}\n`);
if (provider === "gemini") {
  await import("./gemini.ts");
} else {
  await import("./agent.ts");
}
