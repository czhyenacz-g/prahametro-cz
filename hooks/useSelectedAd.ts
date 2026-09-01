"use client";

import { useEffect, useState } from "react";
import { campaigns } from "../lib/ads/campaigns.ts";
import { resolveSelectedAd } from "../lib/ads/select-ad.ts";
import type { AdCampaign, Language } from "../lib/ads/types.ts";
import { getBrowserSessionStorage, safeGet, safeSet } from "../lib/storage/safe-storage.ts";

function storageKey(language: Language): string {
  return `kdejemetro:selected-ad:${language}`;
}

/**
 * Vybere reklamu jen jednou za React efekt (ne při každém renderu —
 * viz zadání) a drží ji stabilní v `sessionStorage` po zbytek návštěvy
 * pro daný jazyk. Server i první klientský render vrací `null` (žádná
 * karta), teprve po mountu se doplní — stejný hydration-safe vzorec
 * jako I18nProvider (žádné čtení sessionStorage při SSR).
 *
 * `stationId` je `null`/`undefined` = stanice není známá — v aktuálním
 * umístění (pod výsledky hledání, které mohou patřit různým stanicím)
 * se proto nabízí jen obecné kampaně bez `stationIds` (viz
 * lib/ads/filter-campaigns.ts). Budoucí umístění vázané na jednu
 * konkrétní stanici může `stationId` předat.
 */
export function useSelectedAd(language: Language, stationId?: string | null): AdCampaign | null {
  const [ad, setAd] = useState<AdCampaign | null>(null);

  useEffect(() => {
    const storage = getBrowserSessionStorage();
    const key = storageKey(language);
    const storedId = safeGet(storage, key);
    const ctx = { language, now: new Date(), stationId };

    const selected = resolveSelectedAd(campaigns, storedId, ctx);

    if (selected && selected.id !== storedId) {
      safeSet(storage, key, selected.id);
    }

    setAd(selected);
  }, [language, stationId]);

  return ad;
}
