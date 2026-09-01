import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { buildGoogleMapsWalkingUrl, buildMapyComWalkingUrl } from "../lib/metro/navigation-links.ts";

const origin = { lat: 50.083, lon: 14.421 };
// "Konkrétní vstup do metra", NE střed stanice — ověřeno testem "navigace
// vždy používá souřadnice vstupu, ne stanice" níž.
const entrance = { lat: 50.0835, lon: 14.425 };

describe("buildGoogleMapsWalkingUrl", () => {
  test("správná Google Maps URL (base path + api=1)", () => {
    const url = new URL(buildGoogleMapsWalkingUrl(origin, entrance));
    assert.equal(url.origin, "https://www.google.com");
    assert.equal(url.pathname, "/maps/dir/");
    assert.equal(url.searchParams.get("api"), "1");
  });

  test("pořadí souřadnic je lat,lon", () => {
    const url = new URL(buildGoogleMapsWalkingUrl(origin, entrance));
    assert.equal(url.searchParams.get("origin"), `${origin.lat},${origin.lon}`);
    assert.equal(url.searchParams.get("destination"), `${entrance.lat},${entrance.lon}`);
  });

  test("origin uživatele je předán jako origin, vstup jako destination", () => {
    const url = new URL(buildGoogleMapsWalkingUrl(origin, entrance));
    assert.equal(url.searchParams.get("origin"), "50.083,14.421");
    assert.equal(url.searchParams.get("destination"), "50.0835,14.425");
  });

  test("obsahuje travelmode=walking", () => {
    const url = new URL(buildGoogleMapsWalkingUrl(origin, entrance));
    assert.equal(url.searchParams.get("travelmode"), "walking");
  });
});

describe("buildMapyComWalkingUrl", () => {
  test("správná Mapy.com URL (base path)", () => {
    const url = new URL(buildMapyComWalkingUrl(origin, entrance));
    assert.equal(url.origin, "https://mapy.com");
    assert.equal(url.pathname, "/fnc/v1/route");
  });

  test("pořadí souřadnic je OPAČNÉ — lon,lat", () => {
    const url = new URL(buildMapyComWalkingUrl(origin, entrance));
    assert.equal(url.searchParams.get("start"), `${origin.lon},${origin.lat}`);
    assert.equal(url.searchParams.get("end"), `${entrance.lon},${entrance.lat}`);
  });

  test("origin uživatele je předán jako start, vstup jako end", () => {
    const url = new URL(buildMapyComWalkingUrl(origin, entrance));
    assert.equal(url.searchParams.get("start"), "14.421,50.083");
    assert.equal(url.searchParams.get("end"), "14.425,50.0835");
  });

  test("obsahuje routeType=foot_fast", () => {
    const url = new URL(buildMapyComWalkingUrl(origin, entrance));
    assert.equal(url.searchParams.get("routeType"), "foot_fast");
  });

  test("obsahuje navigate=true", () => {
    const url = new URL(buildMapyComWalkingUrl(origin, entrance));
    assert.equal(url.searchParams.get("navigate"), "true");
  });
});

describe("validace souřadnic (obě funkce)", () => {
  test("záporné souřadnice jsou platné a zachovají se přesně", () => {
    const southernOrigin = { lat: -33.8688, lon: -70.6483 };
    const southernEntrance = { lat: -33.87, lon: -70.65 };
    const google = new URL(buildGoogleMapsWalkingUrl(southernOrigin, southernEntrance));
    assert.equal(google.searchParams.get("origin"), "-33.8688,-70.6483");
    const mapy = new URL(buildMapyComWalkingUrl(southernOrigin, southernEntrance));
    assert.equal(mapy.searchParams.get("start"), "-70.6483,-33.8688");
  });

  test("hraniční platné souřadnice (±90 lat, ±180 lon) se přijmou", () => {
    for (const point of [
      { lat: 90, lon: 180 },
      { lat: -90, lon: -180 },
      { lat: 90, lon: -180 },
      { lat: -90, lon: 180 },
    ]) {
      assert.doesNotThrow(() => buildGoogleMapsWalkingUrl(point, entrance));
      assert.doesNotThrow(() => buildMapyComWalkingUrl(point, entrance));
    }
  });

  test("NaN se odmítne", () => {
    assert.throws(() => buildGoogleMapsWalkingUrl({ lat: NaN, lon: 14 }, entrance), RangeError);
    assert.throws(() => buildMapyComWalkingUrl(origin, { lat: 50, lon: NaN }), RangeError);
  });

  test("Infinity/-Infinity se odmítne", () => {
    assert.throws(() => buildGoogleMapsWalkingUrl({ lat: Infinity, lon: 14 }, entrance), RangeError);
    assert.throws(() => buildMapyComWalkingUrl(origin, { lat: 50, lon: -Infinity }), RangeError);
  });

  test("lat/lon mimo povolený rozsah se odmítnou", () => {
    assert.throws(() => buildGoogleMapsWalkingUrl({ lat: 90.0001, lon: 14 }, entrance), RangeError);
    assert.throws(() => buildGoogleMapsWalkingUrl({ lat: -90.0001, lon: 14 }, entrance), RangeError);
    assert.throws(() => buildGoogleMapsWalkingUrl(origin, { lat: 50, lon: 180.0001 }), RangeError);
    assert.throws(() => buildGoogleMapsWalkingUrl(origin, { lat: 50, lon: -180.0001 }), RangeError);
  });
});

describe("navigace vždy používá souřadnice konkrétního vstupu, ne stanice", () => {
  test("destination/end v URL odpovídá přesně předanému vstupu (žádné zaokrouhlení/přepočet na střed stanice)", () => {
    // Dvě různé "entrance" se stejnou stanicí, ale jinými GPS — musí
    // vést na DVĚ různé URL, ne na jednu společnou souřadnici stanice.
    const entranceA = { lat: 50.06875, lon: 14.40336 };
    const entranceB = { lat: 50.0689, lon: 14.4036 };

    const urlA = new URL(buildGoogleMapsWalkingUrl(origin, entranceA));
    const urlB = new URL(buildGoogleMapsWalkingUrl(origin, entranceB));

    assert.equal(urlA.searchParams.get("destination"), "50.06875,14.40336");
    assert.equal(urlB.searchParams.get("destination"), "50.0689,14.4036");
    assert.notEqual(urlA.searchParams.get("destination"), urlB.searchParams.get("destination"));
  });
});
