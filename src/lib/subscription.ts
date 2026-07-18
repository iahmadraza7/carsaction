import type Stripe from "stripe";
import { Tier, SubStatus, type DealerProfile } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

/**
 * A dealer can list/keep selling while ACTIVE, or PAST_DUE during the grace
 * period (they keep existing listings visible but cannot add new ones; that
 * distinction is enforced by `canCreateListing`).
 */
export function isSubscriptionActive(status: SubStatus | null | undefined): boolean {
  return status === SubStatus.ACTIVE;
}

/** Map a Stripe Price ID (from env) back to our internal tier. */
export function tierForPriceId(priceId: string | null | undefined): Tier | null {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_GOLD) return Tier.GOLD;
  if (priceId === process.env.STRIPE_PRICE_PLATINUM) return Tier.PLATINUM;
  return null;
}

/** The configured Stripe Price ID for a tier, or null if unset. */
export function priceIdForTier(tier: Tier): string | null {
  if (tier === Tier.GOLD) return process.env.STRIPE_PRICE_GOLD || null;
  if (tier === Tier.PLATINUM) return process.env.STRIPE_PRICE_PLATINUM || null;
  return null;
}

/** Human-readable subscription status, e.g. "Past due". */
export function humanizeSubStatus(status: SubStatus | null | undefined): string {
  switch (status) {
    case SubStatus.ACTIVE:
      return "Active";
    case SubStatus.PAST_DUE:
      return "Past due";
    case SubStatus.CANCELLED:
      return "Cancelled";
    default:
      return "No subscription";
  }
}

/** Fetch the DealerProfile for a given user id (the logged-in dealer). */
export function getDealerProfileByUserId(userId: string) {
  return prisma.dealerProfile.findUnique({ where: { userId } });
}

/** True when a stored Stripe customer id still resolves to a live customer. */
export async function stripeCustomerExists(customerId: string): Promise<boolean> {
  try {
    const customer = await getStripe().customers.retrieve(customerId);
    return !(customer as Stripe.DeletedCustomer).deleted;
  } catch {
    // resource_missing (deleted, placeholder seed id, or a different account).
    return false;
  }
}

/**
 * Return a Stripe customer id that is guaranteed to exist in the current Stripe
 * account, healing stale ids. Seed data ships placeholder ids like
 * "cus_seed_dealer1" that don't exist in the real test account; a customer can
 * also be deleted or the account swapped. In all those cases we create and
 * persist a fresh customer instead of failing the checkout.
 */
export async function ensureStripeCustomerId(
  profile: Pick<DealerProfile, "id" | "businessName" | "stripeCustomerId">,
  opts: { email?: string | null; userId: string },
): Promise<string> {
  if (profile.stripeCustomerId && (await stripeCustomerExists(profile.stripeCustomerId))) {
    return profile.stripeCustomerId;
  }

  const customer = await getStripe().customers.create({
    email: opts.email ?? undefined,
    name: profile.businessName,
    metadata: { dealerProfileId: profile.id, userId: opts.userId },
  });
  await prisma.dealerProfile.update({
    where: { id: profile.id },
    data: { stripeCustomerId: customer.id },
  });
  return customer.id;
}

/** All active subscription plans, cheapest tier first (Gold before Platinum). */
export function getActivePlans() {
  return prisma.subscriptionPlan.findMany({
    where: { active: true },
    orderBy: { monthlyPrice: "asc" },
  });
}

/**
 * Server-side listing-cap decision. Returns whether the dealer may create a new
 * listing and, if not, a clear reason for the UI.
 *
 * Rules:
 *  - Must have an ACTIVE subscription (PAST_DUE/CANCELLED/NONE cannot add new).
 *  - Must be under the plan's listingLimit (null = unlimited).
 */
export async function canCreateListing(
  profile: Pick<DealerProfile, "id" | "subscriptionStatus" | "tier">,
): Promise<{ ok: boolean; reason?: string; limit: number | null; used: number }> {
  const used = await prisma.listing.count({ where: { dealerId: profile.id } });

  if (!isSubscriptionActive(profile.subscriptionStatus)) {
    return {
      ok: false,
      reason: "An active subscription is required to publish listings.",
      limit: null,
      used,
    };
  }

  if (!profile.tier) {
    return { ok: false, reason: "No plan tier on your subscription.", limit: null, used };
  }

  const plan = await prisma.subscriptionPlan.findUnique({ where: { tier: profile.tier } });
  const limit = plan?.listingLimit ?? null;

  if (limit != null && used >= limit) {
    return {
      ok: false,
      reason: `You've reached your ${plan?.name ?? profile.tier} plan limit of ${limit} listings. Upgrade to add more.`,
      limit,
      used,
    };
  }

  return { ok: true, limit, used };
}
