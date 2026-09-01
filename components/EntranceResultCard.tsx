"use client";

import { useState } from "react";
import { formatDistance, formatWalkingTime } from "../lib/metro/format-distance.ts";
import { LINE_BADGE_CLASS } from "../lib/metro/line-colors.ts";
import {
  isApplePlatform,
  primaryNavigationUrl,
  secondaryNavigationUrl,
} from "../lib/metro/navigation-links.ts";
import type { MetroEntrance } from "../lib/metro/types.ts";

export type EntranceResultCardProps = {
  entrance: MetroEntrance;
  /** null = poloha není známá (např. detail stanice z mapy bez GPS) — vzdálenost/čas se nezobrazí. */
  distanceMeters: number | null;
};

export default function EntranceResultCard({ entrance, distanceMeters }: EntranceResultCardProps) {
  const [showAltMenu, setShowAltMenu] = useState(false);
  const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const primaryUrl = primaryNavigationUrl(entrance, userAgent);
  const secondaryUrl = secondaryNavigationUrl(entrance, userAgent);
  const primaryIsApple = isApplePlatform(userAgent);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-gray-900">{entrance.stationName}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {entrance.lines.map((line) => (
              <span key={line} className={`rounded px-2 py-0.5 text-xs font-bold ${LINE_BADGE_CLASS[line]}`}>
                {line}
              </span>
            ))}
            <span className="text-sm text-gray-600">Vstup {entrance.entranceLabel}</span>
            {entrance.wheelchair === "yes" && (
              <span aria-label="Bezbariérový přístup" title="Bezbariérový přístup" className="text-base">
                ♿
              </span>
            )}
          </div>
        </div>

        {distanceMeters !== null && (
          <div className="shrink-0 text-right">
            <p className="text-sm font-semibold text-gray-900">{formatDistance(distanceMeters)}</p>
            <p className="text-xs text-gray-500">{formatWalkingTime(distanceMeters)}</p>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <a
          href={primaryUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-gray-900 px-4 text-sm font-semibold text-white transition hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
        >
          Navigovat ke vstupu
        </a>
        <button
          type="button"
          onClick={() => setShowAltMenu((v) => !v)}
          aria-expanded={showAltMenu}
          aria-label="Otevřít v jiné mapě"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
        >
          ⋯
        </button>
      </div>

      {showAltMenu && (
        <a
          href={secondaryUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 block text-center text-sm text-gray-600 underline hover:text-gray-900"
        >
          Otevřít v {primaryIsApple ? "Google Maps" : "Apple Maps"}
        </a>
      )}

      <p className="mt-2 text-[11px] text-gray-400">Vzdušná vzdálenost, orientační — skutečnou trasu ukáže navigace.</p>
    </div>
  );
}
