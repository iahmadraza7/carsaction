import { prisma } from "@/lib/prisma";
import { sendAuctionWonEmail } from "@/lib/mail";

export async function createNotification(input: {
  userId: string;
  title: string;
  body: string;
  href?: string;
}) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      title: input.title,
      body: input.body,
      href: input.href,
    },
  });
}

/**
 * After an auction is awarded: notify winner (in-app + email), losers (in-app),
 * and the finance company (in-app). No amounts in loser messages.
 */
export async function notifyAuctionAward(input: {
  repoVehicleId: string;
  winningBidId: string;
}) {
  const vehicle = await prisma.repoVehicle.findUnique({
    where: { id: input.repoVehicleId },
    select: {
      id: true,
      make: true,
      model: true,
      year: true,
      financeCo: {
        select: {
          companyName: true,
          contactPerson: true,
          user: { select: { id: true, email: true, name: true, phone: true } },
        },
      },
      bids: {
        select: {
          id: true,
          dealerId: true,
          dealer: { select: { id: true, email: true, name: true } },
        },
      },
      winningBid: {
        select: {
          id: true,
          amount: true,
          dealer: { select: { id: true, email: true, name: true } },
        },
      },
    },
  });

  if (!vehicle || !vehicle.winningBid) return;

  const title = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  const auctionHref = `/auctions/${vehicle.id}`;
  const finance = vehicle.financeCo;
  const winner = vehicle.winningBid.dealer;

  // Winner — in-app
  await createNotification({
    userId: winner.id,
    title: "You won the auction",
    body: `You won the bid for ${title}. Contact ${finance.companyName} to complete the deal.`,
    href: auctionHref,
  });

  // Winner — email (falls back to console if RESEND_API_KEY unset)
  await sendAuctionWonEmail({
    to: winner.email,
    dealerName: winner.name,
    vehicleTitle: title,
    companyName: finance.companyName,
    contactPerson: finance.contactPerson,
    contactEmail: finance.user.email,
    contactPhone: finance.user.phone,
    auctionUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}${auctionHref}`,
  });

  // Losers — in-app only, no amounts
  const losers = vehicle.bids.filter((b) => b.id !== input.winningBidId);
  await Promise.all(
    losers.map((b) =>
      createNotification({
        userId: b.dealerId,
        title: "Auction concluded",
        body: `The auction for ${title} has concluded. Another dealer was awarded the vehicle.`,
        href: auctionHref,
      }),
    ),
  );

  // Finance company — in-app confirmation
  await createNotification({
    userId: finance.user.id,
    title: "Award confirmed",
    body: `You awarded ${title} to ${winner.name}.`,
    href: `/finance/vehicles/${vehicle.id}/bids`,
  });
}
