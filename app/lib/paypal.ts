import crypto from "node:crypto";

/**
 * PayPal client — Orders API + webhook verification + Payouts, with a local
 * mock mode so the entire demo runs with zero credentials.
 *
 * Modes (env PAYPAL_MODE):
 *   - "mock"    (default when PAYPAL_CLIENT_ID is empty): orders are created,
 *               "approved" and completed locally. Perfect for dev & CI.
 *   - "sandbox": real PayPal sandbox. Agent creates the order; the human (or
 *               sandbox buyer session) approves via the PayPal approve URL;
 *               our webhook (PAYMENT.CAPTURE.COMPLETED) tops up credits.
 *   - "live":    production PayPal (https://api-m.paypal.com) using your live
 *               app's credentials. Defaults to the PayPal-wallet flow (payer
 *               approves via PayPal); unattended agent-card capture in live is
 *               PayPal "advanced card processing" — enable it only if your
 *               account has that approval, via PAYPAL_LIVE_AGENT_CARD=true
 *               plus real card details (a sandbox test card is never sent to
 *               the live API). Webhooks and Payouts use the live endpoints
 *               automatically — set PAYPAL_WEBHOOK_ID to your LIVE app's
 *               webhook subscription and ensure payouts are enabled.
 */
const MODE = (process.env.PAYPAL_MODE ?? "").trim().toLowerCase();
const BASE = MODE === "live"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

const CLIENT_ID = process.env.PAYPAL_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET ?? "";

export const payPalMode: "mock" | "sandbox" | "live" =
  CLIENT_ID && MODE !== "mock" ? (MODE === "live" ? "live" : "sandbox") : "mock";

// ── OAuth ─────────────────────────────────────────────────────────────
let tokenCache: { token: string; expires: number } | null = null;

async function getToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expires - 60_000) return tokenCache.token;
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`PayPal OAuth failed: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as { access_token: string; expires_in: number };
  tokenCache = { token: json.access_token, expires: Date.now() + json.expires_in * 1000 };
  return json.access_token;
}

async function pp<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`PayPal ${path} failed: ${res.status} ${await res.text()}`);
  return (await res.json()) as T;
}

// ── Orders ────────────────────────────────────────────────────────────
export interface CreatedOrder {
  paypalOrderId: string;
  approveUrl: string;
  mock: boolean;
  /** True when the payment completed at creation (agent card flow). */
  completed: boolean;
}

/**
 * AGENT CARD FLOW (default in sandbox when PAYPAL_AGENT_CARD=true):
 * the agent buys with its own funded payment card through PayPal's Orders
 * API (payment_source.card) — the order creates AND captures in one call,
 * fully autonomous, no browser approval step. Set PAYPAL_AGENT_CARD=false
 * to use the PayPal-wallet flow where a human approves via the approve URL.
 *
 * In LIVE mode this is PayPal "advanced card processing": it requires
 * explicit opt-in (PAYPAL_LIVE_AGENT_CARD=true) AND real card details via
 * env — the default sandbox test card is never sent to the live API.
 * Without that, live orders use the wallet flow.
 */
const agentCardRequested = (process.env.PAYPAL_AGENT_CARD ?? "true") !== "false";
export const agentCardEnabled =
  payPalMode === "live"
    ? agentCardRequested &&
      process.env.PAYPAL_LIVE_AGENT_CARD === "true" &&
      Boolean(process.env.PAYPAL_AGENT_CARD_NUMBER)
    : agentCardRequested;

export async function createOrder(amountCents: number, packName: string): Promise<CreatedOrder> {
  if (payPalMode === "mock") {
    const id = "MOCK-" + crypto.randomUUID().slice(0, 8).toUpperCase();
    return { paypalOrderId: id, approveUrl: `mock://${id}/${packName}`, mock: true, completed: false };
  }

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  // Marketplace model: when a seller account is configured, payments route
  // directly to the API seller (payee) instead of the platform facilitator.
  const payeeEmail = process.env.PAYPAL_PAYEE_EMAIL;
  const requestId = "tb-" + crypto.randomUUID();

  if (agentCardEnabled) {
    const json = await pp<any>("/v2/checkout/orders", {
      method: "POST",
      headers: { "PayPal-Request-Id": requestId },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: packName,
            description: `Tollbooth credit pack: ${packName}`,
            amount: { currency_code: "USD", value: (amountCents / 100).toFixed(2) },
            ...(payeeEmail ? { payee: { email_address: payeeEmail } } : {}),
          },
        ],
        // The agent's own funded payment card — PayPal processes it directly,
        // so the order completes with no payer browser session at all.
        payment_source: {
          card: {
            name: process.env.PAYPAL_AGENT_CARD_NAME ?? "Tollbooth Agent",
            number: process.env.PAYPAL_AGENT_CARD_NUMBER ?? "4012001037141112",
            expiry: process.env.PAYPAL_AGENT_CARD_EXPIRY ?? "2030-12",
            security_code: process.env.PAYPAL_AGENT_CARD_CVV ?? "123",
            billing_address: { country_code: "US" },
          },
        },
      }),
    });
    return {
      paypalOrderId: json.id,
      approveUrl: "",
      mock: false,
      completed: json.status === "COMPLETED",
    };
  }

  const json = await pp<any>("/v2/checkout/orders", {
    method: "POST",
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: packName,
          description: `Tollbooth credit pack: ${packName}`,
          amount: { currency_code: "USD", value: (amountCents / 100).toFixed(2) },
          ...(payeeEmail ? { payee: { email_address: payeeEmail } } : {}),
        },
      ],
      // Agent-initiated purchase; the payer approves via the returned link.
      payment_source: {
        paypal: {
          experience_context: {
            return_url: `${appUrl}/dev?paid=1`,
            cancel_url: `${appUrl}/dev?cancelled=1`,
            user_action: "PAY_NOW",
          },
        },
      },
    }),
  });
  const approve = json.links?.find((l: any) => l.rel === "payer-action" || l.rel === "approve")?.href ?? "";
  return { paypalOrderId: json.id, approveUrl: approve, mock: false, completed: false };
}

/** Simulate payer approval + capture. Mock mode only. */
export async function mockApproveAndCapture(paypalOrderId: string): Promise<void> {
  if (payPalMode !== "mock") throw new Error("mockApproveAndCapture only valid in mock mode");
  void paypalOrderId;
}

/** Capture a payer-approved order (sandbox). Returns true when completed. */
export async function captureOrder(paypalOrderId: string): Promise<boolean> {
  if (payPalMode === "mock") return true;
  try {
    const json = await pp<any>(`/v2/checkout/orders/${paypalOrderId}/capture`, { method: "POST" });
    return json.status === "COMPLETED";
  } catch {
    return false;
  }
}

export async function getOrderStatus(paypalOrderId: string): Promise<string> {
  if (payPalMode === "mock") return "COMPLETED";
  const json = await pp<any>(`/v2/checkout/orders/${paypalOrderId}`);
  return json.status;
}

// ── Webhook signature verification (sandbox) ──────────────────────────
export async function verifyWebhook(headers: Headers, rawBody: string): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) return payPalMode === "mock"; // mock/dev: accept
  try {
    const json = await pp<{ verification_status: string }>("/v1/notifications/verify-webhook-signature", {
      method: "POST",
      body: JSON.stringify({
        auth_algo: headers.get("paypal-auth-algo"),
        cert_url: headers.get("paypal-cert-url"),
        transmission_id: headers.get("paypal-transmission-id"),
        transmission_sig: headers.get("paypal-transmission-sig"),
        transmission_time: headers.get("paypal-transmission-time"),
        webhook_id: webhookId,
        webhook_event: JSON.parse(rawBody),
      }),
    });
    return json.verification_status === "SUCCESS";
  } catch {
    return false;
  }
}

// ── Payouts (developer earnings) ──────────────────────────────────────
export async function sendPayout(email: string, amountCents: number, note: string): Promise<string> {
  if (payPalMode === "mock") return "MOCK-PAYOUT-" + Date.now();
  const json = await pp<any>("/v1/payments/payouts", {
    method: "POST",
    body: JSON.stringify({
      sender_batch_header: {
        sender_batch_id: "tb-" + Date.now(),
        email_subject: "You have a payout from Tollbooth",
        email_message: note,
      },
      items: [
        {
          recipient_type: "EMAIL",
          receiver: email,
          amount: { value: (amountCents / 100).toFixed(2), currency: "USD" },
          note,
          sender_item_id: "tb-payout-" + Date.now(),
        },
      ],
    }),
  });
  return json.batch_header?.payout_batch_id ?? "unknown";
}
