import Link from "next/link";
import { HeartIcon } from "lucide-react";

import { auth } from "@/auth";
import { buttonVariants } from "@/components/ui/button";
import { LogoutButton } from "@/components/auth/logout-button";

function dashboardHref(role?: string) {
  if (role === "ADMIN") return "/admin/dashboard";
  if (role === "DEALER") return "/dealer/dashboard";
  if (role === "FINANCE_CO") return "/finance/dashboard";
  return null;
}

export async function SiteHeader() {
  const session = await auth();
  const user = session?.user;
  const dash = dashboardHref(user?.role);

  return (
    <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-5">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="inline-flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              C
            </span>
            <span className="hidden sm:inline">
              CARS<span className="-ml-1 text-primary">action</span>
            </span>
          </Link>
          <Link
            href="/cars"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Browse cars
          </Link>
          <Link
            href="/pricing"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Pricing
          </Link>
        </div>

        <nav className="flex items-center gap-2">
          {user ? (
            <>
              {user.role === "BUYER" ? (
                <Link
                  href="/favourites"
                  className={buttonVariants({ size: "sm", variant: "ghost" })}
                >
                  <HeartIcon />
                  <span className="hidden sm:inline">Favourites</span>
                </Link>
              ) : null}
              {dash ? (
                <Link
                  href={dash}
                  className={buttonVariants({ size: "sm", variant: "outline" })}
                >
                  Dashboard
                </Link>
              ) : null}
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
  );
}
