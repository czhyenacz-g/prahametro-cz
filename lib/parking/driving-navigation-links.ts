import type { Coordinates } from "./types.ts";

// Vlastní kopie validace (ne import z lib/metro/navigation-links.ts) —
// P+R navigace musí zůstat úplně nezávislá na pěší navigaci k metru,
// ať žádná budoucí úprava tady nemůže nechtěně ovlivnit existující,
// otestované pěší odkazy (viz zadání "chování stávající pěší navigace
// se nesmí změnit").
function assertValidCoordinates(coords: Coordinates, label: string): void {
  const { lat, lon } = coords;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new RangeError(`${label}: souřadnice musí být konečná čísla (lat=${lat}, lon=${lon}).`);
  }
  if (lat < -90 || lat > 90) {
    throw new RangeError(`${label}: lat musí být v rozsahu -90 až 90 (dostal jsem ${lat}).`);
  }
  if (lon < -180 || lon > 180) {
    throw new RangeError(`${label}: lon musí být v rozsahu -180 až 180 (dostal jsem ${lon}).`);
  }
}

/**
 * Google Maps, režim `driving` — `origin` je volitelný (viz zadání
 * "bez known polohy nech mapovou appku použít aktuální polohu"), `null`
 * origin vynechá parametr úplně místo posílání nesmyslné souřadnice.
 */
export function buildGoogleMapsDrivingUrl(origin: Coordinates | null, destination: Coordinates): string {
  if (origin) assertValidCoordinates(origin, "origin");
  assertValidCoordinates(destination, "destination");

  const url = new URL("https://www.google.com/maps/dir/");
  const params = new URLSearchParams({
    api: "1",
    destination: `${destination.lat},${destination.lon}`,
    travelmode: "driving",
  });
  if (origin) params.set("origin", `${origin.lat},${origin.lon}`);
  url.search = params.toString();

  return url.toString();
}

/** Apple Maps, `dirflg=d` = řízení auta (ne `w` jako u pěší navigace). */
export function buildAppleMapsDrivingUrl(origin: Coordinates | null, destination: Coordinates): string {
  if (origin) assertValidCoordinates(origin, "origin");
  assertValidCoordinates(destination, "destination");

  const url = new URL("https://maps.apple.com/");
  const params = new URLSearchParams({
    daddr: `${destination.lat},${destination.lon}`,
    dirflg: "d",
  });
  if (origin) params.set("saddr", `${origin.lat},${origin.lon}`);
  url.search = params.toString();

  return url.toString();
}

/**
 * Mapy.com, `routeType=car_fast` — ověřeno proti oficiální dokumentaci
 * (github.com/mapycom/developer/docs/url-mapy/route.md, 2026-09-03):
 * `car_fast` je aktuální hodnota pro automobilovou navigaci (na rozdíl
 * od `foot_fast` u pěší, beze změny v lib/metro/navigation-links.ts).
 * Pořadí souřadnic je stejné jako u pěší verze — `lon,lat` (GeoJSON
 * pořadí), OPAČNÉ než náš interní `{lat, lon}`.
 */
export function buildMapyComDrivingUrl(origin: Coordinates | null, destination: Coordinates): string {
  if (origin) assertValidCoordinates(origin, "origin");
  assertValidCoordinates(destination, "destination");

  const url = new URL("https://mapy.com/fnc/v1/route");
  const params = new URLSearchParams({
    end: `${destination.lon},${destination.lat}`,
    routeType: "car_fast",
    navigate: "true",
  });
  if (origin) params.set("start", `${origin.lon},${origin.lat}`);
  url.search = params.toString();

  return url.toString();
}

/** Automobilový vjezd, pokud ho Golemio poskytuje, jinak centroid jako fallback (viz zadání). */
export function resolveDrivingDestination(parkAndRide: {
  coordinates: Coordinates;
  entranceCoordinates: Coordinates | null;
}): Coordinates {
  return parkAndRide.entranceCoordinates ?? parkAndRide.coordinates;
}
