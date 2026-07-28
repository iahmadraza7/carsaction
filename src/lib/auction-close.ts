import { prisma } from "@/lib/prisma";

/**
 * Flip OPEN auctions whose close time has passed to CLOSED.
 * Idempotent: already-closed rows are untouched (where status = OPEN).
 */
export async function closeExpiredAuctions(): Promise<number> {
  const result = await prisma.repoVehicle.updateMany({
    where: {
      status: "OPEN",
      biddingClosesAt: { lte: new Date() },
    },
    data: { status: "CLOSED" },
  });
  return result.count;
}

/**
 * Lazy close for a single vehicle (belt and braces on read paths).
 * Returns the effective status after the check.
 */
export async function ensureVehicleClosedIfExpired(
  vehicleId: string,
): Promise<"OPEN" | "CLOSED" | "AWARDED" | "CANCELLED" | null> {
  const vehicle = await prisma.repoVehicle.findUnique({
    where: { id: vehicleId },
    select: { status: true, biddingClosesAt: true },
  });
  if (!vehicle) return null;

  if (vehicle.status === "OPEN" && vehicle.biddingClosesAt <= new Date()) {
    await prisma.repoVehicle.updateMany({
      where: {
        id: vehicleId,
        status: "OPEN",
        biddingClosesAt: { lte: new Date() },
      },
      data: { status: "CLOSED" },
    });
    return "CLOSED";
  }

  return vehicle.status;
}

let started = false;
let tickInFlight = false;

/**
 * Start the in-process auction closer. Safe across hot reloads / duplicate
 * register() calls via the module-level `started` flag. Overlapping ticks
 * are skipped via `tickInFlight`.
 */
export function startAuctionCloser(): void {
  if (started) return;
  started = true;

  const tick = async () => {
    if (tickInFlight) return;
    tickInFlight = true;
    try {
      const n = await closeExpiredAuctions();
      if (n > 0) {
        console.log(`[auction-closer] Closed ${n} auction${n === 1 ? "" : "s"}`);
      }
    } catch (err) {
      console.error("[auction-closer] Tick failed:", err);
    } finally {
      tickInFlight = false;
    }
  };

  void tick();
  setInterval(() => {
    void tick();
  }, 60_000);
}
