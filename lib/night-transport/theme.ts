export type NightTheme = "dark" | "light";

/** Nezávislé na `VULGAR_STORAGE_KEY` (lib/i18n/types.ts) — týká se JEN noční sekce (zadání bod 13 "změna se týká pouze noční sekce"). */
export const NIGHT_THEME_STORAGE_KEY = "kdejemetro_night_theme";

/** Výchozí vzhled noční stránky, i pro SSR/první klientský render — "dark" (zadání "výchozí noční stránka může použít noční vzhled"), beze změny podle uloženého stavu, ať nevznikne hydration mismatch (viz hooks/useNightTheme.ts). */
export const DEFAULT_NIGHT_THEME: NightTheme = "dark";

export function isValidNightTheme(value: string | null): value is NightTheme {
  return value === "dark" || value === "light";
}
