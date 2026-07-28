import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/** Keep suspended finance accounts out of finance dashboards (signup stays usable). */
export default async function FinanceLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (session?.user?.role === "FINANCE_CO") {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { suspended: true },
    });
    if (!user || user.suspended) redirect("/login?error=suspended");
  }

  return children;
}
