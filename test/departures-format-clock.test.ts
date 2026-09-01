import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { formatClockTime } from "../lib/departures/format-clock.ts";

describe("formatClockTime", () => {
  test("běžný čas dopoledne/odpoledne", () => {
    assert.equal(formatClockTime(22 * 3600 + 41 * 60), "22:41");
    assert.equal(formatClockTime(9 * 3600 + 5 * 60), "09:05");
  });

  test("7. GTFS čas > 24:00:00 se normalizuje na skutečný hodinový čas, ne '24:xx'", () => {
    assert.equal(formatClockTime(24 * 3600 + 35 * 60), "00:35");
    assert.equal(formatClockTime(25 * 3600), "01:00");
  });

  test("přesná půlnoc", () => {
    assert.equal(formatClockTime(0), "00:00");
    assert.equal(formatClockTime(86_400), "00:00");
  });

  test("záporné sekundy (obranně) se normalizují do 0..86399", () => {
    assert.equal(formatClockTime(-60), "23:59");
  });
});
