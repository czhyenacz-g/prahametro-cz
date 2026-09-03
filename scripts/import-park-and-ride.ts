// Import skript: stáhne statická metadata P+R z Golemio v3 Parking API
// (https://api.golemio.cz) a vygeneruje verzovaný `data/park-and-ride.json`.
// ZÁMĚRNĚ oddělený od `npm run data:refresh` (PID GTFS) — jiný zdroj dat,
// jiná frekvence změn, a hlavně jiné selhání: výpadek Golemio nesmí
// zablokovat denní aktualizaci jízdních řádů metra ani naopak (viz
// zadání "GTFS a P+R musí mít oddělené selhání").
//
// Vyžaduje GOLEMIO_API_KEY (viz .env.example) — spouští se ručně
// (`npm run parking:refresh`), NENÍ součástí `next build`. Appka za
// běhu tenhle skript ani Golemio token nezná — jen hotový JSON snapshot
// (statická metadata) + samostatný Route Handler pro živou obsazenost
// (app/api/park-and-ride/route.ts, ten token zná, ale jen server-side).
import { writeFileSync } from "node:fs";
import { fetchParkAndRideParkings, fetchParkingTariff, GolemioApiError } from "../lib/parking/golemio-client.ts";
import { attachMetroStations } from "../lib/parking/match-metro-station.ts";
import { transformParkingFeature } from "../lib/parking/transform.ts";
import { metroEntrances } from "../lib/metro/load-entrances.ts";
import type { GolemioParkingTariff } from "../lib/parking/golemio-types.ts";
import type { ParkAndRide } from "../lib/parking/types.ts";

const OUTPUT_PATH = new URL("../data/park-and-ride.json", import.meta.url);
const MIN_EXPECTED_PARK_AND_RIDE = 10;

function fail(message: string): never {
  console.error(`✖ ${message}`);
  process.exit(1);
}

async function loadTariffs(tariffIds: readonly string[]): Promise<Map<string, GolemioParkingTariff>> {
  const uniqueIds = [...new Set(tariffIds)];
  const tariffs = new Map<string, GolemioParkingTariff>();

  for (const id of uniqueIds) {
    try {
      tariffs.set(id, await fetchParkingTariff(id));
    } catch (error) {
      // Chybějící/nedostupný tarif jednoho P+R nesmí spadnout celý
      // import (viz zadání "chybějící měření nezruší statická
      // metadata") — dané P+R prostě zůstane bez priceLabel.
      console.warn(`  ⚠ Tarif ${id} se nepodařilo načíst (${(error as Error).message}) — cena pro dané P+R bude chybět.`);
    }
  }

  return tariffs;
}

async function main() {
  console.log("Stahuji P+R metadata z Golemio v3 Parking API…");

  let response;
  try {
    response = await fetchParkAndRideParkings();
  } catch (error) {
    if (error instanceof GolemioApiError) fail(`Golemio API selhalo: ${error.message}`);
    throw error;
  }

  const features = response.features ?? [];
  if (features.length === 0) {
    fail("Golemio vrátilo 0 P+R záznamů — nečekaně prázdný dataset, import zastaven (nic se nepřepíše).");
  }

  const tariffIds = features.map((f) => f.properties?.tariff).filter((id): id is string => Boolean(id));
  const tariffs = await loadTariffs(tariffIds);

  const parsed: Omit<ParkAndRide, "metroStationId" | "metroDistanceMeters">[] = [];
  let skipped = 0;
  for (const feature of features) {
    const tariffId = feature.properties?.tariff;
    const tariff = tariffId ? (tariffs.get(tariffId) ?? null) : null;
    const result = transformParkingFeature(feature, tariff);
    if (!result) {
      skipped++;
      console.warn(`  ⚠ Přeskočen neplatný záznam (id=${feature.properties?.id ?? "?"}, name=${feature.properties?.name ?? "?"}).`);
      continue;
    }
    parsed.push(result);
  }

  const matched = attachMetroStations(parsed, metroEntrances.entrances);

  if (matched.length < MIN_EXPECTED_PARK_AND_RIDE) {
    fail(
      `Jen ${matched.length} P+R se podařilo spárovat se stanicí metra (očekáváno aspoň ${MIN_EXPECTED_PARK_AND_RIDE}) — ` +
        "nápadně málo, import zastaven (mohlo dojít ke změně formátu API nebo k chybě v datech)."
    );
  }

  const dataset = {
    generatedAt: new Date().toISOString(),
    source: "Golemio v3 Parking API (https://api.golemio.cz), primární zdroj tsk-offstreet",
    totalFetched: features.length,
    skippedInvalid: skipped,
    matchedToMetro: matched.length,
    parkAndRides: matched,
  };

  writeFileSync(OUTPUT_PATH, `${JSON.stringify(dataset, null, 2)}\n`);
  console.log(
    `Hotovo: ${features.length} P+R staženo, ${skipped} přeskočeno jako neplatných, ${matched.length} spárováno se stanicí metra -> ${OUTPUT_PATH.pathname}`
  );
}

main().catch((error) => {
  fail(`Neočekávaná chyba: ${(error as Error).message}`);
});
