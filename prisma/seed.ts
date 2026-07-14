/**
 * CARSaction database seed.
 *
 * Seeds:
 *  - 1 admin user
 *  - 2 dealer users (one GOLD active subscription, one with no subscription)
 *  - 1 buyer user
 *  - 8 realistic Singapore car listings (SGD prices, COE / depreciation / OMV / ARF filled in)
 *  - 2 subscription plans: GOLD (SGD 99, limit 10) and PLATINUM (SGD 149, unlimited)
 *
 * Idempotent: safe to run repeatedly. Money values are passed as strings so they land
 * in Postgres numeric/Decimal columns exactly, never via float.
 *
 * All seeded accounts share the password: Password123!
 */
import {
  PrismaClient,
  Role,
  SubStatus,
  Tier,
  BodyType,
  FuelType,
  Transmission,
  ListingStatus,
  Prisma,
} from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const SEED_PASSWORD = "Password123!";

/** Helper: a date `years` from now (COE expiry style). */
function yearsFromNow(years: number): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() + years);
  return d;
}

/** Helper: 1st Jan of a registration year. */
function regDate(year: number): Date {
  return new Date(Date.UTC(year, 2, 15)); // mid-March, arbitrary but stable
}

async function main() {
  console.log("Seeding CARSaction database...");

  const passwordHash = await hash(SEED_PASSWORD, 10);

  // ---------------------------------------------------------------------------
  // Clean listing-related data so re-seeding is idempotent (child tables first).
  // ---------------------------------------------------------------------------
  await prisma.favourite.deleteMany();
  await prisma.enquiry.deleteMany();
  await prisma.listingImage.deleteMany();
  await prisma.listing.deleteMany();

  // ---------------------------------------------------------------------------
  // Users
  // ---------------------------------------------------------------------------
  const admin = await prisma.user.upsert({
    where: { email: "admin@carsaction.sg" },
    update: { name: "CARSaction Admin", role: Role.ADMIN, passwordHash, phone: "+6560000000" },
    create: {
      email: "admin@carsaction.sg",
      name: "CARSaction Admin",
      role: Role.ADMIN,
      phone: "+6560000000",
      passwordHash,
    },
  });

  const dealerUser1 = await prisma.user.upsert({
    where: { email: "dealer1@carsaction.sg" },
    update: { name: "Marcus Tan", role: Role.DEALER, passwordHash, phone: "+6591234567" },
    create: {
      email: "dealer1@carsaction.sg",
      name: "Marcus Tan",
      role: Role.DEALER,
      phone: "+6591234567",
      passwordHash,
    },
  });

  const dealerUser2 = await prisma.user.upsert({
    where: { email: "dealer2@carsaction.sg" },
    update: { name: "Siti Rahman", role: Role.DEALER, passwordHash, phone: "+6598765432" },
    create: {
      email: "dealer2@carsaction.sg",
      name: "Siti Rahman",
      role: Role.DEALER,
      phone: "+6598765432",
      passwordHash,
    },
  });

  const buyer = await prisma.user.upsert({
    where: { email: "buyer@carsaction.sg" },
    update: { name: "Jonathan Lee", role: Role.BUYER, passwordHash, phone: "+6581112222" },
    create: {
      email: "buyer@carsaction.sg",
      name: "Jonathan Lee",
      role: Role.BUYER,
      phone: "+6581112222",
      passwordHash,
    },
  });

  // ---------------------------------------------------------------------------
  // Dealer profiles
  //  - dealer1: GOLD, ACTIVE subscription, verified
  //  - dealer2: no subscription (NONE), unverified
  // ---------------------------------------------------------------------------
  const dealer1 = await prisma.dealerProfile.upsert({
    where: { userId: dealerUser1.id },
    update: {},
    create: {
      userId: dealerUser1.id,
      businessName: "Prestige Auto Pte Ltd",
      uen: "201812345A",
      address: "10 Ubi Ave 3, #01-22, Vertex, Singapore 408868",
      whatsappNumber: "+6591234567",
      verified: true,
      subscriptionStatus: SubStatus.ACTIVE,
      tier: Tier.GOLD,
      stripeCustomerId: "cus_seed_dealer1",
      stripeSubscriptionId: "sub_seed_dealer1",
      currentPeriodEnd: yearsFromNow(0.08), // ~1 month out
    },
  });

  const dealer2 = await prisma.dealerProfile.upsert({
    where: { userId: dealerUser2.id },
    update: {},
    create: {
      userId: dealerUser2.id,
      businessName: "Sunrise Motors",
      uen: "202056789B",
      address: "45 Kaki Bukit Rd 4, Singapore 417804",
      whatsappNumber: "+6598765432",
      verified: false,
      subscriptionStatus: SubStatus.NONE,
      tier: null,
    },
  });

  // ---------------------------------------------------------------------------
  // Subscription plans (admin configurable)
  // ---------------------------------------------------------------------------
  await prisma.subscriptionPlan.upsert({
    where: { tier: Tier.GOLD },
    update: {
      name: "Gold",
      monthlyPrice: new Prisma.Decimal("99.00"),
      listingLimit: 10,
      stripePriceId: process.env.STRIPE_PRICE_GOLD || "price_gold_placeholder",
      active: true,
    },
    create: {
      tier: Tier.GOLD,
      name: "Gold",
      monthlyPrice: new Prisma.Decimal("99.00"),
      listingLimit: 10,
      stripePriceId: process.env.STRIPE_PRICE_GOLD || "price_gold_placeholder",
      active: true,
    },
  });

  await prisma.subscriptionPlan.upsert({
    where: { tier: Tier.PLATINUM },
    update: {
      name: "Platinum",
      monthlyPrice: new Prisma.Decimal("149.00"),
      listingLimit: null, // unlimited
      stripePriceId: process.env.STRIPE_PRICE_PLATINUM || "price_platinum_placeholder",
      active: true,
    },
    create: {
      tier: Tier.PLATINUM,
      name: "Platinum",
      monthlyPrice: new Prisma.Decimal("149.00"),
      listingLimit: null,
      stripePriceId: process.env.STRIPE_PRICE_PLATINUM || "price_platinum_placeholder",
      active: true,
    },
  });

  // ---------------------------------------------------------------------------
  // Listings — realistic Singapore used-car inventory.
  // Money fields are strings -> Decimal. COE, depreciation, OMV, ARF are standard SG fields.
  // ---------------------------------------------------------------------------
  type SeedListing = {
    dealerId: string;
    title: string;
    make: string;
    model: string;
    variant?: string;
    year: number;
    price: string;
    mileage: number;
    bodyType: BodyType;
    fuelType: FuelType;
    transmission: Transmission;
    engineCc?: number;
    colour: string;
    regYear: number;
    coeExpiryYears: number;
    depreciation: string;
    omv: string;
    arf: string;
    description: string;
    images: string[];
  };

  const listings: SeedListing[] = [
    {
      dealerId: dealer1.id,
      title: "Toyota Corolla Altis 1.6 Elegance",
      make: "Toyota",
      model: "Corolla Altis",
      variant: "1.6 Elegance",
      year: 2019,
      price: "78800.00",
      mileage: 68000,
      bodyType: BodyType.SEDAN,
      fuelType: FuelType.PETROL,
      transmission: Transmission.AUTO,
      engineCc: 1598,
      colour: "Silver",
      regYear: 2019,
      coeExpiryYears: 3,
      depreciation: "11200.00",
      omv: "18500.00",
      arf: "18500.00",
      description:
        "Well-maintained Corolla Altis with full agent service history. Fuel efficient, reliable and cheap to run. One owner, non-accident.",
      images: [
        "https://picsum.photos/seed/altis-1/1200/800",
        "https://picsum.photos/seed/altis-2/1200/800",
      ],
    },
    {
      dealerId: dealer1.id,
      title: "Honda Vezel 1.5 Hybrid X",
      make: "Honda",
      model: "Vezel",
      variant: "1.5 Hybrid X",
      year: 2020,
      price: "104800.00",
      mileage: 52000,
      bodyType: BodyType.SUV,
      fuelType: FuelType.HYBRID,
      transmission: Transmission.AUTO,
      engineCc: 1496,
      colour: "White Pearl",
      regYear: 2020,
      coeExpiryYears: 4,
      depreciation: "13800.00",
      omv: "22100.00",
      arf: "24300.00",
      description:
        "Popular hybrid compact SUV. Excellent fuel economy, spacious boot, keyless entry, reverse camera. Ideal family car.",
      images: [
        "https://picsum.photos/seed/vezel-1/1200/800",
        "https://picsum.photos/seed/vezel-2/1200/800",
      ],
    },
    {
      dealerId: dealer1.id,
      title: "Mazda 3 1.5 Hatchback Astina",
      make: "Mazda",
      model: "Mazda3",
      variant: "1.5 Astina",
      year: 2018,
      price: "72800.00",
      mileage: 74000,
      bodyType: BodyType.HATCHBACK,
      fuelType: FuelType.PETROL,
      transmission: Transmission.AUTO,
      engineCc: 1496,
      colour: "Soul Red",
      regYear: 2018,
      coeExpiryYears: 2,
      depreciation: "10600.00",
      omv: "19800.00",
      arf: "19800.00",
      description:
        "Sporty and stylish hatchback with SkyActiv technology. Leather seats, sunroof, heads-up display. A joy to drive.",
      images: [
        "https://picsum.photos/seed/mazda3-1/1200/800",
        "https://picsum.photos/seed/mazda3-2/1200/800",
      ],
    },
    {
      dealerId: dealer1.id,
      title: "Toyota Camry 2.5 Elegance",
      make: "Toyota",
      model: "Camry",
      variant: "2.5 Elegance",
      year: 2021,
      price: "142800.00",
      mileage: 41000,
      bodyType: BodyType.SEDAN,
      fuelType: FuelType.PETROL,
      transmission: Transmission.AUTO,
      engineCc: 2487,
      colour: "Black",
      regYear: 2021,
      coeExpiryYears: 5,
      depreciation: "16400.00",
      omv: "30200.00",
      arf: "38300.00",
      description:
        "Executive sedan in pristine condition. Full leather interior, powered seats, adaptive cruise control, Toyota Safety Sense.",
      images: [
        "https://picsum.photos/seed/camry-1/1200/800",
        "https://picsum.photos/seed/camry-2/1200/800",
      ],
    },
    {
      dealerId: dealer1.id,
      title: "Tesla Model 3 Standard Range Plus",
      make: "Tesla",
      model: "Model 3",
      variant: "Standard Range Plus",
      year: 2022,
      price: "168800.00",
      mileage: 33000,
      bodyType: BodyType.SEDAN,
      fuelType: FuelType.ELECTRIC,
      transmission: Transmission.AUTO,
      colour: "Midnight Silver",
      regYear: 2022,
      coeExpiryYears: 6,
      depreciation: "19800.00",
      omv: "42800.00",
      arf: "58600.00",
      description:
        "Fully electric with Autopilot. Low mileage, glass roof, premium connectivity. Zero road tax savings and instant torque.",
      images: [
        "https://picsum.photos/seed/model3-1/1200/800",
        "https://picsum.photos/seed/model3-2/1200/800",
      ],
    },
    {
      dealerId: dealer1.id,
      title: "Toyota Sienta 1.5 Hybrid",
      make: "Toyota",
      model: "Sienta",
      variant: "1.5 Hybrid",
      year: 2018,
      price: "76800.00",
      mileage: 89000,
      bodyType: BodyType.MPV,
      fuelType: FuelType.HYBRID,
      transmission: Transmission.AUTO,
      engineCc: 1496,
      colour: "Orange",
      regYear: 2018,
      coeExpiryYears: 2,
      depreciation: "11900.00",
      omv: "20400.00",
      arf: "20400.00",
      description:
        "Compact 7-seater MPV with dual power sliding doors. Perfect for growing families. Hybrid fuel savings for daily commutes.",
      images: [
        "https://picsum.photos/seed/sienta-1/1200/800",
        "https://picsum.photos/seed/sienta-2/1200/800",
      ],
    },
    {
      dealerId: dealer2.id,
      title: "BMW 320i Sport",
      make: "BMW",
      model: "3 Series",
      variant: "320i Sport",
      year: 2020,
      price: "158800.00",
      mileage: 58000,
      bodyType: BodyType.SEDAN,
      fuelType: FuelType.PETROL,
      transmission: Transmission.AUTO,
      engineCc: 1998,
      colour: "Mineral Grey",
      regYear: 2020,
      coeExpiryYears: 4,
      depreciation: "18600.00",
      omv: "34500.00",
      arf: "44650.00",
      description:
        "Sport line with M Sport steering, sport seats and LED headlights. Well kept, agent maintained. A true driver's sedan.",
      images: [
        "https://picsum.photos/seed/bmw320-1/1200/800",
        "https://picsum.photos/seed/bmw320-2/1200/800",
      ],
    },
    {
      dealerId: dealer2.id,
      title: "Mercedes-Benz C180 Avantgarde",
      make: "Mercedes-Benz",
      model: "C-Class",
      variant: "C180 Avantgarde",
      year: 2019,
      price: "146800.00",
      mileage: 63000,
      bodyType: BodyType.SEDAN,
      fuelType: FuelType.PETROL,
      transmission: Transmission.AUTO,
      engineCc: 1497,
      colour: "Obsidian Black",
      regYear: 2019,
      coeExpiryYears: 3,
      depreciation: "17300.00",
      omv: "33100.00",
      arf: "42340.00",
      description:
        "Elegant Avantgarde trim with Artico leather, LED High Performance headlamps and reverse camera. Beautiful condition.",
      images: [
        "https://picsum.photos/seed/c180-1/1200/800",
        "https://picsum.photos/seed/c180-2/1200/800",
      ],
    },
  ];

  for (const l of listings) {
    await prisma.listing.create({
      data: {
        dealerId: l.dealerId,
        title: l.title,
        make: l.make,
        model: l.model,
        variant: l.variant ?? null,
        year: l.year,
        price: new Prisma.Decimal(l.price),
        mileage: l.mileage,
        bodyType: l.bodyType,
        fuelType: l.fuelType,
        transmission: l.transmission,
        engineCc: l.engineCc ?? null,
        colour: l.colour,
        regDate: regDate(l.regYear),
        coeExpiry: yearsFromNow(l.coeExpiryYears),
        depreciation: new Prisma.Decimal(l.depreciation),
        omv: new Prisma.Decimal(l.omv),
        arf: new Prisma.Decimal(l.arf),
        description: l.description,
        status: ListingStatus.FOR_SALE,
        images: {
          create: l.images.map((url, index) => ({ url, order: index })),
        },
      },
    });
  }

  // ---------------------------------------------------------------------------
  // A couple of enquiries + a favourite, so dealer/buyer dashboards have data later.
  // ---------------------------------------------------------------------------
  const firstListing = await prisma.listing.findFirstOrThrow({
    where: { dealerId: dealer1.id },
    orderBy: { createdAt: "asc" },
  });

  await prisma.enquiry.create({
    data: {
      listingId: firstListing.id,
      buyerId: buyer.id,
      name: buyer.name,
      phone: buyer.phone ?? "+6581112222",
      message: "Hi, is this car still available? Can I view it this weekend?",
    },
  });

  await prisma.enquiry.create({
    data: {
      listingId: firstListing.id,
      name: "Guest Enquirer",
      phone: "+6583334444",
      message: "What is the lowest price you can offer?",
    },
  });

  await prisma.favourite.create({
    data: { userId: buyer.id, listingId: firstListing.id },
  });

  const counts = {
    users: await prisma.user.count(),
    dealerProfiles: await prisma.dealerProfile.count(),
    listings: await prisma.listing.count(),
    listingImages: await prisma.listingImage.count(),
    subscriptionPlans: await prisma.subscriptionPlan.count(),
    enquiries: await prisma.enquiry.count(),
    favourites: await prisma.favourite.count(),
  };

  console.log("Seed complete:", counts);
  console.log(`All accounts use password: ${SEED_PASSWORD}`);
  console.log("Admin:  admin@carsaction.sg");
  console.log("Dealer: dealer1@carsaction.sg (GOLD, active)");
  console.log("Dealer: dealer2@carsaction.sg (no subscription)");
  console.log("Buyer:  buyer@carsaction.sg");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
