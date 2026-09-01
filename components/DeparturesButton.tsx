"use client";

import { useState } from "react";
import { Clock } from "lucide-react";
import { useI18n } from "./i18n/I18nContext.ts";
import DeparturesPanel from "./DeparturesPanel.tsx";

export type DeparturesButtonProps = {
  stationId: string;
  stationName: string;
};

/**
 * Malé sekundární tlačítko "Odjezdy" (viz zadání) — nikdy nesoupeří s
 * trojicí navigačních tlačítek, žije v pomocném řádku karty
 * (components/EntranceResultCard.tsx). Vykresluje se pro KAŽDOU
 * stanici appky bez podmínky, protože import (scripts/import-pid-gtfs.ts)
 * garantuje, že každá stanice v data/metro-entrances.json má
 * odpovídající public/data/departures/{stationId}.json — jinak import
 * SELŽE (viz lib/gtfs/validate-departures-coverage.ts), takže žádná
 * reálně nasazená stanice nemůže tlačítko zobrazit bez dat. Selhání
 * samotného fetch (síť, edge case) řeší chybový stav uvnitř
 * DeparturesPanel.tsx, ne skrytí tlačítka.
 */
export default function DeparturesButton({ stationId, stationName }: DeparturesButtonProps) {
  const { dict } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={dict.departures.buttonAriaLabel(stationName)}
        className="flex min-h-[44px] min-w-[44px] items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-navy-700 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-900 sm:text-sm"
      >
        <Clock aria-hidden="true" size={16} strokeWidth={2.25} className="shrink-0" />
        {dict.departures.buttonLabel}
      </button>
      {open && <DeparturesPanel stationId={stationId} stationName={stationName} onClose={() => setOpen(false)} />}
    </>
  );
}
