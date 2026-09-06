import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { selectWalkingRouteCandidates } from "../lib/routing/select-walking-route-candidates.ts";
import type { MetroEntrance } from "../lib/metro/types.ts";

function entrance(id: string, stationId: string, lat: number, lon: number): MetroEntrance {
  return { id, stationId, stationName: stationId, entranceLabel: "A", lat, lon, wheelchair: "unknown", lines: ["A"] };
}

const position = { lat: 50.08, lon: 14.43 };

// Osm stanic v rostoucí vzdálenosti od `position` — "s1" nejblíž, "s8"
// nejdál. "s1" má tři vstupy (jen dva nejbližší smí být vybrány), "s7"
// má jediný vstup.
const entrances: MetroEntrance[] = [
  entrance("s1-a", "s1", 50.0801, 14.4301),
  entrance("s1-b", "s1", 50.0802, 14.4302),
  entrance("s1-c", "s1", 50.0803, 14.4303),
  entrance("s2-a", "s2", 50.081, 14.431),
  entrance("s3-a", "s3", 50.082, 14.432),
  entrance("s4-a", "s4", 50.083, 14.433),
  entrance("s5-a", "s5", 50.084, 14.434),
  entrance("s6-a", "s6", 50.085, 14.435),
  entrance("s7-a", "s7", 50.086, 14.436),
  entrance("s8-a", "s8", 50.2, 14.6),
];

describe("selectWalkingRouteCandidates — 1. šest nejbližších různých stanic", () => {
  test("vybere přesně 6 různých stationId", () => {
    const result = selectWalkingRouteCandidates(position, entrances, 6, 2);
    const stationIds = new Set(result.map((e) => e.stationId));
    assert.equal(stationIds.size, 6);
    assert.deepEqual([...stationIds], ["s1", "s2", "s3", "s4", "s5", "s6"]);
  });

  test("nejvzdálenější stanice (s7, s8) nejsou vybrané", () => {
    const result = selectWalkingRouteCandidates(position, entrances, 6, 2);
    assert.ok(!result.some((e) => e.stationId === "s7" || e.stationId === "s8"));
  });
});

describe("selectWalkingRouteCandidates — 2. max 2 vstupy z jedné stanice", () => {
  test("s1 (tři vstupy) přispěje jen dvěma nejbližšími", () => {
    const result = selectWalkingRouteCandidates(position, entrances, 6, 2);
    const s1Entrances = result.filter((e) => e.stationId === "s1");
    assert.equal(s1Entrances.length, 2);
    assert.deepEqual(
      s1Entrances.map((e) => e.id),
      ["s1-a", "s1-b"]
    );
  });
});

describe("selectWalkingRouteCandidates — 3. nikdy víc než 12 cílů", () => {
  test("6 stanic × max 2 vstupy = nejvýš 12", () => {
    const result = selectWalkingRouteCandidates(position, entrances, 6, 2);
    assert.ok(result.length <= 12);
    assert.equal(result.length, 7); // s1 má 2, s2-s6 mají po 1 = 7
  });
});

describe("selectWalkingRouteCandidates — 4. jedna stanice s mnoha vstupy nezaplní celý shortlist", () => {
  test("i kdyby s1 mělo 20 vstupů, pořád obsadí max 2 místa", () => {
    const manyEntrancesAtS1: MetroEntrance[] = Array.from({ length: 20 }, (_, i) => entrance(`s1-many-${i}`, "s1", 50.08 + i * 0.0001, 14.43 + i * 0.0001));
    const result = selectWalkingRouteCandidates(position, [...manyEntrancesAtS1, ...entrances.filter((e) => e.stationId !== "s1")], 6, 2);
    assert.equal(result.filter((e) => e.stationId === "s1").length, 2);
    assert.equal(new Set(result.map((e) => e.stationId)).size, 6);
  });
});

describe("selectWalkingRouteCandidates — 5. stanice s jedním vstupem funguje", () => {
  test("s7 má jen jeden vstup — pokud je mezi 6 nejbližšími, přispěje jen jedním, ne dvěma", () => {
    const onlyCloseStations = entrances.filter((e) => ["s2", "s3", "s4", "s5", "s6", "s7"].includes(e.stationId));
    const result = selectWalkingRouteCandidates(position, onlyCloseStations, 6, 2);
    assert.equal(result.filter((e) => e.stationId === "s7").length, 1);
  });
});

describe("selectWalkingRouteCandidates — 6. stabilní řazení při shodné vzdálenosti", () => {
  test("dvě stanice se stejnou vzdáleností se řadí podle stationId", () => {
    const tie: MetroEntrance[] = [entrance("z-a", "z-station", 50.09, 14.44), entrance("a-a", "a-station", 50.09, 14.44)];
    const result = selectWalkingRouteCandidates(position, tie, 6, 2);
    assert.deepEqual(
      result.map((e) => e.stationId),
      ["a-station", "z-station"]
    );
  });

  test("dva vstupy stejné stanice se stejnou vzdáleností se řadí podle entranceId", () => {
    const tie: MetroEntrance[] = [entrance("s1-z", "s1", 50.0801, 14.4301), entrance("s1-a", "s1", 50.0801, 14.4301)];
    const result = selectWalkingRouteCandidates(position, tie, 6, 2);
    assert.deepEqual(
      result.map((e) => e.id),
      ["s1-a", "s1-z"]
    );
  });

  test("opakované volání se stejným vstupem dá stejný výsledek (deterministické, neposkakuje)", () => {
    const first = selectWalkingRouteCandidates(position, entrances, 6, 2).map((e) => e.id);
    const second = selectWalkingRouteCandidates(position, entrances, 6, 2).map((e) => e.id);
    assert.deepEqual(first, second);
  });
});

describe("selectWalkingRouteCandidates — 7./8. neplatné souřadnice se odmítnou", () => {
  test("NaN v poloze vrátí prázdný seznam", () => {
    assert.deepEqual(selectWalkingRouteCandidates({ lat: NaN, lon: 14.43 }, entrances, 6, 2), []);
  });

  test("Infinity v poloze vrátí prázdný seznam", () => {
    assert.deepEqual(selectWalkingRouteCandidates({ lat: 50.08, lon: Infinity }, entrances, 6, 2), []);
  });

  test("mimo rozsah (lat 200) vrátí prázdný seznam", () => {
    assert.deepEqual(selectWalkingRouteCandidates({ lat: 200, lon: 14.43 }, entrances, 6, 2), []);
  });
});
