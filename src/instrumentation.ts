export async function register() {
  // Only run the scheduler in the Node.js server runtime (not Edge).
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startAuctionCloser } = await import("@/lib/auction-close");
    startAuctionCloser();
  }
}
