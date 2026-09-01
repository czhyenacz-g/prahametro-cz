import type { MetadataRoute } from "next";
import { SITE_URL } from "./config/site.ts";

// Všechny čtyři indexovatelné jazykové varianty homepage (viz zadání) —
// `SITE_URL` je jediný zdroj pravdy pro doménu, nikdy hostname requestu,
// takže preview prostředí se sem nikdy neprosáknou (SITE_URL tam padá
// zpět na vlastní *.vercel.app URL, viz app/config/site.ts).
const CS_URL = SITE_URL;
const EN_URL = `${SITE_URL}/en`;
const DE_URL = `${SITE_URL}/de`;
const UA_URL = `${SITE_URL}/ua`;

// klíče jsou hreflang kódy (uk, ne ua — viz zadání), hodnoty jsou
// skutečné URL (/ua).
const LANGUAGES = { cs: CS_URL, en: EN_URL, de: DE_URL, uk: UA_URL };

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: CS_URL, changeFrequency: "weekly", priority: 1, alternates: { languages: LANGUAGES } },
    { url: EN_URL, changeFrequency: "weekly", priority: 0.9, alternates: { languages: LANGUAGES } },
    { url: DE_URL, changeFrequency: "weekly", priority: 0.9, alternates: { languages: LANGUAGES } },
    { url: UA_URL, changeFrequency: "weekly", priority: 0.9, alternates: { languages: LANGUAGES } },
  ];
}
