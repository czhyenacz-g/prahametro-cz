import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { pickNavigationPlatform, selectNearestStopGroups } from "../lib/night-transport/select-results.ts";
import type { NightPlatform, NightStopGroup } from "../lib/night-transport/types.ts";

describe("selectNearestStopGroups", () => {
  test("8. vybere tři nejbližší RŮZNÉ zastávkové skupiny, seřazené vzestupně", () => {
    const groups: NightStopGroup[] = [
      { id: "a", name: "A", lat: 50.0, lon: 14.0, lines: ["91"] },
      { id: "b", name: "B", lat: 50.001, lon: 14.001, lines: ["901"] },
      { id: "c", name: "C", lat: 50.1, lon: 14.1, lines: ["91"] },
      { id: "d", name: "D", lat: 50.5, lon: 14.5, lines: ["951"] },
    ];
    const result = selectNearestStopGroups({ lat: 50.0, lon: 14.0 }, groups, 3);
    assert.deepEqual(result.map((r) => r.id), ["a", "b", "c"]);
    assert.equal(new Set(result.map((r) => r.id)).size, 3);
  });
});

describe("pickNavigationPlatform", () => {
  test("9. vybere nejbližší fyzický označník ke skutečné navigaci, ne první v poli", () => {
    const platforms: NightPlatform[] = [
      { id: "far", platformCode: "A", lat: 50.5, lon: 14.5, lines: ["91"] },
      { id: "near", platformCode: "B", lat: 50.0001, lon: 14.0001, lines: ["91"] },
    ];
    const result = pickNavigationPlatform({ lat: 50.0, lon: 14.0 }, platforms);
    assert.equal(result?.id, "near");
  });

  test("prázdný seznam nástupišť -> null, nespadne", () => {
    assert.equal(pickNavigationPlatform({ lat: 50.0, lon: 14.0 }, []), null);
  });
});
