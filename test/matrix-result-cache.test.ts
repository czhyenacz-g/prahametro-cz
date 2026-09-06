import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { MatrixResultCache } from "../lib/routing/matrix-result-cache.ts";
import type { FinalEntranceResult } from "../lib/routing/rank-walking-results.ts";
import type { MetroEntrance } from "../lib/metro/types.ts";

function entrance(id: string): MetroEntrance {
  return { id, stationId: `station-${id}`, stationName: `Station ${id}`, entranceLabel: "A", lat: 50.08, lon: 14.43, wheelchair: "unknown", lines: ["A"] };
}

function results(): FinalEntranceResult[] {
  return [{ entrance: entrance("e1"), distanceMeters: 300, durationSeconds: 250, source: "walking-route" }];
}

const BASE = { now: 1_000_000, position: { lat: 50.08, lon: 14.43 }, candidateIds: ["e1", "e2"], routeType: "foot_fast" };
const MAX_AGE = 5 * 60 * 1000;
const MAX_DISTANCE = 100;

describe("MatrixResultCache — 4. čerstvost (do 5 minut)", () => {
  test("hit těsně před vypršením TTL", () => {
    const cache = new MatrixResultCache();
    cache.set({ ...BASE, results: results() });
    const hit = cache.get({ ...BASE, now: BASE.now + MAX_AGE - 1, maxAgeMs: MAX_AGE, maxDistanceMeters: MAX_DISTANCE });
    assert.notEqual(hit, null);
  });

  test("miss po vypršení TTL", () => {
    const cache = new MatrixResultCache();
    cache.set({ ...BASE, results: results() });
    const hit = cache.get({ ...BASE, now: BASE.now + MAX_AGE + 1, maxAgeMs: MAX_AGE, maxDistanceMeters: MAX_DISTANCE });
    assert.equal(hit, null);
  });
});

describe("MatrixResultCache — 5. vzdálenost (do 100 m od polohy posledního výpočtu)", () => {
  test("hit pro polohu ~50 m od uložené", () => {
    const cache = new MatrixResultCache();
    cache.set({ ...BASE, results: results() });
    // ~0.00045° zeměpisné šířky ≈ 50 m
    const nearby = { lat: BASE.position.lat + 0.00045, lon: BASE.position.lon };
    const hit = cache.get({ now: BASE.now, position: nearby, candidateIds: BASE.candidateIds, routeType: BASE.routeType, maxAgeMs: MAX_AGE, maxDistanceMeters: MAX_DISTANCE });
    assert.notEqual(hit, null);
  });

  test("miss pro polohu přes 100 m od uložené", () => {
    const cache = new MatrixResultCache();
    cache.set({ ...BASE, results: results() });
    const farAway = { lat: BASE.position.lat + 0.01, lon: BASE.position.lon }; // ~1100 m
    const hit = cache.get({ now: BASE.now, position: farAway, candidateIds: BASE.candidateIds, routeType: BASE.routeType, maxAgeMs: MAX_AGE, maxDistanceMeters: MAX_DISTANCE });
    assert.equal(hit, null);
  });
});

describe("MatrixResultCache — 6./7. stejná sada kandidátů a stejný režim", () => {
  test("miss, pokud se sada kandidátů liší", () => {
    const cache = new MatrixResultCache();
    cache.set({ ...BASE, results: results() });
    const hit = cache.get({ ...BASE, candidateIds: ["e1", "e3"], maxAgeMs: MAX_AGE, maxDistanceMeters: MAX_DISTANCE });
    assert.equal(hit, null);
  });

  test("hit i při jiném POŘADÍ stejné sady kandidátů (množinové porovnání)", () => {
    const cache = new MatrixResultCache();
    cache.set({ ...BASE, candidateIds: ["e2", "e1"], results: results() });
    const hit = cache.get({ ...BASE, candidateIds: ["e1", "e2"], maxAgeMs: MAX_AGE, maxDistanceMeters: MAX_DISTANCE });
    assert.notEqual(hit, null);
  });

  test("miss, pokud se liší routeType", () => {
    const cache = new MatrixResultCache();
    cache.set({ ...BASE, results: results() });
    const hit = cache.get({ ...BASE, routeType: "foot_hiking", maxAgeMs: MAX_AGE, maxDistanceMeters: MAX_DISTANCE });
    assert.equal(hit, null);
  });
});

describe("MatrixResultCache — bez uloženého záznamu", () => {
  test("prázdná cache vždy vrátí null", () => {
    const cache = new MatrixResultCache();
    assert.equal(cache.get({ ...BASE, maxAgeMs: MAX_AGE, maxDistanceMeters: MAX_DISTANCE }), null);
  });
});

describe("MatrixResultCache — 8. žádná persistence (jen vlastnost instance v paměti)", () => {
  test("nová instance nevidí data z jiné instance (žádné sdílené úložiště mimo modul)", () => {
    const a = new MatrixResultCache();
    a.set({ ...BASE, results: results() });
    const b = new MatrixResultCache();
    assert.equal(b.get({ ...BASE, maxAgeMs: MAX_AGE, maxDistanceMeters: MAX_DISTANCE }), null);
  });
});
