import type { NextRequest } from "next/server";

import { handlers } from "@/auth";
import { enforceRateLimit } from "@/lib/rate-limit-http";

const { GET, POST: nextAuthPost } = handlers;

export { GET };

/** Rate-limit credential / OAuth callbacks to slow brute-force login attempts. */
export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, "nextauth", 30, 60_000);
  if (limited.response) return limited.response;
  return nextAuthPost(req);
}
