import type { ParkAndRideDataset } from "./types.ts";

/** Množina `stationId`, ke kterým je bezpečně přiřazené aspoň jedno P+R (viz lib/parking/match-metro-station.ts). Čistá funkce nad staticky importovaným datasetem — badge tak nepotřebuje čekat na živou obsazenost. */
export function getStationsWithParkAndRide(dataset: ParkAndRideDataset): ReadonlySet<string> {
  return new Set(dataset.parkAndRides.map((pr) => pr.metroStationId));
}
