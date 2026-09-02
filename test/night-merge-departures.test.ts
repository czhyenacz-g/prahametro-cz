import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { getMergedUpcomingDepartures } from "../lib/night-transport/merge-departures.ts";
import type { CalendarDefinition } from "../lib/departures/types.ts";
import type { NightRouteAtStop } from "../lib/night-transport/types.ts";

const SERVICE_DATE = { year: 2026, month: 9, day: 8 };
const CALENDAR: CalendarDefinition = { serviceId: "SVC1", weekdays: [true, true, true, true, true, true, true], startDate: "20260901", endDate: "20260930", addedDates: [], removedDates: [] };

function route(shortName: string, directions: NightRouteAtStop["directions"]): NightRouteAtStop {
  return { routeId: `R${shortName}`, shortName, vehicleType: "tram", category: "tram", colorHex: "7A0603", textColorHex: "FFFFFF", directions };
}

describe("getMergedUpcomingDepartures", () => {
  test("23. odjezdy více linek se seřadí chronologicky, ne po linkách", () => {
    const routes = [
      route("96", [{ directionId: "0", headsign: "Sídliště Petřiny", departures: [{ time: 18 * 60, headsign: "Sídliště Petřiny", serviceId: "SVC1" }] }]),
      route("91", [{ directionId: "0", headsign: "Divoká Šárka", departures: [{ time: 12 * 60, headsign: "Divoká Šárka", serviceId: "SVC1" }] }]),
      route("904", [{ directionId: "1", headsign: "Sídliště Písnice", departures: [{ time: 25 * 60, headsign: "Sídliště Písnice", serviceId: "SVC1" }] }]),
    ];
    const result = getMergedUpcomingDepartures({ routes, calendars: [CALENDAR] }, SERVICE_DATE, 0, 3);
    assert.deepEqual(
      result.map((r) => r.lineShortName),
      ["91", "96", "904"]
    );
    assert.deepEqual(
      result.map((r) => r.secondsSinceTodayMidnight),
      [12 * 60, 18 * 60, 25 * 60]
    );
  });

  test("24. odjetý spoj (čas < now) se do sloučeného výsledku nedostane", () => {
    const routes = [route("91", [{ directionId: "0", headsign: "X", departures: [{ time: 5 * 60, headsign: "X", serviceId: "SVC1" }, { time: 30 * 60, headsign: "X", serviceId: "SVC1" }] }])];
    const result = getMergedUpcomingDepartures({ routes, calendars: [CALENDAR] }, SERVICE_DATE, 10 * 60, 3);
    assert.deepEqual(result.map((r) => r.secondsSinceTodayMidnight), [30 * 60]);
  });

  test("respektuje limit napříč všemi linkami dohromady, ne na linku", () => {
    const routes = [
      route("91", [{ directionId: "0", headsign: "X", departures: [{ time: 60, headsign: "X", serviceId: "SVC1" }, { time: 120, headsign: "X", serviceId: "SVC1" }] }]),
      route("96", [{ directionId: "0", headsign: "Y", departures: [{ time: 90, headsign: "Y", serviceId: "SVC1" }, { time: 180, headsign: "Y", serviceId: "SVC1" }] }]),
    ];
    const result = getMergedUpcomingDepartures({ routes, calendars: [CALENDAR] }, SERVICE_DATE, 0, 3);
    assert.equal(result.length, 3);
    assert.deepEqual(result.map((r) => r.secondsSinceTodayMidnight), [60, 90, 120]);
  });

  test("prázdné routes -> prázdný výsledek, nespadne", () => {
    assert.deepEqual(getMergedUpcomingDepartures({ routes: [], calendars: [CALENDAR] }, SERVICE_DATE, 0, 3), []);
  });
});
