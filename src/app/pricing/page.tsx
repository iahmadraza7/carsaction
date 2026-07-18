import Link from "next/link";
import type { Metadata } from "next";
import { CheckIcon } from "lucide-react";
import { Tier } from "@prisma/client";

import { auth } from "@/auth";
import { buttonVariants } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { SubscribeButton } from "@/components/billing/subscribe-button";
import { ManageBillingButton } from "@/components/billing/manage-billing-button";
import { formatPrice } from "@/lib/format";
import { getActivePlans, getDealerProfileByUserId, isSubscriptionActive } from "@/lib/subscription";
import { isStripeConfigured } from "@/lib/stripe";

export const metadata: Metadata = {
  title: "Pricing | CARSaction dealer subscriptions",
  description:
    "Transparent flat monthly subscriptions for Singapore car dealers. Gold and Platinum plans, no per-listing fees, cancel anytime.",
};

const FEATURES: Record<Tier, string[]> = {
  GOLD: [
    "Up to 10 active listings",
    "Verified dealer badge",
    "Direct WhatsApp leads from buyers",
    "Enquiry inbox",
    "Full COE, OMV, ARF & depreciation on every listing",
  ],
  PLATINUM: [
    "Unlimited active listings",
    "Everything in Gold",
    "Priority placement in browse results",
    "Best for high-volume showrooms",
  ],
};

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const [{ checkout }, session, plans] = await Promise.all([
    searchParams,
    auth(),
    getActivePlans(),
  ]);

  const user = session?.user;
  const isDealer = user?.role === "DEALER";
  const profile = isDealer ? await getDealerProfileByUserId(user.id) : null;
  const activeTier = isSubscriptionActive(profile?.subscriptionStatus) ? profile?.tier : null;
  const stripeReady = isStripeConfigured();

  return (
    <div className="min-h-svh bg-background">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Simple, flat monthly pricing
          </h1>
          <p className="mt-3 text-muted-foreground">
            No per-listing fees, no commission on sales. Pick a plan, post your inventory, and get
            leads straight to WhatsApp. Cancel anytime.
          </p>
        </div>

        {checkout === "cancelled" ? (
          <p className="mx-auto mt-6 w-fit rounded-lg bg-accent px-4 py-2 text-sm text-accent-foreground">
            Checkout cancelled. You haven&apos;t been charged.
          </p>
        ) : null}

        {!stripeReady ? (
          <p className="mx-auto mt-6 w-fit rounded-lg border border-dashed border-border px-4 py-2 text-center text-xs text-muted-foreground">
            Billing runs in Stripe test mode. Add your Stripe TEST keys to{" "}
            <code className="font-mono">.env</code> to enable live checkout.
          </p>
        ) : null}

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {plans.map((plan) => {
            const tier = plan.tier;
            const isCurrent = activeTier === tier;
            const highlight = tier === Tier.PLATINUM;

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl border bg-card p-6 shadow-sm ${
                  highlight ? "border-primary ring-1 ring-primary/30" : "border-border"
                }`}
              >
                {highlight ? (
                  <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                    Most popular
                  </span>
                ) : null}

                <h2 className="text-lg font-semibold">{plan.name}</h2>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight">
                    {formatPrice(Number(plan.monthlyPrice))}
                  </span>
                  <span className="text-sm text-muted-foreground">/month</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {plan.listingLimit == null
                    ? "Unlimited listings"
                    : `Up to ${plan.listingLimit} listings`}
                </p>

                <ul className="mt-6 flex flex-1 flex-col gap-3 text-sm">
                  {FEATURES[tier].map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <CheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6">
                  {isCurrent ? (
                    <div className="flex flex-col gap-2">
                      <span className="inline-flex w-fit items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary ring-1 ring-primary/20">
                        Your current plan
                      </span>
                      <ManageBillingButton className="w-full" />
                    </div>
                  ) : isDealer ? (
                    <SubscribeButton
                      tier={tier}
                      label={activeTier ? `Switch to ${plan.name}` : `Choose ${plan.name}`}
                      variant={highlight ? "default" : "outline"}
                      className="w-full"
                    />
                  ) : user ? (
                    <p className="text-center text-xs text-muted-foreground">
                      Only dealer accounts can subscribe.
                    </p>
                  ) : (
                    <Link
                      href="/dealer/signup"
                      className={buttonVariants({
                        variant: highlight ? "default" : "outline",
                        className: "w-full",
                      })}
                    >
                      Register your dealership
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-center text-xs text-muted-foreground">
          Prices in SGD, billed monthly. Subscriptions renew automatically until cancelled. Manage
          or cancel anytime from your dealer dashboard.
        </p>
      </main>
    </div>
  );
}
