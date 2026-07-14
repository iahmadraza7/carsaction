import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { auth } from "@/auth";
import { googleEnabled } from "@/auth.config";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = { title: "Create account — CARSaction" };

export default async function SignupPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <AuthShell
      title="Create your account"
      description="Save favourites and enquire on cars"
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <SignupForm googleEnabled={googleEnabled} />
      <p className="text-center text-xs text-muted-foreground">
        Want to sell cars?{" "}
        <Link href="/dealer/signup" className="font-medium text-primary hover:underline">
          Register as a dealer
        </Link>
      </p>
    </AuthShell>
  );
}
