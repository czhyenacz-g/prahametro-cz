import type { CalendarDefinition, DepartureRow } from "../departures/types.ts";

export type NightVehicleType = "tram" | "bus";

/** Tři skupiny pro přehled linek (zadání bod 16) — "urban"/"regional" rozlišuje GTFS `is_regional` u route_type=3 (bus), ne číslo linky. */
export type NightLineCategory = "tram" | "urban-bus" | "regional-bus";

/** Jedna noční linka rozpoznaná v aktuálním GTFS (viz lib/night-transport/night-routes.ts). */
export type NightRouteInfo = {
  routeId: string;
  shortName: string;
  vehicleType: NightVehicleType;
  category: NightLineCategory;
  /** Skutečná barva PID pro tuhle linku (routes.txt route_color/route_text_color) — ne natvrdo vymyšlená appkou. */
  colorHex: string;
  textColorHex: string;
};

/** Reprezentativní cíle linky pro přehled (zadání bod 16) — dvě nejčastější trip_headsign hodnoty napříč oběma směry. */
export type NightLineSummary = NightRouteInfo & {
  destinations: string[];
  /** True, když GTFS pro tuhle linku obsahuje víc než jednu variantu trasy (různé shape_id/headsign kombinace) — zobraz upozornění, že některé spoje mohou mít odlišnou konečnou (zadání bod 16). */
  hasRouteVariants: boolean;
};

/** Jeden fyzický označník/nástupiště (ne logická zastávková skupina) — navigace vždy cílí sem, nikdy na střed skupiny (zadání bod 7/12). */
export type NightPlatform = {
  /** GTFS stop_id. */
  id: string;
  /** Kód nástupiště (platform_code), pokud GTFS nějaký má — jinak prázdné. */
  platformCode: string;
  lat: number;
  lon: number;
  /** Linky, které z tohoto konkrétního nástupiště skutečně odjíždí. */
  lines: string[];
};

/** Logická zastávková skupina pro výsledkové karty (zadání bod 7) — `id` je buď GTFS parent_station, nebo `node:{asw_node_id}` fallback, nikdy odvozené jen z podobnosti jména. */
export type NightStopGroup = {
  id: string;
  name: string;
  /** Souřadnice NEJBLIŽŠÍHO nástupiště k centroidu skupiny — jen pro hrubé první řazení v index.json, skutečná navigace vždy použije konkrétní nástupiště z detailu (viz NightPlatform). */
  lat: number;
  lon: number;
  lines: string[];
};

export type NightTransportIndex = {
  generatedAt: string;
  source: string;
  /** GTFS feed_info.txt rozsah platnosti (YYYYMMDD) — zobrazeno jako kontext u "zastaralá data" (zadání bod 8/11). */
  feedStartDate: string;
  feedEndDate: string;
  lines: NightLineSummary[];
  stopGroups: NightStopGroup[];
  /** Stop group id -> zastávky obsluhované letištními linkami, viz zadání bod 15 ("Na letiště v noci"). Prázdné pole = žádná letištní noční linka v aktuálním feedu nenalezena. */
  airportLines: string[];
};

export type NightDepartureDirection = {
  directionId: "0" | "1";
  headsign: string;
  departures: DepartureRow[];
};

export type NightRouteAtStop = NightRouteInfo & {
  directions: NightDepartureDirection[];
};

/** Kompaktní detail jedné zastávkové skupiny, načtený až na vyžádání (zadání bod 6). */
export type NightStopDetail = {
  id: string;
  name: string;
  generatedAt: string;
  source: string;
  platforms: NightPlatform[];
  routes: NightRouteAtStop[];
  calendars: CalendarDefinition[];
};
