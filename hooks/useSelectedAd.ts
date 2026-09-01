"use client";

import { useEffect, useState } from "react";
import { campaigns } from "../lib/ads/campaigns.ts";
import { resolveSelectedAd } from "../lib/ads/select-ad.ts";
import type { AdResolutionState, Language } from "../lib/ads/types.ts";
import { getBrowserSessionStorage, safeGet, safeRemove, safeSet } from "../lib/storage/safe-storage.ts";

function storageKey(language: Language): string {
  return `kdejemetro:selected-ad:${language}`;
}

/**
 * Vybere reklamu jen jednou za React efekt (ne při každém renderu —
 * viz zadání) a drží ji stabilní v `sessionStorage` po zbytek návštěvy
 * pro daný jazyk. Server i první klientský render vrací `{status:
 * "pending"}`, teprve po mountu se doplní — stejný hydration-safe
 * vzorec jako I18nProvider (žádné čtení sessionStorage při SSR).
 * `pending` vs. `empty` (viz lib/ads/types.ts, `AdResolutionState`) je
 * důležité pro český fallback (components/ads/AdSlot.tsx) — bez toho
 * rozlišení by komponenta nevěděla, jestli ještě nemá vybráno, nebo už
 * ví, že žádná způsobilá kampaň není.
 *
 * `stationId` je `null`/`undefined` = stanice není známá — v aktuálním
 * umístění (pod výsledky hledání, které mohou patřit různým stanicím)
 * se proto nabízí jen obecné kampaně bez `stationIds` (viz
 * lib/ads/filter-campaigns.ts). Budoucí umístění vázané na jednu
 * konkrétní stanici může `stationId` předat.
 */
export function useSelectedAd(language: Language, stationId?: string | null): AdResolutionState {
  const [state, setState] = useState<AdResolutionState>({ status: "pending" });

  useEffect(() => {
    const storage = getBrowserSessionStorage();
    const key = storageKey(language);
    const storedId = safeGet(storage, key);
    const ctx = { language, now: new Date(), stationId };

    const selected = resolveSelectedAd(campaigns, storedId, ctx);

    if (selected) {
      if (selected.id !== storedId) {
        safeSet(storage, key, selected.id);
      }
      setState({ status: "selected", campaign: selected });
    } else {
      if (storedId) {
        // Uložené ID existovalo, ale žádná způsobilá kampaň (viz
        // filterCampaigns — třeba bez platného odkazu) mu neodpovídá —
        // ať se příště znovu nezkouší obnovit stejný neplatný výběr.
        safeRemove(storage, key);
      }
      setState({ status: "empty" });
    }
  }, [language, stationId]);

  return state;
}
