import { nearestStationEntrances } from "./nearest-entrances.ts";
import type { MetroEntrance } from "./types.ts";

const HIGHLIGHT_COUNT = 3;

/**
 * Tři nejbližší RŮZNÉ stanice pro jemné podtržení jejich názvu v SVG
 * mapě (viz zadání) — nezávislé na výsledkových kartách, které dál
 * používají `nearestEntrances` (nejbližší VSTUPY, ne stanice, viz
 * FinderSection.tsx/MetroMap.tsx detail stanice). Čistá funkce bez
 * vlastního stavu: `null` poloha vždy vrátí prázdnou množinu, takže
 * staré zvýraznění nemůže nikde "zůstat viset" — volající (HomeClient.tsx)
 * ji jen znovu zavolá při každé změně polohy (nové hledání, demo
 * poloha, reset, chyba/zamítnutí).
 */
export function computeHighlightedStationIds(
  position: { lat: number; lon: number } | null,
  entrances: MetroEntrance[]
): ReadonlySet<string> {
  if (!position) return new Set();
  return new Set(nearestStationEntrances(position, entrances, HIGHLIGHT_COUNT).map((entrance) => entrance.stationId));
}
