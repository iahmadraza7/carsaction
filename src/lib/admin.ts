import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/** Throws if the current session is not an ADMIN. Use in every admin mutation. */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Not authorised");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { suspended: true },
  });
  if (!user || user.suspended) {
    redirect("/login?error=suspended");
  }

  return session;
}
