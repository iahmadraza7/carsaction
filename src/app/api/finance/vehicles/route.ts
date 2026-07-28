import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getFinanceProfileByUserId } from "@/lib/finance";
import {
  repoVehicleSchema,
  repoVehicleDataFromInput,
} from "@/lib/validations/repo-vehicle";

// Create a repo vehicle. FINANCE_CO only; must be verified.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  if (session.user.role !== "FINANCE_CO") {
    return NextResponse.json(
      { error: "Only finance companies can post repo vehicles" },
      { status: 403 },
    );
  }

  const profile = await getFinanceProfileByUserId(session.user.id);
  if (!profile) {
    return NextResponse.json({ error: "Finance profile not found" }, { status: 404 });
  }
  if (!profile.verified) {
    return NextResponse.json(
      { error: "Your company must be verified before posting vehicles" },
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
  const vehicle = await prisma.repoVehicle.create({
    data: {
      financeCoId: profile.id,
      ...repoVehicleDataFromInput(parsed.data),
      images: { create: images.map((url, index) => ({ url, order: index })) },
    },
    select: { id: true },
  });

  return NextResponse.json({ id: vehicle.id }, { status: 201 });
}
