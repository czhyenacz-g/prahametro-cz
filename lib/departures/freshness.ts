/**
 * PID GTFS kalendáře typicky pokrývají jen pár týdnů dopředu (viz
 * reálná data — `calendar.txt` u metra aktuálně kryje ~2 týdny) — 3 dny
 * je bezpečně konzervativní práh: `npm run data:refresh` se má pouštět
 * min. jednou týdně, 3 dny nechávají dost rezervy, než by kalendáři
 * skutečně došla platnost, a zároveň appka na "poslední vlak" upozorní
 * s předstihem, ne až v okamžiku, kdy by už data byla vyloženě špatná.
 */
export const DEPARTURES_STALE_AFTER_DAYS = 3;

/** True, když je `generatedAt` (ISO 8601 z importu) starší než `DEPARTURES_STALE_AFTER_DAYS` vzhledem k `now` — viz zadání "jízdní řád nemusí být aktuální". */
export function isDeparturesDataStale(generatedAt: string, now: Date): boolean {
  const generatedMs = new Date(generatedAt).getTime();
  if (Number.isNaN(generatedMs)) return true;

  const ageMs = now.getTime() - generatedMs;
  return ageMs > DEPARTURES_STALE_AFTER_DAYS * 24 * 60 * 60 * 1000;
}
