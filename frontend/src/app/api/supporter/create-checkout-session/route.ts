import { z } from "zod";

import { optionalUser } from "@/server/auth";
import { APP_TAG, env } from "@/server/env";
import { ApiError, json, parseJson, route } from "@/server/http";
import { lowercaseEnum, optionalText } from "@/server/validation";

export const dynamic = "force-dynamic";

/** Limits from data-contracts.md, Domain 6. */
const checkoutSchema = z.object({
  amount_cents: z.number().int().min(500).max(1_000_000).default(1500),
  currency: lowercaseEnum(["aud", "usd", "eur", "gbp", "nzd"]).default("aud"),
  supporter_name: optionalText(255),
  supporter_email: z.email().nullish(),
  comments: optionalText(2000),
  frequency: z.enum(["one_time", "monthly"]).default("one_time"),
});

/**
 * Creates a Stripe Checkout Session for a one-off contribution. Card details are only
 * ever entered on Stripe's hosted page (PCI DSS SAQ A).
 */
export const POST = route(async (req) => {
  if (!env.stripeSecretKey) throw new ApiError(503, "Payments are not configured (STRIPE_SECRET_KEY is not set).");

  const body = await parseJson(req, checkoutSchema);
  const user = await optionalUser(req);
  const email = user?.email ?? body.supporter_email ?? null;
  const name = user?.fullName ?? body.supporter_name ?? "TeachMeHealth Supporter";
  const origin = env.appUrl ?? req.nextUrl.origin;

  const params = new URLSearchParams({
    "payment_method_types[0]": "card",
    mode: "payment",
    "line_items[0][price_data][currency]": body.currency,
    "line_items[0][price_data][unit_amount]": String(body.amount_cents),
    "line_items[0][price_data][product_data][name]": `TeachMeHealth Supporter Contribution - ${APP_TAG.toUpperCase()}`,
    "line_items[0][price_data][product_data][description]": "Supporting open medical education & health AI learning.",
    "line_items[0][quantity]": "1",
    success_url: `${origin}/?supporter_status=success`,
    cancel_url: `${origin}/?supporter_status=cancelled`,
    "metadata[app_tag]": APP_TAG,
    "metadata[role]": "supporter",
    "metadata[user_id]": user ? String(user.id) : "anonymous",
    "metadata[user_name]": name,
    // Stripe metadata values are capped at 500 characters.
    "metadata[comments]": (body.comments ?? "").slice(0, 500),
  });
  // Without a known email, Stripe asks for one on the checkout page.
  if (email) params.set("customer_email", email);

  let res: Response;
  try {
    res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.stripeSecretKey}` },
      body: params,
      signal: AbortSignal.timeout(20_000),
    });
  } catch (err) {
    console.error("[stripe] Network error:", err);
    throw new ApiError(503, "Unable to connect to Stripe payment gateway.");
  }

  const session = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("[stripe] Checkout session error:", session);
    throw new ApiError(502, `Stripe session error: ${session?.error?.message ?? "Failed to initialize payment"}`);
  }
  return json({ checkout_url: session.url, session_id: session.id, app_tag: APP_TAG });
});
