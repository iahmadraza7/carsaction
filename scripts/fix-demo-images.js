/**
 * Fix mismatched Unsplash photos on showcase listings + demo repo vehicles.
 * Run in app container: node /app/fix-demo-images.js
 */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function img(id) {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1600&q=80`;
}

/** Plausible make/model/body photos (verified Unsplash car subjects). */
const BY_KEY = {
  "Toyota|Corolla Altis": [img("1621007947382-bb3c3994e3fb"), img("1492144534655-ae79c964c9d7")],
  "Toyota|Camry": [img("1621007947382-bb3c3994e3fb"), img("1492144534655-ae79c964c9d7")],
  "Honda|Vezel": [img("1533473359331-0135ef1b58bf"), img("1606664515524-ed2f786a0bd6")],
  "Honda|Civic": [img("1609521263047-f8f205293f24"), img("1552519507-da3b142c6e3d")],
  "Mazda|Mazda3": [img("1552519507-da3b142c6e3d"), img("1471444928139-48c5bf5173f8")],
  "Mazda|CX-5": [img("1519641471654-76ce0107ad1b"), img("1533473359331-0135ef1b58bf")],
  "Tesla|Model 3": [img("1560958089-b8a1929cea89"), img("1593941707882-a5bba14938c7")],
  "Toyota|Sienta": [img("1464219789935-c2d9d9aba644"), img("1609521263047-f8f205293f24")],
  "BMW|3 Series": [img("1555215695-3004980ad54e"), img("1580273916550-e323be2ae537")],
  "BMW|X3": [img("1555215695-3004980ad54e"), img("1519641471654-76ce0107ad1b")],
  "Mercedes-Benz|C-Class": [img("1618843479313-40f8afb4b4d8"), img("1503376780353-7e6692767b70")],
  "Nissan|Qashqai": [img("1606664515524-ed2f786a0bd6"), img("1519641471654-76ce0107ad1b")],
  "Hyundai|Tucson": [img("1617814076367-b759c7d7e738"), img("1519641471654-76ce0107ad1b")],
  "Volkswagen|Golf": [img("1471444928139-48c5bf5173f8"), img("1552519507-da3b142c6e3d")],
  "BYD|Atto 3": [img("1593941707882-a5bba14938c7"), img("1560958089-b8a1929cea89")],
  "Lexus|NX": [img("1549399542-7e3f8b79c649"), img("1606664515524-ed2f786a0bd6")],
};

function key(make, model) {
  return `${make}|${model}`;
}

async function replaceListingImages(listingId, urls) {
  await prisma.listingImage.deleteMany({ where: { listingId } });
  await prisma.listingImage.createMany({
    data: urls.map((url, order) => ({ listingId, url, order })),
  });
}

async function replaceRepoImages(repoVehicleId, urls) {
  await prisma.repoImage.deleteMany({ where: { repoVehicleId } });
  await prisma.repoImage.createMany({
    data: urls.map((url, order) => ({ repoVehicleId, url, order })),
  });
}

async function main() {
  const showcase = await prisma.user.findUnique({
    where: { email: "showcase@carsaction.sg" },
    include: { dealerProfile: true },
  });
  if (!showcase?.dealerProfile) throw new Error("showcase dealer missing");

  const listings = await prisma.listing.findMany({
    where: { dealerId: showcase.dealerProfile.id },
    select: { id: true, make: true, model: true, title: true },
    orderBy: { createdAt: "asc" },
  });

  const listingResults = [];
  for (const l of listings) {
    const urls = BY_KEY[key(l.make, l.model)];
    if (!urls) {
      listingResults.push({ title: l.title, ok: false, reason: "no mapping" });
      continue;
    }
    await replaceListingImages(l.id, urls);
    listingResults.push({ title: l.title, ok: true, urls });
  }

  const repos = await prisma.repoVehicle.findMany({
    where: {
      OR: [
        { description: { startsWith: "[DEMO]" } },
        { description: { startsWith: "[LIVE-AWARD-TEST]" } },
        { condition: { startsWith: "[LIVE-AWARD-TEST]" } },
      ],
    },
    select: { id: true, make: true, model: true, year: true },
  });

  const repoResults = [];
  for (const v of repos) {
    const urls = BY_KEY[key(v.make, v.model)];
    if (!urls) {
      // Fallback by body-ish defaults
      const fallback = [img("1621007947382-bb3c3994e3fb"), img("1519641471654-76ce0107ad1b")];
      await replaceRepoImages(v.id, fallback);
      repoResults.push({ vehicle: `${v.year} ${v.make} ${v.model}`, ok: true, fallback: true });
      continue;
    }
    await replaceRepoImages(v.id, urls);
    repoResults.push({ vehicle: `${v.year} ${v.make} ${v.model}`, ok: true, urls });
  }

  console.log(
    JSON.stringify(
      {
        listingsUpdated: listingResults.filter((r) => r.ok).length,
        listingsTotal: listings.length,
        listingResults,
        reposUpdated: repoResults.filter((r) => r.ok).length,
        reposTotal: repos.length,
        repoResults,
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
