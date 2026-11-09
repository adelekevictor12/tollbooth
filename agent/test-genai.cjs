const p = require("node:process");
p.loadEnvFile("C:/Users/Victor/tollbooth/agent/.env");
import("@google/genai")
  .then(async ({ GoogleGenAI }) => {
    const ai = new GoogleGenAI({ apiKey: p.env.GEMINI_API_KEY });
    console.log("calling generateContent (no tools)...");
    const t0 = Date.now();
    const r = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: "Say OK" });
    console.log("plain call ok in", Date.now() - t0, "ms — text:", (r.text ?? "").slice(0, 40));

    console.log("calling with a function declaration...");
    const t1 = Date.now();
    const decl = {
      name: "tb_register_agent",
      description: "Register the agent",
      parametersJsonSchema: {
        type: "object",
        properties: { name: { type: "string" } },
        required: ["name"],
      },
    };
    const r2 = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Register yourself using the tool.",
      config: { tools: [{ functionDeclarations: [decl] }] },
    });
    console.log("tools call ok in", Date.now() - t1, "ms — functionCalls:", JSON.stringify(r2.functionCalls));
    process.exit(0);
  })
  .catch((e) => {
    console.log("FAILED:", e.message);
    process.exit(1);
  });
