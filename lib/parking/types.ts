// P+R (Park & Ride) datový model — viz zadání a docs/PARKING.md pro
// zdroj/audit. Zdroj: Golemio v3 Parking API (https://api.golemio.cz),
// primární zdroj `tsk-offstreet` (Technická správa komunikací hl. m.
// Prahy) — ověřeno živě 2026-09-03 proti skutečnému API i proti
// parking.praha.eu.

export type Coordinates = { lat: number; lon: number };

/** Statická metadata jednoho P+R — mění se zřídka, viz scripts/import-park-and-ride.ts. */
export type ParkAndRide = {
  id: string;
  name: string;
  address: string | null;
  coordinates: Coordinates;
  /** Souřadnice AUTOMOBILOVÉHO vjezdu (entrance_type obsahuje "car", entry=true) — null = Golemio je pro tohle P+R neposkytuje, použij `coordinates` (centroid) jako fallback. */
  entranceCoordinates: Coordinates | null;
  capacity: number | null;
  /** Cena za prvních 24 hodin, jen když ji tarif jednoznačně a bezpečně poskytuje (viz lib/parking/price.ts) — jinak `null`, nikdy odhad. */
  priceLabel: string | null;
  /** `false`, pokud Golemio explicitně uvádí "not_possible", NEBO pokud u tohoto zdroje (tsk-offstreet) nemáme pozitivní potvrzení možnosti rezervace — viz zadání "neslibuj dostupné místo". `true` jen při explicitním "possible"/"required". */
  reservationPossible: boolean | null;
  metroStationId: string;
  /** Vzdušná vzdálenost k NEJBLIŽŠÍMU KONKRÉTNÍMU VSTUPU dané stanice (ne ke středu schematické mapy) — viz lib/parking/match-metro-station.ts. */
  metroDistanceMeters: number;
  sourceUrl: string | null;
};

/** Živé měření obsazenosti — mění se často, viz app/api/park-and-ride/route.ts. */
export type ParkingOccupancy = {
  parkingId: string;
  freeSpaces: number | null;
  totalSpaces: number | null;
  occupiedSpaces: number | null;
  /** ISO timestamp poslední aktualizace měření (Golemio `last_updated`) — `null` = měření vůbec neexistuje. */
  updatedAt: string | null;
};

/** P+R spojené se svým (případně chybějícím) živým měřením — vrací app/api/park-and-ride/route.ts klientovi. */
export type ParkAndRideWithOccupancy = ParkAndRide & {
  occupancy: ParkingOccupancy | null;
};

/** Tvar `data/park-and-ride.json`, viz scripts/import-park-and-ride.ts. */
export type ParkAndRideDataset = {
  generatedAt: string;
  source: string;
  totalFetched: number;
  skippedInvalid: number;
  matchedToMetro: number;
  parkAndRides: ParkAndRide[];
};
