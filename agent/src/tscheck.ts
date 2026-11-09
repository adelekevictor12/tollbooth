import "./env.ts";
import { GoogleGenAI } from "@google/genai";

console.log("step 1: plain fetch to the API (unauthenticated)...");
const t0 = Date.now();
const r1 = await fetch("https://generativelanguage.googleapis.com/v1beta/models");
console.log("plain fetch status:", r1.status, "in", Date.now() - t0, "ms");

console.log("step 2: SDK call...");
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const t1 = Date.now();
try {
  const r = await Promise.race([
    ai.models.generateContent({ model: "gemini-3.8-flash", contents: "Say OK" }),
    new Promise((_, rej) => setTimeout(() => rej(new Error("SDK call timed out after 45s")), 45_000)),
  ]);
  console.log("sdk ok in", Date.now() - t1, "ms — text:", (r as any).text?.slice(0, 40));
} catch (e: any) {
  console.log("sdk failed after", Date.now() - t1, "ms:", e.message);
}
process.exit(0);
