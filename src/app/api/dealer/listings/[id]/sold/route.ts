import { NextResponse } from "next/server";
import { ListingStatus, Prisma } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getDealerProfileByUserId } from "@/lib/subscription";
import { saleSchema } from "@/lib/validations/listing";

async function ownedListing(userId: string, listingId: string) {
  const profile = await getDealerProfileByUserId(userId);
  if (!profile) return null;
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, dealerId: true },
  });
  if (!listing || listing.dealerId !== profile.id) return null;
  return { profileId: profile.id, listingId: listing.id };
}

// Mark a listing SOLD and record the car-sale transaction. DEALER/owner only.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "DEALER") {
    return NextResponse.json({ error: "Not authorised" }, { status: 403 });
  }

  const { id } = await params;
  const owned = await ownedListing(session.user.id, id);
  if (!owned) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  const parsed = saleSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { errors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  const { salePrice, buyerName, buyerPhone, notes } = parsed.data;

  await prisma.$transaction([
    prisma.listing.update({ where: { id }, data: { status: ListingStatus.SOLD } }),
    prisma.sale.upsert({
      where: { listingId: id },
      update: {
        salePrice: new Prisma.Decimal(salePrice),
        buyerName: buyerName ?? null,
        buyerPhone: buyerPhone ?? null,
        notes: notes ?? null,
      },
      create: {
        listingId: id,
        dealerId: owned.profileId,
        salePrice: new Prisma.Decimal(salePrice),
        buyerName: buyerName ?? null,
        buyerPhone: buyerPhone ?? null,
        notes: notes ?? null,
      },
    }),
  ]);

  return NextResponse.json({ ok: true }, { status: 200 });
}

// Revert a SOLD listing back to FOR_SALE and remove the sale record.
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "DEALER") {
    return NextResponse.json({ error: "Not authorised" }, { status: 403 });
  }

  const { id } = await params;
  const owned = await ownedListing(session.user.id, id);
  if (!owned) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  await prisma.$transaction([
    prisma.sale.deleteMany({ where: { listingId: id } }),
    prisma.listing.update({ where: { id }, data: { status: ListingStatus.FOR_SALE } }),
  ]);

  return NextResponse.json({ ok: true }, { status: 200 });
}
