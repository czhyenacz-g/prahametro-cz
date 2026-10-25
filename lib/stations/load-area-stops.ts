import dataset from "../../data/station-area-stops.json" with { type: "json" };
import type { StationAreaStopsDataset } from "./area-stops-types.ts";

// Stejný vzor jako lib/metro/load-entrances.ts — cast na hranici jednoho
// místa, tvar garantuje scripts/import-pid-gtfs.ts.
export const stationAreaStops = dataset as unknown as StationAreaStopsDataset;
