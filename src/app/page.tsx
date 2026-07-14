import Link from "next/link";

import { auth } from "@/auth";
import { buttonVariants } from "@/components/ui/button";
import { LogoutButton } from "@/components/auth/logout-button";

function dashboardHref(role?: string) {
  if (role === "ADMIN") return "/admin/dashboard";
  if (role === "DEALER") return "/dealer/dashboard";
  if (role === "FINANCE_CO") return "/finance/dashboard";
  return "/";
}

export default async function Home() {
  const session = await auth();
  const user = session?.user;

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="inline-flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              C
            </span>
            CARS<span className="-ml-1 text-primary">action</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              href="/cars"
              className="mr-1 hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline"
            >
              Browse cars
            </Link>
            {user ? (
              <>
                <span className="hidden text-sm text-muted-foreground sm:inline">
                  {user.email}
                </span>
                <Link
                  href={dashboardHref(user.role)}
                  className={buttonVariants({ size: "sm", variant: "outline" })}
                >
                  Dashboard
                </Link>
                <LogoutButton />
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className={buttonVariants({ size: "sm", variant: "ghost" })}
                >
                  Sign in
                </Link>
                <Link href="/signup" className={buttonVariants({ size: "sm" })}>
                  Get started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-4 py-20 text-center">
        <span className="mb-5 inline-flex items-center rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
          Singapore car marketplace
        </span>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Buy and sell cars in Singapore, the transparent way.
        </h1>
        <p className="mt-5 max-w-2xl text-base text-muted-foreground text-pretty sm:text-lg">
          Flat monthly dealer subscriptions instead of per-car fees. Every listing shows COE
          expiry, depreciation, OMV and ARF — the numbers Singapore buyers actually compare.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <Link href="/cars" className={buttonVariants({ size: "lg" })}>
            Browse cars
          </Link>
          {user ? (
            <Link
              href={dashboardHref(user.role)}
              className={buttonVariants({ size: "lg", variant: "outline" })}
            >
              Go to your dashboard
            </Link>
          ) : (
            <Link
              href="/dealer/signup"
              className={buttonVariants({ size: "lg", variant: "outline" })}
            >
              Register your dealership
            </Link>
          )}
        </div>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground">
          <span>CARSaction — Singapore car marketplace</span>
          <span className="flex gap-4">
            <Link href="/cars" className="hover:text-foreground hover:underline">
              Browse cars
            </Link>
            <Link href="/pricing" className="hover:text-foreground hover:underline">
              Pricing
            </Link>
            <Link href="/dealer/signup" className="hover:text-foreground hover:underline">
              List with us
            </Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
