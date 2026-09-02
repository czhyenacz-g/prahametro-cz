import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { getNightCta, getNightDictionary } from "../lib/i18n/night-dictionary.ts";

describe("getNightCta — 18+ režim mění JEN CTA text, stejný vzorec jako getMainHeading na homepage, pro všechny 4 jazyky", () => {
  test("cs: nevulgární vs. vulgární varianta", () => {
    assert.equal(getNightCta("cs", false), "Kde je nejbližší noční spoj?");
    assert.equal(getNightCta("cs", true), "Kde je ten zasranej noční spoj?!!");
  });

  test("en: nevulgární vs. vulgární varianta", () => {
    assert.equal(getNightCta("en", false), "Find the nearest night transport");
    assert.equal(getNightCta("en", true), "Where's the fucking night bus?!");
  });

  test("de: nevulgární vs. vulgární varianta", () => {
    assert.equal(getNightCta("de", false), "Nächste Nachtverbindung finden");
    assert.equal(getNightCta("de", true), "Wo ist die verdammte Nachtverbindung?!!");
  });

  test("uk: nevulgární vs. vulgární varianta", () => {
    assert.equal(getNightCta("uk", false), "Знайти найближчий нічний транспорт");
    assert.equal(getNightCta("uk", true), "Де цей довбаний нічний транспорт?!!");
  });

  test("vulgarita se zachová při přepnutí jazyka (stejný boolean, jiný jazyk) — 4 různé texty, ne zopakovaný fallback", () => {
    const variants = (["cs", "en", "de", "uk"] as const).map((locale) => getNightCta(locale, true));
    assert.equal(new Set(variants).size, 4);
    for (const locale of ["cs", "en", "de", "uk"] as const) {
      assert.equal(getNightCta(locale, true), getNightDictionary(locale).ctaVulgar);
    }
  });

  test("vypnutý 18+ vrací stejný text jako dict.cta pro všechny jazyky", () => {
    for (const locale of ["cs", "en", "de", "uk"] as const) {
      assert.equal(getNightCta(locale, false), getNightDictionary(locale).cta);
    }
  });
});
