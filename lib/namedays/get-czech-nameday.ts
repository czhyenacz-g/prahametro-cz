import { CZECH_NAMEDAYS, type MonthDayKey } from "./czech-namedays.ts";
import { getMsUntilNextPragueMidnight, getPragueCalendarDate, getPragueOffsetMinutes, type PragueCalendarDate } from "../time/prague-time.ts";

// Europe/Prague převod (datum, DST offset, ms do půlnoci) žije ve
// sdíleném lib/time/prague-time.ts (používá ho i lib/departures/) —
// tady se jen re-exportuje pod původními jmény, ať se nemusí měnit
// stávající importy/testy tohoto modulu.
export type { PragueCalendarDate };
export { getMsUntilNextPragueMidnight, getPragueCalendarDate, getPragueOffsetMinutes };

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
