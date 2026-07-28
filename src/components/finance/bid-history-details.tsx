"use client";

import * as React from "react";

import { formatBidAmount } from "@/lib/format";

export function BidHistoryDetails({
  history,
}: {
  history: { id: string; amount: string; changedAt: string }[];
}) {
  if (history.length === 0) {
    return <p className="text-xs text-muted-foreground">No history.</p>;
  }

  return (
    <details className="group">
      <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
        Bid history ({history.length})
      </summary>
      <ul className="mt-2 flex flex-col divide-y rounded-lg border bg-muted/40 px-3 text-sm">
        {history.map((h) => (
          <li key={h.id} className="flex items-center justify-between gap-3 py-2">
            <span className="font-medium">{formatBidAmount(h.amount)}</span>
            <span className="text-xs text-muted-foreground">
              {new Date(h.changedAt).toLocaleString("en-SG", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}
