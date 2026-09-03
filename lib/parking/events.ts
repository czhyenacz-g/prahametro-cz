import type { Locale } from "../i18n/types.ts";

/** Viz zadání bod 13 — jen tyhle tři eventy, nikdy poloha/GPS/IP nad rámec běžného provozu. */
export type ParkingEvent =
  | { type: "pr_section_open" }
  | { type: "pr_badge_click"; stationId: string }
  | { type: "pr_navigation_click"; parkAndRideId: string; mapService: "google" | "apple" | "mapy"; locale: Locale };

/**
 * Projekt zatím nemá žádnou analytickou vrstvu (viz `lib/ads/events.ts`
 * pro stejný vzor) — v produkci nikam nic neodesílá, jen vývojový
 * `console.debug` pro budoucí ladění/napojení. Žádný nový analytický
 * nástroj, cookie lišta ani Google Analytics se kvůli tomuhle nezavádí.
 */
export function emitParkingEvent(event: ParkingEvent): void {
  if (process.env.NODE_ENV === "development") {
    console.debug("[parking]", event);
  }
}
