import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { auth } from "@/auth";
import { googleEnabled } from "@/auth.config";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Sign in | CARSaction" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const session = await auth();
  const { callbackUrl, error } = await searchParams;

  // Suspended users get bounced here; don't bounce them back into the app.
  if (session?.user && !session.user.suspended && error !== "suspended") {
    redirect(callbackUrl || "/");
  }

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
      {error === "suspended" ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-center text-sm text-destructive">
          This account has been suspended. Contact support if you think this is a mistake.
        </p>
      ) : null}
      <LoginForm
        callbackUrl={callbackUrl || "/"}
        googleEnabled={googleEnabled}
        accountSuspended={error === "suspended" || Boolean(session?.user?.suspended)}
      />
      <p className="text-center text-xs text-muted-foreground">
        Are you a dealer?{" "}
        <Link href="/dealer/signup" className="font-medium text-primary hover:underline">
          Register your dealership
        </Link>
      </p>
    </AuthShell>
  );
}
