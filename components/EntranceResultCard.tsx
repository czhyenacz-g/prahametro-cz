"use client";

import { formatDistance, formatWalkingTime } from "../lib/metro/format-distance.ts";
import { LINE_BADGE_CLASS } from "../lib/metro/line-colors.ts";
import { buildAppleMapsWalkingUrl, buildGoogleMapsWalkingUrl, buildMapyComWalkingUrl } from "../lib/metro/navigation-links.ts";
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
  const appleUrl = origin ? buildAppleMapsWalkingUrl(origin, entrance) : null;
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
        <NavigationButton href={googleUrl} label={dict.result.googleMapsLabel} ariaLabel={dict.result.googleMapsAriaLabel} variant="google" />
        <NavigationButton href={appleUrl} label={dict.result.appleMapsLabel} ariaLabel={dict.result.appleMapsAriaLabel} variant="apple" />
        <NavigationButton href={mapyUrl} label={dict.result.mapyComLabel} ariaLabel={dict.result.mapyComAriaLabel} variant="mapy" />
      </div>

      <p className="mt-2 text-xs text-gray-400">{dict.result.disclaimer}</p>
    </div>
  );
}

type NavigationVariant = "google" | "apple" | "mapy";

// Barevné odlišení podle služby (ne loga — viz zadání) — každá má svou
// rozpoznatelnou identitu: Google modrá, Apple černobílá minimalistická,
// Mapy.com zelená (Seznam Mapy).
const VARIANT_CLASS: Record<NavigationVariant, string> = {
  google: "border-2 border-[#4285F4] bg-white text-[#4285F4] hover:bg-[#4285F4]/10",
  apple: "border-2 border-gray-900 bg-gray-900 text-white hover:bg-gray-700",
  mapy: "border-2 border-emerald-700 bg-emerald-700 text-white hover:bg-emerald-800",
};

function NavigationButton({
  href,
  label,
  ariaLabel,
  variant,
}: {
  href: string | null;
  label: string;
  ariaLabel: string;
  variant: NavigationVariant;
}) {
  const baseClass =
    "flex min-h-[44px] min-w-[92px] flex-1 basis-[30%] items-center justify-center rounded-xl px-2 text-center text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 sm:text-base";

  if (!href) {
    return (
      <button type="button" disabled aria-label={ariaLabel} className={`${baseClass} cursor-not-allowed border-2 border-gray-200 bg-gray-100 text-gray-400`}>
        {label}
      </button>
    );
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={ariaLabel} className={`${baseClass} ${VARIANT_CLASS[variant]}`}>
      {label}
    </a>
  );
}
