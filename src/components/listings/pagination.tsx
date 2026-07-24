import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

type Props = {
  page: number;
  totalPages: number;
  /** Current query params (excluding page) to preserve across pages. */
  baseParams: Record<string, string | string[]>;
};

function hrefFor(page: number, baseParams: Record<string, string | string[]>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(baseParams)) {
    if (Array.isArray(v)) {
      for (const item of v) sp.append(k, item);
    } else if (v) {
      sp.set(k, v);
    }
  }
  if (page > 1) sp.set("page", String(page));
  const qs = sp.toString();
  return qs ? `/cars?${qs}` : "/cars";
}

export function Pagination({ page, totalPages, baseParams }: Props) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav className="flex items-center justify-center gap-1" aria-label="Pagination">
      <Link
        href={hrefFor(page - 1, baseParams)}
        aria-disabled={page <= 1}
        className={cn(
          buttonVariants({ variant: "outline", size: "icon-sm" }),
          page <= 1 && "pointer-events-none opacity-50",
        )}
      >
        <ChevronLeftIcon />
        <span className="sr-only">Previous page</span>
      </Link>

      {pages.map((p) => (
        <Link
          key={p}
          href={hrefFor(p, baseParams)}
          aria-current={p === page ? "page" : undefined}
          className={buttonVariants({
            variant: p === page ? "default" : "outline",
            size: "icon-sm",
          })}
        >
          {p}
        </Link>
      ))}

      <Link
        href={hrefFor(page + 1, baseParams)}
        aria-disabled={page >= totalPages}
        className={cn(
          buttonVariants({ variant: "outline", size: "icon-sm" }),
          page >= totalPages && "pointer-events-none opacity-50",
        )}
      >
        <ChevronRightIcon />
        <span className="sr-only">Next page</span>
      </Link>
    </nav>
  );
}
