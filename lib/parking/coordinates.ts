import type { Coordinates } from "./types.ts";

/**
 * GeoJSON `Point` souřadnice jsou `[lon, lat]` (OPAČNÉ pořadí než náš
 * interní `{lat, lon}` — viz zadání "GeoJSON pořadí lon,lat"). Vrací
 * `null` (ne throw) pro cokoliv jiného než platný bod v platném
 * rozsahu — volající (transform.ts) neplatné záznamy přeskočí, import
 * kvůli jednomu rozbitému bodu nespadne.
 */
export function parseGeoJsonPoint(coordinates: unknown): Coordinates | null {
  if (!Array.isArray(coordinates) || coordinates.length < 2) return null;

  const [lon, lat] = coordinates;
  if (typeof lat !== "number" || typeof lon !== "number") return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (lat < -90 || lat > 90) return null;
  if (lon < -180 || lon > 180) return null;

  return { lat, lon };
}
