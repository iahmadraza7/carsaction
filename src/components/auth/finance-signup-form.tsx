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
import { financeSignupSchema, type FinanceSignupInput } from "@/lib/validations/auth";

export function FinanceSignupForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FinanceSignupInput>({ resolver: zodResolver(financeSignupSchema) });

  async function onSubmit(values: FinanceSignupInput) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/register-finance", {
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
            setError(field as keyof FinanceSignupInput, { message: messages?.[0] });
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
        toast.success("Finance account created. Please sign in.");
        router.push("/login");
        return;
      }
      toast.success("Welcome to CARSaction");
      router.push("/finance/dashboard");
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
        placeholder="you@finance.com"
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
          Company details
        </p>
      </div>
      <TextField
        label="Company name"
        placeholder="SG Finance Pte Ltd"
        error={errors.companyName?.message}
        {...register("companyName")}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          label="UEN"
          placeholder="201812345A"
          hint="Required — we use this to verify your company."
          error={errors.uen?.message}
          {...register("uen")}
        />
        <TextField
          label="Contact person"
          placeholder="Operations desk"
          hint="Optional"
          error={errors.contactPerson?.message}
          {...register("contactPerson")}
        />
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting ? "Creating finance account…" : "Create finance account"}
      </Button>
    </form>
  );
}
