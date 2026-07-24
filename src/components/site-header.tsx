import Link from "next/link";
import { HeartIcon } from "lucide-react";

import { auth } from "@/auth";
import { buttonVariants } from "@/components/ui/button";
import { LogoutButton } from "@/components/auth/logout-button";
import { BrandMark } from "@/components/brand-mark";

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
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:py-3.5">
        <div className="flex min-w-0 items-center gap-3 sm:gap-5">
          <Link href="/" className="flex shrink-0 items-center" aria-label="CARSaction home">
            <BrandMark />
          </Link>
          <Link
            href="/cars"
            className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline"
          >
            Browse cars
          </Link>
          <Link
            href="/pricing"
            className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground md:inline"
          >
            Dealer plans
          </Link>
        </div>

        <nav className="flex shrink-0 items-center gap-1.5 sm:gap-2">
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
              <Link
                href="/signup"
                className={buttonVariants({ size: "sm", variant: "outline" })}
              >
                <span className="sm:hidden">Buy</span>
                <span className="hidden sm:inline">Sign up to buy</span>
              </Link>
              <Link href="/dealer/signup" className={buttonVariants({ size: "sm" })}>
                <span className="sm:hidden">Sell</span>
                <span className="hidden sm:inline">Sell as a dealer</span>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
