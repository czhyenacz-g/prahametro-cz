import { CZECH_NAMEDAYS, type MonthDayKey } from "./czech-namedays.ts";

export type PragueCalendarDate = {
  year: number;
  month: number;
  day: number;
};

/**
 * Kalendářní datum v `Europe/Prague` odvozené z libovolného instantu
 * (viz zadání — Vercel běží v UTC, prosté `date.getDate()` by dalo
 * špatný den kdykoliv je v Praze už jiný kalendářní den než v UTC).
 * `Intl.DateTimeFormat` s `timeZone` řeší DST i přechod přes půlnoc
 * automaticky, bez těžké datumové knihovny.
 */
export function getPragueCalendarDate(date: Date): PragueCalendarDate {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Prague",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const get = (type: "year" | "month" | "day"): number => Number(parts.find((p) => p.type === type)?.value ?? 0);

  return { year: get("year"), month: get("month"), day: get("day") };
}

function toMonthDayKey({ month, day }: PragueCalendarDate): MonthDayKey {
  return `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Jména slavící svátek v daný den v `Europe/Prague` — [] když pro dané datum žádné jméno v datech není (viz lib/namedays/czech-namedays.ts). */
export function getCzechNamedays(date: Date): string[] {
  const key = toMonthDayKey(getPragueCalendarDate(date));
  return [...(CZECH_NAMEDAYS[key] ?? [])];
}

/**
 * "Dnes má svátek X." / "Dnes mají svátek X a Y." / "Dnes mají svátek
 * X, Y a Z." (přirozený český výčet, žádné lomítko) — pro prázdný/
 * neplatný vstup bezpečný obecný fallback, nikdy "undefined"/"null"/
 * prázdná věta (viz zadání).
 */
export function formatNamedaySentence(names: string[]): string {
  const clean = names.filter((name): name is string => typeof name === "string" && name.trim().length > 0);

  if (clean.length === 0) return "Ať se vám dnes daří.";
  if (clean.length === 1) return `Dnes má svátek ${clean[0]}.`;

  const allButLast = clean.slice(0, -1).join(", ");
  const last = clean[clean.length - 1];
  return `Dnes mají svátek ${allButLast} a ${last}.`;
}

/**
 * Kolik minut je `Europe/Prague` před UTC v daném instantu (kladné
 * číslo, CET = 60, CEST = 120) — pomocná funkce pro
 * `getMsUntilNextPragueMidnight`, samostatně testovatelná kolem
 * přechodů letního/zimního času.
 */
export function getPragueOffsetMinutes(date: Date): number {
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
  // Intl s hour12:false umí vrátit hodinu "24" pro půlnoc — normalizace na 0.
  const hour = get("hour") % 24;

  const asIfUtc = Date.UTC(get("year"), get("month") - 1, get("day"), hour, get("minute"), get("second"));
  return Math.round((asIfUtc - date.getTime()) / 60_000);
}

/**
 * Milisekund do nejbližší příští půlnoci v `Europe/Prague` od daného
 * okamžiku (viz zadání — aktualizace přání po půlnoci bez ručního
 * refreshe). Naivní odhad ("zítřejší datum, 00:00 UTC") se opraví o
 * pražský offset spočtený PŘÍMO v tom odhadovaném okamžiku — DST
 * přechody v ČR nastávají ve 2:00/3:00 místního času, ne o půlnoci,
 * takže offset zjištěný přesně v cílovém okamžiku je spolehlivý bez
 * nutnosti plné datumové knihovny (viz zadání "neúměrně složité").
 */
export function getMsUntilNextPragueMidnight(date: Date): number {
  const { year, month, day } = getPragueCalendarDate(date);
  const naiveNextMidnightUtc = Date.UTC(year, month - 1, day + 1, 0, 0, 0);
  const offsetMinutes = getPragueOffsetMinutes(new Date(naiveNextMidnightUtc));
  const targetUtcMs = naiveNextMidnightUtc - offsetMinutes * 60_000;

  return Math.max(targetUtcMs - date.getTime(), 0);
}
