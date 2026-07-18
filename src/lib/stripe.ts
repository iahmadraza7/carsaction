import Stripe from "stripe";

/**
 * True when the Stripe secret key is present. Used to short-circuit billing
 * routes with a clear error while the client hasn't provided TEST keys yet.
 */
export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

let client: Stripe | null = null;

/**
 * Lazily-created singleton Stripe client. Throws a clear, actionable error if
 * STRIPE_SECRET_KEY is missing so misconfiguration surfaces at request time
 * (never at import/build time).
 */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "Stripe is not configured. Set STRIPE_SECRET_KEY (and the Price IDs) in .env. See .env.example.",
    );
  }
  if (!client) {
    client = new Stripe(key, { appInfo: { name: "CARSaction" } });
  }
  return client;
}
