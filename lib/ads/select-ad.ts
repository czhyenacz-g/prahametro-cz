import type { AdCampaign } from "./types.ts";
import { filterCampaigns, type AdFilterContext } from "./filter-campaigns.ts";
import { weightedSelect, type RandomSource } from "./weighted-select.ts";

/** Filtrování + vážený výběr v jednom kroku. `null` = žádná kampaň neodpovídá. */
export function selectAd(campaigns: AdCampaign[], ctx: AdFilterContext, random: RandomSource = Math.random): AdCampaign | null {
  const eligible = filterCampaigns(campaigns, ctx);
  return weightedSelect(eligible, random);
}

/**
 * Rozhodnutí "obnovit uloženou kampaň, nebo vybrat novou" — čistá
 * funkce oddělená od Reactu/sessionStorage I/O (viz
 * hooks/useSelectedAd.ts), aby šla otestovat bez DOM. Uložené ID se
 * použije JEN pokud daná kampaň pořád existuje, je zapnutá a projde
 * stejnými filtry jako běžný výběr (viz zadání "pokud uložená kampaň
 * již neexistuje, není aktivní nebo neodpovídá filtrům, vyber novou").
 */
export function resolveSelectedAd(
  campaigns: AdCampaign[],
  storedId: string | null,
  ctx: AdFilterContext,
  random: RandomSource = Math.random
): AdCampaign | null {
  if (storedId) {
    const stored = campaigns.find((c) => c.id === storedId);
    if (stored && filterCampaigns([stored], ctx).length > 0) {
      return stored;
    }
  }
  return selectAd(campaigns, ctx, random);
}
