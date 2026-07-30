/**
 * Client feedback seed: macydealer account, owners backfill, sample sales contacts.
 * Run on VPS:
 *   docker cp scripts/seed-client-feedback.js carsaction-app:/tmp/seed-client-feedback.js
 *   docker compose -p carsaction -f docker-compose.prod.yml exec -T app node /tmp/seed-client-feedback.js
 */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const MACY_EMAIL = "macydealer@carsaction.sg";
const MACY_PASSWORD = "MacyDealer2026!";
// Precomputed bcrypt — bcryptjs is not available in the production image.
const MACY_PASSWORD_HASH =
  "$2b$10$Mk5QB9k2iv4GdyZqJlOxlO2KUr.8oy/NA/RoOVmxy5GAzbQ1ZWa0W";

async function main() {
  const passwordHash = MACY_PASSWORD_HASH;

  const user = await prisma.user.upsert({
    where: { email: MACY_EMAIL },
    create: {
      email: MACY_EMAIL,
      name: "Macy Dealer",
      role: "DEALER",
      passwordHash,
      emailVerified: new Date(),
    },
    update: {
      role: "DEALER",
      passwordHash,
      emailVerified: new Date(),
    },
  });

  const profile = await prisma.dealerProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      businessName: "Macy Test Motors",
      uen: "202601234A",
      address: "123 Ubi Avenue 1, Singapore 408934",
      whatsappNumber: "+65 9123 8800",
      verified: true,
      subscriptionStatus: "ACTIVE",
      tier: "PLATINUM",
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
    update: {
      businessName: "Macy Test Motors",
      uen: "202601234A",
      address: "123 Ubi Avenue 1, Singapore 408934",
      whatsappNumber: "+65 9123 8800",
      verified: true,
      subscriptionStatus: "ACTIVE",
      tier: "PLATINUM",
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });

  const existingContacts = await prisma.dealerContact.count({
    where: { dealerId: profile.id },
  });
  if (existingContacts === 0) {
    await prisma.dealerContact.createMany({
      data: [
        {
          dealerId: profile.id,
          name: "Macy Chen",
          phone: "+65 9123 8801",
          whatsappEnabled: true,
          order: 0,
        },
        {
          dealerId: profile.id,
          name: "Jason Lim",
          phone: "+65 9123 8802",
          whatsappEnabled: true,
          order: 1,
        },
      ],
    });
  }

  // Backfill owners on showcase listings (and any FOR_SALE missing owners).
  const showcase = await prisma.user.findUnique({
    where: { email: "showcase@carsaction.sg" },
    include: { dealerProfile: true },
  });

  let ownersUpdated = 0;
  if (showcase?.dealerProfile) {
    const listings = await prisma.listing.findMany({
      where: { dealerId: showcase.dealerProfile.id },
      select: { id: true, owners: true },
      orderBy: { createdAt: "asc" },
    });
    const values = [1, 2, 1, 3, 2, 1, 2, 1, 3, 2, 1, 2, 1, 2, 3];
    for (let i = 0; i < listings.length; i++) {
      const owners = values[i % values.length];
      await prisma.listing.update({
        where: { id: listings[i].id },
        data: { owners },
      });
      ownersUpdated++;
    }

    // Sample sales contacts for showcase seller block.
    const scCount = await prisma.dealerContact.count({
      where: { dealerId: showcase.dealerProfile.id },
    });
    if (scCount === 0) {
      await prisma.dealerContact.createMany({
        data: [
          {
            dealerId: showcase.dealerProfile.id,
            name: "Wei Ming",
            phone: "+65 8888 1001",
            whatsappEnabled: true,
            order: 0,
          },
          {
            dealerId: showcase.dealerProfile.id,
            name: "Sarah Ong",
            phone: "+65 8888 1002",
            whatsappEnabled: true,
            order: 1,
          },
          {
            dealerId: showcase.dealerProfile.id,
            name: "Daniel Koh",
            phone: "+65 8888 1003",
            whatsappEnabled: false,
            order: 2,
          },
        ],
      });
      // Ensure showcase has a showroom address for the seller block.
      if (!showcase.dealerProfile.address) {
        await prisma.dealerProfile.update({
          where: { id: showcase.dealerProfile.id },
          data: { address: "45 Kallang Place, Singapore 339173" },
        });
      }
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        macyDealer: {
          email: MACY_EMAIL,
          password: MACY_PASSWORD,
          dealerId: profile.id,
          tier: "PLATINUM",
          subscriptionStatus: "ACTIVE",
        },
        ownersUpdated,
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
