import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { CheckCircle2Icon } from "lucide-react";
import { SubStatus } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { SubscribeButton } from "@/components/billing/subscribe-button";
import { ManageBillingButton } from "@/components/billing/manage-billing-button";
import { formatPrice, formatDate } from "@/lib/format";
import {
  getDealerProfileByUserId,
  getActivePlans,
  humanizeSubStatus,
  isSubscriptionActive,
} from "@/lib/subscription";

export const metadata: Metadata = { title: "Dealer dashboard — CARSaction" };

export default async function DealerDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/dealer/dashboard");

  const { checkout } = await searchParams;
  const profile = await getDealerProfileByUserId(session.user.id);

  const [plans, listingCount] = await Promise.all([
    getActivePlans(),
    profile ? prisma.listing.count({ where: { dealerId: profile.id } }) : Promise.resolve(0),
  ]);

  const active = isSubscriptionActive(profile?.subscriptionStatus);
  const currentPlan = profile?.tier
    ? plans.find((p) => p.tier === profile.tier)
    : undefined;
  const limit = currentPlan?.listingLimit ?? null;

  const statusVariant =
    profile?.subscriptionStatus === SubStatus.ACTIVE
      ? "default"
      : profile?.subscriptionStatus === SubStatus.PAST_DUE
        ? "destructive"
        : "secondary";

  return (
    <DashboardShell
      label="Dealer"
      name={session.user.name ?? "Dealer"}
      email={session.user.email ?? ""}
      role={session.user.role}
    >
      <div className="flex flex-col gap-6">
        {checkout === "success" ? (
          <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-medium text-primary">
            <CheckCircle2Icon className="size-4" />
            Payment received. Your subscription is being activated — refresh in a moment if it
            isn&apos;t shown yet.
          </div>
        ) : null}

        <Card className="max-w-2xl">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>Subscription</CardTitle>
            <Badge variant={statusVariant}>
              {humanizeSubStatus(profile?.subscriptionStatus)}
            </Badge>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Plan" value={currentPlan ? currentPlan.name : "—"} />
              <Field
                label="Monthly price"
                value={currentPlan ? `${formatPrice(Number(currentPlan.monthlyPrice))}/mo` : "—"}
              />
              <Field
                label="Listings used"
                value={limit == null ? `${listingCount} / Unlimited` : `${listingCount} / ${limit}`}
              />
              <Field
                label={profile?.subscriptionStatus === SubStatus.CANCELLED ? "Access until" : "Renews"}
                value={formatDate(profile?.currentPeriodEnd)}
              />
            </div>

            {profile?.subscriptionStatus === SubStatus.PAST_DUE ? (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                Your last payment failed. Existing listings stay visible, but you can&apos;t add new
                ones until billing is updated.
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2 pt-1">
              {active ? (
                <>
                  <ManageBillingButton />
                  <Link
                    href="/pricing"
                    className={buttonVariants({ variant: "ghost", size: "default" })}
                  >
                    Change plan
                  </Link>
                </>
              ) : profile?.stripeCustomerId ? (
                <>
                  <ManageBillingButton label="Update billing" />
                  <Link href="/pricing" className={buttonVariants({ variant: "default" })}>
                    Reactivate a plan
                  </Link>
                </>
              ) : (
                <>
                  {plans.map((plan) => (
                    <SubscribeButton
                      key={plan.id}
                      tier={plan.tier}
                      label={`Subscribe — ${plan.name}`}
                      variant={plan.tier === "PLATINUM" ? "default" : "outline"}
                    />
                  ))}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Your inventory</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            You have <span className="font-medium text-foreground">{listingCount}</span> listing
            {listingCount === 1 ? "" : "s"}.
            {!active
              ? " An active subscription is required before you can publish new listings."
              : " Listing management tools are coming next."}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
