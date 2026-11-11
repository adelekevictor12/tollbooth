import { NextRequest, NextResponse } from "next/server";

/**
 * Bundled demo upstream API — "SentimentScan".
 * This is the example API seeded into the marketplace; Tollbooth lists it and
 * agents pay per call through the gateway. (Lexicon scorer, no external deps.)
 */
const POSITIVE: Record<string, number> = {
  love: 3, great: 3, excellent: 3, amazing: 3, awesome: 3, good: 2, nice: 2,
  happy: 2, fast: 1, helpful: 2, best: 3, perfect: 3, wonderful: 3, delighted: 3,
  works: 1, recommend: 2, impressed: 2, smooth: 2, reliable: 2, beautiful: 2,
  fantastic: 3, incredible: 3, outstanding: 3, superb: 3, flawless: 3, solid: 2,
  satisfied: 2, pleased: 2, easy: 1, intuitive: 2, sturdy: 2, sleek: 1,
  responsive: 2, worth: 1, value: 1, quality: 1, loved: 3, enjoys: 2, enjoy: 2,
};
const NEGATIVE: Record<string, number> = {
  hate: -3, terrible: -3, awful: -3, worst: -3, bad: -2, slow: -2, broken: -3,
  buggy: -2, disappointing: -3, refund: -2, useless: -3, poor: -2, angry: -3,
  crash: -3, crashes: -3, unhappy: -2, frustrating: -3, misleading: -2, scam: -3,
  garbage: -3, junk: -3, trash: -3, broke: -3, waste: -3, horrible: -3,
  horrendous: -3, pathetic: -3, disgusting: -3, nightmare: -3, damaged: -2,
  defective: -3, unusable: -3, annoying: -2, disappointed: -3, mediocre: -2,
  frustrated: -3, frustratedly: -3, rubbish: -3, sucks: -3, suck: -2, dodgy: -2,
  faulty: -3, malfunctioning: -3, unreliable: -2, flimsy: -2, returned: -1,
};

export async function POST(req: NextRequest) {
  const { text } = (await req.json().catch(() => ({}))) as { text?: string };
  if (!text) return NextResponse.json({ error: "missing 'text' field" }, { status: 400 });

  const words = text.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/).filter(Boolean);
  let score = 0;
  const drivers: string[] = [];
  for (const w of words) {
    if (POSITIVE[w]) { score += POSITIVE[w]; drivers.push(w); }
    if (NEGATIVE[w]) { score += NEGATIVE[w]; drivers.push(w); }
  }
  const norm = words.length ? Math.max(-1, Math.min(1, score / 5)) : 0;
  const label = norm > 0.15 ? "positive" : norm < -0.15 ? "negative" : "neutral";
  return NextResponse.json({ score: Number(norm.toFixed(2)), label, drivers: [...new Set(drivers)] });
}

export async function GET() {
  return NextResponse.json({
    api: "SentimentScan",
    usage: "POST /sentiment {\"text\": \"...\"} → { score, label, drivers }",
  });
}
