"use client";

import { useCallback, useEffect, useState } from "react";
import { LocateFixed, TriangleAlert } from "lucide-react";
import { useGeolocation } from "../../hooks/useGeolocation.ts";
import { classifyOutsidePrague } from "../../lib/metro/brno.ts";
import { isDeparturesDataStale } from "../../lib/departures/freshness.ts";
import { getTargetNightWindow } from "../../lib/night-transport/target-night.ts";
import { selectNearestStopGroups, pickNavigationPlatform } from "../../lib/night-transport/select-results.ts";
import { getMergedUpcomingDepartures, type MergedNightDeparture } from "../../lib/night-transport/merge-departures.ts";
import { groupIdToFileName } from "../../lib/night-transport/stop-groups.ts";
import { getNightDictionary } from "../../lib/i18n/night-dictionary.ts";
import type { NightStopDetail, NightTransportIndex } from "../../lib/night-transport/types.ts";
import { useI18n } from "../i18n/I18nContext.ts";
import AdSlot from "../ads/AdSlot.tsx";
import NightResultCard from "./NightResultCard.tsx";
import NightOutsidePragueNotice from "./NightOutsidePragueNotice.tsx";

const OUTSIDE_PRAGUE_THRESHOLD_M = 25_000;
/** Kolik nejbližších kandidátů zkusit, než se vzdáme (zadání bod 24 "pro cílovou noc není nalezen noční spoj") — víc než 3, protože pár nejbližších skupin může mít pro tuhle konkrétní noc nulový platný spoj (kalendářní výjimka apod.). */
const CANDIDATE_LIMIT = 8;

type ResolvedCard = {
  groupName: string;
  distanceMeters: number;
  platform: { lat: number; lon: number; platformCode: string };
  departures: MergedNightDeparture[];
};

type FinderState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "outside-prague" }
  | { kind: "dataset-error" }
  | { kind: "no-service" }
  | { kind: "results"; cards: ResolvedCard[] };

export default function NightFinder() {
  const { locale, dict } = useI18n();
  const nightDict = getNightDictionary(locale);
  const { status, locate } = useGeolocation();
  const [finderState, setFinderState] = useState<FinderState>({ kind: "idle" });
  const [isStale, setIsStale] = useState(false);
  const [isOngoingNight, setIsOngoingNight] = useState<boolean | null>(null);

  const handleLocate = useCallback(() => {
    setFinderState({ kind: "loading" });
    locate();
  }, [locate]);

  useEffect(() => {
    if (status.kind !== "success") return;
    const position = { lat: status.lat, lon: status.lon };
    let cancelled = false;

    async function run() {
      try {
        const indexResponse = await fetch("/data/night-transport/index.json");
        if (!indexResponse.ok) throw new Error(`HTTP ${indexResponse.status}`);
        const index: NightTransportIndex = await indexResponse.json();
        if (cancelled) return;

        const now = new Date();
        setIsStale(isDeparturesDataStale(index.generatedAt, now));
        const night = getTargetNightWindow(now);
        setIsOngoingNight(night.isOngoing);

        const closest = selectNearestStopGroups(position, index.stopGroups, 1)[0];
        const outsideStatus = closest ? classifyOutsidePrague(closest.distanceMeters, position, OUTSIDE_PRAGUE_THRESHOLD_M) : { kind: "in-prague" as const };
        if (outsideStatus.kind === "outside-prague") {
          if (!cancelled) setFinderState({ kind: "outside-prague" });
          return;
        }

        const candidates = selectNearestStopGroups(position, index.stopGroups, CANDIDATE_LIMIT);
        const cards: ResolvedCard[] = [];
        let anyFetchFailed = false;

        for (const candidate of candidates) {
          if (cards.length >= 3) break;
          const fileName = groupIdToFileName(candidate.id);
          if (!fileName) continue;

          try {
            const detailResponse = await fetch(`/data/night-transport/stops/${fileName}.json`);
            if (!detailResponse.ok) throw new Error(`HTTP ${detailResponse.status}`);
            const detail: NightStopDetail = await detailResponse.json();

            const departures = getMergedUpcomingDepartures(detail, night.serviceDate, night.nowSecondsSinceServiceMidnight, 3);
            if (departures.length === 0) continue; // tahle skupina nemá pro cílovou noc platný spoj, zkus další kandidát

            const platform = pickNavigationPlatform(position, detail.platforms);
            if (!platform) continue;

            cards.push({ groupName: detail.name, distanceMeters: candidate.distanceMeters, platform, departures });
          } catch {
            anyFetchFailed = true;
          }
        }

        if (cancelled) return;

        if (cards.length > 0) {
          setFinderState({ kind: "results", cards });
        } else if (anyFetchFailed) {
          setFinderState({ kind: "dataset-error" });
        } else {
          setFinderState({ kind: "no-service" });
        }
      } catch {
        if (!cancelled) setFinderState({ kind: "dataset-error" });
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [status]);

  return (
    <section aria-label={nightDict.cta} className="mx-auto w-full max-w-2xl px-4 py-6 sm:py-8">
      <div className="rounded-2xl border border-gray-200 bg-white p-4 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
        <button
          type="button"
          onClick={handleLocate}
          disabled={status.kind === "locating"}
          className="flex min-h-[64px] w-full items-center justify-center gap-3 rounded-2xl bg-navy-900 px-5 py-4 text-xl font-extrabold leading-tight text-white transition hover:bg-navy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-900 focus-visible:ring-offset-2 disabled:opacity-60 dark:bg-white dark:text-navy-900 dark:hover:bg-slate-200 dark:focus-visible:ring-white sm:text-2xl"
        >
          <LocateFixed aria-hidden="true" size={28} strokeWidth={2.25} className="shrink-0" />
          <span>{status.kind === "locating" ? dict.finder.ctaLocating : nightDict.cta}</span>
        </button>
        <p className="mt-3 text-sm text-gray-500 dark:text-slate-400">{nightDict.privacyNote}</p>
      </div>

      <div aria-live="polite" className="mt-6 flex flex-col gap-3">
        <StatusMessage statusKind={status.kind} dict={dict} />

        {finderState.kind === "outside-prague" && <NightOutsidePragueNotice message={nightDict.outsidePrague} />}

        {finderState.kind === "dataset-error" && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-900/60 dark:bg-red-950/40">
            <p className="flex items-center gap-2 text-sm font-semibold text-red-800 dark:text-red-300">
              <TriangleAlert aria-hidden="true" size={18} strokeWidth={2.25} className="shrink-0" />
              {nightDict.datasetErrorTitle}
            </p>
            <p className="mt-1 text-sm text-red-800 dark:text-red-300">
              {nightDict.datasetErrorBody} {dict.departures.checkInPidLitacka}
            </p>
          </div>
        )}

        {finderState.kind === "no-service" && (
          <div role="status" className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            {nightDict.noNightServiceTonight}
          </div>
        )}

        {finderState.kind === "results" && (
          <>
            {isStale && (
              <div className="flex items-start gap-2 rounded-xl border border-orange-300 bg-orange-50 p-3 dark:border-orange-900/60 dark:bg-orange-950/40">
                <TriangleAlert aria-hidden="true" size={18} strokeWidth={2.25} className="mt-0.5 shrink-0 text-orange-600 dark:text-orange-400" />
                <div>
                  <p className="text-sm font-semibold text-orange-900 dark:text-orange-200">{dict.departures.staleTitle}</p>
                  <p className="text-sm text-orange-800 dark:text-orange-300">{dict.departures.staleBody}</p>
                </div>
              </div>
            )}

            {isOngoingNight === false && (
              <p role="status" className="rounded-xl bg-navy-50 p-3 text-center text-sm font-medium text-navy-700 dark:bg-slate-800 dark:text-slate-200">
                {nightDict.duringDayNotice}
              </p>
            )}

            {finderState.cards.map((card, index) => (
              <NightResultCard
                key={`${card.groupName}-${index}`}
                groupName={card.groupName}
                distanceMeters={card.distanceMeters}
                platform={card.platform}
                origin={{ lat: status.kind === "success" ? status.lat : 0, lon: status.kind === "success" ? status.lon : 0 }}
                departures={card.departures}
                scheduledDeparturesLabel={nightDict.scheduledDeparturesLabel}
                towardsLabel={nightDict.towardsLabel}
                platformLabel={nightDict.platformLabel}
                disclaimer={dict.result.disclaimer}
                googleMapsLabel={dict.result.googleMapsLabel}
                appleMapsLabel={dict.result.appleMapsLabel}
                mapyComLabel={dict.result.mapyComLabel}
                googleMapsAriaLabel={dict.result.googleMapsAriaLabel}
                appleMapsAriaLabel={dict.result.appleMapsAriaLabel}
                mapyComAriaLabel={dict.result.mapyComAriaLabel}
              />
            ))}
          </>
        )}
      </div>

      <AdSlot placement="night-finder-results" />
    </section>
  );
}

function StatusMessage({ statusKind, dict }: { statusKind: string; dict: ReturnType<typeof useI18n>["dict"] }) {
  switch (statusKind) {
    case "locating":
      return (
        <p role="status" className="text-center text-base text-gray-600 dark:text-slate-300">
          {dict.finder.ctaLocating}
        </p>
      );
    case "denied":
      return (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-center text-sm font-medium text-red-800 dark:bg-red-950/40 dark:text-red-300">
          {dict.finder.status.denied}
        </p>
      );
    case "unavailable":
      return (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-center text-sm font-medium text-red-800 dark:bg-red-950/40 dark:text-red-300">
          {dict.finder.status.unavailable}
        </p>
      );
    case "timeout":
      return (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-center text-sm font-medium text-red-800 dark:bg-red-950/40 dark:text-red-300">
          {dict.finder.status.timeout}
        </p>
      );
    case "unsupported":
      return (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-center text-sm font-medium text-red-800 dark:bg-red-950/40 dark:text-red-300">
          {dict.finder.status.unsupported}
        </p>
      );
    default:
      return null;
  }
}
