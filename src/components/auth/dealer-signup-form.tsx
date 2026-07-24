"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TextField } from "@/components/auth/text-field";
import { dealerSignupSchema, type DealerSignupInput } from "@/lib/validations/auth";

export function DealerSignupForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<DealerSignupInput>({ resolver: zodResolver(dealerSignupSchema) });

  async function onSubmit(values: DealerSignupInput) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/register-dealer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        if (res.status === 409) {
          setError("email", { message: data?.error ?? "Email already in use" });
        } else if (data?.errors) {
          for (const [field, messages] of Object.entries(
            data.errors as Record<string, string[]>,
          )) {
            setError(field as keyof DealerSignupInput, { message: messages?.[0] });
          }
        } else {
          toast.error(data?.error ?? "Something went wrong. Please try again.");
        }
        return;
      }

      const login = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });
      if (!login || login.error) {
        toast.success("Dealer account created. Please sign in.");
        router.push("/login");
        return;
      }
      toast.success("Welcome to CARSaction");
      router.push("/dealer/dashboard");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Your account
        </p>
      </div>
      <TextField
        label="Contact name"
        autoComplete="name"
        placeholder="Marcus Tan"
        error={errors.name?.message}
        {...register("name")}
      />
      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="you@business.com"
        error={errors.email?.message}
        {...register("email")}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          error={errors.password?.message}
          {...register("password")}
        />
        <TextField
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          placeholder="Re-enter"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />
      </div>

      <Separator className="my-1" />
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Business details
        </p>
      </div>
      <TextField
        label="Business name"
        placeholder="Prestige Auto Pte Ltd"
        error={errors.businessName?.message}
        {...register("businessName")}
      />
      <TextField
        label="WhatsApp number"
        placeholder="+65 9123 4567"
        hint="Buyers will contact you here from your listings."
        error={errors.whatsappNumber?.message}
        {...register("whatsappNumber")}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          label="UEN"
          placeholder="201812345A"
          hint="Required — we use this to verify your dealership."
          error={errors.uen?.message}
          {...register("uen")}
        />
        <TextField
          label="Showroom address"
          placeholder="10 Ubi Ave 3, Singapore"
          hint="Optional"
          error={errors.address?.message}
          {...register("address")}
        />
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting ? "Creating dealer account…" : "Create dealer account"}
      </Button>
    </form>
  );
}
