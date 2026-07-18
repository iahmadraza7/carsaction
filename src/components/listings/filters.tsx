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

export function Filters({ makes, modelsByMake, onApplied }: FiltersProps) {
  const router = useRouter();
  const params = useSearchParams();

  const [make, setMake] = React.useState(params.get("make") ?? "");
  const [model, setModel] = React.useState(params.get("model") ?? "");
  const [priceMin, setPriceMin] = React.useState(params.get("priceMin") ?? "");
  const [priceMax, setPriceMax] = React.useState(params.get("priceMax") ?? "");
  const [yearMin, setYearMin] = React.useState(params.get("yearMin") ?? "");
  const [yearMax, setYearMax] = React.useState(params.get("yearMax") ?? "");
  const [mileageMax, setMileageMax] = React.useState(params.get("mileageMax") ?? "");
  const [deprMax, setDeprMax] = React.useState(params.get("deprMax") ?? "");
  const [coeYearsMin, setCoeYearsMin] = React.useState(params.get("coeYearsMin") ?? "");
  const [bodyType, setBodyType] = React.useState(params.get("bodyType") ?? "");
  const [fuelType, setFuelType] = React.useState(params.get("fuelType") ?? "");
  const [transmission, setTransmission] = React.useState(params.get("transmission") ?? "");

  const availableModels = make
    ? (modelsByMake[make] ?? [])
    : Array.from(new Set(Object.values(modelsByMake).flat())).sort();

  function handleMakeChange(value: string) {
    setMake(value);
    // Reset the model if it no longer belongs to the selected make.
    if (value && !(modelsByMake[value] ?? []).includes(model)) setModel("");
  }

  function apply(e: React.FormEvent) {
    e.preventDefault();
    const next = new URLSearchParams();
    const set = (k: string, v: string) => {
      if (v.trim()) next.set(k, v.trim());
    };
    set("make", make);
    set("model", model);
    set("priceMin", priceMin);
    set("priceMax", priceMax);
    set("yearMin", yearMin);
    set("yearMax", yearMax);
    set("mileageMax", mileageMax);
    set("deprMax", deprMax);
    set("coeYearsMin", coeYearsMin);
    set("bodyType", bodyType);
    set("fuelType", fuelType);
    set("transmission", transmission);
    // Preserve sort, reset to page 1 on any filter change.
    const sort = params.get("sort");
    if (sort) next.set("sort", sort);
    const qs = next.toString();
    router.push(qs ? `/cars?${qs}` : "/cars");
    onApplied?.();
  }

  function clear() {
    setMake("");
    setModel("");
    setPriceMin("");
    setPriceMax("");
    setYearMin("");
    setYearMax("");
    setMileageMax("");
    setDeprMax("");
    setCoeYearsMin("");
    setBodyType("");
    setFuelType("");
    setTransmission("");
    const sort = params.get("sort");
    router.push(sort ? `/cars?sort=${sort}` : "/cars");
    onApplied?.();
  }

  return (
    <form onSubmit={apply} className="grid gap-4">
      <Field label="Make">
        <select
          className={controlClass}
          value={make}
          onChange={(e) => handleMakeChange(e.target.value)}
        >
          <option value="">Any make</option>
          {makes.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Model">
        <select
          className={controlClass}
          value={model}
          onChange={(e) => setModel(e.target.value)}
        >
          <option value="">Any model</option>
          {availableModels.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
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
        <select
          className={controlClass}
          value={bodyType}
          onChange={(e) => setBodyType(e.target.value)}
        >
          <option value="">Any body type</option>
          {BODY_TYPES.map((b) => (
            <option key={b} value={b}>
              {humanizeEnum(b)}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Fuel type">
        <select
          className={controlClass}
          value={fuelType}
          onChange={(e) => setFuelType(e.target.value)}
        >
          <option value="">Any fuel type</option>
          {FUEL_TYPES.map((f) => (
            <option key={f} value={f}>
              {humanizeEnum(f)}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Transmission">
        <select
          className={controlClass}
          value={transmission}
          onChange={(e) => setTransmission(e.target.value)}
        >
          <option value="">Any transmission</option>
          {TRANSMISSIONS.map((t) => (
            <option key={t} value={t}>
              {humanizeEnum(t)}
            </option>
          ))}
        </select>
      </Field>

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
