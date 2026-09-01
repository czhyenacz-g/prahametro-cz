import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { resolveSelectedAd } from "../lib/ads/select-ad.ts";
import { campaigns as realCampaigns } from "../lib/ads/campaigns.ts";
import type { AdCampaign } from "../lib/ads/types.ts";

const NOW = new Date("2026-06-15T12:00:00Z");

// `href` je platná https: URL — bez ní by filterCampaigns kampaň vždy
// vyřadilo a testy níže (o obnově uloženého ID) by nic nesmysluplně
// netestovaly, protože by "nová" kampaň i "obnovená" kampaň byly obě null.
const csA: AdCampaign = {
  id: "a-cs",
  enabled: true,
  languages: ["cs"],
  title: { cs: "A" },
  description: { cs: "Popis A" },
  cta: { cs: "Akce A" },
  href: "https://example.com/a",
  advertiser: null,
  weight: 50,
};

const csB: AdCampaign = { ...csA, id: "b-cs", title: { cs: "B" } };
const campaigns = [csA, csB];

describe("resolveSelectedAd — stabilita ze sessionStorage", () => {
  test("10. obnovení platné uložené kampaně (nevybere novou náhodně)", () => {
    const result = resolveSelectedAd(campaigns, "a-cs", { language: "cs", now: NOW }, () => 0.99 /* by jinak vybralo b-cs */);
    assert.equal(result?.id, "a-cs");
  });

  test("11a. nový výběr, když uložené ID neexistuje mezi kampaněmi", () => {
    const result = resolveSelectedAd(campaigns, "nonexistent-id", { language: "cs", now: NOW }, () => 0);
    assert.equal(result?.id, "a-cs"); // roll=0 -> první způsobilá kampaň
  });

  test("11b. nový výběr, když uložená kampaň už neprojde filtry (vypnutá)", () => {
    const disabledA = { ...csA, enabled: false };
    const result = resolveSelectedAd([disabledA, csB], "a-cs", { language: "cs", now: NOW }, () => 0);
    assert.equal(result?.id, "b-cs");
  });

  test("11c. nový výběr, když uložená kampaň neodpovídá aktuálnímu jazyku", () => {
    const enOnly: AdCampaign = { ...csA, id: "en-only", languages: ["en"], title: { en: "EN" }, description: { en: "d" }, cta: { en: "c" } };
    const result = resolveSelectedAd([enOnly, csB], "en-only", { language: "cs", now: NOW }, () => 0);
    assert.equal(result?.id, "b-cs");
  });

  test("12. bez uloženého ID (null = žádné/nedostupné úložiště) proběhne normální výběr, nespadne", () => {
    assert.doesNotThrow(() => resolveSelectedAd(campaigns, null, { language: "cs", now: NOW }, () => 0));
    const result = resolveSelectedAd(campaigns, null, { language: "cs", now: NOW }, () => 0);
    assert.equal(result?.id, "a-cs");
  });

  test("13. samostatný výběr pro cs a en — jazyk mění eligible množinu nezávisle", () => {
    const en: AdCampaign = { ...csA, id: "only-en", languages: ["en"], title: { en: "EN" }, description: { en: "d" }, cta: { en: "c" } };
    const mixed = [csA, en];

    const csResult = resolveSelectedAd(mixed, null, { language: "cs", now: NOW }, () => 0);
    const enResult = resolveSelectedAd(mixed, null, { language: "en", now: NOW }, () => 0);

    assert.equal(csResult?.id, "a-cs");
    assert.equal(enResult?.id, "only-en");
  });
});

// Reálná konfigurace (lib/ads/campaigns.ts) po aktivaci Bounce
// (luggage-en) a GetYourGuide (activities-en) — esim-en/transfer-en
// zůstávají v poli, ale mají href: null (viz zadání "kampaně bez
// odkazu zachovej").
describe("resolveSelectedAd — reálné kampaně, obnova/zneplatnění uloženého výběru (sessionStorage)", () => {
  test("23. platná uložená kampaň Bounce (luggage-en) se obnoví", () => {
    const result = resolveSelectedAd(realCampaigns, "luggage-en", { language: "en", now: NOW }, () => 0.99);
    assert.equal(result?.id, "luggage-en");
  });

  test("24. platná uložená kampaň GetYourGuide (activities-en) se obnoví", () => {
    const result = resolveSelectedAd(realCampaigns, "activities-en", { language: "en", now: NOW }, () => 0.99);
    assert.equal(result?.id, "activities-en");
  });

  test("25. uložená kampaň bez odkazu (esim-en, href: null) se neobnoví — vybere se nová způsobilá", () => {
    // roll=0 -> první způsobilá anglická kampaň podle pořadí v poli (luggage-en, weight 45 z celkových 75).
    const result = resolveSelectedAd(realCampaigns, "esim-en", { language: "en", now: NOW }, () => 0);
    assert.notEqual(result?.id, "esim-en");
    assert.ok(result?.id === "luggage-en" || result?.id === "activities-en");
  });

  test("26. neplatný uložený výběr (neexistující ID) vyvolá nový výběr mezi způsobilými kampaněmi", () => {
    const result = resolveSelectedAd(realCampaigns, "nonexistent-id", { language: "en", now: NOW }, () => 0);
    assert.ok(result?.id === "luggage-en" || result?.id === "activities-en");
  });

  test("27. česká verze s neplatným uloženým placeholderem (pharmacy-cs, href: null) nevrátí žádnou kampaň", () => {
    const result = resolveSelectedAd(realCampaigns, "pharmacy-cs", { language: "cs", now: NOW }, () => 0);
    assert.equal(result, null);
  });
});
