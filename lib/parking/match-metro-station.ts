import { haversineDistanceMeters } from "../metro/haversine.ts";
import type { MetroEntrance } from "../metro/types.ts";
import type { Coordinates, ParkAndRide } from "./types.ts";

/**
 * Empiricky ověřeno na živých datech Golemio 2026-09-03 (16 skutečných
 * pražských P+R, primární zdroj `tsk-offstreet`): nejvzdálenější
 * legitimní P+R od nejbližšího vstupu metra byl ~370 m (P+R Černý most
 * 2), zatímco první nesouvisející/vzdálené P+R (sezónní Troja, Zahradní
 * Město u tramvaje, Kotlářka, Nádraží Hostivař, Braník, Běchovice,
 * Radotín) začínají až na 651 m a dál. 400 m je proto konzervativní
 * hranice uprostřed tohohle jasného rozestupu — bezpečně zahrne
 * všechna skutečná metro P+R a nepřiřadí žádné vzdálené parkoviště
 * (viz test/park-and-ride-matching.test.ts a docs/PARKING.md pro
 * kompletní tabulku vzdáleností z auditu).
 */
export const MAX_PARK_AND_RIDE_TO_METRO_DISTANCE_METERS = 400;

export type ParkAndRideMatch = {
  metroStationId: string;
  metroDistanceMeters: number;
};

/**
 * Najde nejbližší KONKRÉTNÍ VSTUP (ne střed schematické mapy stanice)
 * napříč VŠEMI vstupy VŠECH stanic k dané P+R poloze — vrací `null`,
 * pokud je nejbližší vstup dál než `MAX_PARK_AND_RIDE_TO_METRO_DISTANCE_METERS`
 * (viz zadání "nepřiřadit vzdálené parkoviště jen aby nějakou stanici
 * mělo"). Když je nejbližší vstup blíž, ale patří jiné stanici než druhý
 * nejbližší o skoro stejnou vzdálenost, vyhrává prostě ten nejbližší —
 * žádná ruční výjimka není v aktuálních datech potřeba (viz zadání bod
 * o "podobně blízko dvěma stanicím").
 */
export function matchParkAndRideToStation(
  position: Coordinates,
  entrances: readonly MetroEntrance[]
): ParkAndRideMatch | null {
  let best: { stationId: string; distanceMeters: number } | null = null;

  for (const entrance of entrances) {
    const distanceMeters = haversineDistanceMeters(position, entrance);
    if (!best || distanceMeters < best.distanceMeters) {
      best = { stationId: entrance.stationId, distanceMeters };
    }
  }

  if (!best || best.distanceMeters > MAX_PARK_AND_RIDE_TO_METRO_DISTANCE_METERS) return null;

  return { metroStationId: best.stationId, metroDistanceMeters: best.distanceMeters };
}

/** Doplní `metroStationId`/`metroDistanceMeters` do P+R záznamů, vyřadí ty bez rozumně blízké stanice. */
export function attachMetroStations(
  parkAndRides: readonly Omit<ParkAndRide, "metroStationId" | "metroDistanceMeters">[],
  entrances: readonly MetroEntrance[]
): ParkAndRide[] {
  const result: ParkAndRide[] = [];

  for (const pr of parkAndRides) {
    const match = matchParkAndRideToStation(pr.coordinates, entrances);
    if (!match) continue;
    result.push({ ...pr, ...match });
  }

  return result;
}
