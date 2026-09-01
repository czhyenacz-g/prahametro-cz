"use client";

import { useState } from "react";
import { stationLayout, stationNodesById } from "../../lib/map/station-layout.ts";
import { nearestEntrances } from "../../lib/metro/nearest-entrances.ts";
import type { MetroEntrance } from "../../lib/metro/types.ts";
import { LINE_BADGE_CLASS } from "../../lib/metro/line-colors.ts";
import EntranceResultCard from "../EntranceResultCard.tsx";
import MetroMapSvg from "./MetroMapSvg.tsx";
import { useMapZoomPan } from "./useMapZoomPan.ts";

export type MetroMapProps = {
  entrances: MetroEntrance[];
  position: { lat: number; lon: number } | null;
  onRequestLocation: () => void;
};

export default function MetroMap({ entrances, position, onRequestLocation }: MetroMapProps) {
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [showStationEntrances, setShowStationEntrances] = useState(false);
  const zoomPan = useMapZoomPan(stationLayout.viewBox);

  const selectedNode = selectedStationId ? stationNodesById.get(selectedStationId) : null;

  const stationEntrances: { entrance: MetroEntrance; distanceMeters: number | null }[] = !selectedStationId
    ? []
    : position
      ? nearestEntrances(
          position,
          entrances.filter((e) => e.stationId === selectedStationId),
          10
        ).map((e) => ({ entrance: e, distanceMeters: e.distanceMeters }))
      : entrances.filter((e) => e.stationId === selectedStationId).map((e) => ({ entrance: e, distanceMeters: null }));

  function selectStation(stationId: string) {
    setSelectedStationId(stationId);
    setShowStationEntrances(false);
  }

  function closeSheet() {
    setSelectedStationId(null);
    setShowStationEntrances(false);
  }

  return (
    <section aria-labelledby="map-heading" className="mx-auto w-full max-w-2xl px-4 py-6">
      <h2 id="map-heading" className="text-lg font-semibold text-gray-900">
        Mapa metra
      </h2>
      <p className="mt-1 text-sm text-gray-500">Přibliž si mapu, posuň prstem, klepni na stanici pro detail.</p>

      <div className="relative mt-4">
        <div
          ref={zoomPan.containerRef}
          className="aspect-[4/5] w-full touch-none overflow-hidden rounded-2xl border border-gray-200 bg-white"
          {...zoomPan.handlers}
        >
          <MetroMapSvg
            currentViewBox={zoomPan.currentViewBox}
            selectedStationId={selectedStationId}
            onSelectStation={selectStation}
          />
        </div>

        <div className="absolute bottom-3 right-3 flex flex-col gap-2">
          <MapControlButton label="Přiblížit" onClick={zoomPan.zoomIn}>
            +
          </MapControlButton>
          <MapControlButton label="Oddálit" onClick={zoomPan.zoomOut}>
            −
          </MapControlButton>
          <MapControlButton label="Obnovit pohled" onClick={zoomPan.resetView} small>
            ⟲
          </MapControlButton>
        </div>
      </div>

      {selectedNode && (
        <div role="dialog" aria-labelledby="station-sheet-heading" className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 id="station-sheet-heading" className="text-base font-semibold text-gray-900">
                {selectedNode.name}
              </h3>
              <div className="mt-1.5 flex gap-1.5">
                {selectedNode.lines.map((line) => (
                  <span key={line} className={`rounded px-2 py-0.5 text-xs font-bold ${LINE_BADGE_CLASS[line]}`}>
                    {line}
                  </span>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={closeSheet}
              aria-label="Zavřít"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          {!showStationEntrances && (
            <button
              type="button"
              onClick={() => setShowStationEntrances(true)}
              className="mt-3 min-h-[44px] w-full rounded-xl bg-gray-900 px-4 text-sm font-semibold text-white hover:bg-gray-700"
            >
              Najít vstupy této stanice
            </button>
          )}

          {showStationEntrances && !position && (
            <div className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
              <p>Pro seřazení vstupů podle vzdálenosti nejdřív zjisti svou polohu.</p>
              <button
                type="button"
                onClick={onRequestLocation}
                className="mt-2 min-h-[40px] rounded-lg bg-amber-500 px-3 text-sm font-semibold text-white hover:bg-amber-600"
              >
                Zjistit polohu
              </button>
            </div>
          )}

          {showStationEntrances && stationEntrances.length > 0 && (
            <div className="mt-4 flex flex-col gap-3">
              {stationEntrances.map(({ entrance, distanceMeters }) => (
                <EntranceResultCard key={entrance.id} entrance={entrance} distanceMeters={distanceMeters} />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function MapControlButton({
  children,
  label,
  onClick,
  small,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 ${
        small ? "h-9 w-9 text-sm" : "h-11 w-11 text-xl font-bold"
      }`}
    >
      {children}
    </button>
  );
}
