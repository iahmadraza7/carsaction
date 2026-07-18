import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { auth } from "@/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { DealerSignupForm } from "@/components/auth/dealer-signup-form";

export const metadata: Metadata = { title: "Dealer sign up | CARSaction" };

export default async function DealerSignupPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <AuthShell
      title="Register your dealership"
      description="Flat monthly subscriptions. Predictable cost. List your inventory."
      footer={
        <>
          Already registered?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <DealerSignupForm />
    </AuthShell>
  );
}
