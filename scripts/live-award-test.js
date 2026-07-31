/**
 * LIVE award proof — real APIs + real scheduler close (no forced close, no seed award).
 *
 * Run on VPS host (so we can tail logs after):
 *   node /tmp/live-award-test.js
 *
 * Requires app on 127.0.0.1:8100 and dealers:
 *   macydealer@carsaction.sg / MacyDealer2026!
 *   showcase@carsaction.sg  (Password123! or known)
 *   finance@carsaction.sg / DemoFinance2026!
 */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const BASE = process.env.QA_BASE_URL || "http://127.0.0.1:8100";
const CLOSE_IN_MS = Number(process.env.CLOSE_IN_MS || 3 * 60 * 1000);

const FINANCE = { email: "finance@carsaction.sg", password: "DemoFinance2026!" };
const DEALER_A = { email: "macydealer@carsaction.sg", password: "MacyDealer2026!" };
const DEALER_B = { email: "showcase@carsaction.sg", password: "Password123!" };

// Precomputed bcrypt hashes (bcryptjs not in prod image)
const HASHES = {
  "DemoFinance2026!": "$2b$10$OltipDPYy23G5Nwg.pogMOKvLCBWbie7Gu16eIYKktT9nZw13xHpi",
  "MacyDealer2026!": "$2b$10$YQ5/qVVwqcugBfcubidXMurfUFPKCCnmJ8CfaddwjzE434B0Uaq6u",
  "Password123!": "$2b$10$Ch/E42BK.Xd9pMdfRavMBuhrl1vAAaC3N0LSnqEcHbd4Nk76lhJNC",
};

function img(id) {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1600&q=80`;
}

function parseSetCookie(res) {
  // Node 20+: getSetCookie(); fallback Set-Cookie header
  const list =
    typeof res.headers.getSetCookie === "function"
      ? res.headers.getSetCookie()
      : (() => {
          const raw = res.headers.get("set-cookie");
          return raw ? [raw] : [];
        })();
  const jar = {};
  for (const c of list) {
    const [pair] = c.split(";");
    const eq = pair.indexOf("=");
    if (eq > 0) jar[pair.slice(0, eq)] = pair.slice(eq + 1);
  }
  return jar;
}

function mergeJar(jar, extra) {
  return { ...jar, ...extra };
}

function cookieHeader(jar) {
  return Object.entries(jar)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

async function login(email, password) {
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`);
  if (!csrfRes.ok) throw new Error(`csrf ${csrfRes.status}`);
  const { csrfToken } = await csrfRes.json();
  let jar = parseSetCookie(csrfRes);

  const body = new URLSearchParams({
    csrfToken,
    email,
    password,
    callbackUrl: `${BASE}/`,
    json: "true",
  });

  const res = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookieHeader(jar),
    },
    body,
    redirect: "manual",
  });
  jar = mergeJar(jar, parseSetCookie(res));

  // Auth.js may return 200 with url or 302
  if (res.status !== 200 && res.status !== 302) {
    const t = await res.text();
    throw new Error(`login failed ${email}: ${res.status} ${t.slice(0, 200)}`);
  }

  // Confirm session
  const sess = await fetch(`${BASE}/api/auth/session`, {
    headers: { Cookie: cookieHeader(jar) },
  });
  const session = await sess.json();
  if (!session?.user?.email) {
    throw new Error(`login session empty for ${email}: ${JSON.stringify(session)}`);
  }
  console.log("LOGIN OK", session.user.email, session.user.role);
  return jar;
}

async function placeBid(jar, repoVehicleId, amount) {
  const res = await fetch(`${BASE}/api/dealer/bids`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader(jar),
    },
    body: JSON.stringify({ repoVehicleId, amount }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`bid failed ${res.status}: ${JSON.stringify(data)}`);
  }
  console.log("BID OK", amount, data);
  return data;
}

async function award(jar, vehicleId, bidId) {
  const res = await fetch(`${BASE}/api/finance/vehicles/${vehicleId}/award`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader(jar),
    },
    body: JSON.stringify({ bidId }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`award failed ${res.status}: ${JSON.stringify(data)}`);
  }
  console.log("AWARD OK", data);
  return data;
}

async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms));
}

async function ensurePassword(email, password, hash) {
  if (!hash) throw new Error(`Missing password hash for ${email}`);
  await prisma.user.update({
    where: { email },
    data: { passwordHash: hash, suspended: false },
  });
  // Ensure ACTIVE subscription for dealers
  const u = await prisma.user.findUnique({
    where: { email },
    include: { dealerProfile: true },
  });
  if (u?.dealerProfile) {
    await prisma.dealerProfile.update({
      where: { id: u.dealerProfile.id },
      data: {
        subscriptionStatus: "ACTIVE",
        tier: u.dealerProfile.tier ?? "PLATINUM",
        subscriptionSource: u.dealerProfile.subscriptionSource ?? "MANUAL",
      },
    });
  }
}

async function main() {
  const finance = await prisma.user.findUnique({
    where: { email: FINANCE.email },
    include: { financeProfile: true },
  });
  if (!finance?.financeProfile) throw new Error("finance profile missing");

  await ensurePassword(FINANCE.email, FINANCE.password, HASHES["DemoFinance2026!"]);
  await ensurePassword(DEALER_A.email, DEALER_A.password, HASHES["MacyDealer2026!"]);
  await ensurePassword(DEALER_B.email, DEALER_B.password, HASHES["Password123!"]);

  const opensAt = new Date(Date.now() - 60_000);
  const closesAt = new Date(Date.now() + CLOSE_IN_MS);

  const vehicle = await prisma.repoVehicle.create({
    data: {
      financeCoId: finance.financeProfile.id,
      make: "Toyota",
      model: "Camry",
      year: 2018,
      mileage: 88000,
      bodyType: "SEDAN",
      colour: "White",
      condition: "[LIVE-AWARD-TEST] Auto-close + award proof vehicle",
      location: "Ubi test yard",
      reservePrice: "45000.00",
      description:
        "[LIVE-AWARD-TEST] Do not manually close. Scheduler must flip OPEN→CLOSED.",
      biddingOpensAt: opensAt,
      biddingClosesAt: closesAt,
      status: "OPEN",
      regDate: new Date(Date.UTC(2018, 5, 15)),
      coeExpiry: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000),
      images: {
        create: [
          { url: img("1621007947382-bb3c3994e3fb"), order: 0 }, // Toyota sedan-ish
          { url: img("1494976388531-d1058494cdd8"), order: 1 },
        ],
      },
    },
  });

  console.log(
    JSON.stringify(
      {
        phase: "created",
        vehicleId: vehicle.id,
        closesAt: closesAt.toISOString(),
        closeInSec: Math.round(CLOSE_IN_MS / 1000),
      },
      null,
      2,
    ),
  );

  const jarA = await login(DEALER_A.email, DEALER_A.password);
  const jarB = await login(DEALER_B.email, DEALER_B.password);

  await placeBid(jarA, vehicle.id, 46800);
  await placeBid(jarB, vehicle.id, 49200); // higher — should win

  console.log("Waiting for scheduler to auto-close (no force)...");
  const deadline = closesAt.getTime() + 90_000; // grace for 60s ticker
  let status = "OPEN";
  while (Date.now() < deadline) {
    const row = await prisma.repoVehicle.findUnique({
      where: { id: vehicle.id },
      select: { status: true, biddingClosesAt: true },
    });
    status = row.status;
    console.log(
      `poll ${new Date().toISOString()} status=${status} closesAt=${row.biddingClosesAt.toISOString()}`,
    );
    if (status === "CLOSED") break;
    await sleep(15_000);
  }

  if (status !== "CLOSED") {
    throw new Error(
      `Scheduler did not close vehicle — still ${status}. Check [auction-closer] logs.`,
    );
  }
  console.log("SCHEDULER CLOSED CONFIRMED");

  const bids = await prisma.bid.findMany({
    where: { repoVehicleId: vehicle.id },
    orderBy: { amount: "desc" },
    include: { dealer: { select: { email: true, name: true } } },
  });
  console.log(
    "BIDS",
    bids.map((b) => ({
      id: b.id,
      amount: b.amount.toString(),
      email: b.dealer.email,
    })),
  );
  const winningBid = bids[0];

  const jarFin = await login(FINANCE.email, FINANCE.password);
  await award(jarFin, vehicle.id, winningBid.id);

  // Brief wait for notify to finish
  await sleep(2000);

  const notifications = await prisma.notification.findMany({
    where: {
      OR: [
        { href: `/auctions/${vehicle.id}` },
        { href: `/finance/vehicles/${vehicle.id}/bids` },
      ],
    },
    include: { user: { select: { email: true, role: true } } },
    orderBy: { createdAt: "asc" },
  });

  const awarded = await prisma.repoVehicle.findUnique({
    where: { id: vehicle.id },
    select: {
      status: true,
      winningBidId: true,
      awardedAt: true,
    },
  });

  const evidence = {
    vehicleId: vehicle.id,
    awarded,
    notifications: notifications.map((n) => ({
      email: n.user.email,
      role: n.user.role,
      title: n.title,
      body: n.body,
      href: n.href,
      // Flag if loser body contains digits that look like money
      bodyHasAmountLike: /\$|\d{4,}/.test(n.body) && n.title === "Auction concluded",
    })),
    winnerEmail: winningBid.dealer.email,
    loserEmails: bids.slice(1).map((b) => b.dealer.email),
  };

  console.log("EVIDENCE_JSON_START");
  console.log(JSON.stringify(evidence, null, 2));
  console.log("EVIDENCE_JSON_END");
  console.log(
    "TAIL LOGS NOW: docker compose -p carsaction -f /opt/carsaction/docker-compose.prod.yml logs app --tail 80 | grep -i 'Auction won\\|award'",
  );
}

main()
  .catch((e) => {
    console.error("FATAL", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
