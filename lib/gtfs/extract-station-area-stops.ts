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

/** Nejčastější cílové zastávky (směry) linky na stanovišti — nejvýš `limit`, podle počtu odjezdů, při shodě abecedně. */
export function topHeadsigns(counts: ReadonlyMap<string, number>, limit = 3): string[] {
  return [...counts.entries()]
    .sort(([a, ca], [b, cb]) => cb - ca || a.localeCompare(b, "cs"))
    .slice(0, limit)
    .map(([headsign]) => headsign);
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
 * opak. U každé linky se ukládá i nejvýš 3 nejčastější `trip_headsign`
 * (směr), aby šlo rozlišit stanoviště podle směru.
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
  const tripById = new Map(trips.map((t) => [t.trip_id, t] as const));
  // stop_id -> route_id -> cílová zastávka (trip_headsign) -> počet odjezdů
  const headsignCountsByStop = new Map<string, Map<string, Map<string, number>>>();
  for (const row of areaStopTimes) {
    if (row.pickup_type === "1") continue;
    const last = lastSequenceByTrip.get(row.trip_id);
    if (last !== undefined && Number(row.stop_sequence) >= last) continue;
    const trip = tripById.get(row.trip_id);
    if (!trip) continue;
    let byRoute = headsignCountsByStop.get(row.stop_id);
    if (!byRoute) headsignCountsByStop.set(row.stop_id, (byRoute = new Map()));
    let counts = byRoute.get(trip.route_id);
    if (!counts) byRoute.set(trip.route_id, (counts = new Map()));
    const headsign = (trip.trip_headsign ?? "").trim();
    if (headsign) counts.set(headsign, (counts.get(headsign) ?? 0) + 1);
  }

  const result: StationAreaStopsByStation = {};

  for (const stationId of stationIds) {
    const nodeId = stationIdToNodeId(stationId);
    const platforms = new Map<string, { code: string; name: string; lat: number; lon: number; routes: Map<string, { mode: AreaStopMode; headsigns: Map<string, number> }> }>();

    for (const stop of stops) {
      if (stop.location_type !== "0" || stop.parent_station || stop.asw_node_id !== nodeId) continue;
      const code = stop.platform_code ?? "";
      const lat = parseCoordinate(stop.stop_lat, 90);
      const lon = parseCoordinate(stop.stop_lon, 180);
      if (!code || lat === null || lon === null) continue;

      let platform = platforms.get(code);
      if (!platform) platforms.set(code, (platform = { code, name: stop.stop_name, lat, lon, routes: new Map() }));

      for (const [routeId, counts] of headsignCountsByStop.get(stop.stop_id) ?? []) {
        const route = routeById.get(routeId);
        if (!route || route.route_type === "1") continue;
        let entry = platform.routes.get(route.route_short_name);
        if (!entry) platform.routes.set(route.route_short_name, (entry = { mode: routeTypeToMode(route.route_type), headsigns: new Map() }));
        for (const [headsign, count] of counts) entry.headsigns.set(headsign, (entry.headsigns.get(headsign) ?? 0) + count);
      }
    }

    const list: StationAreaPlatform[] = [...platforms.values()]
      .filter((p) => p.routes.size > 0)
      .map((p) => ({
        code: p.code,
        name: p.name,
        lat: p.lat,
        lon: p.lon,
        routes: [...p.routes.entries()]
          .sort(([a], [b]) => compareRouteNames(a, b))
          .map(([name, { mode, headsigns }]) => {
            const top = topHeadsigns(headsigns);
            return top.length > 0 ? { name, mode, headsigns: top } : { name, mode };
          }),
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
