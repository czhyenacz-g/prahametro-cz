"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { haversineDistanceMeters } from "../../lib/metro/haversine.ts";
import { stationNodesById } from "../../lib/map/station-layout.ts";
import { emitParkingEvent } from "../../lib/parking/events.ts";
import type { ParkAndRideWithOccupancy } from "../../lib/parking/types.ts";
import { useI18n } from "../i18n/I18nContext.ts";
import ParkAndRideCard from "./ParkAndRideCard.tsx";

export type ParkAndRideSectionProps = {
  open: boolean;
  onToggle: () => void;
  position: { lat: number; lon: number } | null;
  /** Nastaveno po kliknutí na P+R badge (viz ParkAndRideBadge.tsx / HomeClient.tsx) — sekce na tuhle stanici po načtení dat přesune focus. */
  focusStationId: string | null;
  onFocusHandled: () => void;
};

type FetchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error" }
  | { status: "loaded"; parkAndRides: ParkAndRideWithOccupancy[]; measurementsFailed: boolean };

/**
 * Rozbalovací sekce pod mapou metra (viz zadání bod 5/6) — data se
 * stahují AŽ při prvním otevření a pak zůstávají v paměti po zbytek
 * návštěvy (žádné opětovné stahování při zavření/otevření, viz zadání).
 * Výchozí stav je vždy zavřený, nic se neukládá do localStorage.
 */
export default function ParkAndRideSection({ open, onToggle, position, focusStationId, onFocusHandled }: ParkAndRideSectionProps) {
  const { dict } = useI18n();
  const [state, setState] = useState<FetchState>({ status: "idle" });
  const cardRefs = useRef(new Map<string, HTMLElement>());

  useEffect(() => {
    if (!open || state.status !== "idle") return;

    setState({ status: "loading" });
    emitParkingEvent({ type: "pr_section_open" });

    let cancelled = false;
    fetch("/api/park-and-ride")
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<{ parkAndRides: ParkAndRideWithOccupancy[]; measurementsFailed: boolean }>;
      })
      .then((data) => {
        if (cancelled) return;
        setState({ status: "loaded", parkAndRides: data.parkAndRides, measurementsFailed: data.measurementsFailed });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `state.status` se úmyslně čte, ale nesmí spouštět nový fetch (jen "idle -> loading" přechod jednou).
  }, [open]);

  const sorted = useMemo(() => {
    if (state.status !== "loaded") return [];
    if (position) {
      return [...state.parkAndRides].sort(
        (a, b) => haversineDistanceMeters(position, a.coordinates) - haversineDistanceMeters(position, b.coordinates)
      );
    }
    // Bez známé polohy: stabilní pořadí podle linky metra a názvu stanice (viz zadání), P+R název jako poslední tiebreaker.
    return [...state.parkAndRides].sort((a, b) => {
      const stationA = stationNodesById.get(a.metroStationId);
      const stationB = stationNodesById.get(b.metroStationId);
      const lineA = stationA?.lines[0] ?? "";
      const lineB = stationB?.lines[0] ?? "";
      return (
        lineA.localeCompare(lineB) ||
        (stationA?.name ?? "").localeCompare(stationB?.name ?? "", "cs") ||
        a.name.localeCompare(b.name, "cs")
      );
    });
  }, [state, position]);

  // Focus management: až data doběhnou (nebo když se přijde s badge na
  // už otevřenou a načtenou sekci), najdi PRVNÍ kartu patřící požadované
  // stanici a přesuň na ni focus + scrolluj (respektuje prefers-reduced-motion).
  useEffect(() => {
    if (!focusStationId || state.status !== "loaded") return;

    const target = sorted.find((pr) => pr.metroStationId === focusStationId);
    const element = target && cardRefs.current.get(target.id);
    if (element) {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      element.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "center" });
      element.focus();
    }
    onFocusHandled();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `onFocusHandled` je stabilní setter z HomeClient.tsx, nepatří do závislostí.
  }, [focusStationId, state, sorted]);

  return (
    <section className="mx-auto w-full max-w-2xl px-4">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={dict.parkAndRide.sectionId}
        className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-navy-700 shadow-sm transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-900"
      >
        {open ? <ChevronUp aria-hidden="true" size={18} strokeWidth={2.25} /> : <ChevronDown aria-hidden="true" size={18} strokeWidth={2.25} />}
        {open ? dict.parkAndRide.toggleHide : dict.parkAndRide.toggleShow}
      </button>

      {open && (
        <div id={dict.parkAndRide.sectionId} className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-xl font-bold text-gray-900">{dict.parkAndRide.heading}</h2>
          <p className="mt-1 text-sm text-gray-600">{dict.parkAndRide.subtitle}</p>

          {state.status === "loading" && <p className="mt-4 text-sm text-gray-500">…</p>}

          {state.status === "error" && <p className="mt-4 text-sm font-medium text-red-800">{dict.parkAndRide.loadErrorNotice}</p>}

          {state.status === "loaded" && (
            <>
              {state.measurementsFailed && <p className="mt-3 text-xs font-medium text-orange-700">{dict.parkAndRide.loadErrorNotice}</p>}

              <div className="mt-4 flex flex-col gap-3">
                {sorted.map((pr) => {
                  const station = stationNodesById.get(pr.metroStationId);
                  const distanceFromUserMeters = position ? haversineDistanceMeters(position, pr.coordinates) : null;
                  return (
                    <ParkAndRideCard
                      key={pr.id}
                      ref={(el) => {
                        if (el) cardRefs.current.set(pr.id, el);
                        else cardRefs.current.delete(pr.id);
                      }}
                      parkAndRide={pr}
                      stationName={station?.name ?? ""}
                      stationLines={station?.lines ?? []}
                      fetchFailed={state.measurementsFailed}
                      distanceFromUserMeters={distanceFromUserMeters}
                    />
                  );
                })}
              </div>

              <div className="mt-5 border-t border-gray-100 pt-3 text-xs text-gray-400">
                <p>
                  {dict.parkAndRide.sourceLabel} ·{" "}
                  <a
                    href="https://parking.praha.eu/cs/moznosti-parkovani-v-praze/pr-park-ride/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-gray-600"
                  >
                    {dict.parkAndRide.sourceLinkLabel}
                  </a>
                </p>
                <p className="mt-1">{dict.parkAndRide.disclaimerOccupancy}</p>
                <p>{dict.parkAndRide.disclaimerNoReservation}</p>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
