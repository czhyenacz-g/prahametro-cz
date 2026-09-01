import { haversineDistanceMeters } from "./haversine.ts";
import type { MetroEntrance } from "./types.ts";

export type EntranceWithDistance = MetroEntrance & { distanceMeters: number };

/**
 * Tři nejbližší vstupní body k dané poloze — stabilní řazení podle
 * vzdálenosti (Array.prototype.sort je v Node/moderních JS enginech
 * stabilní, ale řadíme přes sekundární klíč `id` jako tiebreaker pro
 * naprostou jistotu deterministického pořadí u shodných vzdáleností).
 * Klidně vrátí tři vstupy patřící jedné stanici — hledáme vstupy, ne tři
 * různé stanice (viz zadání).
 */
export function nearestEntrances(
  position: { lat: number; lon: number },
  entrances: MetroEntrance[],
  limit = 3
): EntranceWithDistance[] {
  return entrances
    .map((entrance): EntranceWithDistance => ({
      ...entrance,
      distanceMeters: haversineDistanceMeters(position, entrance),
    }))
    .sort((a, b) => a.distanceMeters - b.distanceMeters || a.id.localeCompare(b.id))
    .slice(0, limit);
}
