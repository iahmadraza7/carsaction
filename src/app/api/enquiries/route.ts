import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { enquirySchema } from "@/lib/validations/enquiry";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = enquirySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { errors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { listingId, name, phone, message } = parsed.data;

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true },
  });
  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  // Attach the buyer id when the enquirer is logged in; guests are allowed too.
  const session = await auth();
  const buyerId = session?.user?.id ?? null;

  await prisma.enquiry.create({
    data: { listingId, name, phone, message: message || null, buyerId },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
