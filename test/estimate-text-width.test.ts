import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { estimateTextWidth } from "../lib/map/estimate-text-width.ts";

describe("estimateTextWidth", () => {
  test("delší jméno stanice vrací větší šířku", () => {
    assert.ok(estimateTextWidth("Muzeum", false) < estimateTextWidth("Hlavní nádraží", false));
  });

  test("tučné (přestupní) jméno je při stejném textu širší než netučné", () => {
    const name = "Můstek";
    assert.ok(estimateTextWidth(name, true) > estimateTextWidth(name, false));
  });

  test("prázdný řetězec vrací 0", () => {
    assert.equal(estimateTextWidth("", false), 0);
  });

  test("vrací kladné číslo pro běžný název", () => {
    assert.ok(estimateTextWidth("Skalka", false) > 0);
  });
});
