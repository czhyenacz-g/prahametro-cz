"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { TriangleAlert, X } from "lucide-react";
import { useFocusTrap } from "../hooks/useFocusTrap.ts";
import { useI18n } from "./i18n/I18nContext.ts";
import { LINE_BADGE_CLASS } from "../lib/metro/line-colors.ts";
import type { MetroLine } from "../lib/metro/types.ts";
import type { StationDeparturesFile } from "../lib/departures/types.ts";
import { getLastDeparture, getUpcomingDepartures } from "../lib/departures/next-departures.ts";
import { formatClockTime } from "../lib/departures/format-clock.ts";
import { formatUpdatedDate } from "../lib/departures/format-updated-date.ts";
import { isDeparturesDataStale } from "../lib/departures/freshness.ts";
import { getPragueCalendarDate, getPragueSecondsSinceMidnight } from "../lib/time/prague-time.ts";

export type DeparturesPanelProps = {
  stationId: string;
  stationName: string;
  onClose: () => void;
};

type FetchState = { status: "loading" } | { status: "error" } | { status: "loaded"; file: StationDeparturesFile };

const MAX_UPCOMING = 3;

/**
 * Přístupný spodní panel (bottom sheet na mobilu, vycentrovaný dialog
 * od `sm:` výš) s naplánovanými GTFS odjezdy — NE poloha vlaků v
 * reálném čase (viz zadání). Data se fetchují AŽ při otevření panelu
 * (viz lib/departures/*.ts a public/data/departures/{stationId}.json,
 * vygenerované při `npm run data:refresh` — nikdy součást homepage
 * bundlu).
 */
export default function DeparturesPanel({ stationId, stationName, onClose }: DeparturesPanelProps) {
  const { locale, dict } = useI18n();
  const [state, setState] = useState<FetchState>({ status: "loading" });
  const [selectedLine, setSelectedLine] = useState<MetroLine | null>(null);
  const [selectedDirection, setSelectedDirection] = useState<"0" | "1" | null>(null);
  const [now] = useState(() => new Date());

  const headingId = useId();
  const containerRef = useFocusTrap(true, onClose);

  useEffect(() => {
    let cancelled = false;

    fetch(`/data/departures/${stationId}.json`)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<StationDeparturesFile>;
      })
      .then((file) => {
        if (cancelled) return;
        setState({ status: "loaded", file });
        setSelectedLine(file.lines[0]?.line ?? null);
        setSelectedDirection(file.lines[0]?.directions[0]?.directionId ?? null);
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });

    return () => {
      cancelled = true;
    };
  }, [stationId]);

  // Bottom sheet zamkne scroll pozadí, dokud je otevřený — obnoví se při zavření/odmountování.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const today = useMemo(() => getPragueCalendarDate(now), [now]);
  const nowSeconds = useMemo(() => getPragueSecondsSinceMidnight(now), [now]);

  const file = state.status === "loaded" ? state.file : null;
  const currentLine = file?.lines.find((l) => l.line === selectedLine) ?? null;
  const currentDirection = currentLine?.directions.find((d) => d.directionId === selectedDirection) ?? null;

  const upcoming = currentDirection && file ? getUpcomingDepartures(currentDirection.departures, file.calendars, today, nowSeconds, MAX_UPCOMING) : [];
  const last = currentDirection && file ? getLastDeparture(currentDirection.departures, file.calendars, today) : null;
  const isStale = file ? isDeparturesDataStale(file.generatedAt, now) : false;

  function selectLine(line: MetroLine) {
    setSelectedLine(line);
    const group = file?.lines.find((l) => l.line === line);
    setSelectedDirection(group?.directions[0]?.directionId ?? null);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-gray-900/50" onClick={onClose} aria-hidden="true" />

      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className="relative flex max-h-[85vh] w-full flex-col overflow-y-auto rounded-t-3xl border border-gray-200 bg-white p-4 shadow-lg sm:max-w-md sm:rounded-3xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id={headingId} className="text-lg font-bold text-gray-900 sm:text-xl">
            {stationName}
            {selectedLine && <span className={`ml-2 rounded px-2 py-0.5 align-middle text-xs font-bold ${LINE_BADGE_CLASS[selectedLine]}`}>{selectedLine}</span>}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={dict.departures.dialogCloseLabel}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-900"
          >
            <X aria-hidden="true" size={22} strokeWidth={2.25} />
          </button>
        </div>

        {state.status === "loading" && <p className="mt-4 text-sm text-gray-600">{dict.departures.loading}</p>}

        {state.status === "error" && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3">
            <p className="text-sm font-semibold text-red-800">{dict.departures.errorTitle}</p>
            <p className="mt-1 text-sm text-red-800">{dict.departures.errorBody}</p>
          </div>
        )}

        {file && (
          <>
            {file.lines.length > 1 && (
              <div role="group" aria-label={dict.departures.lineLabel} className="mt-4 flex flex-wrap gap-2">
                {file.lines.map((l) => (
                  <button
                    key={l.line}
                    type="button"
                    aria-pressed={l.line === selectedLine}
                    onClick={() => selectLine(l.line)}
                    className={`flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border-2 px-3 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-900 ${
                      l.line === selectedLine ? LINE_BADGE_CLASS[l.line] + " border-transparent" : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {l.line}
                  </button>
                ))}
              </div>
            )}

            {currentLine && currentLine.directions.length > 1 && (
              <div role="group" aria-label={dict.departures.directionGroupLabel} className="mt-2 flex flex-wrap gap-2">
                {currentLine.directions.map((d) => (
                  <button
                    key={d.directionId}
                    type="button"
                    aria-pressed={d.directionId === selectedDirection}
                    onClick={() => setSelectedDirection(d.directionId)}
                    className={`flex min-h-[44px] items-center justify-center rounded-xl border-2 px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-900 ${
                      d.directionId === selectedDirection ? "border-navy-900 bg-navy-900 text-white" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {dict.departures.towards(d.headsign)}
                  </button>
                ))}
              </div>
            )}

            {isStale && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-orange-300 bg-orange-50 p-3">
                <TriangleAlert aria-hidden="true" size={18} strokeWidth={2.25} className="mt-0.5 shrink-0 text-orange-600" />
                <div>
                  <p className="text-sm font-semibold text-orange-900">{dict.departures.staleTitle}</p>
                  <p className="text-sm text-orange-800">{dict.departures.staleBody}</p>
                </div>
              </div>
            )}

            <section className="mt-4">
              <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500">{dict.departures.nextHeading}</h3>
              {upcoming.length > 0 ? (
                <ul className="mt-2 flex flex-col gap-1.5">
                  {upcoming.map((departure, index) => (
                    <li key={`${departure.serviceId}-${departure.time}-${index}`} className="flex items-baseline gap-3 text-base text-gray-900">
                      <span className="w-14 font-mono text-lg font-bold tabular-nums">{formatClockTime(departure.secondsSinceTodayMidnight)}</span>
                      <span className="text-gray-700">{dict.departures.towards(departure.headsign)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-gray-600">{dict.departures.noDeparturesForSelection}</p>
              )}
            </section>

            {!isStale && last && (
              <section className="mt-4">
                <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500">{dict.departures.lastHeading}</h3>
                <p className="mt-2 flex items-baseline gap-3 text-base text-gray-900">
                  <span className="w-14 font-mono text-lg font-bold tabular-nums">{formatClockTime(last.time)}</span>
                  <span className="text-gray-700">{dict.departures.towards(last.headsign)}</span>
                </p>
              </section>
            )}

            <p className="mt-4 border-t border-gray-100 pt-3 text-xs text-gray-400">
              {dict.departures.sourceLabel} · {dict.departures.updatedLabel} {formatUpdatedDate(file.generatedAt, locale)}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
