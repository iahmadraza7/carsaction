import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { ensureVehicleClosedIfExpired } from "@/lib/auction-close";

export type AuctionWindowError =
  | "NOT_FOUND"
  | "NOT_OPEN"
  | "NOT_STARTED"
  | "CLOSED";

/** Server-side auction window check. Never trust the UI countdown. */
export function auctionWindowStatus(
  vehicle: {
    status: string;
    biddingOpensAt: Date;
    biddingClosesAt: Date;
  },
  now: Date = new Date(),
): { ok: true } | { ok: false; reason: AuctionWindowError } {
  // Treat past-deadline OPEN rows as closed even before the cron flips status.
  if (vehicle.status === "OPEN" && now >= vehicle.biddingClosesAt) {
    return { ok: false, reason: "CLOSED" };
  }
  if (vehicle.status !== "OPEN") {
    return { ok: false, reason: "NOT_OPEN" };
  }
  if (now < vehicle.biddingOpensAt) {
    return { ok: false, reason: "NOT_STARTED" };
  }
  return { ok: true };
}

export function auctionWindowMessage(reason: AuctionWindowError): string {
  switch (reason) {
    case "NOT_FOUND":
      return "Vehicle not found";
    case "NOT_OPEN":
      return "This auction is not open for bidding";
    case "NOT_STARTED":
      return "Bidding has not opened yet";
    case "CLOSED":
      return "Bidding has closed for this auction";
  }
}

/**
 * Place or update a dealer's sealed bid. Transactional: locks the vehicle row
 * and re-checks the auction window inside the transaction so an in-flight
 * request cannot land after close. Always writes a BidHistory row.
 *
 * dealerId is the User.id of the DEALER (schema Bid.dealer → User).
 */
export async function placeOrUpdateBid(input: {
  repoVehicleId: string;
  dealerUserId: string;
  amount: Prisma.Decimal;
}): Promise<
  | { ok: true; bidId: string; created: boolean }
  | { ok: false; reason: AuctionWindowError | "FORBIDDEN"; message: string }
> {
  // Lazy close before attempting a bid (belt and braces with the cron).
  await ensureVehicleClosedIfExpired(input.repoVehicleId);

  const result = await prisma.$transaction(async (tx) => {
    // Lock the vehicle row so concurrent cancel cannot race past the window check.
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
        biddingOpensAt: true,
        biddingClosesAt: true,
      },
    });
    if (!vehicle) {
      return { ok: false as const, reason: "NOT_FOUND" as const };
    }

    // Flip to CLOSED inside the lock if the deadline passed.
    const now = new Date();
    if (vehicle.status === "OPEN" && vehicle.biddingClosesAt <= now) {
      await tx.repoVehicle.update({
        where: { id: vehicle.id },
        data: { status: "CLOSED" },
      });
      return { ok: false as const, reason: "CLOSED" as const };
    }

    const window = auctionWindowStatus(vehicle, now);
    if (!window.ok) {
      return { ok: false as const, reason: window.reason };
    }

    const existing = await tx.bid.findUnique({
      where: {
        repoVehicleId_dealerId: {
          repoVehicleId: input.repoVehicleId,
          dealerId: input.dealerUserId,
        },
      },
      select: { id: true },
    });

    const bid = await tx.bid.upsert({
      where: {
        repoVehicleId_dealerId: {
          repoVehicleId: input.repoVehicleId,
          dealerId: input.dealerUserId,
        },
      },
      create: {
        repoVehicleId: input.repoVehicleId,
        dealerId: input.dealerUserId,
        amount: input.amount,
      },
      update: { amount: input.amount },
      select: { id: true },
    });

    await tx.bidHistory.create({
      data: { bidId: bid.id, amount: input.amount },
    });

    return {
      ok: true as const,
      bidId: bid.id,
      created: !existing,
    };
  });

  if (!result.ok) {
    return {
      ok: false,
      reason: result.reason,
      message: auctionWindowMessage(result.reason),
    };
  }
  return result;
}

/**
 * Load a dealer's own bid + history for a vehicle. Never returns other dealers' bids.
 */
export async function getOwnBidForVehicle(repoVehicleId: string, dealerUserId: string) {
  return prisma.bid.findUnique({
    where: {
      repoVehicleId_dealerId: {
        repoVehicleId,
        dealerId: dealerUserId,
      },
    },
    select: {
      id: true,
      amount: true,
      createdAt: true,
      updatedAt: true,
      history: {
        orderBy: { changedAt: "desc" },
        select: { id: true, amount: true, changedAt: true },
      },
    },
  });
}
