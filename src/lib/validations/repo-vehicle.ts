import { z } from "zod";
import { Prisma } from "@prisma/client";

import { BODY_TYPES } from "@/lib/listing-options";

const CURRENT_YEAR = new Date().getFullYear();

/** Treat empty form strings as "not provided" so optional fields validate cleanly. */
const emptyToUndef = (v: unknown) =>
  v === "" || v === null || v === undefined ? undefined : v;

const optionalMoney = z.preprocess(
  emptyToUndef,
  z.coerce.number().nonnegative().max(99_999_999).optional(),
);
const optionalDate = z.preprocess(emptyToUndef, z.coerce.date().optional());
const optionalText = (max: number) =>
  z.preprocess(emptyToUndef, z.string().trim().max(max).optional());

const requiredDateTime = z.preprocess(emptyToUndef, z.coerce.date());

export const repoVehicleSchema = z
  .object({
    make: z.string().trim().min(1, "Required").max(50),
    model: z.string().trim().min(1, "Required").max(50),
    year: z.preprocess(
      emptyToUndef,
      z.coerce.number().int().min(1970, "Enter a valid year").max(CURRENT_YEAR + 1),
    ),
    mileage: z.preprocess(
      emptyToUndef,
      z.coerce.number().int().nonnegative("Enter the mileage").max(2_000_000),
    ),
    bodyType: z.enum(BODY_TYPES),
    colour: optionalText(40),
    regDate: optionalDate,
    coeExpiry: optionalDate,
    condition: optionalText(200),
    location: optionalText(200),
    description: optionalText(5000),
    // CONFIDENTIAL: reserve price — finance owner / admin only. Never expose to dealers.
    reservePrice: optionalMoney,
    biddingOpensAt: requiredDateTime,
    biddingClosesAt: requiredDateTime,
    images: z
      .array(z.string().trim().min(1))
      .min(1, "Add at least one photo")
      .max(15, "Up to 15 photos"),
  })
  .superRefine((data, ctx) => {
    if (!(data.biddingClosesAt instanceof Date) || !(data.biddingOpensAt instanceof Date)) {
      return;
    }
    if (data.biddingClosesAt <= data.biddingOpensAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Close time must be after open time",
        path: ["biddingClosesAt"],
      });
    }
    if (data.biddingClosesAt.getTime() <= Date.now()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Close time must be in the future",
        path: ["biddingClosesAt"],
      });
    }
  });

export type RepoVehicleInput = z.infer<typeof repoVehicleSchema>;

/** String-shaped values used by the react-hook-form form (images handled separately). */
export interface RepoVehicleFormValues {
  make: string;
  model: string;
  year: string;
  mileage: string;
  bodyType: string;
  colour: string;
  regDate: string;
  coeExpiry: string;
  condition: string;
  location: string;
  description: string;
  reservePrice: string;
  biddingOpensAt: string;
  biddingClosesAt: string;
}

export const emptyRepoVehicleForm: RepoVehicleFormValues = {
  make: "",
  model: "",
  year: "",
  mileage: "",
  bodyType: "SEDAN",
  colour: "",
  regDate: "",
  coeExpiry: "",
  condition: "",
  location: "",
  description: "",
  reservePrice: "",
  biddingOpensAt: "",
  biddingClosesAt: "",
};

/** Map validated input to Prisma create/update data (images handled separately). */
export function repoVehicleDataFromInput(input: RepoVehicleInput) {
  return {
    make: input.make,
    model: input.model,
    year: input.year as number,
    mileage: input.mileage as number,
    bodyType: input.bodyType,
    colour: input.colour,
    regDate: input.regDate,
    coeExpiry: input.coeExpiry,
    condition: input.condition,
    location: input.location,
    description: input.description,
    // CONFIDENTIAL: reserve price — finance owner / admin only
    reservePrice:
      input.reservePrice != null ? new Prisma.Decimal(input.reservePrice) : null,
    biddingOpensAt: input.biddingOpensAt as Date,
    biddingClosesAt: input.biddingClosesAt as Date,
  };
}

/** Format a Date for datetime-local inputs (local timezone). */
export function toDatetimeLocalValue(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Format a Date for date inputs (YYYY-MM-DD). */
export function toDateInputValue(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
