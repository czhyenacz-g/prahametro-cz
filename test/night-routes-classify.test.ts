import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { classifyNightRoutes } from "../lib/night-transport/night-routes.ts";
import type { GtfsRoute, GtfsStopTimeWithDeparture, GtfsTrip } from "../lib/gtfs/types.ts";

function route(overrides: Partial<GtfsRoute> & Pick<GtfsRoute, "route_id" | "route_short_name" | "route_type">): GtfsRoute {
  return { is_night: "0", is_regional: "0", is_substitute_transport: "0", route_color: "", route_text_color: "", ...overrides };
}

function trip(tripId: string, routeId: string): GtfsTrip {
  return { trip_id: tripId, route_id: routeId, service_id: "svc", trip_headsign: "Konečná", direction_id: "0" };
}

function stopTime(tripId: string, departureTime: string): GtfsStopTimeWithDeparture {
  return { trip_id: tripId, stop_id: "S1", departure_time: departureTime, stop_sequence: "1" };
}

describe("classifyNightRoutes", () => {
  test("1. rozpozná noční tramvaj (route_type=0, is_night=1, číslo v rozsahu 91-99) se skutečným nočním spojem", () => {
    const routes = [route({ route_id: "R91", route_short_name: "91", route_type: "0", is_night: "1", route_color: "7A0603" })];
    const trips = [trip("T1", "R91")];
    const stopTimes = [stopTime("T1", "23:47:00")];
    const { routes: result, warnings } = classifyNightRoutes(routes, trips, stopTimes);
    assert.equal(result.get("R91")?.vehicleType, "tram");
    assert.equal(result.get("R91")?.category, "tram");
    assert.equal(result.get("R91")?.colorHex, "7A0603");
    assert.deepEqual(warnings, []);
  });

  test("2. rozpozná městský noční autobus (route_type=3, is_regional=0)", () => {
    const routes = [route({ route_id: "R901", route_short_name: "901", route_type: "3", is_night: "1", is_regional: "0" })];
    const trips = [trip("T1", "R901")];
    const stopTimes = [stopTime("T1", "00:15:00")];
    const { routes: result } = classifyNightRoutes(routes, trips, stopTimes);
    assert.equal(result.get("R901")?.vehicleType, "bus");
    assert.equal(result.get("R901")?.category, "urban-bus");
  });

  test("3. rozpozná příměstský noční autobus (route_type=3, is_regional=1)", () => {
    const routes = [route({ route_id: "R951", route_short_name: "951", route_type: "3", is_night: "1", is_regional: "1" })];
    const trips = [trip("T1", "R951")];
    const stopTimes = [stopTime("T1", "24:15:00")];
    const { routes: result } = classifyNightRoutes(routes, trips, stopTimes);
    assert.equal(result.get("R951")?.category, "regional-bus");
  });

  test("4. vyloučí běžnou denní linku s pozdním spojem po půlnoci (is_night není nastavené)", () => {
    const routes = [route({ route_id: "R119", route_short_name: "119", route_type: "3", is_night: "0" })];
    const trips = [trip("T1", "R119")];
    const stopTimes = [stopTime("T1", "24:20:00")]; // poslední spoj po půlnoci, ale NENÍ noční linka
    const { routes: result } = classifyNightRoutes(routes, trips, stopTimes);
    assert.equal(result.size, 0);
  });

  test("5. linka s výlukovou variantou (is_substitute_transport=1) se vyřadí i když má is_night=1", () => {
    const routes = [route({ route_id: "RX90", route_short_name: "X90", route_type: "3", is_night: "1", is_substitute_transport: "1" })];
    const trips = [trip("T1", "RX90")];
    const stopTimes = [stopTime("T1", "23:50:00")];
    const { routes: result } = classifyNightRoutes(routes, trips, stopTimes);
    assert.equal(result.size, 0);
  });

  test("is_night=1, ale žádný spoj skutečně nejede v nočním okně → vyřazeno s varováním 'expected-line-without-trips'", () => {
    const routes = [route({ route_id: "R92", route_short_name: "92", route_type: "0", is_night: "1" })];
    const trips = [trip("T1", "R92")];
    const stopTimes = [stopTime("T1", "14:00:00")]; // jen denní spoj
    const { routes: result, warnings } = classifyNightRoutes(routes, trips, stopTimes);
    assert.equal(result.size, 0);
    assert.deepEqual(warnings, [{ kind: "expected-line-without-trips", shortName: "92" }]);
  });

  test("nová noční linka mimo dosavadní číselný rozsah se PŘESTO zahrne (is_night je autoritativní), ale s varováním", () => {
    const routes = [route({ route_id: "R80", route_short_name: "80", route_type: "0", is_night: "1" })];
    const trips = [trip("T1", "R80")];
    const stopTimes = [stopTime("T1", "00:30:00")];
    const { routes: result, warnings } = classifyNightRoutes(routes, trips, stopTimes);
    assert.ok(result.has("R80"));
    assert.deepEqual(warnings, [{ kind: "new-line-outside-known-range", shortName: "80", vehicleType: "tram" }]);
  });

  test("nečíselné/nejednoznačné route_short_name se vyřadí s varováním 'ambiguous-short-name'", () => {
    const routes = [route({ route_id: "R91X", route_short_name: "91X", route_type: "0", is_night: "1" })];
    const trips = [trip("T1", "R91X")];
    const stopTimes = [stopTime("T1", "23:50:00")];
    const { routes: result, warnings } = classifyNightRoutes(routes, trips, stopTimes);
    assert.equal(result.size, 0);
    assert.deepEqual(warnings, [{ kind: "ambiguous-short-name", routeId: "R91X", shortName: "91X" }]);
  });

  test("metro (route_type=1) a jiné route_type se ignorují i kdyby is_night bylo nastavené", () => {
    const routes = [route({ route_id: "RA", route_short_name: "A", route_type: "1", is_night: "1" })];
    const trips = [trip("T1", "RA")];
    const stopTimes = [stopTime("T1", "23:50:00")];
    const { routes: result } = classifyNightRoutes(routes, trips, stopTimes);
    assert.equal(result.size, 0);
  });

  test("chybí route_color/route_text_color v GTFS → bezpečný fallback podle typu vozidla, appka nespadne", () => {
    const routes = [route({ route_id: "R91", route_short_name: "91", route_type: "0", is_night: "1", route_color: "", route_text_color: "" })];
    const trips = [trip("T1", "R91")];
    const stopTimes = [stopTime("T1", "23:50:00")];
    const { routes: result } = classifyNightRoutes(routes, trips, stopTimes);
    assert.equal(result.get("R91")?.colorHex, "7A0603");
    assert.equal(result.get("R91")?.textColorHex, "FFFFFF");
  });
});
