import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { BrandMark } from "@/components/brand-mark";

export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      <BrandMark />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          That page doesn&apos;t exist or was moved.
        </p>
      </div>
      <div className="flex gap-2">
        <Link href="/cars" className={buttonVariants()}>
          Browse cars
        </Link>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Home
        </Link>
      </div>
    </main>
  );
}
