// Import skript: stáhne oficiální PID GTFS feed, vytáhne jen potřebné
// CSV soubory a vygeneruje verzované statické JSONy pro appku
// (data/metro-entrances.json, data/metro-line-order.json) a kompaktní
// staticky servírovaná data odjezdů (public/data/departures/*.json,
// jeden soubor na stanici). Spouští se ručně (`npm run data:refresh`),
// NENÍ součástí `next build` — appka za běhu žádné GTFS/zip/CSV nezná,
// jen hotové JSONy (viz zadání "bez backendu za běhu").
import { execFileSync } from "node:child_process";
import { gzipSync } from "node:zlib";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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
import { getNightCandidateTripIds } from "../lib/night-transport/night-routes.ts";
import { buildNightDataset } from "../lib/night-transport/build-night-dataset.ts";
import { groupIdToFileName } from "../lib/night-transport/stop-groups.ts";
import { buildAirportRouteReport } from "../lib/night-transport/airport-stops.ts";
import { decideAreaStopsWrite, extractStationAreaStops, selectAreaStopIds, stationIdToNodeId, type GtfsAreaStopTime } from "../lib/gtfs/extract-station-area-stops.ts";
import type { StationAreaStopsDataset } from "../lib/stations/area-stops-types.ts";
import { STATION_GUIDES } from "../lib/stations/guides.ts";

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

    // Předfiltr nočních "kandidátů" (jen z routes.txt/trips.txt, bez
    // stop_times) — viz lib/night-transport/night-routes.ts. Ověření,
    // že kandidát má SKUTEČNÝ noční spoj, proběhne až po streamu níž
    // (buildNightDataset), stejně jako klasifikace metra.
    const nightCandidateTripIds = getNightCandidateTripIds(routes, trips);

    // Povrchová stanoviště u stanic s průvodcem (/stanice/*) — jen stop_id
    // se stejným PID uzlem jako stanice metra, viz
    // lib/gtfs/extract-station-area-stops.ts. Poslední zastávka každého
    // spoje se sleduje pro VŠECHNY spoje (levná mapa trip -> číslo), aby
    // šlo poznat stanoviště, kde linka jen končí.
    const guideStationIds = STATION_GUIDES.map((g) => g.stationId);
    const guideNodeIds = new Set(guideStationIds.map(stationIdToNodeId).filter((id): id is string => id !== null));
    const areaStopIds = selectAreaStopIds(stops, guideNodeIds);
    const areaStopTimes: GtfsAreaStopTime[] = [];
    const lastSequenceByTrip = new Map<string, number>();

    // Jeden průchod stop_times.txt (přes 100 MB) pro VŠECHNY potřeby
    // najednou (pořadí stanic i odjezdy metra, i noční doprava) — další
    // samostatný stream by soubor četl zbytečně znovu (viz zadání bod 6
    // "jeden průchod").
    console.log(`Streamuji stop_times.txt (metro spojů: ${metroTripIds.size}, noční kandidáti: ${nightCandidateTripIds.size}) …`);
    const metroStopTimes: (GtfsStopTimeWithSequence & GtfsStopTimeWithDeparture)[] = [];
    const nightStopTimes: GtfsStopTimeWithDeparture[] = [];
    let totalRows = 0;

    await streamCsvColumns(
      join(tmpDir, "stop_times.txt"),
      ["trip_id", "stop_id", "stop_sequence", "departure_time", "pickup_type"] as const,
      (row) => {
        totalRows++;
        const sequence = Number(row.stop_sequence);
        if (sequence > (lastSequenceByTrip.get(row.trip_id) ?? -1)) {
          lastSequenceByTrip.set(row.trip_id, sequence);
        }
        if (areaStopIds.has(row.stop_id)) {
          areaStopTimes.push(row);
        }
        if (metroTripIds.has(row.trip_id)) {
          metroStopTimes.push(row);
        }
        if (nightCandidateTripIds.has(row.trip_id)) {
          nightStopTimes.push(row);
        }
      },
      // Jen pro stanoviště průvodců — když ho feed nemá, metro i noční doprava běží dál beze změny.
      ["pickup_type"]
    );

    console.log(
      `Projito ${totalRows.toLocaleString("cs-CZ")} řádků stop_times.txt, z toho metro: ${metroStopTimes.length.toLocaleString("cs-CZ")}, noční kandidáti: ${nightStopTimes.length.toLocaleString("cs-CZ")}.`
    );

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

    // --- Povrchová stanoviště u stanic s průvodcem (/stanice/*) ---
    // Doplňková data: jakákoli chyba nebo podezřelý výsledek jen zaloguje
    // varování a ponechá předchozí data/station-area-stops.json — import
    // metra a noční dopravy kvůli tomu NIKDY nespadne (viz
    // decideAreaStopsWrite).
    writeStationAreaStops(dataDir, guideStationIds, () => extractStationAreaStops(guideStationIds, stops, routes, trips, areaStopTimes, lastSequenceByTrip), generatedAt, stationNameById);

    // --- Noční doprava (viz zadání "vytvoř samostatnou funkční sekci
    // pro noční veřejnou dopravu") — STEJNÉ syrové GTFS tabulky, žádný
    // další soubor, žádný druhý běh importu. ---
    console.log("Sestavuji noční dopravu (tramvaje/autobusy) …");

    const feedStartDate = calendars.reduce((min, c) => (c.start_date < min ? c.start_date : min), calendars[0].start_date);
    const feedEndDate = calendars.reduce((max, c) => (c.end_date > max ? c.end_date : max), calendars[0].end_date);

    const { index: nightIndex, stopDetails: nightStopDetails, warnings: nightWarnings } = buildNightDataset(
      routes,
      trips,
      stops,
      nightStopTimes,
      calendars,
      calendarDates,
      { generatedAt, source: GTFS_ZIP_URL, feedStartDate, feedEndDate }
    );

    if (nightWarnings.length > 0) {
      console.log(`Noční doprava — ${nightWarnings.length} varování:`);
      for (const warning of nightWarnings) {
        console.log(`  - ${JSON.stringify(warning)}`);
      }
    }

    // Kontrolovaná chyba jen při SYSTEMATICKÉM problému (zadání bod 5 —
    // "nevyřazuj celý import kvůli chybě jednoho spoje"), ne kvůli
    // jednotlivým varováním výše.
    if (nightIndex.lines.length === 0) {
      fail("V GTFS feedu nebyla nalezena ŽÁDNÁ noční linka (is_night=1) — feed může mít jiný formát nebo příznak chybí. Import se PŘERUŠIL.");
    }
    if (nightIndex.stopGroups.length === 0) {
      fail("Noční linky byly nalezeny, ale žádná zastávková skupina nemá platné souřadnice/spoje — import se PŘERUŠIL.");
    }

    const tramLines = nightIndex.lines.filter((l) => l.category === "tram");
    const urbanBusLines = nightIndex.lines.filter((l) => l.category === "urban-bus");
    const regionalBusLines = nightIndex.lines.filter((l) => l.category === "regional-bus");
    const totalPlatforms = new Set([...nightStopDetails.values()].flatMap((d) => d.platforms.map((p) => p.id))).size;

    console.log(
      `Noční doprava: ${tramLines.length} tramvajových linek (${tramLines.map((l) => l.shortName).join(", ")}), ` +
        `${urbanBusLines.length} městských nočních autobusů (${urbanBusLines.map((l) => l.shortName).join(", ")}), ` +
        `${regionalBusLines.length} příměstských nočních autobusů (${regionalBusLines.map((l) => l.shortName).join(", ")}).`
    );
    console.log(`Noční doprava: ${nightIndex.stopGroups.length} zastávkových skupin, ${totalPlatforms} fyzických nástupišť.`);
    console.log(`Noční doprava: linka 918 ${urbanBusLines.some((l) => l.shortName === "918") ? "nalezena" : "NENALEZENA"}.`);

    // Auditní výstup "linka -> jaké letištní zastávky skutečně
    // obsluhuje" (viz zadání bod 3) — postavený nad hotovým
    // nightStopDetails, ne nad natvrdo očekávaným seznamem, takže vždy
    // odpovídá aktuálním datům. Rozpoznání samotné (lib/night-transport/
    // airport-stops.ts) je primárně podle stabilních PID uzlů, ne podle
    // čísla linky ani textu "Letiště"/"K Letišti" v názvu.
    const airportReport = buildAirportRouteReport(nightStopDetails);
    if (airportReport.length > 0) {
      console.log("Letištní noční linky:");
      for (const entry of airportReport) {
        console.log(`  ${entry.line} — ${entry.stopNames.join(", ")}`);
      }
    } else {
      console.log("Letištní noční linky: NENALEZENY (žádná noční linka aktuálně neobsluhuje žádný ze známých letištních uzlů).");
    }
    console.log(`Noční doprava: kalendáře platné ${feedStartDate}–${feedEndDate}.`);

    const nightDir = join(import.meta.dirname, "..", "public", "data", "night-transport");
    const nightStopsDir = join(nightDir, "stops");
    rmSync(nightDir, { recursive: true, force: true });
    mkdirSync(nightStopsDir, { recursive: true });

    const indexJson = JSON.stringify(nightIndex);
    writeFileSync(join(nightDir, "index.json"), indexJson, "utf-8");

    let nightDetailBytes = 0;
    let nightDetailGzipBytes = 0;
    for (const [groupId, detail] of nightStopDetails) {
      const fileName = groupIdToFileName(groupId);
      if (!fileName) {
        fail(`ID noční zastávkové skupiny "${groupId}" obsahuje znaky nevhodné pro název souboru — import se PŘERUŠIL.`);
      }
      const json = JSON.stringify(detail);
      writeFileSync(join(nightStopsDir, `${fileName}.json`), json, "utf-8");
      nightDetailBytes += Buffer.byteLength(json, "utf-8");
      nightDetailGzipBytes += gzipSync(json).byteLength;
    }

    const indexBytes = Buffer.byteLength(indexJson, "utf-8");
    const indexGzipBytes = gzipSync(indexJson).byteLength;
    const totalNightDepartureRows = [...nightStopDetails.values()].reduce(
      (sum, d) => sum + d.routes.reduce((s2, r) => s2 + r.directions.reduce((s3, dir) => s3 + dir.departures.length, 0), 0),
      0
    );

    console.log(
      `Zapsáno public/data/night-transport/index.json (${(indexBytes / 1024).toFixed(1)} kB, gzip ${(indexGzipBytes / 1024).toFixed(1)} kB) ` +
        `+ ${nightStopDetails.size} souborů detailu zastávek (celkem ${(nightDetailBytes / 1024).toFixed(0)} kB, gzip ${(nightDetailGzipBytes / 1024).toFixed(0)} kB; ` +
        `${totalNightDepartureRows.toLocaleString("cs-CZ")} nočních odjezdů).`
    );
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

/** Předchozí platný výstup, nebo null (neexistuje / nejde přečíst — pak se smí přepsat). */
function readPreviousAreaStops(filePath: string): StationAreaStopsDataset["stations"] | null {
  if (!existsSync(filePath)) return null;
  try {
    const stations = (JSON.parse(readFileSync(filePath, "utf-8")) as StationAreaStopsDataset).stations;
    return stations && typeof stations === "object" ? stations : null;
  } catch {
    console.warn("⚠ Předchozí data/station-area-stops.json nejde přečíst — bude nahrazen novým výsledkem.");
    return null;
  }
}

function writeStationAreaStops(
  dataDir: string,
  stationIds: readonly string[],
  extract: () => StationAreaStopsDataset["stations"],
  generatedAt: string,
  stationNameById: ReadonlyMap<string, string>
): void {
  const filePath = join(dataDir, "station-area-stops.json");
  try {
    const next = extract();
    for (const stationId of stationIds) {
      const platforms = next[stationId] ?? [];
      console.log(`Stanoviště u ${stationNameById.get(stationId) ?? stationId}: ${platforms.length} (${platforms.map((p) => p.code).join(", ")}).`);
    }

    const previous = readPreviousAreaStops(filePath);
    const decision = decideAreaStopsWrite(previous, next);
    if (!decision.write) {
      console.warn(`⚠ data/station-area-stops.json se NEPŘEPISUJE (${decision.reason}) — zůstávají předchozí data.`);
      return;
    }

    const dataset: StationAreaStopsDataset = { generatedAt, source: GTFS_ZIP_URL, stations: next };
    writeFileSync(filePath, JSON.stringify(dataset, null, 2) + "\n", "utf-8");
    console.log("Zapsáno data/station-area-stops.json.");
  } catch (error) {
    console.warn(`⚠ Stanoviště průvodců se nepodařilo zpracovat — zůstávají předchozí data. (${(error as Error).stack ?? error})`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
