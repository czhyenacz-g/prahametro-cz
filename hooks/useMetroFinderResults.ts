"use client";

import { useEffect, useRef, useState } from "react";
import { classifyOutsidePrague, type OutsidePragueStatus } from "../lib/metro/brno.ts";
import { nearestEntrances, nearestStationEntrances, type EntranceWithDistance } from "../lib/metro/nearest-entrances.ts";
import { buildMatrixCacheKey } from "../lib/routing/matrix-cache-key.ts";
import { matrixCircuitBreaker } from "../lib/routing/matrix-circuit-breaker.ts";
import {
  WALKING_MATRIX_CACHE_MAX_AGE_MS,
  WALKING_MATRIX_CACHE_MAX_DISTANCE_METERS,
  WALKING_MATRIX_ENTRANCES_PER_STATION,
  WALKING_MATRIX_FALLBACK_POOL_LIMIT,
  WALKING_MATRIX_STATION_LIMIT,
  WALKING_MATRIX_TIMEOUT_MS,
  MAPY_ROUTE_TYPE_FOOT_FAST,
} from "../lib/routing/constants.ts";
import { emitWalkingMatrixEvent } from "../lib/routing/events.ts";
import { InFlightRequestMap } from "../lib/routing/in-flight-request-map.ts";
import { fetchWalkingMatrix, MapyRoutingError } from "../lib/routing/mapy-walking-matrix.ts";
import { matrixResultCache } from "../lib/routing/matrix-result-cache.ts";
import { rankWalkingResults, type FinalEntranceResult } from "../lib/routing/rank-walking-results.ts";
import { selectWalkingRouteCandidates } from "../lib/routing/select-walking-route-candidates.ts";
import type { WalkingRouteResult } from "../lib/routing/mapy-walking-matrix.ts";
import type { MetroEntrance } from "../lib/metro/types.ts";

// Musí odpovídat existující hranici "mimo Prahu" v components/
// FinderSection.tsx (a components/night/NightFinder.tsx, kde je stejná
// hodnota nezávisle na metru) — viz zadání "nevytvářej druhou
// konfliktní hranici". Projekt tuhle konstantu už dnes takhle duplikuje
// mezi metrem a nočním MHD, tohle je stejný zavedený vzor, ne nový.
const OUTSIDE_PRAGUE_THRESHOLD_M = 25_000;

const RESULT_LIMIT = 3;

// Modulové (ne komponentové) instance — přežijí re-rendery i re-mount
// FinderSection/HomeClient v rámci jedné otevřené stránky, zaniknou až
// při skutečném zavření/reloadu stránky (viz zadání bod 3/12). Žádná
// persistence (localStorage/sessionStorage/DB) v žádné z nich.
const inFlightRequests = new InFlightRequestMap<WalkingRouteResult[]>();

function toAirDistanceResults(entrances: readonly EntranceWithDistance[]): FinalEntranceResult[] {
  return entrances.map((entrance) => ({ entrance, distanceMeters: entrance.distanceMeters, durationSeconds: null, source: "air-distance" as const }));
}

export type MetroFinderResults = {
  /** Vždy k dispozici okamžitě po získání polohy (vzdušná vzdálenost) — nahrazeno routovanými výsledky, jakmile jsou hotové (z cache, nebo po síťovém requestu). */
  results: FinalEntranceResult[];
  /** True, dokud probíhá matrix request na pozadí — karty výše zůstávají použitelné (viz zadání bod 10 z prvního zadání / bod 1 z tohohle). */
  isRefining: boolean;
  outsidePragueStatus: OutsidePragueStatus;
  closestOverall: EntranceWithDistance | null;
  /** Stanice odpovídající AKTUÁLNĚ zobrazeným `results` — `null`, dokud routing neuspěl (volající pak použije svůj vlastní výchozí vzdušný výpočet zvýraznění, viz HomeClient.tsx). */
  routedStationIds: ReadonlySet<string> | null;
  /** True, jakmile appka pro TOHLE hledání skutečně zkusila zavolat Mapy.com NEBO použila cache (bez ohledu na výsledek) — mění per-card disclaimer u air-distance karet z obecného na "toto je fallback". */
  routingAttempted: boolean;
  /** True, jen když routing pro TOHLE hledání skutečně proběhl (ne cache hit, ne "bez klíče"/"mimo Prahu") a skončil BEZ jediného použitelného výsledku — spouští `dict.finder.routingFallbackNotice` pod výsledky (viz zadání bod 8). */
  routingFailed: boolean;
};

/**
 * Centralizuje výběr tří zobrazených vstupů pro FinderSection a
 * zvýraznění v mapě pro HomeClient/MetroMap — jediné místo, které ví o
 * "napřed vzdušně, pak zpřesnit přes Mapy.com Matrix Routing" (viz
 * zadání). Mimo Prahu se routing nikdy nevolá (zachovává úplně původní
 * vzdušné chování, viz zadání bod 3 z prvního zadání).
 *
 * Odolnost (druhé zadání): poslední úspěšný výsledek se do 5 minut / 100
 * metrů znovu použije bez network requestu (matrixResultCache), souběžné
 * shodné požadavky sdílejí jeden Promise (inFlightRequests), a po
 * autorizační/kreditové chybě (401/402/403) appka přestane Matrix API
 * volat úplně (circuit breaker), po 429/5xx aspoň na 5 minut (cooldown)
 * — viz lib/routing/matrix-circuit-breaker.ts a docs/ROUTING.md.
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
  const [routingFailed, setRoutingFailed] = useState(false);
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
    setRoutingFailed(false);

    if (lat === null || lon === null || isOutsidePrague) return;

    const apiKey = process.env.NEXT_PUBLIC_MAPY_API_KEY;
    if (!apiKey) return; // routing nedostupný -> zůstává jen vzdušný výpočet, beze zprávy (viz zadání bod 9)

    const origin = { lat, lon };
    const candidates = selectWalkingRouteCandidates(origin, entrances, WALKING_MATRIX_STATION_LIMIT, WALKING_MATRIX_ENTRANCES_PER_STATION);
    if (candidates.length === 0) return;

    const candidateIds = candidates.map((c) => c.id).sort();
    const now = Date.now();

    // 1) Poslední úspěšný výpočet do 5 min / 100 m / stejní kandidáti —
    // žádný network request, jen okamžité znovupoužití (viz zadání bod 3).
    const cached = matrixResultCache.get({
      now,
      position: origin,
      candidateIds,
      routeType: MAPY_ROUTE_TYPE_FOOT_FAST,
      maxAgeMs: WALKING_MATRIX_CACHE_MAX_AGE_MS,
      maxDistanceMeters: WALKING_MATRIX_CACHE_MAX_DISTANCE_METERS,
    });
    if (cached) {
      emitWalkingMatrixEvent({ type: "walking_matrix_cache_hit" });
      setRoutedResults(cached);
      setRoutingAttempted(true);
      return;
    }

    // 2) Circuit breaker (401/402/403) nebo cooldown (429/5xx) aktivní
    // z dřívějška v tomhle načtení stránky — žádný další pokus, rovnou
    // fallback (viz zadání bod 7).
    if (!matrixCircuitBreaker.canRequest(now)) {
      setRoutingAttempted(true);
      setRoutingFailed(true);
      emitWalkingMatrixEvent({ type: "walking_matrix_fallback" });
      return;
    }

    const cacheKey = buildMatrixCacheKey(origin, candidateIds, MAPY_ROUTE_TYPE_FOOT_FAST);
    const controller = new AbortController();
    const fallbackPool = nearestEntrances(origin, entrances, WALKING_MATRIX_FALLBACK_POOL_LIMIT);

    setIsRefining(true);
    setRoutingAttempted(true);
    emitWalkingMatrixEvent({ type: "walking_matrix_requested" });

    // Souběžné shodné požadavky (Strict Mode dvojité spuštění efektu,
    // dvojité kliknutí) sdílejí TENTO JEDEN Promise, ne vlastní fetch
    // (viz zadání bod 4).
    const request = inFlightRequests.run(cacheKey, () =>
      fetchWalkingMatrix(
        origin,
        candidates.map((c) => ({ entranceId: c.id, coordinates: { lat: c.lat, lon: c.lon } })),
        { apiKey, signal: controller.signal, timeoutMs: WALKING_MATRIX_TIMEOUT_MS }
      )
    );

    request.then(
      (routed) => {
        const ranked = rankWalkingResults(candidates, routed, fallbackPool, RESULT_LIMIT);
        // Starší odpověď nesmí přepsat novější hledání (viz zadání bod 5/18).
        if (generationRef.current !== myGeneration) return;
        setIsRefining(false);
        if (ranked !== null) {
          matrixResultCache.set({ now: Date.now(), position: origin, candidateIds, routeType: MAPY_ROUTE_TYPE_FOOT_FAST, results: ranked });
          setRoutedResults(ranked);
          emitWalkingMatrixEvent({ type: "walking_matrix_succeeded" });
        } else {
          // HTTP volání proběhlo, ale žádný cíl nebyl použitelný —
          // skutečný neúspěšný pokus, zůstávají preliminaryResults.
          setRoutingFailed(true);
          emitWalkingMatrixEvent({ type: "walking_matrix_fallback" });
        }
      },
      (error: unknown) => {
        if (error instanceof MapyRoutingError) {
          matrixCircuitBreaker.recordFailure(error.status, Date.now());
        }
        if (generationRef.current !== myGeneration) return;
        setIsRefining(false);
        setRoutingFailed(true);
        emitWalkingMatrixEvent({ type: "walking_matrix_fallback" });
      }
    );

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
    routingFailed,
  };
}
