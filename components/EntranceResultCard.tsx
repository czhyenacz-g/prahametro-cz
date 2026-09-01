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
import { useI18n } from "./i18n/I18nContext.ts";

export type EntranceResultCardProps = {
  entrance: MetroEntrance;
  /** null = poloha není známá (např. detail stanice z mapy bez GPS) — vzdálenost/čas se nezobrazí. */
  distanceMeters: number | null;
};

export default function EntranceResultCard({ entrance, distanceMeters }: EntranceResultCardProps) {
  const { dict } = useI18n();
  const [showAltMenu, setShowAltMenu] = useState(false);
  const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const primaryUrl = primaryNavigationUrl(entrance, userAgent);
  const secondaryUrl = secondaryNavigationUrl(entrance, userAgent);
  const primaryIsApple = isApplePlatform(userAgent);

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

      <div className="mt-3 flex items-center gap-2">
        <a
          href={primaryUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-[48px] flex-1 items-center justify-center rounded-xl bg-gray-900 px-4 text-base font-semibold text-white transition hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
        >
          {dict.result.navigate}
        </a>
        <button
          type="button"
          onClick={() => setShowAltMenu((v) => !v)}
          aria-expanded={showAltMenu}
          aria-label={dict.result.openInOtherMap}
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
          {primaryIsApple ? dict.result.openInGoogleMaps : dict.result.openInAppleMaps}
        </a>
      )}

      <p className="mt-2 text-xs text-gray-400">{dict.result.disclaimer}</p>
    </div>
  );
}
