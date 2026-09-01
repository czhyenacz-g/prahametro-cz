import type { MetroLine } from "../metro/types.ts";

/**
 * GTFS `calendar.txt` + `calendar_dates.txt` sloučené do jedné
 * definice služby (viz zadání "kalendář, ne pevně uložená hodnota") —
 * jen ty `service_id`, které skutečně obsluhují metro (filtrováno při
 * importu, viz scripts/import-pid-gtfs.ts), takže zůstává malé i u
 * stanic bez vlastního souboru kalendářů.
 */
export type CalendarDefinition = {
  serviceId: string;
  /** [pondělí, úterý, středa, čtvrtek, pátek, sobota, neděle] — stejné pořadí jako sloupce GTFS calendar.txt. */
  weekdays: [boolean, boolean, boolean, boolean, boolean, boolean, boolean];
  /** "YYYYMMDD" */
  startDate: string;
  /** "YYYYMMDD" */
  endDate: string;
  /** "YYYYMMDD"[] — calendar_dates.txt exception_type=1 (přidání). */
  addedDates: string[];
  /** "YYYYMMDD"[] — calendar_dates.txt exception_type=2 (odebrání). */
  removedDates: string[];
};

/** Jeden konkrétní naplánovaný odjezd v daném směru — vlastní `headsign`, protože krátce ukončený spoj může mít jiný cíl než "hlavní" směr (viz zadání bod 6/17). */
export type DepartureRow = {
  /** Sekund od půlnoci GTFS provozního dne — smí přesáhnout 86400 (`>24:00:00`, spoj patřící ještě včerejšímu provoznímu dni). */
  time: number;
  headsign: string;
  serviceId: string;
};

export type DirectionGroup = {
  directionId: "0" | "1";
  /** Nejčastější headsign v tomhle směru — použitý jako popisek volby směru; jednotlivé odjezdy si nesou vlastní headsign (viz DepartureRow). */
  headsign: string;
  departures: DepartureRow[];
};

export type LineGroup = {
  line: MetroLine;
  directions: DirectionGroup[];
};

/** Kompaktní, staticky vygenerovaný soubor jedné stanice (viz public/data/departures/{stationId}.json) — appka ho fetchuje jen při otevření panelu Odjezdy, nikdy při načtení homepage. */
export type StationDeparturesFile = {
  stationId: string;
  stationName: string;
  /** ISO 8601, kdy proběhl `npm run data:refresh` — pro kontrolu stáří dat (viz lib/departures/freshness.ts). */
  generatedAt: string;
  source: string;
  lines: LineGroup[];
  calendars: CalendarDefinition[];
};
