export type Locale = "cs" | "en" | "de" | "uk";

export const LOCALES: readonly Locale[] = ["cs", "en", "de", "uk"];

export const VULGAR_STORAGE_KEY = "kdejemetro_vulgar";

/** URL segment pod app/ (route group "(cs)" pro "" se na URL neprojeví) — viz zadání "/ua je URL, uk je locale". */
export type LocaleRoute = "" | "en" | "de" | "ua";

/** URL segment -> interní locale. Ukrajinská URL "/ua" (kód země) mapuje na jazykový locale "uk" (ISO 639-1 pro ukrajinštinu) — nikdy ne obráceně. */
export const routeToLocale = {
  "": "cs",
  en: "en",
  de: "de",
  ua: "uk",
} as const satisfies Record<LocaleRoute, Locale>;

/** Locale -> absolutní cesta od kořene (bez domény) — jediné místo, které zná mapování zpět, používá lib/i18n/dictionary.ts i components/i18n/LanguageMenu.tsx. */
export const localeToRoute = {
  cs: "/",
  en: "/en",
  de: "/de",
  uk: "/ua",
} as const satisfies Record<Locale, string>;
