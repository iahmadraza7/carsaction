import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getDealerProfileByUserId } from "@/lib/subscription";
import { dealerContactSchema } from "@/lib/validations/dealer-contact";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "DEALER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const profile = await getDealerProfileByUserId(session.user.id);
  if (!profile) {
    return NextResponse.json({ error: "Dealer profile not found" }, { status: 404 });
  }

  const contacts = await prisma.dealerContact.findMany({
    where: { dealerId: profile.id },
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({ contacts });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "DEALER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const profile = await getDealerProfileByUserId(session.user.id);
  if (!profile) {
    return NextResponse.json({ error: "Dealer profile not found" }, { status: 404 });
  }

  const parsed = dealerContactSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { errors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const maxOrder = await prisma.dealerContact.aggregate({
    where: { dealerId: profile.id },
    _max: { order: true },
  });

  const contact = await prisma.dealerContact.create({
    data: {
      dealerId: profile.id,
      name: parsed.data.name,
      phone: parsed.data.phone,
      whatsappEnabled: parsed.data.whatsappEnabled,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  return NextResponse.json({ contact }, { status: 201 });
}
