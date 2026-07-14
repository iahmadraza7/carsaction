import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { auth } from "@/auth";
import { DashboardShell } from "@/components/dashboard-shell";

export const metadata: Metadata = { title: "Dealer dashboard — CARSaction" };

export default async function DealerDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/dealer/dashboard");

  return (
    <DashboardShell
      label="Dealer"
      name={session.user.name ?? "Dealer"}
      email={session.user.email ?? ""}
      role={session.user.role}
    />
  );
}
