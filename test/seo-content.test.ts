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
  function knownAnchorIds(locale: "cs" | "en" | "de" | "uk"): Set<string> {
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
    for (const locale of ["cs", "en", "de", "uk"] as const) {
      for (const link of getSeoContent(locale).links.items) {
        assert.doesNotMatch(link.href, /^https?:/);
        assert.doesNotMatch(link.href, /^\/(?!$)/); // žádná jiná interní cesta než "#..."
      }
    }
  });

  test("německé odkazy míří jen na kotvy, které appka skutečně vykresluje", () => {
    const ids = knownAnchorIds("de");
    const seo = getSeoContent("de");
    for (const link of seo.links.items) {
      assert.match(link.href, /^#/, `Link "${link.label}" muss auf einen Anker auf der Seite verweisen`);
      const target = link.href.slice(1);
      assert.ok(ids.has(target), `Link "${link.label}" -> "${link.href}" verweist auf kein gerendertes id (${[...ids].join(", ")})`);
    }
  });

  test("ukrajinské odkazy míří jen na kotvy, které appka skutečně vykresluje", () => {
    const ids = knownAnchorIds("uk");
    const seo = getSeoContent("uk");
    for (const link of seo.links.items) {
      assert.match(link.href, /^#/, `Посилання "${link.label}" має вести на якір на цій сторінці`);
      const target = link.href.slice(1);
      assert.ok(ids.has(target), `Посилання "${link.label}" -> "${link.href}" не веде на жоден наявний id (${[...ids].join(", ")})`);
    }
  });

  test("odkazy každého jazyka zůstávají ve své vlastní sadě id, žádné křížení mezi cs/en/de/uk", () => {
    const idsByLocale = { cs: knownAnchorIds("cs"), en: knownAnchorIds("en"), de: knownAnchorIds("de"), uk: knownAnchorIds("uk") };
    const locales = Object.keys(idsByLocale) as (keyof typeof idsByLocale)[];
    for (let i = 0; i < locales.length; i++) {
      for (let j = i + 1; j < locales.length; j++) {
        const a = idsByLocale[locales[i]];
        const b = idsByLocale[locales[j]];
        const overlap = [...a].filter((id) => b.has(id));
        assert.deepEqual(overlap, [], `id se kříží mezi ${locales[i]} a ${locales[j]}: ${overlap.join(", ")}`);
      }
    }
  });
});

describe("německá SEO stránka (/de) — title/description/hlavní nadpis/ogLocale (16.)", () => {
  test("přesné hodnoty podle zadání", () => {
    const seo = getSeoContent("de");
    assert.equal(seo.title, "Nächster Metroeingang in Prag & Fußweg | KdeJeMetro.cz");
    assert.equal(
      seo.description,
      "Finden Sie den nächsten Eingang zur Prager Metro und öffnen Sie die Fußgängernavigation in Google Maps, Apple Maps oder Mapy.com."
    );
    assert.equal(seo.mainHeading, "Finden Sie den nächsten Metroeingang in Prag");
    assert.equal(seo.ogLocale, "de_DE");
  });

  test("kroky 'jak to funguje' a text o soukromí přesně podle zadání", () => {
    const seo = getSeoContent("de");
    assert.deepEqual(seo.howItWorks.steps, ["Standortzugriff erlauben", "Nächsten Eingang auswählen", "Fußgängernavigation öffnen"]);
    assert.equal(seo.howItWorks.privacyText, "Ihr Standort bleibt auf Ihrem Gerät und wird nicht für Werbezwecke verwendet.");
  });

  test("6 FAQ otázek, včetně dotazu na Brno se stejným významem jako český FAQ", () => {
    const items = getSeoContent("de").faq.items;
    assert.equal(items.length, 6);
    const brno = items.find((i) => /Brünn/.test(i.question));
    assert.ok(brno, "chybí otázka na Brno/Brünn");
    assert.match(brno!.answer, /keine Metro/);
  });

  test("žádná otázka/odpověď není prázdná", () => {
    for (const item of getSeoContent("de").faq.items) {
      assert.notEqual(item.question.trim(), "");
      assert.notEqual(item.answer.trim(), "");
    }
  });

  test("konzistentní vykání (Sie) v úvodním textu a krocích, žádné 'du'", () => {
    const seo = getSeoContent("de");
    const allText = [seo.intro.paragraphs.join(" "), ...seo.howItWorks.steps, seo.howItWorks.privacyText].join(" ");
    assert.doesNotMatch(allText, /\bdu\b|\bdein\b|\bdeine\b/i);
  });
});

describe("ukrajinská SEO stránka (/ua, locale uk) — title/description/hlavní nadpis/ogLocale (17.)", () => {
  test("přesné hodnoty podle zadání", () => {
    const seo = getSeoContent("uk");
    assert.equal(seo.title, "Найближчий вхід до метро в Празі | KdeJeMetro.cz");
    assert.equal(
      seo.description,
      "Знайдіть найближчий вхід до празького метро та відкрийте пішохідний маршрут у Google Maps, Apple Maps або Mapy.com."
    );
    assert.equal(seo.mainHeading, "Знайдіть найближчий вхід до метро в Празі");
    assert.equal(seo.ogLocale, "uk_UA");
  });

  test("6 FAQ otázek, včetně dotazu na Brno se stejným významem jako český FAQ", () => {
    const items = getSeoContent("uk").faq.items;
    assert.equal(items.length, 6);
    const brno = items.find((i) => /Брно/.test(i.question));
    assert.ok(brno, "chybí otázka na Brno");
    assert.match(brno!.answer, /немає метро/);
  });

  test("žádná otázka/odpověď není prázdná", () => {
    for (const item of getSeoContent("uk").faq.items) {
      assert.notEqual(item.question.trim(), "");
      assert.notEqual(item.answer.trim(), "");
    }
  });

  test("žádné ruské znaky v žádném viditelném textu (ы/ъ/э/ё nejsou v ukrajinské abecedě)", () => {
    const seo = getSeoContent("uk");
    const allText = JSON.stringify(seo);
    assert.doesNotMatch(allText, /[ыъэё]/);
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
