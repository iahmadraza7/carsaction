import { NextResponse } from "next/server";
import { hash } from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { financeSignupSchema } from "@/lib/validations/auth";
import { enforceRateLimit } from "@/lib/rate-limit-http";

export async function POST(req: Request) {
  const limited = enforceRateLimit(req, "register-finance", 5, 15 * 60_000);
  if (limited.response) return limited.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = financeSignupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { errors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { name, email, password, companyName, uen, contactPerson } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 },
    );
  }

  const passwordHash = await hash(password, 10);

  // verified defaults to false — admin must verify before posting vehicles.
  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "FINANCE_CO",
      financeProfile: {
        create: {
          companyName,
          uen,
          contactPerson: contactPerson || undefined,
        },
      },
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
