/**
 * End-to-end QA for the dealer listing flow against the running dev server.
 * Signs in as dealer1 via the Auth.js credentials callback, uploads a generated
 * image through /api/dealer/uploads, creates a listing via /api/dealer/listings,
 * then verifies the row in the database. Run: npx tsx scripts/qa-listing.ts
 */
import sharp from "sharp";
import { PrismaClient } from "@prisma/client";

const BASE = process.env.QA_BASE_URL ?? "http://localhost:3000";
const EMAIL = "dealer1@carsaction.sg";
const PASSWORD = "Password123!";

const prisma = new PrismaClient();
const jar = new Map<string, string>();

function storeCookies(res: Response) {
  // getSetCookie is available on undici's Headers (Node 18.14+/20+).
  const set = (res.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie?.() ?? [];
  for (const c of set) {
    const [pair] = c.split(";");
    const idx = pair.indexOf("=");
    if (idx > 0) jar.set(pair.slice(0, idx).trim(), pair.slice(idx + 1).trim());
  }
}

function cookieHeader(): string {
  return Array.from(jar.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

async function signIn() {
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`);
  storeCookies(csrfRes);
  const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };

  const body = new URLSearchParams({
    csrfToken,
    email: EMAIL,
    password: PASSWORD,
    callbackUrl: BASE,
    json: "true",
  });

  const res = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", cookie: cookieHeader() },
    body,
    redirect: "manual",
  });
  storeCookies(res);

  const hasSession = Array.from(jar.keys()).some((k) => k.includes("session-token"));
  if (!hasSession) throw new Error(`Sign-in failed (status ${res.status}); no session cookie`);
  console.log("✓ signed in as dealer1");
}

async function uploadImage(): Promise<string> {
  const png = await sharp({
    create: { width: 1200, height: 800, channels: 3, background: { r: 210, g: 120, b: 40 } },
  })
    .png()
    .toBuffer();

  const form = new FormData();
  form.append("files", new Blob([new Uint8Array(png)], { type: "image/png" }), "qa-car.png");

  const res = await fetch(`${BASE}/api/dealer/uploads`, {
    method: "POST",
    headers: { cookie: cookieHeader() },
    body: form,
  });
  const data = (await res.json()) as { urls?: string[]; error?: string };
  if (!res.ok || !data.urls?.length) {
    throw new Error(`Upload failed (${res.status}): ${data.error ?? "no urls"}`);
  }
  console.log("✓ uploaded image ->", data.urls[0]);
  return data.urls[0];
}

async function createListing(imageUrl: string): Promise<string> {
  const payload = {
    title: "QA 2023 Honda Civic 1.5 VTEC Turbo",
    make: "Honda",
    model: "Civic",
    variant: "1.5 VTEC Turbo",
    year: "2023",
    price: "129800",
    mileage: "18000",
    bodyType: "SEDAN",
    fuelType: "PETROL",
    transmission: "AUTO",
    engineCc: "1498",
    colour: "Grey",
    regDate: "2023-03-01",
    coeExpiry: "2033-03-01",
    depreciation: "14200",
    omv: "24000",
    arf: "20000",
    description: "QA end-to-end created listing.",
    images: [imageUrl],
  };

  const res = await fetch(`${BASE}/api/dealer/listings`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie: cookieHeader() },
    body: JSON.stringify(payload),
  });
  const data = (await res.json()) as { id?: string; error?: string; errors?: unknown };
  if (!res.ok || !data.id) {
    throw new Error(`Create failed (${res.status}): ${JSON.stringify(data)}`);
  }
  console.log("✓ created listing ->", data.id);
  return data.id;
}

async function main() {
  await signIn();
  const url = await uploadImage();
  const id = await createListing(url);

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: { images: true },
  });
  if (!listing) throw new Error("Listing not found in DB");
  console.log("✓ verified in DB:", {
    title: listing.title,
    price: listing.price.toString(),
    coeExpiry: listing.coeExpiry?.toISOString().slice(0, 10),
    images: listing.images.length,
    status: listing.status,
  });

  // Clean up so repeated runs don't pile up QA rows / images.
  await prisma.listing.delete({ where: { id } });
  console.log("✓ cleaned up QA listing");
  console.log("\nALL LISTING QA CHECKS PASSED");
}

main()
  .catch((e) => {
    console.error("QA FAILED:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
