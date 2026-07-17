/**
 * Shared JSON 429 response for auth / abuse-sensitive routes.
 */
import { NextResponse } from "next/server";

import { clientIp, rateLimit, type RateLimitResult } from "@/lib/rate-limit";

export function enforceRateLimit(
  req: Request,
  bucket: string,
  limit: number,
  windowMs: number,
): RateLimitResult & { response?: NextResponse } {
  const ip = clientIp(req);
  const result = rateLimit(`${bucket}:${ip}`, limit, windowMs);
  if (result.ok) return result;

  return {
    ...result,
    response: NextResponse.json(
      { error: "Too many requests. Please wait and try again." },
      {
        status: 429,
        headers: {
          "Retry-After": String(result.retryAfterSec),
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": "0",
        },
      },
    ),
  };
}
