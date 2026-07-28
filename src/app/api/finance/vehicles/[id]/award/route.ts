import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { awardAuction } from "@/lib/award";

type Params = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  bidId: z.string().min(1),
});

/** Award a CLOSED auction to a bid. Finance owner or ADMIN only. */
export async function POST(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  if (session.user.role !== "FINANCE_CO" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not authorised" }, { status: 403 });
  }

  const { id } = await params;
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "bidId is required" }, { status: 400 });
  }

  const result = await awardAuction({
    repoVehicleId: id,
    bidId: parsed.data.bidId,
    actorUserId: session.user.id,
    actorRole: session.user.role,
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

  return NextResponse.json({ ok: true });
}
