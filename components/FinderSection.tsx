"use client";

import { useMemo } from "react";
import { buildDemoPositions } from "../lib/metro/demo-positions.ts";
import { nearestEntrances, nearestStationEntrances } from "../lib/metro/nearest-entrances.ts";
import { getMainHeading } from "../lib/i18n/dictionary.ts";
import { shouldShowDemoControls } from "../lib/env/should-show-demo-controls.ts";
import type { GeolocationStatus } from "../lib/metro/geolocation-state.ts";
import type { MetroEntrance } from "../lib/metro/types.ts";
import { useI18n } from "./i18n/I18nContext.ts";
import DemoLocationPicker from "./DemoLocationPicker.tsx";
import EntranceResultCard from "./EntranceResultCard.tsx";
import NativeAdCard from "./NativeAdCard.tsx";
import OutsidePragueNotice from "./OutsidePragueNotice.tsx";

const OUTSIDE_PRAGUE_THRESHOLD_M = 25_000;
const LOW_ACCURACY_THRESHOLD_M = 100;

export type FinderSectionProps = {
  entrances: MetroEntrance[];
  status: GeolocationStatus;
  onLocate: () => void;
  onDemoSelect: (lat: number, lon: number) => void;
};

export default function FinderSection({ entrances, status, onLocate, onDemoSelect }: FinderSectionProps) {
  const { locale, vulgar, dict } = useI18n();
  const demoPositions = useMemo(() => buildDemoPositions(entrances), [entrances]);

  const position = status.kind === "success" ? { lat: status.lat, lon: status.lon } : null;

  // Napřed rychlý haversine check na nejbližší vstup vůbec, ať se pozná,
  // jestli je uživatel "mimo Prahu" (viz zadání) — pak se podle toho
  // rozhodne, kterou funkci na finální trojici výsledků použít.
  const closestOverall = position ? nearestEntrances(position, entrances, 1)[0] : null;
  const isOutsidePrague = closestOverall !== undefined && closestOverall !== null && closestOverall.distanceMeters > OUTSIDE_PRAGUE_THRESHOLD_M;

  const results = position ? (isOutsidePrague ? nearestStationEntrances(position, entrances, 3) : nearestEntrances(position, entrances, 3)) : [];

  return (
    <section aria-label={getMainHeading(locale, vulgar)} className="mx-auto w-full max-w-2xl px-4 py-8">
      <div className="rounded-3xl border border-gray-200 bg-white p-6 text-center shadow-sm sm:p-8">
        {/* Jediné velké tlačítko — heading a CTA byly duplicitní texty
            ("Kde je nejbližší metro?" + "Najít nejbližší metro"), teď je
            hlaška (i vulgární varianta) přímo labelem tlačítka. */}
        <button
          type="button"
          onClick={onLocate}
          disabled={status.kind === "locating"}
          className="min-h-[72px] w-full rounded-2xl bg-gray-900 px-6 py-4 text-2xl font-extrabold leading-tight text-white transition hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 disabled:opacity-60 sm:text-3xl"
        >
          {status.kind === "locating" ? dict.finder.ctaLocating : getMainHeading(locale, vulgar)}
        </button>
        <p className="mt-3 text-sm text-gray-500">{dict.finder.privacyNote}</p>

        {shouldShowDemoControls(process.env.NODE_ENV) && (
          <DemoLocationPicker positions={demoPositions} onSelect={onDemoSelect} locale={locale} />
        )}
      </div>

      <div aria-live="polite" className="mt-6 flex flex-col gap-3">
        <StatusMessage status={status} />

        {status.kind === "success" && status.accuracyMeters > LOW_ACCURACY_THRESHOLD_M && (
          <p className="rounded-xl border border-amber-400 bg-amber-100 p-2.5 text-center text-sm font-semibold text-amber-900">
            {dict.finder.status.lowAccuracy(status.accuracyMeters)}
          </p>
        )}

        {isOutsidePrague && closestOverall && (
          <OutsidePragueNotice nearestStationName={closestOverall.stationName} nearestDistanceMeters={closestOverall.distanceMeters} />
        )}

        {results.map((entrance) => (
          <EntranceResultCard key={entrance.id} entrance={entrance} distanceMeters={entrance.distanceMeters} origin={position} />
        ))}
      </div>

      <div className="mt-6">
        <NativeAdCard />
      </div>
    </section>
  );
}

function StatusMessage({ status }: { status: GeolocationStatus }) {
  const { dict } = useI18n();

  switch (status.kind) {
    case "idle":
      return null;
    case "locating":
      return (
        <p role="status" className="text-center text-base text-gray-600">
          {dict.finder.ctaLocating}
        </p>
      );
    case "success":
      return null;
    case "denied":
      return (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-center text-sm font-medium text-red-800">
          {dict.finder.status.denied}
        </p>
      );
    case "unavailable":
      return (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-center text-sm font-medium text-red-800">
          {dict.finder.status.unavailable}
        </p>
      );
    case "timeout":
      return (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-center text-sm font-medium text-red-800">
          {dict.finder.status.timeout}
        </p>
      );
    case "unsupported":
      return (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-center text-sm font-medium text-red-800">
          {dict.finder.status.unsupported}
        </p>
      );
  }
}
