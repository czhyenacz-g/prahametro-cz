import { DEFAULT_LOCALE, type Locale } from "./types.ts";

/**
 * Čistá funkce (žádné volání navigatoru přímo tady) — testovatelná bez
 * DOM. Výchozí je čeština, angličtina jen když prohlížeč začíná na "en"
 * (viz zadání "pro anglický prohlížeč použij angličtinu").
 */
export function detectBrowserLocale(navigatorLanguage: string | null | undefined): Locale {
  if (navigatorLanguage?.toLowerCase().startsWith("en")) return "en";
  return DEFAULT_LOCALE;
}
