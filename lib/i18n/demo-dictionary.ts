import type { Locale } from "./types.ts";

// Záměrně MIMO hlavní Dictionary (lib/i18n/dictionary.ts) — ten je
// jeden objekt používaný napříč celou appkou, takže z něj bundler
// nemůže tree-shakovat jednotlivá pole (JS objekty jsou dynamické).
// DemoLocationPicker.tsx je jediné místo, které tenhle malý slovník
// importuje, a samo se v produkci nikdy nevykreslí (viz
// shouldShowDemoControls) — takže se s ním celý tenhle modul z
// produkčního bundlu odstraní (ověřeno reálným `next build`).
export const demoHeading: Record<Locale, string> = {
  cs: "Demo poloha (jen dev)",
  en: "Demo location (dev only)",
  de: "Demo-Standort (nur Entwicklung)",
  uk: "Демоположення (лише розробка)",
};
