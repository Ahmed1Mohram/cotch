import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
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

  return [
    {
      url: `${base}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
