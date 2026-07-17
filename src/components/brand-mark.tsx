import { cn } from "@/lib/utils";

/**
 * CARSaction wordmark. A speed-slashed "C" badge plus the wordmark, drawn as
 * inline SVG/markup so it stays crisp at any size and needs no image request.
 */
export function BrandMark({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <BrandGlyph className="size-7" />
      {showWordmark ? (
        <span className="text-lg font-bold tracking-tight text-foreground">
          CARS<span className="text-primary">action</span>
        </span>
      ) : null}
    </span>
  );
}

export function BrandGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      role="img"
      aria-label="CARSaction"
      className={cn("shrink-0", className)}
    >
      <rect width="32" height="32" rx="8" fill="var(--primary)" />
      <path
        d="M21.5 11.2a7 7 0 1 0 0 9.6"
        fill="none"
        stroke="var(--primary-foreground)"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M23 13.2h4.5M21.5 16h6M23 18.8h4.5"
        stroke="var(--primary-foreground)"
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity="0.9"
      />
    </svg>
  );
}
