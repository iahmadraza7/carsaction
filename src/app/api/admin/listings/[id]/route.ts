import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { listingSchema } from "@/lib/validations/listing";
import { listingDataFromInput } from "@/lib/listing-write";

// Admin can edit any listing. Images are replaced wholesale in the submitted order.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not authorised" }, { status: 403 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { suspended: true },
  });
  if (!dbUser || dbUser.suspended) {
    return NextResponse.json({ error: "Account suspended" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.listing.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) {
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
