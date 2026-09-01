import dataset from "../../data/metro-entrances.json" with { type: "json" };
import type { MetroEntrancesDataset } from "./types.ts";

// JSON import má z podstaty widened typy (string, ne literal union) —
// cast na hranici jednoho místa, ne opakovaně u každého importu.
// Datový tvar garantuje scripts/import-pid-gtfs.ts (viz MetroEntrancesDataset).
export const metroEntrances = dataset as unknown as MetroEntrancesDataset;
