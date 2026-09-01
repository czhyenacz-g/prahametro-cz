import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { detectBrowserLocale } from "../lib/i18n/detect-locale.ts";

describe("detectBrowserLocale", () => {
  test("en-US / en-GB / en -> en", () => {
    assert.equal(detectBrowserLocale("en-US"), "en");
    assert.equal(detectBrowserLocale("en-GB"), "en");
    assert.equal(detectBrowserLocale("en"), "en");
  });

  test("cs-CZ / de-DE / cokoliv jiného -> cs (výchozí)", () => {
    assert.equal(detectBrowserLocale("cs-CZ"), "cs");
    assert.equal(detectBrowserLocale("de-DE"), "cs");
    assert.equal(detectBrowserLocale("fr-FR"), "cs");
  });

  test("null/undefined/prázdný řetězec -> cs (výchozí)", () => {
    assert.equal(detectBrowserLocale(null), "cs");
    assert.equal(detectBrowserLocale(undefined), "cs");
    assert.equal(detectBrowserLocale(""), "cs");
  });

  test("case-insensitive (EN-us)", () => {
    assert.equal(detectBrowserLocale("EN-us"), "en");
  });
});
