import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { auth } from "@/auth";
import { DealerShell } from "@/components/dealer/dealer-shell";
import { ListingForm } from "@/components/dealer/listing-form";
import { buttonVariants } from "@/components/ui/button";
import { getDealerProfileByUserId, canCreateListing } from "@/lib/subscription";

export const metadata: Metadata = { title: "New listing — CARSaction" };

export default async function NewListingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/dealer/listings/new");

  const profile = await getDealerProfileByUserId(session.user.id);
  const gate = profile
    ? await canCreateListing(profile)
    : { ok: false, reason: "Dealer profile not found.", limit: null, used: 0 };

  return (
    <DealerShell
      email={session.user.email ?? ""}
      title="New listing"
      description="Add a car to your inventory. Singapore buyers expect COE, depreciation, OMV and ARF."
    >
      {gate.ok ? (
        <ListingForm mode="create" />
      ) : (
        <div className="max-w-xl rounded-xl border bg-card p-6">
          <h2 className="text-base font-semibold">You can&apos;t add a listing yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">{gate.reason}</p>
          <div className="mt-4 flex gap-2">
            <Link href="/pricing" className={buttonVariants({ variant: "default" })}>
              View plans
            </Link>
            <Link href="/dealer/listings" className={buttonVariants({ variant: "outline" })}>
              Back to listings
            </Link>
          </div>
        </div>
      )}
    </DealerShell>
  );
}
