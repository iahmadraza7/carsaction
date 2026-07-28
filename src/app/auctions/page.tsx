import type { Metadata } from "next";
import { GavelIcon } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { closeExpiredAuctions } from "@/lib/auction-close";
import { SiteHeader } from "@/components/site-header";
import { AuctionCard } from "@/components/auctions/auction-card";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Repo auctions | CARSaction",
  description:
    "Browse open repossessed vehicle auctions in Singapore. Dealers with an active subscription can place sealed bids.",
};

export default async function AuctionsPage() {
  await closeExpiredAuctions();

  // Intentionally omit reservePrice — confidential to finance owners only.
  // Sealed: no bid counts, no competing-bid signals on the public grid.
  const vehicles = await prisma.repoVehicle.findMany({
    where: {
      status: "OPEN",
      biddingClosesAt: { gt: new Date() },
    },
    orderBy: { biddingClosesAt: "asc" },
    select: {
      id: true,
      make: true,
      model: true,
      year: true,
      mileage: true,
      biddingClosesAt: true,
      images: { orderBy: { order: "asc" }, take: 1, select: { url: true } },
    },
  });

  return (
    <div className="min-h-svh bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Repo auctions
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Open repossessed vehicles from finance companies. Subscribed dealers can place
            sealed bids before the deadline.
          </p>
        </div>

        {vehicles.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
            <GavelIcon className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No open auctions right now.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((v) => (
              <AuctionCard
                key={v.id}
                vehicle={{
                  id: v.id,
                  make: v.make,
                  model: v.model,
                  year: v.year,
                  mileage: v.mileage,
                  biddingClosesAt: v.biddingClosesAt,
                  coverUrl: v.images[0]?.url ?? null,
                }}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
