import dataset from "../../public/data/night-transport/index.json" with { type: "json" };
import type { NightTransportIndex } from "./types.ts";

// Stejný vzorec jako lib/metro/load-entrances.ts — JSON import má z
// podstaty widened typy, cast na jednom místě. Importováno JEN ze
// serverových komponent noční sekce (přehled linek, letištní karta),
// nikdy z homepage kódu (zadání "homepage nenačítá noční dataset").
export const nightTransportIndex = dataset as unknown as NightTransportIndex;
