import type { Locale } from "./types.ts";

/**
 * Locale -> absolutní cesta noční sekce (zadání bod 2) — samostatná
 * mapa od `localeToRoute` (lib/i18n/types.ts, homepage), protože noční
 * URL segmenty jsou jazykově přeložené ("nocni-mhd"/"night-transport"/
 * "nachtverkehr"/"nichnyi-transport"), ne stejné jako homepage. Použij
 * v `LanguageMenu`'s `routeMap` prop na nočních stránkách (zadání
 * "jazykové menu na noční stránce musí přejít na odpovídající noční
 * route, nikoliv na běžnou homepage").
 */
export const NIGHT_LOCALE_TO_ROUTE = {
  cs: "/nocni-mhd",
  en: "/en/night-transport",
  de: "/de/nachtverkehr",
  uk: "/ua/nichnyi-transport",
} as const satisfies Record<Locale, string>;
