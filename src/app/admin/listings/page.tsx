import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { SearchIcon, ExternalLinkIcon, ImageIcon, PencilIcon } from "lucide-react";
import { ListingStatus, Prisma } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { DeleteListingButton } from "@/components/admin/delete-listing-button";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Listings — Admin" };

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin/listings");

  const { q } = await searchParams;
  const where: Prisma.ListingWhereInput = q
    ? {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { make: { contains: q, mode: "insensitive" } },
          { model: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const listings = await prisma.listing.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      images: { orderBy: { order: "asc" }, take: 1 },
      dealer: { select: { businessName: true } },
    },
  });

  return (
    <AdminShell
      email={session.user.email ?? ""}
      title="Listings"
      description={`${listings.length} listing${listings.length === 1 ? "" : "s"}`}
    >
      <form method="get" className="mb-5 flex max-w-md items-center gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search by title, make or model…"
            className="h-9 w-full rounded-lg border border-input bg-transparent pr-3 pl-8 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
      </form>

      <div className="grid gap-3">
        {listings.map((l) => {
          const cover = l.images[0]?.url;
          return (
            <div
              key={l.id}
              className="flex flex-col gap-4 rounded-xl border bg-card p-3 sm:flex-row sm:items-center"
            >
              <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-lg bg-muted sm:w-32">
                {cover ? (
                  <Image src={cover} alt={l.title} fill sizes="128px" className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <ImageIcon className="size-5" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <StatusBadge status={l.status} />
                  <span className="text-xs text-muted-foreground">{l.dealer.businessName}</span>
                </div>
                <p className="mt-1 truncate font-medium">{l.title}</p>
                <p className="text-sm font-semibold">{formatPrice(Number(l.price))}</p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <Link
                  href={`/cars/${l.id}`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  <ExternalLinkIcon />
                  View
                </Link>
                <Link
                  href={`/admin/listings/${l.id}/edit`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  <PencilIcon />
                  Edit
                </Link>
                <DeleteListingButton listingId={l.id} title={l.title} />
              </div>
            </div>
          );
        })}
        {listings.length === 0 ? (
          <p className="text-sm text-muted-foreground">No listings match your search.</p>
        ) : null}
      </div>
    </AdminShell>
  );
}

function StatusBadge({ status }: { status: ListingStatus }) {
  if (status === ListingStatus.SOLD) return <Badge variant="secondary">Sold</Badge>;
  if (status === ListingStatus.DRAFT) return <Badge variant="outline">Draft</Badge>;
  return <Badge variant="default">For sale</Badge>;
}
