import { NextResponse } from "next/server";
import { z } from "zod";
import { Tier } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { priceIdForTier, getDealerProfileByUserId } from "@/lib/subscription";

const bodySchema = z.object({
  tier: z.nativeEnum(Tier),
});

function baseUrl(req: Request): string {
  return process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
}

export async function POST(req: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Billing is not configured yet. Add Stripe TEST keys to .env." },
      { status: 503 },
    );
  }

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  if (session.user.role !== "DEALER") {
    return NextResponse.json({ error: "Only dealers can subscribe" }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }
  const { tier } = parsed.data;

  const priceId = priceIdForTier(tier);
  if (!priceId) {
    return NextResponse.json(
      { error: `No Stripe price configured for the ${tier} plan.` },
      { status: 503 },
    );
  }

  const profile = await getDealerProfileByUserId(session.user.id);
  if (!profile) {
    return NextResponse.json({ error: "Dealer profile not found" }, { status: 404 });
  }

  const stripe = getStripe();

  // Reuse an existing Stripe customer, or create one and persist its id.
  let customerId = profile.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email ?? undefined,
      name: profile.businessName,
      metadata: { dealerProfileId: profile.id, userId: session.user.id },
    });
    customerId = customer.id;
    await prisma.dealerProfile.update({
      where: { id: profile.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const base = baseUrl(req);
  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    // Attach identifiers so the webhook can resolve the dealer without guessing.
    metadata: { dealerProfileId: profile.id, tier },
    subscription_data: { metadata: { dealerProfileId: profile.id, tier } },
    success_url: `${base}/dealer/dashboard?checkout=success`,
    cancel_url: `${base}/pricing?checkout=cancelled`,
  });

  return NextResponse.json({ url: checkout.url });
}
