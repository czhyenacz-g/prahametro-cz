import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { resolveSlotContent } from "../lib/ads/resolve-slot-content.ts";
import { resolveSelectedAd } from "../lib/ads/select-ad.ts";
import { filterCampaigns } from "../lib/ads/filter-campaigns.ts";
import { realKdeJeMetroCampaigns as realCampaigns } from "./fixtures/real-kdejemetro-campaigns.ts";
import type { AdCampaign, AdResolutionState } from "../lib/ads/types.ts";

const NOW = new Date("2026-06-15T12:00:00Z");

function csCampaign(overrides: Partial<AdCampaign> = {}): AdCampaign {
  return {
    id: "cs-test",
    enabled: true,
    languages: ["cs"],
    title: { cs: "Titulek" },
    description: { cs: "Popis" },
    cta: { cs: "Akce" },
    href: "https://example.cz/nabidka",
    advertiser: null,
    weight: 10,
    ...overrides,
  };
}

/** Stejná logika jako hooks/useSelectedAd.ts, jen bez efektu/storage I/O (ty jsou testované samostatně). */
function simulateResolution(campaigns: AdCampaign[], storedId: string | null, ctx: { language: "cs" | "en"; now: Date }): AdResolutionState {
  const selected = resolveSelectedAd(campaigns, storedId, ctx);
  return selected ? { status: "selected", campaign: selected } : { status: "empty" };
}

describe("resolveSlotContent — fallback reklama vs. přání vs. nic", () => {
  test("1. česká reklama s platným HTTPS odkazem -> zobrazí se reklama", () => {
    const cs = csCampaign({ id: "cs-active", href: "https://example.cz/x" });
    const resolution = simulateResolution([cs], null, { language: "cs", now: NOW });
    const content = resolveSlotContent(resolution, "cs");
    assert.equal(content.kind, "ad");
    assert.equal(content.kind === "ad" && content.campaign.id, "cs-active");
  });

  test("2. české kampaně pouze s href: null -> zobrazí se přání", () => {
    const cs = csCampaign({ href: null });
    const resolution = simulateResolution([cs], null, { language: "cs", now: NOW });
    assert.deepEqual(resolveSlotContent(resolution, "cs"), { kind: "nameday" });
  });

  test("3. česká kampaň s neplatným URL (http:) -> zobrazí se přání", () => {
    const cs = csCampaign({ href: "http://example.cz/x" });
    const resolution = simulateResolution([cs], null, { language: "cs", now: NOW });
    assert.deepEqual(resolveSlotContent(resolution, "cs"), { kind: "nameday" });
  });

  test("4. česká kampaň je vypnutá -> zobrazí se přání", () => {
    const cs = csCampaign({ enabled: false });
    const resolution = simulateResolution([cs], null, { language: "cs", now: NOW });
    assert.deepEqual(resolveSlotContent(resolution, "cs"), { kind: "nameday" });
  });

  test("5. česká kampaň je mimo platnost -> zobrazí se přání", () => {
    const cs = csCampaign({ validTo: "2026-01-01T00:00:00Z" });
    const resolution = simulateResolution([cs], null, { language: "cs", now: NOW });
    assert.deepEqual(resolveSlotContent(resolution, "cs"), { kind: "nameday" });
  });

  test("6. žádná česká kampaň v poli -> zobrazí se přání", () => {
    const resolution = simulateResolution([], null, { language: "cs", now: NOW });
    assert.deepEqual(resolveSlotContent(resolution, "cs"), { kind: "nameday" });
  });

  test("7. žádná způsobilá anglická kampaň -> nevykreslí se nic (fallback je jen český)", () => {
    const resolution = simulateResolution([], null, { language: "en", now: NOW });
    assert.deepEqual(resolveSlotContent(resolution, "en"), { kind: "none" });
  });

  test("8. anglická Bounce kampaň (reálná konfigurace) -> zobrazí se Bounce", () => {
    const resolution = simulateResolution(realCampaigns, null, { language: "en", now: NOW });
    const content = resolveSlotContent(resolution, "en");
    assert.equal(content.kind, "ad");
    assert.ok(content.kind === "ad" && (content.campaign.id === "content-api-luggage-en" || content.campaign.id === "content-api-activities-en"));
  });

  test("9. stav pending -> nevykreslí se reklama ani přání, bez ohledu na jazyk", () => {
    assert.deepEqual(resolveSlotContent({ status: "pending" }, "cs"), { kind: "pending" });
    assert.deepEqual(resolveSlotContent({ status: "pending" }, "en"), { kind: "pending" });
  });

  test("13. po doplnění platného českého odkazu přání automaticky zmizí a nahradí ho reklama", () => {
    const withoutHref = csCampaign({ id: "cs-later", href: null });
    const before = resolveSlotContent(simulateResolution([withoutHref], null, { language: "cs", now: NOW }), "cs");
    assert.deepEqual(before, { kind: "nameday" });

    const withHref = { ...withoutHref, href: "https://example.cz/aktivovano" };
    const after = resolveSlotContent(simulateResolution([withHref], null, { language: "cs", now: NOW }), "cs");
    assert.equal(after.kind, "ad");
  });

  test("14. staré ID uložené před migrací na Content API (kampaň, která už neexistuje) neblokuje přání ani nový výběr", () => {
    // "pharmacy-cs" byla stará lokální kampaň (lib/ads/campaigns.ts, smazáno) — v Content API pro cs zatím žádná neexistuje.
    const resolution = simulateResolution(realCampaigns, "pharmacy-cs", { language: "cs", now: NOW });
    assert.deepEqual(resolveSlotContent(resolution, "cs"), { kind: "nameday" });
  });

  test("reálná konfigurace, čeština, žádný uložený výběr -> přání (dokud cs affiliate odkaz chybí)", () => {
    const resolution = simulateResolution(realCampaigns, null, { language: "cs", now: NOW });
    assert.deepEqual(resolveSlotContent(resolution, "cs"), { kind: "nameday" });
  });

  test("filterCampaigns nezná pojem 'nameday' — přání je čistě až nad výsledkem výběru, ne součást vážené rotace", () => {
    const eligible = filterCampaigns(realCampaigns, { language: "cs", now: NOW });
    assert.deepEqual(eligible, []); // žádná způsobilá cs kampaň zatím neexistuje, potvrzuje test výše
  });
});
