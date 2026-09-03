import type { ParkAndRide, ParkAndRideWithOccupancy, ParkingOccupancy } from "./types.ts";

/**
 * Spojí statická metadata P+R se ŽIVOU obsazeností podle stabilního
 * `id` (viz zadání "spojení metadat a měření podle stabilního ID") —
 * čistá funkce, testovatelná bez sítě. P+R bez odpovídajícího měření
 * dostane `occupancy: null` — chybějící měření NIKDY nezruší/nesmaže
 * statická metadata daného P+R (viz zadání bod 8).
 */
export function mergeParkAndRideWithOccupancy(
  parkAndRides: readonly ParkAndRide[],
  occupancyById: ReadonlyMap<string, ParkingOccupancy>
): ParkAndRideWithOccupancy[] {
  return parkAndRides.map((pr) => ({ ...pr, occupancy: occupancyById.get(pr.id) ?? null }));
}
