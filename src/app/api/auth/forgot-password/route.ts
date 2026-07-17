import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { createResetToken } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/mail";
import { enforceRateLimit } from "@/lib/rate-limit-http";

function appUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL || process.env.AUTH_URL || "http://localhost:3000"
  );
}

export async function POST(req: Request) {
  const limited = enforceRateLimit(req, "forgot-password", 5, 15 * 60_000);
  if (limited.response) return limited.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { errors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { email } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  // Only act if the user exists, but always return the same response so we
  // never reveal whether an email is registered.
  if (user) {
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
    const { token, tokenHash, expires } = createResetToken();
    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expires },
    });

    const resetUrl = `${appUrl()}/reset-password?token=${token}`;
    await sendPasswordResetEmail(user.email, resetUrl);
  }

  return NextResponse.json({ ok: true });
}
