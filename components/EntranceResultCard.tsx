"use client";

import { Accessibility, Map, MapPin, Navigation } from "lucide-react";
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

      <div className="mt-3 grid grid-cols-3 gap-1.5 sm:gap-2">
        <NavigationButton href={googleUrl} label={dict.result.googleMapsLabel} ariaLabel={dict.result.googleMapsAriaLabel} variant="google" icon={MapPin} />
        <NavigationButton href={appleUrl} label={dict.result.appleMapsLabel} ariaLabel={dict.result.appleMapsAriaLabel} variant="apple" icon={Navigation} />
        <NavigationButton href={mapyUrl} label={dict.result.mapyComLabel} ariaLabel={dict.result.mapyComAriaLabel} variant="mapy" icon={Map} />
      </div>

      <p className="mt-2 text-xs text-gray-400">{dict.result.disclaimer}</p>
    </div>
  );
}

type NavigationVariant = "google" | "apple" | "mapy";

// Barevné odlišení podle služby (ne loga — viz zadání) — každá má svou
// rozpoznatelnou identitu: Google modrá, Apple tmavě námořnická
// (sjednocená s designovými tokeny appky, ne čistě černá), Mapy.com
// zelená (Seznam Mapy).
const VARIANT_CLASS: Record<NavigationVariant, string> = {
  google: "border-2 border-[#4285F4] bg-white text-[#4285F4] hover:bg-[#4285F4]/10",
  apple: "border-2 border-navy-900 bg-navy-900 text-white hover:bg-navy-800",
  mapy: "border-2 border-emerald-700 bg-emerald-700 text-white hover:bg-emerald-800",
};

function NavigationButton({
  href,
  label,
  ariaLabel,
  variant,
  icon: Icon,
}: {
  href: string | null;
  label: string;
  ariaLabel: string;
  variant: NavigationVariant;
  icon: typeof MapPin;
}) {
  const baseClass =
    "flex min-h-[44px] w-full items-center justify-center gap-1 rounded-xl px-1.5 text-center text-xs font-bold leading-tight transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-900 sm:gap-1.5 sm:px-2 sm:text-sm";

  if (!href) {
    return (
      <button type="button" disabled aria-label={ariaLabel} className={`${baseClass} cursor-not-allowed border-2 border-gray-200 bg-gray-100 text-gray-400`}>
        <Icon aria-hidden="true" size={16} strokeWidth={2.25} className="shrink-0" />
        <span className="truncate">{label}</span>
      </button>
    );
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={ariaLabel} className={`${baseClass} ${VARIANT_CLASS[variant]}`}>
      <Icon aria-hidden="true" size={16} strokeWidth={2.25} className="shrink-0" />
      <span className="truncate">{label}</span>
    </a>
  );
}
