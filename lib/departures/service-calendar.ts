import type { CalendarDefinition } from "./types.ts";
import type { PragueCalendarDate } from "../time/prague-time.ts";

function toYyyymmdd(date: PragueCalendarDate): string {
  return `${date.year}${String(date.month).padStart(2, "0")}${String(date.day).padStart(2, "0")}`;
}

/** 0=pondělí .. 6=neděle (stejné pořadí jako CalendarDefinition.weekdays) — počítáno přes Date.UTC, ne ruční tabulku dnů v měsíci. */
function weekdayIndexMondayZero(date: PragueCalendarDate): number {
  const jsDay = new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay(); // 0=neděle..6=sobota
  return (jsDay + 6) % 7;
}

/**
 * Je `service_id` aktivní v daný kalendářní den? Přesně GTFS sémantika:
 * `calendar_dates` výjimka má vždy přednost (odebrání i přidání) před
 * základním týdenním vzorem z `calendar.txt` (viz zadání body 4/5).
 */
export function isServiceActiveOnDate(calendar: CalendarDefinition, date: PragueCalendarDate): boolean {
  const key = toYyyymmdd(date);

  if (calendar.removedDates.includes(key)) return false;
  if (calendar.addedDates.includes(key)) return true;

  if (key < calendar.startDate || key > calendar.endDate) return false;
  return calendar.weekdays[weekdayIndexMondayZero(date)];
}

/**
 * Množina `service_id` aktivních v daný den — může (legitimně) obsahovat
 * víc než jednu službu zároveň (např. běžný všední den + samostatná
 * "provoz denně" služba pro pár konkrétních spojů), viz reálná PID data.
 */
export function getActiveServiceIds(calendars: readonly CalendarDefinition[], date: PragueCalendarDate): Set<string> {
  const active = new Set<string>();
  for (const calendar of calendars) {
    if (isServiceActiveOnDate(calendar, date)) active.add(calendar.serviceId);
  }
  return active;
}
