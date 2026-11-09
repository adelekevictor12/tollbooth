import { q, run } from "@/lib/db";
import { generateContextMd } from "@/lib/context";

/** Bundled demo API spec — a tiny sentiment service hosted by the app itself. */
export const SENTIMENT_SPEC = {
  openapi: "3.0.0",
  info: {
    title: "SentimentScan API",
    version: "1.0.0",
    description:
      "Lexicon-based sentiment analysis for short texts. Returns a polarity score from -1 (negative) to +1 (positive), a label, and per-word drivers.",
  },
  servers: [{ url: "/api/demo-upstream" }],
  paths: {
    "/sentiment": {
      post: {
        summary: "Score the sentiment of a piece of text",
        operationId: "scoreSentiment",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", properties: { text: { type: "string" } }, required: ["text"] },
            },
          },
        },
        responses: {
          "200": {
            description: "Sentiment scores",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    score: { type: "number", description: "-1..1 polarity" },
                    label: { type: "string", enum: ["positive", "neutral", "negative"] },
                    drivers: { type: "array", items: { type: "string" } },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

/** Idempotent: creates the demo listing if the marketplace is empty. */
export function ensureSeeded() {
  const existing = q(`SELECT id FROM listings WHERE slug = :slug`, { slug: "sentimentscan" });
  if (existing.length > 0) return;
  run(
    `INSERT INTO listings (slug, name, tagline, description, context_md, spec_url, price_per_call_cents, upstream_base_url, dev_email, sdk_languages)
     VALUES (:slug, :name, :tagline, :description, :context_md, :spec_url, :price, :upstream, :email, '[]')`,
    {
      slug: "sentimentscan",
      name: "SentimentScan",
      tagline: "Instant sentiment scoring for product reviews, mentions and support tickets.",
      description:
        "SentimentScan scores the polarity of short texts (reviews, tweets, support tickets) in real time. One endpoint, no auth for you to manage — the Tollbooth gateway handles metering.",
      context_md: generateContextMd({
        name: "SentimentScan",
        tagline: "Instant sentiment scoring for product reviews, mentions and support tickets.",
        description: "Lexicon-based sentiment analysis returning a polarity score, label and word-level drivers.",
        pricePerCallCents: 2,
        spec: SENTIMENT_SPEC,
      }),
      spec_url: "bundled",
      price: 2,
      upstream: `${process.env.APP_URL ?? "http://localhost:3000"}/api/demo-upstream`,
      email: "seller-demo@tollbooth.test",
    }
  );
}
