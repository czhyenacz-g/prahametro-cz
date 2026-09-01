import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { findExtraneousLayoutStations, findMissingLayoutStations } from "../lib/map/validate-layout.ts";
import { stationLayout } from "../lib/map/station-layout.ts";

describe("station-layout proti reálně importovaným datům", () => {
  test("žádná aktuálně provozovaná A/B/C stanice v mapě nechybí", () => {
    assert.deepEqual(findMissingLayoutStations(), []);
  });

  test("v mapě není žádná stanice, která by neodpovídala importovaným datům", () => {
    assert.deepEqual(findExtraneousLayoutStations(), []);
  });

  test("přestupní stanice Muzeum/Můstek/Florenc mají v layoutu 2 linky", () => {
    const byName = new Map(stationLayout.nodes.map((n) => [n.name, n]));
    assert.equal(byName.get("Muzeum")?.lines.length, 2);
    assert.equal(byName.get("Můstek")?.lines.length, 2);
    assert.equal(byName.get("Florenc")?.lines.length, 2);
  });
});
