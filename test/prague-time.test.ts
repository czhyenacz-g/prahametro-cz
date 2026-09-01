import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { addDaysToCalendarDate, getPragueDateTime, getPragueSecondsSinceMidnight } from "../lib/time/prague-time.ts";

describe("getPragueDateTime — 8. správná časová zóna Europe/Prague", () => {
  test("zimní čas (CET, +1) — UTC poledne je 13:00 v Praze", () => {
    const dt = getPragueDateTime(new Date("2026-01-15T12:00:00Z"));
    assert.deepEqual(dt, { year: 2026, month: 1, day: 15, hour: 13, minute: 0, second: 0 });
  });

  test("letní čas (CEST, +2) — UTC poledne je 14:00 v Praze", () => {
    const dt = getPragueDateTime(new Date("2026-07-15T12:00:00Z"));
    assert.deepEqual(dt, { year: 2026, month: 7, day: 15, hour: 14, minute: 0, second: 0 });
  });

  test("9. přechod na letní čas (2026-03-29) — den před a den po přechodu mají rozdílný offset", () => {
    const before = getPragueDateTime(new Date("2026-03-29T00:30:00Z")); // 01:30 CET
    const after = getPragueDateTime(new Date("2026-03-29T01:30:00Z")); // 03:30 CEST (02:xx neexistuje)
    assert.deepEqual(before, { year: 2026, month: 3, day: 29, hour: 1, minute: 30, second: 0 });
    assert.deepEqual(after, { year: 2026, month: 3, day: 29, hour: 3, minute: 30, second: 0 });
  });

  test("10. přechod na zimní čas (2026-10-25) — hodiny se vrací zpět", () => {
    const before = getPragueDateTime(new Date("2026-10-25T00:30:00Z")); // 02:30 CEST
    const after = getPragueDateTime(new Date("2026-10-25T01:30:00Z")); // 02:30 CET (hodina 02:xx nastane dvakrát)
    assert.deepEqual(before, { year: 2026, month: 10, day: 25, hour: 2, minute: 30, second: 0 });
    assert.deepEqual(after, { year: 2026, month: 10, day: 25, hour: 2, minute: 30, second: 0 });
  });
});

describe("getPragueSecondsSinceMidnight", () => {
  test("odpovídá hodině/minutě/sekundě z getPragueDateTime", () => {
    const date = new Date("2026-06-15T20:15:30Z"); // 22:15:30 CEST
    assert.equal(getPragueSecondsSinceMidnight(date), 22 * 3600 + 15 * 60 + 30);
  });

  test("přesná půlnoc -> 0", () => {
    // 2026-01-15T00:00:00 CET = 2026-01-14T23:00:00Z
    assert.equal(getPragueSecondsSinceMidnight(new Date("2026-01-14T23:00:00Z")), 0);
  });
});

describe("addDaysToCalendarDate", () => {
  test("běžný posun v rámci měsíce", () => {
    assert.deepEqual(addDaysToCalendarDate({ year: 2026, month: 9, day: 8 }, -1), { year: 2026, month: 9, day: 7 });
    assert.deepEqual(addDaysToCalendarDate({ year: 2026, month: 9, day: 8 }, 1), { year: 2026, month: 9, day: 9 });
  });

  test("přechod přes konec měsíce a roku", () => {
    assert.deepEqual(addDaysToCalendarDate({ year: 2026, month: 9, day: 1 }, -1), { year: 2026, month: 8, day: 31 });
    assert.deepEqual(addDaysToCalendarDate({ year: 2026, month: 12, day: 31 }, 1), { year: 2027, month: 1, day: 1 });
  });

  test("přestupný rok — 28. únor + 1 = 29. únor", () => {
    assert.deepEqual(addDaysToCalendarDate({ year: 2024, month: 2, day: 28 }, 1), { year: 2024, month: 2, day: 29 });
  });
});
