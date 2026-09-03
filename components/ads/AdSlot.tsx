"use client";

import { useSelectedAd } from "../../hooks/useSelectedAd.ts";
import { resolveSlotContent } from "../../lib/ads/resolve-slot-content.ts";
import type { AdCampaign } from "../../lib/ads/types.ts";
import { useI18n } from "../i18n/I18nContext.ts";
import NamedayGreeting from "../NamedayGreeting.tsx";
import AdCard from "./AdCard.tsx";

export type AdSlotProps = {
  /** Kandidáti pro tenhle placement, už staženi server-side z Content API (viz lib/promotions/get-promotions.ts a components/HomePage.tsx/night/NightPage.tsx) — AdSlot sám žádný network request nedělá. */
  campaigns: AdCampaign[];
  placement: string;
  stationId?: string | null;
};

/**
 * Rozhoduje mezi reklamou a českým fallback přáním se jmeninami (viz
 * zadání, rozhodovací logika samotná je v lib/ads/resolve-slot-content.ts
 * jako čistá testovatelná funkce) — AdCard.tsx zůstává čistě reklamní
 * komponenta (nic o jmeninách neví), NamedayGreeting.tsx čistě
 * informační (nic o reklamách neví).
 */
export default function AdSlot({ campaigns, placement, stationId }: AdSlotProps) {
  const { locale } = useI18n();
  const resolution = useSelectedAd(campaigns, locale, stationId);
  const content = resolveSlotContent(resolution, locale);

  switch (content.kind) {
    case "pending":
    case "none":
      return null;
    case "ad":
      return <AdCard campaign={content.campaign} placement={placement} />;
    case "nameday":
      return <NamedayGreeting />;
  }
}
