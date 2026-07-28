"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function AwardBidButton({
  vehicleId,
  bidId,
  dealerName,
  amountLabel,
  isHighest,
}: {
  vehicleId: string;
  bidId: string;
  dealerName: string;
  amountLabel: string;
  isHighest: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  function award() {
    if (!isHighest) {
      const ok = window.confirm(
        `Award to ${dealerName} at ${amountLabel}? This is not the highest bid.`,
      );
      if (!ok) return;
    } else {
      const ok = window.confirm(
        `Award to ${dealerName} at ${amountLabel}? This cannot be undone.`,
      );
      if (!ok) return;
    }

    startTransition(async () => {
      const res = await fetch(`/api/finance/vehicles/${vehicleId}/award`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bidId }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error ?? "Could not award the auction.");
        return;
      }
      toast.success(`Awarded to ${dealerName}.`);
      router.refresh();
    });
  }

  return (
    <Button
      size="sm"
      variant={isHighest ? "default" : "outline"}
      onClick={award}
      disabled={pending}
    >
      {pending ? "Awarding…" : isHighest ? "Award (highest)" : "Award to this dealer"}
    </Button>
  );
}
