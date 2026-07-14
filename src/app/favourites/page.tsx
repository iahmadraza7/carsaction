import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { HeartIcon } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { SiteHeader } from "@/components/site-header";
import { ListingCard, type ListingCardData } from "@/components/listings/listing-card";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Your favourites",
  robots: { index: false },
};

export default async function FavouritesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/favourites");
  // Only buyers keep a favourites list.
  if (session.user.role !== "BUYER") redirect("/");

  const favourites = await prisma.favourite.findMany({
    where: { userId: session.user.id },
    orderBy: { id: "desc" },
    include: {
      listing: { include: { images: { orderBy: { order: "asc" }, take: 1 } } },
    },
  });

  const listings: ListingCardData[] = favourites.map((f) => ({
    id: f.listing.id,
    title: f.listing.title,
    price: Number(f.listing.price),
    depreciation: f.listing.depreciation != null ? Number(f.listing.depreciation) : null,
    year: f.listing.year,
    mileage: f.listing.mileage,
    transmission: f.listing.transmission,
    fuelType: f.listing.fuelType,
    imageUrl: f.listing.images[0]?.url ?? null,
  }));

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            Your favourites
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {listings.length} {listings.length === 1 ? "saved car" : "saved cars"}
          </p>
        </div>

        {listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl bg-card px-6 py-16 text-center ring-1 ring-foreground/10">
            <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <HeartIcon className="size-6" />
            </div>
            <h3 className="text-lg font-semibold">No favourites yet</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Tap the heart on any car to save it here for later.
            </p>
            <Link href="/cars" className={buttonVariants({ className: "mt-5" })}>
              Browse cars
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
