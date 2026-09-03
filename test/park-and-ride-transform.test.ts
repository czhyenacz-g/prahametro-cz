import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { parseGeoJsonPoint } from "../lib/parking/coordinates.ts";
import { derivePriceLabel } from "../lib/parking/price.ts";
import { transformParkingFeature, transformParkingMeasurement } from "../lib/parking/transform.ts";
import type { GolemioParkingFeature, GolemioParkingMeasurement, GolemioParkingTariff } from "../lib/parking/golemio-types.ts";

function validFeature(overrides: Partial<GolemioParkingFeature["properties"]> = {}): GolemioParkingFeature {
  return {
    type: "Feature",
    properties: {
      id: "tsk-offstreet-test",
      primary_source: "tsk-offstreet",
      name: "P+R Test",
      centroid: { type: "Point", coordinates: [14.5, 50.1] },
      capacity: 100,
      parking_policy: "park_and_ride",
      entrances: { features: [] },
      address: { address_formatted: "Testovací 1, Praha" },
      reservation: { reservation_type: null },
      tariff: null,
      ...overrides,
    },
  };
}

describe("1. parseGeoJsonPoint — validní odpověď Golemio", () => {
  test("validní [lon, lat] bod se správně přehodí na {lat, lon}", () => {
    assert.deepEqual(parseGeoJsonPoint([14.5, 50.1]), { lat: 50.1, lon: 14.5 });
  });
});

describe("2./3. parseGeoJsonPoint — neplatné/chybějící souřadnice, GeoJSON lon,lat pořadí", () => {
  test("prohozené pořadí by dalo neplatnou latitude nad 90 — ověřuje se správné pořadí", () => {
    // lon=140 (validní), lat=50 -> pokud bychom pořadí spletli, lat by bylo 140 (neplatné).
    const point = parseGeoJsonPoint([140, 50]);
    assert.deepEqual(point, { lat: 50, lon: 140 });
  });

  test("chybějící coordinates -> null", () => {
    assert.equal(parseGeoJsonPoint(undefined), null);
  });

  test("lat mimo rozsah (-90..90) -> null", () => {
    assert.equal(parseGeoJsonPoint([14.5, 91]), null);
  });

  test("lon mimo rozsah (-180..180) -> null", () => {
    assert.equal(parseGeoJsonPoint([181, 50]), null);
  });

  test("NaN/Infinity -> null", () => {
    assert.equal(parseGeoJsonPoint([NaN, 50]), null);
    assert.equal(parseGeoJsonPoint([Infinity, 50]), null);
  });

  test("není pole -> null", () => {
    assert.equal(parseGeoJsonPoint("14.5,50.1"), null);
  });
});

describe("transformParkingFeature — validace a odmítání", () => {
  test("validní feature se transformuje", () => {
    const result = transformParkingFeature(validFeature(), null);
    assert.ok(result);
    assert.equal(result?.id, "tsk-offstreet-test");
    assert.equal(result?.name, "P+R Test");
    assert.deepEqual(result?.coordinates, { lat: 50.1, lon: 14.5 });
  });

  test("chybějící id -> null (odmítnuto)", () => {
    assert.equal(transformParkingFeature(validFeature({ id: undefined }), null), null);
  });

  test("chybějící název -> null", () => {
    assert.equal(transformParkingFeature(validFeature({ name: undefined }), null), null);
  });

  test("neplatné souřadnice -> null (celý záznam odmítnut, ne jen souřadnice)", () => {
    assert.equal(transformParkingFeature(validFeature({ centroid: { coordinates: [999, 999] } }), null), null);
  });

  test("6. záporná kapacita se odmítne (capacity = null)", () => {
    const result = transformParkingFeature(validFeature({ capacity: -5 }), null);
    assert.equal(result?.capacity, null);
  });

  test("chybějící kapacita -> null, ne 0", () => {
    const result = transformParkingFeature(validFeature({ capacity: null }), null);
    assert.equal(result?.capacity, null);
  });

  test("automobilový vjezd (entry=true, entrance_type obsahuje car) se najde", () => {
    const feature = validFeature({
      entrances: {
        features: [
          { geometry: { coordinates: [14.49, 50.03] }, properties: { entry: false, exit: true, entrance_type: ["car"] } },
          { geometry: { coordinates: [14.492, 50.032] }, properties: { entry: true, exit: false, entrance_type: ["car", "walk"] } },
        ],
      },
    });
    const result = transformParkingFeature(feature, null);
    assert.deepEqual(result?.entranceCoordinates, { lat: 50.032, lon: 14.492 });
  });

  test("žádný automobilový vjezd -> entranceCoordinates je null (fallback na centroid řeší až driving-navigation-links.ts)", () => {
    const result = transformParkingFeature(validFeature({ entrances: { features: [] } }), null);
    assert.equal(result?.entranceCoordinates, null);
  });

  test("reservation_type 'possible' -> reservationPossible true", () => {
    const result = transformParkingFeature(validFeature({ reservation: { reservation_type: "possible" } }), null);
    assert.equal(result?.reservationPossible, true);
  });

  test("reservation_type null (Golemio výchozí stav u pražských P+R) -> reservationPossible false, ne null", () => {
    const result = transformParkingFeature(validFeature({ reservation: { reservation_type: null } }), null);
    assert.equal(result?.reservationPossible, false);
  });
});

describe("4./5. transformParkingMeasurement — freeSpaces=0 vs null, záporná čísla", () => {
  function measurement(overrides: Partial<GolemioParkingMeasurement> = {}): GolemioParkingMeasurement {
    return { parking_id: "test-id", total_spot_number: 100, free_spot_number: 10, occupied_spot_number: 90, last_updated: "2026-09-03T08:00:00.000Z", ...overrides };
  }

  test("freeSpaces = 0 zůstane 0, ne null", () => {
    const result = transformParkingMeasurement(measurement({ free_spot_number: 0 }));
    assert.equal(result?.freeSpaces, 0);
  });

  test("freeSpaces = null znamená neznámou obsazenost", () => {
    const result = transformParkingMeasurement(measurement({ free_spot_number: null }));
    assert.equal(result?.freeSpaces, null);
  });

  test("záporné freeSpaces se bere jako neplatné (null)", () => {
    const result = transformParkingMeasurement(measurement({ free_spot_number: -1 }));
    assert.equal(result?.freeSpaces, null);
  });

  test("chybějící parking_id -> celé měření null", () => {
    assert.equal(transformParkingMeasurement(measurement({ parking_id: undefined })), null);
  });
});

describe("derivePriceLabel — jen bezpečně čitelné případy, viz lib/parking/price.ts", () => {
  test("free_of_charge -> 'Zdarma'", () => {
    const tariff: GolemioParkingTariff = { id: "t1", charge_bands: [{ free_of_charge: true, charges: [] }] };
    assert.equal(derivePriceLabel(tariff), "Zdarma");
  });

  test("jeden charge s intervalem přesně 24h (86400s) -> '{X} Kč / 24 hodin'", () => {
    const tariff: GolemioParkingTariff = {
      id: "t2",
      charge_bands: [{ free_of_charge: false, charges: [{ charge: "50", charge_interval: 86_400, charge_type: "other" }] }],
    };
    assert.equal(derivePriceLabel(tariff), "50 Kč / 24 hodin");
  });

  test("hodinová sazba (interval 3600s, jako reálná Roztyly) -> null, ne odhad", () => {
    const tariff: GolemioParkingTariff = {
      id: "t3",
      charge_bands: [{ free_of_charge: false, charges: [{ charge: "50", charge_interval: 3_600, charge_type: "other" }] }],
    };
    assert.equal(derivePriceLabel(tariff), null);
  });

  test("víc charge bands -> null (příliš složité na bezpečný výpočet)", () => {
    const tariff: GolemioParkingTariff = {
      id: "t4",
      charge_bands: [
        { free_of_charge: false, charges: [{ charge: "50", charge_interval: 86_400, charge_type: "other" }] },
        { free_of_charge: false, charges: [{ charge: "100", charge_interval: 86_400, charge_type: "other" }] },
      ],
    };
    assert.equal(derivePriceLabel(tariff), null);
  });

  test("null tarif -> null", () => {
    assert.equal(derivePriceLabel(null), null);
  });
});
