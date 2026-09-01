import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { getFallbackLanguage } from "../lib/ads/language-fallback.ts";
import { selectAd, resolveSelectedAd } from "../lib/ads/select-ad.ts";
import { campaigns as realCampaigns } from "../lib/ads/campaigns.ts";
import type { AdCampaign } from "../lib/ads/types.ts";

const NOW = new Date("2026-06-15T12:00:00Z");

describe("getFallbackLanguage — deterministický jazykový fallback (14./bod 15 zadání)", () => {
  test("de a uk padají zpět na en", () => {
    assert.equal(getFallbackLanguage("de"), "en");
    assert.equal(getFallbackLanguage("uk"), "en");
  });

  test("cs a en nemají žádný fallback (beze změny oproti dosavadnímu chování)", () => {
    assert.equal(getFallbackLanguage("cs"), null);
    assert.equal(getFallbackLanguage("en"), null);
  });
});

describe("selectAd — reálné kampaně: de/uk dostanou anglickou kampaň fallbackem", () => {
  test("de nemá žádnou vlastní způsobilou kampaň, ale fallback vybere jednu z [luggage-en, activities-en]", () => {
    const picked = selectAd(realCampaigns, { language: "de", now: NOW }, () => 0);
    assert.ok(picked);
    assert.ok(["luggage-en", "activities-en"].includes(picked!.id));
  });

  test("uk nemá žádnou vlastní způsobilou kampaň, ale fallback vybere jednu z [luggage-en, activities-en]", () => {
    const picked = selectAd(realCampaigns, { language: "uk", now: NOW }, () => 0.999999);
    assert.ok(picked);
    assert.ok(["luggage-en", "activities-en"].includes(picked!.id));
  });

  test("cs zůstává beze změny — žádná způsobilá kampaň, žádný fallback na en reklamu", () => {
    const picked = selectAd(realCampaigns, { language: "cs", now: NOW });
    assert.equal(picked, null);
  });
});

describe("selectAd — syntetické kampaně: lokalizovaná kampaň má přednost před fallbackem", () => {
  const syntheticCampaigns: AdCampaign[] = [
    {
      id: "de-specific",
      enabled: true,
      languages: ["de"],
      title: { de: "Deutsche Kampagne" },
      description: { de: "Testbeschreibung" },
      cta: { de: "Mehr erfahren" },
      href: "https://example.com/de",
      advertiser: null,
      weight: 10,
    },
    {
      id: "en-fallback",
      enabled: true,
      languages: ["en"],
      title: { en: "English fallback" },
      description: { en: "Test description" },
      cta: { en: "Learn more" },
      href: "https://example.com/en",
      advertiser: null,
      weight: 10,
    },
  ];

  test("když existuje způsobilá de kampaň, fallback na en se vůbec nezkouší", () => {
    const picked = selectAd(syntheticCampaigns, { language: "de", now: NOW }, () => 0);
    assert.equal(picked?.id, "de-specific");
  });

  test("bez způsobilé de kampaně se použije en fallback", () => {
    const onlyEnglish = syntheticCampaigns.filter((c) => c.id !== "de-specific");
    const picked = selectAd(onlyEnglish, { language: "de", now: NOW });
    assert.equal(picked?.id, "en-fallback");
  });

  test("uk se stejnou syntetickou sadou také použije en fallback (žádná uk-specific kampaň neexistuje)", () => {
    const onlyEnglish = syntheticCampaigns.filter((c) => c.id !== "de-specific");
    const picked = selectAd(onlyEnglish, { language: "uk", now: NOW });
    assert.equal(picked?.id, "en-fallback");
  });
});

describe("resolveSelectedAd — výběr nesmí poskakovat: kampaň vybraná pro de/uk přes en fallback zůstává 'sticky'", () => {
  test("uložené ID anglické kampaně zůstává platné při přenačtení stránky v němčině", () => {
    const resolved = resolveSelectedAd(realCampaigns, "luggage-en", { language: "de", now: NOW });
    assert.equal(resolved?.id, "luggage-en");
  });

  test("uložené ID anglické kampaně zůstává platné při přenačtení stránky v ukrajinštině", () => {
    const resolved = resolveSelectedAd(realCampaigns, "activities-en", { language: "uk", now: NOW });
    assert.equal(resolved?.id, "activities-en");
  });

  test("uložené ID kampaně, která už není způsobilá ani přímo ani fallbackem, se ignoruje a provede se nový výběr", () => {
    const resolved = resolveSelectedAd(realCampaigns, "pharmacy-cs", { language: "de", now: NOW });
    assert.notEqual(resolved?.id, "pharmacy-cs");
  });
});

describe("kampaně bez odkazu se nikdy nezobrazí, i přes jazykový fallback", () => {
  test("de/uk fallback nikdy nevybere kampaň s href: null", () => {
    for (const language of ["de", "uk"] as const) {
      for (let i = 0; i < 20; i++) {
        const picked = selectAd(realCampaigns, { language, now: NOW }, () => i / 20);
        if (picked) assert.notEqual(picked.href, null);
      }
    }
  });
});
