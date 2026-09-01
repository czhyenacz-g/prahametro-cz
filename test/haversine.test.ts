import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { haversineDistanceMeters } from "../lib/metro/haversine.ts";

describe("haversineDistanceMeters", () => {
  test("stejný bod = 0 m", () => {
    assert.equal(haversineDistanceMeters({ lat: 50.08, lon: 14.42 }, { lat: 50.08, lon: 14.42 }), 0);
  });

  test("1 stupeň zeměpisné délky na rovníku ≈ 111,32 km", () => {
    const distance = haversineDistanceMeters({ lat: 0, lon: 0 }, { lat: 0, lon: 1 });
    assert.ok(Math.abs(distance - 111_320) < 500, `distance was ${distance}`);
  });

  test("1 stupeň zeměpisné šířky ≈ 111,19–111,7 km (nezávisí na longitudě)", () => {
    const distance = haversineDistanceMeters({ lat: 0, lon: 14 }, { lat: 1, lon: 14 });
    assert.ok(Math.abs(distance - 111_320) < 1000, `distance was ${distance}`);
  });

  test("symetrická vzdálenost (A->B == B->A)", () => {
    const a = { lat: 50.083, lon: 14.421 };
    const b = { lat: 50.075, lon: 14.437 };
    assert.equal(haversineDistanceMeters(a, b), haversineDistanceMeters(b, a));
  });
});
