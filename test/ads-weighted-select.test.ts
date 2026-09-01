import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { weightedSelect } from "../lib/ads/weighted-select.ts";

type Item = { id: string; weight: number };

describe("weightedSelect", () => {
  test("8. deterministický výběr podle injectované náhodné hodnoty", () => {
    const items: Item[] = [
      { id: "a", weight: 70 },
      { id: "b", weight: 30 },
    ];
    // Kumulativní hranice: a = [0,70), b = [70,100).
    assert.equal(weightedSelect(items, () => 0)?.id, "a");
    assert.equal(weightedSelect(items, () => 0.69)?.id, "a");
    assert.equal(weightedSelect(items, () => 0.7)?.id, "b");
    assert.equal(weightedSelect(items, () => 0.999999)?.id, "b");
  });

  test("weight: 70 z celkové váhy 100 zabírá přesně 70% intervalu roll hodnot", () => {
    const items: Item[] = [
      { id: "heavy", weight: 70 },
      { id: "light", weight: 30 },
    ];
    let heavyCount = 0;
    const samples = 1000;
    for (let i = 0; i < samples; i++) {
      const roll = i / samples; // rovnoměrně rozložené vzorky [0,1)
      if (weightedSelect(items, () => roll)?.id === "heavy") heavyCount++;
    }
    assert.equal(heavyCount, 700);
  });

  test("9. odmítnutí nulové, záporné, NaN a nekonečné váhy", () => {
    const items: Item[] = [
      { id: "zero", weight: 0 },
      { id: "negative", weight: -5 },
      { id: "nan", weight: NaN },
      { id: "infinite", weight: Infinity },
      { id: "valid", weight: 10 },
    ];
    // Bez ohledu na roll hodnotu se vždy vybere jediná platná kampaň.
    for (const roll of [0, 0.25, 0.5, 0.75, 0.999]) {
      assert.equal(weightedSelect(items, () => roll)?.id, "valid");
    }
  });

  test("žádná platná váha -> null, nespadne", () => {
    const items: Item[] = [{ id: "zero", weight: 0 }, { id: "nan", weight: NaN }];
    assert.equal(weightedSelect(items, () => 0.5), null);
  });

  test("prázdné pole -> null", () => {
    assert.equal(weightedSelect([], () => 0.5), null);
  });

  test("Math.random je bezpečný výchozí zdroj (nevyžaduje explicitní random parametr)", () => {
    const items: Item[] = [{ id: "only", weight: 10 }];
    assert.equal(weightedSelect(items)?.id, "only");
  });
});
