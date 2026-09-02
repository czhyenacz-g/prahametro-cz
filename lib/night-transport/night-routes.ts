import type { GtfsRoute, GtfsStopTimeWithDeparture, GtfsTrip } from "../gtfs/types.ts";
import { parseGtfsTimeToSeconds } from "../gtfs/parse-gtfs-time.ts";
import type { NightLineCategory, NightRouteInfo, NightVehicleType } from "./types.ts";

/** GTFS route_type: 0 = tramvaj, 3 = autobus (viz zadání bod 5 — "skutečný route_type", ne odhad podle jména). */
const VEHICLE_TYPE_BY_ROUTE_TYPE: Record<string, NightVehicleType | undefined> = { "0": "tram", "3": "bus" };

/** Noční okno použité k validaci "existuje skutečně naplánovaný noční spoj" (zadání bod 5) — 23:00–05:00, GTFS `>24:00:00` čas se normalizuje modulo 24 h. */
function isWithinNightWindow(departureTimeSeconds: number): boolean {
  const normalized = ((departureTimeSeconds % 86_400) + 86_400) % 86_400;
  const hour = normalized / 3600;
  return hour >= 23 || hour < 5;
}

export type NightRouteWarning =
  | { kind: "expected-line-without-trips"; shortName: string }
  | { kind: "new-line-outside-known-range"; shortName: string; vehicleType: NightVehicleType }
  | { kind: "ambiguous-short-name"; routeId: string; shortName: string };

export type NightRouteClassificationResult = {
  /** route_id -> rozpoznaná noční linka. */
  routes: Map<string, NightRouteInfo>;
  warnings: NightRouteWarning[];
};

/** Číselné rozsahy jen jako ORIENTAČNÍ kontrola driftu (zadání "upozorni na novou noční linku mimo dosavadní rozsah") — NIKDY se nepoužívají k samotné klasifikaci, tou je výhradně `is_night`/`route_type`/validace spojů. */
const KNOWN_TRAM_RANGE = { min: 90, max: 99 };
const KNOWN_BUS_RANGE = { min: 900, max: 999 };

function isWithinKnownRange(vehicleType: NightVehicleType, numericName: number): boolean {
  const range = vehicleType === "tram" ? KNOWN_TRAM_RANGE : KNOWN_BUS_RANGE;
  return numericName >= range.min && numericName <= range.max;
}

/**
 * Rychlý předfiltr POUZE nad routes.txt/trips.txt (bez stop_times) —
 * `route_type` + `is_night` + ne-výluka. Used scripts/import-pid-gtfs.ts
 * k vyfiltrování `stop_times.txt` (100+ MB) v JEDNOM průchodu souborem
 * spolu s metrem (viz zadání "jeden průchod pro všechny potřeby
 * najednou"), ještě předtím, než `classifyNightRoutes` níže spoje
 * doopravdy ověří proti nočnímu oknu.
 */
export function getNightCandidateTripIds(routes: readonly GtfsRoute[], trips: readonly GtfsTrip[]): Set<string> {
  const candidateRouteIds = new Set(
    routes.filter((r) => r.is_substitute_transport !== "1" && r.is_night === "1" && VEHICLE_TYPE_BY_ROUTE_TYPE[r.route_type]).map((r) => r.route_id)
  );
  return new Set(trips.filter((t) => candidateRouteIds.has(t.route_id)).map((t) => t.trip_id));
}

/**
 * Jediné, centralizované a testované místo, které rozhoduje "co je noční
 * linka" (zadání bod 5). Reálný PID GTFS feed nese vlastní autoritativní
 * příznaky přímo v `routes.txt` (ověřeno na živých datech, `npm run
 * data:refresh` proti https://data.pid.cz/PID_GTFS.zip):
 *
 *  - `is_night` = "1" — PID sám označuje noční linky, spolehlivější než
 *    hádání podle čísla.
 *  - `is_regional` = "1"/"0" — u autobusů rozlišuje městské (901–918) od
 *    příměstských (951–963) noční linky BEZ nutnosti hádat podle čísla
 *    (zadání bod 16 — tři kategorie v přehledu).
 *  - `is_substitute_transport` = "1" — dočasná výluková náhradní doprava
 *    (v datech např. "X90", "X94", "XS7") — NENÍ stálá součást noční
 *    sítě, vyřazuje se z hlavního datasetu (zadání bod 5 test "linka s
 *    výlukovou variantou" a bod 16 "nezjednodušuj nepravdivě").
 *  - `route_color`/`route_text_color` — skutečná barva PID pro danou
 *    linku, použitá pro badge (zadání bod 13 "jemné barevné rozlišení"),
 *    místo appkou vymyšlené palety.
 *
 * `is_night=1` samotné se ale NEBERE jako dostatečný důkaz (zadání "ne
 * jen z čísla/příznaku bez validace") — funkce navíc požaduje aspoň
 * jeden `stop_time` v nočním okně 23:00–05:00 patřící této lince, jinak
 * linku vynechá a nahlásí varováním `expected-line-without-trips`.
 */
export function classifyNightRoutes(
  routes: readonly GtfsRoute[],
  trips: readonly GtfsTrip[],
  stopTimes: readonly GtfsStopTimeWithDeparture[]
): NightRouteClassificationResult {
  const warnings: NightRouteWarning[] = [];
  const candidateByRouteId = new Map<string, NightRouteInfo>();

  for (const route of routes) {
    if (route.is_substitute_transport === "1") continue; // výluková náhradní doprava, viz komentář výše

    const vehicleType = VEHICLE_TYPE_BY_ROUTE_TYPE[route.route_type];
    if (!vehicleType) continue; // is_night=1 u jiného route_type (např. vlak) appku nezajímá

    if (route.is_night !== "1") continue;

    const shortName = route.route_short_name.trim();
    const numericName = Number(shortName);

    if (!Number.isFinite(numericName) || !/^\d+$/.test(shortName)) {
      warnings.push({ kind: "ambiguous-short-name", routeId: route.route_id, shortName });
      continue; // nečíselné/nejednoznačné označení (zadání bod 5) — appka s ním neumí zacházet, nezahrne ho
    }

    if (!isWithinKnownRange(vehicleType, numericName)) {
      warnings.push({ kind: "new-line-outside-known-range", shortName, vehicleType });
      // I tak se zahrne — je_night=1 z GTFS je autoritativní, číselný rozsah je jen kontrola driftu (viz komentář výše).
    }

    const category: NightLineCategory = vehicleType === "tram" ? "tram" : route.is_regional === "1" ? "regional-bus" : "urban-bus";

    candidateByRouteId.set(route.route_id, {
      routeId: route.route_id,
      shortName,
      vehicleType,
      category,
      colorHex: route.route_color || (vehicleType === "tram" ? "7A0603" : "007DA8"),
      textColorHex: route.route_text_color || "FFFFFF",
    });
  }

  const candidateTripIds = new Set(trips.filter((t) => candidateByRouteId.has(t.route_id)).map((t) => t.trip_id));
  const routeIdByTripId = new Map(trips.filter((t) => candidateTripIds.has(t.trip_id)).map((t) => [t.trip_id, t.route_id] as const));

  const routeIdsWithNightStopTime = new Set<string>();
  for (const stopTime of stopTimes) {
    const routeId = routeIdByTripId.get(stopTime.trip_id);
    if (!routeId) continue;
    const seconds = parseGtfsTimeToSeconds(stopTime.departure_time);
    if (seconds !== null && isWithinNightWindow(seconds)) {
      routeIdsWithNightStopTime.add(routeId);
    }
  }

  const validated = new Map<string, NightRouteInfo>();
  for (const [routeId, info] of candidateByRouteId) {
    if (routeIdsWithNightStopTime.has(routeId)) {
      validated.set(routeId, info);
    } else {
      warnings.push({ kind: "expected-line-without-trips", shortName: info.shortName });
    }
  }

  return { routes: validated, warnings };
}
