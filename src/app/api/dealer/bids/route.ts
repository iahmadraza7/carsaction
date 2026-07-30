import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getDealerProfileByUserId, dealerHasActiveAccess } from "@/lib/subscription";
import { placeBidSchema } from "@/lib/validations/bid";
import { placeOrUpdateBid } from "@/lib/bids";

/**
 * Place or edit a sealed bid. DEALER + ACTIVE subscription only.
 * One bid per dealer per vehicle — existing row is updated and BidHistory appended.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  if (session.user.role !== "DEALER") {
    return NextResponse.json({ error: "Only dealers can place bids" }, { status: 403 });
  }

  const profile = await getDealerProfileByUserId(session.user.id);
  if (!profile || !dealerHasActiveAccess(profile)) {
    return NextResponse.json(
      { error: "An active subscription is required to bid" },
      { status: 403 },
    );
  }

  const parsed = placeBidSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { errors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const result = await placeOrUpdateBid({
    repoVehicleId: parsed.data.repoVehicleId,
    dealerUserId: session.user.id,
    amount: parsed.data.amount,
  });

  if (!result.ok) {
    const status =
      result.reason === "NOT_FOUND"
        ? 404
        : result.reason === "FORBIDDEN"
          ? 403
          : 409;
    return NextResponse.json({ error: result.message }, { status });
  }

  return NextResponse.json(
    { id: result.bidId, created: result.created },
    { status: result.created ? 201 : 200 },
  );
}
