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
// `npm run build` výstupem (.next/server/app/*.html).
function readSource(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(`../${relativePath}`, import.meta.url)), "utf-8");
}

describe("8. jazykové menu je postavené na skutečných odkazech, ne klientském přepnutí stavu", () => {
  const source = readSource("components/i18n/LanguageMenu.tsx");

  test("odkazy jsou <a href>, ne <button onClick> navigace", () => {
    assert.match(source, /<a\s/);
    assert.doesNotMatch(source, /setLocale/);
  });

  test("href staví na localeToRoute pro všechny 4 jazyky (lib/i18n/types.ts), ne na natvrdo vypsaných cestách", () => {
    assert.match(source, /from "\.\.\/\.\.\/lib\/i18n\/types\.ts"/);
    assert.match(source, /localeToRoute\[/);
    assert.match(source, /LOCALES\.map/);
  });

  test("hrefLang cílových odkazů používá \"uk\", nikdy ne \"ua\"", () => {
    assert.match(source, /uk: "uk"/);
    assert.doesNotMatch(source, /lang="ua"/);
    assert.doesNotMatch(source, /hrefLang="ua"/);
  });

  test("viditelný štítek tlačítka pro ukrajinštinu je textový kód \"UA\" (URL segment), ne \"UK\"", () => {
    assert.match(source, /uk: "UA"/);
  });

  test("nativní názvy jazyků jsou vždy ve svém vlastním jazyce (Čeština/English/Deutsch/Українська)", () => {
    assert.match(source, /cs: "Čeština"/);
    assert.match(source, /en: "English"/);
    assert.match(source, /de: "Deutsch"/);
    assert.match(source, /uk: "Українська"/);
  });

  test("přístupnostní jméno tlačítka čte dict.header.languageMenuLabel (jazyk aktuální stránky), ne natvrdo string", () => {
    assert.match(source, /aria-label=\{dict\.header\.languageMenuLabel\}/);
  });

  test("aria-haspopup a aria-expanded jsou na tlačítku", () => {
    assert.match(source, /aria-haspopup="true"/);
    assert.match(source, /aria-expanded=\{open\}/);
  });

  test("aktuální jazyk je označen přes aria-current", () => {
    assert.match(source, /aria-current=\{isCurrent \? "page" : undefined\}/);
  });

  test("Escape/focus trap/návrat focusu jde přes sdílený useFocusTrap hook, ne vlastní implementace", () => {
    assert.match(source, /from "\.\.\/\.\.\/hooks\/useFocusTrap\.ts"/);
    assert.match(source, /useFocusTrap\(open, /);
  });

  test("zavření kliknutím mimo menu je implementované (mousedown listener mimo rootRef)", () => {
    assert.match(source, /mousedown/);
    assert.match(source, /rootRef\.current/);
  });

  test("žádný nativní <select> (musí jít o crawlovatelné odkazy)", () => {
    assert.doesNotMatch(source, /<select/);
  });

  test("query string a hash se dopočítávají až po mountu z window.location (hydration-safe)", () => {
    assert.match(source, /useEffect/);
    assert.match(source, /window\.location\.search/);
    assert.match(source, /window\.location\.hash/);
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

  test("hlavička renderuje LanguageMenu, ne starý LanguageToggle", () => {
    assert.match(source, /from "\.\/i18n\/LanguageMenu\.tsx"/);
    assert.match(source, /<LanguageMenu \/>/);
  });
});

describe("starý LanguageToggle byl odstraněný (nahrazen LanguageMenu)", () => {
  test("components/i18n/LanguageToggle.tsx už neexistuje", () => {
    assert.throws(() => readSource("components/i18n/LanguageToggle.tsx"));
  });
});

const ROUTE_PAGES = [
  { path: "app/(cs)/page.tsx", canonical: "/", locale: "cs" },
  { path: "app/en/page.tsx", canonical: "/en", locale: "en" },
  { path: "app/de/page.tsx", canonical: "/de", locale: "de" },
  { path: "app/ua/page.tsx", canonical: "/ua", locale: "uk" },
];

describe("app/{(cs),en,de,ua}/page.tsx — metadata pro všechny 4 jazyky (5./6./7./11.)", () => {
  for (const { path, canonical, locale } of ROUTE_PAGES) {
    test(`${path}: canonical "${canonical}", locale "${locale}", plný 4-jazyčný hreflang + x-default`, () => {
      const source = readSource(path);
      assert.match(source, new RegExp(`canonical: "${canonical.replace("/", "\\/")}"`));
      assert.match(source, /cs: "\/", en: "\/en", de: "\/de", uk: "\/ua", "x-default": "\/"/);
      assert.match(source, new RegExp(`locale: "${locale}"`));
      assert.match(source, /robots: \{ index: true, follow: true \}/);
    });
  }

  test("žádná ze stránek neodkazuje hreflang na \"ua\" (jen na \"uk\")", () => {
    for (const { path } of ROUTE_PAGES) {
      assert.doesNotMatch(readSource(path), /\bua: "\/ua"/);
    }
  });

  test("ukrajinská stránka volá getSeoContent/buildWebApplicationJsonLd/HomePage s locale \"uk\", ne \"ua\"", () => {
    const source = readSource("app/ua/page.tsx");
    assert.match(source, /getSeoContent\("uk"\)/);
    assert.match(source, /locale: "uk"/);
    assert.match(source, /<HomePage locale="uk" \/>/);
  });
});

const ROUTE_LAYOUTS = [
  { path: "app/(cs)/layout.tsx", lang: "cs" },
  { path: "app/en/layout.tsx", lang: "en" },
  { path: "app/de/layout.tsx", lang: "de" },
  { path: "app/ua/layout.tsx", lang: "uk" },
];

describe("app/{(cs),en,de,ua}/layout.tsx — 3. správný <html lang> pro všechny 4 jazyky", () => {
  for (const { path, lang } of ROUTE_LAYOUTS) {
    test(`${path} má lang="${lang}"`, () => {
      assert.match(readSource(path), new RegExp(`<html lang="${lang}">`));
    });
  }

  test("ukrajinský layout používá lang=\"uk\", nikdy ne lang=\"ua\"", () => {
    const source = readSource("app/ua/layout.tsx");
    assert.doesNotMatch(source, /lang="ua"/);
  });
});

describe("next.config.ts — trvalé přesměrování /uk -> /ua", () => {
  test("redirects() obsahuje permanent /uk -> /ua", () => {
    const source = readSource("next.config.ts");
    assert.match(source, /source: "\/uk"/);
    assert.match(source, /destination: "\/ua"/);
    assert.match(source, /permanent: true/);
  });
});
