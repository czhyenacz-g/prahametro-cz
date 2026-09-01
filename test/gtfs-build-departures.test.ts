import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { buildDepartures } from "../lib/gtfs/build-departures.ts";
import type { GtfsCalendar, GtfsCalendarDate, GtfsRoute, GtfsStop, GtfsStopTimeWithDeparture, GtfsTrip } from "../lib/gtfs/types.ts";

const routes: GtfsRoute[] = [
  { route_id: "M-A", route_short_name: "A", route_type: "1" },
  { route_id: "M-B", route_short_name: "B", route_type: "1" },
  { route_id: "BUS1", route_short_name: "119", route_type: "3" },
];

const META = { generatedAt: "2026-09-01T00:00:00Z", source: "https://data.pid.cz/PID_GTFS.zip" };

const CALENDARS: GtfsCalendar[] = [
  { service_id: "weekday", monday: "1", tuesday: "1", wednesday: "1", thursday: "1", friday: "1", saturday: "0", sunday: "0", start_date: "20260901", end_date: "20260930" },
];
const CALENDAR_DATES: GtfsCalendarDate[] = [];

describe("buildDepartures — poslední zastávka spoje je jen příjezd, ne odjezd", () => {
  const stops: GtfsStop[] = [
    { stop_id: "terminus", stop_name: "Petřiny", stop_lat: "50.1", stop_lon: "14.1", location_type: "1", parent_station: "", wheelchair_boarding: "" },
    { stop_id: "terminusPlatform", stop_name: "Petřiny", stop_lat: "50.1", stop_lon: "14.1", location_type: "0", parent_station: "terminus", wheelchair_boarding: "" },
    { stop_id: "otherPlatform", stop_name: "Jiná stanice", stop_lat: "50.2", stop_lon: "14.2", location_type: "0", parent_station: "other", wheelchair_boarding: "" },
  ];
  const trips: GtfsTrip[] = [
    // Odjíždí Z terminusu (seq 1, dál pokračuje) — skutečný odjezd.
    { trip_id: "departing", route_id: "M-A", service_id: "weekday", trip_headsign: "Skalka", direction_id: "1" },
    // Přijíždí DO terminusu (seq je poslední pro tenhle trip) — jen příjezd, NESMÍ se objevit jako odjezd.
    { trip_id: "arriving", route_id: "M-A", service_id: "weekday", trip_headsign: "Petřiny", direction_id: "0" },
  ];
  const stopTimes: GtfsStopTimeWithDeparture[] = [
    { trip_id: "departing", stop_id: "terminusPlatform", departure_time: "10:00:00", stop_sequence: "1" },
    { trip_id: "departing", stop_id: "otherPlatform", departure_time: "10:05:00", stop_sequence: "2" },
    { trip_id: "arriving", stop_id: "otherPlatform", departure_time: "09:50:00", stop_sequence: "1" },
    { trip_id: "arriving", stop_id: "terminusPlatform", departure_time: "09:55:00", stop_sequence: "2" },
  ];

  test("15. na terminálu se vygeneruje jen skutečně obsluhovaný (odjíždějící) směr — příjezd se do odjezdů nezapočítá", () => {
    const files = buildDepartures(routes, trips, stops, stopTimes, CALENDARS, CALENDAR_DATES, META);
    const file = files.get("terminus");
    assert.ok(file);
    assert.equal(file!.lines.length, 1);
    assert.equal(file!.lines[0].directions.length, 1);
    assert.equal(file!.lines[0].directions[0].directionId, "1"); // jen "departing" (direction_id=1), ne "arriving" (direction_id=0)
    assert.equal(file!.lines[0].directions[0].departures[0].headsign, "Skalka");
  });

  test("příjezd (poslední zastávka spoje) se nikde neobjeví, ani jako samostatný záznam", () => {
    const files = buildDepartures(routes, trips, stops, stopTimes, CALENDARS, CALENDAR_DATES, META);
    const file = files.get("terminus")!;
    const allHeadsigns = file.lines.flatMap((l) => l.directions.flatMap((d) => d.departures.map((dep) => dep.headsign)));
    assert.ok(!allHeadsigns.includes("Petřiny")); // headsign shodný se stanicí samotnou = příznak příjezdu
  });
});

describe("buildDepartures — přestupní stanice s více linkami (16.)", () => {
  const stops: GtfsStop[] = [
    { stop_id: "interchange", stop_name: "Muzeum", stop_lat: "50.08", stop_lon: "14.43", location_type: "1", parent_station: "", wheelchair_boarding: "" },
    { stop_id: "platformA", stop_name: "Muzeum", stop_lat: "50.08", stop_lon: "14.43", location_type: "0", parent_station: "interchange", wheelchair_boarding: "" },
    { stop_id: "platformC", stop_name: "Muzeum", stop_lat: "50.08", stop_lon: "14.43", location_type: "0", parent_station: "interchange", wheelchair_boarding: "" },
    { stop_id: "nextStop", stop_name: "Další", stop_lat: "50.09", stop_lon: "14.44", location_type: "0", parent_station: "next", wheelchair_boarding: "" },
  ];
  const trips: GtfsTrip[] = [
    { trip_id: "tA0", route_id: "M-A", service_id: "weekday", trip_headsign: "Depo Hostivař", direction_id: "0" },
    { trip_id: "tA1", route_id: "M-A", service_id: "weekday", trip_headsign: "Nemocnice Motol", direction_id: "1" },
    { trip_id: "tB0", route_id: "M-B", service_id: "weekday", trip_headsign: "Černý Most", direction_id: "0" },
  ];
  const stopTimes: GtfsStopTimeWithDeparture[] = [
    { trip_id: "tA0", stop_id: "platformA", departure_time: "10:00:00", stop_sequence: "5" },
    { trip_id: "tA0", stop_id: "nextStop", departure_time: "10:02:00", stop_sequence: "6" },
    { trip_id: "tA1", stop_id: "platformA", departure_time: "10:05:00", stop_sequence: "5" },
    { trip_id: "tA1", stop_id: "nextStop", departure_time: "10:07:00", stop_sequence: "6" },
    { trip_id: "tB0", stop_id: "platformC", departure_time: "10:10:00", stop_sequence: "3" },
    { trip_id: "tB0", stop_id: "nextStop", departure_time: "10:12:00", stop_sequence: "4" },
  ];

  test("stanice se dvěma liniemi (A, B) má obě jako samostatné LineGroup", () => {
    const files = buildDepartures(routes, trips, stops, stopTimes, CALENDARS, CALENDAR_DATES, META);
    const file = files.get("interchange");
    assert.ok(file);
    assert.deepEqual(
      file!.lines.map((l) => l.line),
      ["A", "B"]
    );
    assert.equal(file!.lines.find((l) => l.line === "A")?.directions.length, 2);
    assert.equal(file!.lines.find((l) => l.line === "B")?.directions.length, 1);
  });
});

describe("buildDepartures — krátce ukončený spoj s jiným trip_headsign (17.)", () => {
  const stops: GtfsStop[] = [
    { stop_id: "st", stop_name: "Stanice", stop_lat: "50.1", stop_lon: "14.1", location_type: "1", parent_station: "", wheelchair_boarding: "" },
    { stop_id: "stPlatform", stop_name: "Stanice", stop_lat: "50.1", stop_lon: "14.1", location_type: "0", parent_station: "st", wheelchair_boarding: "" },
    { stop_id: "nextStop", stop_name: "Další", stop_lat: "50.2", stop_lon: "14.2", location_type: "0", parent_station: "next", wheelchair_boarding: "" },
  ];
  // Většina spojů jede do "Zličín", jeden krátce končí v "Motol" — stejný direction_id. Všechny tři pokračují dál (stanice "st" pro ně není poslední), takže jde o skutečné odjezdy.
  const trips: GtfsTrip[] = [
    { trip_id: "t1", route_id: "M-B", service_id: "weekday", trip_headsign: "Zličín", direction_id: "0" },
    { trip_id: "t2", route_id: "M-B", service_id: "weekday", trip_headsign: "Zličín", direction_id: "0" },
    { trip_id: "t3", route_id: "M-B", service_id: "weekday", trip_headsign: "Motol", direction_id: "0" },
  ];
  const stopTimes: GtfsStopTimeWithDeparture[] = [
    { trip_id: "t1", stop_id: "stPlatform", departure_time: "10:00:00", stop_sequence: "1" },
    { trip_id: "t1", stop_id: "nextStop", departure_time: "10:02:00", stop_sequence: "2" },
    { trip_id: "t2", stop_id: "stPlatform", departure_time: "10:10:00", stop_sequence: "1" },
    { trip_id: "t2", stop_id: "nextStop", departure_time: "10:12:00", stop_sequence: "2" },
    { trip_id: "t3", stop_id: "stPlatform", departure_time: "10:05:00", stop_sequence: "1" },
    { trip_id: "t3", stop_id: "nextStop", departure_time: "10:07:00", stop_sequence: "2" },
  ];

  test("dominantní headsign směru je většinový ('Zličín'), ale krátký spoj si nese vlastní headsign ('Motol') na svém řádku", () => {
    const files = buildDepartures(routes, trips, stops, stopTimes, CALENDARS, CALENDAR_DATES, META);
    const direction = files.get("st")!.lines[0].directions[0];
    assert.equal(direction.headsign, "Zličín");
    const shortTurn = direction.departures.find((d) => d.time === 10 * 3600 + 5 * 60);
    assert.equal(shortTurn?.headsign, "Motol");
    assert.equal(direction.departures.find((d) => d.time === 10 * 3600)?.headsign, "Zličín");
  });
});

describe("buildDepartures — obecné chování", () => {
  const stops: GtfsStop[] = [
    { stop_id: "st", stop_name: "Stanice", stop_lat: "50.1", stop_lon: "14.1", location_type: "1", parent_station: "", wheelchair_boarding: "" },
    { stop_id: "stPlatform", stop_name: "Stanice", stop_lat: "50.1", stop_lon: "14.1", location_type: "0", parent_station: "st", wheelchair_boarding: "" },
    { stop_id: "nextStop", stop_name: "Další", stop_lat: "50.2", stop_lon: "14.2", location_type: "0", parent_station: "next", wheelchair_boarding: "" },
    { stop_id: "busStop", stop_name: "Bus", stop_lat: "50.3", stop_lon: "14.3", location_type: "0", parent_station: "", wheelchair_boarding: "" },
  ];
  const trips: GtfsTrip[] = [
    { trip_id: "t1", route_id: "M-A", service_id: "weekday", trip_headsign: "X", direction_id: "0" },
    { trip_id: "tBus", route_id: "BUS1", service_id: "weekday", trip_headsign: "Y", direction_id: "0" },
  ];
  const stopTimes: GtfsStopTimeWithDeparture[] = [
    { trip_id: "t1", stop_id: "stPlatform", departure_time: "10:00:00", stop_sequence: "1" },
    { trip_id: "t1", stop_id: "nextStop", departure_time: "10:02:00", stop_sequence: "2" },
    { trip_id: "tBus", stop_id: "busStop", departure_time: "10:00:00", stop_sequence: "1" },
  ];

  test("nemetro spoje (route_type != 1) se do žádného souboru nedostanou", () => {
    const files = buildDepartures(routes, trips, stops, stopTimes, CALENDARS, CALENDAR_DATES, META);
    assert.equal(files.size, 1);
    assert.ok(!files.has("busStop"));
  });

  test("kalendáře v souboru jsou omezené jen na service_id skutečně použité danou stanicí", () => {
    const files = buildDepartures(routes, trips, stops, stopTimes, CALENDARS, CALENDAR_DATES, META);
    const file = files.get("st")!;
    assert.deepEqual(
      file.calendars.map((c) => c.serviceId),
      ["weekday"]
    );
  });

  test("generatedAt/source se propíšou z meta parametru", () => {
    const files = buildDepartures(routes, trips, stops, stopTimes, CALENDARS, CALENDAR_DATES, META);
    const file = files.get("st")!;
    assert.equal(file.generatedAt, META.generatedAt);
    assert.equal(file.source, META.source);
  });

  test("neplatný departure_time (nerozpoznatelný formát) se bezpečně přeskočí, nespadne", () => {
    const badStopTimes: GtfsStopTimeWithDeparture[] = [
      { trip_id: "t1", stop_id: "stPlatform", departure_time: "not-a-time", stop_sequence: "1" },
      { trip_id: "t1", stop_id: "nextStop", departure_time: "10:02:00", stop_sequence: "2" },
    ];
    assert.doesNotThrow(() => buildDepartures(routes, trips, stops, badStopTimes, CALENDARS, CALENDAR_DATES, META));
    const files = buildDepartures(routes, trips, stops, badStopTimes, CALENDARS, CALENDAR_DATES, META);
    assert.equal(files.size, 0);
  });

  test("neplatný/chybějící stop_sequence se bezpečně ignoruje při hledání max. sekvence, řádek samotný se nezahodí", () => {
    const weirdStopTimes: GtfsStopTimeWithDeparture[] = [{ trip_id: "t1", stop_id: "stPlatform", departure_time: "10:00:00", stop_sequence: "not-a-number" }];
    assert.doesNotThrow(() => buildDepartures(routes, trips, stops, weirdStopTimes, CALENDARS, CALENDAR_DATES, META));
  });
});
