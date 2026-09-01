import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { filterCampaigns } from "../lib/ads/filter-campaigns.ts";
import type { AdCampaign } from "../lib/ads/types.ts";

const NOW = new Date("2026-06-15T12:00:00Z");

// Výchozí `href` je platná https: URL — testy filtrování podle jazyka/
// stavu/platnosti/cílení tak izolovaně testují JEN svůj rozměr, beze
// změny kvůli nové podmínce na platný affiliate odkaz (viz describe
// "href / affiliate odkaz" níže, ta testuje href izolovaně).
function campaign(overrides: Partial<AdCampaign> = {}): AdCampaign {
  return {
    id: "test-campaign",
    enabled: true,
    languages: ["cs", "en"],
    title: { cs: "Titulek", en: "Title" },
    description: { cs: "Popis", en: "Description" },
    cta: { cs: "Akce", en: "Action" },
    href: "https://example.com/campaign",
    advertiser: null,
    weight: 10,
    ...overrides,
  };
}

describe("filterCampaigns — jazyk", () => {
  test("1. filtrování podle češtiny — vrátí jen cs kampaně se všemi texty", () => {
    const csOnly = campaign({ id: "cs-only", languages: ["cs"] });
    const enOnly = campaign({ id: "en-only", languages: ["en"] });
    const result = filterCampaigns([csOnly, enOnly], { language: "cs", now: NOW });
    assert.deepEqual(result.map((c) => c.id), ["cs-only"]);
  });

  test("2. filtrování podle angličtiny — vrátí jen en kampaně se všemi texty", () => {
    const csOnly = campaign({ id: "cs-only", languages: ["cs"] });
    const enOnly = campaign({ id: "en-only", languages: ["en"] });
    const result = filterCampaigns([csOnly, enOnly], { language: "en", now: NOW });
    assert.deepEqual(result.map((c) => c.id), ["en-only"]);
  });

  test("chybějící text pro daný jazyk kampaň vyřadí, i když je jazyk uvedený v languages", () => {
    const incomplete = campaign({ id: "incomplete", languages: ["cs"], title: {} });
    const result = filterCampaigns([incomplete], { language: "cs", now: NOW });
    assert.deepEqual(result, []);
  });
});

describe("filterCampaigns — stav a platnost", () => {
  test("3. vyřazení vypnuté kampaně", () => {
    const disabled = campaign({ id: "disabled", enabled: false });
    const result = filterCampaigns([disabled], { language: "cs", now: NOW });
    assert.deepEqual(result, []);
  });

  test("4. vyřazení kampaně mimo datum platnosti (před validFrom i po validTo)", () => {
    const notYetStarted = campaign({ id: "future", validFrom: "2026-07-01T00:00:00Z" });
    const alreadyEnded = campaign({ id: "past", validTo: "2026-06-01T00:00:00Z" });
    const currentlyActive = campaign({ id: "active", validFrom: "2026-06-01T00:00:00Z", validTo: "2026-07-01T00:00:00Z" });

    const result = filterCampaigns([notYetStarted, alreadyEnded, currentlyActive], { language: "cs", now: NOW });
    assert.deepEqual(result.map((c) => c.id), ["active"]);
  });

  test("neplatný (nevalidní) datumový řetězec kampaň bezpečně vyřadí, nespadne", () => {
    const badDate = campaign({ id: "bad-date", validFrom: "not-a-date" });
    assert.doesNotThrow(() => filterCampaigns([badDate], { language: "cs", now: NOW }));
    assert.deepEqual(filterCampaigns([badDate], { language: "cs", now: NOW }), []);
  });
});

describe("filterCampaigns — cílení podle stanice", () => {
  test("5. zařazení obecné kampaně bez stationIds — se stanicí i bez ní", () => {
    const general = campaign({ id: "general" });
    assert.deepEqual(filterCampaigns([general], { language: "cs", now: NOW, stationId: "U1072S1" }).map((c) => c.id), ["general"]);
    assert.deepEqual(filterCampaigns([general], { language: "cs", now: NOW, stationId: null }).map((c) => c.id), ["general"]);
  });

  test("6. budoucí cílení podle odpovídající stanice — zařazena", () => {
    const targeted = campaign({ id: "targeted", stationIds: ["U1072S1", "U1040S1"] });
    const result = filterCampaigns([targeted], { language: "cs", now: NOW, stationId: "U1072S1" });
    assert.deepEqual(result.map((c) => c.id), ["targeted"]);
  });

  test("7. vyřazení neodpovídající stanice", () => {
    const targeted = campaign({ id: "targeted", stationIds: ["U1072S1"] });
    const result = filterCampaigns([targeted], { language: "cs", now: NOW, stationId: "U1040S1" });
    assert.deepEqual(result, []);
  });

  test("cílená kampaň se vyřadí i když stanice není vůbec známá", () => {
    const targeted = campaign({ id: "targeted", stationIds: ["U1072S1"] });
    const result = filterCampaigns([targeted], { language: "cs", now: NOW, stationId: null });
    assert.deepEqual(result, []);
  });
});

describe("filterCampaigns — platný affiliate odkaz (viz hasValidAffiliateUrl)", () => {
  test("8. href: null je vyřazeno", () => {
    const noHref = campaign({ id: "no-href", href: null });
    assert.deepEqual(filterCampaigns([noHref], { language: "cs", now: NOW }), []);
  });

  test("9. prázdný řetězec je vyřazen", () => {
    const emptyHref = campaign({ id: "empty-href", href: "" });
    assert.deepEqual(filterCampaigns([emptyHref], { language: "cs", now: NOW }), []);
  });

  test("10. řetězec obsahující pouze mezery je vyřazen", () => {
    const whitespaceHref = campaign({ id: "whitespace-href", href: "   " });
    assert.deepEqual(filterCampaigns([whitespaceHref], { language: "cs", now: NOW }), []);
  });

  test("11. relativní URL je vyřazena", () => {
    const relativeHref = campaign({ id: "relative-href", href: "/relative/path" });
    assert.deepEqual(filterCampaigns([relativeHref], { language: "cs", now: NOW }), []);
  });

  test("12. http: URL je vyřazena", () => {
    const httpHref = campaign({ id: "http-href", href: "http://example.com" });
    assert.deepEqual(filterCampaigns([httpHref], { language: "cs", now: NOW }), []);
  });

  test("13. javascript: URL je vyřazena", () => {
    const jsHref = campaign({ id: "js-href", href: "javascript:alert(1)" });
    assert.deepEqual(filterCampaigns([jsHref], { language: "cs", now: NOW }), []);
  });

  test("14. data: URL je vyřazena", () => {
    const dataHref = campaign({ id: "data-href", href: "data:text/html,<script>alert(1)</script>" });
    assert.deepEqual(filterCampaigns([dataHref], { language: "cs", now: NOW }), []);
  });

  test("file: URL je vyřazena", () => {
    const fileHref = campaign({ id: "file-href", href: "file:///etc/passwd" });
    assert.deepEqual(filterCampaigns([fileHref], { language: "cs", now: NOW }), []);
  });

  test("platná https: URL je zařazena", () => {
    const validHref = campaign({ id: "valid-href", href: "https://example.com/nabidka" });
    assert.deepEqual(
      filterCampaigns([validHref], { language: "cs", now: NOW }).map((c) => c.id),
      ["valid-href"]
    );
  });
});
