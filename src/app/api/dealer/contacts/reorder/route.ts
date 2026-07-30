import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getDealerProfileByUserId } from "@/lib/subscription";
import { dealerContactsReorderSchema } from "@/lib/validations/dealer-contact";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "DEALER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const profile = await getDealerProfileByUserId(session.user.id);
  if (!profile) {
    return NextResponse.json({ error: "Dealer profile not found" }, { status: 404 });
  }

  const parsed = dealerContactsReorderSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const existing = await prisma.dealerContact.findMany({
    where: { dealerId: profile.id },
    select: { id: true },
  });
  const existingIds = new Set(existing.map((c) => c.id));
  if (
    parsed.data.orderedIds.length !== existingIds.size ||
    parsed.data.orderedIds.some((id) => !existingIds.has(id))
  ) {
    return NextResponse.json({ error: "Contact list mismatch" }, { status: 400 });
  }

  await prisma.$transaction(
    parsed.data.orderedIds.map((id, index) =>
      prisma.dealerContact.update({
        where: { id },
        data: { order: index },
      }),
    ),
  );

  return NextResponse.json({ ok: true });
}
