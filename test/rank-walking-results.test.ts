import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { rankWalkingResults } from "../lib/routing/rank-walking-results.ts";
import type { WalkingRouteResult } from "../lib/routing/mapy-walking-matrix.ts";
import type { EntranceWithDistance } from "../lib/metro/nearest-entrances.ts";
import type { MetroEntrance } from "../lib/metro/types.ts";

function entrance(id: string, stationId: string): MetroEntrance {
  return { id, stationId, stationName: stationId, entranceLabel: "A", lat: 50.08, lon: 14.43, wheelchair: "unknown", lines: ["A"] };
}

const candidates: MetroEntrance[] = [entrance("e1", "s1"), entrance("e2", "s2"), entrance("e3", "s3"), entrance("e4", "s4")];

function fallbackEntry(id: string, distanceMeters: number): EntranceWithDistance {
  return { ...entrance(id, `fallback-${id}`), distanceMeters };
}

describe("rankWalkingResults — 21./22./23. řazení a výběr tří nejrychlejších", () => {
  test("21. řadí primárně podle durationSeconds vzestupně", () => {
    const routed: WalkingRouteResult[] = [
      { entranceId: "e1", distanceMeters: 500, durationSeconds: 400 },
      { entranceId: "e2", distanceMeters: 400, durationSeconds: 300 },
      { entranceId: "e3", distanceMeters: 600, durationSeconds: 500 },
    ];
    const result = rankWalkingResults(candidates, routed, [], 3);
    assert.deepEqual(
      result!.map((r) => r.entrance.id),
      ["e2", "e1", "e3"]
    );
  });

  test("22. při shodném čase řadí podle distanceMeters", () => {
    const routed: WalkingRouteResult[] = [
      { entranceId: "e1", distanceMeters: 500, durationSeconds: 300 },
      { entranceId: "e2", distanceMeters: 300, durationSeconds: 300 },
    ];
    const result = rankWalkingResults(candidates, routed, [], 3);
    assert.deepEqual(
      result!.map((r) => r.entrance.id),
      ["e2", "e1"]
    );
  });

  test("23. vybere jen limit (3) nejrychlejších, i když je kandidátů víc", () => {
    const routed: WalkingRouteResult[] = [
      { entranceId: "e1", distanceMeters: 100, durationSeconds: 100 },
      { entranceId: "e2", distanceMeters: 100, durationSeconds: 200 },
      { entranceId: "e3", distanceMeters: 100, durationSeconds: 300 },
      { entranceId: "e4", distanceMeters: 100, durationSeconds: 50 },
    ];
    const result = rankWalkingResults(candidates, routed, [], 3);
    assert.equal(result!.length, 3);
    assert.deepEqual(
      result!.map((r) => r.entrance.id),
      ["e4", "e1", "e2"]
    );
  });

  test("24. sedmý (vzdušně vzdálenější) kandidát smí přeskočit vzdušně bližší, pokud je pěšky rychlejší", () => {
    // e1 je vzdušně nejblíž, ale pěšky nejpomalejší (např. kvůli řece) —
    // e4 je vzdušně nejdál ze čtveřice, ale pěšky nejrychlejší.
    const routed: WalkingRouteResult[] = [
      { entranceId: "e1", distanceMeters: 200, durationSeconds: 900 },
      { entranceId: "e2", distanceMeters: 400, durationSeconds: 400 },
      { entranceId: "e3", distanceMeters: 500, durationSeconds: 450 },
      { entranceId: "e4", distanceMeters: 800, durationSeconds: 300 },
    ];
    const result = rankWalkingResults(candidates, routed, [], 3);
    assert.deepEqual(
      result!.map((r) => r.entrance.id),
      ["e4", "e2", "e3"]
    );
    assert.ok(!result!.some((r) => r.entrance.id === "e1"), "vzdušně nejbližší, ale pěšky nejpomalejší vstup se nedostal do trojice");
  });
});

describe("rankWalkingResults — 25. doplnění fallback výsledku při částečné odpovědi", () => {
  test("dva platné routované výsledky + doplněný nejbližší nepoužitý fallback jako třetí, označený air-distance", () => {
    const routed: WalkingRouteResult[] = [
      { entranceId: "e1", distanceMeters: 300, durationSeconds: 250 },
      { entranceId: "e2", distanceMeters: 400, durationSeconds: 350 },
    ];
    const fallbackPool = [fallbackEntry("f1", 150), fallbackEntry("e1", 999)]; // "e1" už použitý routingem, musí se přeskočit
    const result = rankWalkingResults(candidates, routed, fallbackPool, 3);
    assert.equal(result!.length, 3);
    assert.deepEqual(
      result!.map((r) => ({ id: r.entrance.id, source: r.source })),
      [
        { id: "e1", source: "walking-route" },
        { id: "e2", source: "walking-route" },
        { id: "f1", source: "air-distance" },
      ]
    );
    assert.equal(result![2].durationSeconds, null);
  });

  test("jediný platný routovaný výsledek doplní zbylá dvě místa fallbackem", () => {
    const routed: WalkingRouteResult[] = [{ entranceId: "e3", distanceMeters: 300, durationSeconds: 250 }];
    const fallbackPool = [fallbackEntry("f1", 100), fallbackEntry("f2", 200)];
    const result = rankWalkingResults(candidates, routed, fallbackPool, 3);
    assert.deepEqual(
      result!.map((r) => r.source),
      ["walking-route", "air-distance", "air-distance"]
    );
  });
});

describe("rankWalkingResults — 26. úplný fallback při selhání API (žádný platný routovaný výsledek)", () => {
  test("prázdné pole routovaných výsledků vrátí null (volající zachová původní tři vzdušné výsledky)", () => {
    assert.equal(rankWalkingResults(candidates, [], [fallbackEntry("f1", 100)], 3), null);
  });

  test("všechny routované výsledky neplatné (záporné) vrátí null", () => {
    const routed: WalkingRouteResult[] = [
      { entranceId: "e1", distanceMeters: -3, durationSeconds: -3 },
      { entranceId: "e2", distanceMeters: -1, durationSeconds: -1 },
    ];
    assert.equal(rankWalkingResults(candidates, routed, [], 3), null);
  });

  test("routovaný výsledek pro entranceId, které není mezi kandidáty, se ignoruje (obrana proti nesouladu indexů)", () => {
    const routed: WalkingRouteResult[] = [{ entranceId: "unknown-entrance", distanceMeters: 100, durationSeconds: 100 }];
    assert.equal(rankWalkingResults(candidates, routed, [], 3), null);
  });
});
