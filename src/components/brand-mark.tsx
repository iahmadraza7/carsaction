import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * CARSaction brand mark using the official logo asset (public/logo.png).
 * The PNG already includes the wordmark + tagline.
 */
export function BrandMark({
  className,
  showWordmark = true,
  compact = false,
}: {
  className?: string;
  /** Kept for API compatibility; the PNG already includes the wordmark. */
  showWordmark?: boolean;
  compact?: boolean;
}) {
  void showWordmark;
  return (
    <span className={cn("inline-flex items-center", className)}>
      <Image
        src="/logo.png"
        alt="CARSaction"
        width={compact ? 200 : 280}
        height={compact ? 64 : 90}
        priority
        className={cn(
          "h-14 w-auto object-contain object-left sm:h-16",
          compact && "h-11 sm:h-12",
        )}
      />
    </span>
  );
}

/** Small square mark for tight spots (uses the same logo). */
export function BrandGlyph({ className }: { className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="CARSaction"
      width={40}
      height={40}
      className={cn("size-10 shrink-0 object-contain", className)}
    />
  );
}
