import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { AD_LINK_REL, hasValidAffiliateUrl, isValidAffiliateUrl } from "../lib/ads/validate-url.ts";
import type { AdCampaign } from "../lib/ads/types.ts";

// isValidAffiliateUrl JE přesně ta hodnota, kterou AdCard.tsx používá k
// rozhodnutí "vykreslit jako <a>, nebo jako neaktivní <span>" — projekt
// nemá komponentové/DOM testy (žádný jsdom/RTL, viz zadání "pokud
// projekt používá komponentové testy"), takže tahle čistá funkce je
// přesný testovatelný ekvivalent bodů 16–19 bez nutnosti nové těžké
// testovací závislosti.

describe("isValidAffiliateUrl", () => {
  test("16. href: null -> neaktivní (false)", () => {
    assert.equal(isValidAffiliateUrl(null), false);
    assert.equal(isValidAffiliateUrl(undefined), false);
    assert.equal(isValidAffiliateUrl(""), false);
  });

  test("17. platná absolutní https: URL -> aktivní (true)", () => {
    assert.equal(isValidAffiliateUrl("https://example.com/nabidka?utm=1"), true);
  });

  test("18a. http: se odmítne", () => {
    assert.equal(isValidAffiliateUrl("http://example.com"), false);
  });

  test("18b. javascript: se odmítne", () => {
    assert.equal(isValidAffiliateUrl("javascript:alert(1)"), false);
  });

  test("18c. data: se odmítne", () => {
    assert.equal(isValidAffiliateUrl("data:text/html,<script>alert(1)</script>"), false);
  });

  test("18d. relativní URL se odmítne", () => {
    assert.equal(isValidAffiliateUrl("/relative/path"), false);
    assert.equal(isValidAffiliateUrl("relative"), false);
  });

  test("18e. file: se odmítne", () => {
    assert.equal(isValidAffiliateUrl("file:///etc/passwd"), false);
  });

  test("10. řetězec obsahující jen mezery se odmítne", () => {
    assert.equal(isValidAffiliateUrl("   "), false);
    assert.equal(isValidAffiliateUrl("\t\n"), false);
  });

  test("syntakticky neplatná URL se odmítne, nespadne", () => {
    assert.doesNotThrow(() => isValidAffiliateUrl("not a url at all"));
    assert.equal(isValidAffiliateUrl("not a url at all"), false);
  });
});

describe("AD_LINK_REL", () => {
  test("19. aktivní odkaz používá rel=\"sponsored noopener noreferrer\"", () => {
    assert.equal(AD_LINK_REL, "sponsored noopener noreferrer");
  });
});

describe("hasValidAffiliateUrl", () => {
  function campaign(href: string | null): AdCampaign {
    return {
      id: "test",
      enabled: true,
      languages: ["en"],
      title: { en: "T" },
      description: { en: "D" },
      cta: { en: "C" },
      href,
      advertiser: null,
      weight: 10,
    };
  }

  test("kampaň s platnou https: URL je způsobilá", () => {
    assert.equal(hasValidAffiliateUrl(campaign("https://example.com/x")), true);
  });

  test("kampaň s href: null není způsobilá", () => {
    assert.equal(hasValidAffiliateUrl(campaign(null)), false);
  });

  test("kampaň s http: URL není způsobilá", () => {
    assert.equal(hasValidAffiliateUrl(campaign("http://example.com")), false);
  });

  test("validace nemění vstupní href kampaně (žádná serializace zpět)", () => {
    const original = "https://example.com/x?a=1&b=2";
    const c = campaign(original);
    hasValidAffiliateUrl(c);
    assert.equal(c.href, original);
  });
});
