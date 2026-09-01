import type { MetadataRoute } from "next";
import { SITE_URL } from "./config/site.ts";

// Obě indexovatelné jazykové varianty homepage (viz zadání) — `SITE_URL`
// je jediný zdroj pravdy pro doménu, nikdy hostname requestu, takže
// preview prostředí se sem nikdy neprosáknou (SITE_URL tam padá zpět na
// vlastní *.vercel.app URL, viz app/config/site.ts).
const CS_URL = SITE_URL;
const EN_URL = `${SITE_URL}/en`;

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: CS_URL,
      changeFrequency: "weekly",
      priority: 1,
      alternates: { languages: { cs: CS_URL, en: EN_URL } },
    },
    {
      url: EN_URL,
      changeFrequency: "weekly",
      priority: 0.9,
      alternates: { languages: { cs: CS_URL, en: EN_URL } },
    },
  ];
}
