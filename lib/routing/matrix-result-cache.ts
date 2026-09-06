import { haversineDistanceMeters } from "../metro/haversine.ts";
import type { FinalEntranceResult } from "./rank-walking-results.ts";

/**
 * Pouze v paměti, pouze POSLEDNÍ úspěšný výpočet (ne obecná víceklíčová
 * cache) — přesně podle zadání: "Výsledek znovu použij, pokud... od
 * posledního úspěšného výpočtu neuplynulo víc než 5 minut, nová poloha
 * je max 100 m od polohy posledního výpočtu, sada kandidátů se
 * nezměnila, režim trasy je pořád pěší." Žádná persistence
 * (localStorage/sessionStorage/DB) — instance žije jen v paměti běžící
 * stránky, viz hooks/useMetroFinderResults.ts.
 */
export class MatrixResultCache {
  private entry: {
    position: { lat: number; lon: number };
    candidateIds: readonly string[];
    routeType: string;
    computedAt: number;
    results: FinalEntranceResult[];
  } | null = null;

  /**
   * Vrátí uložený výsledek, pokud jsou splněné VŠECHNY podmínky
   * (čerstvost, vzdálenost, stejná sada kandidátů, stejný režim), jinak
   * `null` — volající pak musí spustit nový matrix request.
   */
  get(params: {
    now: number;
    position: { lat: number; lon: number };
    candidateIds: readonly string[];
    routeType: string;
    maxAgeMs: number;
    maxDistanceMeters: number;
  }): FinalEntranceResult[] | null {
    const entry = this.entry;
    if (!entry) return null;
    if (params.now - entry.computedAt > params.maxAgeMs) return null;
    if (entry.routeType !== params.routeType) return null;
    if (!sameCandidateSet(entry.candidateIds, params.candidateIds)) return null;
    if (haversineDistanceMeters(entry.position, params.position) > params.maxDistanceMeters) return null;
    return entry.results;
  }

  set(params: { now: number; position: { lat: number; lon: number }; candidateIds: readonly string[]; routeType: string; results: FinalEntranceResult[] }): void {
    this.entry = {
      position: params.position,
      candidateIds: [...params.candidateIds].sort(),
      routeType: params.routeType,
      computedAt: params.now,
      results: params.results,
    };
  }
}

/** Jedna sdílená instance na běžící stránku (viz hooks/useMetroFinderResults.ts) — testy si vytvářejí VLASTNÍ instance přes `new MatrixResultCache()`, ať se navzájem neovlivňují. */
export const matrixResultCache = new MatrixResultCache();

function sameCandidateSet(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedB = [...b].sort();
  const sortedA = [...a].sort(); // `a` je uložené už seřazené (viz set()), ale nespoléhej na to zvenčí
  return sortedA.every((id, i) => id === sortedB[i]);
}
