import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// .tsx komponenty se nedají v tomhle projektu přímo importovat do
// testů (Node nativně nepodporuje JSX/type-stripping pro .tsx, viz
// package.json "test" script — jen .ts jde importovat přímo), takže se
// tyhle strukturální požadavky ověřují nad zdrojovým textem, stejný
// vzorec jako test/nameday-greeting-shape.test.ts. Skutečné vykreslené
// HTML (title/canonical/hreflang/h1/...) bylo ověřené ručně nad
// `npm run build` výstupem (.next/server/app/index.html a en.html).
function readSource(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(`../${relativePath}`, import.meta.url)), "utf-8");
}

describe("8. jazykový přepínač je skutečný odkaz, ne klientské přepnutí stavu", () => {
  const source = readSource("components/i18n/LanguageToggle.tsx");

  test("používá next/link, ne <button onClick>", () => {
    assert.match(source, /from "next\/link"/);
    assert.match(source, /<Link\b/);
    assert.doesNotMatch(source, /<button/);
  });

  test("href vede na skutečné cesty \"/\" a \"/en\", ne na volání setLocale", () => {
    assert.match(source, /href = isCs \? "\/en" : "\/"/);
    assert.doesNotMatch(source, /setLocale/);
  });
});

describe("9. žádné přepnutí jazyka podle starého localStorage", () => {
  const source = readSource("components/i18n/I18nProvider.tsx");

  test("I18nProvider nečte/nezapisuje žádný klíč pro jazyk do localStorage a nevolá detekci z prohlížeče", () => {
    assert.doesNotMatch(source, /LOCALE_STORAGE_KEY/);
    assert.doesNotMatch(source, /detectBrowserLocale/);
    // Skutečné volání (ne jen zmínka v komentáři, který dokumentuje, že se to NEDĚLÁ).
    assert.doesNotMatch(source, /typeof navigator/);
  });

  test("locale je povinný prop, ne useState s DEFAULT_LOCALE", () => {
    assert.match(source, /locale\s*[,:]/); // je součástí destrukturovaných props
    assert.doesNotMatch(source, /DEFAULT_LOCALE/);
    assert.doesNotMatch(source, /useState<Locale>/);
  });

  test("lib/i18n/detect-locale.ts (autodetekce z prohlížeče) byl odstraněný", () => {
    assert.throws(() => readSource("lib/i18n/detect-locale.ts"));
  });
});

describe("20. reklamní odkazy používají rel=\"sponsored noopener noreferrer\"", () => {
  test("AdCard.tsx používá sdílenou konstantu AD_LINK_REL (viz lib/ads/validate-url.ts), ne natvrdo jiný řetězec", () => {
    const source = readSource("components/ads/AdCard.tsx");
    assert.match(source, /rel=\{AD_LINK_REL\}/);
    assert.match(source, /import \{ AD_LINK_REL/);
  });
});

describe("10. AppHeader vykresluje přesně jeden <h1> se SEO nadpisem, značka není h1", () => {
  const source = readSource("components/AppHeader.tsx");

  test("brand je <p>, ne <h1>", () => {
    assert.match(source, /<p className="truncate[^"]*">KdeJeMetro\.cz<\/p>/);
  });

  test("h1 čte seo.mainHeading", () => {
    assert.match(source, /<h1[^>]*>\{seo\.mainHeading\}<\/h1>/);
  });

  test("žádný jiný <h1> v souboru", () => {
    const matches = source.match(/<h1[\s>]/g) ?? [];
    assert.equal(matches.length, 1);
  });
});

describe("app/(cs)/page.tsx a app/en/page.tsx — metadata podle zadání (5./6./7.)", () => {
  test("česká stránka: canonical \"/\", hreflang cs/en/x-default", () => {
    const source = readSource("app/(cs)/page.tsx");
    assert.match(source, /canonical: "\/"/);
    assert.match(source, /cs: "\/", en: "\/en", "x-default": "\/"/);
    assert.match(source, /locale: "cs"/);
  });

  test("anglická stránka: canonical \"/en\", hreflang cs/en/x-default", () => {
    const source = readSource("app/en/page.tsx");
    assert.match(source, /canonical: "\/en"/);
    assert.match(source, /cs: "\/", en: "\/en", "x-default": "\/"/);
    assert.match(source, /locale: "en"/);
  });

  test("obě stránky nastavují robots index/follow (žádné omylem noindex)", () => {
    for (const path of ["app/(cs)/page.tsx", "app/en/page.tsx"]) {
      const source = readSource(path);
      assert.match(source, /robots: \{ index: true, follow: true \}/);
    }
  });
});

describe("app/(cs)/layout.tsx a app/en/layout.tsx — 3. správný <html lang>", () => {
  test("česká route group má lang=\"cs\"", () => {
    assert.match(readSource("app/(cs)/layout.tsx"), /<html lang="cs">/);
  });

  test("anglická route group má lang=\"en\"", () => {
    assert.match(readSource("app/en/layout.tsx"), /<html lang="en">/);
  });
});
