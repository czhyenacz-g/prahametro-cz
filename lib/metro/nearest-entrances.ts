import { haversineDistanceMeters } from "./haversine.ts";
import type { MetroEntrance } from "./types.ts";

export type EntranceWithDistance = MetroEntrance & { distanceMeters: number };

/** Cokoliv s GPS souřadnicemi a `id` — minimální tvar, který `nearestByDistance`/`nearestGroupedByDistance` potřebují. */
type LocatedPoint = { id: string; lat: number; lon: number };

/**
 * Obecná verze "N nejbližších bodů k dané poloze" — stabilní řazení
 * podle vzdálenosti se sekundárním tiebreakerem `id` pro naprosto
 * deterministické pořadí u shodných vzdáleností. Používá jak metro
 * (`nearestEntrances` níže), tak lib/night-transport (noční zastávky,
 * viz zadání "výpočty vzdálenosti" — jedna sdílená implementace, ne
 * paralelní kopie).
 */
export function nearestByDistance<T extends LocatedPoint>(position: { lat: number; lon: number }, points: readonly T[], limit = 3): (T & { distanceMeters: number })[] {
  return points
    .map((point) => ({ ...point, distanceMeters: haversineDistanceMeters(position, point) }))
    .sort((a, b) => a.distanceMeters - b.distanceMeters || a.id.localeCompare(b.id))
    .slice(0, limit);
}

/**
 * Jako `nearestByDistance`, ale nejdřív pro KAŽDOU skupinu (`groupKey`)
 * vybere jen jejího nejbližšího zástupce, a teprve z těchto zástupců
 * vrátí `limit` nejbližších — použije se, když je uživatel daleko (viz
 * zadání "tři nejbližší RŮZNÉ stanice/zastávkové skupiny, ne tři vstupy
 * stejné stanice").
 */
export function nearestGroupedByDistance<T extends LocatedPoint>(
  position: { lat: number; lon: number },
  points: readonly T[],
  groupKey: (point: T) => string,
  limit = 3
): (T & { distanceMeters: number })[] {
  const withDistance = points.map((point) => ({ ...point, distanceMeters: haversineDistanceMeters(position, point) }));

  const bestPerGroup = new Map<string, T & { distanceMeters: number }>();
  for (const point of withDistance) {
    const key = groupKey(point);
    const current = bestPerGroup.get(key);
    if (!current || point.distanceMeters < current.distanceMeters || (point.distanceMeters === current.distanceMeters && point.id.localeCompare(current.id) < 0)) {
      bestPerGroup.set(key, point);
    }
  }

  return [...bestPerGroup.values()].sort((a, b) => a.distanceMeters - b.distanceMeters || a.id.localeCompare(b.id)).slice(0, limit);
}

/**
 * Tři nejbližší vstupní body k dané poloze — tenký metro-specifický
 * wrapper nad `nearestByDistance` (viz tam). Klidně vrátí tři vstupy
 * patřící jedné stanici — hledáme vstupy, ne tři různé stanice (viz
 * zadání).
 */
export function nearestEntrances(position: { lat: number; lon: number }, entrances: MetroEntrance[], limit = 3): EntranceWithDistance[] {
  return nearestByDistance(position, entrances, limit);
}

/**
 * Jako `nearestEntrances`, ale nejdřív pro KAŽDOU stanici vybere jen
 * její nejbližší vstup, a teprve z těchto "zástupců" vrátí `limit`
 * nejbližších — použije se, když je uživatel daleko od Prahy (viz
 * zadání "tři nejbližší RŮZNÉ stanice, ne tři vstupy stejné stanice").
 */
export function nearestStationEntrances(position: { lat: number; lon: number }, entrances: MetroEntrance[], limit = 3): EntranceWithDistance[] {
  return nearestGroupedByDistance(position, entrances, (e) => e.stationId, limit);
}
