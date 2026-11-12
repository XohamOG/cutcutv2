import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/how-it-works`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/keys`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/chat`, changeFrequency: "monthly", priority: 0.5 },
  ];
}
