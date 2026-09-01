import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { getActiveServiceIds, isServiceActiveOnDate } from "../lib/departures/service-calendar.ts";
import type { CalendarDefinition } from "../lib/departures/types.ts";

function calendar(overrides: Partial<CalendarDefinition> = {}): CalendarDefinition {
  return {
    serviceId: "weekday",
    weekdays: [true, true, true, true, true, false, false], // po-pá
    startDate: "20260901",
    endDate: "20260930",
    addedDates: [],
    removedDates: [],
    ...overrides,
  };
}

describe("isServiceActiveOnDate — základní týdenní vzor", () => {
  test("1. běžný pracovní den (úterý) v rámci platnosti -> aktivní", () => {
    // 2026-09-08 je úterý.
    assert.equal(isServiceActiveOnDate(calendar(), { year: 2026, month: 9, day: 8 }), true);
  });

  test("2. sobota u kalendáře po-pá -> neaktivní", () => {
    // 2026-09-05 je sobota.
    assert.equal(isServiceActiveOnDate(calendar(), { year: 2026, month: 9, day: 5 }), false);
  });

  test("3. neděle u kalendáře po-pá -> neaktivní", () => {
    // 2026-09-06 je neděle.
    assert.equal(isServiceActiveOnDate(calendar(), { year: 2026, month: 9, day: 6 }), false);
  });

  test("sobota je aktivní pro víkendový kalendář", () => {
    const weekend = calendar({ serviceId: "weekend", weekdays: [false, false, false, false, false, true, true] });
    assert.equal(isServiceActiveOnDate(weekend, { year: 2026, month: 9, day: 5 }), true);
    assert.equal(isServiceActiveOnDate(weekend, { year: 2026, month: 9, day: 6 }), true);
  });

  test("mimo start_date/end_date -> neaktivní i když by seděl den v týdnu", () => {
    assert.equal(isServiceActiveOnDate(calendar(), { year: 2026, month: 8, day: 25 }), false); // úterý, ale před start_date
    assert.equal(isServiceActiveOnDate(calendar(), { year: 2026, month: 10, day: 6 }), false); // úterý, ale po end_date
  });
});

describe("calendar_dates výjimky mají přednost", () => {
  test("4. výjimka přidaná (exception_type=1) aktivuje službu i mimo její běžný vzor/rozsah", () => {
    const cal = calendar({ addedDates: ["20260906"] }); // neděle, mimo weekdays vzor
    assert.equal(isServiceActiveOnDate(cal, { year: 2026, month: 9, day: 6 }), true);
  });

  test("5. výjimka odebraná (exception_type=2) deaktivuje jinak aktivní den", () => {
    const cal = calendar({ removedDates: ["20260908"] }); // úterý, jinak aktivní
    assert.equal(isServiceActiveOnDate(cal, { year: 2026, month: 9, day: 8 }), false);
  });

  test("odebrání má přednost i kdyby byl den zároveň v addedDates (removedDates vyhrává)", () => {
    const cal = calendar({ addedDates: ["20260906"], removedDates: ["20260906"] });
    assert.equal(isServiceActiveOnDate(cal, { year: 2026, month: 9, day: 6 }), false);
  });

  test("service_id definovaný jen přes calendar_dates (bez řádku v calendar.txt) funguje", () => {
    const cal = calendar({ weekdays: [false, false, false, false, false, false, false], startDate: "00000000", endDate: "99999999", addedDates: ["20260910"] });
    assert.equal(isServiceActiveOnDate(cal, { year: 2026, month: 9, day: 10 }), true);
    assert.equal(isServiceActiveOnDate(cal, { year: 2026, month: 9, day: 11 }), false);
  });
});

describe("getActiveServiceIds", () => {
  test("vrátí množinu VŠECH aktivních service_id (víc kalendářů může platit současně)", () => {
    const weekday = calendar({ serviceId: "weekday" });
    const daily = calendar({ serviceId: "daily", weekdays: [true, true, true, true, true, true, true] });
    const active = getActiveServiceIds([weekday, daily], { year: 2026, month: 9, day: 8 });
    assert.deepEqual([...active].sort(), ["daily", "weekday"]);
  });

  test("prázdné pole kalendářů -> prázdná množina, nespadne", () => {
    assert.deepEqual(getActiveServiceIds([], { year: 2026, month: 9, day: 8 }), new Set());
  });
});
