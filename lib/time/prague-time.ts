// Sdílené Europe/Prague časové utility (viz zadání — Vercel běží v
// UTC, appka NIKDY nesmí spoléhat na časovou zónu serveru/zařízení).
// Používá je lib/namedays/get-czech-nameday.ts (jen kalendářní datum)
// i lib/departures/ (datum + čas dne, kvůli GTFS provoznímu dni) — ať
// existuje jen JEDNA implementace `Intl`-based převodu, ne dvě mírně
// odlišné kopie.

export type PragueCalendarDate = { year: number; month: number; day: number };
export type PragueDateTime = PragueCalendarDate & { hour: number; minute: number; second: number };

/**
 * Kalendářní datum a čas v `Europe/Prague` odvozený z libovolného
 * instantu — `Intl.DateTimeFormat` s `timeZone` řeší DST i přechod
 * přes půlnoc automaticky, bez těžké datumové knihovny.
 */
export function getPragueDateTime(date: Date): PragueDateTime {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Prague",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);

  const get = (type: string): number => Number(parts.find((p) => p.type === type)?.value ?? 0);
  // Intl s hour12:false umí vrátit hodinu "24" pro přesnou půlnoc — normalizace na 0.
  const hour = get("hour") % 24;

  return { year: get("year"), month: get("month"), day: get("day"), hour, minute: get("minute"), second: get("second") };
}

export function getPragueCalendarDate(date: Date): PragueCalendarDate {
  const { year, month, day } = getPragueDateTime(date);
  return { year, month, day };
}

/** Sekund od půlnoci (0..86399) v `Europe/Prague`. */
export function getPragueSecondsSinceMidnight(date: Date): number {
  const { hour, minute, second } = getPragueDateTime(date);
  return hour * 3600 + minute * 60 + second;
}

/**
 * Kolik minut je `Europe/Prague` před UTC v daném instantu (kladné
 * číslo, CET = 60, CEST = 120).
 */
export function getPragueOffsetMinutes(date: Date): number {
  const { year, month, day, hour, minute, second } = getPragueDateTime(date);
  const asIfUtc = Date.UTC(year, month - 1, day, hour, minute, second);
  return Math.round((asIfUtc - date.getTime()) / 60_000);
}

/**
 * `calendarDate` posunuté o `deltaDays` (kladně i záporně) — počítáno
 * přes `Date.UTC`, ať normalizace přechodu měsíce/roku dělá spolehlivě
 * JS samotný, ne ruční aritmetika dnů v měsíci.
 */
export function addDaysToCalendarDate(calendarDate: PragueCalendarDate, deltaDays: number): PragueCalendarDate {
  const d = new Date(Date.UTC(calendarDate.year, calendarDate.month - 1, calendarDate.day + deltaDays));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

/**
 * Milisekund do nejbližší příští půlnoci v `Europe/Prague` od daného
 * okamžiku. Naivní odhad ("zítřejší datum, 00:00 UTC") se opraví o
 * pražský offset spočtený PŘÍMO v tom odhadovaném okamžiku — DST
 * přechody v ČR nastávají ve 2:00/3:00 místního času, ne o půlnoci,
 * takže offset zjištěný přesně v cílovém okamžiku je spolehlivý bez
 * nutnosti plné datumové knihovny.
 */
export function getMsUntilNextPragueMidnight(date: Date): number {
  const { year, month, day } = getPragueCalendarDate(date);
  const naiveNextMidnightUtc = Date.UTC(year, month - 1, day + 1, 0, 0, 0);
  const offsetMinutes = getPragueOffsetMinutes(new Date(naiveNextMidnightUtc));
  const targetUtcMs = naiveNextMidnightUtc - offsetMinutes * 60_000;

  return Math.max(targetUtcMs - date.getTime(), 0);
}
