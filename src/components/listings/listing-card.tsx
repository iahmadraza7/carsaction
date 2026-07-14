import Link from "next/link";
import Image from "next/image";
import { GaugeIcon, CalendarIcon, Settings2Icon, ImageOffIcon } from "lucide-react";

import { formatPrice, formatMileage, formatDepreciation } from "@/lib/format";
import { humanizeEnum } from "@/lib/listing-options";

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

export function ListingCard({ listing }: { listing: ListingCardData }) {
  return (
    <Link
      href={`/cars/${listing.id}`}
      className="group flex flex-col overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:ring-foreground/15"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
        {listing.imageUrl ? (
          <Image
            src={listing.imageUrl}
            alt={listing.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
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
  );
}
