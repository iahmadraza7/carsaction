"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { SearchIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

const controlClass =
  "h-11 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

/**
 * Compact SGCM-style search strip for the landing page.
 * Submits to URL-driven /cars filters (shareable, no scrape).
 */
export function HomeSearch({ makes }: { makes: string[] }) {
  const router = useRouter();
  const [make, setMake] = React.useState("");
  const [priceMin, setPriceMin] = React.useState("");
  const [priceMax, setPriceMax] = React.useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next = new URLSearchParams();
    if (make.trim()) next.set("make", make.trim());
    if (priceMin.trim()) next.set("priceMin", priceMin.trim());
    if (priceMax.trim()) next.set("priceMax", priceMax.trim());
    const qs = next.toString();
    router.push(qs ? `/cars?${qs}` : "/cars");
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto grid w-full max-w-4xl gap-3 rounded-2xl border bg-card p-4 shadow-sm sm:grid-cols-[1.2fr_1fr_1fr_auto] sm:items-end"
    >
      <label className="grid gap-1.5 text-left">
        <span className="text-xs font-medium text-muted-foreground">Make</span>
        <select
          className={controlClass}
          value={make}
          onChange={(e) => setMake(e.target.value)}
        >
          <option value="">Any make</option>
          {makes.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1.5 text-left">
        <span className="text-xs font-medium text-muted-foreground">Min price (S$)</span>
        <input
          className={controlClass}
          type="number"
          inputMode="numeric"
          min={0}
          placeholder="e.g. 50000"
          value={priceMin}
          onChange={(e) => setPriceMin(e.target.value)}
        />
      </label>
      <label className="grid gap-1.5 text-left">
        <span className="text-xs font-medium text-muted-foreground">Max price (S$)</span>
        <input
          className={controlClass}
          type="number"
          inputMode="numeric"
          min={0}
          placeholder="e.g. 150000"
          value={priceMax}
          onChange={(e) => setPriceMax(e.target.value)}
        />
      </label>
      <Button type="submit" size="lg" className="h-11 w-full sm:w-auto">
        <SearchIcon />
        Search
      </Button>
    </form>
  );
}
