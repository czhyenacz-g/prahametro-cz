// Import skript: stáhne oficiální PID GTFS feed, vytáhne jen potřebné
// CSV soubory a vygeneruje verzované statické JSONy pro appku
// (data/metro-entrances.json, data/metro-line-order.json). Spouští se
// ručně (`npm run data:refresh`), NENÍ součástí `next build` — appka za
// běhu žádné GTFS/zip/CSV nezná, jen hotový JSON (viz zadání "bez
// backendu za běhu").
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseCsv } from "../lib/gtfs/parse-csv.ts";
import { streamCsvColumns } from "../lib/gtfs/stream-filter-csv.ts";
import { extractMetroEntrances, countUniqueStations } from "../lib/gtfs/extract-metro-entrances.ts";
import { deriveLineOrder, type GtfsStopTimeWithSequence } from "../lib/gtfs/derive-line-order.ts";
import type { GtfsRoute, GtfsStop, GtfsTrip } from "../lib/gtfs/types.ts";
import { METRO_LINES } from "../lib/metro/types.ts";

const GTFS_ZIP_URL = "https://data.pid.cz/PID_GTFS.zip";
const MIN_STATIONS = 50;
const MIN_ENTRANCES = 200;

const NEEDED_FILES = ["routes.txt", "trips.txt", "stops.txt", "stop_times.txt"] as const;

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

    console.log("Parsuji routes.txt, trips.txt, stops.txt …");
    const routes = parseCsv(readFileSync(join(tmpDir, "routes.txt"), "utf-8")) as unknown as GtfsRoute[];
    const trips = parseCsv(readFileSync(join(tmpDir, "trips.txt"), "utf-8")) as unknown as GtfsTrip[];
    const stops = parseCsv(readFileSync(join(tmpDir, "stops.txt"), "utf-8")) as unknown as GtfsStop[];

    if (routes.length === 0 || trips.length === 0 || stops.length === 0) {
      fail("routes.txt/trips.txt/stops.txt se nepodařilo naparsovat (prázdný výsledek).");
    }

    const metroRouteIds = new Set(routes.filter((r) => r.route_type === "1").map((r) => r.route_id));
    const metroTripIds = new Set(trips.filter((t) => metroRouteIds.has(t.route_id)).map((t) => t.trip_id));

    if (metroTripIds.size === 0) {
      fail("V GTFS feedu nebyl nalezen žádný spoj s route_type=1 (metro) — feed může mít jiný formát.");
    }

    console.log(`Streamuji stop_times.txt (metro spojů: ${metroTripIds.size}) …`);
    const metroStopTimes: GtfsStopTimeWithSequence[] = [];
    let totalRows = 0;

    await streamCsvColumns(
      join(tmpDir, "stop_times.txt"),
      ["trip_id", "stop_id", "stop_sequence"] as const,
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

    const dataset = {
      generatedAt: new Date().toISOString(),
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

    writeFileSync(
      join(dataDir, "metro-line-order.json"),
      JSON.stringify({ generatedAt: dataset.generatedAt, lines: lineOrder }, null, 2) + "\n",
      "utf-8"
    );
    console.log(`Zapsáno data/metro-line-order.json.`);
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
