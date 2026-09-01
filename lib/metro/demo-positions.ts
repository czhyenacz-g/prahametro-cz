import type { MetroEntrance } from "./types.ts";

export type DemoPosition = { label: string; lat: number; lon: number };

function averagePoint(entrances: MetroEntrance[], stationName: string): { lat: number; lon: number } | null {
  const matches = entrances.filter((e) => e.stationName === stationName);
  if (matches.length === 0) return null;
  return {
    lat: matches.reduce((sum, e) => sum + e.lat, 0) / matches.length,
    lon: matches.reduce((sum, e) => sum + e.lon, 0) / matches.length,
  };
}

/**
 * Tři demo polohy pro vývoj/prezentaci — souřadnice NEJSOU vymyšlené ani
 * opsané odjinud, počítají se výhradně ze skutečných importovaných
 * vstupů (viz zadání "nevymýšlej"): Anděl a Hlavní nádraží jsou průměr
 * souřadnic jejich vlastních vstupů, Václavské náměstí je střed mezi
 * stanicemi Muzeum a Můstek (náměstí mezi nimi leží).
 */
export function buildDemoPositions(entrances: MetroEntrance[]): DemoPosition[] {
  const andel = averagePoint(entrances, "Anděl");
  const hlavniNadrazi = averagePoint(entrances, "Hlavní nádraží");
  const muzeum = averagePoint(entrances, "Muzeum");
  const mustek = averagePoint(entrances, "Můstek");

  const positions: DemoPosition[] = [];
  if (muzeum && mustek) {
    positions.push({ label: "Václavské náměstí", lat: (muzeum.lat + mustek.lat) / 2, lon: (muzeum.lon + mustek.lon) / 2 });
  }
  if (andel) positions.push({ label: "Anděl", lat: andel.lat, lon: andel.lon });
  if (hlavniNadrazi) positions.push({ label: "Hlavní nádraží", lat: hlavniNadrazi.lat, lon: hlavniNadrazi.lon });
  return positions;
}
