import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { CheckCircle2Icon, PlusIcon } from "lucide-react";
import { PaymentStatus, SubStatus } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { SubscribeButton } from "@/components/billing/subscribe-button";
import { ManageBillingButton } from "@/components/billing/manage-billing-button";
import { formatPrice, formatDate } from "@/lib/format";
import { humanizeEnum } from "@/lib/listing-options";
import {
  getDealerProfileByUserId,
  getActivePlans,
  humanizeSubStatus,
  isSubscriptionActive,
} from "@/lib/subscription";

export const metadata: Metadata = { title: "Dealer dashboard | CARSaction" };

export default async function DealerDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/dealer/dashboard");

  const { checkout } = await searchParams;
  const profile = await getDealerProfileByUserId(session.user.id);

  const [plans, listingCount, payments, sales] = await Promise.all([
    getActivePlans(),
    profile ? prisma.listing.count({ where: { dealerId: profile.id } }) : Promise.resolve(0),
    profile
      ? prisma.payment.findMany({
          where: { dealerId: profile.id },
          orderBy: { createdAt: "desc" },
          take: 6,
        })
      : Promise.resolve([]),
    profile
      ? prisma.sale.findMany({
          where: { dealerId: profile.id },
          orderBy: { soldAt: "desc" },
          take: 5,
          include: { listing: { select: { id: true, title: true } } },
        })
      : Promise.resolve([]),
  ]);

  const salesTotal = sales.reduce((sum, s) => sum + Number(s.salePrice), 0);

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
            Payment received. Your subscription is being activated. Refresh in a moment if it
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
              <Field label="Plan" value={currentPlan ? currentPlan.name : "n/a"} />
              <Field
                label="Monthly price"
                value={currentPlan ? `${formatPrice(Number(currentPlan.monthlyPrice))}/mo` : "n/a"}
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
                      label={`Subscribe to ${plan.name}`}
                      variant={plan.tier === "PLATINUM" ? "default" : "outline"}
                    />
                  ))}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="max-w-2xl">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>Your inventory</CardTitle>
            <Link
              href="/dealer/listings"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Manage listings
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
            <p>
              You have <span className="font-medium text-foreground">{listingCount}</span> listing
              {listingCount === 1 ? "" : "s"}.
              {!active
                ? " An active subscription is required before you can publish new listings."
                : ""}
            </p>
            <div className="flex flex-wrap gap-2">
              {active ? (
                <Link href="/dealer/listings/new" className={buttonVariants({ size: "sm" })}>
                  <PlusIcon />
                  Add listing
                </Link>
              ) : null}
              <Link
                href="/dealer/enquiries"
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                View enquiries
              </Link>
            </div>
          </CardContent>
        </Card>

        {sales.length > 0 ? (
          <Card className="max-w-2xl">
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle>Recent sales</CardTitle>
              <span className="text-sm text-muted-foreground">
                {formatPrice(salesTotal)} total
              </span>
            </CardHeader>
            <CardContent className="flex flex-col divide-y text-sm">
              {sales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <Link href={`/cars/${sale.listing.id}`} className="block truncate font-medium hover:underline">
                      {sale.listing.title}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {sale.buyerName ? `${sale.buyerName} · ` : ""}
                      {formatDate(sale.soldAt)}
                    </span>
                  </div>
                  <span className="font-semibold">{formatPrice(Number(sale.salePrice))}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Billing history</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {payments.length === 0 ? (
              <p className="text-muted-foreground">
                No invoices yet. Subscription payments will appear here once billing runs.
              </p>
            ) : (
              <div className="flex flex-col divide-y">
                {payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <span className="block truncate font-medium">
                        {p.description ?? "CARSaction subscription"}
                      </span>
                      <span className="text-xs text-muted-foreground">{formatDate(p.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{formatPrice(Number(p.amount))}</span>
                      <Badge
                        variant={
                          p.status === PaymentStatus.PAID
                            ? "default"
                            : p.status === PaymentStatus.FAILED
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {humanizeEnum(p.status)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
