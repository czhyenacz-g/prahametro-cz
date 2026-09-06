import { haversineDistanceMeters } from "../metro/haversine.ts";
import type { MetroEntrance } from "../metro/types.ts";

function isValidCoordinate(position: { lat: number; lon: number }): boolean {
  return (
    Number.isFinite(position.lat) &&
    Number.isFinite(position.lon) &&
    position.lat >= -90 &&
    position.lat <= 90 &&
    position.lon >= -180 &&
    position.lon <= 180
  );
}

/**
 * Vybere nejvýš `stationLimit` nejbližších RŮZNÝCH stanic (podle vzdušné
 * vzdálenosti jejich nejbližšího vstupu) a z každé nejvýš
 * `entrancesPerStationLimit` nejbližších vstupů — vstup pro jeden matrix
 * routing request (viz zadání bod 2). Nikdy nedoplňuje počet cílů
 * vzdálenějšími vstupy STEJNÉ stanice jen kvůli dosažení limitu — stanice
 * s jedním vstupem přispěje jen jedním. Neplatná poloha (NaN/Infinity/
 * mimo rozsah) vrátí prázdný seznam, ne pád nebo nesmyslné pořadí.
 */
export function selectWalkingRouteCandidates(
  userPosition: { lat: number; lon: number },
  entrances: readonly MetroEntrance[],
  stationLimit: number,
  entrancesPerStationLimit: number
): MetroEntrance[] {
  if (!isValidCoordinate(userPosition)) return [];

  const withDistance = entrances.map((entrance) => ({ entrance, distanceMeters: haversineDistanceMeters(userPosition, entrance) }));

  const byStation = new Map<string, { entrance: MetroEntrance; distanceMeters: number }[]>();
  for (const item of withDistance) {
    const existing = byStation.get(item.entrance.stationId);
    if (existing) {
      existing.push(item);
    } else {
      byStation.set(item.entrance.stationId, [item]);
    }
  }

  // Stabilní řazení vstupů uvnitř stanice: vzdálenost, pak entranceId
  // (viz zadání "stabilní deterministické řazení, ať výsledky neposkakují").
  for (const items of byStation.values()) {
    items.sort((a, b) => a.distanceMeters - b.distanceMeters || a.entrance.id.localeCompare(b.entrance.id));
  }

  const stations = [...byStation.entries()].map(([stationId, items]) => ({
    stationId,
    items,
    closestDistanceMeters: items[0].distanceMeters,
  }));

  stations.sort((a, b) => a.closestDistanceMeters - b.closestDistanceMeters || a.stationId.localeCompare(b.stationId));

  const result: MetroEntrance[] = [];
  for (const station of stations.slice(0, stationLimit)) {
    for (const item of station.items.slice(0, entrancesPerStationLimit)) {
      result.push(item.entrance);
    }
  }
  return result;
}
