import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/** Shared layout guard: keep suspended accounts out of the admin panel. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin/dashboard");
  if (session.user.role !== "ADMIN") redirect("/");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { suspended: true },
  });
  if (!user || user.suspended) redirect("/login?error=suspended");

  return children;
}
