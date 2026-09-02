"use client";

import { formatDistance, formatWalkingTime } from "../../lib/metro/format-distance.ts";
import { formatClockTime } from "../../lib/departures/format-clock.ts";
import { buildAppleMapsWalkingUrl, buildGoogleMapsWalkingUrl, buildMapyComWalkingUrl } from "../../lib/metro/navigation-links.ts";
import type { MergedNightDeparture } from "../../lib/night-transport/merge-departures.ts";
import MapNavigationButtons from "../MapNavigationButtons.tsx";

export type NightResultCardProps = {
  groupName: string;
  distanceMeters: number;
  /** Nejbližší SKUTEČNÝ fyzický označník, ze kterého jede relevantní noční spoj (zadání bod 7/12) — nikdy střed skupiny. */
  platform: { lat: number; lon: number; platformCode: string };
  origin: { lat: number; lon: number };
  departures: MergedNightDeparture[];
  scheduledDeparturesLabel: string;
  towardsLabel: (headsign: string) => string;
  platformLabel: (code: string) => string;
  disclaimer: string;
  googleMapsLabel: string;
  appleMapsLabel: string;
  mapyComLabel: string;
  googleMapsAriaLabel: string;
  appleMapsAriaLabel: string;
  mapyComAriaLabel: string;
};

/**
 * Výsledková karta noční zastávkové skupiny (zadání bod 10) — vizuálně
 * navazuje na components/EntranceResultCard.tsx (stejné `rounded-2xl
 * border bg-white shadow-sm`, stejná trojice navigačních tlačítek přes
 * MapNavigationButtons), ale místo jedné linky/vstupu ukazuje sloučené
 * chronologické odjezdy napříč liniemi (viz lib/night-transport/merge-departures.ts).
 */
export default function NightResultCard({
  groupName,
  distanceMeters,
  platform,
  origin,
  departures,
  scheduledDeparturesLabel,
  towardsLabel,
  platformLabel,
  disclaimer,
  googleMapsLabel,
  appleMapsLabel,
  mapyComLabel,
  googleMapsAriaLabel,
  appleMapsAriaLabel,
  mapyComAriaLabel,
}: NightResultCardProps) {
  // Navigace vždy na přesné GPS souřadnice zvoleného nástupiště, nikdy
  // na střed skupiny. Neplatné souřadnice (zadání bod 24 "mapovací
  // službu nelze otevřít") se v praxi nemůžou stát — import je vyřadí
  // (viz build-night-dataset.ts) — try/catch je jen obranná pojistka,
  // ať appka i v nepravděpodobném okrajovém případě zobrazí zakázané
  // tlačítko namísto pádu.
  function safeUrl(build: (o: typeof origin, d: typeof platform) => string): string | null {
    try {
      return build(origin, platform);
    } catch {
      return null;
    }
  }
  const googleUrl = safeUrl(buildGoogleMapsWalkingUrl);
  const appleUrl = safeUrl(buildAppleMapsWalkingUrl);
  const mapyUrl = safeUrl(buildMapyComWalkingUrl);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-lg font-bold text-gray-900 dark:text-white sm:text-xl">{groupName}</p>
          {platform.platformCode && <p className="mt-0.5 text-sm text-gray-500 dark:text-slate-400">{platformLabel(platform.platformCode)}</p>}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xl font-bold text-navy-900 dark:text-white sm:text-2xl">{formatDistance(distanceMeters)}</p>
          <p className="text-xs text-gray-500 dark:text-slate-400 sm:text-sm">{formatWalkingTime(distanceMeters)}</p>
        </div>
      </div>

      <div className="mt-3">
        <p className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-slate-400">{scheduledDeparturesLabel}</p>
        <ul className="mt-1.5 flex flex-col gap-1.5">
          {departures.map((departure, index) => (
            <li key={`${departure.lineShortName}-${departure.secondsSinceTodayMidnight}-${index}`} className="flex items-center gap-2.5">
              <span
                className="flex h-6 min-w-[2rem] shrink-0 items-center justify-center rounded px-1.5 text-xs font-bold"
                style={{ backgroundColor: `#${departure.colorHex}`, color: `#${departure.textColorHex}` }}
              >
                {departure.lineShortName}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-gray-700 dark:text-slate-300">{towardsLabel(departure.headsign)}</span>
              <span className="shrink-0 font-mono text-base font-bold tabular-nums text-gray-900 dark:text-white">{formatClockTime(departure.secondsSinceTodayMidnight)}</span>
            </li>
          ))}
        </ul>
      </div>

      <MapNavigationButtons
        googleUrl={googleUrl}
        appleUrl={appleUrl}
        mapyUrl={mapyUrl}
        googleLabel={googleMapsLabel}
        appleLabel={appleMapsLabel}
        mapyLabel={mapyComLabel}
        googleAriaLabel={googleMapsAriaLabel}
        appleAriaLabel={appleMapsAriaLabel}
        mapyAriaLabel={mapyComAriaLabel}
      />

      <p className="mt-2 text-xs text-gray-400 dark:text-slate-500">{disclaimer}</p>
    </div>
  );
}
