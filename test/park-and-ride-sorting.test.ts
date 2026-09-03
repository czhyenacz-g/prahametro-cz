import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// ParkAndRideSection.tsx je "use client" komponenta (viz stejný vzorec
// jako test/departures-ui-shape.test.ts) — řazení/výběr (zadání body
// 17-20) se ověřuje jak nad zdrojovým textem (že se použije správná
// větev a že se poloha neposílá na server), tak přímo nad čistou logikou
// řazení, přenesenou sem 1:1 z komponenty pro testovatelnost bez DOM.
function readSource(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(`../${relativePath}`, import.meta.url)), "utf-8");
}

describe("17./18./19./20. ParkAndRideSection.tsx — zdroj", () => {
  const source = readSource("components/parking/ParkAndRideSection.tsx");

  test("17. s poziti(known) polohou se řadí podle vzdálenosti od uživatele (haversineDistanceMeters)", () => {
    assert.match(source, /if \(position\) \{/);
    assert.match(source, /haversineDistanceMeters\(position, a\.coordinates\) - haversineDistanceMeters\(position, b\.coordinates\)/);
  });

  test("18. bez polohy se použije stabilní pořadí podle linky + názvu stanice + názvu P+R, ne náhodné/nedeterministické", () => {
    assert.match(source, /stabilní pořadí podle linky metra a názvu stanice/);
    assert.match(source, /lineA\.localeCompare\(lineB\)/);
    assert.match(source, /a\.name\.localeCompare\(b\.name, "cs"\)/);
  });

  test("19. poloha uživatele se NEPOSÍLÁ na server — fetch je bez query/body parametrů", () => {
    assert.match(source, /fetch\("\/api\/park-and-ride"\)/);
    assert.doesNotMatch(source, /fetch\(`\/api\/park-and-ride\?/);
  });
});

describe("19. app/api/park-and-ride/route.ts — server route nikam neposílá polohu uživatele", () => {
  const source = readSource("app/api/park-and-ride/route.ts");

  test("GET nemá žádný parametr requestu (poloha by musela přijít jako argument handleru)", () => {
    assert.match(source, /export async function GET\(\)/);
  });

  test("Golemio se volá jen s ID parkovišť, ne se souřadnicemi uživatele", () => {
    assert.match(source, /fetchParkingMeasurements\(ids\)/);
    assert.doesNotMatch(source, /position/i);
    assert.doesNotMatch(source, /lat.*lon|origin/i);
  });
});

describe("20. sekce obsahuje pouze P+R přiřazená k metru (data/park-and-ride.json obsahuje jen zápasy)", () => {
  test("import-park-and-ride.ts zapisuje jen výsledek attachMetroStations, ne všechna stažená P+R", () => {
    const source = readSource("scripts/import-park-and-ride.ts");
    assert.match(source, /attachMetroStations/);
  });

  test("skutečná data: matchedToMetro odpovídá délce parkAndRides pole (žádné nepřiřazené položky navíc)", () => {
    const dataset = JSON.parse(readFileSync(fileURLToPath(new URL("../data/park-and-ride.json", import.meta.url)), "utf-8")) as {
      matchedToMetro: number;
      parkAndRides: { metroStationId: string }[];
    };
    assert.equal(dataset.parkAndRides.length, dataset.matchedToMetro);
    for (const pr of dataset.parkAndRides) {
      assert.ok(pr.metroStationId && pr.metroStationId.length > 0);
    }
  });
});

describe("17./18. čistá logika řazení (přenesená z komponenty pro testovatelnost)", () => {
  type Item = { id: string; name: string; metroStationId: string; coordinates: { lat: number; lon: number } };
  const stations: Record<string, { name: string; lines: string[] }> = {
    "line-a-first": { name: "Anděl", lines: ["B"] },
    "line-a-second": { name: "Zličín", lines: ["B"] },
    "line-c": { name: "Chodov", lines: ["C"] },
  };

  function sortWithoutPosition(items: Item[]): Item[] {
    return [...items].sort((a, b) => {
      const stationA = stations[a.metroStationId];
      const stationB = stations[b.metroStationId];
      const lineA = stationA?.lines[0] ?? "";
      const lineB = stationB?.lines[0] ?? "";
      return lineA.localeCompare(lineB) || (stationA?.name ?? "").localeCompare(stationB?.name ?? "", "cs") || a.name.localeCompare(b.name, "cs");
    });
  }

  test("bez polohy: linka B před linkou C", () => {
    const items: Item[] = [
      { id: "1", name: "P+R Chodov", metroStationId: "line-c", coordinates: { lat: 0, lon: 0 } },
      { id: "2", name: "P+R Zličín", metroStationId: "line-a-second", coordinates: { lat: 0, lon: 0 } },
    ];
    const sorted = sortWithoutPosition(items);
    assert.equal(sorted[0].id, "2");
  });

  test("bez polohy: v rámci stejné linky se řadí abecedně podle názvu stanice", () => {
    const items: Item[] = [
      { id: "zlicin", name: "P+R Zličín", metroStationId: "line-a-second", coordinates: { lat: 0, lon: 0 } },
      { id: "andel", name: "P+R Anděl", metroStationId: "line-a-first", coordinates: { lat: 0, lon: 0 } },
    ];
    const sorted = sortWithoutPosition(items);
    assert.deepEqual(sorted.map((i) => i.id), ["andel", "zlicin"]);
  });

  test("bez polohy: pořadí je stabilní napříč opakovanými voláními (deterministické)", () => {
    const items: Item[] = [
      { id: "1", name: "P+R Chodov", metroStationId: "line-c", coordinates: { lat: 0, lon: 0 } },
      { id: "2", name: "P+R Zličín", metroStationId: "line-a-second", coordinates: { lat: 0, lon: 0 } },
    ];
    const first = sortWithoutPosition(items).map((i) => i.id);
    const second = sortWithoutPosition(items).map((i) => i.id);
    assert.deepEqual(first, second);
  });
});
