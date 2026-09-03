import type { ParkAndRide, ParkingOccupancy } from "./types.ts";

/**
 * Živé měření Golemio se u pražských P+R aktualizuje typicky každé 1–2
 * minuty (ověřeno živě 2026-09-03), appka sama cachuje na serveru
 * ~3–5 minut (viz app/api/park-and-ride/route.ts) — 15 minut je
 * bezpečná hranice "ještě aktuální" i s rezervou pro dočasný výpadek
 * zdroje, než začneme měření označovat jako zastaralé (viz zadání
 * "starší než rozumná hranice, například 15 nebo 30 minut").
 */
export const OCCUPANCY_STALE_AFTER_MINUTES = 15;

export type OccupancyDisplayState =
  | { kind: "unmeasured"; capacity: number | null }
  | { kind: "fresh"; freeSpaces: number; totalSpaces: number; band: "green" | "orange" | "red" }
  | { kind: "stale"; freeSpaces: number; updatedAt: string }
  | { kind: "load-error"; capacity: number | null };

function computeBand(freeSpaces: number, totalSpaces: number): "green" | "orange" | "red" {
  if (freeSpaces <= 0) return "red";
  const freeRatio = totalSpaces > 0 ? freeSpaces / totalSpaces : 0;
  return freeRatio > 0.1 ? "green" : "orange";
}

function isStale(updatedAt: string, now: Date): boolean {
  const updatedMs = new Date(updatedAt).getTime();
  if (Number.isNaN(updatedMs)) return true;
  const ageMinutes = (now.getTime() - updatedMs) / (60 * 1000);
  return ageMinutes > OCCUPANCY_STALE_AFTER_MINUTES;
}

/**
 * Rozhodne, jak zobrazit obsazenost daného P+R — viz zadání bod 7.
 * `occupancy === null` (fetch selhal/nikdy neproběhl) se odlišuje od
 * `occupancy` bez volných míst v datech (P+R, které online obsazenost
 * vůbec nesleduje, jen jsme se o to úspěšně zeptali) — první je
 * `"load-error"`, druhé `"unmeasured"`. `freeSpaces = 0` je vždy
 * "plno", nikdy důvod přepnout na "unmeasured"/"load-error".
 */
export function resolveOccupancyDisplay(
  parkAndRide: Pick<ParkAndRide, "capacity">,
  occupancy: ParkingOccupancy | null,
  fetchFailed: boolean,
  now: Date
): OccupancyDisplayState {
  if (fetchFailed) return { kind: "load-error", capacity: parkAndRide.capacity };

  if (!occupancy || occupancy.freeSpaces === null || !occupancy.updatedAt) {
    return { kind: "unmeasured", capacity: parkAndRide.capacity };
  }

  if (isStale(occupancy.updatedAt, now)) {
    return { kind: "stale", freeSpaces: occupancy.freeSpaces, updatedAt: occupancy.updatedAt };
  }

  const totalSpaces = occupancy.totalSpaces ?? parkAndRide.capacity;
  if (totalSpaces === null) {
    // Máme čerstvé volná místa, ale žádný jmenovatel k dopočtu barvy/podílu —
    // zobrazí se jen jako "unmeasured" fallback na kapacitu (žádnou nemáme),
    // což v praxi u aktuálních dat Golemio nenastává (total_spot_number je
    // vždy vyplněné, když je vyplněné free_spot_number), ale typově to
    // ošetřujeme, ať funkce nikdy nevrátí nesmyslné dělení nulou/undefined.
    return { kind: "unmeasured", capacity: parkAndRide.capacity };
  }

  return {
    kind: "fresh",
    freeSpaces: occupancy.freeSpaces,
    totalSpaces,
    band: computeBand(occupancy.freeSpaces, totalSpaces),
  };
}
