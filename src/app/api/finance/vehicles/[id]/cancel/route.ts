import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getFinanceProfileByUserId } from "@/lib/finance";

type Params = { params: Promise<{ id: string }> };

// Cancel an OPEN auction (status → CANCELLED). Allowed even if bids exist.
export async function POST(_req: Request, { params }: Params) {
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

  const { id } = await params;
  const existing = await prisma.repoVehicle.findFirst({
    where: { id, financeCoId: profile.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
  }
  if (existing.status !== "OPEN") {
    return NextResponse.json(
      { error: "Only open auctions can be cancelled" },
      { status: 403 },
    );
  }

  await prisma.repoVehicle.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
