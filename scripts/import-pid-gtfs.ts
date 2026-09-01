// Import skript: stáhne oficiální PID GTFS feed, vytáhne jen potřebné
// CSV soubory a vygeneruje verzované statické JSONy pro appku
// (data/metro-entrances.json, data/metro-line-order.json) a kompaktní
// staticky servírovaná data odjezdů (public/data/departures/*.json,
// jeden soubor na stanici). Spouští se ručně (`npm run data:refresh`),
// NENÍ součástí `next build` — appka za běhu žádné GTFS/zip/CSV nezná,
// jen hotové JSONy (viz zadání "bez backendu za běhu").
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseCsv } from "../lib/gtfs/parse-csv.ts";
import { streamCsvColumns } from "../lib/gtfs/stream-filter-csv.ts";
import { extractMetroEntrances, countUniqueStations } from "../lib/gtfs/extract-metro-entrances.ts";
import { deriveLineOrder, type GtfsStopTimeWithSequence } from "../lib/gtfs/derive-line-order.ts";
import { buildDepartures } from "../lib/gtfs/build-departures.ts";
import { findMissingStationCoverage } from "../lib/gtfs/validate-departures-coverage.ts";
import type { GtfsCalendar, GtfsCalendarDate, GtfsRoute, GtfsStop, GtfsStopTimeWithDeparture, GtfsTrip } from "../lib/gtfs/types.ts";
import { METRO_LINES } from "../lib/metro/types.ts";

const GTFS_ZIP_URL = "https://data.pid.cz/PID_GTFS.zip";
const MIN_STATIONS = 50;
const MIN_ENTRANCES = 200;
/** Bezpečný podmnožinový vzor pro stationId použité jako název souboru (viz zadání "kontrolovaná chyba importu"). */
const SAFE_STATION_ID = /^[A-Za-z0-9_-]+$/;

const NEEDED_FILES = ["routes.txt", "trips.txt", "stops.txt", "stop_times.txt", "calendar.txt", "calendar_dates.txt"] as const;

function fail(message: string): never {
  console.error(`✖ ${message}`);
  process.exit(1);
}

async function downloadZip(destPath: string): Promise<void> {
  console.log(`Stahuji ${GTFS_ZIP_URL} …`);
  const response = await fetch(GTFS_ZIP_URL);
  if (!response.ok || !response.body) {
    fail(`Stažení GTFS feedu selhalo (HTTP ${response.status}).`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  writeFileSync(destPath, buffer);
  console.log(`Staženo (${(buffer.byteLength / 1024 / 1024).toFixed(1)} MB).`);
}

function extractNeededFiles(zipPath: string, outDir: string): void {
  try {
    execFileSync("unzip", ["-o", "-q", zipPath, ...NEEDED_FILES, "-d", outDir], { stdio: "inherit" });
  } catch (error) {
    fail(`Rozbalení GTFS ZIPu selhalo — je nainstalovaný příkaz "unzip"? (${(error as Error).message})`);
  }
}

async function main() {
  const tmpDir = mkdtempSync(join(tmpdir(), "prahametro-gtfs-"));
  const zipPath = join(tmpDir, "PID_GTFS.zip");

  try {
    await downloadZip(zipPath);
    extractNeededFiles(zipPath, tmpDir);

    console.log("Parsuji routes.txt, trips.txt, stops.txt, calendar.txt, calendar_dates.txt …");
    const routes = parseCsv(readFileSync(join(tmpDir, "routes.txt"), "utf-8")) as unknown as GtfsRoute[];
    const trips = parseCsv(readFileSync(join(tmpDir, "trips.txt"), "utf-8")) as unknown as GtfsTrip[];
    const stops = parseCsv(readFileSync(join(tmpDir, "stops.txt"), "utf-8")) as unknown as GtfsStop[];
    const calendars = parseCsv(readFileSync(join(tmpDir, "calendar.txt"), "utf-8")) as unknown as GtfsCalendar[];
    const calendarDates = parseCsv(readFileSync(join(tmpDir, "calendar_dates.txt"), "utf-8")) as unknown as GtfsCalendarDate[];

    if (routes.length === 0 || trips.length === 0 || stops.length === 0) {
      fail("routes.txt/trips.txt/stops.txt se nepodařilo naparsovat (prázdný výsledek).");
    }
    if (calendars.length === 0) {
      fail("calendar.txt se nepodařilo naparsovat (prázdný výsledek) — bez něj nejde spolehlivě určit provozní dny odjezdů.");
    }

    const metroRouteIds = new Set(routes.filter((r) => r.route_type === "1").map((r) => r.route_id));
    const metroTripIds = new Set(trips.filter((t) => metroRouteIds.has(t.route_id)).map((t) => t.trip_id));

    if (metroTripIds.size === 0) {
      fail("V GTFS feedu nebyl nalezen žádný spoj s route_type=1 (metro) — feed může mít jiný formát.");
    }

    // Jeden průchod stop_times.txt (přes 100 MB) pro VŠECHNY potřeby
    // najednou (pořadí stanic i odjezdy) — dva samostatné streamy by
    // soubor četly zbytečně dvakrát.
    console.log(`Streamuji stop_times.txt (metro spojů: ${metroTripIds.size}) …`);
    const metroStopTimes: (GtfsStopTimeWithSequence & GtfsStopTimeWithDeparture)[] = [];
    let totalRows = 0;

    await streamCsvColumns(
      join(tmpDir, "stop_times.txt"),
      ["trip_id", "stop_id", "stop_sequence", "departure_time"] as const,
      (row) => {
        totalRows++;
        if (metroTripIds.has(row.trip_id)) {
          metroStopTimes.push(row);
        }
      }
    );

    console.log(`Projito ${totalRows.toLocaleString("cs-CZ")} řádků stop_times.txt, z toho metro: ${metroStopTimes.length.toLocaleString("cs-CZ")}.`);

    const entrances = extractMetroEntrances(routes, trips, stops, metroStopTimes);
    const stationCount = countUniqueStations(entrances);

    console.log(`Nalezeno stanic: ${stationCount}, vstupů: ${entrances.length}.`);

    if (stationCount < MIN_STATIONS || entrances.length < MIN_ENTRANCES) {
      fail(
        `Nápadně málo dat (stanic=${stationCount}, vstupů=${entrances.length}, ` +
          `očekáváno aspoň ${MIN_STATIONS}/${MIN_ENTRANCES}) — import se PŘERUŠIL, ať se omylem nenasadí prázdná/změněná data.`
      );
    }

    const generatedAt = new Date().toISOString();

    const dataset = {
      generatedAt,
      source: GTFS_ZIP_URL,
      stationCount,
      entranceCount: entrances.length,
      entrances,
    };

    const dataDir = join(import.meta.dirname, "..", "data");
    writeFileSync(join(dataDir, "metro-entrances.json"), JSON.stringify(dataset, null, 2) + "\n", "utf-8");
    console.log(`Zapsáno data/metro-entrances.json.`);

    const lineOrderStationIds = deriveLineOrder(routes, trips, stops, metroStopTimes);
    const stationNameById = new Map(stops.map((s) => [s.stop_id, s.stop_name] as const));

    const lineOrder = Object.fromEntries(
      METRO_LINES.map((line) => [
        line,
        lineOrderStationIds[line].map((stationId) => ({
          stationId,
          stationName: stationNameById.get(stationId) ?? stationId,
        })),
      ])
    );

    for (const line of METRO_LINES) {
      console.log(`Linka ${line}: ${lineOrder[line].length} stanic v pořadí.`);
    }

    writeFileSync(join(dataDir, "metro-line-order.json"), JSON.stringify({ generatedAt, lines: lineOrder }, null, 2) + "\n", "utf-8");
    console.log(`Zapsáno data/metro-line-order.json.`);

    // --- Odjezdy (viz zadání "nenápadné zobrazení odjezdů") ---
    console.log("Sestavuji odjezdy pro jednotlivé stanice …");
    const departuresFiles = buildDepartures(routes, trips, stops, metroStopTimes, calendars, calendarDates, {
      generatedAt,
      source: GTFS_ZIP_URL,
    });

    // Validace vazby appka <-> GTFS (viz zadání bod 5 — "neplatné nebo
    // chybějící vazby způsobí kontrolovanou chybu importu, nikoliv
    // tiché zobrazení cizích odjezdů"). appStationIds pochází přímo z
    // právě vygenerovaných entrances, ne z předpokladu — takže obě
    // datové sady jsou zaručeně navázané na STEJNÝ zdroj pravdy.
    const appStationIds = new Set(entrances.map((e) => e.stationId));
    const missingStations = findMissingStationCoverage(appStationIds, new Set(departuresFiles.keys()));

    if (missingStations.length > 0) {
      const names = missingStations.map((id) => `${id} (${stationNameById.get(id) ?? "neznámý název"})`).join(", ");
      fail(`${missingStations.length} stanic appky nemá v GTFS žádné naplánované odjezdy metra — import se PŘERUŠIL: ${names}`);
    }

    for (const stationId of departuresFiles.keys()) {
      if (!SAFE_STATION_ID.test(stationId)) {
        fail(`stationId "${stationId}" obsahuje znaky nevhodné pro název souboru — import se PŘERUŠIL.`);
      }
    }

    const departuresDir = join(import.meta.dirname, "..", "public", "data", "departures");
    rmSync(departuresDir, { recursive: true, force: true });
    mkdirSync(departuresDir, { recursive: true });

    let totalDepartureRows = 0;
    let totalBytes = 0;
    for (const [stationId, file] of departuresFiles) {
      const json = JSON.stringify(file);
      writeFileSync(join(departuresDir, `${stationId}.json`), json, "utf-8");
      totalBytes += Buffer.byteLength(json, "utf-8");
      totalDepartureRows += file.lines.reduce((sum, l) => sum + l.directions.reduce((s2, d) => s2 + d.departures.length, 0), 0);
    }

    console.log(
      `Zapsáno ${departuresFiles.size} souborů odjezdů do public/data/departures/ ` +
        `(celkem ${totalDepartureRows.toLocaleString("cs-CZ")} odjezdů, ${(totalBytes / 1024).toFixed(0)} kB, ` +
        `průměr ${(totalBytes / departuresFiles.size / 1024).toFixed(1)} kB/stanice).`
    );
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
