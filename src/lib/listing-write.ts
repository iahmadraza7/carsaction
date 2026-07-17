import { Prisma } from "@prisma/client";

import type { ListingInput } from "@/lib/validations/listing";

/**
 * Map validated listing input to a Prisma data payload. Money fields become
 * Decimal (never float), optional fields collapse to null. Shared by the create
 * and edit routes so both persist listings identically.
 */
export function listingDataFromInput(input: ListingInput) {
  return {
    title: input.title,
    make: input.make,
    model: input.model,
    variant: input.variant ?? null,
    year: input.year,
    price: new Prisma.Decimal(input.price),
    mileage: input.mileage,
    bodyType: input.bodyType,
    fuelType: input.fuelType,
    transmission: input.transmission,
    engineCc: input.engineCc ?? null,
    colour: input.colour ?? null,
    regDate: input.regDate ?? null,
    coeExpiry: input.coeExpiry ?? null,
    depreciation: input.depreciation != null ? new Prisma.Decimal(input.depreciation) : null,
    omv: input.omv != null ? new Prisma.Decimal(input.omv) : null,
    arf: input.arf != null ? new Prisma.Decimal(input.arf) : null,
    description: input.description ?? null,
  };
}
