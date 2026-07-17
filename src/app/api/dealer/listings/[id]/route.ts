import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getDealerProfileByUserId } from "@/lib/subscription";
import { listingSchema } from "@/lib/validations/listing";
import { listingDataFromInput } from "@/lib/listing-write";

async function ownedListing(userId: string, listingId: string) {
  const profile = await getDealerProfileByUserId(userId);
  if (!profile) return null;
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, dealerId: true },
  });
  if (!listing || listing.dealerId !== profile.id) return null;
  return listing;
}

// Edit a listing. DEALER-only, owner-only. Images are replaced wholesale in the
// submitted order (simplest correct behaviour for reorder + add/remove).
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "DEALER") {
    return NextResponse.json({ error: "Not authorised" }, { status: 403 });
  }

  const { id } = await params;
  const listing = await ownedListing(session.user.id, id);
  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const parsed = listingSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { errors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { images } = parsed.data;
  await prisma.$transaction([
    prisma.listingImage.deleteMany({ where: { listingId: id } }),
    prisma.listing.update({
      where: { id },
      data: {
        ...listingDataFromInput(parsed.data),
        images: { create: images.map((url, index) => ({ url, order: index })) },
      },
    }),
  ]);

  return NextResponse.json({ id }, { status: 200 });
}

// Delete a listing. DEALER-only, owner-only. Cascades to images/enquiries/sale.
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "DEALER") {
    return NextResponse.json({ error: "Not authorised" }, { status: 403 });
  }

  const { id } = await params;
  const listing = await ownedListing(session.user.id, id);
  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  await prisma.listing.delete({ where: { id } });
  return NextResponse.json({ ok: true }, { status: 200 });
}
