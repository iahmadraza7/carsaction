import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { closeExpiredAuctions } from "@/lib/auction-close";
import { AdminShell } from "@/components/admin/admin-shell";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatBidAmount, formatDate } from "@/lib/format";
import { humanizeEnum } from "@/lib/listing-options";

export const metadata: Metadata = { title: "Auctions | Admin" };

export default async function AdminAuctionsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin/auctions");

  await closeExpiredAuctions();

  const vehicles = await prisma.repoVehicle.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      financeCo: { select: { companyName: true } },
      _count: { select: { bids: true } },
      winningBid: {
        select: {
          amount: true,
          dealer: {
            select: {
              name: true,
              email: true,
              dealerProfile: { select: { businessName: true } },
            },
          },
        },
      },
      bids: {
        orderBy: { amount: "desc" },
        include: {
          dealer: {
            select: {
              name: true,
              email: true,
              dealerProfile: { select: { businessName: true } },
            },
          },
          history: {
            orderBy: { changedAt: "desc" },
            select: { amount: true, changedAt: true },
          },
        },
      },
    },
  });

  return (
    <AdminShell
      email={session.user.email ?? ""}
      title="Auctions"
      description={`${vehicles.length} repo vehicle${vehicles.length === 1 ? "" : "s"}`}
    >
      <div className="grid gap-4">
        {vehicles.length === 0 ? (
          <p className="text-sm text-muted-foreground">No repo auctions yet.</p>
        ) : (
          vehicles.map((v) => {
            const title = `${v.year} ${v.make} ${v.model}`;
            const winnerName =
              v.winningBid?.dealer.dealerProfile?.businessName ??
              v.winningBid?.dealer.name ??
              null;
            return (
              <details
                key={v.id}
                className="rounded-xl border bg-card p-4 open:pb-4"
              >
                <summary className="cursor-pointer list-none">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{title}</span>
                        <Badge variant="outline">{humanizeEnum(v.status)}</Badge>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {v.financeCo.companyName} · {v._count.bids} bid
                        {v._count.bids === 1 ? "" : "s"}
                        {winnerName
                          ? ` · Winner ${winnerName} (${formatBidAmount(v.winningBid!.amount.toString())})`
                          : ""}
                        {" · "}
                        Closes {formatDate(v.biddingClosesAt)}
                      </div>
                    </div>
                    <Link
                      href={`/auctions/${v.id}`}
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      Public page
                    </Link>
                  </div>
                </summary>

                <div className="mt-4 border-t pt-4">
                  {/* CONFIDENTIAL in admin audit: reserve is visible to admin */}
                  <p className="mb-3 text-xs text-muted-foreground">
                    Reserve:{" "}
                    {v.reservePrice != null
                      ? formatBidAmount(v.reservePrice.toString())
                      : "none"}
                    {v.awardedAt ? ` · Awarded ${formatDate(v.awardedAt)}` : ""}
                  </p>
                  {v.bids.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No bids.</p>
                  ) : (
                    <ul className="flex flex-col gap-3">
                      {v.bids.map((b) => (
                        <li key={b.id} className="rounded-lg border bg-muted/30 p-3 text-sm">
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <span className="font-medium">
                              {b.dealer.dealerProfile?.businessName ?? b.dealer.name}
                            </span>
                            <span className="font-semibold">
                              {formatBidAmount(b.amount.toString())}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">{b.dealer.email}</p>
                          {b.history.length > 1 ? (
                            <ul className="mt-2 space-y-1 border-t pt-2 text-xs text-muted-foreground">
                              {b.history.map((h, i) => (
                                <li key={`${b.id}-h-${i}`}>
                                  {formatBidAmount(h.amount.toString())} ·{" "}
                                  {h.changedAt.toLocaleString("en-SG")}
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </details>
            );
          })
        )}
      </div>
    </AdminShell>
  );
}
