import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { isWithinDismissWindow } from "../lib/storage/dismiss-window.ts";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const NOW = 1_700_000_000_000;

describe("isWithinDismissWindow", () => {
  test("žádná uložená hodnota (nikdy nezavřeno) -> false", () => {
    assert.equal(isWithinDismissWindow(null, NOW, THIRTY_DAYS_MS), false);
  });

  test("zavřeno před chvílí -> true (je v okně)", () => {
    const dismissedAt = NOW - 1000;
    assert.equal(isWithinDismissWindow(String(dismissedAt), NOW, THIRTY_DAYS_MS), true);
  });

  test("zavřeno přesně na hraně okna (o 1 ms starší) -> false", () => {
    const dismissedAt = NOW - THIRTY_DAYS_MS - 1;
    assert.equal(isWithinDismissWindow(String(dismissedAt), NOW, THIRTY_DAYS_MS), false);
  });

  test("zavřeno těsně před koncem okna -> stále true", () => {
    const dismissedAt = NOW - THIRTY_DAYS_MS + 1000;
    assert.equal(isWithinDismissWindow(String(dismissedAt), NOW, THIRTY_DAYS_MS), true);
  });

  test("poškozená hodnota v localStorage (ne číslo) -> false, nespadne", () => {
    assert.equal(isWithinDismissWindow("not-a-number", NOW, THIRTY_DAYS_MS), false);
  });

  test("prázdný string -> false", () => {
    assert.equal(isWithinDismissWindow("", NOW, THIRTY_DAYS_MS), false);
  });
});
