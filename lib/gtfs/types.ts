// Syrové GTFS řádky — jen sloupce, které import skutečně potřebuje
// (ne celý GTFS spec). Vše je string, protože tak přichází z CSV;
// typová konverze (čísla, enumy) se dělá až v extract-metro-entrances.ts
// / build-departures.ts.
/**
 * `is_night`/`is_regional`/`is_substitute_transport`/`route_color`/
 * `route_text_color` jsou skutečné sloupce reálného PID GTFS feedu
 * (ověřeno na živých datech, `routes.txt`) — používá je
 * lib/night-transport/night-routes.ts pro rozpoznání nočních linek, viz
 * tam podrobný komentář proč (autoritativní PID příznak, ne hádání
 * podle čísla).
 */
export type GtfsRoute = {
  route_id: string;
  route_short_name: string;
  route_type: string;
  /** Volitelné — existující metro kód (extract-metro-entrances.ts/metro-routes.ts) tyhle sloupce nepotřebuje a testovací fixtures je nemusí nastavovat. */
  is_night?: string;
  is_regional?: string;
  is_substitute_transport?: string;
  route_color?: string;
  route_text_color?: string;
};
export type GtfsTrip = { trip_id: string; route_id: string; service_id: string; trip_headsign: string; direction_id: string };
export type GtfsStopTime = { trip_id: string; stop_id: string };
export type GtfsStop = {
  stop_id: string;
  stop_name: string;
  stop_lat: string;
  stop_lon: string;
  location_type: string;
  parent_station: string;
  wheelchair_boarding: string;
  /**
   * PID "uzel" — stabilní seskupovací ID fyzických nástupišť SDÍLENÉ
   * napříč tramvajovými/autobusovými zastávkami BEZ `parent_station`
   * (ověřeno na živých datech, např. "Lazarská" má 4 nástupiště se
   * stejným `asw_node_id`, ale prázdným `parent_station`) — viz
   * lib/night-transport/stop-groups.ts a zadání bod 7 "pokud PID
   * používá jiný stabilní vztah, respektuj ho".
   */
  asw_node_id?: string;
  /** Kód nástupiště v rámci zastávky (např. "A", "1") — jen zobrazovací, viz zadání bod 7 "zachovej konkrétní nástupiště". */
  platform_code?: string;
};

/**
 * Řádek stop_times.txt s odjezdovým časem, pro lib/gtfs/build-departures.ts
 * — `departure_time` smí přesáhnout "24:00:00" (viz GTFS spec, spoj přes
 * půlnoc). `stop_sequence` je nutné, aby šlo poznat POSLEDNÍ zastávku
 * spoje (viz build-departures.ts — poslední zastávka je jen příjezd,
 * ne skutečná nabídka odjezdu, a nesmí se objevit v odjezdovém panelu).
 */
export type GtfsStopTimeWithDeparture = { trip_id: string; stop_id: string; departure_time: string; stop_sequence: string };

/** GTFS calendar.txt — pořadí sloupců monday..sunday odpovídá CalendarDefinition.weekdays v lib/departures/types.ts. */
export type GtfsCalendar = {
  service_id: string;
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
  start_date: string;
  end_date: string;
};

/** GTFS calendar_dates.txt — exception_type "1" = přidání, "2" = odebrání. */
export type GtfsCalendarDate = { service_id: string; date: string; exception_type: string };
