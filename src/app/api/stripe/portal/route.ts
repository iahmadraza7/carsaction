import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { getDealerProfileByUserId } from "@/lib/subscription";

function baseUrl(req: Request): string {
  return process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
}

/**
 * Opens the Stripe Customer Portal so dealers can upgrade, downgrade, change
 * their card, or cancel. All state changes flow back through the webhook.
 */
export async function POST(req: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Billing is not configured yet. Add Stripe TEST keys to .env." },
      { status: 503 },
    );
  }

  const session = await auth();
  if (!session?.user || session.user.role !== "DEALER") {
    return NextResponse.json({ error: "Only dealers can manage billing" }, { status: 403 });
  }

  const profile = await getDealerProfileByUserId(session.user.id);
  if (!profile?.stripeCustomerId) {
    return NextResponse.json({ error: "No billing account yet. Subscribe first." }, { status: 400 });
  }

  const stripe = getStripe();
  const portal = await stripe.billingPortal.sessions.create({
    customer: profile.stripeCustomerId,
    return_url: `${baseUrl(req)}/dealer/dashboard`,
  });

  return NextResponse.json({ url: portal.url });
}
