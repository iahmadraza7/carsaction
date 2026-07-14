import Link from "next/link";
import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = { title: "Reset password — CARSaction" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <AuthShell
      title="Set a new password"
      description="Choose a new password for your account"
      footer={
        <>
          Back to{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            sign in
          </Link>
        </>
      }
    >
      <ResetPasswordForm token={token ?? ""} />
    </AuthShell>
  );
}
