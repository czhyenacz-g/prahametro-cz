// Tvar data/station-area-stops.json — povrchová stanoviště (autobus,
// tramvaj, trolejbus) u stanic s průvodcem, generuje
// scripts/import-pid-gtfs.ts z PID GTFS při každé denní aktualizaci.

export type AreaStopMode = "tram" | "bus" | "trolleybus" | "other";

export type StationAreaPlatform = {
  /** Kód stanoviště z GTFS `platform_code` (např. "A", "4", "V1"). */
  code: string;
  /** Název zastávky z GTFS — u většiny stanovišť shodný se stanicí metra, ale ne vždy (Můstek → "Václavské náměstí"). */
  name: string;
  lat: number;
  lon: number;
  /** Linky, které ze stanoviště podle jízdního řádu odjíždějí (ne jen končí). */
  /** `headsigns` = nejčastější cílové zastávky linky z tohoto stanoviště (GTFS trip_headsign), nejvýš 3 — chybí u dat ze starších importů. */
  routes: { name: string; mode: AreaStopMode; headsigns?: string[] }[];
};

export type StationAreaStopsByStation = Record<string, StationAreaPlatform[]>;

export type StationAreaStopsDataset = {
  generatedAt: string;
  source: string;
  stations: StationAreaStopsByStation;
};
