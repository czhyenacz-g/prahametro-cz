import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { formatDistance, formatWalkingTime } from "../lib/metro/format-distance.ts";

describe("formatDistance", () => {
  test("pod 1 km v metrech, zaokrouhleno", () => {
    assert.equal(formatDistance(850.4), "850 m");
    assert.equal(formatDistance(12), "12 m");
  });

  test("od 1 km v kilometrech s jedním desetinným místem", () => {
    assert.equal(formatDistance(1200), "1,2 km");
    assert.equal(formatDistance(26_500), "26,5 km");
  });
});

describe("formatWalkingTime", () => {
  test("80 m/min, zaokrouhleno nahoru, formát 'cca X min pěšky'", () => {
    assert.equal(formatWalkingTime(80), "cca 1 min pěšky");
    assert.equal(formatWalkingTime(81), "cca 2 min pěšky");
    assert.equal(formatWalkingTime(400), "cca 5 min pěšky");
  });
});
