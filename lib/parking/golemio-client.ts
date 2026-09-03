// Server-only klient pro Golemio v3 Parking API (https://api.golemio.cz)
// — token se čte jen z `process.env.GOLEMIO_API_KEY`, NIKDY se
// nezapisuje do odpovědi vracené klientovi ani do žádného souboru v
// repozitáři. Importuj tohle POUZE z Node scriptu
// (scripts/import-park-and-ride.ts) nebo z Route Handleru
// (app/api/park-and-ride/route.ts) — nikdy z "use client" komponenty
// (projekt nepoužívá balíček `server-only`, tohle pravidlo hlídá jen
// code review/komentář, viz CLAUDE.md).
import type {
  GolemioParkingMeasurement,
  GolemioParkingResponse,
  GolemioParkingTariff,
} from "./golemio-types.ts";

const GOLEMIO_BASE_URL = "https://api.golemio.cz";

export class GolemioApiError extends Error {
  constructor(
    message: string,
    readonly status?: number
  ) {
    super(message);
    this.name = "GolemioApiError";
  }
}

function getApiKey(): string {
  const key = process.env.GOLEMIO_API_KEY;
  if (!key) throw new GolemioApiError("GOLEMIO_API_KEY není nastavený.");
  return key;
}

async function golemioGet<T>(path: string, searchParams: URLSearchParams, timeoutMs: number): Promise<T> {
  const url = new URL(path, GOLEMIO_BASE_URL);
  url.search = searchParams.toString();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      headers: { "X-Access-Token": getApiKey(), Accept: "application/json; charset=utf-8" },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new GolemioApiError(`Golemio API vrátilo HTTP ${response.status} pro ${path}`, response.status);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new GolemioApiError(`Golemio API (${path}) neodpovědělo včas.`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * `GET /v3/parking` s `parkingPolicy[]=park_and_ride` +
 * `primarySource[]=tsk-offstreet` — ověřeno živě 2026-09-03:
 * `tsk-offstreet` (Technická správa komunikací hl. m. Prahy) je
 * jediný zdroj, který skutečně odpovídá oficiální síti pražských P+R
 * u metra (bez filtru vrací API přes 100 park&ride záznamů z CELÉ ČR
 * včetně crowd-sourced OSM tagů). Timeout 10 s — build-time
 * import, ne request na pozadí uživatelovy návštěvy.
 */
export async function fetchParkAndRideParkings(): Promise<GolemioParkingResponse> {
  const params = new URLSearchParams();
  params.append("parkingPolicy[]", "park_and_ride");
  params.append("primarySource[]", "tsk-offstreet");
  params.append("limit", "200");
  return golemioGet<GolemioParkingResponse>("/v3/parking", params, 10_000);
}

/**
 * `GET /v3/parking-measurements` filtrované na konkrétní `parkingId[]`
 * — jeden hromadný request pro všechna naše P+R najednou (viz zadání
 * "nevolat Golemio pro každou kartu zvlášť"), ne dotaz pro každé P+R
 * zvlášť. Timeout kratší (5 s) — tohle běží v request-time API routě,
 * kterou čeká skutečný návštěvník.
 */
export async function fetchParkingMeasurements(parkingIds: readonly string[]): Promise<GolemioParkingMeasurement[]> {
  if (parkingIds.length === 0) return [];

  const params = new URLSearchParams();
  for (const id of parkingIds) params.append("parkingId[]", id);

  return golemioGet<GolemioParkingMeasurement[]>("/v3/parking-measurements", params, 5_000);
}

/** `GET /v3/parking-tariffs/{id}` — voláno jen během build-time importu (cena se v runtime API routě nedopočítává znovu, je součástí uloženého snapshotu). */
export async function fetchParkingTariff(tariffId: string): Promise<GolemioParkingTariff> {
  return golemioGet<GolemioParkingTariff>(`/v3/parking-tariffs/${encodeURIComponent(tariffId)}`, new URLSearchParams(), 10_000);
}
