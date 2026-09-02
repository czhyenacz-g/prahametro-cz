import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { computeHighlightedStationIds } from "../lib/metro/highlighted-stations.ts";
import type { MetroEntrance } from "../lib/metro/types.ts";

function entrance(id: string, stationId: string, stationName: string, lat: number, lon: number, lines: MetroEntrance["lines"] = ["A"]): MetroEntrance {
  return { id, stationId, stationName, entranceLabel: "E1", lat, lon, wheelchair: "unknown", lines };
}

const position = { lat: 50.08, lon: 14.43 };

// Čtyři stanice v rostoucí vzdálenosti od `position`, "mustek" má dva
// vstupy (mustek-far dál, mustek-near blíž) a je přestupní (linky A i B).
const entrances: MetroEntrance[] = [
  entrance("mustek-far", "mustek", "Můstek", 50.083, 14.433, ["A"]),
  entrance("mustek-near", "mustek", "Můstek", 50.081, 14.431, ["A", "B"]),
  entrance("muzeum", "muzeum", "Muzeum", 50.085, 14.435, ["A", "C"]),
  entrance("namesti", "namesti-republiky", "Náměstí Republiky", 50.088, 14.438, ["B"]),
  entrance("daleko", "daleko-stanice", "Daleká stanice", 50.2, 14.6, ["C"]),
];

describe("computeHighlightedStationIds — 1. výběr tří nejbližších různých stanic", () => {
  test("vrátí přesně 3 různé stationId, ne vstupy", () => {
    const result = computeHighlightedStationIds(position, entrances);
    assert.equal(result.size, 3);
    assert.deepEqual([...result].sort(), ["muzeum", "mustek", "namesti-republiky"].sort());
  });
});

describe("computeHighlightedStationIds — 2./3. stanice s víc vstupy se počítá jednou, podle nejbližšího", () => {
  test("Můstek je v množině jen jednou (Set), bez ohledu na dva vstupy", () => {
    const result = computeHighlightedStationIds(position, entrances);
    assert.ok(result.has("mustek"));
    assert.equal([...result].filter((id) => id === "mustek").length, 1);
  });
});

describe("computeHighlightedStationIds — 4. přestupní stanice se objeví jen jednou", () => {
  test("Můstek (linky A i B na jednom vstupu) není v množině duplicitně", () => {
    const result = computeHighlightedStationIds(position, entrances);
    assert.equal(result.size, new Set(result).size);
  });
});

describe("computeHighlightedStationIds — 5. správné pořadí stanic (od nejbližší, Set zachovává pořadí vložení)", () => {
  test("pořadí odpovídá rostoucí vzdálenosti: Můstek, Muzeum, Náměstí Republiky", () => {
    const result = computeHighlightedStationIds(position, entrances);
    assert.deepEqual([...result], ["mustek", "muzeum", "namesti-republiky"]);
  });

  test("nejvzdálenější stanice (daleko-stanice) není mezi vybranými", () => {
    const result = computeHighlightedStationIds(position, entrances);
    assert.equal(result.has("daleko-stanice"), false);
  });
});

describe("computeHighlightedStationIds — 6. méně než tři dostupné stanice", () => {
  test("se dvěma stanicemi vrátí jen tyto dvě, nespadne", () => {
    const twoStations = entrances.filter((e) => e.stationId === "mustek" || e.stationId === "muzeum");
    const result = computeHighlightedStationIds(position, twoStations);
    assert.equal(result.size, 2);
    assert.deepEqual([...result].sort(), ["mustek", "muzeum"]);
  });

  test("s nulou vstupů vrátí prázdnou množinu", () => {
    const result = computeHighlightedStationIds(position, []);
    assert.equal(result.size, 0);
  });
});

describe("computeHighlightedStationIds — 7. žádné zvýraznění bez polohy", () => {
  test("poloha null -> prázdná množina", () => {
    const result = computeHighlightedStationIds(null, entrances);
    assert.equal(result.size, 0);
  });
});

describe("computeHighlightedStationIds — 8. přepočítání při nové poloze", () => {
  test("jiná poloha (blízko vzdálené stanice) dá jinou trojici, s daleko-stanice zahrnutou", () => {
    const nearFarStation = { lat: 50.2, lon: 14.6 };
    const original = computeHighlightedStationIds(position, entrances);
    const result = computeHighlightedStationIds(nearFarStation, entrances);
    assert.ok(result.has("daleko-stanice"));
    assert.equal(original.has("daleko-stanice"), false);
    assert.notDeepEqual([...result], [...original]);
  });
});

describe("computeHighlightedStationIds — 9. odstranění starého zvýraznění (funkce je bezstavová)", () => {
  test("volání s null po předchozím volání s polohou nenese žádný zbytek staré trojice", () => {
    const withPosition = computeHighlightedStationIds(position, entrances);
    assert.ok(withPosition.size > 0);
    const afterReset = computeHighlightedStationIds(null, entrances);
    assert.equal(afterReset.size, 0);
  });
});
