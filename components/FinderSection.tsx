"use client";

import { useMemo } from "react";
import { LocateFixed } from "lucide-react";
import { buildDemoPositions } from "../lib/metro/demo-positions.ts";
import { getMainHeading } from "../lib/i18n/dictionary.ts";
import { shouldShowDemoControls } from "../lib/env/should-show-demo-controls.ts";
import type { EntranceWithDistance } from "../lib/metro/nearest-entrances.ts";
import type { FinalEntranceResult } from "../lib/routing/rank-walking-results.ts";
import type { OutsidePragueStatus } from "../lib/metro/brno.ts";
import type { AdCampaign } from "../lib/ads/types.ts";
import type { GeolocationStatus } from "../lib/metro/geolocation-state.ts";
import type { MetroEntrance } from "../lib/metro/types.ts";
import { useI18n } from "./i18n/I18nContext.ts";
import DemoLocationPicker from "./DemoLocationPicker.tsx";
import EntranceResultCard from "./EntranceResultCard.tsx";
import AdSlot from "./ads/AdSlot.tsx";
import OutsidePragueNotice from "./OutsidePragueNotice.tsx";

export type FinderSectionProps = {
  entrances: MetroEntrance[];
  status: GeolocationStatus;
  onLocate: () => void;
  onDemoSelect: (lat: number, lon: number) => void;
  onOpenParkAndRide: (stationId: string) => void;
  /** Server-side staženo v components/HomePage.tsx (viz lib/promotions/get-promotions.ts) — reklamy se spravují jen přes content-api.darbujan.com/admin/promotions. */
  promotionCampaigns: AdCampaign[];
  /** Napřed vzdušné, pak zpřesněné přes Mapy.com Matrix Routing — počítá HomeClient.tsx (hooks/useMetroFinderResults.ts), sdíleno se zvýrazněním v mapě. */
  results: FinalEntranceResult[];
  isRefining: boolean;
  outsidePragueStatus: OutsidePragueStatus;
  closestOverall: EntranceWithDistance | null;
  routingAttempted: boolean;
  /** Skutečný neúspěšný pokus o zpřesnění (ne "bez klíče", ne "mimo Prahu") — zobrazí nenápadnou větu pod výsledky, viz zadání bod 8. */
  routingFailed: boolean;
};

export default function FinderSection({
  entrances,
  status,
  onLocate,
  onDemoSelect,
  onOpenParkAndRide,
  promotionCampaigns,
  results,
  isRefining,
  outsidePragueStatus,
  closestOverall,
  routingAttempted,
  routingFailed,
}: FinderSectionProps) {
  const { locale, vulgar, dict } = useI18n();
  const demoPositions = useMemo(() => buildDemoPositions(entrances), [entrances]);

  const position = status.kind === "success" ? { lat: status.lat, lon: status.lon } : null;
  const isOutsidePrague = outsidePragueStatus.kind === "outside-prague";
  const isBrno = outsidePragueStatus.kind === "outside-prague" && outsidePragueStatus.isBrno;

  return (
    <section id={dict.finder.sectionId} aria-label={getMainHeading(locale, vulgar)} className="mx-auto w-full max-w-2xl px-4 py-6 sm:py-8">
      <div className="rounded-2xl border border-gray-200 bg-white p-4 text-center shadow-sm sm:p-6">
        {/* Jediné velké tlačítko — heading a CTA byly duplicitní texty
            ("Kde je nejbližší metro?" + "Najít nejbližší metro"), teď je
            hlaška (i vulgární varianta) přímo labelem tlačítka. */}
        <button
          type="button"
          onClick={onLocate}
          disabled={status.kind === "locating"}
          className="flex min-h-[64px] w-full items-center justify-center gap-3 rounded-2xl bg-navy-900 px-5 py-4 text-xl font-extrabold leading-tight text-white transition hover:bg-navy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-900 focus-visible:ring-offset-2 disabled:opacity-60 sm:text-2xl"
        >
          <LocateFixed aria-hidden="true" size={28} strokeWidth={2.25} className="shrink-0" />
          <span>{status.kind === "locating" ? dict.finder.ctaLocating : getMainHeading(locale, vulgar)}</span>
        </button>
        <p className="mt-3 text-sm text-gray-500">{dict.finder.privacyNote}</p>

        {shouldShowDemoControls(process.env.NODE_ENV) && (
          <DemoLocationPicker positions={demoPositions} onSelect={onDemoSelect} locale={locale} />
        )}
      </div>

      <div aria-live="polite" className="mt-6 flex flex-col gap-3">
        <StatusMessage status={status} />

        {isRefining && <p className="text-center text-sm text-gray-500">{dict.finder.refining}</p>}

        {isOutsidePrague && closestOverall && (
          <OutsidePragueNotice nearestStationName={closestOverall.stationName} nearestDistanceMeters={closestOverall.distanceMeters} isBrno={isBrno} />
        )}

        {results.map(({ entrance, distanceMeters, durationSeconds, source }) => (
          <EntranceResultCard
            key={entrance.id}
            entrance={entrance}
            distanceMeters={distanceMeters}
            origin={position}
            onOpenParkAndRide={onOpenParkAndRide}
            distanceSource={source}
            durationSeconds={durationSeconds}
            routingAttempted={routingAttempted}
          />
        ))}

        {routingFailed && <p className="text-center text-xs text-gray-400">{dict.finder.routingFallbackNotice}</p>}
      </div>

      {/* Neznámá stanice na téhle pozici (výsledky mohou patřit různým
          stanicím) — jen obecné kampaně bez stationIds, viz komentář v
          hooks/useSelectedAd.ts. Bez obalového <div> — AdCard.tsx i
          NamedayGreeting.tsx si nesou vlastní `mt-6` na svém kořenovém
          elementu, ať po nich při návratu `null` (žádná způsobilá
          kampaň a jiný jazyk než čeština, viz AdSlot.tsx) nezůstane
          žádná prázdná mezera. */}
      <AdSlot campaigns={promotionCampaigns} placement="finder-results" />
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
