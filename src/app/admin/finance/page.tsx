import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { FinanceVerifyToggle } from "@/components/admin/finance-verify-toggle";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Finance companies | Admin" };

export default async function AdminFinancePage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin/finance");

  const companies = await prisma.financeProfile.findMany({
    orderBy: { companyName: "asc" },
    include: {
      user: { select: { name: true, email: true } },
      _count: { select: { repoVehicles: true } },
    },
  });

  return (
    <AdminShell
      email={session.user.email ?? ""}
      title="Finance companies"
      description={`${companies.length} compan${companies.length === 1 ? "y" : "ies"}`}
    >
      <div className="grid gap-3">
        {companies.map((c) => (
          <div
            key={c.id}
            className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium">{c.companyName}</span>
                {c.verified ? (
                  <Badge variant="secondary">Verified</Badge>
                ) : (
                  <Badge variant="outline">Unverified</Badge>
                )}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {c.user.name} · {c.user.email}
                {c.uen ? ` · UEN ${c.uen}` : ""}
                {c.contactPerson ? ` · ${c.contactPerson}` : ""}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {c._count.repoVehicles} vehicle{c._count.repoVehicles === 1 ? "" : "s"}
              </div>
            </div>
            <FinanceVerifyToggle financeId={c.id} verified={c.verified} />
          </div>
        ))}
        {companies.length === 0 ? (
          <p className="text-sm text-muted-foreground">No finance companies yet.</p>
        ) : null}
      </div>
    </AdminShell>
  );
}
