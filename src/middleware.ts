import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Edge-safe auth instance: JWT session only, no adapter, no Node APIs.
const { auth } = NextAuth(authConfig);

type Guard = { prefix: string; role: string; allow: string[] };

const GUARDS: Guard[] = [
  { prefix: "/dealer", role: "DEALER", allow: ["/dealer/signup"] },
  { prefix: "/admin", role: "ADMIN", allow: [] },
  { prefix: "/finance", role: "FINANCE_CO", allow: [] },
];

export default auth((req) => {
  const { nextUrl } = req;
  const path = nextUrl.pathname;
  const session = req.auth;

  for (const guard of GUARDS) {
    const inScope = path === guard.prefix || path.startsWith(`${guard.prefix}/`);
    if (!inScope) continue;

    // Public exceptions (e.g. dealer signup lives under /dealer).
    if (guard.allow.includes(path)) return;

    // Not authenticated -> send to login with a callback URL.
    if (!session?.user) {
      const loginUrl = new URL("/login", nextUrl);
      loginUrl.searchParams.set("callbackUrl", `${path}${nextUrl.search}`);
      return Response.redirect(loginUrl);
    }

    // Authenticated but wrong role -> blocked, back to home.
    if (session.user.role !== guard.role) {
      return Response.redirect(new URL("/", nextUrl));
    }

    return;
  }
});

export const config = {
  matcher: ["/dealer/:path*", "/admin/:path*", "/finance/:path*"],
};
