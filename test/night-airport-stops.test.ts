import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { isAirportStopGroup, buildAirportRouteReport } from "../lib/night-transport/airport-stops.ts";
import { buildNightDataset } from "../lib/night-transport/build-night-dataset.ts";
import type { GtfsCalendar, GtfsRoute, GtfsStop, GtfsStopTimeWithDeparture, GtfsTrip } from "../lib/gtfs/types.ts";
import type { NightStopDetail } from "../lib/night-transport/types.ts";

const META = { generatedAt: "2026-09-02T10:00:00.000Z", source: "https://data.pid.cz/PID_GTFS.zip", feedStartDate: "20260902", feedEndDate: "20260915" };

function route(id: string, shortName: string, extra: Partial<GtfsRoute> = {}): GtfsRoute {
  return { route_id: id, route_short_name: shortName, route_type: "3", is_night: "1", is_regional: "0", is_substitute_transport: "0", route_color: "", route_text_color: "", ...extra };
}

function stop(id: string, name: string, lat: number, lon: number, extra: Partial<GtfsStop> = {}): GtfsStop {
  return { stop_id: id, stop_name: name, stop_lat: String(lat), stop_lon: String(lon), location_type: "0", parent_station: "", wheelchair_boarding: "0", asw_node_id: "", platform_code: "", ...extra };
}

const CALENDAR: GtfsCalendar = { service_id: "SVC1", monday: "1", tuesday: "1", wednesday: "1", thursday: "1", friday: "1", saturday: "0", sunday: "0", start_date: "20260901", end_date: "20260930" };

describe("isAirportStopGroup — jednotkové testy detekční logiky", () => {
  test("3. rozpoznání přes stabilní identifikátor zastávkového uzlu, i když se jméno vůbec neshoduje s 'letiště'", () => {
    // node:628 je v curated seznamu (skutečné PID uzel "Terminál 1") — jméno je tu záměrně úplně jiné, aby test izoloval JEN ID cestu.
    assert.equal(isAirportStopGroup("node:628", "Nádraží Střed"), true);
    assert.equal(isAirportStopGroup("node:629", "Cokoliv jiného"), true);
  });

  test("4. fallback přes normalizovaný název, pokud stabilní identifikátor chybí (skupina není v curated seznamu)", () => {
    assert.equal(isAirportStopGroup("node:9999", "Letiště Vodochody"), true);
    assert.equal(isAirportStopGroup("node:9999", "K Letišti"), true);
  });

  test("skupina mimo curated seznam a bez shody v názvu → nerozpoznáno", () => {
    assert.equal(isAirportStopGroup("node:9999", "Náměstí Míru"), false);
  });
});

describe("buildAirportRouteReport", () => {
  function detail(id: string, name: string, routeShortNames: string[]): NightStopDetail {
    return {
      id,
      name,
      generatedAt: META.generatedAt,
      source: META.source,
      platforms: [],
      calendars: [],
      routes: routeShortNames.map((shortName) => ({
        routeId: `R${shortName}`,
        shortName,
        vehicleType: "bus",
        category: "urban-bus",
        colorHex: "007DA8",
        textColorHex: "FFFFFF",
        directions: [],
      })),
    };
  }

  test("sestaví přehled linka -> jména letištních zastávek, jen z reálně vygenerovaného datasetu", () => {
    const stopDetails = new Map<string, NightStopDetail>([
      ["node:628", detail("node:628", "Terminál 1", ["907", "910"])],
      ["node:629", detail("node:629", "Terminál 2", ["907", "910"])],
      ["node:100", detail("node:100", "Náměstí Míru", ["96"])], // neletištní, nesmí se objevit
    ]);

    const report = buildAirportRouteReport(stopDetails);
    assert.deepEqual(report, [
      { line: "907", stopNames: ["Terminál 1", "Terminál 2"] },
      { line: "910", stopNames: ["Terminál 1", "Terminál 2"] },
    ]);
  });

  test("žádná letištní zastávka v datasetu → prázdný report, ne vymyšlená hodnota", () => {
    const stopDetails = new Map<string, NightStopDetail>([["node:100", detail("node:100", "Náměstí Míru", ["96"])]]);
    assert.deepEqual(buildAirportRouteReport(stopDetails), []);
  });
});

describe("buildNightDataset — letištní detekce end-to-end (reálný případ linek 907/910 na Terminál 1/2)", () => {
  test("1. noční linka obsluhující Terminál 1 (node:628) se rozpozná jako letištní, i když headsign neobsahuje 'K Letišti'", () => {
    const routes = [route("R907", "907")];
    const trips: GtfsTrip[] = [{ trip_id: "T1", route_id: "R907", service_id: "SVC1", trip_headsign: "Letiště / Airport ✈", direction_id: "1" }];
    const stops = [stop("U628Z1P", "Terminál 1", 50.1, 14.26, { asw_node_id: "628" }), stop("DUMMY", "Jinde", 50.2, 14.3)];
    const stopTimes: GtfsStopTimeWithDeparture[] = [
      { trip_id: "T1", stop_id: "U628Z1P", stop_sequence: "1", departure_time: "24:36:00" },
      { trip_id: "T1", stop_id: "DUMMY", stop_sequence: "2", departure_time: "24:59:00" },
    ];
    const { index } = buildNightDataset(routes, trips, stops, stopTimes, [CALENDAR], [], META);
    assert.deepEqual(index.airportLines, ["907"]);
  });

  test("2. linka obsluhující Terminál 2 (node:629) se rozpozná jako letištní", () => {
    const routes = [route("R910", "910")];
    const trips: GtfsTrip[] = [{ trip_id: "T1", route_id: "R910", service_id: "SVC1", trip_headsign: "Letiště / Airport ✈", direction_id: "1" }];
    const stops = [stop("U629Z3P", "Terminál 2", 50.1, 14.26, { asw_node_id: "629" }), stop("DUMMY", "Jinde", 50.2, 14.3)];
    const stopTimes: GtfsStopTimeWithDeparture[] = [
      { trip_id: "T1", stop_id: "U629Z3P", stop_sequence: "1", departure_time: "24:20:00" },
      { trip_id: "T1", stop_id: "DUMMY", stop_sequence: "2", departure_time: "24:40:00" },
    ];
    const { index } = buildNightDataset(routes, trips, stops, stopTimes, [CALENDAR], [], META);
    assert.deepEqual(index.airportLines, ["910"]);
  });

  test("5. linka s textem podobným letišti (v headsignu), která žádnou letištní zastávku neobsluhuje, se NESMÍ označit", () => {
    const routes = [route("R999", "999")];
    // Headsign zavádějícně zmiňuje "Letiště", ale spoj reálně zastavuje jen na nesouvisející zastávce.
    const trips: GtfsTrip[] = [{ trip_id: "T1", route_id: "R999", service_id: "SVC1", trip_headsign: "Expres na Letiště (fiktivní)", direction_id: "0" }];
    const stops = [stop("S1", "Nádraží Podskalí", 50.1, 14.26, { asw_node_id: "5000" }), stop("DUMMY", "Jinde", 50.2, 14.3)];
    const stopTimes: GtfsStopTimeWithDeparture[] = [
      { trip_id: "T1", stop_id: "S1", stop_sequence: "1", departure_time: "24:20:00" },
      { trip_id: "T1", stop_id: "DUMMY", stop_sequence: "2", departure_time: "24:40:00" },
    ];
    const { index } = buildNightDataset(routes, trips, stops, stopTimes, [CALENDAR], [], META);
    assert.deepEqual(index.airportLines, []);
    assert.ok(index.lines.some((l) => l.shortName === "999")); // linka samotná v datasetu je, jen není označená jako letištní
  });

  test("6. náhradní výluková linka (is_substitute_transport=1) obsluhující Terminál 1 zůstává vyloučená (existující logika)", () => {
    const routes = [route("RX907", "X907", { is_substitute_transport: "1" })];
    const trips: GtfsTrip[] = [{ trip_id: "T1", route_id: "RX907", service_id: "SVC1", trip_headsign: "Náhradní doprava", direction_id: "0" }];
    const stops = [stop("U628Z1P", "Terminál 1", 50.1, 14.26, { asw_node_id: "628" }), stop("DUMMY", "Jinde", 50.2, 14.3)];
    const stopTimes: GtfsStopTimeWithDeparture[] = [
      { trip_id: "T1", stop_id: "U628Z1P", stop_sequence: "1", departure_time: "24:20:00" },
      { trip_id: "T1", stop_id: "DUMMY", stop_sequence: "2", departure_time: "24:40:00" },
    ];
    const { index } = buildNightDataset(routes, trips, stops, stopTimes, [CALENDAR], [], META);
    assert.deepEqual(index.airportLines, []);
    assert.equal(index.lines.length, 0); // výluková linka se do datasetu vůbec nedostane
  });
});
