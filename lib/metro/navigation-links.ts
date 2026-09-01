export type Coordinates = { lat: number; lon: number };

/**
 * Ověří, že souřadnice jsou skutečně použitelné GPS souřadnice — konečná
 * čísla v platném rozsahu (lat -90..90, lon -180..180 včetně hranic).
 * Vyhodí popisnou chybu místo tichého sestavení nesmyslné URL (viz
 * zadání "odmítnutí NaN, Infinity a hodnot mimo povolené rozsahy").
 */
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
 * Google Maps — pořadí souřadnic je "lat,lon". `origin`/`destination`
 * sestavené přes `URLSearchParams` (bezpečné escapování, žádná ruční
 * konkatenace stringů), souřadnice se do URL vkládají jako `String()`
 * ověřených čísel — beze změny přesnosti, jen z prokazatelně platného
 * finite čísla, ne z nedůvěryhodného syrového řetězce.
 */
export function buildGoogleMapsWalkingUrl(origin: Coordinates, destination: Coordinates): string {
  assertValidCoordinates(origin, "origin");
  assertValidCoordinates(destination, "destination");

  const url = new URL("https://www.google.com/maps/dir/");
  url.search = new URLSearchParams({
    api: "1",
    origin: `${origin.lat},${origin.lon}`,
    destination: `${destination.lat},${destination.lon}`,
    travelmode: "walking",
  }).toString();

  return url.toString();
}

/**
 * Mapy.com — pořadí souřadnic je OPAČNÉ, "lon,lat" (viz zadání).
 * `routeType=foot_fast` = pěší trasa, `navigate=true` = pokus o rovnou
 * spuštění navigace v podporované mobilní appce, web funguje i bez ní.
 * Žádný API klíč není potřeba.
 */
export function buildMapyComWalkingUrl(origin: Coordinates, destination: Coordinates): string {
  assertValidCoordinates(origin, "origin");
  assertValidCoordinates(destination, "destination");

  const url = new URL("https://mapy.com/fnc/v1/route");
  url.search = new URLSearchParams({
    start: `${origin.lon},${origin.lat}`,
    end: `${destination.lon},${destination.lat}`,
    routeType: "foot_fast",
    navigate: "true",
  }).toString();

  return url.toString();
}
