import type { GtfsCalendar, GtfsCalendarDate, GtfsRoute, GtfsStop, GtfsStopTimeWithDeparture, GtfsTrip } from "./types.ts";
import { getMetroRouteLines } from "./metro-routes.ts";
import { parseGtfsTimeToSeconds } from "./parse-gtfs-time.ts";
import { buildCalendarDefinitions } from "../departures/build-calendar-definitions.ts";
import type { DepartureRow, DirectionGroup, LineGroup, StationDeparturesFile } from "../departures/types.ts";
import type { MetroLine } from "../metro/types.ts";

/**
 * Čistá funkce bez I/O — ze syrových GTFS tabulek postaví kompaktní
 * per-stanice dataset odjezdů (viz lib/departures/types.ts). Používá
 * STEJNOU identifikaci metro linek jako extract-metro-entrances.ts
 * (lib/gtfs/metro-routes.ts) a STEJNÉ pravidlo pro stationId
 * (`parent_station`), takže `stationId` v public/data/departures/*.json
 * je zaručeně stejná hodnota jako `MetroEntrance.stationId` — žádné
 * párování podle jména.
 */
export function buildDepartures(
  routes: GtfsRoute[],
  trips: GtfsTrip[],
  stops: GtfsStop[],
  stopTimes: GtfsStopTimeWithDeparture[],
  calendars: GtfsCalendar[],
  calendarDates: GtfsCalendarDate[],
  meta: { generatedAt: string; source: string }
): Map<string, StationDeparturesFile> {
  const metroRouteLines = getMetroRouteLines(routes);

  type TripInfo = { line: MetroLine; headsign: string; serviceId: string; directionId: "0" | "1" };
  const tripInfoById = new Map<string, TripInfo>();
  for (const trip of trips) {
    const line = metroRouteLines.get(trip.route_id);
    if (!line) continue;
    const directionId = trip.direction_id === "1" ? "1" : "0";
    tripInfoById.set(trip.trip_id, { line, headsign: trip.trip_headsign.trim(), serviceId: trip.service_id, directionId });
  }

  const stopById = new Map<string, GtfsStop>();
  for (const stop of stops) stopById.set(stop.stop_id, stop);

  function toStationId(stopId: string): string | null {
    const stop = stopById.get(stopId);
    if (!stop) return null;
    return stop.parent_station || (stop.location_type === "1" ? stop.stop_id : null);
  }

  // Poslední zastávka spoje (max. stop_sequence pro daný trip_id) je jen
  // PŘÍJEZD — GTFS tam vždy vyplní departure_time (typicky rovný
  // arrival_time), ale nejde o skutečnou nabídku odjezdu (vlak dál v
  // rámci tohoto spoje nepokračuje). Bez tohohle by odjezdový panel na
  // konečné stanici omylem nabízel "odjezdy" směrem k sobě samé (viz
  // ověřeno na reálných datech — Černý Most, spoj s headsignem "Černý
  // Most" == vlastní stanice).
  const maxSequenceByTrip = new Map<string, number>();
  for (const row of stopTimes) {
    const sequence = Number(row.stop_sequence);
    if (!Number.isFinite(sequence)) continue;
    const current = maxSequenceByTrip.get(row.trip_id);
    if (current === undefined || sequence > current) maxSequenceByTrip.set(row.trip_id, sequence);
  }

  // stationId -> line -> directionId -> odjezdy
  const byStation = new Map<string, Map<MetroLine, Map<"0" | "1", DepartureRow[]>>>();
  const usedServiceIds = new Set<string>();

  for (const row of stopTimes) {
    const tripInfo = tripInfoById.get(row.trip_id);
    if (!tripInfo) continue;

    const sequence = Number(row.stop_sequence);
    if (Number.isFinite(sequence) && sequence === maxSequenceByTrip.get(row.trip_id)) continue; // poslední zastávka = jen příjezd, ne odjezd

    const stationId = toStationId(row.stop_id);
    if (!stationId) continue;

    const seconds = parseGtfsTimeToSeconds(row.departure_time);
    if (seconds === null) continue;

    let byLine = byStation.get(stationId);
    if (!byLine) {
      byLine = new Map();
      byStation.set(stationId, byLine);
    }
    let byDirection = byLine.get(tripInfo.line);
    if (!byDirection) {
      byDirection = new Map();
      byLine.set(tripInfo.line, byDirection);
    }
    let list = byDirection.get(tripInfo.directionId);
    if (!list) {
      list = [];
      byDirection.set(tripInfo.directionId, list);
    }

    list.push({ time: seconds, headsign: tripInfo.headsign, serviceId: tripInfo.serviceId });
    usedServiceIds.add(tripInfo.serviceId);
  }

  const calendarDefinitions = buildCalendarDefinitions(calendars, calendarDates, usedServiceIds);

  const stationNameById = new Map<string, string>();
  for (const stop of stops) {
    if (stop.location_type === "1") stationNameById.set(stop.stop_id, stop.stop_name);
  }

  const files = new Map<string, StationDeparturesFile>();

  for (const [stationId, byLine] of byStation) {
    const lines: LineGroup[] = [];

    for (const [line, byDirection] of byLine) {
      const directions: DirectionGroup[] = [];

      for (const [directionId, departures] of byDirection) {
        if (departures.length === 0) continue;

        // Nejčastější headsign = popisek volby směru; krátce ukončené
        // spoje si i tak nesou VLASTNÍ headsign na každém řádku (viz
        // zadání bod 6/17 — "zobraz skutečný směr konkrétního spoje").
        const headsignCounts = new Map<string, number>();
        for (const departure of departures) {
          headsignCounts.set(departure.headsign, (headsignCounts.get(departure.headsign) ?? 0) + 1);
        }
        const dominantHeadsign = [...headsignCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];

        departures.sort((a, b) => a.time - b.time);

        directions.push({ directionId, headsign: dominantHeadsign, departures });
      }

      if (directions.length > 0) {
        directions.sort((a, b) => a.directionId.localeCompare(b.directionId));
        lines.push({ line, directions });
      }
    }

    if (lines.length === 0) continue;

    lines.sort((a, b) => a.line.localeCompare(b.line));

    const usedByThisStation = new Set(lines.flatMap((l) => l.directions.flatMap((d) => d.departures.map((dep) => dep.serviceId))));

    files.set(stationId, {
      stationId,
      stationName: stationNameById.get(stationId) ?? stationId,
      generatedAt: meta.generatedAt,
      source: meta.source,
      lines,
      calendars: calendarDefinitions.filter((c) => usedByThisStation.has(c.serviceId)),
    });
  }

  return files;
}
