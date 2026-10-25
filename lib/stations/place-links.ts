import type { Coordinates } from "../metro/navigation-links.ts";

export type PlaceTarget = { kind: "coordinates"; lat: number; lon: number } | { kind: "query"; query: string };

export type PlaceLinks = { google: string; apple: string; mapy: string };

function assertCoordinates({ lat, lon }: Coordinates): void {
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    throw new RangeError(`Neplatné souřadnice (lat=${lat}, lon=${lon}).`);
  }
}

/**
 * Odkazy do mapových aplikací BEZ výchozí polohy (appka na stránce
 * stanice o GPS nežádá).
 *
 * - Přesná GPS (vstup/stanoviště z PID GTFS) = pěší NAVIGACE: Google
 *   `dir` bez `origin` / Apple `daddr` bez `saddr` začnou z aktuální
 *   polohy; Mapy.com URL API bez startu trasu neumí, proto bod ukáže na
 *   mapě s markerem.
 * - Jen NÁZEV místa (cíl bez ověřených souřadnic, např. "Národní
 *   muzeum") = pouze VYHLEDÁNÍ místa, ne navigace — mapová služba může
 *   název vyložit po svém a nechceme to vydávat za přesný cíl.
 */
export function buildPlaceLinks(target: PlaceTarget): PlaceLinks {
  if (target.kind === "query") {
    const google = new URL("https://www.google.com/maps/search/");
    google.search = new URLSearchParams({ api: "1", query: target.query }).toString();
    const apple = new URL("https://maps.apple.com/");
    apple.search = new URLSearchParams({ q: target.query }).toString();
    const mapy = new URL("https://mapy.com/fnc/v1/search");
    mapy.search = new URLSearchParams({ query: target.query }).toString();
    return { google: google.toString(), apple: apple.toString(), mapy: mapy.toString() };
  }

  assertCoordinates(target);
  const destination = `${target.lat},${target.lon}`;

  const google = new URL("https://www.google.com/maps/dir/");
  google.search = new URLSearchParams({ api: "1", destination, travelmode: "walking" }).toString();

  const apple = new URL("https://maps.apple.com/");
  apple.search = new URLSearchParams({ daddr: destination, dirflg: "w" }).toString();

  const mapy = new URL("https://mapy.com/fnc/v1/showmap");
  mapy.search = new URLSearchParams({ mapset: "basic", center: `${target.lon},${target.lat}`, zoom: "18", marker: "true" }).toString();

  return { google: google.toString(), apple: apple.toString(), mapy: mapy.toString() };
}
