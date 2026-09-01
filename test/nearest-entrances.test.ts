import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { nearestEntrances } from "../lib/metro/nearest-entrances.ts";
import type { MetroEntrance } from "../lib/metro/types.ts";

function entrance(id: string, lat: number, lon: number): MetroEntrance {
  return { id, stationId: `station-${id}`, stationName: `Stanice ${id}`, entranceLabel: "E1", lat, lon, wheelchair: "unknown", lines: ["A"] };
}

const position = { lat: 50.08, lon: 14.42 };

const entrances: MetroEntrance[] = [
  entrance("far", 50.2, 14.6),
  entrance("near", 50.081, 14.421),
  entrance("mid", 50.1, 14.45),
  entrance("nearest", 50.0801, 14.4201),
];

describe("nearestEntrances", () => {
  test("seřadí od nejbližšího a respektuje limit", () => {
    const result = nearestEntrances(position, entrances, 3);
    assert.deepEqual(
      result.map((r) => r.id),
      ["nearest", "near", "mid"]
    );
  });

  test("vzdálenosti jsou neklesající (stabilně seřazené)", () => {
    const result = nearestEntrances(position, entrances, entrances.length);
    for (let i = 1; i < result.length; i++) {
      assert.ok(result[i].distanceMeters >= result[i - 1].distanceMeters);
    }
  });

  test("může vrátit víc vstupů patřících stejné stanici", () => {
    const sameStation: MetroEntrance[] = [
      { ...entrance("s1", 50.081, 14.421), stationId: "same" },
      { ...entrance("s2", 50.0811, 14.4211), stationId: "same" },
      { ...entrance("s3", 50.0812, 14.4212), stationId: "same" },
    ];
    const result = nearestEntrances(position, sameStation, 3);
    assert.equal(result.length, 3);
    assert.ok(result.every((r) => r.stationId === "same"));
  });
});
