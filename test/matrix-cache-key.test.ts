import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { buildMatrixCacheKey } from "../lib/routing/matrix-cache-key.ts";

describe("buildMatrixCacheKey", () => {
  test("stejná poloha (na 4 desetinná místa) a stejní kandidáti dají stejný klíč", () => {
    const a = buildMatrixCacheKey({ lat: 50.08111, lon: 14.42222 }, ["e2", "e1"], "foot_fast");
    const b = buildMatrixCacheKey({ lat: 50.08113, lon: 14.42221 }, ["e1", "e2"], "foot_fast");
    assert.equal(a, b);
  });

  test("znatelně jiná poloha dá jiný klíč", () => {
    const a = buildMatrixCacheKey({ lat: 50.08, lon: 14.42 }, ["e1"], "foot_fast");
    const b = buildMatrixCacheKey({ lat: 50.09, lon: 14.42 }, ["e1"], "foot_fast");
    assert.notEqual(a, b);
  });

  test("jiná sada kandidátů dá jiný klíč", () => {
    const a = buildMatrixCacheKey({ lat: 50.08, lon: 14.42 }, ["e1"], "foot_fast");
    const b = buildMatrixCacheKey({ lat: 50.08, lon: 14.42 }, ["e1", "e2"], "foot_fast");
    assert.notEqual(a, b);
  });
});
