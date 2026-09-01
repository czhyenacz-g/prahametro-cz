import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { getLastDeparture, getUpcomingDepartures } from "../lib/departures/next-departures.ts";
import type { CalendarDefinition, DepartureRow } from "../lib/departures/types.ts";

const TODAY = { year: 2026, month: 9, day: 8 }; // úterý
const WEEKDAY: CalendarDefinition = {
  serviceId: "weekday",
  weekdays: [true, true, true, true, true, false, false],
  startDate: "20260901",
  endDate: "20260930",
  addedDates: [],
  removedDates: [],
};

function dep(time: number, headsign = "Zličín", serviceId = "weekday"): DepartureRow {
  return { time, headsign, serviceId };
}

describe("getUpcomingDepartures", () => {
  test("11. vrátí tři nejbližší budoucí odjezdy, seřazené vzestupně", () => {
    const departures = [dep(22 * 3600 + 41 * 60), dep(22 * 3600 + 51 * 60), dep(23 * 3600 + 1 * 60), dep(23 * 3600 + 11 * 60)];
    const now = 22 * 3600 + 30 * 60; // 22:30
    const result = getUpcomingDepartures(departures, [WEEKDAY], TODAY, now, 3);
    assert.deepEqual(
      result.map((r) => r.secondsSinceTodayMidnight),
      [22 * 3600 + 41 * 60, 22 * 3600 + 51 * 60, 23 * 3600 + 1 * 60]
    );
  });

  test("12. vynechá už odjeté spoje (čas menší než now)", () => {
    const departures = [dep(10 * 3600), dep(23 * 3600)];
    const now = 12 * 3600; // poledne
    const result = getUpcomingDepartures(departures, [WEEKDAY], TODAY, now, 3);
    assert.deepEqual(
      result.map((r) => r.secondsSinceTodayMidnight),
      [23 * 3600]
    );
  });

  test("6./7. přechod přes půlnoc — GTFS čas > 24:00:00 patřící VČEREJŠÍ aktivní službě se počítá jako dnešní brzké ráno", () => {
    // "Dnes" je sobota (weekday kalendář neaktivní), "včera" pátek (aktivní) — izoluje
    // rollover interpretaci od dvojího započtení stejného záznamu (viz komentář níže).
    const saturday = { year: 2026, month: 9, day: 5 };
    const lateNightDeparture = dep(24 * 3600 + 35 * 60); // 24:35:00 GTFS = 00:35 dnes (patří pátečnímu provoznímu dni)
    const now = 0; // 00:00
    const result = getUpcomingDepartures([lateNightDeparture], [WEEKDAY], saturday, now, 3);
    assert.equal(result.length, 1);
    assert.equal(result[0].secondsSinceTodayMidnight, 35 * 60); // 00:35 = 35 minut po dnešní půlnoci
  });

  test("stejný záznam aktivní dnes I včera legitimně vytvoří dva kandidáty (dnešní ranní spoj z včerejška + zítřejší ranní spoj z dneška) — ne duplicita, ale dva reálné různé spoje", () => {
    const lateNightDeparture = dep(24 * 3600 + 35 * 60);
    const result = getUpcomingDepartures([lateNightDeparture], [WEEKDAY], TODAY, 0, 3);
    assert.equal(result.length, 2);
  });

  test("odjezd >24:00:00 u služby, která NENÍ aktivní ani dnes, ani včera, se nezapočítá vůbec", () => {
    // Neděle (2026-09-06) i sobota před ní (2026-09-05) jsou mimo "weekday" kalendář (po-pá).
    const sunday = { year: 2026, month: 9, day: 6 };
    const lateNightDeparture = dep(24 * 3600 + 10 * 60);
    const result = getUpcomingDepartures([lateNightDeparture], [WEEKDAY], sunday, 0, 3);
    assert.deepEqual(result, []);
  });

  test("20. prázdný seznam odjezdů -> prázdný výsledek, nespadne", () => {
    assert.deepEqual(getUpcomingDepartures([], [WEEKDAY], TODAY, 0, 3), []);
  });

  test("respektuje limit", () => {
    const departures = [dep(1), dep(2), dep(3), dep(4), dep(5)];
    const result = getUpcomingDepartures(departures, [WEEKDAY], TODAY, 0, 2);
    assert.equal(result.length, 2);
  });

  test("odjezd u service_id, které dnes ani včera není aktivní, se nezapočítá", () => {
    const weekend: CalendarDefinition = { ...WEEKDAY, serviceId: "weekend", weekdays: [false, false, false, false, false, true, true] };
    const departures = [dep(23 * 3600, "X", "weekend")];
    const result = getUpcomingDepartures(departures, [WEEKDAY, weekend], TODAY, 0, 3); // TODAY je úterý, weekend nikdy aktivní
    assert.deepEqual(result, []);
  });
});

describe("getLastDeparture", () => {
  test("13. poslední odjezd pro konkrétní linku a směr = max. čas mezi dnes aktivními odjezdy", () => {
    const departures = [dep(22 * 3600 + 41 * 60), dep(23 * 3600 + 41 * 60), dep(20 * 3600)];
    const result = getLastDeparture(departures, [WEEKDAY], TODAY);
    assert.equal(result?.time, 23 * 3600 + 41 * 60);
  });

  test("14. opačný směr má vlastní, nezávisle spočtený poslední odjezd", () => {
    const directionA = [dep(23 * 3600 + 41 * 60, "Zličín")];
    const directionB = [dep(23 * 3600 + 20 * 60, "Depo Hostivař")];
    const lastA = getLastDeparture(directionA, [WEEKDAY], TODAY);
    const lastB = getLastDeparture(directionB, [WEEKDAY], TODAY);
    assert.equal(lastA?.time, 23 * 3600 + 41 * 60);
    assert.equal(lastB?.time, 23 * 3600 + 20 * 60);
    assert.notEqual(lastA?.time, lastB?.time);
  });

  test("nezapočítá odjezdy service_id neaktivních dnes", () => {
    const weekend: CalendarDefinition = { ...WEEKDAY, serviceId: "weekend", weekdays: [false, false, false, false, false, true, true] };
    const departures = [dep(23 * 3600, "X", "weekend"), dep(20 * 3600, "Y", "weekday")];
    const result = getLastDeparture(departures, [WEEKDAY, weekend], TODAY);
    assert.equal(result?.time, 20 * 3600);
  });

  test("žádný aktivní odjezd -> null (ne vymyšlená hodnota)", () => {
    assert.equal(getLastDeparture([], [WEEKDAY], TODAY), null);
    const weekend: CalendarDefinition = { ...WEEKDAY, serviceId: "weekend", weekdays: [false, false, false, false, false, true, true] };
    assert.equal(getLastDeparture([dep(20 * 3600, "X", "weekend")], [weekend], TODAY), null);
  });
});
