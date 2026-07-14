"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";

type Tier = "GOLD" | "PLATINUM";

export function SubscribeButton({
  tier,
  label = "Subscribe",
  variant = "default",
  className,
}: {
  tier: Tier;
  label?: string;
  variant?: "default" | "outline" | "secondary";
  className?: string;
}) {
  const [loading, setLoading] = useState(false);

  async function subscribe() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        toast.error(data.error ?? "Could not start checkout. Please try again.");
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      toast.error("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <Button onClick={subscribe} disabled={loading} variant={variant} className={className}>
      {loading ? <Loader2Icon className="size-4 animate-spin" /> : null}
      {label}
    </Button>
  );
}
