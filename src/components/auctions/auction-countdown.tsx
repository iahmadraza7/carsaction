"use client";

import * as React from "react";

/** Live countdown to a bidding close datetime (ISO string). */
export function AuctionCountdown({ closesAt }: { closesAt: string }) {
  const [now, setNow] = React.useState(() => Date.now());

  React.useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const end = new Date(closesAt).getTime();
  const diff = end - now;

  if (diff <= 0) {
    return <span className="font-medium tabular-nums">Closed</span>;
  }

  const totalSec = Math.floor(diff / 1000);
  const days = Math.floor(totalSec / 86_400);
  const hours = Math.floor((totalSec % 86_400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  parts.push(`${hours}h`, `${mins}m`, `${secs}s`);

  return <span className="font-medium tabular-nums">{parts.join(" ")}</span>;
}
