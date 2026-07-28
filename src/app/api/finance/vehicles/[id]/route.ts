import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getFinanceProfileByUserId } from "@/lib/finance";
import {
  repoVehicleSchema,
  repoVehicleDataFromInput,
} from "@/lib/validations/repo-vehicle";

type Params = { params: Promise<{ id: string }> };

// Update a repo vehicle. Only while OPEN and no bids yet.
export async function PATCH(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  if (session.user.role !== "FINANCE_CO") {
    return NextResponse.json({ error: "Not authorised" }, { status: 403 });
  }

  const profile = await getFinanceProfileByUserId(session.user.id);
  if (!profile) {
    return NextResponse.json({ error: "Finance profile not found" }, { status: 404 });
  }
  if (!profile.verified) {
    return NextResponse.json(
      { error: "Your company must be verified before editing vehicles" },
      { status: 403 },
    );
  }

  const { id } = await params;
  const existing = await prisma.repoVehicle.findFirst({
    where: { id, financeCoId: profile.id },
    include: { _count: { select: { bids: true } } },
  });
  if (!existing) {
    return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
  }
  if (existing.status !== "OPEN") {
    return NextResponse.json(
      { error: "Only open auctions can be edited" },
      { status: 403 },
    );
  }
  if (existing._count.bids > 0) {
    return NextResponse.json(
      { error: "Cannot edit a vehicle that already has bids" },
      { status: 403 },
    );
  }

  const parsed = repoVehicleSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { errors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { images } = parsed.data;
  await prisma.$transaction([
    prisma.repoImage.deleteMany({ where: { repoVehicleId: id } }),
    prisma.repoVehicle.update({
      where: { id },
      data: {
        ...repoVehicleDataFromInput(parsed.data),
        images: { create: images.map((url, index) => ({ url, order: index })) },
      },
    }),
  ]);

  return NextResponse.json({ id }, { status: 200 });
}
