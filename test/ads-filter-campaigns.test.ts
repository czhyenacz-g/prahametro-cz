import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { filterCampaigns } from "../lib/ads/filter-campaigns.ts";
import type { AdCampaign } from "../lib/ads/types.ts";

const NOW = new Date("2026-06-15T12:00:00Z");

function campaign(overrides: Partial<AdCampaign> = {}): AdCampaign {
  return {
    id: "test-campaign",
    enabled: true,
    languages: ["cs", "en"],
    title: { cs: "Titulek", en: "Title" },
    description: { cs: "Popis", en: "Description" },
    cta: { cs: "Akce", en: "Action" },
    href: null,
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
