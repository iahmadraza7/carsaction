import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { auth } from "@/auth";
import { getFinanceProfileByUserId } from "@/lib/finance";
import { FinanceShell } from "@/components/finance/finance-shell";
import { RepoVehicleForm } from "@/components/finance/repo-vehicle-form";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Post repo vehicle | CARSaction" };

export default async function NewRepoVehiclePage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/finance/vehicles/new");

  const profile = await getFinanceProfileByUserId(session.user.id);
  if (!profile) redirect("/finance/dashboard");

  if (!profile.verified) {
    return (
      <FinanceShell
        email={session.user.email ?? ""}
        title="Post repo vehicle"
        description="Verification required"
      >
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
          <p className="font-medium">Pending verification</p>
          <p className="mt-1 text-muted-foreground">
            You cannot post vehicles until an admin verifies your finance company.
          </p>
          <Link
            href="/finance/dashboard"
            className={buttonVariants({ variant: "outline", size: "sm", className: "mt-3" })}
          >
            Back to dashboard
          </Link>
        </div>
      </FinanceShell>
    );
  }

  return (
    <FinanceShell
      email={session.user.email ?? ""}
      title="Post repo vehicle"
      description="Set specs, photos, and the bidding window"
    >
      <RepoVehicleForm mode="create" />
    </FinanceShell>
  );
}
