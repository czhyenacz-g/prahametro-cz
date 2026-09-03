// Syrové tvary odpovědí Golemio v3 Parking API — ověřeno živě
// 2026-09-03 (skutečné volání /v3/parking, /v3/parking-measurements,
// /v3/parking-tariffs/{id} s reálným tokenem) a proti oficiálně
// generovanému SDK (github.com/SmallhillCZ/golemio-sdk, OpenAPI
// dokumentace). Nikdy nepoužívej `any` — neznámá/nepoužitá pole necháme
// jako `unknown`/volitelná, ne že bychom se spoléhali na `any`.

export type GolemioParkingEntranceProperties = {
  entry?: boolean | null;
  exit?: boolean | null;
  entrance_type?: string[] | null;
};

export type GolemioParkingEntrance = {
  geometry?: { type?: string; coordinates?: unknown };
  properties?: GolemioParkingEntranceProperties;
};

export type GolemioParkingAddress = {
  address_formatted?: string | null;
};

export type GolemioParkingReservation = {
  reservation_type?: "possible" | "not_possible" | "required" | null;
};

export type GolemioParkingProperties = {
  id?: string;
  primary_source?: string;
  name?: string | null;
  centroid?: { type?: string; coordinates?: unknown };
  capacity?: number | null;
  parking_policy?: string | null;
  entrances?: { features?: GolemioParkingEntrance[] } | null;
  address?: GolemioParkingAddress | null;
  reservation?: GolemioParkingReservation | null;
  tariff?: string | null;
  has_occupancy_info?: boolean | null;
};

export type GolemioParkingFeature = {
  type?: string;
  geometry?: unknown;
  properties?: GolemioParkingProperties;
};

export type GolemioParkingResponse = {
  type?: string;
  features?: GolemioParkingFeature[];
};

export type GolemioParkingMeasurement = {
  parking_id?: string;
  total_spot_number?: number | null;
  free_spot_number?: number | null;
  occupied_spot_number?: number | null;
  last_updated?: string | null;
};

export type GolemioChargeInterval = {
  charge?: string;
  charge_interval?: number;
  charge_type?: string;
};

export type GolemioChargeBand = {
  free_of_charge?: boolean | null;
  charges?: GolemioChargeInterval[] | null;
};

export type GolemioParkingTariff = {
  id?: string;
  charge_bands?: GolemioChargeBand[] | null;
};
