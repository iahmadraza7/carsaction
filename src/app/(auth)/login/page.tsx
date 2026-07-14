import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { auth } from "@/auth";
import { googleEnabled } from "@/auth.config";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Sign in — CARSaction" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  const { callbackUrl } = await searchParams;

  if (session?.user) redirect(callbackUrl || "/");

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to your CARSaction account"
      footer={
        <>
          New to CARSaction?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm callbackUrl={callbackUrl || "/"} googleEnabled={googleEnabled} />
      <p className="text-center text-xs text-muted-foreground">
        Are you a dealer?{" "}
        <Link href="/dealer/signup" className="font-medium text-primary hover:underline">
          Register your dealership
        </Link>
      </p>
    </AuthShell>
  );
}
