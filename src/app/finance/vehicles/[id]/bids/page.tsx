import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getFinanceProfileByUserId } from "@/lib/finance";
import { ensureVehicleClosedIfExpired } from "@/lib/auction-close";
import { FinanceShell } from "@/components/finance/finance-shell";
import { AwardBidButton } from "@/components/finance/award-bid-button";
import { BidHistoryDetails } from "@/components/finance/bid-history-details";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatBidAmount, formatPrice } from "@/lib/format";
import { humanizeEnum } from "@/lib/listing-options";

export const metadata: Metadata = { title: "Auction bids | CARSaction" };

type Props = { params: Promise<{ id: string }> };

export default async function FinanceVehicleBidsPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/finance/dashboard");

  const profile = await getFinanceProfileByUserId(session.user.id);
  if (!profile) redirect("/finance/dashboard");

  const { id } = await params;
  await ensureVehicleClosedIfExpired(id);

  const vehicle = await prisma.repoVehicle.findFirst({
    where: { id, financeCoId: profile.id },
    include: {
      winningBid: {
        select: {
          id: true,
          amount: true,
          dealer: {
            select: {
              name: true,
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
              id: true,
              name: true,
              email: true,
              dealerProfile: { select: { businessName: true } },
            },
          },
          history: {
            orderBy: { changedAt: "desc" },
            select: { id: true, amount: true, changedAt: true },
          },
        },
      },
    },
  });
  if (!vehicle) notFound();

  const title = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  const highest = vehicle.bids[0] ?? null;
  // CONFIDENTIAL: reserve price — finance owner / admin only
  const reserve =
    vehicle.reservePrice != null ? formatPrice(Number(vehicle.reservePrice)) : null;
  const canAward = vehicle.status === "CLOSED";

  return (
    <FinanceShell
      email={session.user.email ?? ""}
      title={title}
      description="Bids ranked highest first"
      actions={
        <Link
          href="/finance/dashboard"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Back
        </Link>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={vehicle.status === "OPEN" ? "default" : "secondary"}>
            {humanizeEnum(vehicle.status)}
          </Badge>
          {reserve ? (
            <span className="text-sm text-muted-foreground">
              Reserve <span className="font-medium text-foreground">{reserve}</span>
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">No reserve set</span>
          )}
        </div>

        <div className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-3">
          <Summary
            label="Bids"
            value={String(vehicle.bids.length)}
          />
          <Summary
            label="Highest bid"
            value={highest ? formatBidAmount(highest.amount.toString()) : "n/a"}
          />
          <Summary
            label="Winner"
            value={
              vehicle.winningBid
                ? vehicle.winningBid.dealer.dealerProfile?.businessName ??
                  vehicle.winningBid.dealer.name
                : "—"
            }
          />
        </div>

        {vehicle.status === "OPEN" ? (
          <p className="text-sm text-muted-foreground">
            Auction is still open. Refresh the page to see new bids. Awarding unlocks after
            close.
          </p>
        ) : null}

        {vehicle.bids.length === 0 ? (
          <p className="text-sm text-muted-foreground">No bids yet.</p>
        ) : (
          <div className="grid gap-3">
            {vehicle.bids.map((bid, index) => {
              const businessName =
                bid.dealer.dealerProfile?.businessName ?? bid.dealer.name;
              const isHighest = index === 0;
              const isWinner = vehicle.winningBidId === bid.id;
              return (
                <div
                  key={bid.id}
                  className={`rounded-xl border bg-card p-4 ${
                    isHighest && canAward ? "ring-2 ring-primary/40" : ""
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{businessName}</span>
                        {isHighest ? <Badge variant="secondary">Highest</Badge> : null}
                        {isWinner ? <Badge>Awarded</Badge> : null}
                      </div>
                      <div className="mt-1 text-lg font-semibold">
                        {formatBidAmount(bid.amount.toString())}
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        Last updated{" "}
                        {bid.updatedAt.toLocaleString("en-SG", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      <div className="mt-3">
                        <BidHistoryDetails
                          history={bid.history.map((h) => ({
                            id: h.id,
                            amount: h.amount.toString(),
                            changedAt: h.changedAt.toISOString(),
                          }))}
                        />
                      </div>
                    </div>
                    {canAward ? (
                      <AwardBidButton
                        vehicleId={vehicle.id}
                        bidId={bid.id}
                        dealerName={businessName}
                        amountLabel={formatBidAmount(bid.amount.toString())}
                        isHighest={isHighest}
                      />
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </FinanceShell>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
