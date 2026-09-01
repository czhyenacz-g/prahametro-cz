import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { DEPARTURES_STALE_AFTER_DAYS, isDeparturesDataStale } from "../lib/departures/freshness.ts";

describe("isDeparturesDataStale", () => {
  test("19. čerstvá data (dnes) nejsou zastaralá", () => {
    const now = new Date("2026-09-08T12:00:00Z");
    assert.equal(isDeparturesDataStale("2026-09-08T06:00:00Z", now), false);
  });

  test(`19. data starší než ${DEPARTURES_STALE_AFTER_DAYS} dny jsou zastaralá`, () => {
    const now = new Date("2026-09-08T12:00:00Z");
    const staleGeneratedAt = new Date(now.getTime() - (DEPARTURES_STALE_AFTER_DAYS + 1) * 24 * 60 * 60 * 1000).toISOString();
    assert.equal(isDeparturesDataStale(staleGeneratedAt, now), true);
  });

  test("data přesně na hranici prahu ještě nejsou zastaralá (striktně větší, ne >=)", () => {
    const now = new Date("2026-09-08T12:00:00Z");
    const boundary = new Date(now.getTime() - DEPARTURES_STALE_AFTER_DAYS * 24 * 60 * 60 * 1000).toISOString();
    assert.equal(isDeparturesDataStale(boundary, now), false);
  });

  test("neplatné/nečitelné generatedAt se bezpečně považuje za zastaralé, nespadne", () => {
    const now = new Date("2026-09-08T12:00:00Z");
    assert.equal(isDeparturesDataStale("not-a-date", now), true);
  });
});
