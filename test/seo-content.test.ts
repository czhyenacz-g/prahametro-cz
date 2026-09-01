import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { getSeoContent } from "../lib/seo/content.ts";
import { getDictionary } from "../lib/i18n/dictionary.ts";

describe("getSeoContent — title/description (2./3./4.)", () => {
  test("český title a description přesně podle zadání", () => {
    const seo = getSeoContent("cs");
    assert.equal(seo.title, "Nejbližší metro v Praze – vstupy a pěší navigace | KdeJeMetro.cz");
    assert.equal(
      seo.description,
      "Najděte nejbližší vstup do pražského metra podle své polohy. Otevřete pěší navigaci v Google Maps, Apple Maps nebo Mapy.com."
    );
    assert.equal(seo.mainHeading, "Kde je nejbližší metro v Praze?");
    assert.equal(seo.ogLocale, "cs_CZ");
  });

  test("anglický title a description přesně podle zadání", () => {
    const seo = getSeoContent("en");
    assert.equal(seo.title, "Nearest Prague Metro Entrance & Walking Directions | KdeJeMetro.cz");
    assert.equal(seo.description, "Find the nearest entrance to the Prague Metro and open walking directions in Google Maps, Apple Maps or Mapy.com.");
    assert.equal(seo.mainHeading, "Find the nearest Prague Metro entrance");
    assert.equal(seo.ogLocale, "en_US");
  });

  test("title/description jsou pro cs a en odlišné (žádné sdílené natvrdo)", () => {
    const cs = getSeoContent("cs");
    const en = getSeoContent("en");
    assert.notEqual(cs.title, en.title);
    assert.notEqual(cs.description, en.description);
  });

  test("nikde není meta keywords (žádné pole 'keywords' v SEO obsahu)", () => {
    for (const locale of ["cs", "en"] as const) {
      assert.equal("keywords" in getSeoContent(locale), false);
    }
  });
});

describe("tematický rozcestník — 12. odkazy vedou jen na existující kotvy", () => {
  function knownAnchorIds(locale: "cs" | "en"): Set<string> {
    const dict = getDictionary(locale);
    const seo = getSeoContent(locale);
    return new Set([dict.finder.sectionId, dict.map.sectionId, seo.intro.id, seo.howItWorks.id, seo.howItWorks.privacyId, seo.faq.id]);
  }

  test("české odkazy míří jen na kotvy, které appka skutečně vykresluje", () => {
    const ids = knownAnchorIds("cs");
    const seo = getSeoContent("cs");
    for (const link of seo.links.items) {
      assert.match(link.href, /^#/, `odkaz "${link.label}" musí být kotva na aktuální stránce`);
      const target = link.href.slice(1);
      assert.ok(ids.has(target), `odkaz "${link.label}" -> "${link.href}" nemíří na žádné existující id (${[...ids].join(", ")})`);
    }
  });

  test("anglické odkazy míří jen na kotvy, které appka skutečně vykresluje, a používají anglická id", () => {
    const ids = knownAnchorIds("en");
    const seo = getSeoContent("en");
    for (const link of seo.links.items) {
      assert.match(link.href, /^#/, `link "${link.label}" must be an on-page anchor`);
      const target = link.href.slice(1);
      assert.ok(ids.has(target), `link "${link.label}" -> "${link.href}" doesn't point to any rendered id (${[...ids].join(", ")})`);
    }
  });

  test("žádný odkaz nemíří na cizí/neexistující cestu (jen '#...' kotvy, nikdy jiná URL)", () => {
    for (const locale of ["cs", "en"] as const) {
      for (const link of getSeoContent(locale).links.items) {
        assert.doesNotMatch(link.href, /^https?:/);
        assert.doesNotMatch(link.href, /^\/(?!$)/); // žádná jiná interní cesta než "#..."
      }
    }
  });

  test("české odkazy zůstávají v české sadě id, anglické v anglické (žádné křížení)", () => {
    const csIds = knownAnchorIds("cs");
    const enIds = knownAnchorIds("en");
    const overlap = [...csIds].filter((id) => enIds.has(id));
    assert.deepEqual(overlap, []);
  });
});

describe("FAQ obsah (8.)", () => {
  test("cs i en mají přesně 6 otázek, včetně otázky na Brno", () => {
    const cs = getSeoContent("cs").faq.items;
    const en = getSeoContent("en").faq.items;
    assert.equal(cs.length, 6);
    assert.equal(en.length, 6);
    assert.ok(cs.some((i) => i.question === "Má Brno metro?"));
    assert.ok(en.some((i) => i.question === "Does Brno have a metro?"));
  });

  test("odpověď na vzdálenost jasně rozlišuje vzdušnou čáru od skutečné trasy (cs/en)", () => {
    const csAnswer = getSeoContent("cs").faq.items.find((i) => i.question.includes("pěší trasa"))?.answer ?? "";
    const enAnswer = getSeoContent("en").faq.items.find((i) => i.question.includes("walking route"))?.answer ?? "";
    assert.match(csAnswer, /vzdušnou čarou/);
    assert.match(csAnswer, /Google Maps|Apple Maps|Mapy\.com/);
    assert.match(enAnswer, /crow flies/);
    assert.match(enAnswer, /Google Maps|Apple Maps|Mapy\.com/);
  });

  test("žádná otázka/odpověď není prázdná", () => {
    for (const locale of ["cs", "en"] as const) {
      for (const item of getSeoContent(locale).faq.items) {
        assert.notEqual(item.question.trim(), "");
        assert.notEqual(item.answer.trim(), "");
      }
    }
  });
});

describe("soukromí — 6. tvrzení odpovídá reálné implementaci", () => {
  test("privacyText cs/en", () => {
    assert.equal(getSeoContent("cs").howItWorks.privacyText, "Vaše poloha zůstává ve vašem zařízení a nepoužíváme ji k reklamnímu cílení.");
    assert.equal(getSeoContent("en").howItWorks.privacyText, "Your location stays on your device and is not used for advertising targeting.");
  });
});
