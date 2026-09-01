import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { buildDemoPositions } from "../lib/metro/demo-positions.ts";
import type { MetroEntrance } from "../lib/metro/types.ts";

function entrance(stationName: string, lat: number, lon: number): MetroEntrance {
  return { id: `${stationName}-${lat}`, stationId: stationName, stationName, entranceLabel: "E1", lat, lon, wheelchair: "unknown", lines: ["A"] };
}

describe("buildDemoPositions", () => {
  test("Anděl a Hlavní nádraží jsou průměr souřadnic jejich vstupů", () => {
    const entrances = [entrance("Anděl", 50.0, 14.0), entrance("Anděl", 50.002, 14.002), entrance("Hlavní nádraží", 50.08, 14.43)];
    const positions = buildDemoPositions(entrances);
    const andel = positions.find((p) => p.label === "Anděl");
    assert.ok(andel);
    assert.ok(Math.abs(andel!.lat - 50.001) < 1e-9);
    assert.ok(Math.abs(andel!.lon - 14.001) < 1e-9);
  });

  test("Václavské náměstí je střed mezi Muzeem a Můstkem", () => {
    const entrances = [entrance("Muzeum", 50.08, 14.43), entrance("Můstek", 50.084, 14.424)];
    const positions = buildDemoPositions(entrances);
    const vaclavak = positions.find((p) => p.label === "Václavské náměstí");
    assert.ok(vaclavak);
    assert.equal(vaclavak!.lat, 50.082);
    assert.equal(Math.round(vaclavak!.lon * 1000) / 1000, 14.427);
  });

  test("chybějící stanice se v poli demo poloh vůbec neobjeví", () => {
    const positions = buildDemoPositions([]);
    assert.deepEqual(positions, []);
  });
});
