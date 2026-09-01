// Syrové GTFS řádky — jen sloupce, které import skutečně potřebuje
// (ne celý GTFS spec). Vše je string, protože tak přichází z CSV;
// typová konverze (čísla, enumy) se dělá až v extract-metro-entrances.ts.
export type GtfsRoute = { route_id: string; route_short_name: string; route_type: string };
export type GtfsTrip = { trip_id: string; route_id: string };
export type GtfsStopTime = { trip_id: string; stop_id: string };
export type GtfsStop = {
  stop_id: string;
  stop_name: string;
  stop_lat: string;
  stop_lon: string;
  location_type: string;
  parent_station: string;
  wheelchair_boarding: string;
};
