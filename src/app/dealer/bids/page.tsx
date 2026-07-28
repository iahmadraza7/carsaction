import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { ImageOffIcon } from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { closeExpiredAuctions } from "@/lib/auction-close";
import { DealerShell } from "@/components/dealer/dealer-shell";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { AuctionCountdown } from "@/components/auctions/auction-countdown";
import { formatBidAmount, formatMileage } from "@/lib/format";
import { humanizeEnum } from "@/lib/listing-options";

export const metadata: Metadata = { title: "Your repo bids | CARSaction" };

export default async function DealerBidsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/dealer/bids");
  if (session.user.role !== "DEALER") redirect("/");

  await closeExpiredAuctions();

  // Own bids only — sealed: never include other dealers' bids or aggregate counts.
  const bids = await prisma.bid.findMany({
    where: { dealerId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      amount: true,
      updatedAt: true,
      repoVehicle: {
        select: {
          id: true,
          make: true,
          model: true,
          year: true,
          mileage: true,
          status: true,
          biddingClosesAt: true,
          winningBidId: true,
          images: { orderBy: { order: "asc" }, take: 1, select: { url: true } },
        },
      },
    },
  });

  return (
    <DealerShell
      email={session.user.email ?? ""}
      title="Your repo bids"
      description="Sealed bids you have placed on repossessed vehicles"
    >
      {bids.length === 0 ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            You have not placed any repo bids yet.
          </p>
          <Link href="/auctions" className={buttonVariants({ size: "sm", className: "w-fit" })}>
            Browse repo auctions
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {bids.map((bid) => {
            const v = bid.repoVehicle;
            const title = `${v.year} ${v.make} ${v.model}`;
            const cover = v.images[0]?.url ?? null;
            const outcome = bidOutcome(bid.id, v.status, v.winningBidId);
            return (
              <div
                key={bid.id}
                className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {cover ? (
                      <Image src={cover} alt="" fill sizes="64px" className="object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        <ImageOffIcon className="size-5" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-medium">{title}</span>
                      <Badge variant={outcome.variant}>{outcome.label}</Badge>
                      <Badge variant="outline">{humanizeEnum(v.status)}</Badge>
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {formatMileage(v.mileage)}
                    </div>
                    <div className="mt-1 text-sm">
                      <span className="text-muted-foreground">Your bid </span>
                      <span className="font-semibold">{formatBidAmount(bid.amount.toString())}</span>
                    </div>
                    {v.status === "OPEN" ? (
                      <div className="mt-1 text-xs">
                        <span className="text-muted-foreground">Closes in </span>
                        <AuctionCountdown closesAt={v.biddingClosesAt.toISOString()} />
                      </div>
                    ) : null}
                  </div>
                </div>
                <Link
                  href={`/auctions/${v.id}`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  {v.status === "OPEN" ? "Update bid" : "View"}
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </DealerShell>
  );
}

function bidOutcome(
  bidId: string,
  status: string,
  winningBidId: string | null,
): { label: string; variant: "default" | "secondary" | "outline" | "destructive" } {
  if (status === "AWARDED") {
    if (winningBidId === bidId) return { label: "Won", variant: "default" };
    return { label: "Lost", variant: "destructive" };
  }
  if (status === "CLOSED") return { label: "Pending award", variant: "secondary" };
  if (status === "CANCELLED") return { label: "Cancelled", variant: "outline" };
  return { label: "Pending", variant: "secondary" };
}
