/** "HH:MM:SS" (H může přesáhnout 24, viz GTFS spec) -> sekund od půlnoci. Neplatný vstup -> null, ať se řádek bezpečně přeskočí, ne spadne. Sdíleno mezi lib/gtfs/build-departures.ts a lib/night-transport/night-routes.ts (viz zadání "nevytvářej paralelní kopie"). */
export function parseGtfsTimeToSeconds(value: string): number | null {
  const match = /^(\d{1,3}):(\d{2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const [, h, m, s] = match;
  const seconds = Number(h) * 3600 + Number(m) * 60 + Number(s);
  return Number.isFinite(seconds) ? seconds : null;
}
