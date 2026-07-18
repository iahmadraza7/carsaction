import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { PlusIcon, ImageIcon, EyeIcon, MessageSquareIcon } from "lucide-react";
import { ListingStatus, SubStatus } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DealerShell } from "@/components/dealer/dealer-shell";
import { ListingActions } from "@/components/dealer/listing-actions";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { getDealerProfileByUserId, canCreateListing } from "@/lib/subscription";

export const metadata: Metadata = { title: "My listings | CARSaction" };

export default async function DealerListingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/dealer/listings");

  const profile = await getDealerProfileByUserId(session.user.id);
  if (!profile) {
    return (
      <DealerShell email={session.user.email ?? ""} title="My listings">
        <p className="text-sm text-muted-foreground">Dealer profile not found.</p>
      </DealerShell>
    );
  }

  const [listings, gate] = await Promise.all([
    prisma.listing.findMany({
      where: { dealerId: profile.id },
      orderBy: { createdAt: "desc" },
      include: {
        images: { orderBy: { order: "asc" }, take: 1 },
        sale: true,
        _count: { select: { enquiries: true } },
      },
    }),
    canCreateListing(profile),
  ]);

  const capLabel =
    gate.limit == null ? `${gate.used} / Unlimited` : `${gate.used} / ${gate.limit}`;

  const addButton = gate.ok ? (
    <Link href="/dealer/listings/new" className={buttonVariants({ variant: "default" })}>
      <PlusIcon />
      Add listing
    </Link>
  ) : (
    <Link href="/pricing" className={buttonVariants({ variant: "outline" })}>
      {profile.subscriptionStatus === SubStatus.ACTIVE ? "Upgrade plan" : "Choose a plan"}
    </Link>
  );

  return (
    <DealerShell
      email={session.user.email ?? ""}
      title="My listings"
      description={`${capLabel} listings used`}
      actions={addButton}
    >
      {!gate.ok && gate.reason ? (
        <div className="mb-5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-foreground">
          {gate.reason}
        </div>
      ) : null}

      {listings.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card p-10 text-center">
          <h2 className="text-base font-semibold">No listings yet</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Add your first car to start receiving enquiries from Singapore buyers.
          </p>
          {gate.ok ? (
            <Link
              href="/dealer/listings/new"
              className={`mt-4 ${buttonVariants({ variant: "default" })}`}
            >
              <PlusIcon />
              Add your first listing
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-3">
          {listings.map((listing) => {
            const cover = listing.images[0]?.url;
            return (
              <div
                key={listing.id}
                className="flex flex-col gap-4 rounded-xl border bg-card p-3 sm:flex-row sm:items-center"
              >
                <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-lg bg-muted sm:w-40">
                  {cover ? (
                    <Image
                      src={cover}
                      alt={listing.title}
                      fill
                      sizes="160px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <ImageIcon className="size-6" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={listing.status} />
                    <span className="text-xs text-muted-foreground">
                      {listing.year} · {listing.make} {listing.model}
                    </span>
                  </div>
                  <Link
                    href={`/cars/${listing.id}`}
                    className="mt-1 block truncate font-medium hover:underline"
                  >
                    {listing.title}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    <span className="font-semibold">{formatPrice(Number(listing.price))}</span>
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <EyeIcon className="size-3.5" />
                      {listing.viewCount}
                    </span>
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <MessageSquareIcon className="size-3.5" />
                      {listing._count.enquiries}
                    </span>
                    {listing.sale ? (
                      <span className="text-muted-foreground">
                        Sold at {formatPrice(Number(listing.sale.salePrice))}
                      </span>
                    ) : null}
                  </div>
                </div>

                <ListingActions
                  listingId={listing.id}
                  isSold={listing.status === ListingStatus.SOLD}
                  defaultPrice={Number(listing.price).toString()}
                />
              </div>
            );
          })}
        </div>
      )}
    </DealerShell>
  );
}

function StatusBadge({ status }: { status: ListingStatus }) {
  if (status === ListingStatus.SOLD) return <Badge variant="secondary">Sold</Badge>;
  if (status === ListingStatus.DRAFT) return <Badge variant="outline">Draft</Badge>;
  return <Badge variant="default">For sale</Badge>;
}
