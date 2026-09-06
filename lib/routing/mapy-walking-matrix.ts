// Klient pro Mapy.com Matrix Routing API — POUZE vzdálenost/čas pěší
// trasy k více cílům najednou, žádná geometrie (ta se u matrix
// endpointu ani nevrací, viz dokumentace). Endpoint/parametry ověřeny
// přímo z aktuální OpenAPI specifikace
// (https://api.mapy.com/v1/docs/routing/openapi.json, `GET
// /v1/routing/matrix-m`) — ne z předpokladu. `routeType=foot_fast` je
// přesná hodnota z jejich `RouteType` enumu (ne vymyšlená).
//
// Autentizace: Mapy.com podporuje klíč jako query parametr `apikey`
// (ověřeno živě) — klient key je z podstaty veřejný (viditelný v
// síťovém requestu), bezpečnost stojí na referer/domain restriction
// nastavené v Mapy.com administraci (viz docs/ROUTING.md), ne na
// utajení klíče.
import { WALKING_MATRIX_MAX_DESTINATIONS, MAPY_MATRIX_ENDPOINT, MAPY_ROUTE_TYPE_FOOT_FAST } from "./constants.ts";

export type Coordinates = {
  lat: number;
  lon: number;
};

export type WalkingDestination = {
  entranceId: string;
  coordinates: Coordinates;
};

export type WalkingRouteResult = {
  entranceId: string;
  distanceMeters: number;
  durationSeconds: number;
};

export class MapyRoutingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MapyRoutingError";
  }
}

function isValidCoordinates(c: Coordinates): boolean {
  return (
    Number.isFinite(c.lat) &&
    Number.isFinite(c.lon) &&
    c.lat >= -90 &&
    c.lat <= 90 &&
    c.lon >= -180 &&
    c.lon <= 180
  );
}

// Mapy.com očekává "lon,lat" (potvrzeno OpenAPI spec: "The first number
// is longitude, the second is latitude") — POZOR, opačné pořadí než
// interní `{lat, lon}` tvar používaný zbytkem appky.
function toLonLatParam(c: Coordinates): string {
  return `${c.lon},${c.lat}`;
}

type RawMatrixCell = { length?: unknown; duration?: unknown };

function parseMatrixResponse(body: unknown, destinations: readonly WalkingDestination[]): WalkingRouteResult[] {
  if (typeof body !== "object" || body === null || !Array.isArray((body as { matrix?: unknown }).matrix)) {
    throw new MapyRoutingError("Neplatná odpověď Mapy.com Matrix Routing API (chybí matrix).");
  }

  const matrix = (body as { matrix: unknown[] }).matrix;
  // Jeden origin (starts) => právě jeden řádek matice; sloupce odpovídají
  // pořadí `ends`, které jsme sami sestavili ve stejném pořadí jako
  // `destinations` (viz dokumentace: řádky = starts, sloupce = ends).
  const row = matrix[0];
  if (!Array.isArray(row)) {
    throw new MapyRoutingError("Neplatná odpověď Mapy.com Matrix Routing API (chybí řádek matice).");
  }

  const results: WalkingRouteResult[] = [];
  for (let i = 0; i < destinations.length; i++) {
    const cell = row[i] as RawMatrixCell | undefined;
    if (!cell || typeof cell.length !== "number" || typeof cell.duration !== "number") {
      continue; // jeden neplatný/chybějící cíl nesmí shodit celý výsledek
    }
    // Záporné hodnoty jsou chybové kódy Mapy.com (-1 obecná chyba, -2
    // body příliš daleko od sebe, -3 trasa nenalezena, -4 interní
    // timeout) — vyřadit jako nedostupný cíl, ne selhání celého requestu.
    if (cell.length < 0 || cell.duration < 0) continue;
    results.push({ entranceId: destinations[i].entranceId, distanceMeters: cell.length, durationSeconds: cell.duration });
  }
  return results;
}

/**
 * Jeden origin, max `WALKING_MATRIX_MAX_DESTINATIONS` cílů, jeden HTTP
 * request (viz zadání "jedno vyhledání = nejvýše jeden matrix
 * požadavek"). Vyhazuje `MapyRoutingError` při selhání celého requestu
 * (chybějící klíč, neplatné souřadnice, timeout/abort, HTTP chyba,
 * nevalidní odpověď) — volající (hooks/useMetroFinderResults.ts) na to
 * reaguje přechodem na vzdušný fallback, nikdy pádem appky.
 */
export async function fetchWalkingMatrix(
  origin: Coordinates,
  destinations: readonly WalkingDestination[],
  options: { apiKey: string; signal?: AbortSignal; timeoutMs: number }
): Promise<WalkingRouteResult[]> {
  if (!options.apiKey) {
    throw new MapyRoutingError("Mapy.com API klíč není nastavený.");
  }
  if (!isValidCoordinates(origin)) {
    throw new MapyRoutingError("Neplatné souřadnice výchozího bodu.");
  }
  if (destinations.length === 0) {
    return [];
  }
  if (destinations.length > WALKING_MATRIX_MAX_DESTINATIONS) {
    throw new MapyRoutingError(`Příliš mnoho cílů (max ${WALKING_MATRIX_MAX_DESTINATIONS}).`);
  }
  for (const destination of destinations) {
    if (!isValidCoordinates(destination.coordinates)) {
      throw new MapyRoutingError(`Neplatné souřadnice cíle "${destination.entranceId}".`);
    }
  }

  const url = new URL(MAPY_MATRIX_ENDPOINT);
  url.searchParams.set("starts", toLonLatParam(origin));
  for (const destination of destinations) {
    url.searchParams.append("ends", toLonLatParam(destination.coordinates));
  }
  url.searchParams.set("routeType", MAPY_ROUTE_TYPE_FOOT_FAST);
  url.searchParams.set("apikey", options.apiKey);

  const timeoutController = new AbortController();
  const timer = setTimeout(() => timeoutController.abort(), options.timeoutMs);
  const onExternalAbort = () => timeoutController.abort();
  options.signal?.addEventListener("abort", onExternalAbort);

  try {
    const response = await fetch(url, { signal: timeoutController.signal });

    if (!response.ok) {
      throw new MapyRoutingError(`Mapy.com Matrix Routing API vrátilo HTTP ${response.status}.`);
    }

    const body: unknown = await response.json();
    return parseMatrixResponse(body, destinations);
  } catch (error) {
    if (error instanceof MapyRoutingError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new MapyRoutingError("Mapy.com Matrix Routing API neodpovědělo včas.");
    }
    throw new MapyRoutingError("Volání Mapy.com Matrix Routing API selhalo.");
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener("abort", onExternalAbort);
  }
}
