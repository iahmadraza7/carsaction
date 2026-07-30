"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { GaugeIcon, CalendarIcon, Settings2Icon, ImageOffIcon, HeartIcon } from "lucide-react";
import { toast } from "sonner";

import { formatPrice, formatMileage, formatDepreciation } from "@/lib/format";
import { humanizeEnum } from "@/lib/listing-options";
import { cn } from "@/lib/utils";

export type ListingCardData = {
  id: string;
  title: string;
  price: number;
  depreciation: number | null;
  year: number;
  mileage: number;
  transmission: string;
  fuelType: string;
  imageUrl: string | null;
};

function Pill({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
      {icon}
      {children}
    </span>
  );
}

export function ListingCard({
  listing,
  showShortlist = false,
  initialShortlisted = false,
}: {
  listing: ListingCardData;
  showShortlist?: boolean;
  initialShortlisted?: boolean;
}) {
  const [shortlisted, setShortlisted] = React.useState(initialShortlisted);
  const [pending, setPending] = React.useState(false);

  async function toggleShortlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setPending(true);
    const previous = shortlisted;
    setShortlisted(!previous);
    try {
      const res = await fetch("/api/favourites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { favourited: boolean };
      setShortlisted(data.favourited);
      toast.success(data.favourited ? "Added to shortlist" : "Removed from shortlist");
    } catch {
      setShortlisted(previous);
      toast.error("Could not update shortlist");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-primary/10 hover:ring-primary/25">
      {showShortlist ? (
        <button
          type="button"
          onClick={toggleShortlist}
          disabled={pending}
          aria-label={shortlisted ? "Remove from shortlist" : "Add to shortlist"}
          className="absolute top-3 right-3 z-10 inline-flex size-10 items-center justify-center rounded-full bg-white/95 text-foreground shadow-md ring-1 ring-black/5 transition hover:scale-105 hover:bg-white"
        >
          <HeartIcon
            className={cn("size-5", shortlisted && "fill-primary text-primary")}
          />
        </button>
      ) : null}

      <Link href={`/cars/${listing.id}`} className="flex flex-1 flex-col">
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
          {listing.imageUrl ? (
            <Image
              src={listing.imageUrl}
              alt={listing.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <ImageOffIcon className="size-8" />
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4">
          <h3 className="line-clamp-1 font-medium tracking-tight">{listing.title}</h3>

          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold text-foreground">
              {formatPrice(listing.price)}
            </span>
            {listing.depreciation != null ? (
              <span className="text-xs text-muted-foreground">
                {formatDepreciation(listing.depreciation)} depr.
              </span>
            ) : null}
          </div>

          <div className="mt-auto flex flex-wrap gap-1.5">
            <Pill icon={<CalendarIcon className="size-3" />}>{listing.year}</Pill>
            <Pill icon={<GaugeIcon className="size-3" />}>{formatMileage(listing.mileage)}</Pill>
            <Pill icon={<Settings2Icon className="size-3" />}>
              {humanizeEnum(listing.transmission)}
            </Pill>
          </div>
        </div>
      </Link>
    </div>
  );
}
