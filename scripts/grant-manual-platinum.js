/**
 * Grant PLATINUM MANUAL to a dealer by email. Run in app container from /app.
 */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const EMAIL = process.argv[2] || "basicothers123@gmail.com";

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: EMAIL },
    include: { dealerProfile: true },
  });
  if (!user?.dealerProfile) {
    console.error(JSON.stringify({ ok: false, error: "Dealer not found", email: EMAIL }));
    process.exit(1);
  }

  const updated = await prisma.dealerProfile.update({
    where: { id: user.dealerProfile.id },
    data: {
      subscriptionStatus: "ACTIVE",
      subscriptionSource: "MANUAL",
      tier: "PLATINUM",
      currentPeriodEnd: null,
      stripeSubscriptionId: null,
      verified: true,
    },
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        email: EMAIL,
        businessName: updated.businessName,
        tier: updated.tier,
        status: updated.subscriptionStatus,
        source: updated.subscriptionSource,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
