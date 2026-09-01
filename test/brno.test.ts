import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { BRNO_CENTER, classifyOutsidePrague, isNearBrno } from "../lib/metro/brno.ts";
import { haversineDistanceMeters } from "../lib/metro/haversine.ts";

// Praha (Muzeum, zhruba střed pražského metra) — použito pro ověření,
// že se brněnská detekce a "mimo Prahu" nikdy nepřekrývají u reálné
// polohy v Praze (viz zadání bod 17).
const PRAGUE_MUZEUM = { lat: 50.0755, lon: 14.4326 };

// Bod přesně sever od BRNO_CENTER ve vzdálenosti ~D metrů — 1 stupeň
// zeměpisné šířky je ~111 320 m, takže posun o D/111320 stupňů dá bod
// vzdálený přibližně D metrů (přesnost v řádu jednotek metrů, víc než
// dost na 30km hranici s tolerancí, viz zadání "hraniční test s
// vhodnou tolerancí").
function pointNorthOfBrno(distanceMeters: number) {
  const deltaLat = distanceMeters / 111_320;
  return { lat: BRNO_CENTER.lat + deltaLat, lon: BRNO_CENTER.lon };
}

describe("isNearBrno", () => {
  test("13. bod jasně uvnitř 30 km hranice je detekovaný jako Brno", () => {
    const point = pointNorthOfBrno(10_000);
    assert.ok(haversineDistanceMeters(point, BRNO_CENTER) < 30_000);
    assert.equal(isNearBrno(point), true);
  });

  test("14. bod jasně mimo 30 km hranici není detekovaný jako Brno", () => {
    const point = pointNorthOfBrno(60_000);
    assert.ok(haversineDistanceMeters(point, BRNO_CENTER) > 30_000);
    assert.equal(isNearBrno(point), false);
  });

  test("hraniční test s tolerancí — těsně pod 30 km (uvnitř) vs. těsně nad 30 km (mimo)", () => {
    const justInside = pointNorthOfBrno(29_900);
    const justOutside = pointNorthOfBrno(30_100);
    assert.equal(isNearBrno(justInside), true);
    assert.equal(isNearBrno(justOutside), false);
  });

  test("BRNO_CENTER samotný je (triviálně) uvnitř hranice", () => {
    assert.equal(isNearBrno(BRNO_CENTER), true);
  });

  test("17. reálná poloha v centru Prahy není nikdy detekovaná jako Brno (Praha–Brno je skoro 200 km)", () => {
    assert.ok(haversineDistanceMeters(PRAGUE_MUZEUM, BRNO_CENTER) > 150_000);
    assert.equal(isNearBrno(PRAGUE_MUZEUM), false);
  });
});

const OUTSIDE_PRAGUE_THRESHOLD_M = 25_000;

describe("classifyOutsidePrague — nejdřív práh mimo Prahu, pak Brno", () => {
  test("17. v Praze (do prahu) -> 'in-prague', bez ohledu na to, kde je Brno", () => {
    const result = classifyOutsidePrague(5_000, PRAGUE_MUZEUM, OUTSIDE_PRAGUE_THRESHOLD_M);
    assert.deepEqual(result, { kind: "in-prague" });
  });

  test("13./15. mimo Prahu a uvnitř 30 km od Brna -> 'outside-prague', isBrno: true", () => {
    const point = pointNorthOfBrno(5_000);
    const result = classifyOutsidePrague(OUTSIDE_PRAGUE_THRESHOLD_M + 1, point, OUTSIDE_PRAGUE_THRESHOLD_M);
    assert.deepEqual(result, { kind: "outside-prague", isBrno: true });
  });

  test("14./16. mimo Prahu a mimo 30 km od Brna -> 'outside-prague', isBrno: false", () => {
    const farFromBrno = { lat: 50.6, lon: 14.0 }; // Mladá Boleslav, mimo Prahu i mimo Brno
    assert.ok(haversineDistanceMeters(farFromBrno, BRNO_CENTER) > 30_000);
    const result = classifyOutsidePrague(OUTSIDE_PRAGUE_THRESHOLD_M + 1, farFromBrno, OUTSIDE_PRAGUE_THRESHOLD_M);
    assert.deepEqual(result, { kind: "outside-prague", isBrno: false });
  });

  test("přesně na prahu (distanceMeters === threshold) je ještě 'in-prague' (striktně větší, ne >=)", () => {
    const result = classifyOutsidePrague(OUTSIDE_PRAGUE_THRESHOLD_M, PRAGUE_MUZEUM, OUTSIDE_PRAGUE_THRESHOLD_M);
    assert.deepEqual(result, { kind: "in-prague" });
  });
});
