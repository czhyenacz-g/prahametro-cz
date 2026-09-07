import type { Metadata, Viewport } from "next";

// Jediné místo s brandingem pro "Přidat na plochu" (Web App Manifest,
// <meta name="theme-color">, Apple Web App metadata) — viz app/manifest.ts
// a app/{(cs),en,de,ua}/layout.tsx. Barvy NEJSOU vymyšlené nanovo, jsou
// převzaté z tailwind.config.ts (navy-900 = primární barva tlačítek/CTA
// v aktuálním designu, gray-50 = skutečné pozadí <body> ve všech layoutech).
export const PWA_NAME = "KdeJeMetro.cz";
export const PWA_SHORT_NAME = "Metro";
export const PWA_DESCRIPTION =
  "Najděte nejbližší vstup do pražského metra a nechte se k němu navigovat pěšky. Teď i jako appka na ploše telefonu.";

/** = tailwind.config.ts colors.navy[900] — stejná barva jako hlavní CTA tlačítko (FinderSection.tsx). */
export const PWA_THEME_COLOR = "#0D1626";
/** = Tailwind gray-50, stejné pozadí <body> jako ve všech root layoutech. */
export const PWA_BACKGROUND_COLOR = "#F9FAFB";

export const PWA_VIEWPORT: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: PWA_THEME_COLOR,
};

/**
 * appleWebApp metadata (viz zadání bod 4) — sdílené mezi všemi čtyřmi
 * jazykovými "root" layouty (app/(cs)/layout.tsx atd.), protože žádný
 * sdílený app/layout.tsx neexistuje (viz README, "multiple root
 * layouts"). `title` je krátký název pod ikonou na ploše — stejný jako
 * short_name v manifestu, ne celá doména.
 */
export const PWA_APPLE_WEB_APP_METADATA: NonNullable<Metadata["appleWebApp"]> = {
  capable: true,
  statusBarStyle: "default",
  title: PWA_SHORT_NAME,
};
