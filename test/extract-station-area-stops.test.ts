import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { decideAreaStopsWrite, extractStationAreaStops, selectAreaStopIds, stationIdToNodeId } from "../lib/gtfs/extract-station-area-stops.ts";
import type { GtfsRoute, GtfsStop, GtfsTrip } from "../lib/gtfs/types.ts";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { streamCsvColumns } from "../lib/gtfs/stream-filter-csv.ts";

function stop(id: string, code: string, extra: Partial<GtfsStop> = {}): GtfsStop {
  return { stop_id: id, stop_name: "Zličín", stop_lat: "50.05", stop_lon: "14.29", location_type: "0", parent_station: "", wheelchair_boarding: "0", asw_node_id: "1141", platform_code: code, ...extra };
}

const routes: GtfsRoute[] = [
  { route_id: "L100", route_short_name: "100", route_type: "3" },
  { route_id: "L304", route_short_name: "304", route_type: "3" },
  { route_id: "L22", route_short_name: "22", route_type: "0" },
  { route_id: "LB", route_short_name: "B", route_type: "1" },
];
const trips: GtfsTrip[] = [
  { trip_id: "t100", route_id: "L100", service_id: "s", trip_headsign: "Letiště", direction_id: "0" },
  { trip_id: "t100back", route_id: "L100", service_id: "s", trip_headsign: "Zličín", direction_id: "1" },
  { trip_id: "t304", route_id: "L304", service_id: "s", trip_headsign: "x", direction_id: "0" },
  { trip_id: "t22", route_id: "L22", service_id: "s", trip_headsign: "x", direction_id: "0" },
];

describe("stationIdToNodeId", () => {
  test("U1141S1 -> 1141, nesmysl -> null", () => {
    assert.equal(stationIdToNodeId("U1141S1"), "1141");
    assert.equal(stationIdToNodeId("foo"), null);
  });
});

describe("selectAreaStopIds", () => {
  test("bere jen povrchová nástupiště daného uzlu (bez parent_station)", () => {
    const stops = [stop("U1141Z5P", "4"), stop("U1141Z101P", "1", { parent_station: "U1141S1" }), stop("U9Z1P", "A", { asw_node_id: "9" })];
    assert.deepEqual([...selectAreaStopIds(stops, new Set(["1141"]))], ["U1141Z5P"]);
  });
});

describe("extractStationAreaStops", () => {
  const stops = [stop("U1141Z5P", "4"), stop("U1141Z5", "4"), stop("U1141Z1P", "V", { stop_lat: "50.054", stop_lon: "14.290" }), stop("U1141Z9P", "9")];
  const lastSequenceByTrip = new Map([
    ["t100", 10],
    ["t100back", 10],
    ["t304", 10],
    ["t22", 10],
  ]);

  test("slučuje stop_id stejného stanoviště, vynechá výstupní zastavení, konečnou a stanoviště bez odjezdů", () => {
    const result = extractStationAreaStops(
      ["U1141S1"],
      stops,
      routes,
      trips,
      [
        { trip_id: "t100", stop_id: "U1141Z5P", stop_sequence: "1", pickup_type: "0" },
        { trip_id: "t304", stop_id: "U1141Z5", stop_sequence: "3", pickup_type: "0" },
        // Linka 100 jen končí na stanovišti V (poslední zastávka) — nesmí se počítat.
        { trip_id: "t100back", stop_id: "U1141Z1P", stop_sequence: "10", pickup_type: "0" },
        // Výstupní zastavení — nesmí se počítat.
        { trip_id: "t22", stop_id: "U1141Z1P", stop_sequence: "2", pickup_type: "1" },
      ],
      lastSequenceByTrip
    );

    assert.deepEqual(result.U1141S1, [
      {
        code: "4",
        name: "Zličín",
        lat: 50.05,
        lon: 14.29,
        routes: [
          { name: "100", mode: "bus" },
          { name: "304", mode: "bus" },
        ],
      },
    ]);
  });

  test("stanice bez povrchových stanovišť dostane prázdné pole", () => {
    const result = extractStationAreaStops(["U1S1"], stops, routes, trips, [], lastSequenceByTrip);
    assert.deepEqual(result.U1S1, []);
  });
});

describe("extractStationAreaStops — neúplná data a duplicity", () => {
  const lastSequenceByTrip = new Map([
    ["t100", 10],
    ["t100back", 10],
  ]);

  test("stejný kód stanoviště s jinými souřadnicemi se nezdvojí (kód je HTML kotva), souřadnice z prvního záznamu", () => {
    const stops = [stop("U1141Z5P", "4", { stop_lat: "50.0548", stop_lon: "14.2907" }), stop("U1141Z5", "4", { stop_lat: "50.0549", stop_lon: "14.2908" })];
    const result = extractStationAreaStops(
      ["U1141S1"],
      stops,
      routes,
      trips,
      [
        { trip_id: "t100", stop_id: "U1141Z5P", stop_sequence: "1", pickup_type: "0" },
        { trip_id: "t100back", stop_id: "U1141Z5", stop_sequence: "1", pickup_type: "0" },
      ],
      lastSequenceByTrip
    );
    assert.equal(result.U1141S1.length, 1);
    assert.equal(result.U1141S1[0].lat, 50.0548);
    assert.deepEqual(result.U1141S1[0].routes, [{ name: "100", mode: "bus" }]);
  });

  test("jedna linka smí odjíždět z více stanovišť (různé směry)", () => {
    const stops = [stop("U1141Z5P", "4"), stop("U1141Z1P", "V", { stop_lat: "50.054" })];
    const result = extractStationAreaStops(
      ["U1141S1"],
      stops,
      routes,
      trips,
      [
        { trip_id: "t100", stop_id: "U1141Z5P", stop_sequence: "1", pickup_type: "0" },
        { trip_id: "t100back", stop_id: "U1141Z1P", stop_sequence: "2", pickup_type: "" },
      ],
      lastSequenceByTrip
    );
    assert.deepEqual(
      result.U1141S1.map((p) => [p.code, p.routes.map((r) => r.name)]),
      [
        ["4", ["100"]],
        ["V", ["100"]],
      ]
    );
  });

  test("chybějící platform_code, neplatné souřadnice, neznámý spoj nebo linka se tiše přeskočí", () => {
    const stops = [stop("A", ""), stop("B", "7", { stop_lat: "" }), stop("C", "8"), stop("D", "9", { asw_node_id: undefined })];
    const result = extractStationAreaStops(
      ["U1141S1"],
      stops,
      routes,
      trips,
      [
        { trip_id: "t100", stop_id: "A", stop_sequence: "1", pickup_type: "0" },
        { trip_id: "t100", stop_id: "B", stop_sequence: "1", pickup_type: "0" },
        { trip_id: "neznamy", stop_id: "C", stop_sequence: "1", pickup_type: "0" },
        { trip_id: "t100", stop_id: "D", stop_sequence: "1", pickup_type: "0" },
      ],
      lastSequenceByTrip
    );
    assert.deepEqual(result.U1141S1, []);
  });

  test("výstup je deterministický (opakovaný běh = stejná data)", () => {
    const stops = [stop("U1141Z5P", "4"), stop("U1141Z1P", "V", { stop_lat: "50.054" })];
    const rows = [
      { trip_id: "t100back", stop_id: "U1141Z1P", stop_sequence: "2", pickup_type: "0" },
      { trip_id: "t100", stop_id: "U1141Z5P", stop_sequence: "1", pickup_type: "0" },
    ];
    const a = extractStationAreaStops(["U1141S1"], stops, routes, trips, rows, lastSequenceByTrip);
    const b = extractStationAreaStops(["U1141S1"], stops, routes, trips, [...rows].reverse(), lastSequenceByTrip);
    assert.deepEqual(a, b);
  });
});

describe("decideAreaStopsWrite — nikdy nepřepsat platná data prázdným výsledkem", () => {
  const platform = { code: "4", name: "Zličín", lat: 50, lon: 14, routes: [{ name: "100", mode: "bus" as const }] };

  test("prázdný výsledek se nezapíše", () => {
    assert.equal(decideAreaStopsWrite(null, { S1: [] }).write, false);
    assert.equal(decideAreaStopsWrite({ S1: [platform] }, { S1: [] }).write, false);
  });

  test("stanice, která přišla o všechna stanoviště, zablokuje zápis", () => {
    const decision = decideAreaStopsWrite({ S1: [platform], S2: [platform] }, { S1: [platform], S2: [] });
    assert.equal(decision.write, false);
  });

  test("běžná aktualizace a první import se zapíšou", () => {
    assert.equal(decideAreaStopsWrite({ S1: [platform] }, { S1: [platform, { ...platform, code: "5" }] }).write, true);
    assert.equal(decideAreaStopsWrite(null, { S1: [platform] }).write, true);
  });
});

describe("streamCsvColumns — volitelné sloupce", () => {
  test("chybějící volitelný sloupec vrací prázdný řetězec, chybějící povinný vyhodí chybu", async () => {
    const dir = mkdtempSync(join(tmpdir(), "csv-optional-"));
    const file = join(dir, "stop_times.txt");
    writeFileSync(file, "trip_id,stop_id\nt1,s1\n");
    try {
      const rows: Record<string, string>[] = [];
      await streamCsvColumns(file, ["trip_id", "stop_id", "pickup_type"] as const, (row) => rows.push(row), ["pickup_type"]);
      assert.deepEqual(rows, [{ trip_id: "t1", stop_id: "s1", pickup_type: "" }]);
      await assert.rejects(streamCsvColumns(file, ["trip_id", "pickup_type"] as const, () => {}));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
