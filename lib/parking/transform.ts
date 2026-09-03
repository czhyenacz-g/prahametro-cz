import { parseGeoJsonPoint } from "./coordinates.ts";
import { derivePriceLabel } from "./price.ts";
import type {
  GolemioParkingFeature,
  GolemioParkingMeasurement,
  GolemioParkingTariff,
} from "./golemio-types.ts";
import type { Coordinates, ParkAndRide, ParkingOccupancy } from "./types.ts";

const PARKING_PRAHA_EU_URL = "https://parking.praha.eu/cs/moznosti-parkovani-v-praze/pr-park-ride/";

function findCarEntrance(feature: GolemioParkingFeature): Coordinates | null {
  const entrances = feature.properties?.entrances?.features ?? [];
  for (const entrance of entrances) {
    const props = entrance.properties;
    if (!props?.entry || !props.entrance_type?.includes("car")) continue;
    const point = parseGeoJsonPoint(entrance.geometry?.coordinates);
    if (point) return point;
  }
  return null;
}

/**
 * `reservation_type` u pražských (tsk-offstreet) P+R je v Golemio datech
 * momentálně vždy `null` (ověřeno živě 2026-09-03) — Golemio tedy
 * NEPOSKYTUJE pozitivní potvrzení "nelze rezervovat" jako hodnotu pole.
 * Oficiální parking.praha.eu ale explicitně uvádí "Parkovací místa není
 * možné předem rezervovat" pro celou tuhle síť P+R, viz
 * PARKING_PRAHA_EU_URL výše. `true` vracíme jen při výslovném Golemio
 * potvrzení (possible/required) — jinak vždy `false`, nikdy `null`,
 * protože pro tenhle konkrétní zdroj (tsk-offstreet) máme nezávislé
 * oficiální potvrzení opaku (viz zadání "neslibuj dostupné místo").
 */
function resolveReservationPossible(reservationType: string | null | undefined): boolean {
  return reservationType === "possible" || reservationType === "required";
}

/**
 * Golemio `Parking` feature -> náš interní `ParkAndRide` (bez
 * `metroStationId`/`metroDistanceMeters` — ty doplní až
 * `match-metro-station.ts`, tahle funkce o metru nic neví). Vrací
 * `null` (NE throw) pro cokoliv, co nesplňuje minimální požadavky —
 * viz zadání "runtime validace, odmítnout neplatné souřadnice" —
 * volající (scripts/import-park-and-ride.ts) neplatné záznamy jen
 * přeskočí a zaloguje, import kvůli jednomu rozbitému záznamu nespadne.
 */
export function transformParkingFeature(
  feature: GolemioParkingFeature,
  tariff: GolemioParkingTariff | null
): Omit<ParkAndRide, "metroStationId" | "metroDistanceMeters"> | null {
  const props = feature.properties;
  if (!props?.id || !props.name) return null;

  const coordinates = parseGeoJsonPoint(props.centroid?.coordinates);
  if (!coordinates) return null;

  const capacity = typeof props.capacity === "number" && props.capacity >= 0 ? props.capacity : null;

  return {
    id: props.id,
    name: props.name,
    address: props.address?.address_formatted ?? null,
    coordinates,
    entranceCoordinates: findCarEntrance(feature),
    capacity,
    priceLabel: derivePriceLabel(tariff),
    reservationPossible: resolveReservationPossible(props.reservation?.reservation_type),
    sourceUrl: PARKING_PRAHA_EU_URL,
  };
}

/**
 * Golemio `ParkingOccupancyMeasurement` -> náš `ParkingOccupancy`.
 * `freeSpaces = 0` (skutečně nula volných míst) se MUSÍ odlišit od
 * chybějícího/neplatného měření (`null`) — viz zadání "nula znamená
 * plno, nikoliv neznámý údaj". Proto explicitní `typeof === "number"`
 * test, ne `?? null` (to by 0 nechalo projít správně, ale je to snazší
 * si nechtěně rozbít při budoucí úpravě, proto radši explicitně).
 * Záporná čísla se berou jako neplatné měření (`null`) — obsazenost
 * nikdy nemůže být záporná.
 */
export function transformParkingMeasurement(measurement: GolemioParkingMeasurement): ParkingOccupancy | null {
  if (!measurement.parking_id) return null;

  const toNonNegativeOrNull = (value: number | null | undefined): number | null =>
    typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;

  return {
    parkingId: measurement.parking_id,
    freeSpaces: toNonNegativeOrNull(measurement.free_spot_number),
    totalSpaces: toNonNegativeOrNull(measurement.total_spot_number),
    occupiedSpaces: toNonNegativeOrNull(measurement.occupied_spot_number),
    updatedAt: measurement.last_updated ?? null,
  };
}
