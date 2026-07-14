// Plain constants shared by server and client (no Prisma import, so these are
// safe to use inside client components without pulling Prisma into the bundle).

export const BODY_TYPES = [
  "SEDAN",
  "SUV",
  "HATCHBACK",
  "MPV",
  "COUPE",
  "WAGON",
  "VAN",
  "TRUCK",
] as const;
export type BodyTypeValue = (typeof BODY_TYPES)[number];

export const FUEL_TYPES = ["PETROL", "DIESEL", "HYBRID", "ELECTRIC"] as const;
export type FuelTypeValue = (typeof FUEL_TYPES)[number];

export const TRANSMISSIONS = ["AUTO", "MANUAL"] as const;
export type TransmissionValue = (typeof TRANSMISSIONS)[number];

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "mileage_asc", label: "Mileage: low to high" },
] as const;
export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export const DEFAULT_SORT: SortValue = "newest";
export const PAGE_SIZE = 12;

/** Turn an ENUM_VALUE into a display label, e.g. "SUV" -> "SUV", "HATCHBACK" -> "Hatchback". */
export function humanizeEnum(value: string): string {
  const acronyms = new Set(["SUV", "MPV", "VAN"]);
  if (acronyms.has(value)) return value;
  return value.charAt(0) + value.slice(1).toLowerCase();
}

export function isBodyType(v: string): v is BodyTypeValue {
  return (BODY_TYPES as readonly string[]).includes(v);
}
export function isFuelType(v: string): v is FuelTypeValue {
  return (FUEL_TYPES as readonly string[]).includes(v);
}
export function isTransmission(v: string): v is TransmissionValue {
  return (TRANSMISSIONS as readonly string[]).includes(v);
}
export function isSort(v: string): v is SortValue {
  return SORT_OPTIONS.some((o) => o.value === v);
}
