"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  BODY_TYPES,
  FUEL_TYPES,
  TRANSMISSIONS,
  humanizeEnum,
} from "@/lib/listing-options";

const controlClass =
  "h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type FiltersProps = {
  makes: string[];
  modelsByMake: Record<string, string[]>;
  /** Called after Apply/Clear so a mobile sheet can close itself. */
  onApplied?: () => void;
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function MultiCheck({
  options,
  selected,
  onChange,
  emptyLabel,
}: {
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (next: string[]) => void;
  emptyLabel?: string;
}) {
  function toggle(value: string) {
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value],
    );
  }

  if (options.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">{emptyLabel ?? "No options"}</p>
    );
  }

  return (
    <div className="max-h-36 space-y-1.5 overflow-y-auto rounded-lg border border-input p-2">
      {options.map((o) => (
        <label
          key={o.value}
          className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-sm hover:bg-muted/60"
        >
          <input
            type="checkbox"
            className="size-3.5 accent-primary"
            checked={selected.includes(o.value)}
            onChange={() => toggle(o.value)}
          />
          <span>{o.label}</span>
        </label>
      ))}
    </div>
  );
}

function readList(params: URLSearchParams, key: string): string[] {
  const all = params.getAll(key);
  if (all.length === 0) return [];
  return all
    .flatMap((v) => v.split(","))
    .map((v) => v.trim())
    .filter(Boolean);
}

export function Filters({ makes, modelsByMake, onApplied }: FiltersProps) {
  const router = useRouter();
  const params = useSearchParams();

  const [makesSel, setMakesSel] = React.useState(() => readList(params, "make"));
  const [modelsSel, setModelsSel] = React.useState(() => readList(params, "model"));
  const [priceMin, setPriceMin] = React.useState(params.get("priceMin") ?? "");
  const [priceMax, setPriceMax] = React.useState(params.get("priceMax") ?? "");
  const [yearMin, setYearMin] = React.useState(params.get("yearMin") ?? "");
  const [yearMax, setYearMax] = React.useState(params.get("yearMax") ?? "");
  const [mileageMax, setMileageMax] = React.useState(params.get("mileageMax") ?? "");
  const [deprMax, setDeprMax] = React.useState(params.get("deprMax") ?? "");
  const [coeYearsMin, setCoeYearsMin] = React.useState(params.get("coeYearsMin") ?? "");
  const [bodyTypes, setBodyTypes] = React.useState(() => readList(params, "bodyType"));
  const [fuelTypes, setFuelTypes] = React.useState(() => readList(params, "fuelType"));
  const [transmissions, setTransmissions] = React.useState(() =>
    readList(params, "transmission"),
  );

  const availableModels = React.useMemo(() => {
    const source =
      makesSel.length > 0
        ? makesSel.flatMap((m) => modelsByMake[m] ?? [])
        : Object.values(modelsByMake).flat();
    return Array.from(new Set(source)).sort((a, b) => a.localeCompare(b));
  }, [makesSel, modelsByMake]);

  function handleMakesChange(next: string[]) {
    setMakesSel(next);
    setModelsSel((prev) =>
      prev.filter((model) =>
        next.length === 0
          ? true
          : next.some((m) => (modelsByMake[m] ?? []).includes(model)),
      ),
    );
  }

  function apply(e: React.FormEvent) {
    e.preventDefault();
    const next = new URLSearchParams();
    const setList = (k: string, values: string[]) => {
      for (const v of values) next.append(k, v);
    };
    const set = (k: string, v: string) => {
      if (v.trim()) next.set(k, v.trim());
    };
    setList("make", makesSel);
    setList("model", modelsSel);
    set("priceMin", priceMin);
    set("priceMax", priceMax);
    set("yearMin", yearMin);
    set("yearMax", yearMax);
    set("mileageMax", mileageMax);
    set("deprMax", deprMax);
    set("coeYearsMin", coeYearsMin);
    setList("bodyType", bodyTypes);
    setList("fuelType", fuelTypes);
    setList("transmission", transmissions);
    const sort = params.get("sort");
    if (sort) next.set("sort", sort);
    const qs = next.toString();
    router.push(qs ? `/cars?${qs}` : "/cars");
    onApplied?.();
  }

  function clear() {
    setMakesSel([]);
    setModelsSel([]);
    setPriceMin("");
    setPriceMax("");
    setYearMin("");
    setYearMax("");
    setMileageMax("");
    setDeprMax("");
    setCoeYearsMin("");
    setBodyTypes([]);
    setFuelTypes([]);
    setTransmissions([]);
    const sort = params.get("sort");
    router.push(sort ? `/cars?sort=${sort}` : "/cars");
    onApplied?.();
  }

  return (
    <form onSubmit={apply} className="grid gap-4">
      <Field label="Make">
        <MultiCheck
          options={makes.map((m) => ({ value: m, label: m }))}
          selected={makesSel}
          onChange={handleMakesChange}
        />
      </Field>

      <Field label="Model">
        <MultiCheck
          options={availableModels.map((m) => ({ value: m, label: m }))}
          selected={modelsSel}
          onChange={setModelsSel}
          emptyLabel="Select a make first (or any model)"
        />
      </Field>

      <Field label="Price (S$)">
        <div className="flex items-center gap-2">
          <input
            className={controlClass}
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Min"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
          />
          <span className="text-muted-foreground">-</span>
          <input
            className={controlClass}
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Max"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
          />
        </div>
      </Field>

      <Field label="Year">
        <div className="flex items-center gap-2">
          <input
            className={controlClass}
            type="number"
            inputMode="numeric"
            placeholder="From"
            value={yearMin}
            onChange={(e) => setYearMin(e.target.value)}
          />
          <span className="text-muted-foreground">-</span>
          <input
            className={controlClass}
            type="number"
            inputMode="numeric"
            placeholder="To"
            value={yearMax}
            onChange={(e) => setYearMax(e.target.value)}
          />
        </div>
      </Field>

      <Field label="Max mileage (km)">
        <input
          className={controlClass}
          type="number"
          inputMode="numeric"
          min={0}
          placeholder="e.g. 80000"
          value={mileageMax}
          onChange={(e) => setMileageMax(e.target.value)}
        />
      </Field>

      <Field label="Max depreciation (S$/yr)">
        <input
          className={controlClass}
          type="number"
          inputMode="numeric"
          min={0}
          placeholder="e.g. 15000"
          value={deprMax}
          onChange={(e) => setDeprMax(e.target.value)}
        />
      </Field>

      <Field label="COE left (min years)">
        <select
          className={controlClass}
          value={coeYearsMin}
          onChange={(e) => setCoeYearsMin(e.target.value)}
        >
          <option value="">Any</option>
          <option value="1">At least 1 year</option>
          <option value="2">At least 2 years</option>
          <option value="3">At least 3 years</option>
          <option value="5">At least 5 years</option>
          <option value="7">At least 7 years</option>
        </select>
      </Field>

      <Field label="Body type">
        <MultiCheck
          options={BODY_TYPES.map((b) => ({ value: b, label: humanizeEnum(b) }))}
          selected={bodyTypes}
          onChange={setBodyTypes}
        />
      </Field>

      <Field label="Fuel type">
        <MultiCheck
          options={FUEL_TYPES.map((f) => ({ value: f, label: humanizeEnum(f) }))}
          selected={fuelTypes}
          onChange={setFuelTypes}
        />
      </Field>

      <Field label="Transmission">
        <MultiCheck
          options={TRANSMISSIONS.map((t) => ({ value: t, label: humanizeEnum(t) }))}
          selected={transmissions}
          onChange={setTransmissions}
        />
      </Field>

      <div className="rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2.5">
        <p className="text-xs font-medium text-muted-foreground">Rental cars</p>
        <p className="mt-0.5 text-sm text-muted-foreground">Coming soon</p>
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="submit" className="flex-1">
          Apply filters
        </Button>
        <Button type="button" variant="outline" onClick={clear}>
          Clear
        </Button>
      </div>
    </form>
  );
}
