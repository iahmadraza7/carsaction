import { prisma } from "@/lib/prisma";
import { ensureVehicleClosedIfExpired } from "@/lib/auction-close";
import { notifyAuctionAward } from "@/lib/notifications";

export type AwardError =
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "NOT_CLOSED"
  | "BAD_BID"
  | "ALREADY_AWARDED";

/**
 * Award a CLOSED auction to a specific bid. Owner finance company or admin.
 * Transactional: re-checks status CLOSED and bid ownership inside the lock.
 */
export async function awardAuction(input: {
  repoVehicleId: string;
  bidId: string;
  actorUserId: string;
  actorRole: string;
}): Promise<{ ok: true } | { ok: false; reason: AwardError; message: string }> {
  // Flip past-deadline OPEN → CLOSED before the award check.
  await ensureVehicleClosedIfExpired(input.repoVehicleId);

  const result = await prisma.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<{ id: string }[]>`
      SELECT id FROM "RepoVehicle" WHERE id = ${input.repoVehicleId} FOR UPDATE
    `;
    if (locked.length === 0) {
      return { ok: false as const, reason: "NOT_FOUND" as const };
    }

    const vehicle = await tx.repoVehicle.findUnique({
      where: { id: input.repoVehicleId },
      select: {
        id: true,
        status: true,
        financeCoId: true,
        winningBidId: true,
        financeCo: { select: { userId: true } },
      },
    });
    if (!vehicle) {
      return { ok: false as const, reason: "NOT_FOUND" as const };
    }

    const isAdmin = input.actorRole === "ADMIN";
    const isOwner =
      input.actorRole === "FINANCE_CO" && vehicle.financeCo.userId === input.actorUserId;
    if (!isAdmin && !isOwner) {
      return { ok: false as const, reason: "FORBIDDEN" as const };
    }

    if (vehicle.status === "AWARDED" || vehicle.winningBidId) {
      return { ok: false as const, reason: "ALREADY_AWARDED" as const };
    }
    if (vehicle.status !== "CLOSED") {
      return { ok: false as const, reason: "NOT_CLOSED" as const };
    }

    const bid = await tx.bid.findFirst({
      where: { id: input.bidId, repoVehicleId: input.repoVehicleId },
      select: { id: true },
    });
    if (!bid) {
      return { ok: false as const, reason: "BAD_BID" as const };
    }

    await tx.repoVehicle.update({
      where: { id: input.repoVehicleId },
      data: {
        status: "AWARDED",
        winningBidId: bid.id,
        awardedAt: new Date(),
      },
    });

    return { ok: true as const };
  });

  if (!result.ok) {
    const messages: Record<AwardError, string> = {
      NOT_FOUND: "Vehicle not found",
      FORBIDDEN: "Not authorised to award this auction",
      NOT_CLOSED: "Auction must be closed before awarding",
      BAD_BID: "Bid not found on this auction",
      ALREADY_AWARDED: "This auction has already been awarded",
    };
    return { ok: false, reason: result.reason, message: messages[result.reason] };
  }

  // Notifications outside the transaction so a mail failure doesn't roll back the award.
  try {
    await notifyAuctionAward({
      repoVehicleId: input.repoVehicleId,
      winningBidId: input.bidId,
    });
  } catch (err) {
    console.error("[award] Notification/email failed after award:", err);
  }

  return { ok: true };
}
