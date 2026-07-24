/**
 * Production catalogue seed — listings only.
 *
 * Creates/updates a single internal showcase dealer (not the old demo logins)
 * and 12 FOR_SALE Singapore listings with body-type-matched Unsplash photos.
 *
 * Does NOT create admin@/dealer1@/dealer2@/buyer@ accounts.
 *
 * Run: npx tsx prisma/seed-listings.ts
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
import { randomBytes } from "crypto";

const prisma = new PrismaClient();

const SHOWCASE_EMAIL = "showcase@carsaction.sg";

function yearsFromNow(years: number): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() + years);
  return d;
}

function regDate(year: number): Date {
  return new Date(Date.UTC(year, 2, 15));
}

function img(id: string): string {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1600&q=80`;
}

type SeedListing = {
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

const CATALOGUE: SeedListing[] = [
  {
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
      "Well-maintained Corolla Altis with full agent service history. Fuel efficient and reliable. One owner.",
    images: [img("1773063250524-38ac5eebd3c5"), img("1751601396408-57c61df2ab6b")],
  },
  {
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
      "Popular hybrid compact SUV. Excellent fuel economy, spacious boot, reverse camera.",
    images: [img("1519641471654-76ce0107ad1b"), img("1533473359331-0135ef1b58bf")],
  },
  {
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
    description: "Sporty hatchback with SkyActiv tech. Leather seats and sunroof.",
    images: [img("1560282105-222992ffb774"), img("1630019499081-50ed7838a1cd")],
  },
  {
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
    description: "Executive sedan in pristine condition. Full leather, Toyota Safety Sense.",
    images: [img("1745100892350-d9bdf600aaa5"), img("1613507323749-df09c966f063")],
  },
  {
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
    description: "Fully electric with Autopilot. Low mileage, glass roof, premium connectivity.",
    images: [img("1566939901805-ea36bc6cfd60"), img("1492144534655-ae79c964c9d7")],
  },
  {
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
    description: "Compact 7-seater MPV with dual power sliding doors. Ideal for families.",
    images: [img("1776774853502-11e7a46252d8"), img("1771210341023-f0a59d711d6c")],
  },
  {
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
    description: "Sport line with M Sport steering and LED headlights. Agent maintained.",
    images: [img("1580273916550-e323be2ae537"), img("1503376780353-7e6692767b70")],
  },
  {
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
    description: "Elegant Avantgarde trim with Artico leather and reverse camera.",
    images: [img("1503376780353-7e6692767b70"), img("1613507323749-df09c966f063")],
  },
  {
    title: "Honda Civic 1.5 VTEC Turbo",
    make: "Honda",
    model: "Civic",
    variant: "1.5 Turbo",
    year: 2021,
    price: "128800.00",
    mileage: 39000,
    bodyType: BodyType.SEDAN,
    fuelType: FuelType.PETROL,
    transmission: Transmission.AUTO,
    engineCc: 1498,
    colour: "Rallye Red",
    regYear: 2021,
    coeExpiryYears: 5,
    depreciation: "15200.00",
    omv: "26800.00",
    arf: "32100.00",
    description: "Sharp turbo Civic with Honda Sensing. Low mileage, one careful owner.",
    images: [img("1552519507-da3b142c6e3d"), img("1745100892350-d9bdf600aaa5")],
  },
  {
    title: "Mazda CX-5 2.5 Deluxe",
    make: "Mazda",
    model: "CX-5",
    variant: "2.5 Deluxe",
    year: 2020,
    price: "118800.00",
    mileage: 55000,
    bodyType: BodyType.SUV,
    fuelType: FuelType.PETROL,
    transmission: Transmission.AUTO,
    engineCc: 2488,
    colour: "Machine Grey",
    regYear: 2020,
    coeExpiryYears: 4,
    depreciation: "14100.00",
    omv: "28900.00",
    arf: "34700.00",
    description: "Family SUV with Bose audio and i-Activsense safety suite.",
    images: [img("1533473359331-0135ef1b58bf"), img("1519641471654-76ce0107ad1b")],
  },
  {
    title: "Nissan Qashqai 1.2 DIG-T",
    make: "Nissan",
    model: "Qashqai",
    variant: "1.2 DIG-T",
    year: 2019,
    price: "89800.00",
    mileage: 71000,
    bodyType: BodyType.SUV,
    fuelType: FuelType.PETROL,
    transmission: Transmission.AUTO,
    engineCc: 1197,
    colour: "Pearl White",
    regYear: 2019,
    coeExpiryYears: 3,
    depreciation: "12500.00",
    omv: "21400.00",
    arf: "21400.00",
    description: "Compact crossover, easy to park, full service history.",
    images: [img("1606664515524-ed2f786a0bd6"), img("1533473359331-0135ef1b58bf")],
  },
  {
    title: "Hyundai Tucson 1.6 Turbo",
    make: "Hyundai",
    model: "Tucson",
    variant: "1.6 Turbo",
    year: 2022,
    price: "138800.00",
    mileage: 28000,
    bodyType: BodyType.SUV,
    fuelType: FuelType.PETROL,
    transmission: Transmission.AUTO,
    engineCc: 1598,
    colour: "Phantom Black",
    regYear: 2022,
    coeExpiryYears: 6,
    depreciation: "16200.00",
    omv: "31200.00",
    arf: "39800.00",
    description: "Latest-gen Tucson with panoramic roof and smart cruise.",
    images: [img("1519641471654-76ce0107ad1b"), img("1606664515524-ed2f786a0bd6")],
  },
  {
    title: "Volkswagen Golf 1.4 TSI",
    make: "Volkswagen",
    model: "Golf",
    variant: "1.4 TSI",
    year: 2018,
    price: "69800.00",
    mileage: 82000,
    bodyType: BodyType.HATCHBACK,
    fuelType: FuelType.PETROL,
    transmission: Transmission.AUTO,
    engineCc: 1395,
    colour: "Tornado Red",
    regYear: 2018,
    coeExpiryYears: 2,
    depreciation: "9800.00",
    omv: "19200.00",
    arf: "19200.00",
    description: "Classic Golf hatch. Tight chassis, DSG gearbox, city-friendly.",
    images: [img("1560282105-222992ffb774"), img("1630019499081-50ed7838a1cd")],
  },
  {
    title: "BYD Atto 3 Extended",
    make: "BYD",
    model: "Atto 3",
    variant: "Extended",
    year: 2023,
    price: "148800.00",
    mileage: 18000,
    bodyType: BodyType.SUV,
    fuelType: FuelType.ELECTRIC,
    transmission: Transmission.AUTO,
    colour: "Surf Blue",
    regYear: 2023,
    coeExpiryYears: 7,
    depreciation: "17500.00",
    omv: "35600.00",
    arf: "45200.00",
    description: "Popular EV crossover with long range and rotating touchscreen.",
    images: [img("1566939901805-ea36bc6cfd60"), img("1492144534655-ae79c964c9d7")],
  },
  {
    title: "Lexus NX 300h",
    make: "Lexus",
    model: "NX",
    variant: "300h",
    year: 2020,
    price: "178800.00",
    mileage: 47000,
    bodyType: BodyType.SUV,
    fuelType: FuelType.HYBRID,
    transmission: Transmission.AUTO,
    engineCc: 2494,
    colour: "Sonic White",
    regYear: 2020,
    coeExpiryYears: 4,
    depreciation: "20100.00",
    omv: "41200.00",
    arf: "55800.00",
    description: "Premium hybrid SUV. Quiet cabin, Mark Levinson audio option.",
    images: [img("1606664515524-ed2f786a0bd6"), img("1519641471654-76ce0107ad1b")],
  },
];

async function main() {
  console.log("Seeding production catalogue listings...");

  // Internal showcase dealer required for Listing.dealerId FK.
  // Not one of the deleted demo accounts (admin@/dealer1@/dealer2@/buyer@).
  const passwordHash = await hash(randomBytes(24).toString("base64url"), 10);
  const user = await prisma.user.upsert({
    where: { email: SHOWCASE_EMAIL },
    update: {
      name: "CARSaction Showcase",
      role: Role.DEALER,
      phone: "+6590000000",
    },
    create: {
      email: SHOWCASE_EMAIL,
      name: "CARSaction Showcase",
      role: Role.DEALER,
      phone: "+6590000000",
      passwordHash,
    },
  });

  const dealer = await prisma.dealerProfile.upsert({
    where: { userId: user.id },
    update: {
      businessName: "CARSaction Showcase Motors",
      uen: "202400001A",
      address: "Singapore",
      whatsappNumber: "+6590000000",
      verified: true,
      subscriptionStatus: SubStatus.ACTIVE,
      tier: Tier.PLATINUM,
      currentPeriodEnd: yearsFromNow(1),
    },
    create: {
      userId: user.id,
      businessName: "CARSaction Showcase Motors",
      uen: "202400001A",
      address: "Singapore",
      whatsappNumber: "+6590000000",
      verified: true,
      subscriptionStatus: SubStatus.ACTIVE,
      tier: Tier.PLATINUM,
      currentPeriodEnd: yearsFromNow(1),
    },
  });

  // Replace showcase inventory only (do not touch other dealers' cars).
  const existing = await prisma.listing.findMany({
    where: { dealerId: dealer.id },
    select: { id: true },
  });
  if (existing.length > 0) {
    const ids = existing.map((l) => l.id);
    await prisma.favourite.deleteMany({ where: { listingId: { in: ids } } });
    await prisma.enquiry.deleteMany({ where: { listingId: { in: ids } } });
    await prisma.sale.deleteMany({ where: { listingId: { in: ids } } });
    await prisma.listingImage.deleteMany({ where: { listingId: { in: ids } } });
    await prisma.listing.deleteMany({ where: { dealerId: dealer.id } });
  }

  for (const l of CATALOGUE) {
    await prisma.listing.create({
      data: {
        dealerId: dealer.id,
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

  const count = await prisma.listing.count({
    where: { dealerId: dealer.id, status: ListingStatus.FOR_SALE },
  });
  console.log(`Catalogue ready: ${count} FOR_SALE listings under ${SHOWCASE_EMAIL}`);
  console.log("Showcase login is internal inventory only — not a client demo account.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
