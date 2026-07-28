import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { PlusIcon } from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getFinanceProfileByUserId } from "@/lib/finance";
import { closeExpiredAuctions } from "@/lib/auction-close";
import { FinanceShell } from "@/components/finance/finance-shell";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatMileage, formatPrice } from "@/lib/format";
import { humanizeEnum } from "@/lib/listing-options";
import { AuctionCountdown } from "@/components/auctions/auction-countdown";
import { CancelVehicleButton } from "@/components/finance/cancel-vehicle-button";

export const metadata: Metadata = { title: "Finance dashboard | CARSaction" };

export default async function FinanceDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/finance/dashboard");

  const profile = await getFinanceProfileByUserId(session.user.id);
  if (!profile) {
    return (
      <FinanceShell email={session.user.email ?? ""} title="Finance dashboard">
        <p className="text-sm text-muted-foreground">Finance profile not found.</p>
      </FinanceShell>
    );
  }

  // Belt and braces: flip any past-deadline OPEN auctions before listing.
  await closeExpiredAuctions();

  const vehicles = await prisma.repoVehicle.findMany({
    where: { financeCoId: profile.id },
    orderBy: { createdAt: "desc" },
    include: {
      images: { orderBy: { order: "asc" }, take: 1 },
      _count: { select: { bids: true } },
    },
  });

  return (
    <FinanceShell
      email={session.user.email ?? ""}
      title={profile.companyName}
      description="Your repo vehicles and bidding windows"
      actions={
        profile.verified ? (
          <Link href="/finance/vehicles/new" className={buttonVariants({ size: "sm" })}>
            <PlusIcon />
            Post vehicle
          </Link>
        ) : null
      }
    >
      <div className="flex flex-col gap-6">
        {!profile.verified ? (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
            <p className="font-medium text-foreground">Pending verification</p>
            <p className="mt-1 text-muted-foreground">
              Your finance company account is awaiting admin verification. You can sign in, but
              you cannot post repo vehicles until you are verified.
            </p>
          </div>
        ) : null}

        {vehicles.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {profile.verified
              ? "No repo vehicles yet. Post your first vehicle to open bidding."
              : "No vehicles yet."}
          </p>
        ) : (
          <div className="grid gap-3">
            {vehicles.map((v) => {
              const canEdit = v.status === "OPEN" && v._count.bids === 0;
              // CONFIDENTIAL: reserve price — finance owner / admin only
              const reserve =
                v.reservePrice != null ? formatPrice(Number(v.reservePrice)) : null;
              return (
                <div
                  key={v.id}
                  className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">
                        {v.year} {v.make} {v.model}
                      </span>
                      <Badge variant={statusVariant(v.status)}>{humanizeEnum(v.status)}</Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span>{formatMileage(v.mileage)}</span>
                      <span>{v._count.bids} bid{v._count.bids === 1 ? "" : "s"}</span>
                      {reserve ? <span>Reserve {reserve}</span> : null}
                    </div>
                    {v.status === "OPEN" ? (
                      <div className="mt-2 text-sm">
                        <span className="text-muted-foreground">Closes in </span>
                        <AuctionCountdown closesAt={v.biddingClosesAt.toISOString()} />
                      </div>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/finance/vehicles/${v.id}/bids`}
                      className={buttonVariants({ size: "sm" })}
                    >
                      Bids ({v._count.bids})
                    </Link>
                    <Link
                      href={`/auctions/${v.id}`}
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      View
                    </Link>
                    {canEdit ? (
                      <Link
                        href={`/finance/vehicles/${v.id}/edit`}
                        className={buttonVariants({ variant: "outline", size: "sm" })}
                      >
                        Edit
                      </Link>
                    ) : null}
                    {v.status === "OPEN" ? (
                      <CancelVehicleButton
                        vehicleId={v.id}
                        bidCount={v._count.bids}
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

function statusVariant(status: string) {
  switch (status) {
    case "OPEN":
      return "default" as const;
    case "AWARDED":
      return "secondary" as const;
    case "CANCELLED":
      return "destructive" as const;
    default:
      return "outline" as const;
  }
}
