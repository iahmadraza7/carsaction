"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { updatePlan } from "@/app/admin/actions";

const controlClass =
  "h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function PlanEditor({
  plan,
}: {
  plan: {
    id: string;
    tier: string;
    name: string;
    monthlyPrice: string;
    listingLimit: number | null;
    active: boolean;
  };
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [name, setName] = React.useState(plan.name);
  const [price, setPrice] = React.useState(plan.monthlyPrice);
  const [limit, setLimit] = React.useState(plan.listingLimit?.toString() ?? "");
  const [active, setActive] = React.useState(plan.active);

  function save() {
    startTransition(async () => {
      const res = await updatePlan({
        planId: plan.id,
        name,
        monthlyPrice: Number(price),
        listingLimit: limit === "" ? null : Number(limit),
        active,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`${name} plan saved.`);
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold">{plan.tier}</h2>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="size-4 accent-[var(--primary)]"
          />
          Active
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="grid gap-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Plan name</Label>
          <input className={controlClass} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Monthly price (S$)</Label>
          <input
            className={controlClass}
            type="number"
            inputMode="numeric"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs font-medium text-muted-foreground">
            Listing limit (blank = unlimited)
          </Label>
          <input
            className={controlClass}
            type="number"
            inputMode="numeric"
            placeholder="Unlimited"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
          />
        </div>
      </div>
      <div className="mt-4">
        <Button onClick={save} disabled={pending}>
          {pending ? "Saving…" : "Save plan"}
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Note: price/limit changes affect display and future enforcement. Stripe prices are managed
        in the Stripe dashboard.
      </p>
    </div>
  );
}
