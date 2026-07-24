"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SearchIcon, SlidersHorizontalIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SG_MODELS_BY_MAKE } from "@/lib/sg-makes";
import {
  BODY_TYPES,
  FUEL_TYPES,
  TRANSMISSIONS,
  humanizeEnum,
} from "@/lib/listing-options";

const controlClass =
  "h-11 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

/**
 * Compact SGCM-style search strip for the landing page.
 * "Detailed search" expands the full filter set inline; still URL-driven.
 */
export function HomeSearch({ makes }: { makes: string[] }) {
  const router = useRouter();
  const [detailed, setDetailed] = React.useState(false);
  const [make, setMake] = React.useState("");
  const [model, setModel] = React.useState("");
  const [priceMin, setPriceMin] = React.useState("");
  const [priceMax, setPriceMax] = React.useState("");
  const [yearMin, setYearMin] = React.useState("");
  const [yearMax, setYearMax] = React.useState("");
  const [mileageMax, setMileageMax] = React.useState("");
  const [bodyType, setBodyType] = React.useState("");
  const [fuelType, setFuelType] = React.useState("");
  const [transmission, setTransmission] = React.useState("");

  const models = make ? (SG_MODELS_BY_MAKE[make] ?? []) : [];

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next = new URLSearchParams();
    if (make.trim()) next.set("make", make.trim());
    if (model.trim()) next.set("model", model.trim());
    if (priceMin.trim()) next.set("priceMin", priceMin.trim());
    if (priceMax.trim()) next.set("priceMax", priceMax.trim());
    if (yearMin.trim()) next.set("yearMin", yearMin.trim());
    if (yearMax.trim()) next.set("yearMax", yearMax.trim());
    if (mileageMax.trim()) next.set("mileageMax", mileageMax.trim());
    if (bodyType.trim()) next.set("bodyType", bodyType.trim());
    if (fuelType.trim()) next.set("fuelType", fuelType.trim());
    if (transmission.trim()) next.set("transmission", transmission.trim());
    const qs = next.toString();
    router.push(qs ? `/cars?${qs}` : "/cars");
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto w-full max-w-4xl rounded-2xl border bg-card p-4 shadow-sm"
    >
      <div className="grid gap-3 sm:grid-cols-[1.2fr_1fr_1fr_auto] sm:items-end">
        <label className="grid gap-1.5 text-left">
          <span className="text-xs font-medium text-muted-foreground">Make</span>
          <select
            className={controlClass}
            value={make}
            onChange={(e) => {
              setMake(e.target.value);
              setModel("");
            }}
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
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setDetailed((v) => !v)}
        >
          <SlidersHorizontalIcon />
          {detailed ? "Hide detailed search" : "Detailed search"}
        </Button>
        <Link
          href="/cars"
          className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Open full browse filters
        </Link>
      </div>

      {detailed ? (
        <div className="mt-4 grid gap-3 border-t pt-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="grid gap-1.5 text-left">
            <span className="text-xs font-medium text-muted-foreground">Model</span>
            <select
              className={controlClass}
              value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled={!make}
            >
              <option value="">Any model</option>
              {models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-left">
            <span className="text-xs font-medium text-muted-foreground">Year from</span>
            <input
              className={controlClass}
              type="number"
              inputMode="numeric"
              placeholder="e.g. 2018"
              value={yearMin}
              onChange={(e) => setYearMin(e.target.value)}
            />
          </label>
          <label className="grid gap-1.5 text-left">
            <span className="text-xs font-medium text-muted-foreground">Year to</span>
            <input
              className={controlClass}
              type="number"
              inputMode="numeric"
              placeholder="e.g. 2024"
              value={yearMax}
              onChange={(e) => setYearMax(e.target.value)}
            />
          </label>
          <label className="grid gap-1.5 text-left">
            <span className="text-xs font-medium text-muted-foreground">Max mileage (km)</span>
            <input
              className={controlClass}
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="e.g. 80000"
              value={mileageMax}
              onChange={(e) => setMileageMax(e.target.value)}
            />
          </label>
          <label className="grid gap-1.5 text-left">
            <span className="text-xs font-medium text-muted-foreground">Body type</span>
            <select
              className={controlClass}
              value={bodyType}
              onChange={(e) => setBodyType(e.target.value)}
            >
              <option value="">Any</option>
              {BODY_TYPES.map((b) => (
                <option key={b} value={b}>
                  {humanizeEnum(b)}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-left">
            <span className="text-xs font-medium text-muted-foreground">Fuel type</span>
            <select
              className={controlClass}
              value={fuelType}
              onChange={(e) => setFuelType(e.target.value)}
            >
              <option value="">Any</option>
              {FUEL_TYPES.map((f) => (
                <option key={f} value={f}>
                  {humanizeEnum(f)}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-left">
            <span className="text-xs font-medium text-muted-foreground">Transmission</span>
            <select
              className={controlClass}
              value={transmission}
              onChange={(e) => setTransmission(e.target.value)}
            >
              <option value="">Any</option>
              {TRANSMISSIONS.map((t) => (
                <option key={t} value={t}>
                  {humanizeEnum(t)}
                </option>
              ))}
            </select>
          </label>
          <div className="rounded-lg border border-dashed px-3 py-2 sm:col-span-2 lg:col-span-1">
            <p className="text-xs font-medium text-muted-foreground">Rental cars</p>
            <p className="text-sm text-muted-foreground">Coming soon</p>
          </div>
        </div>
      ) : null}
    </form>
  );
}
