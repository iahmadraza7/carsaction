import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getFinanceProfileByUserId } from "@/lib/finance";

type Params = { params: Promise<{ id: string }> };

/**
 * List all bids for a repo vehicle. Owner finance company or ADMIN only.
 * Dealers must never call this — sealed bidding while OPEN.
 */
export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { id } = await params;
  const vehicle = await prisma.repoVehicle.findUnique({
    where: { id },
    select: { id: true, financeCoId: true },
  });
  if (!vehicle) {
    return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
  }

  const role = session.user.role;
  if (role === "ADMIN") {
    // allowed
  } else if (role === "FINANCE_CO") {
    const profile = await getFinanceProfileByUserId(session.user.id);
    if (!profile || profile.id !== vehicle.financeCoId) {
      return NextResponse.json({ error: "Not authorised" }, { status: 403 });
    }
  } else {
    return NextResponse.json({ error: "Not authorised" }, { status: 403 });
  }

  const bids = await prisma.bid.findMany({
    where: { repoVehicleId: id },
    orderBy: { amount: "desc" },
    select: {
      id: true,
      amount: true,
      createdAt: true,
      updatedAt: true,
      dealer: { select: { id: true, name: true, email: true } },
      history: {
        orderBy: { changedAt: "desc" },
        select: { id: true, amount: true, changedAt: true },
      },
    },
  });

  return NextResponse.json({
    bids: bids.map((b) => ({
      ...b,
      amount: b.amount.toString(),
      history: b.history.map((h) => ({
        ...h,
        amount: h.amount.toString(),
      })),
    })),
  });
}
