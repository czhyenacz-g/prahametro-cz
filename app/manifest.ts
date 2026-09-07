import type { MetadataRoute } from "next";
import { PWA_BACKGROUND_COLOR, PWA_DESCRIPTION, PWA_NAME, PWA_SHORT_NAME, PWA_THEME_COLOR } from "../lib/pwa/config.ts";

// Web App Manifest (viz zadání "Přidat na plochu") — Next.js App Router
// file convention, automaticky vystavené na /manifest.webmanifest a
// polinkované ve všech čtyřech jazykových root layoutech. Jediný cíl je
// instalovatelná ikonka na ploše (standalone okno), NE offline appka —
// proto žádný service worker (viz README, sekce PWA).
//
// `start_url`/`scope` zůstávají "/" (česká homepage) bez ohledu na to,
// odkud si appku uživatel nainstaluje (i z /en, /de, /ua) — jde o
// vědomé zjednodušení (jeden manifest pro celý web), ne přehlédnutí.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: PWA_NAME,
    short_name: PWA_SHORT_NAME,
    description: PWA_DESCRIPTION,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: PWA_BACKGROUND_COLOR,
    theme_color: PWA_THEME_COLOR,
    icons: [
      { src: "/pwa-icon-192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-icon-512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa-icon-512-maskable", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
