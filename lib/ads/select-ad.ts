import type { AdCampaign } from "./types.ts";
import { filterCampaigns, type AdFilterContext } from "./filter-campaigns.ts";
import { weightedSelect, type RandomSource } from "./weighted-select.ts";
import { getFallbackLanguage } from "./language-fallback.ts";

/**
 * Filtrování + vážený výběr, s deterministickým jazykovým fallbackem
 * (viz zadání bod 15 a lib/ads/language-fallback.ts) — nejdřív se
 * zkusí přesný jazyk stránky, a jen když pro něj není ŽÁDNÁ způsobilá
 * kampaň, zkusí se fallback jazyk (aktuálně jen de/uk → en). `null` =
 * ani primární, ani fallback množina nemá způsobilou kampaň.
 */
export function selectAd(campaigns: AdCampaign[], ctx: AdFilterContext, random: RandomSource = Math.random): AdCampaign | null {
  const primary = filterCampaigns(campaigns, ctx);
  if (primary.length > 0) return weightedSelect(primary, random);

  const fallbackLanguage = getFallbackLanguage(ctx.language);
  if (!fallbackLanguage) return null;

  const fallback = filterCampaigns(campaigns, { ...ctx, language: fallbackLanguage });
  return weightedSelect(fallback, random);
}

/** Je `campaign` způsobilá buď v primárním jazyce kontextu, nebo (pokud existuje) v jeho fallback jazyce. */
function isEligibleWithFallback(campaign: AdCampaign, ctx: AdFilterContext): boolean {
  if (filterCampaigns([campaign], ctx).length > 0) return true;

  const fallbackLanguage = getFallbackLanguage(ctx.language);
  if (!fallbackLanguage) return false;

  return filterCampaigns([campaign], { ...ctx, language: fallbackLanguage }).length > 0;
}

/**
 * Rozhodnutí "obnovit uloženou kampaň, nebo vybrat novou" — čistá
 * funkce oddělená od Reactu/sessionStorage I/O (viz
 * hooks/useSelectedAd.ts), aby šla otestovat bez DOM. Uložené ID se
 * použije JEN pokud daná kampaň pořád existuje, je zapnutá a projde
 * stejnými filtry jako běžný výběr — VČETNĚ jazykového fallbacku (viz
 * zadání "výběr během session nesmí poskakovat" — kampaň vybraná pro
 * němčinu přes anglický fallback musí zůstat platná i při přenačtení,
 * ne se nesmyslně přehodnotit jako "neplatná pro de").
 */
export function resolveSelectedAd(
  campaigns: AdCampaign[],
  storedId: string | null,
  ctx: AdFilterContext,
  random: RandomSource = Math.random
): AdCampaign | null {
  if (storedId) {
    const stored = campaigns.find((c) => c.id === storedId);
    if (stored && isEligibleWithFallback(stored, ctx)) {
      return stored;
    }
  }
  return selectAd(campaigns, ctx, random);
}
