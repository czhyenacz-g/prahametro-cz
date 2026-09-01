import dataset from "../../data/metro-entrances.json" with { type: "json" };
import { stationLayout } from "./station-layout.ts";

/** Stanice ze skutečných importovaných dat, které v mapě chybí. Prázdné pole = OK. */
export function findMissingLayoutStations(): string[] {
  const importedStationIds = new Set(dataset.entrances.map((e) => e.stationId));
  const layoutStationIds = new Set(stationLayout.nodes.map((n) => n.id));
  return [...importedStationIds].filter((id) => !layoutStationIds.has(id));
}

/** Stanice v mapě, které NEODPOVÍDAJÍ žádné reálné importované stanici. Prázdné pole = OK. */
export function findExtraneousLayoutStations(): string[] {
  const importedStationIds = new Set(dataset.entrances.map((e) => e.stationId));
  return stationLayout.nodes.map((n) => n.id).filter((id) => !importedStationIds.has(id));
}
