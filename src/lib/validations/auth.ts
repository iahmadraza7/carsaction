import { z } from "zod";

const email = z.string().trim().toLowerCase().email("Enter a valid email address");

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters");

// Loose international/SG phone format: optional +, digits, spaces, dashes.
const phone = z
  .string()
  .trim()
  .regex(/^\+?[0-9][0-9\s-]{6,19}$/, "Enter a valid phone number");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const buyerSignupSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your name").max(100),
    email,
    password,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type BuyerSignupInput = z.infer<typeof buyerSignupSchema>;

export const dealerSignupSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your name").max(100),
    email,
    password,
    confirmPassword: z.string(),
    businessName: z.string().trim().min(2, "Enter your business name").max(150),
    whatsappNumber: phone,
    uen: z.string().trim().max(20).optional(),
    address: z.string().trim().max(255).optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type DealerSignupInput = z.infer<typeof dealerSignupSchema>;

export const forgotPasswordSchema = z.object({ email });
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().min(10, "Invalid or missing reset token"),
    password,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
