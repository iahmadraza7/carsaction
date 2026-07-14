/**
 * Create CARSaction subscription products & prices in Stripe TEST mode.
 *
 * Usage:
 *   npm run setup:stripe
 *
 * Requires STRIPE_SECRET_KEY in .env (sk_test_...).
 * Prints price IDs to paste into .env, then run: npm run db:seed
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import Stripe from "stripe";

/** Load .env into process.env when the script is run outside Next/Prisma. */
function loadEnvFile() {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

loadEnvFile();

const PLANS = [
  {
    tier: "GOLD" as const,
    name: "CARSaction Gold",
    description: "Up to 10 active listings for Singapore car dealers.",
    amountCents: 9900, // SGD 99.00
    envKey: "STRIPE_PRICE_GOLD",
  },
  {
    tier: "PLATINUM" as const,
    name: "CARSaction Platinum",
    description: "Unlimited active listings for high-volume dealers.",
    amountCents: 14900, // SGD 149.00
    envKey: "STRIPE_PRICE_PLATINUM",
  },
] as const;

async function findOrCreatePrice(
  stripe: Stripe,
  plan: (typeof PLANS)[number],
): Promise<{ productId: string; priceId: string; created: boolean }> {
  const search = await stripe.products.search({
    query: `active:'true' AND metadata['carsaction_tier']:'${plan.tier}'`,
    limit: 1,
  });

  let product: Stripe.Product;
  let created = false;

  if (search.data.length > 0) {
    product = search.data[0];
    console.log(`  Found existing product: ${product.id} (${product.name})`);
  } else {
    product = await stripe.products.create({
      name: plan.name,
      description: plan.description,
      metadata: { carsaction_tier: plan.tier },
    });
    created = true;
    console.log(`  Created product: ${product.id} (${product.name})`);
  }

  // Reuse an active recurring SGD price at the correct amount, or create one.
  const prices = await stripe.prices.list({
    product: product.id,
    active: true,
    limit: 20,
  });

  const existing = prices.data.find(
    (p) =>
      p.currency === "sgd" &&
      p.recurring?.interval === "month" &&
      p.unit_amount === plan.amountCents,
  );

  if (existing) {
    console.log(`  Using existing price: ${existing.id}`);
    return { productId: product.id, priceId: existing.id, created: false };
  }

  const price = await stripe.prices.create({
    product: product.id,
    currency: "sgd",
    unit_amount: plan.amountCents,
    recurring: { interval: "month" },
    metadata: { carsaction_tier: plan.tier },
  });
  console.log(`  Created price: ${price.id}`);
  return { productId: product.id, priceId: price.id, created: true };
}

async function main() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.error("Missing STRIPE_SECRET_KEY. Add your Stripe TEST secret key to .env.");
    process.exit(1);
  }
  if (!key.startsWith("sk_test_")) {
    console.warn("Warning: STRIPE_SECRET_KEY does not look like a TEST key (expected sk_test_...).");
  }

  const stripe = new Stripe(key, { appInfo: { name: "CARSaction setup" } });

  console.log("\nCARSaction — Stripe test-mode setup\n");

  const results: Record<string, string> = {};

  for (const plan of PLANS) {
    console.log(`${plan.tier} (SGD ${plan.amountCents / 100}/month):`);
    const { priceId } = await findOrCreatePrice(stripe, plan);
    results[plan.envKey] = priceId;
    console.log("");
  }

  console.log("Add these to your .env:\n");
  for (const plan of PLANS) {
    console.log(`${plan.envKey}=${results[plan.envKey]}`);
  }

  console.log("\nThen sync the DB and restart the dev server:");
  console.log("  npm run db:seed");
  console.log("  npm run dev");
  console.log("\nFor local webhooks:");
  console.log("  stripe listen --forward-to localhost:3000/api/stripe/webhook");
  console.log("  (copy the whsec_... secret into STRIPE_WEBHOOK_SECRET in .env)\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
