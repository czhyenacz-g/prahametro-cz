import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// "use client" komponenty se v tomhle projektu nedají přímo importovat
// do node:test (viz test/departures-ui-shape.test.ts) — ověřuje se
// zdrojový text. Cíl: reklamy se stahují jen server-side (HomePage.tsx/
// NightPage.tsx), klientské komponenty dostávají už hotová data jako
// prop, nikdy samy nevolají Content API (viz zadání bod 7/17 — žádný
// runtime request z browseru, žádný token v client bundlu).
function readSource(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(`../${relativePath}`, import.meta.url)), "utf-8");
}

describe("HomePage.tsx — server-side fetch reklam pro finder_results", () => {
  const source = readSource("components/HomePage.tsx");

  test("je async Server Component (žádné \"use client\")", () => {
    assert.doesNotMatch(source, /"use client"/);
    assert.match(source, /export default async function HomePage/);
  });

  test("volá getActivePromotionCampaigns(\"finder_results\") a předává výsledek do HomeClient jako prop", () => {
    assert.match(source, /await getActivePromotionCampaigns\("finder_results"\)/);
    assert.match(source, /<HomeClient entrances=\{metroEntrances\.entrances\} promotionCampaigns=\{promotionCampaigns\}/);
  });
});

describe("night/NightPage.tsx — server-side fetch reklam pro night_finder_results, nezávisle na HomePage", () => {
  const source = readSource("components/night/NightPage.tsx");

  test("je async Server Component", () => {
    assert.doesNotMatch(source, /"use client"/);
    assert.match(source, /export default async function NightPage/);
  });

  test("volá getActivePromotionCampaigns(\"night_finder_results\") — VLASTNÍ, nezávislý fetch od HomePage", () => {
    assert.match(source, /await getActivePromotionCampaigns\("night_finder_results"\)/);
    assert.match(source, /<NightFinder promotionCampaigns=\{promotionCampaigns\}/);
  });
});

describe("components/ads/AdSlot.tsx — nedělá vlastní network request", () => {
  const source = readSource("components/ads/AdSlot.tsx");

  test("přijímá campaigns jako prop, neimportuje Content API ani lib/ads/campaigns.ts", () => {
    assert.match(source, /campaigns: AdCampaign\[\]/);
    const importLines = source
      .split("\n")
      .filter((line) => line.trim().startsWith("import"))
      .join("\n");
    assert.doesNotMatch(importLines, /content-api|get-promotions|lib\/ads\/campaigns/);
  });

  test("předává campaigns do useSelectedAd beze změny", () => {
    assert.match(source, /useSelectedAd\(campaigns, locale, stationId\)/);
  });
});

describe("hooks/useSelectedAd.ts — campaigns je vstupní parametr, ne natvrdo importovaná data", () => {
  const source = readSource("hooks/useSelectedAd.ts");

  test("neimportuje lib/ads/campaigns.ts", () => {
    assert.doesNotMatch(source, /from "\.\.\/lib\/ads\/campaigns\.ts"/);
  });

  test("campaigns je první parametr funkce a je v dependency poli efektu", () => {
    assert.match(source, /export function useSelectedAd\(campaigns: AdCampaign\[\], language: Language, stationId\?: string \| null\)/);
    assert.match(source, /\[campaigns, language, stationId\]/);
  });
});

describe("lib/content-api/client.ts — token nikdy v client bundlu", () => {
  const source = readSource("lib/content-api/client.ts");

  test("token se čte jen z process.env, nikde není natvrdo zapsaná hodnota", () => {
    assert.match(source, /process\.env\.UCA_API_TOKEN/);
    assert.doesNotMatch(source, /uca_[A-Za-z0-9]{10,}/);
  });

  test("dokumentuje, že se smí importovat jen server-side", () => {
    assert.match(source, /POUZE ze Server Component|server-only/i);
  });
});

describe("lib/promotions/get-promotions.ts — výpadek Content API se vždy zachytí", () => {
  const source = readSource("lib/promotions/get-promotions.ts");

  test("getRecords(...).catch(...) — nikdy nenechá chybu propadnout volajícímu", () => {
    assert.match(source, /getRecords\([\s\S]*?\)\.catch\(\(\) => \[\]\)/);
  });
});

describe(".env.example — jen názvy proměnných, žádná hodnota", () => {
  const source = readSource(".env.example");

  test("UCA_BASE_URL/UCA_PROJECT_SLUG/UCA_API_TOKEN jsou zapsané prázdné", () => {
    assert.match(source, /^UCA_BASE_URL=$/m);
    assert.match(source, /^UCA_PROJECT_SLUG=$/m);
    assert.match(source, /^UCA_API_TOKEN=$/m);
  });
});
