import type { ParkAndRideDataset } from "./types.ts";

// Statický import (ne fetch) — `data/park-and-ride.json` je součástí
// buildu stejně jako `data/metro-entrances.json`, viz
// lib/metro/load-entrances.ts pro stejný vzor. Pokud soubor ještě
// neexistuje (skript nikdy neběžel), import prostě selže na buildu —
// proto vždy commitujeme aspoň prázdný validní snapshot, viz
// scripts/import-park-and-ride.ts.
import dataset from "../../data/park-and-ride.json" with { type: "json" };

export const parkAndRideDataset = dataset as unknown as ParkAndRideDataset;
