import type { EntranceWithDistance } from "../metro/nearest-entrances.ts";
import type { MetroEntrance } from "../metro/types.ts";
import type { WalkingRouteResult } from "./mapy-walking-matrix.ts";

export type DistanceSource = "walking-route" | "air-distance";

export type FinalEntranceResult = {
  entrance: MetroEntrance;
  distanceMeters: number;
  /** `null` u `air-distance` výsledků — čas se dopočítává z `formatWalkingTime` (viz EntranceResultCard.tsx), ne z tohohle pole. */
  durationSeconds: number | null;
  source: DistanceSource;
};

function toAirDistanceResult(entrance: EntranceWithDistance): FinalEntranceResult {
  return { entrance, distanceMeters: entrance.distanceMeters, durationSeconds: null, source: "air-distance" };
}

/**
 * Seřadí úspěšně routované vstupy podle skutečného pěšího času a vybere
 * `limit` nejrychlejších (viz zadání bod 8). Vrátí `null`, pokud NENÍ
 * žádný platný routovaný výsledek — volající v tom případě musí zachovat
 * přesně původní vzdušné výsledky, ne cokoliv postavené touhle funkcí
 * (viz zadání "pokud neexistuje žádný platný routovaný výsledek,
 * zachovej přesně původní tři výsledky").
 *
 * Pokud je platných routovaných výsledků méně než `limit`, doplní zbytek
 * nejbližšími dosud nepoužitými vstupy z `fallbackPool` (vzdušná
 * vzdálenost) a označí je jako `"air-distance"` (viz zadání "doplnění
 * fallback výsledku při částečné odpovědi").
 */
export function rankWalkingResults(
  candidates: readonly MetroEntrance[],
  routed: readonly WalkingRouteResult[],
  fallbackPool: readonly EntranceWithDistance[],
  limit: number
): FinalEntranceResult[] | null {
  const candidateById = new Map(candidates.map((entrance) => [entrance.id, entrance]));

  const valid = routed
    .filter((r) => r.distanceMeters >= 0 && r.durationSeconds >= 0 && candidateById.has(r.entranceId))
    .map((r) => ({
      entrance: candidateById.get(r.entranceId)!,
      distanceMeters: r.distanceMeters,
      durationSeconds: r.durationSeconds,
    }));

  if (valid.length === 0) return null;

  valid.sort(
    (a, b) =>
      a.durationSeconds - b.durationSeconds || a.distanceMeters - b.distanceMeters || a.entrance.id.localeCompare(b.entrance.id)
  );

  const results: FinalEntranceResult[] = valid
    .slice(0, limit)
    .map((r) => ({ entrance: r.entrance, distanceMeters: r.distanceMeters, durationSeconds: r.durationSeconds, source: "walking-route" as const }));

  if (results.length < limit) {
    const usedIds = new Set(results.map((r) => r.entrance.id));
    for (const fallback of fallbackPool) {
      if (results.length >= limit) break;
      if (usedIds.has(fallback.id)) continue;
      results.push(toAirDistanceResult(fallback));
      usedIds.add(fallback.id);
    }
  }

  return results;
}
