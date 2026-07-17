import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  UsersIcon,
  CarIcon,
  BadgeCheckIcon,
  BanknoteIcon,
  TagIcon,
  MessageSquareIcon,
} from "lucide-react";
import { ListingStatus, PaymentStatus, SubStatus } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { AnimatedCounter } from "@/components/animated-counter";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { formatPrice, formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Admin overview — CARSaction" };

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin/dashboard");

  const [
    dealers,
    liveListings,
    activeSubs,
    revenueAgg,
    salesAgg,
    recentPayments,
    recentSales,
  ] = await Promise.all([
    prisma.dealerProfile.count(),
    prisma.listing.count({ where: { status: ListingStatus.FOR_SALE } }),
    prisma.dealerProfile.count({ where: { subscriptionStatus: SubStatus.ACTIVE } }),
    prisma.payment.aggregate({
      where: { status: PaymentStatus.PAID },
      _sum: { amount: true },
    }),
    prisma.sale.aggregate({ _sum: { salePrice: true }, _count: true }),
    prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { dealer: { select: { businessName: true } } },
    }),
    prisma.sale.findMany({
      orderBy: { soldAt: "desc" },
      take: 5,
      include: {
        dealer: { select: { businessName: true } },
        listing: { select: { id: true, title: true } },
      },
    }),
  ]);

  const revenue = Number(revenueAgg._sum.amount ?? 0);
  const salesValue = Number(salesAgg._sum.salePrice ?? 0);

  return (
    <AdminShell
      email={session.user.email ?? ""}
      title={`Welcome, ${session.user.name ?? "Admin"}`}
      description="Marketplace health at a glance."
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={<UsersIcon />} label="Dealers" value={<AnimatedCounter value={dealers} />} />
        <Stat
          icon={<CarIcon />}
          label="Live listings"
          value={<AnimatedCounter value={liveListings} />}
        />
        <Stat
          icon={<BadgeCheckIcon />}
          label="Active subscriptions"
          value={<AnimatedCounter value={activeSubs} />}
        />
        <Stat
          icon={<BanknoteIcon />}
          label="Subscription revenue"
          value={<AnimatedCounter value={revenue} prefix="S$" />}
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          icon={<TagIcon />}
          label="Cars sold"
          value={<AnimatedCounter value={salesAgg._count} />}
        />
        <Stat
          icon={<BanknoteIcon />}
          label="Sales value"
          value={<AnimatedCounter value={salesValue} prefix="S$" />}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold">Recent subscription payments</h2>
            <Link
              href="/admin/transactions"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              View all
            </Link>
          </div>
          <Card>
            <CardContent className="flex flex-col divide-y p-4 text-sm">
              {recentPayments.length === 0 ? (
                <p className="text-muted-foreground">No payments recorded yet.</p>
              ) : (
                recentPayments.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <span className="block truncate font-medium">{p.dealer.businessName}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(p.createdAt)}</span>
                    </div>
                    <span
                      className={
                        p.status === PaymentStatus.FAILED
                          ? "font-semibold text-destructive"
                          : "font-semibold"
                      }
                    >
                      {formatPrice(Number(p.amount))}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold">Recent car sales</h2>
            <Link
              href="/admin/transactions"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              View all
            </Link>
          </div>
          <Card>
            <CardContent className="flex flex-col divide-y p-4 text-sm">
              {recentSales.length === 0 ? (
                <p className="text-muted-foreground">No sales recorded yet.</p>
              ) : (
                recentSales.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/cars/${s.listing.id}`}
                        className="block truncate font-medium hover:underline"
                      >
                        {s.listing.title}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {s.dealer.businessName} · {formatDate(s.soldAt)}
                      </span>
                    </div>
                    <span className="font-semibold">{formatPrice(Number(s.salePrice))}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        <Link href="/admin/dealers" className={buttonVariants({ variant: "outline" })}>
          <BadgeCheckIcon />
          Verify dealers
        </Link>
        <Link href="/admin/listings" className={buttonVariants({ variant: "outline" })}>
          <CarIcon />
          Manage listings
        </Link>
        <Link href="/admin/enquiries" className={buttonVariants({ variant: "outline" })}>
          <MessageSquareIcon />
          Enquiries
        </Link>
      </div>
    </AdminShell>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-2 p-4">
        <span className="inline-flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary [&_svg]:size-4">
          {icon}
        </span>
        <span className="text-2xl font-bold tracking-tight tabular-nums">{value}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </CardContent>
    </Card>
  );
}
