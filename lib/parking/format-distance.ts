import type { Locale } from "../i18n/types.ts";

const INTL_LOCALE: Record<Locale, string> = { cs: "cs-CZ", en: "en-US", de: "de-DE", uk: "uk-UA" };

/**
 * Vzdušná vzdálenost k P+R, lokalizovaná (desetinný oddělovač — čárka
 * cs/de/uk, tečka en, viz zadání "správný desetinný oddělovač"). Vlastní
 * malá funkce místo sdíleného `lib/metro/format-distance.ts::formatDistance`
 * — ten je natvrdo `cs-CZ` i pro cizojazyčné stránky (existující chování
 * appky mimo scope týhle změny, neopravujeme ho tady).
 */
export function formatStraightLineDistance(meters: number, locale: Locale): string {
  const intlLocale = INTL_LOCALE[locale];
  if (meters < 1000) return `${Math.round(meters)} m`;

  const km = meters / 1000;
  return `${km.toLocaleString(intlLocale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`;
}
