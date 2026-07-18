import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { SubStatus } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { VerifyToggle } from "@/components/admin/verify-toggle";
import { Badge } from "@/components/ui/badge";
import { humanizeSubStatus } from "@/lib/subscription";

export const metadata: Metadata = { title: "Dealers | Admin" };

export default async function AdminDealersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin/dealers");

  const dealers = await prisma.dealerProfile.findMany({
    orderBy: { businessName: "asc" },
    include: {
      user: { select: { name: true, email: true } },
      _count: { select: { listings: true } },
    },
  });

  return (
    <AdminShell
      email={session.user.email ?? ""}
      title="Dealers"
      description={`${dealers.length} dealer${dealers.length === 1 ? "" : "s"}`}
    >
      <div className="grid gap-3">
        {dealers.map((d) => (
          <div
            key={d.id}
            className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium">{d.businessName}</span>
                {d.verified ? (
                  <Badge variant="secondary">Verified</Badge>
                ) : (
                  <Badge variant="outline">Unverified</Badge>
                )}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {d.user.name} · {d.user.email}
                {d.uen ? ` · UEN ${d.uen}` : ""}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span>{d._count.listings} listings</span>
                <Badge
                  variant={
                    d.subscriptionStatus === SubStatus.ACTIVE
                      ? "default"
                      : d.subscriptionStatus === SubStatus.PAST_DUE
                        ? "destructive"
                        : "outline"
                  }
                >
                  {humanizeSubStatus(d.subscriptionStatus)}
                </Badge>
                {d.tier ? <span>{d.tier}</span> : null}
              </div>
            </div>
            <VerifyToggle dealerId={d.id} verified={d.verified} />
          </div>
        ))}
        {dealers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No dealers yet.</p>
        ) : null}
      </div>
    </AdminShell>
  );
}
