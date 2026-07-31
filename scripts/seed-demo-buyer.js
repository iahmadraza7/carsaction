/**
 * Create demo buyer + shortlist a few FOR_SALE listings.
 * Password: DemoBuyer2026!
 */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const EMAIL = "demobuyer@carsaction.sg";
const PASSWORD = "DemoBuyer2026!";
const HASH = "$2b$10$INw7bnvtPOXB7e0ypLHyMuUOFfeak3GNeGHt/yzN.hoNPjEPqs2ai";

async function main() {
  const passwordHash = HASH;

  const user = await prisma.user.upsert({
    where: { email: EMAIL },
    create: {
      email: EMAIL,
      name: "Demo Buyer",
      role: "BUYER",
      passwordHash,
      emailVerified: new Date(),
    },
    update: {
      role: "BUYER",
      passwordHash,
      suspended: false,
      name: "Demo Buyer",
    },
  });

  const listings = await prisma.listing.findMany({
    where: { status: "FOR_SALE" },
    orderBy: { createdAt: "desc" },
    take: 4,
    select: { id: true, title: true },
  });

  await prisma.favourite.deleteMany({ where: { userId: user.id } });
  for (const l of listings) {
    await prisma.favourite.create({
      data: { userId: user.id, listingId: l.id },
    });
  }

  const favs = await prisma.favourite.findMany({
    where: { userId: user.id },
    include: { listing: { select: { title: true } } },
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        email: EMAIL,
        password: PASSWORD,
        shortlisted: favs.map((f) => f.listing.title),
        favouritesUrl: "https://carsaction.sg/favourites",
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
