"use client";

import { useMemo } from "react";
import { buildDemoPositions } from "../lib/metro/demo-positions.ts";
import { nearestEntrances } from "../lib/metro/nearest-entrances.ts";
import type { GeolocationStatus } from "../lib/metro/geolocation-state.ts";
import type { MetroEntrance } from "../lib/metro/types.ts";
import DemoLocationPicker from "./DemoLocationPicker.tsx";
import EntranceResultCard from "./EntranceResultCard.tsx";
import NativeAdCard from "./NativeAdCard.tsx";

const OUTSIDE_PRAGUE_THRESHOLD_M = 25_000;
const LOW_ACCURACY_THRESHOLD_M = 100;

export type FinderSectionProps = {
  entrances: MetroEntrance[];
  status: GeolocationStatus;
  onLocate: () => void;
  onDemoSelect: (lat: number, lon: number) => void;
};

export default function FinderSection({ entrances, status, onLocate, onDemoSelect }: FinderSectionProps) {
  const demoPositions = useMemo(() => buildDemoPositions(entrances), [entrances]);

  const results = status.kind === "success" ? nearestEntrances({ lat: status.lat, lon: status.lon }, entrances, 3) : [];
  const nearestDistance = results[0]?.distanceMeters ?? null;

  return (
    <section aria-labelledby="finder-heading" className="mx-auto w-full max-w-2xl px-4 py-8">
      <div className="rounded-3xl border border-gray-200 bg-white p-6 text-center shadow-sm sm:p-8">
        <h2 id="finder-heading" className="text-xl font-bold text-gray-900 sm:text-2xl">
          Kde je nejbližší metro?
        </h2>
        <button
          type="button"
          onClick={onLocate}
          disabled={status.kind === "locating"}
          className="mt-5 min-h-[56px] w-full rounded-2xl bg-gray-900 px-6 text-lg font-semibold text-white transition hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 disabled:opacity-60"
        >
          {status.kind === "locating" ? "Zjišťuji polohu…" : "Najít nejbližší metro"}
        </button>
        <p className="mt-3 text-xs text-gray-500">Poloha zůstává jen ve vašem zařízení.</p>

        {process.env.NODE_ENV === "development" && (
          <DemoLocationPicker positions={demoPositions} onSelect={onDemoSelect} />
        )}
      </div>

      <div aria-live="polite" className="mt-6 flex flex-col gap-3">
        <StatusMessage status={status} />

        {status.kind === "success" && status.accuracyMeters > LOW_ACCURACY_THRESHOLD_M && (
          <p className="text-center text-xs text-amber-700">Poloha je přibližná (±{Math.round(status.accuracyMeters)} m).</p>
        )}

        {status.kind === "success" && nearestDistance !== null && nearestDistance > OUTSIDE_PRAGUE_THRESHOLD_M && (
          <p className="text-center text-xs text-amber-700">Vypadá to, že nejsi v Praze — výsledky přesto ukazujeme.</p>
        )}

        {results.map((entrance) => (
          <EntranceResultCard key={entrance.id} entrance={entrance} distanceMeters={entrance.distanceMeters} />
        ))}
      </div>

      <div className="mt-6">
        <NativeAdCard />
      </div>
    </section>
  );
}

function StatusMessage({ status }: { status: GeolocationStatus }) {
  switch (status.kind) {
    case "idle":
      return null;
    case "locating":
      return (
        <p role="status" className="text-center text-sm text-gray-600">
          Zjišťuji polohu…
        </p>
      );
    case "success":
      return null;
    case "denied":
      return (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-center text-sm text-red-700">
          Přístup k poloze byl zamítnutý. Povol ho v nastavení prohlížeče (obvykle ikona zámku/lokace vedle adresního
          řádku) a zkus to znovu.
        </p>
      );
    case "unavailable":
      return (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-center text-sm text-red-700">
          Polohu se nepodařilo zjistit. Zkontroluj, že máš zapnuté GPS/lokaci, a zkus to znovu.
        </p>
      );
    case "timeout":
      return (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-center text-sm text-red-700">
          Zjišťování polohy trvalo příliš dlouho. Zkus to prosím znovu.
        </p>
      );
    case "unsupported":
      return (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-center text-sm text-red-700">
          Tento prohlížeč geolokaci nepodporuje.
        </p>
      );
  }
}
