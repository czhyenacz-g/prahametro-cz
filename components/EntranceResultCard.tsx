"use client";

import { Accessibility } from "lucide-react";
import { formatDistance, formatWalkingTime } from "../lib/metro/format-distance.ts";
import { LINE_BADGE_CLASS } from "../lib/metro/line-colors.ts";
import { buildAppleMapsWalkingUrl, buildGoogleMapsWalkingUrl, buildMapyComWalkingUrl } from "../lib/metro/navigation-links.ts";
import type { MetroEntrance } from "../lib/metro/types.ts";
import { useI18n } from "./i18n/I18nContext.ts";
import DeparturesButton from "./DeparturesButton.tsx";
import MapNavigationButtons from "./MapNavigationButtons.tsx";

export type EntranceResultCardProps = {
  entrance: MetroEntrance;
  /** null = poloha není známá (např. detail stanice z mapy bez GPS) — vzdálenost/čas se nezobrazí. */
  distanceMeters: number | null;
  /** Aktuální poloha uživatele — bez ní navigační tlačítka nejsou aktivní (viz zadání). */
  origin: { lat: number; lon: number } | null;
};

export default function EntranceResultCard({ entrance, distanceMeters, origin }: EntranceResultCardProps) {
  const { dict } = useI18n();

  // Navigace vždy na přesné GPS souřadnice KONKRÉTNÍHO vstupu (entrance),
  // nikdy na střed stanice — entrance už tyhle souřadnice nese přímo.
  const googleUrl = origin ? buildGoogleMapsWalkingUrl(origin, entrance) : null;
  const appleUrl = origin ? buildAppleMapsWalkingUrl(origin, entrance) : null;
  const mapyUrl = origin ? buildMapyComWalkingUrl(origin, entrance) : null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {/* Názvy stanic se nepřekládají (viz zadání) */}
          <p className="truncate text-lg font-bold text-gray-900 sm:text-xl">{entrance.stationName}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {entrance.lines.map((line) => (
              <span key={line} className={`rounded px-2 py-0.5 text-xs font-bold ${LINE_BADGE_CLASS[line]}`}>
                {line}
              </span>
            ))}
            <span className="text-sm font-medium text-gray-700 sm:text-base">{dict.result.entranceLabel(entrance.entranceLabel)}</span>
            {entrance.wheelchair === "yes" && (
              <span aria-label={dict.result.wheelchair} title={dict.result.wheelchair} className="text-navy-700">
                <Accessibility aria-hidden="true" size={20} strokeWidth={2.25} />
              </span>
            )}
          </div>
        </div>

        {distanceMeters !== null && (
          <div className="shrink-0 text-right">
            <p className="text-xl font-bold text-navy-900 sm:text-2xl">{formatDistance(distanceMeters)}</p>
            <p className="text-xs text-gray-500 sm:text-sm">{formatWalkingTime(distanceMeters)}</p>
          </div>
        )}
      </div>

      <MapNavigationButtons
        googleUrl={googleUrl}
        appleUrl={appleUrl}
        mapyUrl={mapyUrl}
        googleLabel={dict.result.googleMapsLabel}
        appleLabel={dict.result.appleMapsLabel}
        mapyLabel={dict.result.mapyComLabel}
        googleAriaLabel={dict.result.googleMapsAriaLabel}
        appleAriaLabel={dict.result.appleMapsAriaLabel}
        mapyAriaLabel={dict.result.mapyComAriaLabel}
      />

      {/* Pomocný řádek — "Odjezdy" je sekundární akce, vpravo pod
          trojicí navigačních tlačítek, ať s nimi nesoupeří o místo ani
          nezabere čtvrtou pozici v jejich řádku (viz zadání). */}
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="min-w-0 flex-1 text-xs text-gray-400">{dict.result.disclaimer}</p>
        <DeparturesButton stationId={entrance.stationId} stationName={entrance.stationName} />
      </div>
    </div>
  );
}
