import { nearestByDistance } from "../metro/nearest-entrances.ts";
import type { NightPlatform, NightStopGroup } from "./types.ts";

/**
 * Tři nejbližší RŮZNÉ zastávkové skupiny (zadání bod 10) — `index.json`
 * už obsahuje jednu položku na skupinu (viz build-night-dataset.ts),
 * takže stačí obecné `nearestByDistance` beze zvláštní deduplikace
 * (na rozdíl od metra, kde `entrances` mají víc řádků na stanici).
 */
export function selectNearestStopGroups(position: { lat: number; lon: number }, stopGroups: readonly NightStopGroup[], limit = 3): (NightStopGroup & { distanceMeters: number })[] {
  return nearestByDistance(position, stopGroups, limit);
}

/**
 * Nejbližší fyzický označník pro pěší navigaci (zadání bod 7/12) — mezi
 * nástupišti detailu skupiny, NIKDY syntetický střed. Všechna nástupiště
 * v `NightStopDetail.platforms` už mají zaručeně aspoň jeden skutečný
 * odjezd (viz build-night-dataset.ts), takže "nejbližší" == "nejbližší
 * relevantní" bez další podmínky.
 */
export function pickNavigationPlatform(position: { lat: number; lon: number }, platforms: readonly NightPlatform[]): (NightPlatform & { distanceMeters: number }) | null {
  return nearestByDistance(position, platforms, 1)[0] ?? null;
}
