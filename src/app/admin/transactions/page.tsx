import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { PaymentStatus } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { AnimatedCounter } from "@/components/animated-counter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { formatPrice, formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Transactions | Admin" };

type Row =
  | {
      kind: "subscription";
      id: string;
      date: Date;
      party: string;
      description: string;
      amount: number;
      status: PaymentStatus;
    }
  | {
      kind: "sale";
      id: string;
      date: Date;
      party: string;
      description: string;
      amount: number;
      listingId: string;
    };

export default async function AdminTransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin/transactions");

  const { type } = await searchParams;
  const filter = type === "subscriptions" || type === "sales" ? type : "all";

  const [payments, sales, revenueAgg, salesAgg] = await Promise.all([
    prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { dealer: { select: { businessName: true } } },
    }),
    prisma.sale.findMany({
      orderBy: { soldAt: "desc" },
      take: 200,
      include: {
        dealer: { select: { businessName: true } },
        listing: { select: { id: true, title: true } },
      },
    }),
    prisma.payment.aggregate({ where: { status: PaymentStatus.PAID }, _sum: { amount: true } }),
    prisma.sale.aggregate({ _sum: { salePrice: true } }),
  ]);

  const rows: Row[] = [];
  if (filter !== "sales") {
    for (const p of payments) {
      rows.push({
        kind: "subscription",
        id: p.id,
        date: p.createdAt,
        party: p.dealer.businessName,
        description: p.description ?? "Subscription",
        amount: Number(p.amount),
        status: p.status,
      });
    }
  }
  if (filter !== "subscriptions") {
    for (const s of sales) {
      rows.push({
        kind: "sale",
        id: s.id,
        date: s.soldAt,
        party: s.dealer.businessName,
        description: s.listing.title,
        amount: Number(s.salePrice),
        listingId: s.listing.id,
      });
    }
  }
  rows.sort((a, b) => b.date.getTime() - a.date.getTime());

  const tabs = [
    { key: "all", label: "All" },
    { key: "subscriptions", label: "Subscriptions" },
    { key: "sales", label: "Car sales" },
  ];

  return (
    <AdminShell
      email={session.user.email ?? ""}
      title="Transactions"
      description="Subscription billing and car sales across the marketplace."
    >
      <div className="mb-6 grid grid-cols-2 gap-3 sm:max-w-md">
        <Card>
          <CardContent className="flex flex-col gap-1 p-4">
            <span className="text-2xl font-bold tracking-tight tabular-nums">
              <AnimatedCounter value={Number(revenueAgg._sum.amount ?? 0)} prefix="S$" />
            </span>
            <span className="text-xs text-muted-foreground">Subscription revenue</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1 p-4">
            <span className="text-2xl font-bold tracking-tight tabular-nums">
              <AnimatedCounter value={Number(salesAgg._sum.salePrice ?? 0)} prefix="S$" />
            </span>
            <span className="text-xs text-muted-foreground">Car sales value</span>
          </CardContent>
        </Card>
      </div>

      <div className="mb-4 flex gap-2">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={t.key === "all" ? "/admin/transactions" : `/admin/transactions?type=${t.key}`}
            className={buttonVariants({
              variant: filter === t.key ? "default" : "outline",
              size: "sm",
            })}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Dealer</th>
              <th className="hidden px-4 py-2 font-medium sm:table-cell">Detail</th>
              <th className="hidden px-4 py-2 font-medium sm:table-cell">Date</th>
              <th className="px-4 py-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((r) => (
              <tr key={`${r.kind}-${r.id}`}>
                <td className="px-4 py-2.5">
                  {r.kind === "subscription" ? (
                    <Badge variant="outline">Subscription</Badge>
                  ) : (
                    <Badge variant="secondary">Car sale</Badge>
                  )}
                </td>
                <td className="px-4 py-2.5 font-medium">{r.party}</td>
                <td className="hidden px-4 py-2.5 text-muted-foreground sm:table-cell">
                  {r.kind === "sale" ? (
                    <Link href={`/cars/${r.listingId}`} className="hover:underline">
                      {r.description}
                    </Link>
                  ) : (
                    r.description
                  )}
                </td>
                <td className="hidden px-4 py-2.5 text-muted-foreground sm:table-cell">
                  {formatDate(r.date)}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <span
                    className={
                      r.kind === "subscription" && r.status === PaymentStatus.FAILED
                        ? "font-semibold text-destructive line-through"
                        : "font-semibold"
                    }
                  >
                    {formatPrice(r.amount)}
                  </span>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No transactions yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
