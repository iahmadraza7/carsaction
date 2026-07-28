"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { formatBidAmount, formatDate } from "@/lib/format";

const controlClass =
  "h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export type OwnBidView = {
  id: string;
  amount: string;
  updatedAt: string;
  history: { id: string; amount: string; changedAt: string }[];
};

type Props = {
  repoVehicleId: string;
  /** Whether the server currently considers the auction open for bidding. */
  canBid: boolean;
  /** Message when canBid is false (not started / closed / not open). */
  blockedReason?: string;
  ownBid: OwnBidView | null;
};

export function BidForm({ repoVehicleId, canBid, blockedReason, ownBid }: Props) {
  const router = useRouter();
  const [amount, setAmount] = React.useState(
    ownBid ? String(Number(ownBid.amount)) : "",
  );
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (ownBid) setAmount(String(Number(ownBid.amount)));
  }, [ownBid]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canBid) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/dealer/bids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoVehicleId, amount }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        if (data?.errors?.amount?.[0]) {
          setError(data.errors.amount[0]);
        } else {
          toast.error(data?.error ?? "Could not place bid.");
        }
        return;
      }
      toast.success(data?.created ? "Bid placed." : "Bid updated.");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl border bg-card p-5">
      <h2 className="text-base font-semibold tracking-tight">
        {ownBid ? "Your bid" : "Place a bid"}
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Sealed bidding — other dealers cannot see your bid while the auction is open.
      </p>

      {ownBid ? (
        <div className="mt-3 rounded-lg bg-muted/60 px-3 py-2 text-sm">
          <span className="text-muted-foreground">Current bid </span>
          <span className="font-semibold">{formatBidAmount(ownBid.amount)}</span>
          <span className="ml-2 text-xs text-muted-foreground">
            updated {formatDate(ownBid.updatedAt)}
          </span>
        </div>
      ) : null}

      {canBid ? (
        <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3" noValidate>
          <div className="grid gap-1.5">
            <Label htmlFor="bid-amount" className="text-xs text-muted-foreground">
              Amount (SGD)
            </Label>
            <input
              id="bid-amount"
              className={controlClass}
              inputMode="decimal"
              placeholder="e.g. 45000.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              aria-invalid={error ? true : undefined}
            />
            {error ? (
              <p className="text-xs font-medium text-destructive">{error}</p>
            ) : null}
          </div>
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2Icon className="animate-spin" />
                Saving…
              </>
            ) : ownBid ? (
              "Update bid"
            ) : (
              "Place bid"
            )}
          </Button>
        </form>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          {blockedReason ?? "Bidding is not available right now."}
        </p>
      )}

      {ownBid && ownBid.history.length > 0 ? (
        <div className="mt-5 border-t pt-4">
          <h3 className="text-sm font-medium">Your bid history</h3>
          <ul className="mt-2 flex flex-col divide-y text-sm">
            {ownBid.history.map((h) => (
              <li
                key={h.id}
                className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"
              >
                <span className="font-medium">{formatBidAmount(h.amount)}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDateTime(h.changedAt)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
