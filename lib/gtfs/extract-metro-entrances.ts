import type { GtfsRoute, GtfsStop, GtfsStopTime, GtfsTrip } from "./types.ts";
import { METRO_LINES, type MetroEntrance, type MetroLine } from "../metro/types.ts";

const WHEELCHAIR_MAP: Record<string, MetroEntrance["wheelchair"]> = {
  "1": "yes",
  "2": "no",
};

/**
 * Čistá funkce bez I/O — vezme syrové GTFS tabulky (routes/trips/stops/
 * stop_times) a vrátí jen skutečné vstupy do metra. Postup přesně podle
 * zadání:
 *  1. routes.txt s route_type=1 → metro linky (podle route_short_name
 *     A/B/C/D — cokoliv jiného se přeskočí, ne shodí import).
 *  2. trips.txt patřící těmto route_id → metro spoje.
 *  3. stop_times.txt těchto spojů → obsluhované "stop body"; jejich
 *     parent_station (případně stop_id samotné, pokud je stop rovnou
 *     stanice s location_type=1) tvoří množinu stanic metra a zároveň
 *     se u nich sbírá, kterými linkami je daná stanice obsluhovaná.
 *  4. stops.txt s location_type=2 (vstup), jejichž parent_station patří
 *     do množiny stanic metra → jeden MetroEntrance na řádek.
 *
 * `stopTimes` může být předem vyfiltrované jen na metro spoje (viz
 * scripts/import-pid-gtfs.ts, kvůli paměti u obřího stop_times.txt) —
 * funkce to nevyžaduje, filtruje si sama přes routes/trips, takže testy
 * mohou klidně poslat směs metro i nemetro řádků.
 */
export function extractMetroEntrances(
  routes: GtfsRoute[],
  trips: GtfsTrip[],
  stops: GtfsStop[],
  stopTimes: GtfsStopTime[]
): MetroEntrance[] {
  const metroRouteLines = new Map<string, MetroLine>();
  for (const route of routes) {
    if (route.route_type !== "1") continue;
    const shortName = route.route_short_name.trim().toUpperCase();
    if ((METRO_LINES as readonly string[]).includes(shortName)) {
      metroRouteLines.set(route.route_id, shortName as MetroLine);
    }
  }

  const tripLines = new Map<string, MetroLine>();
  for (const trip of trips) {
    const line = metroRouteLines.get(trip.route_id);
    if (line) tripLines.set(trip.trip_id, line);
  }

  const stopById = new Map<string, GtfsStop>();
  for (const stop of stops) stopById.set(stop.stop_id, stop);

  // stationId -> které linky ji obsluhují (z reálného provozu, ne z
  // topologie mapy — proto "linka D" nebude nikde, dokud GTFS neobsahuje
  // žádný route_type=1 s route_short_name "D").
  const stationLines = new Map<string, Set<MetroLine>>();

  for (const stopTime of stopTimes) {
    const line = tripLines.get(stopTime.trip_id);
    if (!line) continue;

    const stop = stopById.get(stopTime.stop_id);
    if (!stop) continue;

    const stationId = stop.parent_station || (stop.location_type === "1" ? stop.stop_id : "");
    if (!stationId) continue;

    let set = stationLines.get(stationId);
    if (!set) {
      set = new Set();
      stationLines.set(stationId, set);
    }
    set.add(line);
  }

  const byId = new Map<string, MetroEntrance>();

  for (const stop of stops) {
    if (stop.location_type !== "2") continue;
    if (!stop.parent_station) continue;

    const lines = stationLines.get(stop.parent_station);
    if (!lines || lines.size === 0) continue;

    const station = stopById.get(stop.parent_station);
    const lat = Number(stop.stop_lat);
    const lon = Number(stop.stop_lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

    const entrance: MetroEntrance = {
      id: stop.stop_id,
      stationId: stop.parent_station,
      stationName: station?.stop_name ?? stop.parent_station,
      entranceLabel: stop.stop_name,
      lat,
      lon,
      wheelchair: WHEELCHAIR_MAP[stop.wheelchair_boarding] ?? "unknown",
      lines: [...lines].sort(),
    };

    // Množina klíčovaná na `id` (= GTFS stop_id, měl by být unikátní)
    // sama odstraní přesné duplicity a nikdy neslučuje různé GPS body
    // se stejným entranceLabel (ty mají různé stop_id, tedy různý klíč).
    byId.set(entrance.id, entrance);
  }

  return [...byId.values()].sort((a, b) => {
    const byStation = a.stationName.localeCompare(b.stationName, "cs");
    if (byStation !== 0) return byStation;
    const byLabel = a.entranceLabel.localeCompare(b.entranceLabel, "cs");
    if (byLabel !== 0) return byLabel;
    return a.id.localeCompare(b.id);
  });
}

export function countUniqueStations(entrances: MetroEntrance[]): number {
  return new Set(entrances.map((e) => e.stationId)).size;
}
