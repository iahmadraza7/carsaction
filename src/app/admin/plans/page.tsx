import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { PlanEditor } from "@/components/admin/plan-editor";

export const metadata: Metadata = { title: "Plans — Admin" };

export default async function AdminPlansPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin/plans");

  const plans = await prisma.subscriptionPlan.findMany({ orderBy: { monthlyPrice: "asc" } });

  return (
    <AdminShell
      email={session.user.email ?? ""}
      title="Subscription plans"
      description="Edit plan names, pricing, listing limits and availability."
    >
      <div className="grid max-w-3xl gap-4">
        {plans.map((p) => (
          <PlanEditor
            key={p.id}
            plan={{
              id: p.id,
              tier: p.tier,
              name: p.name,
              monthlyPrice: p.monthlyPrice.toString(),
              listingLimit: p.listingLimit,
              active: p.active,
            }}
          />
        ))}
        {plans.length === 0 ? (
          <p className="text-sm text-muted-foreground">No plans configured.</p>
        ) : null}
      </div>
    </AdminShell>
  );
}
