"use client";

import { useEffect, useRef, useState } from "react";
import { classifyOutsidePrague, type OutsidePragueStatus } from "../lib/metro/brno.ts";
import { nearestEntrances, nearestStationEntrances, type EntranceWithDistance } from "../lib/metro/nearest-entrances.ts";
import { buildMatrixCacheKey } from "../lib/routing/matrix-cache-key.ts";
import {
  WALKING_MATRIX_ENTRANCES_PER_STATION,
  WALKING_MATRIX_FALLBACK_POOL_LIMIT,
  WALKING_MATRIX_STATION_LIMIT,
  WALKING_MATRIX_TIMEOUT_MS,
  MAPY_ROUTE_TYPE_FOOT_FAST,
} from "../lib/routing/constants.ts";
import { fetchWalkingMatrix, MapyRoutingError } from "../lib/routing/mapy-walking-matrix.ts";
import { rankWalkingResults, type FinalEntranceResult } from "../lib/routing/rank-walking-results.ts";
import { selectWalkingRouteCandidates } from "../lib/routing/select-walking-route-candidates.ts";
import type { MetroEntrance } from "../lib/metro/types.ts";

// Musí odpovídat existující hranici "mimo Prahu" v components/
// FinderSection.tsx (a components/night/NightFinder.tsx, kde je stejná
// hodnota nezávisle na metru) — viz zadání "nevytvářej druhou
// konfliktní hranici". Projekt tuhle konstantu už dnes takhle duplikuje
// mezi metrem a nočním MHD, tohle je stejný zavedený vzor, ne nový.
const OUTSIDE_PRAGUE_THRESHOLD_M = 25_000;

const RESULT_LIMIT = 3;

// Modulová (ne komponentová) cache — přežije re-rendery i re-mount
// FinderSection/HomeClient v rámci jedné otevřené stránky, zanikne až
// při skutečném zavření/reloadu stránky (viz zadání bod 13). Cachuje
// samotný Promise (ne jen výsledek), aby ani React StrictMode dvojité
// spuštění efektu v developmentu nevytvořilo druhý network request pro
// stejné hledání.
const matrixRequestCache = new Map<string, Promise<FinalEntranceResult[] | null>>();

function toAirDistanceResults(entrances: readonly EntranceWithDistance[]): FinalEntranceResult[] {
  return entrances.map((entrance) => ({ entrance, distanceMeters: entrance.distanceMeters, durationSeconds: null, source: "air-distance" as const }));
}

export type MetroFinderResults = {
  /** Vždy k dispozici okamžitě po získání polohy (vzdušná vzdálenost) — nahrazeno routovanými výsledky, jakmile jsou hotové. */
  results: FinalEntranceResult[];
  /** True, dokud probíhá matrix request na pozadí — karty výše zůstávají použitelné (viz zadání bod 10). */
  isRefining: boolean;
  outsidePragueStatus: OutsidePragueStatus;
  closestOverall: EntranceWithDistance | null;
  /** Stanice odpovídající AKTUÁLNĚ zobrazeným `results` — `null`, dokud routing neuspěl (volající pak použije svůj vlastní výchozí vzdušný výpočet zvýraznění, viz HomeClient.tsx). */
  routedStationIds: ReadonlySet<string> | null;
  /** True, jakmile appka pro TOHLE hledání skutečně zkusila zavolat Mapy.com (bez ohledu na výsledek) — mění disclaimer u air-distance karet z obecného na "toto je fallback" (viz zadání bod 11). */
  routingAttempted: boolean;
};

/**
 * Centralizuje výběr tří zobrazených vstupů pro FinderSection A zvýraznění
 * v mapě pro HomeClient/MetroMap — jediné místo, které ví o "napřed
 * vzdušně, pak zpřesnit přes Mapy.com Matrix Routing" (viz zadání). Mimo
 * Prahu se routing nikdy nevolá (zachovává úplně původní vzdušné
 * chování, viz zadání bod 3).
 */
export function useMetroFinderResults(entrances: MetroEntrance[], position: { lat: number; lon: number } | null): MetroFinderResults {
  const closestOverall = position ? (nearestEntrances(position, entrances, 1)[0] ?? null) : null;
  const outsidePragueStatus: OutsidePragueStatus =
    position && closestOverall ? classifyOutsidePrague(closestOverall.distanceMeters, position, OUTSIDE_PRAGUE_THRESHOLD_M) : { kind: "in-prague" };
  const isOutsidePrague = outsidePragueStatus.kind === "outside-prague";

  const preliminaryResults: EntranceWithDistance[] = position
    ? isOutsidePrague
      ? nearestStationEntrances(position, entrances, RESULT_LIMIT)
      : nearestEntrances(position, entrances, RESULT_LIMIT)
    : [];

  const [routedResults, setRoutedResults] = useState<FinalEntranceResult[] | null>(null);
  const [isRefining, setIsRefining] = useState(false);
  const [routingAttempted, setRoutingAttempted] = useState(false);
  const generationRef = useRef(0);

  const lat = position?.lat ?? null;
  const lon = position?.lon ?? null;

  useEffect(() => {
    // Nové hledání (nová poloha, demo poloha, reset) vždy zahazuje
    // předchozí routovaný výsledek — do doby, než tenhle efekt případně
    // doběhne, se zobrazují preliminaryResults (vzdušná vzdálenost).
    const myGeneration = ++generationRef.current;
    setRoutedResults(null);
    setIsRefining(false);
    setRoutingAttempted(false);

    if (lat === null || lon === null || isOutsidePrague) return;

    const apiKey = process.env.NEXT_PUBLIC_MAPY_API_KEY;
    if (!apiKey) return; // routing nedostupný -> zůstává jen vzdušný výpočet (viz zadání bod 3)

    const origin = { lat, lon };
    const candidates = selectWalkingRouteCandidates(origin, entrances, WALKING_MATRIX_STATION_LIMIT, WALKING_MATRIX_ENTRANCES_PER_STATION);
    if (candidates.length === 0) return;

    const cacheKey = buildMatrixCacheKey(origin, candidates.map((c) => c.id), MAPY_ROUTE_TYPE_FOOT_FAST);
    const controller = new AbortController();

    setIsRefining(true);
    setRoutingAttempted(true);

    let request = matrixRequestCache.get(cacheKey);
    if (!request) {
      const fallbackPool = nearestEntrances(origin, entrances, WALKING_MATRIX_FALLBACK_POOL_LIMIT);
      request = fetchWalkingMatrix(
        origin,
        candidates.map((c) => ({ entranceId: c.id, coordinates: { lat: c.lat, lon: c.lon } })),
        { apiKey, signal: controller.signal, timeoutMs: WALKING_MATRIX_TIMEOUT_MS }
      )
        .then((routed) => rankWalkingResults(candidates, routed, fallbackPool, RESULT_LIMIT))
        .catch((error) => {
          // Neúspěch se nekešuje natrvalo — příští hledání (jiná poloha,
          // nebo tahle appka příště) to může zkusit znovu. Žádný
          // agresivní retry v rámci JEDNOHO hledání (viz zadání).
          matrixRequestCache.delete(cacheKey);
          if (error instanceof MapyRoutingError) return null;
          throw error;
        });
      matrixRequestCache.set(cacheKey, request);
    }

    request.then((ranked) => {
      // Starší odpověď nesmí přepsat novější hledání (viz zadání bod 7).
      if (generationRef.current !== myGeneration) return;
      setIsRefining(false);
      if (ranked !== null) setRoutedResults(ranked);
      // ranked === null -> routedResults zůstává null, tedy se dál
      // zobrazují preliminaryResults beze změny (přesně původní tři
      // vzdušné výsledky, viz zadání).
    });

    return () => {
      controller.abort();
    };
    // entrances je stabilní reference po celou dobu života stránky (viz
    // HomeClient.tsx — načtená jednou ze serveru), lat/lon jsou primitivní
    // hodnoty ze `status`, takže identická poloha efekt znovu nespustí
    // (řeší "opakované kliknutí na hledání" beze zvláštní logiky navíc).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lon, isOutsidePrague, entrances]);

  const results = routedResults ?? toAirDistanceResults(preliminaryResults);

  return {
    results,
    isRefining,
    outsidePragueStatus,
    closestOverall,
    routedStationIds: routedResults ? new Set(routedResults.map((r) => r.entrance.stationId)) : null,
    routingAttempted,
  };
}
