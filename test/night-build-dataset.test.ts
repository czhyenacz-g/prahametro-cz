import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { buildNightDataset } from "../lib/night-transport/build-night-dataset.ts";
import type { GtfsCalendar, GtfsRoute, GtfsStop, GtfsStopTimeWithDeparture, GtfsTrip } from "../lib/gtfs/types.ts";

const META = { generatedAt: "2026-09-02T10:00:00.000Z", source: "https://data.pid.cz/PID_GTFS.zip", feedStartDate: "20260902", feedEndDate: "20260915" };

function route(id: string, shortName: string, type: "0" | "3", extra: Partial<GtfsRoute> = {}): GtfsRoute {
  return { route_id: id, route_short_name: shortName, route_type: type, is_night: "1", is_regional: "0", is_substitute_transport: "0", route_color: "", route_text_color: "", ...extra };
}

function stop(id: string, name: string, lat: number, lon: number, extra: Partial<GtfsStop> = {}): GtfsStop {
  return { stop_id: id, stop_name: name, stop_lat: String(lat), stop_lon: String(lon), location_type: "0", parent_station: "", wheelchair_boarding: "0", asw_node_id: "", platform_code: "", ...extra };
}

const CALENDAR: GtfsCalendar = { service_id: "SVC1", monday: "1", tuesday: "1", wednesday: "1", thursday: "1", friday: "1", saturday: "0", sunday: "0", start_date: "20260901", end_date: "20260930" };

describe("buildNightDataset — seskupení zastávek a přehled linek", () => {
  const routes = [route("R91", "91", "0"), route("R901", "901", "3")];

  const trips: GtfsTrip[] = [
    { trip_id: "T1", route_id: "R91", service_id: "SVC1", trip_headsign: "Divoká Šárka", direction_id: "0" },
    { trip_id: "T2", route_id: "R91", service_id: "SVC1", trip_headsign: "Spořilov", direction_id: "1" },
    { trip_id: "T2B", route_id: "R91", service_id: "SVC1", trip_headsign: "Spořilov", direction_id: "1" },
    { trip_id: "T3", route_id: "R901", service_id: "SVC1", trip_headsign: "Anděl", direction_id: "0" },
  ];

  const stops = [
    // "Lazarská" — dvě nástupiště, žádné parent_station, sdílené asw_node_id (test 6).
    stop("L1", "Lazarská", 50.0792, 14.4199, { asw_node_id: "997" }),
    stop("L2", "Lazarská", 50.0791, 14.4210, { asw_node_id: "997" }),
    // "Náměstí Míru" — jedno nástupiště s parent_station.
    stop("M1", "Náměstí Míru", 50.0755, 14.4363, { parent_station: "P1" }),
    // JINÁ, fyzicky odlišná zastávka se STEJNÝM jménem "Lazarská" (test 7 — neslučovat podle jména).
    stop("L3", "Lazarská", 50.5, 14.9, { asw_node_id: "555" }),
    stop("DUMMY", "Koncová", 50.1, 14.5),
  ];

  const stopTimes: GtfsStopTimeWithDeparture[] = [
    { trip_id: "T1", stop_id: "L1", stop_sequence: "1", departure_time: "23:47:00" },
    { trip_id: "T1", stop_id: "M1", stop_sequence: "2", departure_time: "23:52:00" }, // poslední zastávka T1 = jen příjezd
    { trip_id: "T2", stop_id: "M1", stop_sequence: "1", departure_time: "00:05:00" },
    { trip_id: "T2", stop_id: "DUMMY", stop_sequence: "2", departure_time: "00:10:00" }, // poslední zastávka T2 = jen příjezd
    { trip_id: "T2B", stop_id: "L2", stop_sequence: "1", departure_time: "00:12:00" }, // L2 má VLASTNÍ, skutečný odjezd (ne jen příjezd)
    { trip_id: "T2B", stop_id: "DUMMY", stop_sequence: "2", departure_time: "00:18:00" },
    { trip_id: "T3", stop_id: "L3", stop_sequence: "1", departure_time: "23:58:00" },
    { trip_id: "T3", stop_id: "DUMMY", stop_sequence: "2", departure_time: "00:20:00" }, // poslední zastávka T3 = jen příjezd
  ];

  const { index, stopDetails, warnings } = buildNightDataset(routes, trips, stops, stopTimes, [CALENDAR], [], META);

  test("6. dvě nástupiště 'Lazarská' (L1, L2) se seskupí do JEDNÉ zastávkové skupiny podle asw_node_id", () => {
    const lazarska = index.stopGroups.find((g) => g.id === "node:997");
    assert.ok(lazarska, "skupina node:997 nenalezena");
    const detail = stopDetails.get("node:997")!;
    assert.deepEqual(detail.platforms.map((p) => p.id).sort(), ["L1", "L2"]);
  });

  test("7. jinou, fyzicky odlišnou zastávku se stejným jménem 'Lazarská' (L3) NESLOUČÍ do stejné skupiny", () => {
    const groupIds = index.stopGroups.filter((g) => g.name === "Lazarská").map((g) => g.id);
    assert.equal(groupIds.length, 2);
    assert.ok(groupIds.includes("node:997"));
    assert.ok(groupIds.includes("node:555"));
  });

  test("Náměstí Míru se seskupí podle parent_station", () => {
    const detail = stopDetails.get("parent:P1");
    assert.ok(detail);
    assert.deepEqual(detail!.platforms.map((p) => p.id), ["M1"]);
  });

  test("linka 91 má oba směry se skutečnými cílovými stanicemi (destinations)", () => {
    const line91 = index.lines.find((l) => l.shortName === "91");
    assert.ok(line91);
    assert.deepEqual(line91!.destinations.sort(), ["Divoká Šárka", "Spořilov"]);
    assert.equal(line91!.hasRouteVariants, false); // přesně 2 headsigny (jeden na směr) = normální stav
  });

  test("reprezentativní souřadnice skupiny jsou souřadnice SKUTEČNÉHO nástupiště, ne syntetický střed", () => {
    const lazarskaGroup = index.stopGroups.find((g) => g.id === "node:997")!;
    const realPlatformCoords = [
      [50.0792, 14.4199],
      [50.0791, 14.421],
    ];
    assert.ok(realPlatformCoords.some(([lat, lon]) => lat === lazarskaGroup.lat && lon === lazarskaGroup.lon));
  });

  test("poslední zastávka spoje (jen příjezd) se nezapočítá jako odjezd", () => {
    // M1 je poslední zastávka T1 (příjezd) — pokud by se počítala, měla by M1 odjezd i z linky 91 směr 0, ne jen díky T2.
    const m1 = stopDetails.get("parent:P1")!;
    const line91AtM1 = m1.routes.find((r) => r.shortName === "91");
    assert.equal(line91AtM1!.directions.length, 1); // jen směr 1 (přes T2), ne oba
  });

  test("žádná systematicky chybějící data → žádná varování", () => {
    assert.deepEqual(warnings, []);
  });
});

describe("buildNightDataset — letištní linky se odvozují z GTFS, ne natvrdo", () => {
  test("stop_name obsahující 'Letiště' → linka se objeví v airportLines", () => {
    const routes = [route("R907", "907", "3")];
    const trips: GtfsTrip[] = [{ trip_id: "T1", route_id: "R907", service_id: "SVC1", trip_headsign: "Terminál 1", direction_id: "0" }];
    const stops = [stop("AIRPORT1", "Letiště", 50.1, 14.26, { asw_node_id: "1" }), stop("DUMMY", "Jinde", 50.2, 14.3)];
    const stopTimes: GtfsStopTimeWithDeparture[] = [
      { trip_id: "T1", stop_id: "AIRPORT1", stop_sequence: "1", departure_time: "00:20:00" },
      { trip_id: "T1", stop_id: "DUMMY", stop_sequence: "2", departure_time: "00:40:00" },
    ];
    const { index } = buildNightDataset(routes, trips, stops, stopTimes, [CALENDAR], [], META);
    assert.deepEqual(index.airportLines, ["907"]);
  });

  test("skloňovaný tvar 'K Letišti' (ne jen nominativ 'Letiště') se taky rozpozná jako letištní zastávka", () => {
    const routes = [route("R910", "910", "3")];
    const trips: GtfsTrip[] = [{ trip_id: "T1", route_id: "R910", service_id: "SVC1", trip_headsign: "Na Beránku", direction_id: "0" }];
    const stops = [stop("AIRPORT2", "K Letišti", 50.1, 14.26, { asw_node_id: "1" }), stop("DUMMY", "Jinde", 50.2, 14.3)];
    const stopTimes: GtfsStopTimeWithDeparture[] = [
      { trip_id: "T1", stop_id: "AIRPORT2", stop_sequence: "1", departure_time: "00:20:00" },
      { trip_id: "T1", stop_id: "DUMMY", stop_sequence: "2", departure_time: "00:40:00" },
    ];
    const { index } = buildNightDataset(routes, trips, stops, stopTimes, [CALENDAR], [], META);
    assert.deepEqual(index.airportLines, ["910"]);
  });

  test("28. žádná zastávka s 'Letiště' v názvu → airportLines je prázdné pole, ne vymyšlená hodnota", () => {
    const routes = [route("R91", "91", "0")];
    const trips: GtfsTrip[] = [{ trip_id: "T1", route_id: "R91", service_id: "SVC1", trip_headsign: "Cíl", direction_id: "0" }];
    const stops = [stop("S1", "Nádraží Holešovice", 50.1, 14.26, { asw_node_id: "1" }), stop("DUMMY", "Jinde", 50.2, 14.3)];
    const stopTimes: GtfsStopTimeWithDeparture[] = [
      { trip_id: "T1", stop_id: "S1", stop_sequence: "1", departure_time: "00:20:00" },
      { trip_id: "T1", stop_id: "DUMMY", stop_sequence: "2", departure_time: "00:40:00" },
    ];
    const { index } = buildNightDataset(routes, trips, stops, stopTimes, [CALENDAR], [], META);
    assert.deepEqual(index.airportLines, []);
  });
});

describe("buildNightDataset — chybějící souřadnice vyvolá varování, ne pád importu", () => {
  test("stop bez platných souřadnic se přeskočí a nahlásí", () => {
    const routes = [route("R91", "91", "0")];
    const trips: GtfsTrip[] = [{ trip_id: "T1", route_id: "R91", service_id: "SVC1", trip_headsign: "Cíl", direction_id: "0" }];
    const stops = [stop("BAD", "Bez souřadnic", NaN, NaN, { asw_node_id: "1" }), stop("DUMMY", "Jinde", 50.2, 14.3)];
    const stopTimes: GtfsStopTimeWithDeparture[] = [
      { trip_id: "T1", stop_id: "BAD", stop_sequence: "1", departure_time: "00:20:00" },
      { trip_id: "T1", stop_id: "DUMMY", stop_sequence: "2", departure_time: "00:40:00" },
    ];
    const { index, warnings } = buildNightDataset(routes, trips, stops, stopTimes, [CALENDAR], [], META);
    assert.equal(index.stopGroups.length, 0); // jediný reálný odjezd (BAD) měl neplatné souřadnice
    assert.deepEqual(
      warnings.filter((w) => w.kind === "missing-coordinates"),
      [{ kind: "missing-coordinates", stopId: "BAD" }]
    );
  });
});
