import { z } from "zod";
import { Prisma } from "@prisma/client";

const emptyToUndef = (v: unknown) =>
  v === "" || v === null || v === undefined ? undefined : v;

/**
 * Bid amount in SGD: positive, max 2 decimal places.
 * Accepts string or number from the form / JSON body.
 */
export const bidAmountSchema = z.preprocess(
  emptyToUndef,
  z
    .union([z.string(), z.number()])
    .transform((v, ctx) => {
      const raw = typeof v === "number" ? String(v) : v.trim();
      if (!/^\d+(\.\d{1,2})?$/.test(raw)) {
        ctx.addIssue({
          code: "custom",
          message: "Enter a valid amount with at most 2 decimal places",
        });
        return z.NEVER;
      }
      const n = Number(raw);
      if (!Number.isFinite(n) || n <= 0) {
        ctx.addIssue({ code: "custom", message: "Enter a bid greater than 0" });
        return z.NEVER;
      }
      if (n > 99_999_999) {
        ctx.addIssue({ code: "custom", message: "Bid is too large" });
        return z.NEVER;
      }
      return new Prisma.Decimal(raw);
    }),
);

export const placeBidSchema = z.object({
  repoVehicleId: z.string().min(1, "Vehicle is required"),
  amount: bidAmountSchema,
});

export type PlaceBidInput = z.infer<typeof placeBidSchema>;
