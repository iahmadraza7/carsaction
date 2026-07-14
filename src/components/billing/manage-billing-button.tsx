"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2Icon, CreditCardIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ManageBillingButton({
  label = "Manage billing",
  variant = "outline",
  className,
}: {
  label?: string;
  variant?: "default" | "outline" | "secondary";
  className?: string;
}) {
  const [loading, setLoading] = useState(false);

  async function openPortal() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        toast.error(data.error ?? "Could not open the billing portal.");
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
    <Button onClick={openPortal} disabled={loading} variant={variant} className={className}>
      {loading ? (
        <Loader2Icon className="size-4 animate-spin" />
      ) : (
        <CreditCardIcon className="size-4" />
      )}
      {label}
    </Button>
  );
}
