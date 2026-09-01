import type { AdCampaign } from "./types.ts";

/**
 * Povolí JEN absolutní https: URL (viz zadání) — `new URL()` bez base
 * automaticky vyhodí na relativních cestách i syntakticky neplatných
 * řetězcích, takže je stačí odchytit. Zakazuje http:, javascript:,
 * data:, file: i cokoliv jiného než https:. Ořezávání whitespace je jen
 * pro účely validace (řetězec sám o sobě, např. campaign.href, se tím
 * nemění a nikam zpět neserializuje).
 */
export function isValidAffiliateUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  const trimmed = url.trim();
  if (!trimmed) return false;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return false;
  }

  return parsed.protocol === "https:";
}

/**
 * Kampaň je způsobilá k zobrazení jen s platným https: affiliate
 * odkazem (viz lib/ads/filter-campaigns.ts) — samostatná čistá funkce,
 * ať jde způsobilost kampaně otestovat nezávisle na filtrování podle
 * jazyka/data/cílení.
 */
export function hasValidAffiliateUrl(campaign: AdCampaign): boolean {
  return isValidAffiliateUrl(campaign.href);
}

export const AD_LINK_REL = "sponsored noopener noreferrer";
