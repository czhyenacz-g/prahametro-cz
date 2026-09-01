import type { GtfsRoute, GtfsStop, GtfsTrip } from "./types.ts";
import { getMetroRouteLines } from "./metro-routes.ts";
import { METRO_LINES, type MetroLine } from "../metro/types.ts";

export type GtfsStopTimeWithSequence = { trip_id: string; stop_id: string; stop_sequence: string };

/**
 * Odvodí reálné pořadí stanic na každé lince přímo z GTFS `stop_sequence`
 * (ne z paměti/odhadu) — použije se pro rozložení uzlů ve schematické
 * mapě (lib/map/station-layout.ts), aby žádná stanice ani jejich pořadí
 * nebyly vymyšlené. Pro každou linku se vybere spoj (trip), který
 * pokrývá nejvíc UNIKÁTNÍCH stanic — u zkrácených/špičkových spojů by
 * jinak mohla vyjít neúplná trasa.
 */
export function deriveLineOrder(
  routes: GtfsRoute[],
  trips: GtfsTrip[],
  stops: GtfsStop[],
  stopTimes: GtfsStopTimeWithSequence[]
): Record<MetroLine, string[]> {
  const metroRouteLines = getMetroRouteLines(routes);

  const tripLines = new Map<string, MetroLine>();
  for (const trip of trips) {
    const line = metroRouteLines.get(trip.route_id);
    if (line) tripLines.set(trip.trip_id, line);
  }

  const stopById = new Map<string, GtfsStop>();
  for (const stop of stops) stopById.set(stop.stop_id, stop);

  function toStationId(stopId: string): string | null {
    const stop = stopById.get(stopId);
    if (!stop) return null;
    return stop.parent_station || (stop.location_type === "1" ? stop.stop_id : null);
  }

  const rowsByTrip = new Map<string, { sequence: number; stationId: string }[]>();
  for (const row of stopTimes) {
    if (!tripLines.has(row.trip_id)) continue;
    const stationId = toStationId(row.stop_id);
    if (!stationId) continue;

    const sequence = Number(row.stop_sequence);
    if (!Number.isFinite(sequence)) continue;

    let list = rowsByTrip.get(row.trip_id);
    if (!list) {
      list = [];
      rowsByTrip.set(row.trip_id, list);
    }
    list.push({ sequence, stationId });
  }

  const bestOrderByLine = new Map<MetroLine, string[]>();

  for (const [tripId, rows] of rowsByTrip) {
    const line = tripLines.get(tripId)!;
    rows.sort((a, b) => a.sequence - b.sequence);

    const ordered: string[] = [];
    for (const row of rows) {
      if (ordered[ordered.length - 1] !== row.stationId) ordered.push(row.stationId);
    }

    const uniqueCount = new Set(ordered).size;
    const current = bestOrderByLine.get(line);
    const currentUniqueCount = current ? new Set(current).size : 0;

    if (uniqueCount > currentUniqueCount) {
      bestOrderByLine.set(line, ordered);
    }
  }

  const result = {} as Record<MetroLine, string[]>;
  for (const line of METRO_LINES) {
    result[line] = bestOrderByLine.get(line) ?? [];
  }
  return result;
}
