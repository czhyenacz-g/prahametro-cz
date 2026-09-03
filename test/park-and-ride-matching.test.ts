import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { attachMetroStations, matchParkAndRideToStation, MAX_PARK_AND_RIDE_TO_METRO_DISTANCE_METERS } from "../lib/parking/match-metro-station.ts";
import type { MetroEntrance } from "../lib/metro/types.ts";

// Reálné (zaokrouhlené) souřadnice ověřené živě proti Golemio v3 API
// 2026-09-03 — viz docs/PARKING.md pro plnou tabulku. Černý Most má DVA
// vstupy blízko sebe (typické pro velkou přestupní stanici).
const CERNY_MOST_ENTRANCES: MetroEntrance[] = [
  { id: "U897S1E1", stationId: "U897S1", stationName: "Černý Most", entranceLabel: "E1", lat: 50.1096, lon: 14.5798, wheelchair: "yes", lines: ["B"] },
  { id: "U897S1E2", stationId: "U897S1", stationName: "Černý Most", entranceLabel: "E2", lat: 50.11, lon: 14.5788, wheelchair: "yes", lines: ["B"] },
];
const CHODOV_ENTRANCE: MetroEntrance = { id: "U52S1E32", stationId: "U52S1", stationName: "Chodov", entranceLabel: "E32", lat: 50.032088, lon: 14.491964, wheelchair: "yes", lines: ["C"] };

describe("11. Černý Most se při reálných fixture souřadnicích označí jako P+R", () => {
  test("P+R Garáže Černý Most (136 m od vstupu) se přiřadí ke stanici Černý Most", () => {
    const match = matchParkAndRideToStation({ lat: 50.109993, lon: 14.5789655 }, CERNY_MOST_ENTRANCES);
    assert.ok(match);
    assert.equal(match?.metroStationId, "U897S1");
  });
});

describe("12. stanice bez blízkého P+R badge nedostane", () => {
  test("P+R stovky metrů od jediné dostupné (nesouvisející) stanice se nepřiřadí", () => {
    const farAway = { lat: 50.5, lon: 14.9 }; // desítky km od Chodova
    const match = matchParkAndRideToStation(farAway, [CHODOV_ENTRANCE]);
    assert.equal(match, null);
  });
});

describe("13. vzdálené P+R se nepřiřadí násilně (Kotlářka, Braník, Běchovice)", () => {
  test("Kotlářka (~1346 m od Nemocnice Motol) přesahuje limit", () => {
    const kotlarka = { lat: 50.0684575, lon: 14.3571795 };
    const nemocniceMotol: MetroEntrance = { id: "U306S1E3", stationId: "U306S1", stationName: "Nemocnice Motol", entranceLabel: "E3", lat: 50.0563, lon: 14.351, wheelchair: "yes", lines: ["A"] };
    const match = matchParkAndRideToStation(kotlarka, [nemocniceMotol]);
    assert.equal(match, null);
  });

  test("Braník (~3.4 km od Pankráce) přesahuje limit", () => {
    const branik = { lat: 50.02870985, lon: 14.40613275 };
    const pankrac: MetroEntrance = { id: "U385S1E4", stationId: "U385S1", stationName: "Pankrác", entranceLabel: "E4", lat: 50.0489, lon: 14.4383, wheelchair: "yes", lines: ["C"] };
    assert.equal(matchParkAndRideToStation(branik, [pankrac]), null);
  });

  test("Běchovice (~4 km od Černého Mostu) přesahuje limit", () => {
    const bechovice = { lat: 50.084189, lon: 14.617562 };
    assert.equal(matchParkAndRideToStation(bechovice, CERNY_MOST_ENTRANCES), null);
  });
});

describe("14. vzdálenost se počítá k nejbližšímu KONKRÉTNÍMU vstupu, ne ke středu stanice", () => {
  test("blíž k E1 než k E2 vybere E1 jako referenční vzdálenost", () => {
    const nearE1 = { lat: 50.1097, lon: 14.5799 };
    const match = matchParkAndRideToStation(nearE1, CERNY_MOST_ENTRANCES);
    assert.ok(match);
    assert.ok(match!.metroDistanceMeters < 50, `distance was ${match!.metroDistanceMeters}`);
  });
});

describe("15. dvě P+R u jedné stanice zůstanou dvě samostatná parkoviště", () => {
  test("attachMetroStations nesloučí Skalka 1 a Skalka 2, obě zůstávají zvlášť", () => {
    const skalkaEntrance: MetroEntrance = { id: "U953S1E5", stationId: "U953S1", stationName: "Skalka", entranceLabel: "E5", lat: 50.0695, lon: 14.5078, wheelchair: "yes", lines: ["A"] };
    const skalka1 = { id: "skalka-1", name: "P+R Skalka 1", address: null, coordinates: { lat: 50.0695, lon: 14.5078 }, entranceCoordinates: null, capacity: 136, priceLabel: null, reservationPossible: false, sourceUrl: null };
    const skalka2 = { id: "skalka-2", name: "P+R Skalka 2", address: null, coordinates: { lat: 50.0704, lon: 14.5116 }, entranceCoordinates: null, capacity: 78, priceLabel: null, reservationPossible: false, sourceUrl: null };
    const result = attachMetroStations([skalka1, skalka2], [skalkaEntrance]);
    assert.equal(result.length, 2);
    assert.ok(result.some((r) => r.id === "skalka-1"));
    assert.ok(result.some((r) => r.id === "skalka-2"));
  });
});

describe("16. hraniční hodnota maximální vzdálenosti", () => {
  const entrance: MetroEntrance = { id: "U1S1E1", stationId: "U1S1", stationName: "Test", entranceLabel: "E1", lat: 50, lon: 14, wheelchair: "unknown", lines: ["A"] };

  test(`přesně na hranici ${MAX_PARK_AND_RIDE_TO_METRO_DISTANCE_METERS} m se STÁLE přiřadí (<=)`, () => {
    // Aproximace: posun v zeměpisné šířce o X metrů ≈ X / 111_320 stupně.
    const offsetDeg = MAX_PARK_AND_RIDE_TO_METRO_DISTANCE_METERS / 111_320;
    const match = matchParkAndRideToStation({ lat: 50 + offsetDeg, lon: 14 }, [entrance]);
    assert.ok(match, "očekáváno přiřazení přesně na hranici limitu");
  });

  test("těsně nad hranicí se NEpřiřadí", () => {
    const offsetDeg = (MAX_PARK_AND_RIDE_TO_METRO_DISTANCE_METERS + 50) / 111_320;
    const match = matchParkAndRideToStation({ lat: 50 + offsetDeg, lon: 14 }, [entrance]);
    assert.equal(match, null);
  });
});
