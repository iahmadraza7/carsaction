import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { auth } from "@/auth";
import { DashboardShell } from "@/components/dashboard-shell";

export const metadata: Metadata = { title: "Admin dashboard — CARSaction" };

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin/dashboard");

  return (
    <DashboardShell
      label="Admin"
      name={session.user.name ?? "Admin"}
      email={session.user.email ?? ""}
      role={session.user.role}
    />
  );
}
