"use client";

import { forwardRef, useState } from "react";
import { LINE_BADGE_CLASS } from "../../lib/metro/line-colors.ts";
import type { MetroLine } from "../../lib/metro/types.ts";
import { resolveDrivingDestination, buildAppleMapsDrivingUrl, buildGoogleMapsDrivingUrl, buildMapyComDrivingUrl } from "../../lib/parking/driving-navigation-links.ts";
import { formatStraightLineDistance } from "../../lib/parking/format-distance.ts";
import { resolveOccupancyDisplay } from "../../lib/parking/occupancy-display.ts";
import { czechPlaceCount, englishPlaceCount, germanPlaceCount, germanPlaceCountDative, ukrainianPlaceCount } from "../../lib/parking/pluralize.ts";
import type { ParkAndRideWithOccupancy } from "../../lib/parking/types.ts";
import type { Locale } from "../../lib/i18n/types.ts";
import { useI18n } from "../i18n/I18nContext.ts";
import MapNavigationButtons from "../MapNavigationButtons.tsx";

const PLACE_COUNT: Record<Locale, (n: number) => string> = {
  cs: czechPlaceCount,
  en: englishPlaceCount,
  de: germanPlaceCount,
  uk: ukrainianPlaceCount,
};

// Pro "X z Y {míst}" potřebuje němčina dativ ("von X Plätzen") — jiné
// jazyky mají po předložce stejný tvar jako samostatný počet (viz
// lib/i18n/dictionary.ts komentář u `freeOfTotal`).
const TOTAL_PLACE_COUNT_AFTER_PREPOSITION: Record<Locale, (n: number) => string> = {
  cs: czechPlaceCount,
  en: englishPlaceCount,
  de: germanPlaceCountDative,
  uk: ukrainianPlaceCount,
};

export type ParkAndRideCardProps = {
  parkAndRide: ParkAndRideWithOccupancy;
  stationName: string;
  stationLines: MetroLine[];
  fetchFailed: boolean;
  /** Vzdušná vzdálenost OD UŽIVATELE (ne k metru) — počítaná lokálně v ParkAndRideSection.tsx, `null` bez známé polohy. */
  distanceFromUserMeters: number | null;
};

/**
 * `forwardRef` kvůli focus managementu — po kliknutí na P+R badge u karty
 * stanice (ParkAndRideBadge.tsx) se focus přesune sem (viz
 * ParkAndRideSection.tsx, `tabIndex={-1}` na kořenovém elementu).
 */
const ParkAndRideCard = forwardRef<HTMLElement, ParkAndRideCardProps>(function ParkAndRideCard(
  { parkAndRide, stationName, stationLines, fetchFailed, distanceFromUserMeters },
  ref
) {
  const { locale, dict } = useI18n();
  // Počítá se jednou při mountu karty (stejný vzor jako DeparturesPanel.tsx)
  // — jen pro dopočet "aktualizováno před X minutami" u zastaralého měření,
  // žádný tikající interval (appka obsazenost neanimuje, viz zadání).
  const [now] = useState(() => new Date());

  const occupancy = resolveOccupancyDisplay(parkAndRide, parkAndRide.occupancy, fetchFailed, now);
  const destination = resolveDrivingDestination(parkAndRide);
  const origin = null; // Navigace autem nikdy nevyžaduje polohu uživatele (viz zadání) — appka ji sem záměrně neposílá.

  const placeCount = PLACE_COUNT[locale];
  const totalPlaceCountAfterPreposition = TOTAL_PLACE_COUNT_AFTER_PREPOSITION[locale];

  return (
    <article
      ref={ref}
      tabIndex={-1}
      className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-900"
    >
      <p className="text-base font-bold text-gray-900 sm:text-lg">{parkAndRide.name}</p>
      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-gray-600">
        {stationLines.map((line) => (
          <span key={line} className={`rounded px-1.5 py-0.5 text-[11px] font-bold ${LINE_BADGE_CLASS[line]}`}>
            {line}
          </span>
        ))}
        <span>{dict.parkAndRide.nearStation(stationName)}</span>
      </div>

      {parkAndRide.address && <p className="mt-1 text-sm text-gray-500">{parkAndRide.address}</p>}

      <div className="mt-2">
        <OccupancyLine occupancy={occupancy} placeCount={placeCount} totalPlaceCountAfterPreposition={totalPlaceCountAfterPreposition} now={now} />
      </div>

      {parkAndRide.priceLabel && <p className="mt-1 text-sm text-gray-700">{parkAndRide.priceLabel}</p>}

      {distanceFromUserMeters !== null && (
        <p className="mt-1 text-sm text-gray-500">{dict.parkAndRide.distanceFromYou(formatStraightLineDistance(distanceFromUserMeters, locale))}</p>
      )}

      <MapNavigationButtons
        googleUrl={buildGoogleMapsDrivingUrl(origin, destination)}
        appleUrl={buildAppleMapsDrivingUrl(origin, destination)}
        mapyUrl={buildMapyComDrivingUrl(origin, destination)}
        googleLabel={dict.result.googleMapsLabel}
        appleLabel={dict.result.appleMapsLabel}
        mapyLabel={dict.result.mapyComLabel}
        googleAriaLabel={dict.parkAndRide.drivingGoogleMapsAriaLabel}
        appleAriaLabel={dict.parkAndRide.drivingAppleMapsAriaLabel}
        mapyAriaLabel={dict.parkAndRide.drivingMapyComAriaLabel}
      />
    </article>
  );
});

export default ParkAndRideCard;

function OccupancyLine({
  occupancy,
  placeCount,
  totalPlaceCountAfterPreposition,
  now,
}: {
  occupancy: ReturnType<typeof resolveOccupancyDisplay>;
  placeCount: (n: number) => string;
  totalPlaceCountAfterPreposition: (n: number) => string;
  now: Date;
}) {
  const { dict } = useI18n();

  if (occupancy.kind === "load-error") {
    return (
      <div>
        <p className="text-sm font-medium text-gray-500">{dict.parkAndRide.loadErrorNotice}</p>
        {occupancy.capacity !== null && <p className="text-sm text-gray-500">{dict.parkAndRide.capacityLabel(placeCount(occupancy.capacity))}</p>}
      </div>
    );
  }

  if (occupancy.kind === "unmeasured") {
    return (
      <div>
        <p className="text-sm text-gray-500">{dict.parkAndRide.unmeasuredNotice}</p>
        {occupancy.capacity !== null && <p className="text-sm text-gray-500">{dict.parkAndRide.capacityLabel(placeCount(occupancy.capacity))}</p>}
      </div>
    );
  }

  if (occupancy.kind === "stale") {
    const minutesAgo = Math.max(0, Math.round((now.getTime() - new Date(occupancy.updatedAt).getTime()) / 60_000));
    return (
      <div>
        <p className="text-sm font-medium text-gray-700">{dict.parkAndRide.staleNotice(occupancy.freeSpaces)}</p>
        <p className="text-xs text-gray-400">{dict.parkAndRide.updatedAgoMinutes(minutesAgo)}</p>
      </div>
    );
  }

  const BAND_CLASS: Record<typeof occupancy.band, string> = {
    green: "border-green-300 bg-green-50 text-green-800",
    orange: "border-orange-300 bg-orange-50 text-orange-800",
    red: "border-red-300 bg-red-50 text-red-800",
  };

  return (
    <p className={`inline-block rounded-lg border px-2 py-1 text-sm font-semibold ${BAND_CLASS[occupancy.band]}`}>
      {dict.parkAndRide.freeOfTotal(occupancy.freeSpaces, totalPlaceCountAfterPreposition(occupancy.totalSpaces))}
    </p>
  );
}
