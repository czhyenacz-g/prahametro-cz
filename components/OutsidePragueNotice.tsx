"use client";

import { TriangleAlert } from "lucide-react";
import { formatDistance } from "../lib/metro/format-distance.ts";
import { useI18n } from "./i18n/I18nContext.ts";

export type OutsidePragueNoticeProps = {
  nearestStationName: string;
  nearestDistanceMeters: number;
  /** True když je uživatel zároveň max. 30 km od středu Brna (viz lib/metro/brno.ts) — hravá varianta hlášky. */
  isBrno: boolean;
};

// Výrazná informační karta (ne jen drobné upozornění) — viz zadání.
// Teplá oranžová, ne agresivní červená (ta je vyhrazená pro chyby
// geolokace ve StatusMessage). Vzdálenost je vždy vzdušná čára, nikdy
// neoznačená jako pěší trasa.
export default function OutsidePragueNotice({ nearestStationName, nearestDistanceMeters, isBrno }: OutsidePragueNoticeProps) {
  const { dict } = useI18n();
  const distance = formatDistance(nearestDistanceMeters);
  const title = isBrno ? dict.outsidePrague.brnoTitle : dict.outsidePrague.title;
  const body = isBrno ? dict.outsidePrague.brnoBody(nearestStationName, distance) : dict.outsidePrague.body(nearestStationName, distance);

  return (
    <div role="status" className="flex items-start gap-3 rounded-2xl border border-orange-300 bg-orange-50 p-4 shadow-sm">
      <TriangleAlert aria-hidden="true" size={26} strokeWidth={2.25} className="mt-0.5 shrink-0 text-orange-600" />
      <div>
        <p className="text-base font-bold text-orange-900 sm:text-lg">{title}</p>
        <p className="mt-1 text-sm text-orange-800 sm:text-base">{body}</p>
      </div>
    </div>
  );
}
