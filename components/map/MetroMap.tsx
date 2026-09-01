"use client";

import { useState } from "react";
import { Minus, Plus, RotateCcw, TrainFront, X } from "lucide-react";
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

  const mapHeadingId = `${dict.map.sectionId}-heading`;

  return (
    <section aria-labelledby={mapHeadingId} className="mx-auto w-full max-w-2xl px-4 py-6">
      <div id={dict.map.sectionId} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-center gap-2.5">
          <TrainFront aria-hidden="true" size={26} strokeWidth={2.25} className="shrink-0 text-navy-900" />
          <h2 id={mapHeadingId} className="text-xl font-bold text-gray-900">
            {dict.map.heading}
          </h2>
        </div>
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
              <Plus aria-hidden="true" size={22} strokeWidth={2.5} />
            </MapControlButton>
            <MapControlButton label={dict.map.zoomOut} onClick={zoomPan.zoomOut}>
              <Minus aria-hidden="true" size={22} strokeWidth={2.5} />
            </MapControlButton>
            <MapControlButton label={dict.map.resetView} onClick={zoomPan.resetView}>
              <RotateCcw aria-hidden="true" size={20} strokeWidth={2.25} />
            </MapControlButton>
          </div>
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
              <X aria-hidden="true" size={22} strokeWidth={2.25} />
            </button>
          </div>

          {!showStationEntrances && (
            <button
              type="button"
              onClick={() => setShowStationEntrances(true)}
              className="mt-3 min-h-[48px] w-full rounded-xl bg-navy-900 px-4 text-base font-semibold text-white hover:bg-navy-800"
            >
              {dict.map.findEntrances}
            </button>
          )}

          {showStationEntrances && !position && (
            <div className="mt-3 rounded-xl border border-orange-300 bg-orange-50 p-3 text-sm font-medium text-orange-900">
              <p>{dict.map.needLocation}</p>
              <button
                type="button"
                onClick={onRequestLocation}
                className="mt-2 min-h-[44px] rounded-lg bg-orange-600 px-3 text-sm font-semibold text-white hover:bg-orange-700"
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
      className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-900"
    >
      {children}
    </button>
  );
}
