"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function CancelVehicleButton({
  vehicleId,
  bidCount,
}: {
  vehicleId: string;
  bidCount: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  function cancel() {
    if (bidCount > 0) {
      const ok = window.confirm(
        `This vehicle has ${bidCount} bid${bidCount === 1 ? "" : "s"}. Cancel the auction anyway?`,
      );
      if (!ok) return;
    }

    startTransition(async () => {
      const res = await fetch(`/api/finance/vehicles/${vehicleId}/cancel`, {
        method: "POST",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error ?? "Could not cancel the auction.");
        return;
      }
      toast.success("Auction cancelled.");
      router.refresh();
    });
  }

  return (
    <Button variant="destructive" size="sm" onClick={cancel} disabled={pending}>
      {pending ? "Cancelling…" : "Cancel"}
    </Button>
  );
}
