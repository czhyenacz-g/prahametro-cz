import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { mergeParkAndRideWithOccupancy } from "../lib/parking/merge-occupancy.ts";
import { resolveOccupancyDisplay } from "../lib/parking/occupancy-display.ts";
import type { ParkAndRide, ParkingOccupancy } from "../lib/parking/types.ts";

function pr(overrides: Partial<ParkAndRide> = {}): ParkAndRide {
  return {
    id: "pr-1",
    name: "P+R Test",
    address: null,
    coordinates: { lat: 50.1, lon: 14.5 },
    entranceCoordinates: null,
    capacity: 100,
    priceLabel: null,
    reservationPossible: false,
    metroStationId: "U1S1",
    metroDistanceMeters: 100,
    sourceUrl: null,
    ...overrides,
  };
}

describe("7./8. mergeParkAndRideWithOccupancy — spojení podle stabilního ID, chybějící měření nezruší metadata", () => {
  test("P+R s odpovídajícím měřením dostane occupancy", () => {
    const occupancy: ParkingOccupancy = { parkingId: "pr-1", freeSpaces: 5, totalSpaces: 100, occupiedSpaces: 95, updatedAt: "2026-09-03T08:00:00.000Z" };
    const result = mergeParkAndRideWithOccupancy([pr()], new Map([["pr-1", occupancy]]));
    assert.equal(result[0].occupancy?.freeSpaces, 5);
  });

  test("P+R bez měření dostane occupancy: null, ale metadata zůstávají", () => {
    const result = mergeParkAndRideWithOccupancy([pr({ name: "P+R Bez měření" })], new Map());
    assert.equal(result[0].occupancy, null);
    assert.equal(result[0].name, "P+R Bez měření");
  });

  test("měření pro cizí ID se nepřiřadí špatnému P+R", () => {
    const occupancy: ParkingOccupancy = { parkingId: "jiny-parking", freeSpaces: 5, totalSpaces: 100, occupiedSpaces: 95, updatedAt: "2026-09-03T08:00:00.000Z" };
    const result = mergeParkAndRideWithOccupancy([pr()], new Map([["jiny-parking", occupancy]]));
    assert.equal(result[0].occupancy, null);
  });
});

describe("resolveOccupancyDisplay — 9./10. zastaralé měření, výpadek API", () => {
  const now = new Date("2026-09-03T08:30:00.000Z");

  test("freeSpaces = 0 je 'fresh' s band 'red', ne 'unmeasured'", () => {
    const occupancy: ParkingOccupancy = { parkingId: "pr-1", freeSpaces: 0, totalSpaces: 100, occupiedSpaces: 100, updatedAt: "2026-09-03T08:29:00.000Z" };
    const result = resolveOccupancyDisplay(pr(), occupancy, false, now);
    assert.equal(result.kind, "fresh");
    if (result.kind === "fresh") {
      assert.equal(result.freeSpaces, 0);
      assert.equal(result.band, "red");
    }
  });

  test("freeSpaces = null je 'unmeasured'", () => {
    const occupancy: ParkingOccupancy = { parkingId: "pr-1", freeSpaces: null, totalSpaces: null, occupiedSpaces: null, updatedAt: null };
    const result = resolveOccupancyDisplay(pr({ capacity: 692 }), occupancy, false, now);
    assert.deepEqual(result, { kind: "unmeasured", capacity: 692 });
  });

  test("žádné measurement vůbec (null) je 'unmeasured'", () => {
    const result = resolveOccupancyDisplay(pr({ capacity: 692 }), null, false, now);
    assert.deepEqual(result, { kind: "unmeasured", capacity: 692 });
  });

  test("měření starší než 15 minut je 'stale', ne 'fresh'", () => {
    const occupancy: ParkingOccupancy = { parkingId: "pr-1", freeSpaces: 5, totalSpaces: 100, occupiedSpaces: 95, updatedAt: "2026-09-03T08:10:00.000Z" };
    const result = resolveOccupancyDisplay(pr(), occupancy, false, now);
    assert.equal(result.kind, "stale");
    if (result.kind === "stale") assert.equal(result.freeSpaces, 5);
  });

  test("měření staré přesně 14 minut je pořád 'fresh'", () => {
    const occupancy: ParkingOccupancy = { parkingId: "pr-1", freeSpaces: 5, totalSpaces: 100, occupiedSpaces: 95, updatedAt: "2026-09-03T08:16:00.000Z" };
    const result = resolveOccupancyDisplay(pr(), occupancy, false, now);
    assert.equal(result.kind, "fresh");
  });

  test("10. výpadek fetch (fetchFailed=true) je vždy 'load-error', i kdyby occupancy něco obsahovalo", () => {
    const occupancy: ParkingOccupancy = { parkingId: "pr-1", freeSpaces: 5, totalSpaces: 100, occupiedSpaces: 95, updatedAt: "2026-09-03T08:29:00.000Z" };
    const result = resolveOccupancyDisplay(pr({ capacity: 100 }), occupancy, true, now);
    assert.deepEqual(result, { kind: "load-error", capacity: 100 });
  });

  test("zelená barva při >10 % volných míst", () => {
    const occupancy: ParkingOccupancy = { parkingId: "pr-1", freeSpaces: 20, totalSpaces: 100, occupiedSpaces: 80, updatedAt: "2026-09-03T08:29:00.000Z" };
    const result = resolveOccupancyDisplay(pr(), occupancy, false, now);
    assert.equal(result.kind, "fresh");
    if (result.kind === "fresh") assert.equal(result.band, "green");
  });

  test("oranžová barva při 1–10 % volných míst", () => {
    const occupancy: ParkingOccupancy = { parkingId: "pr-1", freeSpaces: 5, totalSpaces: 100, occupiedSpaces: 95, updatedAt: "2026-09-03T08:29:00.000Z" };
    const result = resolveOccupancyDisplay(pr(), occupancy, false, now);
    assert.equal(result.kind, "fresh");
    if (result.kind === "fresh") assert.equal(result.band, "orange");
  });
});
