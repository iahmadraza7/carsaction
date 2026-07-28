import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { auth } from "@/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { FinanceSignupForm } from "@/components/auth/finance-signup-form";

export const metadata: Metadata = { title: "Finance company sign up | CARSaction" };

export default async function FinanceSignupPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <AuthShell
      title="Register your finance company"
      description="List repossessed vehicles for sealed dealer bidding."
      footer={
        <>
          Already registered?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <FinanceSignupForm />
    </AuthShell>
  );
}
