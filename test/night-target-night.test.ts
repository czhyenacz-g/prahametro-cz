import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { getTargetNightWindow } from "../lib/night-transport/target-night.ts";

describe("getTargetNightWindow", () => {
  test("20. 02:00 (probíhající noc) → serviceDate je VČEREJŠÍ den, now posunuté o +24h", () => {
    // Středa 2026-09-09 02:00 CEST (UTC+2) = 2026-09-09T00:00:00Z.
    const result = getTargetNightWindow(new Date("2026-09-09T00:00:00Z"));
    assert.deepEqual(result.serviceDate, { year: 2026, month: 9, day: 8 }); // úterý
    assert.equal(result.nowSecondsSinceServiceMidnight, 2 * 3600 + 24 * 3600);
  });

  test("21. 14:00 (nadcházející noc, den) → serviceDate je DNEŠEK, now beze změny", () => {
    // Středa 2026-09-09 14:00 CEST = 2026-09-09T12:00:00Z.
    const result = getTargetNightWindow(new Date("2026-09-09T12:00:00Z"));
    assert.deepEqual(result.serviceDate, { year: 2026, month: 9, day: 9 });
    assert.equal(result.nowSecondsSinceServiceMidnight, 14 * 3600);
  });

  test("25. isOngoing rozlišuje probíhající noc (02:00) od nadcházející (14:00) — použito k zobrazení upozornění během dne", () => {
    assert.equal(getTargetNightWindow(new Date("2026-09-09T00:00:00Z")).isOngoing, true); // 02:00
    assert.equal(getTargetNightWindow(new Date("2026-09-09T12:00:00Z")).isOngoing, false); // 14:00
  });

  test("22. 23:30 (nadcházející noc, pozdní večer) → serviceDate je DNEŠEK, now beze změny", () => {
    // Středa 2026-09-09 23:30 CEST = 2026-09-09T21:30:00Z.
    const result = getTargetNightWindow(new Date("2026-09-09T21:30:00Z"));
    assert.deepEqual(result.serviceDate, { year: 2026, month: 9, day: 9 });
    assert.equal(result.nowSecondsSinceServiceMidnight, 23 * 3600 + 30 * 60);
  });

  test("hranice 04:59 je ještě probíhající noc (včerejší serviceDate)", () => {
    // 2026-09-09 04:59 CEST = 2026-09-09T02:59:00Z.
    const result = getTargetNightWindow(new Date("2026-09-09T02:59:00Z"));
    assert.deepEqual(result.serviceDate, { year: 2026, month: 9, day: 8 });
  });

  test("hranice 05:00 už je nadcházející noc (dnešní serviceDate)", () => {
    // 2026-09-09 05:00 CEST = 2026-09-09T03:00:00Z.
    const result = getTargetNightWindow(new Date("2026-09-09T03:00:00Z"));
    assert.deepEqual(result.serviceDate, { year: 2026, month: 9, day: 9 });
    assert.equal(result.nowSecondsSinceServiceMidnight, 5 * 3600);
  });

  test("přechod měsíce/roku funguje přes addDaysToCalendarDate (1. 1. 02:00 → serviceDate 31. 12. předchozího roku)", () => {
    // 2027-01-01 02:00 CET (UTC+1, zimní čas) = 2027-01-01T01:00:00Z.
    const result = getTargetNightWindow(new Date("2027-01-01T01:00:00Z"));
    assert.deepEqual(result.serviceDate, { year: 2026, month: 12, day: 31 });
  });

  test("18. letní čas (přechod na CEST, poslední neděle v březnu 2026-03-29) — 02:00 místního času den po přechodu se počítá správně", () => {
    // 2026-03-30 02:00 CEST (UTC+2, už po přechodu) = 2026-03-30T00:00:00Z.
    const result = getTargetNightWindow(new Date("2026-03-30T00:00:00Z"));
    assert.deepEqual(result.serviceDate, { year: 2026, month: 3, day: 29 });
    assert.equal(result.nowSecondsSinceServiceMidnight, 2 * 3600 + 24 * 3600);
  });

  test("19. zimní čas (přechod na CET, poslední neděle v říjnu 2026-10-25) — 02:00 místního času den po přechodu se počítá správně", () => {
    // 2026-10-26 02:00 CET (UTC+1, už po přechodu) = 2026-10-26T01:00:00Z.
    const result = getTargetNightWindow(new Date("2026-10-26T01:00:00Z"));
    assert.deepEqual(result.serviceDate, { year: 2026, month: 10, day: 25 });
    assert.equal(result.nowSecondsSinceServiceMidnight, 2 * 3600 + 24 * 3600);
  });
});
