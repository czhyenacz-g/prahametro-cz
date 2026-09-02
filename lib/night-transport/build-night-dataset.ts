import type { GtfsCalendar, GtfsCalendarDate, GtfsRoute, GtfsStop, GtfsStopTimeWithDeparture, GtfsTrip } from "../gtfs/types.ts";
import { parseGtfsTimeToSeconds } from "../gtfs/parse-gtfs-time.ts";
import { buildCalendarDefinitions } from "../departures/build-calendar-definitions.ts";
import type { DepartureRow } from "../departures/types.ts";
import { classifyNightRoutes, type NightRouteWarning } from "./night-routes.ts";
import { getStopGroupKey } from "./stop-groups.ts";
import type { NightLineSummary, NightPlatform, NightRouteAtStop, NightStopDetail, NightStopGroup, NightTransportIndex } from "./types.ts";

export type NightDatasetWarning =
  | NightRouteWarning
  | { kind: "missing-coordinates"; stopId: string }
  | { kind: "trip-without-calendar"; tripId: string; serviceId: string }
  | { kind: "trip-without-direction-or-headsign"; tripId: string };

export type NightDatasetResult = {
  index: NightTransportIndex;
  stopDetails: Map<string, NightStopDetail>;
  warnings: NightDatasetWarning[];
};

// Jen kmen "letišt" (bez koncovky) — čeština skloňuje "Letiště"/"K
// Letišti"/"Letištěm" atd., přesná shoda na "letiště" by přišla o
// nominativní tvary v názvech typu "K Letišti" (ověřeno na reálném
// feedu — noční linka 910 aktuálně obsluhuje zastávku "K Letišti", ne
// "Letiště" samotné).
const AIRPORT_NAME_PATTERN = /letišt/i;

/**
 * Čistá funkce bez I/O — analogie lib/gtfs/build-departures.ts, ale pro
 * noční tramvaje/autobusy místo metra (zadání bod 6). Vstupem jsou
 * syrové GTFS tabulky (stejné, které appka už stahuje pro metro —
 * žádný další soubor navíc), výstupem kompaktní `index.json` +
 * per-skupina detail (zapsané na disk až v scripts/import-pid-gtfs.ts).
 */
export function buildNightDataset(
  routes: readonly GtfsRoute[],
  trips: readonly GtfsTrip[],
  stops: readonly GtfsStop[],
  stopTimes: readonly GtfsStopTimeWithDeparture[],
  calendars: readonly GtfsCalendar[],
  calendarDates: readonly GtfsCalendarDate[],
  meta: { generatedAt: string; source: string; feedStartDate: string; feedEndDate: string }
): NightDatasetResult {
  const warnings: NightDatasetWarning[] = [];

  const { routes: nightRoutes, warnings: routeWarnings } = classifyNightRoutes(routes, trips, stopTimes);
  warnings.push(...routeWarnings);

  type TripInfo = { routeId: string; headsign: string; serviceId: string; directionId: "0" | "1" };
  const tripInfoById = new Map<string, TripInfo>();
  for (const trip of trips) {
    if (!nightRoutes.has(trip.route_id)) continue;
    if (!trip.direction_id || !trip.trip_headsign.trim()) {
      warnings.push({ kind: "trip-without-direction-or-headsign", tripId: trip.trip_id });
    }
    const directionId = trip.direction_id === "1" ? "1" : "0";
    tripInfoById.set(trip.trip_id, { routeId: trip.route_id, headsign: trip.trip_headsign.trim(), serviceId: trip.service_id, directionId });
  }

  const stopById = new Map<string, GtfsStop>();
  for (const stop of stops) stopById.set(stop.stop_id, stop);

  // Poslední zastávka spoje je jen PŘÍJEZD, ne skutečná nabídka odjezdu
  // — stejné pravidlo jako lib/gtfs/build-departures.ts (viz tam
  // podrobný komentář).
  const maxSequenceByTrip = new Map<string, number>();
  for (const row of stopTimes) {
    const sequence = Number(row.stop_sequence);
    if (!Number.isFinite(sequence)) continue;
    const current = maxSequenceByTrip.get(row.trip_id);
    if (current === undefined || sequence > current) maxSequenceByTrip.set(row.trip_id, sequence);
  }

  type GroupAccumulator = {
    name: string;
    platforms: Map<string, { stop: GtfsStop; lines: Set<string> }>;
    // routeId -> directionId -> departures
    routes: Map<string, Map<"0" | "1", DepartureRow[]>>;
  };
  const groups = new Map<string, GroupAccumulator>();
  const usedServiceIds = new Set<string>();
  const missingCoordsReported = new Set<string>();

  for (const row of stopTimes) {
    const tripInfo = tripInfoById.get(row.trip_id);
    if (!tripInfo) continue;

    const sequence = Number(row.stop_sequence);
    if (Number.isFinite(sequence) && sequence === maxSequenceByTrip.get(row.trip_id)) continue; // jen příjezd

    const stop = stopById.get(row.stop_id);
    if (!stop) continue;

    const lat = Number(stop.stop_lat);
    const lon = Number(stop.stop_lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      if (!missingCoordsReported.has(stop.stop_id)) {
        warnings.push({ kind: "missing-coordinates", stopId: stop.stop_id });
        missingCoordsReported.add(stop.stop_id);
      }
      continue;
    }

    const seconds = parseGtfsTimeToSeconds(row.departure_time);
    if (seconds === null) continue;

    const nightRoute = nightRoutes.get(tripInfo.routeId);
    if (!nightRoute) continue;

    const groupKey = getStopGroupKey(stop);
    let group = groups.get(groupKey);
    if (!group) {
      group = { name: stop.stop_name, platforms: new Map(), routes: new Map() };
      groups.set(groupKey, group);
    }

    let platform = group.platforms.get(stop.stop_id);
    if (!platform) {
      platform = { stop, lines: new Set() };
      group.platforms.set(stop.stop_id, platform);
    }
    platform.lines.add(nightRoute.shortName);

    let byDirection = group.routes.get(tripInfo.routeId);
    if (!byDirection) {
      byDirection = new Map();
      group.routes.set(tripInfo.routeId, byDirection);
    }
    let list = byDirection.get(tripInfo.directionId);
    if (!list) {
      list = [];
      byDirection.set(tripInfo.directionId, list);
    }
    list.push({ time: seconds, headsign: tripInfo.headsign, serviceId: tripInfo.serviceId });
    usedServiceIds.add(tripInfo.serviceId);
  }

  const usedServiceIdsWithoutCalendar = new Set<string>();
  const calendarServiceIds = new Set(calendars.map((c) => c.service_id));
  const calendarDateServiceIds = new Set(calendarDates.map((c) => c.service_id));
  for (const serviceId of usedServiceIds) {
    if (!calendarServiceIds.has(serviceId) && !calendarDateServiceIds.has(serviceId)) {
      usedServiceIdsWithoutCalendar.add(serviceId);
    }
  }
  for (const tripId of tripInfoById.keys()) {
    const info = tripInfoById.get(tripId)!;
    if (usedServiceIdsWithoutCalendar.has(info.serviceId)) {
      warnings.push({ kind: "trip-without-calendar", tripId, serviceId: info.serviceId });
    }
  }

  const allCalendars = buildCalendarDefinitions(calendars, calendarDates, usedServiceIds);
  const calendarsById = new Map(allCalendars.map((c) => [c.serviceId, c] as const));

  const stopGroups: NightStopGroup[] = [];
  const stopDetails = new Map<string, NightStopDetail>();
  const lineDestinations = new Map<string, Set<string>>();
  const lineVariantHeadsigns = new Map<string, Set<string>>();
  const airportGroupLines = new Set<string>();

  for (const [groupId, group] of groups) {
    const platforms: NightPlatform[] = [...group.platforms.values()]
      .map(({ stop, lines }): NightPlatform => ({
        id: stop.stop_id,
        platformCode: stop.platform_code ?? "",
        lat: Number(stop.stop_lat),
        lon: Number(stop.stop_lon),
        lines: [...lines].sort(),
      }))
      .sort((a, b) => a.id.localeCompare(b.id));

    const routesAtStop: NightRouteAtStop[] = [];
    for (const [routeId, byDirection] of group.routes) {
      const nightRoute = nightRoutes.get(routeId);
      if (!nightRoute) continue;

      const directions = [...byDirection.entries()]
        .map(([directionId, departures]) => {
          const headsignCounts = new Map<string, number>();
          for (const d of departures) headsignCounts.set(d.headsign, (headsignCounts.get(d.headsign) ?? 0) + 1);
          const dominantHeadsign = [...headsignCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];

          if (!lineDestinations.has(nightRoute.shortName)) lineDestinations.set(nightRoute.shortName, new Set());
          lineDestinations.get(nightRoute.shortName)!.add(dominantHeadsign);
          if (!lineVariantHeadsigns.has(nightRoute.shortName)) lineVariantHeadsigns.set(nightRoute.shortName, new Set());
          for (const headsign of headsignCounts.keys()) lineVariantHeadsigns.get(nightRoute.shortName)!.add(headsign);

          departures.sort((a, b) => a.time - b.time);
          return { directionId, headsign: dominantHeadsign, departures };
        })
        .sort((a, b) => a.directionId.localeCompare(b.directionId));

      routesAtStop.push({ ...nightRoute, directions });

      if (AIRPORT_NAME_PATTERN.test(group.name)) airportGroupLines.add(nightRoute.shortName);
    }

    routesAtStop.sort((a, b) => a.shortName.localeCompare(b.shortName, undefined, { numeric: true }));

    const usedByThisGroup = new Set(routesAtStop.flatMap((r) => r.directions.flatMap((d) => d.departures.map((dep) => dep.serviceId))));
    const groupCalendars = [...usedByThisGroup].map((id) => calendarsById.get(id)).filter((c): c is NonNullable<typeof c> => c !== undefined);

    stopDetails.set(groupId, {
      id: groupId,
      name: group.name,
      generatedAt: meta.generatedAt,
      source: meta.source,
      platforms,
      routes: routesAtStop,
      calendars: groupCalendars,
    });

    // Reprezentativní bod pro HRUBÉ první řazení v index.json (zadání
    // bod 6) — nejbližší SKUTEČNÝ fyzický bod skupiny, nikdy syntetický
    // střed (viz zadání bod 7). Přesná navigace vždy použije konkrétní
    // nástupiště z detailu, viz komponenty/night.
    const representative = platforms[0];

    stopGroups.push({
      id: groupId,
      name: group.name,
      lat: representative.lat,
      lon: representative.lon,
      lines: routesAtStop.map((r) => r.shortName).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
    });
  }

  stopGroups.sort((a, b) => a.name.localeCompare(b.name, "cs"));

  const lines: NightLineSummary[] = [...nightRoutes.values()]
    .sort((a, b) => a.shortName.localeCompare(b.shortName, undefined, { numeric: true }))
    .map((info) => ({
      ...info,
      destinations: [...(lineDestinations.get(info.shortName) ?? [])].sort(),
      hasRouteVariants: (lineVariantHeadsigns.get(info.shortName)?.size ?? 0) > 2, // >2, protože 2 headsigny (jeden na směr) je normální stav, ne varianta trasy
    }));

  const index: NightTransportIndex = {
    generatedAt: meta.generatedAt,
    source: meta.source,
    feedStartDate: meta.feedStartDate,
    feedEndDate: meta.feedEndDate,
    lines,
    stopGroups,
    airportLines: [...airportGroupLines].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
  };

  return { index, stopDetails, warnings };
}
