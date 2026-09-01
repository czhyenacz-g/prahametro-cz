"use client";

import { useState } from "react";
import { stationLayout, stationNodesById } from "../../lib/map/station-layout.ts";
import { nearestEntrances } from "../../lib/metro/nearest-entrances.ts";
import type { MetroEntrance } from "../../lib/metro/types.ts";
import { LINE_BADGE_CLASS } from "../../lib/metro/line-colors.ts";
import { useI18n } from "../i18n/I18nContext.ts";
import EntranceResultCard from "../EntranceResultCard.tsx";
import MetroMapSvg from "./MetroMapSvg.tsx";
import { useMapZoomPan } from "./useMapZoomPan.ts";

export type MetroMapProps = {
  entrances: MetroEntrance[];
  position: { lat: number; lon: number } | null;
  onRequestLocation: () => void;
};

export default function MetroMap({ entrances, position, onRequestLocation }: MetroMapProps) {
  const { dict } = useI18n();
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
      <h2 id="map-heading" className="text-xl font-bold text-gray-900">
        {dict.map.heading}
      </h2>
      <p className="mt-1 text-sm text-gray-600">{dict.map.subtitle}</p>

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
            ariaLabel={dict.map.ariaLabel}
            getStationAriaLabel={(name, lines) => dict.map.stationAriaLabel(name, lines)}
          />
        </div>

        <div className="absolute bottom-3 right-3 flex flex-col gap-2">
          <MapControlButton label={dict.map.zoomIn} onClick={zoomPan.zoomIn}>
            +
          </MapControlButton>
          <MapControlButton label={dict.map.zoomOut} onClick={zoomPan.zoomOut}>
            −
          </MapControlButton>
          <MapControlButton label={dict.map.resetView} onClick={zoomPan.resetView}>
            ⟲
          </MapControlButton>
        </div>
      </div>

      {selectedNode && (
        <div role="dialog" aria-labelledby="station-sheet-heading" className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 id="station-sheet-heading" className="text-lg font-bold text-gray-900">
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
              aria-label={dict.map.closeSheet}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          {!showStationEntrances && (
            <button
              type="button"
              onClick={() => setShowStationEntrances(true)}
              className="mt-3 min-h-[48px] w-full rounded-xl bg-gray-900 px-4 text-base font-semibold text-white hover:bg-gray-700"
            >
              {dict.map.findEntrances}
            </button>
          )}

          {showStationEntrances && !position && (
            <div className="mt-3 rounded-xl border border-amber-400 bg-amber-100 p-3 text-sm font-medium text-amber-900">
              <p>{dict.map.needLocation}</p>
              <button
                type="button"
                onClick={onRequestLocation}
                className="mt-2 min-h-[44px] rounded-lg bg-amber-600 px-3 text-sm font-semibold text-white hover:bg-amber-700"
              >
                {dict.map.getLocation}
              </button>
            </div>
          )}

          {showStationEntrances && stationEntrances.length > 0 && (
            <div className="mt-4 flex flex-col gap-3">
              {stationEntrances.map(({ entrance, distanceMeters }) => (
                <EntranceResultCard key={entrance.id} entrance={entrance} distanceMeters={distanceMeters} origin={position} />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function MapControlButton({ children, label, onClick }: { children: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-xl font-bold text-gray-700 shadow-sm hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
    >
      {children}
    </button>
  );
}
