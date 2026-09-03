import type { AdCampaign, Language } from "./types.ts";
import { hasValidAffiliateUrl } from "./validate-url.ts";

export type AdFilterContext = {
  language: Language;
  /** Aktuální čas — vždy explicitně předaný, ne `new Date()` uvnitř (viz zadání "čistá funkce"). */
  now: Date;
  /** null/undefined = stanice není známá (viz zadání bod 6). */
  stationId?: string | null;
};

function hasRequiredTexts(campaign: AdCampaign, language: Language): boolean {
  return Boolean(campaign.title[language]?.trim() && campaign.description[language]?.trim() && campaign.cta[language]?.trim());
}

/**
 * ISO 8601 datum porovnané v UTC (`Date.getTime()`), nikdy jako
 * lexikografický string (viz zadání). Neplatný/nevalidovaný datumový
 * řetězec v konfiguraci kampaň bezpečně vyřadí, nikdy nespadne.
 */
function isWithinValidity(campaign: AdCampaign, now: Date): boolean {
  const nowMs = now.getTime();

  if (campaign.validFrom) {
    const fromMs = new Date(campaign.validFrom).getTime();
    if (Number.isNaN(fromMs) || nowMs < fromMs) return false;
  }
  if (campaign.validTo) {
    const toMs = new Date(campaign.validTo).getTime();
    if (Number.isNaN(toMs) || nowMs > toMs) return false;
  }
  return true;
}

/**
 * Kampaň bez `stationIds` je "obecná" a platí pro každou stanici (viz
 * zadání) — bez ohledu na to, jestli aktuální stanici známe. Kampaň SE
 * `stationIds` potřebuje známou a odpovídající stanici, jinak se
 * vyřadí (i když je stanice neznámá — nemůžeme potvrdit shodu).
 */
function matchesStation(campaign: AdCampaign, stationId: string | null | undefined): boolean {
  if (!campaign.stationIds || campaign.stationIds.length === 0) return true;
  if (!stationId) return false;
  return campaign.stationIds.includes(stationId);
}

/**
 * Kampaně způsobilé k výběru, v tomto přesném pořadí filtrů (viz
 * zadání): zapnutá, jazyk, kompletní texty, platnost data, cílení na
 * stanici, a nakonec platný https: affiliate odkaz — kampaň bez
 * platného odkazu (href: null, prázdný/whitespace řetězec, http:,
 * javascript:, data:, file:, relativní cesta) se NIKDY nesmí dostat do
 * množiny kandidátů pro vážený výběr (viz lib/ads/weighted-select.ts),
 * i když ji Content API dál vrací jako existující promotion (reklamy se
 * dnes spravují přes content-api.darbujan.com/admin/promotions, viz
 * lib/promotions/get-promotions.ts) — správce jen ještě nedoplnil odkaz.
 */
export function filterCampaigns(campaigns: AdCampaign[], ctx: AdFilterContext): AdCampaign[] {
  return campaigns.filter((campaign) => {
    if (!campaign.enabled) return false;
    if (!campaign.languages.includes(ctx.language)) return false;
    if (!hasRequiredTexts(campaign, ctx.language)) return false;
    if (!isWithinValidity(campaign, ctx.now)) return false;
    if (!matchesStation(campaign, ctx.stationId)) return false;
    if (!hasValidAffiliateUrl(campaign)) return false;
    return true;
  });
}
