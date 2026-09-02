import type { GtfsCalendar, GtfsCalendarDate } from "../gtfs/types.ts";
import type { CalendarDefinition } from "./types.ts";

const WEEKDAY_COLUMNS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

/**
 * `calendar.txt` + `calendar_dates.txt` -> `CalendarDefinition[]`, jen
 * pro `service_id` skutečně použité importovanou sadou spojů
 * (`usedServiceIds`). Sdíleno mezi lib/gtfs/build-departures.ts (metro)
 * a lib/night-transport/build-night-dataset.ts (noční doprava) — viz
 * zadání "nevytvářej paralelní kopie".
 */
export function buildCalendarDefinitions(calendars: readonly GtfsCalendar[], calendarDates: readonly GtfsCalendarDate[], usedServiceIds: ReadonlySet<string>): CalendarDefinition[] {
  const byServiceId = new Map<string, CalendarDefinition>();

  for (const row of calendars) {
    if (!usedServiceIds.has(row.service_id)) continue;
    const weekdays = WEEKDAY_COLUMNS.map((col) => row[col] === "1") as CalendarDefinition["weekdays"];
    byServiceId.set(row.service_id, {
      serviceId: row.service_id,
      weekdays,
      startDate: row.start_date,
      endDate: row.end_date,
      addedDates: [],
      removedDates: [],
    });
  }

  // Service_id používaný importovanou sadou, ale BEZ řádku v calendar.txt
  // (celá definice jen přes calendar_dates) — platný GTFS vzor, doplní se
  // "prázdný" týdenní kalendář, který exceptions níže doplní.
  function ensure(serviceId: string): CalendarDefinition {
    let def = byServiceId.get(serviceId);
    if (!def) {
      def = { serviceId, weekdays: [false, false, false, false, false, false, false], startDate: "00000000", endDate: "99999999", addedDates: [], removedDates: [] };
      byServiceId.set(serviceId, def);
    }
    return def;
  }

  for (const row of calendarDates) {
    if (!usedServiceIds.has(row.service_id)) continue;
    const def = ensure(row.service_id);
    if (row.exception_type === "1") def.addedDates.push(row.date);
    else if (row.exception_type === "2") def.removedDates.push(row.date);
  }

  return [...byServiceId.values()];
}
