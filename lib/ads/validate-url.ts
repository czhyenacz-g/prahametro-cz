/**
 * Povolí JEN absolutní https: URL (viz zadání) — `new URL()` bez base
 * automaticky vyhodí na relativních cestách i syntakticky neplatných
 * řetězcích, takže je stačí odchytit. Zakazuje http:, javascript:,
 * data: i cokoliv jiného než https:.
 */
export function isValidAffiliateUrl(url: string | null | undefined): url is string {
  if (!url) return false;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  return parsed.protocol === "https:";
}

export const AD_LINK_REL = "sponsored noopener noreferrer";
