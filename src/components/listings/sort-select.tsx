"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { SORT_OPTIONS } from "@/lib/listing-options";

export function SortSelect() {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get("sort") ?? "newest";

  function onChange(value: string) {
    const next = new URLSearchParams(params.toString());
    if (value && value !== "newest") next.set("sort", value);
    else next.delete("sort");
    next.delete("page");
    const qs = next.toString();
    router.push(qs ? `/cars?${qs}` : "/cars");
  }

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="hidden text-muted-foreground sm:inline">Sort</span>
      <select
        className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        value={current}
        onChange={(e) => onChange(e.target.value)}
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
