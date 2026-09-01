import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { nearestEntrances, nearestStationEntrances } from "../lib/metro/nearest-entrances.ts";
import type { MetroEntrance } from "../lib/metro/types.ts";

function entrance(id: string, stationId: string, stationName: string, lat: number, lon: number): MetroEntrance {
  return { id, stationId, stationName, entranceLabel: "E1", lat, lon, wheelchair: "unknown", lines: ["A"] };
}

// Uživatel "mimo Prahu" — pozice daleko od všeho.
const farPosition = { lat: 49.0, lon: 15.0 };

const entrances: MetroEntrance[] = [
  // Stanice X — dva vstupy, entranceX2 blíž.
  entrance("x1", "stationX", "Stanice X", 49.5, 15.5),
  entrance("x2", "stationX", "Stanice X", 49.45, 15.45),
  // Stanice Y — jeden vstup.
  entrance("y1", "stationY", "Stanice Y", 49.6, 15.6),
  // Stanice Z — jeden vstup, nejdál.
  entrance("z1", "stationZ", "Stanice Z", 49.9, 15.9),
];

describe("nearestStationEntrances", () => {
  test("vrátí 3 RŮZNÉ stanice, ne opakovaně stejnou", () => {
    const result = nearestStationEntrances(farPosition, entrances, 3);
    const stationIds = result.map((r) => r.stationId);
    assert.equal(new Set(stationIds).size, stationIds.length);
    assert.equal(result.length, 3);
  });

  test("pro stanici s víc vstupy vybere ten nejbližší (x2, ne x1)", () => {
    const result = nearestStationEntrances(farPosition, entrances, 3);
    const stationX = result.find((r) => r.stationId === "stationX");
    assert.ok(stationX);
    assert.equal(stationX!.id, "x2");
  });

  test("seřazeno podle vzdálenosti nejbližší stanice napřed", () => {
    const result = nearestStationEntrances(farPosition, entrances, 3);
    assert.deepEqual(
      result.map((r) => r.stationId),
      ["stationX", "stationY", "stationZ"]
    );
  });
});

describe("nearestEntrances vs. nearestStationEntrances — běžný případ do 25 km", () => {
  test("nearestEntrances může vrátit víc vstupů STEJNÉ stanice (běžné chování zachováno)", () => {
    const closePosition = { lat: 49.501, lon: 15.501 };
    const sameStationEntrances: MetroEntrance[] = [
      entrance("s1", "sameStation", "Stanice", 49.5, 15.5),
      entrance("s2", "sameStation", "Stanice", 49.5001, 15.5001),
      entrance("s3", "sameStation", "Stanice", 49.5002, 15.5002),
    ];
    const result = nearestEntrances(closePosition, sameStationEntrances, 3);
    assert.equal(result.length, 3);
    assert.ok(result.every((r) => r.stationId === "sameStation"));
  });
});
