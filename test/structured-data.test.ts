import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { buildFaqPageJsonLd, buildWebApplicationJsonLd } from "../lib/seo/structured-data.ts";
import { getSeoContent } from "../lib/seo/content.ts";

describe("buildWebApplicationJsonLd — 19. správný jazyk a URL", () => {
  test("česká stránka: inLanguage cs, absolutní URL kořene", () => {
    const jsonLd = buildWebApplicationJsonLd({
      locale: "cs",
      siteUrl: "https://kdejemetro.cz",
      path: "/",
      name: "KdeJeMetro.cz",
      description: "popis",
    });
    assert.equal(jsonLd["@type"], "WebApplication");
    assert.equal(jsonLd.inLanguage, "cs");
    assert.equal(jsonLd.url, "https://kdejemetro.cz/");
    assert.equal(jsonLd.name, "KdeJeMetro.cz");
  });

  test("anglická stránka: inLanguage en, absolutní URL /en", () => {
    const jsonLd = buildWebApplicationJsonLd({
      locale: "en",
      siteUrl: "https://kdejemetro.cz",
      path: "/en",
      name: "KdeJeMetro.cz",
      description: "description",
    });
    assert.equal(jsonLd.inLanguage, "en");
    assert.equal(jsonLd.url, "https://kdejemetro.cz/en");
  });

  test("funguje i s preview/lokální doménou (žádné natvrdo zapsané kdejemetro.cz)", () => {
    const jsonLd = buildWebApplicationJsonLd({
      locale: "cs",
      siteUrl: "http://localhost:3000",
      path: "/",
      name: "KdeJeMetro.cz",
      description: "popis",
    });
    assert.equal(jsonLd.url, "http://localhost:3000/");
  });

  test("neobsahuje vymyšlené hodnocení, cenu, autora ani organizaci", () => {
    const jsonLd = buildWebApplicationJsonLd({ locale: "cs", siteUrl: "https://kdejemetro.cz", path: "/", name: "KdeJeMetro.cz", description: "popis" });
    for (const forbiddenKey of ["aggregateRating", "review", "offers", "author", "publisher", "organization"]) {
      assert.equal(forbiddenKey in jsonLd, false);
    }
  });

  test("@context je https://schema.org", () => {
    const jsonLd = buildWebApplicationJsonLd({ locale: "cs", siteUrl: "https://kdejemetro.cz", path: "/", name: "KdeJeMetro.cz", description: "popis" });
    assert.equal(jsonLd["@context"], "https://schema.org");
  });
});

describe("buildFaqPageJsonLd — 19. přesně odpovídá viditelnému FAQ", () => {
  test("cs: stejný počet otázek jako viditelné FAQ, stejné texty", () => {
    const faqItems = getSeoContent("cs").faq.items;
    const jsonLd = buildFaqPageJsonLd(faqItems);

    assert.equal(jsonLd["@type"], "FAQPage");
    assert.equal(jsonLd.mainEntity.length, faqItems.length);
    jsonLd.mainEntity.forEach((entity, i) => {
      assert.equal(entity["@type"], "Question");
      assert.equal(entity.name, faqItems[i].question);
      assert.equal(entity.acceptedAnswer["@type"], "Answer");
      assert.equal(entity.acceptedAnswer.text, faqItems[i].answer);
    });
  });

  test("en: stejný počet otázek jako viditelné FAQ, stejné texty", () => {
    const faqItems = getSeoContent("en").faq.items;
    const jsonLd = buildFaqPageJsonLd(faqItems);
    assert.equal(jsonLd.mainEntity.length, faqItems.length);
    assert.equal(jsonLd.mainEntity[0].name, faqItems[0].question);
  });

  test("prázdné pole -> prázdné mainEntity, nespadne", () => {
    assert.deepEqual(buildFaqPageJsonLd([]).mainEntity, []);
  });
});
