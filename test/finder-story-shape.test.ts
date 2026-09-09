// .tsx komponenty se v tomhle projektu nedají přímo importovat do testů
// (Node nativně nepodporuje JSX pro .tsx) — ověřuje se nad zdrojovým
// textem, stejný vzorec jako test/departures-ui-shape.test.ts.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

function readSource(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(`../${relativePath}`, import.meta.url)), "utf-8");
}

describe("FinderSection.tsx — privacyNote odstraněn z hlavního boxu, nahrazen storytelling blokem", () => {
  const source = readSource("components/FinderSection.tsx");

  test("hlavní CTA box už nevykresluje dict.finder.privacyNote", () => {
    assert.doesNotMatch(source, /dict\.finder\.privacyNote/);
  });

  test("vykresluje <FinderStory /> PO výsledkovém <div aria-live> a PŘED <AdSlot> (další doplňkový obsah)", () => {
    const liveRegionIndex = source.indexOf('aria-live="polite"');
    const storyIndex = source.indexOf("<FinderStory");
    const adSlotIndex = source.indexOf("<AdSlot");
    assert.ok(liveRegionIndex >= 0 && storyIndex >= 0 && adSlotIndex >= 0);
    assert.ok(liveRegionIndex < storyIndex, "FinderStory musí být až po výsledkovém bloku");
    assert.ok(storyIndex < adSlotIndex, "FinderStory musí být před AdSlot/nameday obsahem");
  });

  test("import FinderStory", () => {
    assert.match(source, /import FinderStory from ".\/FinderStory\.tsx";/);
  });
});

describe("components/FinderStory.tsx — nenápadný textový callout, ne další karta", () => {
  const source = readSource("components/FinderStory.tsx");

  test("nepoužívá kartový styl (rounded-2xl + border + shadow) jako hlavní finder box / mapa", () => {
    assert.doesNotMatch(source, /rounded-2xl.*border.*shadow|border.*rounded-2xl.*shadow/s);
  });

  test("obyčejné odstavce, žádný nový heading (neporušuje hierarchii H1)", () => {
    assert.doesNotMatch(source, /<h1|<h2|<h3/i);
    assert.match(source, /<p /);
  });

  test("citát se přepíná přes getStoryQuote(locale, vulgar) — stejný mechanismus jako hlavní hláška, žádný nový 18+ stav", () => {
    assert.match(source, /getStoryQuote\(locale, vulgar\)/);
    assert.doesNotMatch(source, /useState.*vulgar|createContext/i);
  });

  test("intro/outro text čte z dict.finder.story, ne natvrdo zapsaná čeština", () => {
    assert.match(source, /dict\.finder\.story\.intro/);
    assert.match(source, /dict\.finder\.story\.outro/);
    assert.doesNotMatch(source, /"Vylezeš|"Přesně proto/);
  });
});
