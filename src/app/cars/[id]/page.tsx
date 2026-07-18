import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronLeftIcon,
  BadgeCheckIcon,
  CalendarClockIcon,
  EyeIcon,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { SiteHeader } from "@/components/site-header";
import { Gallery } from "@/components/listings/gallery";
import { WhatsAppButton } from "@/components/listings/whatsapp-button";
import { EnquiryForm } from "@/components/listings/enquiry-form";
import { FavouriteButton } from "@/components/listings/favourite-button";
import { Badge } from "@/components/ui/badge";
import {
  formatPrice,
  formatDepreciation,
  formatMileage,
  formatMonthYear,
  formatDate,
} from "@/lib/format";
import { humanizeEnum } from "@/lib/listing-options";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const listing = await prisma.listing.findUnique({
    where: { id },
    select: {
      title: true,
      make: true,
      model: true,
      year: true,
      price: true,
      images: { orderBy: { order: "asc" }, take: 1, select: { url: true } },
    },
  });
  if (!listing) return { title: "Car not found" };

  const title = `${listing.title} · ${formatPrice(Number(listing.price))}`;
  const description = `${listing.year} ${listing.make} ${listing.model} for sale in Singapore at ${formatPrice(Number(listing.price))}. View photos, full specs and WhatsApp the dealer on CARSaction.`;
  const image = listing.images[0]?.url;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `${APP_URL}/cars/${id}`,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
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

export default async function ListingDetailPage({ params }: { params: Params }) {
  const { id } = await params;

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      dealer: true,
      images: { orderBy: { order: "asc" } },
    },
  });

  if (!listing || listing.status === "DRAFT") notFound();

  // Count the view (best-effort, never blocks rendering).
  prisma.listing
    .update({ where: { id }, data: { viewCount: { increment: 1 } } })
    .catch(() => {});

  const session = await auth();
  const isBuyer = session?.user?.role === "BUYER";
  let initialFavourited = false;
  if (isBuyer) {
    const fav = await prisma.favourite.findUnique({
      where: { userId_listingId: { userId: session!.user.id, listingId: id } },
      select: { id: true },
    });
    initialFavourited = Boolean(fav);
  }

  const price = Number(listing.price);
  const depreciation = listing.depreciation != null ? Number(listing.depreciation) : null;
  const omv = listing.omv != null ? Number(listing.omv) : null;
  const arf = listing.arf != null ? Number(listing.arf) : null;
  const images = listing.images.map((img) => img.url);
  const listingUrl = `${APP_URL}/cars/${listing.id}`;

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Link
          href="/cars"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeftIcon className="size-4" />
          Back to results
        </Link>

        {/* Headline: title + price surface immediately, incl. on mobile */}
        <div className="mb-5">
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            {listing.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="text-2xl font-bold text-foreground sm:text-3xl">
              {formatPrice(price)}
            </span>
            {depreciation != null ? (
              <span className="text-sm text-muted-foreground">
                Depreciation {formatDepreciation(depreciation)}
              </span>
            ) : null}
            {listing.coeExpiry ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary ring-1 ring-primary/20">
                <CalendarClockIcon className="size-4" />
                COE till {formatMonthYear(listing.coeExpiry)}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <EyeIcon className="size-3.5" />
              {listing.viewCount + 1} views
            </span>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* Left: gallery + specs + description */}
          <div className="min-w-0 space-y-8">
            <Gallery images={images} title={listing.title} />

            {/* COE highlight: SG buyers check this first */}
            {listing.coeExpiry ? (
              <div className="flex items-center gap-3 rounded-xl bg-primary/10 px-4 py-3 ring-1 ring-primary/20">
                <CalendarClockIcon className="size-5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    COE expires {formatMonthYear(listing.coeExpiry)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(listing.coeExpiry)}
                  </p>
                </div>
              </div>
            ) : null}

            <section>
              <h2 className="mb-3 font-heading text-lg font-semibold">Specifications</h2>
              <dl className="rounded-xl bg-card px-4 ring-1 ring-foreground/10">
                <SpecRow label="Make" value={listing.make} />
                <SpecRow label="Model" value={listing.model} />
                <SpecRow label="Variant" value={listing.variant || "n/a"} />
                <SpecRow label="Year" value={listing.year} />
                <SpecRow label="Mileage" value={formatMileage(listing.mileage)} />
                <SpecRow
                  label="Engine capacity"
                  value={listing.engineCc ? `${listing.engineCc.toLocaleString()} cc` : "n/a"}
                />
                <SpecRow label="Transmission" value={humanizeEnum(listing.transmission)} />
                <SpecRow label="Fuel type" value={humanizeEnum(listing.fuelType)} />
                <SpecRow label="Body type" value={humanizeEnum(listing.bodyType)} />
                <SpecRow label="Colour" value={listing.colour || "n/a"} />
                <SpecRow
                  label="Registration date"
                  value={listing.regDate ? formatDate(listing.regDate) : "n/a"}
                />
                <SpecRow label="OMV" value={omv != null ? formatPrice(omv) : "n/a"} />
                <SpecRow label="ARF" value={arf != null ? formatPrice(arf) : "n/a"} />
              </dl>
            </section>

            {listing.description ? (
              <section>
                <h2 className="mb-3 font-heading text-lg font-semibold">Description</h2>
                <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                  {listing.description}
                </p>
              </section>
            ) : null}
          </div>

          {/* Right: dealer + contact (sticky on desktop) */}
          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <div className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
              <div className="mb-1 flex items-center gap-2">
                <h2 className="font-heading text-lg font-semibold">
                  {listing.dealer.businessName}
                </h2>
                {listing.dealer.verified ? (
                  <Badge variant="secondary" className="gap-1">
                    <BadgeCheckIcon className="size-3.5 text-primary" />
                    Verified
                  </Badge>
                ) : null}
              </div>
              <p className="mb-4 text-xs text-muted-foreground">
                {listing.dealer.verified
                  ? "Identity verified by CARSaction"
                  : "Dealer on CARSaction"}
              </p>

              <div className="space-y-2">
                <WhatsAppButton
                  phone={listing.dealer.whatsappNumber}
                  make={listing.make}
                  model={listing.model}
                  year={listing.year}
                  listingUrl={listingUrl}
                />
                {isBuyer ? (
                  <FavouriteButton listingId={listing.id} initialFavourited={initialFavourited} />
                ) : null}
              </div>
            </div>

            <div className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
              <h2 className="mb-1 font-heading text-lg font-semibold">Enquire about this car</h2>
              <p className="mb-4 text-xs text-muted-foreground">
                Prefer not to use WhatsApp? Send the dealer your details.
              </p>
              <EnquiryForm
                listingId={listing.id}
                defaultName={session?.user?.name ?? ""}
              />
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
