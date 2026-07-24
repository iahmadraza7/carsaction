import { NextResponse } from "next/server";
import { hash } from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { dealerSignupSchema } from "@/lib/validations/auth";
import { enforceRateLimit } from "@/lib/rate-limit-http";

export async function POST(req: Request) {
  const limited = enforceRateLimit(req, "register-dealer", 5, 15 * 60_000);
  if (limited.response) return limited.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = dealerSignupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { errors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { name, email, password, businessName, whatsappNumber, uen, address } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 },
    );
  }

  const passwordHash = await hash(password, 10);

  // Atomic: create the dealer User and its DealerProfile together.
  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "DEALER",
      dealerProfile: {
        create: {
          businessName,
          whatsappNumber,
          uen,
          address: address || undefined,
        },
      },
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
