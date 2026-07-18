import type { MetadataRoute } from "next";
import { ListingStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

// Runtime only — Docker image build has no DB at `db:5432`.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${base}/cars`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${base}/pricing`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/login`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/signup`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/dealer/signup`, changeFrequency: "monthly", priority: 0.5 },
  ];

  try {
    const listings = await prisma.listing.findMany({
      where: { status: ListingStatus.FOR_SALE },
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 5_000,
    });

    return [
      ...staticRoutes,
      ...listings.map((l) => ({
        url: `${base}/cars/${l.id}`,
        lastModified: l.updatedAt,
        changeFrequency: "daily" as const,
        priority: 0.8,
      })),
    ];
  } catch {
    return staticRoutes;
  }
}
