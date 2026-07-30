import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getDealerProfileByUserId } from "@/lib/subscription";
import { dealerContactSchema } from "@/lib/validations/dealer-contact";

type Params = Promise<{ id: string }>;

async function ownedContact(userId: string, contactId: string) {
  const profile = await getDealerProfileByUserId(userId);
  if (!profile) return null;
  const contact = await prisma.dealerContact.findFirst({
    where: { id: contactId, dealerId: profile.id },
  });
  return contact ? { profile, contact } : null;
}

export async function PATCH(req: Request, { params }: { params: Params }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "DEALER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const owned = await ownedContact(session.user.id, id);
  if (!owned) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  const parsed = dealerContactSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { errors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const contact = await prisma.dealerContact.update({
    where: { id },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone,
      whatsappEnabled: parsed.data.whatsappEnabled,
    },
  });

  return NextResponse.json({ contact });
}

export async function DELETE(_req: Request, { params }: { params: Params }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "DEALER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const owned = await ownedContact(session.user.id, id);
  if (!owned) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  await prisma.dealerContact.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
