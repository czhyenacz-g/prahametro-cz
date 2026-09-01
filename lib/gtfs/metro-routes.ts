import type { GtfsRoute } from "./types.ts";
import { METRO_LINES, type MetroLine } from "../metro/types.ts";

/**
 * Jediné, sdílené místo, kde appka rozhoduje "co je metro linka" —
 * `route_type === "1"` je GTFS standard pro metro/subway (viz zadání
 * "ověř skutečnou strukturu feedu, neodhaduj podle jména"), `route_short_name`
 * (A/B/C/D) se použije jen jako ČITELNÝ popisek pro už takhle
 * identifikovanou linku, ne jako primární identifikátor. Používá
 * lib/gtfs/extract-metro-entrances.ts, lib/gtfs/derive-line-order.ts i
 * lib/gtfs/build-departures.ts, ať existuje jen jedna implementace.
 */
export function getMetroRouteLines(routes: readonly GtfsRoute[]): Map<string, MetroLine> {
  const metroRouteLines = new Map<string, MetroLine>();
  for (const route of routes) {
    if (route.route_type !== "1") continue;
    const shortName = route.route_short_name.trim().toUpperCase();
    if ((METRO_LINES as readonly string[]).includes(shortName)) {
      metroRouteLines.set(route.route_id, shortName as MetroLine);
    }
  }
  return metroRouteLines;
}
