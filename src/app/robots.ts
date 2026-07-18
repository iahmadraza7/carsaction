import type { MetadataRoute } from "next";

// Runtime: AUTH_URL / NEXT_PUBLIC_APP_URL come from the container .env
export const dynamic = "force-dynamic";

function appBaseUrl(): string {
  return (
    process.env.AUTH_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "https://carsaction.sg"
  );
}

export default function robots(): MetadataRoute.Robots {
  const base = appBaseUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/dealer/", "/api/", "/favourites", "/finance/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
