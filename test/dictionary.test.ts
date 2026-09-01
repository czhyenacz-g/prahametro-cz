import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { getDictionary, getMainHeading } from "../lib/i18n/dictionary.ts";

describe("getDictionary", () => {
  test("čeština má správné klíčové texty", () => {
    const dict = getDictionary("cs");
    assert.equal(dict.finder.heading, "Kde je nejbližší metro?");
    assert.equal(dict.finder.headingVulgar, "Kde je to zkurvený metro?!!");
    assert.equal(dict.header.subtitle, "Najdi nejbližší vstup a nech se k němu navigovat.");
  });

  test("angličtina má správné klíčové texty", () => {
    const dict = getDictionary("en");
    assert.equal(dict.finder.heading, "Where is the nearest metro?");
    assert.equal(dict.finder.headingVulgar, "Where's the fucking metro?!");
    assert.equal(dict.header.subtitle, "Find the nearest entrance and navigate to it.");
  });
});

describe("getMainHeading", () => {
  test("cs, vypnutý 18+", () => {
    assert.equal(getMainHeading("cs", false), "Kde je nejbližší metro?");
  });

  test("cs, zapnutý 18+", () => {
    assert.equal(getMainHeading("cs", true), "Kde je to zkurvený metro?!!");
  });

  test("en, vypnutý 18+", () => {
    assert.equal(getMainHeading("en", false), "Where is the nearest metro?");
  });

  test("en, zapnutý 18+", () => {
    assert.equal(getMainHeading("en", true), "Where's the fucking metro?!");
  });

  test("vulgarita se zachová při přepnutí jazyka (stejný boolean, jiný jazyk)", () => {
    const vulgarCs = getMainHeading("cs", true);
    const vulgarEn = getMainHeading("en", true);
    assert.notEqual(vulgarCs, vulgarEn);
    // Obě varianty musí zůstat "vulgární" verzí svého jazyka, ne normální hláškou.
    assert.equal(vulgarCs, getDictionary("cs").finder.headingVulgar);
    assert.equal(vulgarEn, getDictionary("en").finder.headingVulgar);
  });
});
