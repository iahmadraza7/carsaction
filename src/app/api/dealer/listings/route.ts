import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getDealerProfileByUserId, canCreateListing } from "@/lib/subscription";
import { listingSchema } from "@/lib/validations/listing";
import { listingDataFromInput } from "@/lib/listing-write";

// Create a listing. DEALER-only. Server enforces the subscription/limit rules
// (canCreateListing); the UI hiding the button is not the security boundary.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  if (session.user.role !== "DEALER") {
    return NextResponse.json({ error: "Only dealers can create listings" }, { status: 403 });
  }

  const profile = await getDealerProfileByUserId(session.user.id);
  if (!profile) {
    return NextResponse.json({ error: "Dealer profile not found" }, { status: 404 });
  }

  const gate = await canCreateListing(profile);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.reason }, { status: 403 });
  }

  const parsed = listingSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { errors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { images } = parsed.data;
  const listing = await prisma.listing.create({
    data: {
      dealerId: profile.id,
      ...listingDataFromInput(parsed.data),
      images: { create: images.map((url, index) => ({ url, order: index })) },
    },
    select: { id: true },
  });

  return NextResponse.json({ id: listing.id }, { status: 201 });
}
