"use client";

import { useI18n } from "../i18n/I18nContext.ts";

/**
 * Malé klikací "P+R" tlačítko vedle jména stanice — čte se jako "Stanice
 * (P+R)" (viz zadání). Není vnořené do jiného odkazu/tlačítka (karta
 * stanice žádný takový obal nemá), takže může být plnohodnotné klikací
 * tlačítko, ne jen informační odznak + samostatný odkaz vedle. Po
 * kliknutí zavolá `onOpen`, který v HomeClient.tsx: 1) otevře P+R
 * sekci, 2) nastaví vybranou stanici, 3) přesune focus na detail (viz
 * components/parking/ParkAndRideSection.tsx).
 */
export default function ParkAndRideBadge({ stationId, stationName, onOpen }: { stationId: string; stationName: string; onOpen: (stationId: string) => void }) {
  const { dict } = useI18n();

  return (
    <button
      type="button"
      onClick={() => onOpen(stationId)}
      aria-label={dict.parkAndRide.badgeAriaLabel(stationName)}
      className="rounded border-2 border-navy-900 bg-navy-50 px-2 py-1 text-xs font-bold text-navy-900 transition hover:bg-navy-900 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-900"
    >
      {dict.parkAndRide.badgeLabel}
    </button>
  );
}
