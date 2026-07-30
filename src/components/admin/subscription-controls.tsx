"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Tier } from "@prisma/client";

import { Button } from "@/components/ui/button";
import {
  setDealerSubscriptionManual,
  revokeDealerSubscription,
} from "@/app/admin/actions";

export function SubscriptionControls({
  dealerId,
  tier,
  status,
  source,
  currentPeriodEnd,
}: {
  dealerId: string;
  tier: Tier | null;
  status: string;
  source: "STRIPE" | "MANUAL";
  currentPeriodEnd: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [selectedTier, setSelectedTier] = React.useState<Tier>(tier ?? Tier.PLATINUM);
  const [expiresOn, setExpiresOn] = React.useState(
    currentPeriodEnd ? currentPeriodEnd.slice(0, 10) : "",
  );

  function grant() {
    startTransition(async () => {
      const res = await setDealerSubscriptionManual({
        dealerId,
        tier: selectedTier,
        expiresOn: expiresOn || null,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(
        status === "ACTIVE"
          ? `Updated to ${selectedTier} (manual).`
          : `Granted ${selectedTier} (manual).`,
      );
      router.refresh();
    });
  }

  function revoke() {
    if (!window.confirm("Revoke this dealer's subscription? They will lose listing and bidding access.")) {
      return;
    }
    startTransition(async () => {
      const res = await revokeDealerSubscription({ dealerId });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Subscription revoked.");
      router.refresh();
    });
  }

  return (
    <div className="flex w-full flex-col gap-2 rounded-lg bg-muted/40 p-3 sm:max-w-sm">
      <p className="text-xs font-medium text-muted-foreground">
        Manual subscription
        {source === "STRIPE" ? " (overrides Stripe until they check out again)" : ""}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <select
          className="h-8 rounded-md border border-input bg-background px-2 text-sm"
          value={selectedTier}
          onChange={(e) => setSelectedTier(e.target.value as Tier)}
          disabled={pending}
        >
          <option value={Tier.GOLD}>Gold</option>
          <option value={Tier.PLATINUM}>Platinum</option>
        </select>
        <input
          type="date"
          className="h-8 rounded-md border border-input bg-background px-2 text-sm"
          value={expiresOn}
          onChange={(e) => setExpiresOn(e.target.value)}
          disabled={pending}
          title="Optional expiry (leave blank for open-ended)"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={grant} disabled={pending}>
          {status === "ACTIVE" ? "Update grant" : "Grant"}
        </Button>
        {status !== "NONE" ? (
          <Button size="sm" variant="outline" onClick={revoke} disabled={pending}>
            Revoke
          </Button>
        ) : null}
      </div>
      <p className="text-[11px] text-muted-foreground">
        Leave date blank for open-ended. Source becomes Manual grant.
      </p>
    </div>
  );
}
