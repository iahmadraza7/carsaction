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
import { GoogleButton } from "@/components/auth/google-button";
import { buyerSignupSchema, type BuyerSignupInput } from "@/lib/validations/auth";

export function SignupForm({ googleEnabled = false }: { googleEnabled?: boolean }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<BuyerSignupInput>({ resolver: zodResolver(buyerSignupSchema) });

  async function onSubmit(values: BuyerSignupInput) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/register", {
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
            setError(field as keyof BuyerSignupInput, { message: messages?.[0] });
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
        toast.success("Account created. Please sign in.");
        router.push("/login");
        return;
      }
      toast.success("Welcome to CARSaction");
      router.push("/");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <TextField
          label="Full name"
          autoComplete="name"
          placeholder="Jane Tan"
          error={errors.name?.message}
          {...register("name")}
        />
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register("email")}
        />
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
          placeholder="Re-enter your password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? "Creating account…" : "Create account"}
        </Button>
      </form>

      {googleEnabled ? (
        <>
          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">or</span>
            <Separator className="flex-1" />
          </div>
          <GoogleButton callbackUrl="/" label="Sign up with Google" />
        </>
      ) : null}
    </div>
  );
}
