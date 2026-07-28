import Image from "next/image";
import Link from "next/link";
import { ImageOffIcon } from "lucide-react";

import { formatMileage } from "@/lib/format";
import { AuctionCountdown } from "@/components/auctions/auction-countdown";

export type AuctionCardData = {
  id: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  biddingClosesAt: Date;
  coverUrl: string | null;
};

export function AuctionCard({ vehicle }: { vehicle: AuctionCardData }) {
  const title = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

  return (
    <Link
      href={`/auctions/${vehicle.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[16/10] bg-muted">
        {vehicle.coverUrl ? (
          <Image
            src={vehicle.coverUrl}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <ImageOffIcon className="size-8" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h2 className="font-semibold tracking-tight text-balance">{title}</h2>
        <p className="text-sm text-muted-foreground">{formatMileage(vehicle.mileage)}</p>
        <p className="mt-auto pt-2 text-sm">
          <span className="text-muted-foreground">Closes in </span>
          <AuctionCountdown closesAt={vehicle.biddingClosesAt.toISOString()} />
        </p>
      </div>
    </Link>
  );
}
