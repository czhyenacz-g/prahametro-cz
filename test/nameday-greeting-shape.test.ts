import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Projekt nemá DOM/komponentové testy (žádný jsdom/RTL, viz README a
// předchozí testy v test/ads-*.test.ts) — tenhle test proto ověřuje
// požadavky na NamedayGreeting.tsx (10./11./12. ze zadání: není odkaz,
// neobsahuje štítek reklamy, negeneruje reklamní událost) přímo nad
// zdrojovým textem komponenty, deterministicky a bez nutnosti renderu.
const source = readFileSync(fileURLToPath(new URL("../components/NamedayGreeting.tsx", import.meta.url)), "utf-8");

describe("NamedayGreeting.tsx — přání není reklama (statická kontrola zdroje)", () => {
  test("10. přání neobsahuje žádný <a> odkaz ani href atribut", () => {
    assert.doesNotMatch(source, /<a[\s>]/);
    assert.doesNotMatch(source, /href=/);
  });

  test("neobsahuje tlačítko/CTA prvek", () => {
    assert.doesNotMatch(source, /<button/);
  });

  test("11. nevykresluje štítek 'Reklama'/'Advertisement' ani nečte dict.ad.label (komentáře smí slovo 'reklama' zmiňovat jen v negaci, proto case-sensitive kontrola přesných dict hodnot)", () => {
    assert.doesNotMatch(source, /"Reklama"/);
    assert.doesNotMatch(source, /"Advertisement"/);
    assert.doesNotMatch(source, /dict\.ad\.label/);
    assert.doesNotMatch(source, /useI18n/); // přání nečte dict vůbec, text je čistě český literál (viz HEADING)
  });

  test("neobsahuje text 'Nabídku připravujeme' ani název partnera/advertiser", () => {
    assert.doesNotMatch(source, /Nabídku připravujeme/);
    assert.doesNotMatch(source, /advertiser/i);
  });

  test("12. negeneruje reklamní událost — žádné emitAdEvent, campaignId ani import z lib/ads/events.ts", () => {
    assert.doesNotMatch(source, /emitAdEvent/);
    assert.doesNotMatch(source, /campaignId/);
    assert.doesNotMatch(source, /lib\/ads\/events/);
  });

  test("neukládá se do sessionStorage a nemá affiliate URL", () => {
    assert.doesNotMatch(source, /sessionStorage/);
    assert.doesNotMatch(source, /AD_LINK_REL/);
  });

  test("nepoužívá role=\"alert\", jen aria-live=\"polite\" (pokud vůbec)", () => {
    assert.doesNotMatch(source, /role="alert"/);
    const ariaLiveMatches = [...source.matchAll(/aria-live="([^"]*)"/g)];
    for (const match of ariaLiveMatches) {
      assert.equal(match[1], "polite");
    }
  });

  test("kořenový element je <aside> (statický informační prvek, ne reklamní <section>)", () => {
    assert.match(source, /<aside/);
  });
});

describe("AdCard.tsx — zůstává čistě reklamní komponenta", () => {
  const adCardSource = readFileSync(fileURLToPath(new URL("../components/ads/AdCard.tsx", import.meta.url)), "utf-8");

  test("neobsahuje žádnou logiku jmenin/kalendáře", () => {
    assert.doesNotMatch(adCardSource, /nameday/i);
    assert.doesNotMatch(adCardSource, /Prague/i);
    assert.doesNotMatch(adCardSource, /CalendarDays/);
  });
});
