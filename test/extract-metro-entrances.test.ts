import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { extractMetroEntrances, countUniqueStations } from "../lib/gtfs/extract-metro-entrances.ts";
import type { GtfsRoute, GtfsStop, GtfsStopTime, GtfsTrip } from "../lib/gtfs/types.ts";

const routes: GtfsRoute[] = [
  { route_id: "M-A", route_short_name: "A", route_type: "1" },
  { route_id: "BUS1", route_short_name: "119", route_type: "3" },
];

const trips: GtfsTrip[] = [
  { trip_id: "tripA1", route_id: "M-A", service_id: "svc1", trip_headsign: "Stanice B", direction_id: "0" },
  { trip_id: "tripBus1", route_id: "BUS1", service_id: "svc1", trip_headsign: "Bus", direction_id: "0" },
];

const stops: GtfsStop[] = [
  { stop_id: "stationA", stop_name: "Stanice A", stop_lat: "50.10", stop_lon: "14.10", location_type: "1", parent_station: "", wheelchair_boarding: "" },
  { stop_id: "platformA", stop_name: "Stanice A", stop_lat: "50.10", stop_lon: "14.10", location_type: "0", parent_station: "stationA", wheelchair_boarding: "" },
  { stop_id: "entranceA1", stop_name: "E1", stop_lat: "50.1001", stop_lon: "14.1001", location_type: "2", parent_station: "stationA", wheelchair_boarding: "1" },
  // Přesná duplicita entranceA1 (stejné ID) — simuluje vadný feed, musí se odstranit.
  { stop_id: "entranceA1", stop_name: "E1", stop_lat: "50.1001", stop_lon: "14.1001", location_type: "2", parent_station: "stationA", wheelchair_boarding: "1" },
  { stop_id: "entranceA2", stop_name: "E2", stop_lat: "50.1002", stop_lon: "14.1002", location_type: "2", parent_station: "stationA", wheelchair_boarding: "2" },

  { stop_id: "stationB", stop_name: "Stanice B", stop_lat: "50.20", stop_lon: "14.20", location_type: "1", parent_station: "", wheelchair_boarding: "" },
  { stop_id: "platformB", stop_name: "Stanice B", stop_lat: "50.20", stop_lon: "14.20", location_type: "0", parent_station: "stationB", wheelchair_boarding: "" },
  // Stejný entranceLabel "E1" jako u stanice A, ale úplně jiné GPS a ID — musí zůstat samostatný záznam.
  { stop_id: "entranceB1", stop_name: "E1", stop_lat: "50.2001", stop_lon: "14.2001", location_type: "2", parent_station: "stationB", wheelchair_boarding: "0" },

  // Autobusová zastávka bez metra — nesmí se v žádném výstupu objevit.
  { stop_id: "busStop", stop_name: "Bus", stop_lat: "50.30", stop_lon: "14.30", location_type: "0", parent_station: "", wheelchair_boarding: "" },
  // Entrance u stanice, kterou žádný metro spoj neobsluhuje (chybí ve stopTimes) — nesmí se objevit.
  { stop_id: "stationC", stop_name: "Stanice C", stop_lat: "50.40", stop_lon: "14.40", location_type: "1", parent_station: "", wheelchair_boarding: "" },
  { stop_id: "entranceC1", stop_name: "E1", stop_lat: "50.4001", stop_lon: "14.4001", location_type: "2", parent_station: "stationC", wheelchair_boarding: "1" },
];

const stopTimes: GtfsStopTime[] = [
  { trip_id: "tripA1", stop_id: "platformA" },
  { trip_id: "tripA1", stop_id: "platformB" },
  { trip_id: "tripBus1", stop_id: "busStop" },
];

describe("extractMetroEntrances", () => {
  test("vrátí jen vstupy metro stanic obsluhovaných route_type=1", () => {
    const entrances = extractMetroEntrances(routes, trips, stops, stopTimes);
    const ids = entrances.map((e) => e.id).sort();
    assert.deepEqual(ids, ["entranceA1", "entranceA2", "entranceB1"]);
  });

  test("nezahrne vstupy stanic bez metro provozu (stationC) ani busStop", () => {
    const entrances = extractMetroEntrances(routes, trips, stops, stopTimes);
    assert.ok(!entrances.some((e) => e.stationId === "stationC"));
    assert.ok(!entrances.some((e) => e.id === "busStop"));
  });

  test("odstraní přesnou duplicitu (entranceA1 dvakrát ve stops.txt)", () => {
    const entrances = extractMetroEntrances(routes, trips, stops, stopTimes);
    assert.equal(entrances.filter((e) => e.id === "entranceA1").length, 1);
  });

  test("zachová různé GPS body se stejným entranceLabel (E1 u A i B)", () => {
    const entrances = extractMetroEntrances(routes, trips, stops, stopTimes);
    const e1s = entrances.filter((e) => e.entranceLabel === "E1");
    assert.equal(e1s.length, 2);
    assert.notEqual(e1s[0].lat, e1s[1].lat);
  });

  test("mapuje wheelchair_boarding na yes/no/unknown", () => {
    const entrances = extractMetroEntrances(routes, trips, stops, stopTimes);
    assert.equal(entrances.find((e) => e.id === "entranceA1")?.wheelchair, "yes");
    assert.equal(entrances.find((e) => e.id === "entranceA2")?.wheelchair, "no");
    assert.equal(entrances.find((e) => e.id === "entranceB1")?.wheelchair, "unknown");
  });

  test("countUniqueStations počítá jen skutečně obsazené stanice", () => {
    const entrances = extractMetroEntrances(routes, trips, stops, stopTimes);
    assert.equal(countUniqueStations(entrances), 2);
  });
});
