import { z } from "zod";

import { BODY_TYPES, FUEL_TYPES, TRANSMISSIONS } from "@/lib/listing-options";

const CURRENT_YEAR = new Date().getFullYear();

/** Treat empty form strings as "not provided" so optional fields validate cleanly. */
const emptyToUndef = (v: unknown) =>
  v === "" || v === null || v === undefined ? undefined : v;

const requiredMoney = z.preprocess(
  emptyToUndef,
  z.coerce.number().positive("Enter an amount greater than 0").max(99_999_999),
);
const optionalMoney = z.preprocess(
  emptyToUndef,
  z.coerce.number().nonnegative().max(99_999_999).optional(),
);
const optionalInt = z.preprocess(
  emptyToUndef,
  z.coerce.number().int().positive().max(100_000).optional(),
);
const optionalDate = z.preprocess(emptyToUndef, z.coerce.date().optional());
const optionalText = (max: number) =>
  z.preprocess(emptyToUndef, z.string().trim().max(max).optional());

export const listingSchema = z.object({
  title: z.string().trim().min(3, "Enter a listing title").max(150),
  make: z.string().trim().min(1, "Required").max(50),
  model: z.string().trim().min(1, "Required").max(50),
  variant: optionalText(80),
  year: z.preprocess(
    emptyToUndef,
    z.coerce.number().int().min(1970, "Enter a valid year").max(CURRENT_YEAR + 1),
  ),
  price: requiredMoney,
  mileage: z.preprocess(
    emptyToUndef,
    z.coerce.number().int().nonnegative("Enter the mileage").max(2_000_000),
  ),
  bodyType: z.enum(BODY_TYPES),
  fuelType: z.enum(FUEL_TYPES),
  transmission: z.enum(TRANSMISSIONS),
  engineCc: optionalInt,
  colour: optionalText(40),
  regDate: optionalDate,
  coeExpiry: optionalDate,
  depreciation: optionalMoney,
  omv: optionalMoney,
  arf: optionalMoney,
  description: optionalText(5000),
  images: z
    .array(z.string().trim().min(1))
    .min(1, "Add at least one photo")
    .max(15, "Up to 15 photos"),
});

export type ListingInput = z.infer<typeof listingSchema>;

export const saleSchema = z.object({
  salePrice: z.preprocess(
    emptyToUndef,
    z.coerce.number().positive("Enter the sale price").max(99_999_999),
  ),
  buyerName: optionalText(100),
  buyerPhone: z.preprocess(
    emptyToUndef,
    z
      .string()
      .trim()
      .regex(/^\+?[0-9][0-9\s-]{6,19}$/, "Enter a valid phone number")
      .optional(),
  ),
  notes: optionalText(1000),
});
export type SaleInput = z.infer<typeof saleSchema>;

/** String-shaped values used by the react-hook-form form (images handled separately). */
export interface ListingFormValues {
  title: string;
  make: string;
  model: string;
  variant: string;
  year: string;
  price: string;
  mileage: string;
  bodyType: string;
  fuelType: string;
  transmission: string;
  engineCc: string;
  colour: string;
  regDate: string;
  coeExpiry: string;
  depreciation: string;
  omv: string;
  arf: string;
  description: string;
}

export const emptyListingForm: ListingFormValues = {
  title: "",
  make: "",
  model: "",
  variant: "",
  year: String(CURRENT_YEAR),
  price: "",
  mileage: "",
  bodyType: "",
  fuelType: "",
  transmission: "",
  engineCc: "",
  colour: "",
  regDate: "",
  coeExpiry: "",
  depreciation: "",
  omv: "",
  arf: "",
  description: "",
};
