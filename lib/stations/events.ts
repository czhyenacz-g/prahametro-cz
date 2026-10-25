import { track } from "@vercel/analytics";

/**
 * Události průvodců stanicemi → Vercel Web Analytics (custom events).
 * Projekt už Web Analytics používá (`<Analytics />` v root layoutech) a
 * tým je na plánu Pro, kde jsou vlastní události zahrnuté — ale jen se
 * DVĚMA vlastnostmi na událost (vercel.com/docs/analytics/limits-and-pricing).
 * Proto má každá událost nejvýš dvě vlastnosti; u navigace se cíl a
 * mapová služba posílají spojeně jako `destination_provider`
 * ("stanoviste-4:google").
 *
 * NIKDY poloha/souřadnice uživatele ani nic osobního — jen slug stanice,
 * id cíle na stránce a poskytovatel odkazu. Mimo produkci `track()` nic
 * neodesílá (jen ho knihovna vypíše do konzole).
 */
export type StationEvent =
  | { type: "station_departures_click"; station_slug: string; provider: string }
  | { type: "station_navigation_click"; station_slug: string; destination_id: string; provider: string }
  | { type: "station_destination_click"; station_slug: string; destination_id: string }
  | { type: "station_source_click"; station_slug: string; provider: string };

export type StationEventType = StationEvent["type"];

export const STATION_EVENT_TYPES: readonly StationEventType[] = ["station_departures_click", "station_navigation_click", "station_destination_click", "station_source_click"];

/** Vlastnosti odesílané do Vercel Analytics — vždy nejvýš 2 (limit plánu Pro). */
export function toAnalyticsProperties(event: StationEvent): Record<string, string> {
  switch (event.type) {
    case "station_departures_click":
    case "station_source_click":
      return { station_slug: event.station_slug, provider: event.provider };
    case "station_destination_click":
      return { station_slug: event.station_slug, destination_id: event.destination_id };
    case "station_navigation_click":
      return { station_slug: event.station_slug, destination_provider: `${event.destination_id}:${event.provider}` };
  }
}

export function emitStationEvent(event: StationEvent): void {
  try {
    track(event.type, toAnalyticsProperties(event));
  } catch {
    // Analytika nesmí nikdy rozbít klik na odkaz.
  }
}

/**
 * Event z `data-station-*` atributů odkazu (viz
 * components/stations/StationAnalytics.tsx) — neznámý typ nebo chybějící
 * slug = null, nic se neemituje.
 */
export function stationEventFromDataset(dataset: Record<string, string | undefined>): StationEvent | null {
  const type = dataset.stationEvent as StationEventType | undefined;
  const slug = dataset.stationSlug;
  if (!type || !slug || !STATION_EVENT_TYPES.includes(type)) return null;
  const destination_id = dataset.destinationId ?? "";
  const provider = dataset.provider ?? "";

  switch (type) {
    case "station_departures_click":
    case "station_source_click":
      return { type, station_slug: slug, provider };
    case "station_navigation_click":
      return { type, station_slug: slug, destination_id, provider };
    case "station_destination_click":
      return { type, station_slug: slug, destination_id };
  }
}
