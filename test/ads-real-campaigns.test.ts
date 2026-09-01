import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { campaigns } from "../lib/ads/campaigns.ts";
import { filterCampaigns } from "../lib/ads/filter-campaigns.ts";
import { weightedSelect } from "../lib/ads/weighted-select.ts";
import { hasValidAffiliateUrl } from "../lib/ads/validate-url.ts";

const NOW = new Date("2026-06-15T12:00:00Z");

// Reálná konfigurace po aktivaci dvou anglických affiliate kampaní
// (Bounce = luggage-en, GetYourGuide = activities-en) — viz zadání.
// Tenhle test soubor ověřuje způsobilost/váhy/URL přesně nad
// produkčním polem `campaigns`, ne nad syntetickými fixture objekty.
describe("aktivní kampaně — Bounce (luggage-en) a GetYourGuide (activities-en)", () => {
  test("1. Bounce je způsobilý v angličtině", () => {
    const eligible = filterCampaigns(campaigns, { language: "en", now: NOW });
    assert.ok(eligible.some((c) => c.id === "luggage-en"));
  });

  test("2. GetYourGuide je způsobilý v angličtině", () => {
    const eligible = filterCampaigns(campaigns, { language: "en", now: NOW });
    assert.ok(eligible.some((c) => c.id === "activities-en"));
  });

  test("3. Bounce se nezobrazuje v češtině (jazykově cílený jen na en)", () => {
    const eligible = filterCampaigns(campaigns, { language: "cs", now: NOW });
    assert.ok(!eligible.some((c) => c.id === "luggage-en"));
  });

  test("4. GetYourGuide se nezobrazuje v češtině (jazykově cílený jen na en)", () => {
    const eligible = filterCampaigns(campaigns, { language: "cs", now: NOW });
    assert.ok(!eligible.some((c) => c.id === "activities-en"));
  });

  test("5. Bounce obsahuje přesnou affiliate URL, beze změny", () => {
    const bounce = campaigns.find((c) => c.id === "luggage-en");
    assert.equal(bounce?.href, "https://go.bounce.com/KDEJEMETROCZ75593727");
  });

  test("6. GetYourGuide zachovává přesný partner_id=XGLGW1H", () => {
    const gyg = campaigns.find((c) => c.id === "activities-en");
    assert.ok(gyg?.href?.includes("partner_id=XGLGW1H"));
  });

  test("7. GetYourGuide zachovává utm_medium=online_publisher", () => {
    const gyg = campaigns.find((c) => c.id === "activities-en");
    assert.ok(gyg?.href?.includes("utm_medium=online_publisher"));
  });

  test("GetYourGuide URL je přesně v zadané podobě (žádný přepis/zkrácení/extra parametry)", () => {
    const gyg = campaigns.find((c) => c.id === "activities-en");
    assert.equal(gyg?.href, "https://www.getyourguide.com/prague-l10/?partner_id=XGLGW1H&utm_medium=online_publisher");
  });

  test("32. Bounce používá ikonu luggage", () => {
    const bounce = campaigns.find((c) => c.id === "luggage-en");
    assert.equal(bounce?.icon, "luggage");
  });

  test("33. GetYourGuide používá ikonu ticket", () => {
    const gyg = campaigns.find((c) => c.id === "activities-en");
    assert.equal(gyg?.icon, "ticket");
  });

  test("advertiser je uložený v datech i pokud se v UI nezobrazuje nápadně", () => {
    assert.equal(campaigns.find((c) => c.id === "luggage-en")?.advertiser, "Bounce");
    assert.equal(campaigns.find((c) => c.id === "activities-en")?.advertiser, "GetYourGuide");
  });
});

describe("15./17. kampaně bez odkazu zůstávají v konfiguraci, ale nejsou způsobilé", () => {
  const NO_HREF_IDS = ["pharmacy-cs", "shopping-cs", "esim-en", "transfer-en"];

  test("15. všechny čtyři kampaně bez odkazu stále existují v poli s href: null", () => {
    for (const id of NO_HREF_IDS) {
      const c = campaigns.find((c) => c.id === id);
      assert.ok(c, `kampaň ${id} chybí v konfiguraci`);
      assert.equal(c!.href, null);
    }
  });

  test("kampaně bez odkazu nejsou způsobilé v žádném jazyce, který podporují", () => {
    for (const id of NO_HREF_IDS) {
      const c = campaigns.find((c) => c.id === id)!;
      for (const language of c.languages) {
        const eligible = filterCampaigns(campaigns, { language, now: NOW });
        assert.ok(!eligible.some((e) => e.id === id), `${id} by nemělo být způsobilé pro ${language}`);
      }
    }
  });

  test("17. pro češtinu momentálně neexistuje žádná způsobilá kampaň (žádný cs affiliate odkaz zatím není nastavený)", () => {
    const eligible = filterCampaigns(campaigns, { language: "cs", now: NOW });
    assert.deepEqual(eligible, []);
  });
});

describe("18.–22. vážený výběr pracuje jen se způsobilými kampaněmi (Bounce 45, GetYourGuide 30)", () => {
  test("18./19. způsobilá anglická množina je přesně [luggage-en, activities-en], součet vah 75", () => {
    const eligible = filterCampaigns(campaigns, { language: "en", now: NOW });
    assert.deepEqual(
      eligible.map((c) => c.id).sort(),
      ["activities-en", "luggage-en"]
    );
    const totalWeight = eligible.reduce((sum, c) => sum + c.weight, 0);
    assert.equal(totalWeight, 75);
  });

  test("20. deterministický výběr může vybrat Bounce (roll v dolní části intervalu)", () => {
    const eligible = filterCampaigns(campaigns, { language: "en", now: NOW });
    const result = weightedSelect(eligible, () => 0);
    assert.equal(result?.id, "luggage-en");
  });

  test("21. deterministický výběr může vybrat GetYourGuide (roll v horní části intervalu)", () => {
    const eligible = filterCampaigns(campaigns, { language: "en", now: NOW });
    const result = weightedSelect(eligible, () => 0.999999);
    assert.equal(result?.id, "activities-en");
  });

  test("22. poměr vah odpovídá hodnotám 45 a 30 (hranice na roll * 75 = 45)", () => {
    const eligible = filterCampaigns(campaigns, { language: "en", now: NOW });
    // luggage-en (Bounce, weight 45) je v poli první -> kumulativní interval [0, 45).
    assert.equal(weightedSelect(eligible, () => 44.999 / 75)?.id, "luggage-en");
    assert.equal(weightedSelect(eligible, () => 45.001 / 75)?.id, "activities-en");
  });

  test("esim-en a transfer-en (bez odkazu) neovlivňují součet vah ani výběr", () => {
    const eligible = filterCampaigns(campaigns, { language: "en", now: NOW });
    assert.ok(!eligible.some((c) => c.id === "esim-en" || c.id === "transfer-en"));
  });
});

describe("kampaně bez odkazu mají platné href podle hasValidAffiliateUrl (false), aktivní kampaně (true)", () => {
  test("hasValidAffiliateUrl vrací false pro všechny kampaně bez odkazu", () => {
    for (const id of ["pharmacy-cs", "shopping-cs", "esim-en", "transfer-en"]) {
      const c = campaigns.find((c) => c.id === id)!;
      assert.equal(hasValidAffiliateUrl(c), false);
    }
  });

  test("hasValidAffiliateUrl vrací true pro Bounce a GetYourGuide", () => {
    for (const id of ["luggage-en", "activities-en"]) {
      const c = campaigns.find((c) => c.id === id)!;
      assert.equal(hasValidAffiliateUrl(c), true);
    }
  });
});
