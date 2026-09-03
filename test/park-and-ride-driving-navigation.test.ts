import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  buildAppleMapsDrivingUrl,
  buildGoogleMapsDrivingUrl,
  buildMapyComDrivingUrl,
  resolveDrivingDestination,
} from "../lib/parking/driving-navigation-links.ts";

const destination = { lat: 50.032088, lon: 14.491964 };
const origin = { lat: 50.08, lon: 14.42 };

describe("21. Google Maps používá automobilový režim", () => {
  test("travelmode=driving", () => {
    const url = new URL(buildGoogleMapsDrivingUrl(origin, destination));
    assert.equal(url.searchParams.get("travelmode"), "driving");
  });

  test("26. pořadí souřadnic je lat,lon", () => {
    const url = new URL(buildGoogleMapsDrivingUrl(origin, destination));
    assert.equal(url.searchParams.get("destination"), `${destination.lat},${destination.lon}`);
  });

  test("bez origin se parametr origin vůbec nevloží (appka nevyžaduje polohu)", () => {
    const url = new URL(buildGoogleMapsDrivingUrl(null, destination));
    assert.equal(url.searchParams.has("origin"), false);
  });
});

describe("22. Apple Maps používá automobilový režim", () => {
  test("dirflg=d (drive), ne 'w' jako u pěší navigace", () => {
    const url = new URL(buildAppleMapsDrivingUrl(origin, destination));
    assert.equal(url.searchParams.get("dirflg"), "d");
  });

  test("26. pořadí souřadnic je lat,lon", () => {
    const url = new URL(buildAppleMapsDrivingUrl(origin, destination));
    assert.equal(url.searchParams.get("daddr"), `${destination.lat},${destination.lon}`);
  });
});

describe("23. Mapy.com používá automobilový režim", () => {
  test("routeType=car_fast (ověřeno proti oficiální dokumentaci mapycom/developer, ne foot_fast)", () => {
    const url = new URL(buildMapyComDrivingUrl(origin, destination));
    assert.equal(url.searchParams.get("routeType"), "car_fast");
  });

  test("26. pořadí souřadnic je OPAČNÉ — lon,lat", () => {
    const url = new URL(buildMapyComDrivingUrl(origin, destination));
    assert.equal(url.searchParams.get("end"), `${destination.lon},${destination.lat}`);
  });
});

describe("24./25. cílem je automobilový vjezd, pokud existuje, centroid jen jako fallback", () => {
  test("s entranceCoordinates se použije vjezd, ne centroid", () => {
    const destinationResolved = resolveDrivingDestination({
      coordinates: { lat: 1, lon: 1 },
      entranceCoordinates: { lat: 2, lon: 2 },
    });
    assert.deepEqual(destinationResolved, { lat: 2, lon: 2 });
  });

  test("bez entranceCoordinates (null) se použije centroid jako fallback", () => {
    const destinationResolved = resolveDrivingDestination({
      coordinates: { lat: 1, lon: 1 },
      entranceCoordinates: null,
    });
    assert.deepEqual(destinationResolved, { lat: 1, lon: 1 });
  });
});

describe("neplatné souřadnice se odmítnou (stejná validace jako pěší navigace)", () => {
  test("NaN destination vyhodí RangeError", () => {
    assert.throws(() => buildGoogleMapsDrivingUrl(origin, { lat: NaN, lon: 14 }), RangeError);
  });
});
