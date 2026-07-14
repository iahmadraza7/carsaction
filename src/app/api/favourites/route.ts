import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

const schema = z.object({ listingId: z.string().min(1) });

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "You must be signed in" }, { status: 401 });
  }
  if (session.user.role !== "BUYER") {
    return NextResponse.json(
      { error: "Only buyer accounts can save favourites" },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { listingId } = parsed.data;
  const userId = session.user.id;

  const existing = await prisma.favourite.findUnique({
    where: { userId_listingId: { userId, listingId } },
  });

  if (existing) {
    await prisma.favourite.delete({ where: { id: existing.id } });
    return NextResponse.json({ favourited: false });
  }

  // Guard against favouriting a non-existent listing.
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true },
  });
  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  await prisma.favourite.create({ data: { userId, listingId } });
  return NextResponse.json({ favourited: true });
}
