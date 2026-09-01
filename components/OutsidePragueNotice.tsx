"use client";

import { formatDistance } from "../lib/metro/format-distance.ts";
import { useI18n } from "./i18n/I18nContext.ts";

export type OutsidePragueNoticeProps = {
  nearestStationName: string;
  nearestDistanceMeters: number;
};

// Výrazná informační karta (ne jen drobné upozornění) — viz zadání.
// Vzdálenost je vždy vzdušná čára, nikdy neoznačená jako pěší trasa.
export default function OutsidePragueNotice({ nearestStationName, nearestDistanceMeters }: OutsidePragueNoticeProps) {
  const { dict } = useI18n();

  return (
    <div role="status" className="rounded-2xl border-2 border-amber-400 bg-amber-100 p-4 text-center shadow-sm">
      <p className="text-lg font-bold text-amber-900">{dict.outsidePrague.title}</p>
      <p className="mt-1 text-base text-amber-900">
        {dict.outsidePrague.body(nearestStationName, formatDistance(nearestDistanceMeters))}
      </p>
    </div>
  );
}
