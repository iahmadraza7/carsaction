import type { Metadata } from "next";
import Link from "next/link";
import { SearchXIcon } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/site-header";
import { ListingCard, type ListingCardData } from "@/components/listings/listing-card";
import { Reveal } from "@/components/motion/reveal";
import { Filters } from "@/components/listings/filters";
import { MobileFilters } from "@/components/listings/mobile-filters";
import { BrandChips } from "@/components/listings/brand-chips";
import { SortSelect } from "@/components/listings/sort-select";
import { Pagination } from "@/components/listings/pagination";
import { buttonVariants } from "@/components/ui/button";
import {
  PAGE_SIZE,
  isBodyType,
  isFuelType,
  isTransmission,
  isSort,
} from "@/lib/listing-options";
import { SG_MAKES, SG_MODELS_BY_MAKE, SG_POPULAR_MAKES } from "@/lib/sg-makes";
import type { Prisma } from "@prisma/client";

export const metadata: Metadata = {
  title: "Browse used cars for sale in Singapore",
  description:
    "Browse verified used cars for sale in Singapore. Filter by make, price, depreciation, COE left, year and mileage, and WhatsApp the dealer directly.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function one(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return v[0] ?? "";
  return v ?? "";
}

function many(v: string | string[] | undefined): string[] {
  if (v == null) return [];
  const raw = Array.isArray(v) ? v : [v];
  return raw
    .flatMap((s) => s.split(","))
    .map((s) => s.trim())
    .filter(Boolean);
}

function toInt(v: string): number | undefined {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : undefined;
}

const FILTER_KEYS = [
  "make",
  "model",
  "priceMin",
  "priceMax",
  "yearMin",
  "yearMax",
  "mileageMax",
  "deprMax",
  "coeYearsMin",
  "bodyType",
  "fuelType",
  "transmission",
] as const;

export default async function CarsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;

  const makesSel = many(sp.make);
  const modelsSel = many(sp.model);
  const priceMin = toInt(one(sp.priceMin));
  const priceMax = toInt(one(sp.priceMax));
  const yearMin = toInt(one(sp.yearMin));
  const yearMax = toInt(one(sp.yearMax));
  const mileageMax = toInt(one(sp.mileageMax));
  const deprMax = toInt(one(sp.deprMax));
  const coeYearsMin = toInt(one(sp.coeYearsMin));
  const bodyTypes = many(sp.bodyType).filter(isBodyType);
  const fuelTypes = many(sp.fuelType).filter(isFuelType);
  const transmissions = many(sp.transmission).filter(isTransmission);
  const sort = one(sp.sort);
  const page = Math.max(1, toInt(one(sp.page)) ?? 1);

  const where: Prisma.ListingWhereInput = { status: "FOR_SALE" };
  if (makesSel.length === 1) where.make = makesSel[0];
  else if (makesSel.length > 1) where.make = { in: makesSel };
  if (modelsSel.length === 1) where.model = modelsSel[0];
  else if (modelsSel.length > 1) where.model = { in: modelsSel };
  if (priceMin != null || priceMax != null) {
    where.price = {};
    if (priceMin != null) where.price.gte = priceMin;
    if (priceMax != null) where.price.lte = priceMax;
  }
  if (yearMin != null || yearMax != null) {
    where.year = {};
    if (yearMin != null) where.year.gte = yearMin;
    if (yearMax != null) where.year.lte = yearMax;
  }
  if (mileageMax != null) where.mileage = { lte: mileageMax };
  if (deprMax != null) where.depreciation = { lte: deprMax };
  if (coeYearsMin != null && coeYearsMin > 0) {
    const coeCutoff = new Date();
    coeCutoff.setFullYear(coeCutoff.getFullYear() + coeYearsMin);
    where.coeExpiry = { gte: coeCutoff };
  }
  if (bodyTypes.length === 1) where.bodyType = bodyTypes[0];
  else if (bodyTypes.length > 1) where.bodyType = { in: bodyTypes };
  if (fuelTypes.length === 1) where.fuelType = fuelTypes[0];
  else if (fuelTypes.length > 1) where.fuelType = { in: fuelTypes };
  if (transmissions.length === 1) where.transmission = transmissions[0];
  else if (transmissions.length > 1) where.transmission = { in: transmissions };

  const orderBy: Prisma.ListingOrderByWithRelationInput = isSort(sort)
    ? sort === "price_asc"
      ? { price: "asc" }
      : sort === "price_desc"
        ? { price: "desc" }
        : sort === "mileage_asc"
          ? { mileage: "asc" }
          : { createdAt: "desc" }
    : { createdAt: "desc" };

  const [liveMakeRows, total, rows] = await Promise.all([
    prisma.listing.findMany({
      where: { status: "FOR_SALE" },
      distinct: ["make"],
      select: { make: true },
      orderBy: { make: "asc" },
    }),
    prisma.listing.count({ where }),
    prisma.listing.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { images: { orderBy: { order: "asc" }, take: 1 } },
    }),
  ]);

  const makes = SG_MAKES;
  const modelsByMake: Record<string, string[]> = { ...SG_MODELS_BY_MAKE };
  const chipMakes =
    liveMakeRows.length > 0
      ? liveMakeRows.map((r) => r.make)
      : SG_POPULAR_MAKES.filter((m) => SG_MAKES.includes(m));

  const listings: ListingCardData[] = rows.map((l) => ({
    id: l.id,
    title: l.title,
    price: Number(l.price),
    depreciation: l.depreciation != null ? Number(l.depreciation) : null,
    year: l.year,
    mileage: l.mileage,
    transmission: l.transmission,
    fuelType: l.fuelType,
    imageUrl: l.images[0]?.url ?? null,
  }));

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const activeCount = FILTER_KEYS.filter((k) => many(sp[k]).length > 0).length;

  // Params to preserve across pagination links (repeat multi-value keys).
  const baseParams: Record<string, string | string[]> = {};
  for (const k of FILTER_KEYS) {
    const values = many(sp[k]);
    if (values.length === 1) baseParams[k] = values[0];
    else if (values.length > 1) baseParams[k] = values;
  }
  if (sort) baseParams.sort = sort;

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            Used cars for sale
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} {total === 1 ? "car" : "cars"} available in Singapore
          </p>
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Browse by brand
            </p>
            <BrandChips makes={chipMakes} activeMake={makesSel[0]} />
          </div>
        </div>

        <div className="flex gap-8">
          {/* Desktop sidebar */}
          <aside className="hidden w-64 shrink-0 lg:block">
            <div className="sticky top-20 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
              <h2 className="mb-4 text-sm font-semibold">Filters</h2>
              <Filters makes={makes} modelsByMake={modelsByMake} />
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            {/* Toolbar */}
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="lg:hidden">
                <MobileFilters
                  makes={makes}
                  modelsByMake={modelsByMake}
                  activeCount={activeCount}
                />
              </div>
              <span className="hidden text-sm text-muted-foreground lg:inline">
                Showing {listings.length} of {total}
              </span>
              <SortSelect />
            </div>

            {listings.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl bg-card px-6 py-16 text-center ring-1 ring-foreground/10">
                <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <SearchXIcon className="size-6" />
                </div>
                <h3 className="text-lg font-semibold">No cars match your filters</h3>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Try widening price or year, raising mileage or depreciation limits,
                  lowering COE years left, or clearing a filter or two.
                </p>
                <Link
                  href="/cars"
                  className={buttonVariants({ variant: "outline", className: "mt-5" })}
                >
                  Clear all filters
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {listings.map((l, i) => (
                    <Reveal key={l.id} y={16} duration={0.5} delay={(i % 3) * 0.06}>
                      <ListingCard listing={l} />
                    </Reveal>
                  ))}
                </div>
                <div className="mt-8">
                  <Pagination page={page} totalPages={totalPages} baseParams={baseParams} />
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
