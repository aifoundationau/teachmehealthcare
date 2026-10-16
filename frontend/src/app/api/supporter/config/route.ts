import { APP_TAG, env } from "@/server/env";
import { json } from "@/server/http";

export const dynamic = "force-dynamic";

/** Stripe publishable key and contribution options for the supporter form. */
export function GET() {
  return json({
    stripe_publishable_key: env.stripePublishableKey,
    app_tag: APP_TAG,
    project_name: "TeachMeHealth LMS",
    default_currency: "aud",
    supported_amounts: [1000, 2500, 5000, 10000],
  });
}
