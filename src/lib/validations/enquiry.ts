import { z } from "zod";

export const enquirySchema = z.object({
  listingId: z.string().min(1, "Missing listing"),
  name: z.string().trim().min(2, "Enter your name").max(100),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9][0-9\s-]{6,19}$/, "Enter a valid phone number"),
  message: z.string().trim().max(1000).optional(),
});
export type EnquiryInput = z.infer<typeof enquirySchema>;
