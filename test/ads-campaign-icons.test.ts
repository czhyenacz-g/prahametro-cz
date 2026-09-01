import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { campaigns } from "../lib/ads/campaigns.ts";

// Vizuální redesign přidal restriktivní `AdIcon` union (lib/ads/types.ts)
// pro ikonu reklamní karty. Tenhle test uzamyká, že každá počáteční
// kampaň má přiřazenou právě tu ikonu, která odpovídá její kategorii —
// AdIcon.tsx pak z ní staví bezpečnou lucide-react ikonu, nikdy z
// libovolného campaignId (viz zadání redesignu).
const EXPECTED_ICON: Record<string, string> = {
  "pharmacy-cs": "pharmacy",
  "shopping-cs": "shopping",
  "luggage-en": "luggage",
  "activities-en": "ticket",
  "esim-en": "esim",
  "transfer-en": "transfer",
};

describe("ad-icon mapování na kampaně", () => {
  test("každá počáteční kampaň má přiřazenou ikonu odpovídající kategorii", () => {
    for (const campaign of campaigns) {
      assert.equal(campaign.icon, EXPECTED_ICON[campaign.id], `kampaň ${campaign.id}`);
    }
  });

  test("žádná kampaň nemá icon mimo povolenou množinu hodnot", () => {
    const allowed = new Set(["pharmacy", "shopping", "luggage", "ticket", "esim", "transfer"]);
    for (const campaign of campaigns) {
      assert.ok(campaign.icon === undefined || allowed.has(campaign.icon));
    }
  });
});
