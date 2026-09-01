import { haversineDistanceMeters } from "./haversine.ts";

/** Přibližný střed Brna (viz zadání) — jen pro lokální vzdušnou vzdálenost, žádný geocoding. */
export const BRNO_CENTER = { lat: 49.1951, lon: 16.6068 };

const BRNO_RADIUS_M = 30_000;

/**
 * True, když je poloha nejvýš 30 km vzdušnou čarou od středu Brna (viz
 * zadání "maximálně 30 km") — čistě lokální výpočet nad existující
 * Haversinovou funkcí, žádné externí volání, poloha nikam neodchází.
 * Volá se JEN když je uživatel zároveň mimo dosavadní práh "mimo
 * Prahu" (viz FinderSection.tsx) — Praha a Brno jsou od sebe skoro
 * 200 km, takže se obě podmínky nikdy nepřekrývají pro reálnou polohu
 * v Praze.
 */
export function isNearBrno(position: { lat: number; lon: number }): boolean {
  return haversineDistanceMeters(position, BRNO_CENTER) <= BRNO_RADIUS_M;
}

export type OutsidePragueStatus = { kind: "in-prague" } | { kind: "outside-prague"; isBrno: boolean };

/**
 * Čisté rozhodnutí "je uživatel mimo Prahu, a pokud ano, je to
 * konkrétně Brno?" (viz FinderSection.tsx/OutsidePragueNotice.tsx) —
 * vytažené do samostatné testovatelné funkce, ať jde ověřit bez
 * renderu komponenty. Nejprve respektuje existující práh "mimo Prahu"
 * (`thresholdMeters`) — Brno se kontroluje, jen když je uživatel už za
 * ním (viz zadání).
 */
export function classifyOutsidePrague(closestDistanceMeters: number, position: { lat: number; lon: number }, thresholdMeters: number): OutsidePragueStatus {
  if (closestDistanceMeters <= thresholdMeters) return { kind: "in-prague" };
  return { kind: "outside-prague", isBrno: isNearBrno(position) };
}
