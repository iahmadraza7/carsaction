import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/** Keep suspended dealers out of dealer dashboards (signup stays usable). */
export default async function DealerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (session?.user?.role === "DEALER") {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { suspended: true },
    });
    if (!user || user.suspended) redirect("/login?error=suspended");
  }

  return children;
}
