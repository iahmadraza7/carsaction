const SGD = new Intl.NumberFormat("en-SG", {
  style: "currency",
  currency: "SGD",
  maximumFractionDigits: 0,
});

const SGD_PRECISE = new Intl.NumberFormat("en-SG", {
  style: "currency",
  currency: "SGD",
  maximumFractionDigits: 0,
});

const NUM = new Intl.NumberFormat("en-SG");

/** SGD with no cents, e.g. "S$78,800". */
export function formatPrice(value: number | null | undefined): string {
  if (value == null) return "—";
  return SGD.format(value);
}

/** SGD per year, e.g. "S$11,200/yr". */
export function formatDepreciation(value: number | null | undefined): string {
  if (value == null) return "—";
  return `${SGD_PRECISE.format(value)}/yr`;
}

/** Thousands-separated km, e.g. "68,000 km". */
export function formatMileage(km: number | null | undefined): string {
  if (km == null) return "—";
  return `${NUM.format(km)} km`;
}

/** e.g. "Mar 2019". */
export function formatMonthYear(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-SG", { month: "short", year: "numeric" });
}

/** e.g. "14 Jul 2026". */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });
}
