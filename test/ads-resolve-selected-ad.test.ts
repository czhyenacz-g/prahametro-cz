import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { resolveSelectedAd } from "../lib/ads/select-ad.ts";
import type { AdCampaign } from "../lib/ads/types.ts";

const NOW = new Date("2026-06-15T12:00:00Z");

const csA: AdCampaign = {
  id: "a-cs",
  enabled: true,
  languages: ["cs"],
  title: { cs: "A" },
  description: { cs: "Popis A" },
  cta: { cs: "Akce A" },
  href: null,
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
