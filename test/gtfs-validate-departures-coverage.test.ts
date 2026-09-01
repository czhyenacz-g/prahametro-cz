import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { findMissingStationCoverage } from "../lib/gtfs/validate-departures-coverage.ts";

describe("findMissingStationCoverage — 18. chybějící/nejednoznačné mapování stanice", () => {
  test("žádná chybějící stanice -> prázdné pole", () => {
    const app = new Set(["st1", "st2"]);
    const departures = new Set(["st1", "st2", "st3"]); // st3 navíc je v pořádku, jen se nevyužije
    assert.deepEqual(findMissingStationCoverage(app, departures), []);
  });

  test("stanice appky bez vygenerovaných odjezdů se nahlásí (seřazeně)", () => {
    const app = new Set(["st2", "st1", "st3"]);
    const departures = new Set(["st1"]);
    assert.deepEqual(findMissingStationCoverage(app, departures), ["st2", "st3"]);
  });

  test("prázdná appStationIds -> žádná chyba, nespadne", () => {
    assert.deepEqual(findMissingStationCoverage(new Set(), new Set(["st1"])), []);
  });
});
