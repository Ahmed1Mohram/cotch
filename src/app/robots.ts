import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = (() => {
    const fallback = "http://localhost:3000";
    const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();

    if (!raw) return fallback;

    try {
      return new URL(raw).origin;
    } catch {
      try {
        return new URL(`https://${raw}`).origin;
      } catch {
        return fallback;
      }
    }
  })();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
