import { NextResponse } from "next/server";
import { hash } from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { dealerSignupSchema } from "@/lib/validations/auth";

export async function POST(req: Request) {
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
          uen: uen || undefined,
          address: address || undefined,
        },
      },
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
