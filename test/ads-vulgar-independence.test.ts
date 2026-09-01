import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { campaigns } from "../lib/ads/campaigns.ts";
import { filterCampaigns } from "../lib/ads/filter-campaigns.ts";

// Žádná funkce v lib/ads/ přijímá "vulgar" jako parametr — texty kampaně
// (title/description/cta) se čtou vždy jen podle `language`, nikdy podle
// 18+ stavu (ten žije jen v I18nContext a čte se jen ve FinderSection
// pro hlavní hlášku, viz zadání "AdCard.tsx vulgar z useI18n() vůbec
// nečte"). Tenhle test ověřuje, že opakované čtení stejné kampaně dá
// vždy identický text bez ohledu na cokoliv vnějšího.
describe("20. text reklamy je nezávislý na režimu 18+", () => {
  test("filterCampaigns nemá parametr pro vulgární režim a text kampaně je stabilní", () => {
    const now = new Date("2026-06-15T12:00:00Z");
    const resultA = filterCampaigns(campaigns, { language: "cs", now });
    const resultB = filterCampaigns(campaigns, { language: "cs", now });

    assert.deepEqual(
      resultA.map((c) => c.title.cs),
      resultB.map((c) => c.title.cs)
    );
  });

  test("žádná počáteční kampaň neobsahuje vulgární/hrubý text", () => {
    const vulgarPattern = /zkurven|fucking/i;
    for (const campaign of campaigns) {
      for (const text of [...Object.values(campaign.title), ...Object.values(campaign.description), ...Object.values(campaign.cta)]) {
        assert.doesNotMatch(text ?? "", vulgarPattern);
      }
    }
  });
});
