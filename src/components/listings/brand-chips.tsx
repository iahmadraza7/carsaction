import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * Quick brand shortcuts. Makes come from live listings (never scraped).
 */
export function BrandChips({
  makes,
  activeMake,
  className,
}: {
  makes: string[];
  activeMake?: string;
  className?: string;
}) {
  if (makes.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <Link
        href="/cars"
        className={cn(
          "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
          !activeMake
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
        )}
      >
        All brands
      </Link>
      {makes.map((make) => {
        const active = activeMake === make;
        return (
          <Link
            key={make}
            href={`/cars?make=${encodeURIComponent(make)}`}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            {make}
          </Link>
        );
      })}
    </div>
  );
}
