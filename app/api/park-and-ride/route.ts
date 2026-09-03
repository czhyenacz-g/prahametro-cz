import { NextResponse } from "next/server";
import { fetchParkingMeasurements, GolemioApiError } from "../../../lib/parking/golemio-client.ts";
import { parkAndRideDataset } from "../../../lib/parking/load-park-and-ride.ts";
import { mergeParkAndRideWithOccupancy } from "../../../lib/parking/merge-occupancy.ts";
import { transformParkingMeasurement } from "../../../lib/parking/transform.ts";
import type { ParkingOccupancy } from "../../../lib/parking/types.ts";

// ~4 minuty — mezi zadáním "3–5 minut", viz zadání bod 8. Next.js/Vercel
// cachuje odpověď téhle route na serveru: při více současných
// návštěvnících ve stejném okně appka nevolá Golemio pro každého zvlášť
// (viz zadání "nevolat Golemio zbytečně pro každého uživatele").
export const revalidate = 240;

/**
 * Jediný interní endpoint pro P+R sekci — spojí statická metadata
 * (build-time snapshot, `data/park-and-ride.json`) se ŽIVOU obsazeností
 * (Golemio `/v3/parking-measurements`, jeden hromadný request pro
 * všechna naše P+R). Token nikdy neopouští server (viz
 * lib/parking/golemio-client.ts). Poloha uživatele se sem vůbec
 * neposílá — řazení podle vzdálenosti od uživatele počítá klient
 * lokálně nad už staženými daty (viz zadání "neposílej polohu Golemio").
 */
export async function GET() {
  const parkAndRides = parkAndRideDataset.parkAndRides;
  const ids = parkAndRides.map((pr) => pr.id);

  let measurementsFailed = false;
  let measurementsById = new Map<string, ParkingOccupancy>();

  try {
    const measurements = await fetchParkingMeasurements(ids);
    const entries: [string, ParkingOccupancy][] = [];
    for (const measurement of measurements) {
      const occupancy = transformParkingMeasurement(measurement);
      if (occupancy) entries.push([occupancy.parkingId, occupancy]);
    }
    measurementsById = new Map(entries);
  } catch (error) {
    // Výpadek Golemio nesmí shodit celou odpověď — statická metadata se
    // pořád vrátí, jen bez živé obsazenosti (viz zadání bod 7 "výpadek
    // API má bezpečný fallback"). Poloha uživatele se sem neloguje.
    measurementsFailed = true;
    console.error("[park-and-ride] Golemio parking-measurements selhalo:", error instanceof GolemioApiError ? error.message : error);
  }

  const result = mergeParkAndRideWithOccupancy(parkAndRides, measurementsById);

  return NextResponse.json({ parkAndRides: result, measurementsFailed, generatedAt: parkAndRideDataset.generatedAt });
}
