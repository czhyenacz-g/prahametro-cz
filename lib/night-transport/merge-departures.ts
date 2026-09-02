import { getUpcomingDepartures } from "../departures/next-departures.ts";
import type { PragueCalendarDate } from "../time/prague-time.ts";
import type { NightStopDetail, NightVehicleType } from "./types.ts";

export type MergedNightDeparture = {
  lineShortName: string;
  colorHex: string;
  textColorHex: string;
  vehicleType: NightVehicleType;
  headsign: string;
  /** Stejná sémantika jako UpcomingDeparture.secondsSinceTodayMidnight (lib/departures/next-departures.ts), jen vzhledem k `serviceDate` cílové noci, ne kalendářnímu dnešku — zobraz přes formatClockTime(). */
  secondsSinceTodayMidnight: number;
};

/**
 * Nejbližší odjezdy NAPŘÍČ všemi linkami/směry jedné zastávkové skupiny,
 * chronologicky seřazené (zadání bod 10 "odjezdy seřaď chronologicky
 * napříč linkami") — na rozdíl od metra (kde uživatel volí jednu linku
 * a jeden směr, viz DeparturesPanel.tsx), noční karta ukazuje směs.
 * Používá STEJNOU `getUpcomingDepartures` (lib/departures/next-departures.ts)
 * pro každou dvojici linka/směr zvlášť, výsledky jen sloučí a ořízne.
 */
export function getMergedUpcomingDepartures(detail: Pick<NightStopDetail, "routes" | "calendars">, serviceDate: PragueCalendarDate, nowSeconds: number, limit = 3): MergedNightDeparture[] {
  const all: MergedNightDeparture[] = [];

  for (const route of detail.routes) {
    for (const direction of route.directions) {
      const upcoming = getUpcomingDepartures(direction.departures, detail.calendars, serviceDate, nowSeconds, limit);
      for (const departure of upcoming) {
        all.push({
          lineShortName: route.shortName,
          colorHex: route.colorHex,
          textColorHex: route.textColorHex,
          vehicleType: route.vehicleType,
          headsign: departure.headsign,
          secondsSinceTodayMidnight: departure.secondsSinceTodayMidnight,
        });
      }
    }
  }

  all.sort((a, b) => a.secondsSinceTodayMidnight - b.secondsSinceTodayMidnight || a.lineShortName.localeCompare(b.lineShortName, undefined, { numeric: true }));
  return all.slice(0, limit);
}
