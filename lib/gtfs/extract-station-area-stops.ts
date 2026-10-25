import type { GtfsRoute, GtfsStop, GtfsTrip } from "./types.ts";
import type { AreaStopMode, StationAreaPlatform, StationAreaStopsByStation } from "../stations/area-stops-types.ts";

/** Řádek stop_times.txt jen se sloupci, které výpočet stanovišť potřebuje. */
export type GtfsAreaStopTime = { trip_id: string; stop_id: string; stop_sequence: string; pickup_type: string };

/** "U897S1" -> "897" — PID uzel (asw_node_id) je číselná část stationId metra, viz stops.txt. */
export function stationIdToNodeId(stationId: string): string | null {
  return /^U(\d+)S\d+$/.exec(stationId)?.[1] ?? null;
}

/**
 * Povrchová nástupiště (location_type=0, BEZ parent_station — tedy ne
 * nástupiště metra) se stejným PID uzlem jako stanice metra. Jen jejich
 * stop_id — slouží jako filtr pro stream stop_times.txt.
 */
export function selectAreaStopIds(stops: readonly GtfsStop[], nodeIds: ReadonlySet<string>): Set<string> {
  const ids = new Set<string>();
  for (const stop of stops) {
    if (stop.location_type !== "0" || stop.parent_station) continue;
    if (stop.asw_node_id && nodeIds.has(stop.asw_node_id)) ids.add(stop.stop_id);
  }
  return ids;
}

/** Prázdný řetězec NENÍ 0 (`Number("") === 0`) — chybějící souřadnice musí stanoviště vyřadit, ne ho posadit na nulový poledník. */
function parseCoordinate(value: string | undefined, limit: number): number | null {
  if (!value || value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && Math.abs(n) <= limit ? n : null;
}

function routeTypeToMode(routeType: string): AreaStopMode {
  if (routeType === "0") return "tram";
  if (routeType === "3") return "bus";
  if (routeType === "11") return "trolleybus";
  return "other";
}

function compareRouteNames(a: string, b: string): number {
  return a.length - b.length || a.localeCompare(b, "cs");
}

/**
 * Pro každou stanici metra sestaví seznam povrchových stanovišť (kód
 * stanoviště z `platform_code`, GPS z GTFS) a linek, které z nich podle
 * jízdního řádu skutečně ODJÍŽDĚJÍ. Výstupní zastavení (pickup_type=1)
 * a poslední zastávka spoje (jen příjezd) se nepočítají — jinak by
 * např. výstupní stanoviště na konečné vypadalo jako nástupní.
 *
 * PID má pro stejné fyzické stanoviště víc stop_id (městské vs.
 * příměstské tarifní pásmo, "U897Z1P" a "U897Z1") — slučují se podle
 * kódu stanoviště (kód je v rámci uzlu jedinečný a slouží i jako HTML
 * kotva), souřadnice a název se berou z prvního záznamu v pořadí
 * stops.txt. Stanoviště bez jediného odjezdu se vynechávají. Jedna linka
 * smí odjíždět z více stanovišť (různé směry) — nic tu nepředpokládá
 * opak.
 */
export function extractStationAreaStops(
  stationIds: readonly string[],
  stops: readonly GtfsStop[],
  routes: readonly GtfsRoute[],
  trips: readonly GtfsTrip[],
  areaStopTimes: readonly GtfsAreaStopTime[],
  lastSequenceByTrip: ReadonlyMap<string, number>
): StationAreaStopsByStation {
  const routeById = new Map(routes.map((r) => [r.route_id, r] as const));
  const routeIdByTrip = new Map(trips.map((t) => [t.trip_id, t.route_id] as const));
  const routeIdsByStop = new Map<string, Set<string>>();
  for (const row of areaStopTimes) {
    if (row.pickup_type === "1") continue;
    const last = lastSequenceByTrip.get(row.trip_id);
    if (last !== undefined && Number(row.stop_sequence) >= last) continue;
    const routeId = routeIdByTrip.get(row.trip_id);
    if (!routeId) continue;
    let set = routeIdsByStop.get(row.stop_id);
    if (!set) routeIdsByStop.set(row.stop_id, (set = new Set()));
    set.add(routeId);
  }

  const result: StationAreaStopsByStation = {};

  for (const stationId of stationIds) {
    const nodeId = stationIdToNodeId(stationId);
    const platforms = new Map<string, { code: string; name: string; lat: number; lon: number; routes: Map<string, AreaStopMode> }>();

    for (const stop of stops) {
      if (stop.location_type !== "0" || stop.parent_station || stop.asw_node_id !== nodeId) continue;
      const code = stop.platform_code ?? "";
      const lat = parseCoordinate(stop.stop_lat, 90);
      const lon = parseCoordinate(stop.stop_lon, 180);
      if (!code || lat === null || lon === null) continue;

      let platform = platforms.get(code);
      if (!platform) platforms.set(code, (platform = { code, name: stop.stop_name, lat, lon, routes: new Map() }));

      for (const routeId of routeIdsByStop.get(stop.stop_id) ?? []) {
        const route = routeById.get(routeId);
        if (!route || route.route_type === "1") continue;
        platform.routes.set(route.route_short_name, routeTypeToMode(route.route_type));
      }
    }

    const list: StationAreaPlatform[] = [...platforms.values()]
      .filter((p) => p.routes.size > 0)
      .map((p) => ({
        code: p.code,
        name: p.name,
        lat: p.lat,
        lon: p.lon,
        routes: [...p.routes.entries()].sort(([a], [b]) => compareRouteNames(a, b)).map(([name, mode]) => ({ name, mode })),
      }))
      .sort((a, b) => compareRouteNames(a.code, b.code));

    result[stationId] = list;
  }

  return result;
}

export type AreaStopsWriteDecision = { write: true } | { write: false; reason: string };

/**
 * Pojistka proti přepsání platných dat podezřelým výsledkem (feed bez
 * asw_node_id/platform_code, rozbitý stream…): když nový výsledek nemá
 * pro stanici, která dosud stanoviště měla, ani jedno, zachová se
 * předchozí soubor. Úplně první import (žádná předchozí data) se zapíše,
 * pokud aspoň jedna stanice nějaká stanoviště má.
 */
export function decideAreaStopsWrite(previous: StationAreaStopsByStation | null, next: StationAreaStopsByStation): AreaStopsWriteDecision {
  const nextTotal = Object.values(next).reduce((sum, platforms) => sum + platforms.length, 0);
  if (nextTotal === 0) return { write: false, reason: "nový výsledek neobsahuje žádné stanoviště" };
  if (previous) {
    const lost = Object.keys(next).filter((id) => (previous[id]?.length ?? 0) > 0 && next[id].length === 0);
    if (lost.length > 0) return { write: false, reason: `stanice ${lost.join(", ")} by přišly o všechna stanoviště` };
  }
  return { write: true };
}
