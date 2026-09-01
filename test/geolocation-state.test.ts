import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { mapGeolocationErrorCode } from "../lib/metro/geolocation-state.ts";

describe("mapGeolocationErrorCode", () => {
  test("1 = PERMISSION_DENIED -> denied", () => {
    assert.equal(mapGeolocationErrorCode(1), "denied");
  });

  test("2 = POSITION_UNAVAILABLE -> unavailable", () => {
    assert.equal(mapGeolocationErrorCode(2), "unavailable");
  });

  test("3 = TIMEOUT -> timeout", () => {
    assert.equal(mapGeolocationErrorCode(3), "timeout");
  });

  test("neznámý kód -> unavailable (bezpečný fallback)", () => {
    assert.equal(mapGeolocationErrorCode(99), "unavailable");
  });
});
