import type { CalendarDefinition, DepartureRow } from "./types.ts";
import { getActiveServiceIds } from "./service-calendar.ts";
import { addDaysToCalendarDate, type PragueCalendarDate } from "../time/prague-time.ts";

const SECONDS_PER_DAY = 86_400;

export type UpcomingDeparture = DepartureRow & {
  /** Sekund od půlnoci DNEŠNÍHO provozního dne — může být záporné/přesahovat 86400 uvnitř výpočtu, ale na výstupu je vždy >= `nowSeconds`. Pro zobrazení použij formatClockTime(secondsSinceTodayMidnight % 86400). */
  secondsSinceTodayMidnight: number;
};

/**
 * Nejbližší budoucí odjezdy v daném směru od okamžiku `now` (viz
 * zadání bod 7 — "posuzuj služby předchozího i aktuálního provozního
 * dne"). GTFS časy > 24:00:00 patří ještě VČEREJŠÍMU provoznímu dni,
 * takže se počítá ve dvou kolech:
 *
 *  - dnešní aktivní služby: `entry.time` beze změny (0..~30h);
 *  - včerejší aktivní služby: `entry.time - 86400` — spoj zapsaný jako
 *    "24:35:00" u služby aktivní VČERA odpovídá dnešní 00:35, a pokud
 *    je `now` např. 00:20, je to nejbližší odjezd.
 *
 * Žádné absolutní Date/UTC instanty — jen aritmetika v "sekundách od
 * dnešní půlnoci v Europe/Prague", takže je funkce nezávislá na DST
 * (ten se řeší už při výpočtu `today`/`nowSeconds`, viz volající kód).
 */
export function getUpcomingDepartures(
  departures: readonly DepartureRow[],
  calendars: readonly CalendarDefinition[],
  today: PragueCalendarDate,
  nowSeconds: number,
  limit: number
): UpcomingDeparture[] {
  const yesterday = addDaysToCalendarDate(today, -1);
  const activeToday = getActiveServiceIds(calendars, today);
  const activeYesterday = getActiveServiceIds(calendars, yesterday);

  const candidates: UpcomingDeparture[] = [];

  for (const entry of departures) {
    if (activeToday.has(entry.serviceId)) {
      const secondsSinceTodayMidnight = entry.time;
      if (secondsSinceTodayMidnight >= nowSeconds) candidates.push({ ...entry, secondsSinceTodayMidnight });
    }
    if (activeYesterday.has(entry.serviceId)) {
      const secondsSinceTodayMidnight = entry.time - SECONDS_PER_DAY;
      if (secondsSinceTodayMidnight >= nowSeconds) candidates.push({ ...entry, secondsSinceTodayMidnight });
    }
  }

  candidates.sort((a, b) => a.secondsSinceTodayMidnight - b.secondsSinceTodayMidnight);
  return candidates.slice(0, limit);
}

/**
 * Poslední naplánovaný odjezd DNEŠNÍHO provozního dne (viz zadání bod
 * 4) — max. čas mezi odjezdy, jejichž `service_id` je aktivní dnes,
 * bez ohledu na to, jestli už "now" tenhle čas přesáhlo (jde o
 * informaci z jízdního řádu, ne o "co ještě stihnu"). `null`, když pro
 * dnešek není žádná aktivní služba nebo žádný odjezd (viz zadání
 * "nepoužívej Metro už nejede, pokud to nejde spolehlivě určit").
 */
export function getLastDeparture(departures: readonly DepartureRow[], calendars: readonly CalendarDefinition[], today: PragueCalendarDate): DepartureRow | null {
  const activeToday = getActiveServiceIds(calendars, today);
  let last: DepartureRow | null = null;

  for (const entry of departures) {
    if (!activeToday.has(entry.serviceId)) continue;
    if (!last || entry.time > last.time) last = entry;
  }

  return last;
}
