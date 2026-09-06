/**
 * Klíč pro in-memory cache jednoho matrix requestu za návštěvu (viz
 * zadání bod 13). Origin se pro klíč zaokrouhlí (~11 m při 4 desetinných
 * místech) — DŮLEŽITÉ: tahle zaokrouhlená hodnota se používá JEN jako
 * cache klíč, nikdy jako skutečný origin routovacího dotazu (ten musí
 * zůstat přesný, viz zadání "nezaokrouhluj GPS souřadnice tak hrubě, aby
 * se vstup přesunul na jinou ulici").
 */
export function buildMatrixCacheKey(origin: { lat: number; lon: number }, candidateEntranceIds: readonly string[], routeType: string): string {
  const roundedLat = origin.lat.toFixed(4);
  const roundedLon = origin.lon.toFixed(4);
  const ids = [...candidateEntranceIds].sort().join(",");
  return `${roundedLat},${roundedLon}|${routeType}|${ids}`;
}
