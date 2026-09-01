"use client";

import { formatDistance, formatWalkingTime } from "../lib/metro/format-distance.ts";
import { LINE_BADGE_CLASS } from "../lib/metro/line-colors.ts";
import { buildGoogleMapsWalkingUrl, buildMapyComWalkingUrl } from "../lib/metro/navigation-links.ts";
import type { MetroEntrance } from "../lib/metro/types.ts";
import { useI18n } from "./i18n/I18nContext.ts";

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
  const mapyUrl = origin ? buildMapyComWalkingUrl(origin, entrance) : null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          {/* Názvy stanic se nepřekládají (viz zadání) */}
          <p className="text-lg font-bold text-gray-900">{entrance.stationName}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {entrance.lines.map((line) => (
              <span key={line} className={`rounded px-2 py-0.5 text-xs font-bold ${LINE_BADGE_CLASS[line]}`}>
                {line}
              </span>
            ))}
            <span className="text-base font-medium text-gray-700">{dict.result.entranceLabel(entrance.entranceLabel)}</span>
            {entrance.wheelchair === "yes" && (
              <span aria-label={dict.result.wheelchair} title={dict.result.wheelchair} className="text-lg">
                ♿
              </span>
            )}
          </div>
        </div>

        {distanceMeters !== null && (
          <div className="shrink-0 text-right">
            <p className="text-lg font-bold text-gray-900">{formatDistance(distanceMeters)}</p>
            <p className="text-sm text-gray-500">{formatWalkingTime(distanceMeters)}</p>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <NavigationButton href={googleUrl} label={dict.result.googleMapsLabel} ariaLabel={dict.result.googleMapsAriaLabel} />
        <NavigationButton href={mapyUrl} label={dict.result.mapyComLabel} ariaLabel={dict.result.mapyComAriaLabel} />
      </div>

      <p className="mt-2 text-xs text-gray-400">{dict.result.disclaimer}</p>
    </div>
  );
}

function NavigationButton({ href, label, ariaLabel }: { href: string | null; label: string; ariaLabel: string }) {
  const baseClass =
    "flex min-h-[44px] flex-1 basis-[45%] items-center justify-center gap-1.5 rounded-xl px-3 text-base font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900";

  if (!href) {
    return (
      <button type="button" disabled aria-label={ariaLabel} className={`${baseClass} cursor-not-allowed border border-gray-200 bg-gray-100 text-gray-400`}>
        <span aria-hidden="true">📍</span>
        {label}
      </button>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      className={`${baseClass} border border-gray-900 bg-gray-900 text-white hover:bg-gray-700`}
    >
      <span aria-hidden="true">📍</span>
      {label}
    </a>
  );
}
