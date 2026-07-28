import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeftIcon } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { SiteHeader } from "@/components/site-header";
import { Gallery } from "@/components/listings/gallery";
import { AuctionCountdown } from "@/components/auctions/auction-countdown";
import { BidPanelGate } from "@/components/auctions/bid-panel-gate";
import { BidForm } from "@/components/auctions/bid-form";
import { Badge } from "@/components/ui/badge";
import { formatMileage, formatMonthYear, formatDate } from "@/lib/format";
import { humanizeEnum } from "@/lib/listing-options";
import {
  getDealerProfileByUserId,
  isSubscriptionActive,
} from "@/lib/subscription";
import { auctionWindowStatus, getOwnBidForVehicle } from "@/lib/bids";
import { ensureVehicleClosedIfExpired } from "@/lib/auction-close";

export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  // Intentionally omit reservePrice from metadata queries.
  const vehicle = await prisma.repoVehicle.findUnique({
    where: { id },
    select: {
      make: true,
      model: true,
      year: true,
      images: { orderBy: { order: "asc" }, take: 1, select: { url: true } },
    },
  });
  if (!vehicle) return { title: "Auction not found" };

  const title = `${vehicle.year} ${vehicle.make} ${vehicle.model} · Repo auction`;
  const description = `Bid on this ${vehicle.year} ${vehicle.make} ${vehicle.model} repossessed vehicle on CARSaction.`;
  const image = vehicle.images[0]?.url;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `${APP_URL}/auctions/${id}`,
      images: image ? [{ url: image }] : undefined,
    },
  };
}

function SpecRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/60 py-2.5 last:border-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

export default async function AuctionDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const session = await auth();

  // Lazy close if the deadline passed (belt and braces with the cron).
  const effectiveStatus = await ensureVehicleClosedIfExpired(id);

  // Intentionally omit reservePrice — confidential to finance owners only.
  // Sealed: do not include bids, bid counts, or any competing-bid signals.
  const vehicle = await prisma.repoVehicle.findUnique({
    where: { id },
    select: {
      id: true,
      make: true,
      model: true,
      year: true,
      mileage: true,
      bodyType: true,
      colour: true,
      regDate: true,
      coeExpiry: true,
      condition: true,
      location: true,
      description: true,
      biddingOpensAt: true,
      biddingClosesAt: true,
      status: true,
      winningBidId: true,
      images: { orderBy: { order: "asc" }, select: { url: true } },
      financeCo: { select: { companyName: true } },
    },
  });
  if (!vehicle) notFound();

  // Prefer the status we just ensured (covers race where read was slightly stale).
  const status = effectiveStatus ?? vehicle.status;
  const vehicleForWindow = { ...vehicle, status };

  const title = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  const imageUrls = vehicle.images.map((img) => img.url);
  const window = auctionWindowStatus(vehicleForWindow);
  const role = session?.user?.role;

  let bidPanel: React.ReactNode;

  if (status === "AWARDED") {
    const isWinner =
      role === "DEALER" &&
      session?.user &&
      vehicle.winningBidId != null &&
      (await getOwnBidForVehicle(vehicle.id, session.user.id))?.id === vehicle.winningBidId;

    bidPanel = (
      <div className="rounded-xl border bg-card p-5">
        <h2 className="text-base font-semibold tracking-tight">Auction awarded</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {isWinner
            ? "Congratulations — you were awarded this vehicle. Check your notifications for finance company contact details."
            : "This auction has been awarded. Bid amounts remain sealed."}
        </p>
      </div>
    );
  } else if (!session?.user || role === "BUYER") {
    bidPanel = <BidPanelGate kind="dealer_signup" />;
  } else if (role === "DEALER") {
    const dealer = await getDealerProfileByUserId(session.user.id);
    // Own bid only — never load other dealers' bids.
    const own = await getOwnBidForVehicle(vehicle.id, session.user.id);
    const ownBid = own
      ? {
          id: own.id,
          amount: own.amount.toString(),
          updatedAt: own.updatedAt.toISOString(),
          history: own.history.map((h) => ({
            id: h.id,
            amount: h.amount.toString(),
            changedAt: h.changedAt.toISOString(),
          })),
        }
      : null;

    if (!isSubscriptionActive(dealer?.subscriptionStatus)) {
      bidPanel = (
        <div className="flex flex-col gap-3">
          <BidPanelGate kind="subscription" />
          {ownBid ? (
            <BidForm
              repoVehicleId={vehicle.id}
              canBid={false}
              blockedReason="An active subscription is required to update your bid."
              ownBid={ownBid}
            />
          ) : null}
        </div>
      );
    } else {
      let blockedReason: string | undefined;
      if (!window.ok) {
        if (window.reason === "NOT_STARTED") {
          blockedReason = `Bidding opens at ${formatDateTime(vehicle.biddingOpensAt)}.`;
        } else if (window.reason === "CLOSED" || status === "CLOSED") {
          blockedReason = "Bidding has closed for this auction.";
        } else {
          blockedReason = "This auction is not open for bidding.";
        }
      }

      bidPanel = (
        <BidForm
          repoVehicleId={vehicle.id}
          canBid={window.ok}
          blockedReason={blockedReason}
          ownBid={ownBid}
        />
      );
    }
  } else if (role === "FINANCE_CO" || role === "ADMIN") {
    bidPanel = (
      <BidPanelGate
        kind="view_only"
        message="View only — dealer bidding is available to subscribed dealers."
      />
    );
  } else {
    bidPanel = <BidPanelGate kind="dealer_signup" />;
  }

  return (
    <div className="min-h-svh bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <Link
          href="/auctions"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeftIcon className="size-4" />
          All auctions
        </Link>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="flex flex-col gap-6">
            <Gallery images={imageUrls} title={title} />
            {vehicle.description ? (
              <div>
                <h2 className="text-base font-semibold">Description</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                  {vehicle.description}
                </p>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
                <Badge variant={status === "OPEN" ? "default" : "secondary"}>
                  {humanizeEnum(status)}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Listed by {vehicle.financeCo.companyName}
              </p>
            </div>

            {status === "OPEN" ? (
              <div className="rounded-xl border bg-card px-4 py-3 text-sm">
                {!window.ok && window.reason === "NOT_STARTED" ? (
                  <>
                    <span className="text-muted-foreground">Bidding opens in </span>
                    <AuctionCountdown closesAt={vehicle.biddingOpensAt.toISOString()} />
                  </>
                ) : !window.ok && window.reason === "CLOSED" ? (
                  <>
                    <span className="text-muted-foreground">Bidding closed at </span>
                    <span className="font-medium">{formatDateTime(vehicle.biddingClosesAt)}</span>
                  </>
                ) : (
                  <>
                    <span className="text-muted-foreground">Bidding closes in </span>
                    <AuctionCountdown closesAt={vehicle.biddingClosesAt.toISOString()} />
                  </>
                )}
              </div>
            ) : null}

            <dl className="rounded-xl border bg-card px-4 py-1">
              <SpecRow label="Mileage" value={formatMileage(vehicle.mileage)} />
              <SpecRow label="Body type" value={humanizeEnum(vehicle.bodyType)} />
              <SpecRow label="Colour" value={vehicle.colour ?? "n/a"} />
              <SpecRow label="Registered" value={formatMonthYear(vehicle.regDate)} />
              <SpecRow label="COE expiry" value={formatDate(vehicle.coeExpiry)} />
              <SpecRow label="Condition" value={vehicle.condition ?? "n/a"} />
              <SpecRow label="Viewing location" value={vehicle.location ?? "n/a"} />
              <SpecRow label="Bidding opens" value={formatDateTime(vehicle.biddingOpensAt)} />
              <SpecRow label="Bidding closes" value={formatDateTime(vehicle.biddingClosesAt)} />
            </dl>

            {bidPanel}
          </div>
        </div>
      </main>
    </div>
  );
}

function formatDateTime(date: Date): string {
  return date.toLocaleString("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
