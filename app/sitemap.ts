import type { MetadataRoute } from "next";
import { SITE_URL } from "./config/site.ts";

// Jediná indexovatelná stránka je homepage na kdejemetro.cz (viz zadání
// "sitemap musí obsahovat pouze URL na kdejemetro.cz") — `SITE_URL` je
// jediný zdroj pravdy pro doménu, nikdy hostname requestu.
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: SITE_URL, changeFrequency: "weekly", priority: 1 }];
}
