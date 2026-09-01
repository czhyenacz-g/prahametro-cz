export type MetroLine = "A" | "B" | "C" | "D";

export const METRO_LINES: readonly MetroLine[] = ["A", "B", "C", "D"];

export type WheelchairAccess = "yes" | "no" | "unknown";

export type MetroEntrance = {
  id: string;
  stationId: string;
  stationName: string;
  entranceLabel: string;
  lat: number;
  lon: number;
  wheelchair: WheelchairAccess;
  lines: MetroLine[];
};

export type MetroEntrancesDataset = {
  generatedAt: string;
  source: string;
  stationCount: number;
  entranceCount: number;
  entrances: MetroEntrance[];
};
