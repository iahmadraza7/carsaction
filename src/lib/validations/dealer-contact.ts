import { z } from "zod";

const phone = z
  .string()
  .trim()
  .regex(/^\+?[0-9][0-9\s-]{6,19}$/, "Enter a valid phone number");

export const dealerContactSchema = z.object({
  name: z.string().trim().min(2, "Enter a name").max(100),
  phone,
  whatsappEnabled: z.boolean().default(true),
});

export type DealerContactInput = z.infer<typeof dealerContactSchema>;

export const dealerContactsReorderSchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1),
});
