import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { formatUpdatedDate } from "../lib/departures/format-updated-date.ts";

describe("formatUpdatedDate", () => {
  test("český čitelný formát data", () => {
    assert.equal(formatUpdatedDate("2026-09-01T13:27:36.936Z", "cs"), "1. 9. 2026");
  });

  test("anglický čitelný formát data", () => {
    assert.equal(formatUpdatedDate("2026-09-01T13:27:36.936Z", "en"), "Sep 1, 2026");
  });

  test("neplatný vstup -> prázdný řetězec, nespadne", () => {
    assert.doesNotThrow(() => formatUpdatedDate("not-a-date", "cs"));
    assert.equal(formatUpdatedDate("not-a-date", "cs"), "");
  });
});
