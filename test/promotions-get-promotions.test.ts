import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { getActivePromotionCampaigns } from "../lib/promotions/get-promotions.ts";
import type { UcaRecord } from "../lib/content-api/types.ts";

const originalFetch = globalThis.fetch;
const originalEnv = { ...process.env };

function mockJsonResponse(status: number, body: unknown): typeof fetch {
  return (async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    })) as typeof fetch;
}

function record(overrides: Partial<UcaRecord["data"]> = {}, id = 1): UcaRecord {
  return {
    id,
    status: "approved",
    data: {
      placement: "finder_results",
      page_pattern: "*",
      title: "Carrying luggage around Prague?",
      body_html: "Find secure luggage storage near metro stations across the city.",
      cta_label: "Find luggage storage",
      href: "https://go.bounce.com/KDEJEMETROCZ75593727",
      weight: 45,
      affiliate_key: "kdejemetro_luggage_bounce",
      locale: "en",
      active: true,
      external_key: "kdejemetro:luggage-en:finder_results",
      ...overrides,
    },
    media: [],
    created_at: "2026-09-03T00:00:00.000Z",
    updated_at: "2026-09-03T00:00:00.000Z",
  };
}

beforeEach(() => {
  process.env.UCA_BASE_URL = "https://content-api.example.test";
  process.env.UCA_PROJECT_SLUG = "kdejemetro";
  process.env.UCA_API_TOKEN = "test-token";
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  process.env = { ...originalEnv };
});

describe("getActivePromotionCampaigns — mapování Content API -> AdCampaign", () => {
  test("reálná kampaň (Bounce) se namapuje se zachovanou přesnou affiliate URL", async () => {
    globalThis.fetch = mockJsonResponse(200, { data: [record()] });
    const campaigns = await getActivePromotionCampaigns("finder_results");
    assert.equal(campaigns.length, 1);
    assert.equal(campaigns[0].href, "https://go.bounce.com/KDEJEMETROCZ75593727");
    assert.equal(campaigns[0].weight, 45);
  });

  test("locale=en se namapuje na languages: ['en'] (kampaň se nenabízí v cs)", async () => {
    globalThis.fetch = mockJsonResponse(200, { data: [record()] });
    const campaigns = await getActivePromotionCampaigns("finder_results");
    assert.deepEqual(campaigns[0].languages, ["en"]);
    assert.equal(campaigns[0].title.cs, undefined);
    assert.equal(campaigns[0].title.en, "Carrying luggage around Prague?");
  });

  test("chybějící locale (undefined) znamená všechny 4 jazyky", async () => {
    globalThis.fetch = mockJsonResponse(200, { data: [record({ locale: undefined })] });
    const campaigns = await getActivePromotionCampaigns("finder_results");
    assert.deepEqual([...campaigns[0].languages].sort(), ["cs", "de", "en", "uk"]);
  });

  test("active: false se vůbec nenamapuje", async () => {
    globalThis.fetch = mockJsonResponse(200, { data: [record({ active: false })] });
    const campaigns = await getActivePromotionCampaigns("finder_results");
    assert.equal(campaigns.length, 0);
  });

  test("jiný placement, než se vyžaduje, se vyřadí (obranná pojistka i přes to, že filtrování dělá už UCA query)", async () => {
    globalThis.fetch = mockJsonResponse(200, { data: [record({ placement: "night_finder_results" })] });
    const campaigns = await getActivePromotionCampaigns("finder_results");
    assert.equal(campaigns.length, 0);
  });

  test("chybějící title se vyřadí (nemapovatelné na kartu)", async () => {
    globalThis.fetch = mockJsonResponse(200, { data: [record({ title: undefined })] });
    const campaigns = await getActivePromotionCampaigns("finder_results");
    assert.equal(campaigns.length, 0);
  });

  test("chybějící href se namapuje jako href: null (kampaň zůstává, ale filterCampaigns ji dál vyřadí — stejné chování jako dřív u lib/ads/campaigns.ts placeholderů)", async () => {
    globalThis.fetch = mockJsonResponse(200, { data: [record({ href: undefined })] });
    const campaigns = await getActivePromotionCampaigns("finder_results");
    assert.equal(campaigns.length, 1);
    assert.equal(campaigns[0].href, null);
  });

  test("advertiser a icon nejsou v Content API schématu — vždy null/undefined (vědomé zjednodušení, viz komentář v get-promotions.ts)", async () => {
    globalThis.fetch = mockJsonResponse(200, { data: [record()] });
    const campaigns = await getActivePromotionCampaigns("finder_results");
    assert.equal(campaigns[0].advertiser, null);
    assert.equal(campaigns[0].icon, undefined);
  });

  test("8. výpadek API (HTTP 500) vrátí prázdné pole, nevyhodí výjimku", async () => {
    globalThis.fetch = mockJsonResponse(500, { error: { message: "server error" } });
    await assert.doesNotReject(() => getActivePromotionCampaigns("finder_results"));
    const campaigns = await getActivePromotionCampaigns("finder_results");
    assert.deepEqual(campaigns, []);
  });

  test("8. neplatná/nečekaná JSON odpověď vrátí prázdné pole, nevyhodí výjimku", async () => {
    globalThis.fetch = (async () => new Response("not json", { status: 200 })) as typeof fetch;
    await assert.doesNotReject(() => getActivePromotionCampaigns("finder_results"));
  });

  test("8. chybějící env konfigurace (UCA_* nenastavené) vrátí prázdné pole, appka nespadne", async () => {
    delete process.env.UCA_BASE_URL;
    delete process.env.UCA_PROJECT_SLUG;
    delete process.env.UCA_API_TOKEN;
    const campaigns = await getActivePromotionCampaigns("finder_results");
    assert.deepEqual(campaigns, []);
  });

  test("prázdný seznam records (žádná aktivní promotion) vrátí prázdné pole, appka funguje normálně", async () => {
    globalThis.fetch = mockJsonResponse(200, { data: [] });
    const campaigns = await getActivePromotionCampaigns("finder_results");
    assert.deepEqual(campaigns, []);
  });

  test("request na Content API posílá filter[placement] a status=approved (dotazuje se jen na relevantní data)", async () => {
    let capturedUrl = "";
    globalThis.fetch = (async (input: string | URL) => {
      capturedUrl = String(input);
      return new Response(JSON.stringify({ data: [] }), { status: 200 });
    }) as typeof fetch;

    await getActivePromotionCampaigns("night_finder_results");
    assert.match(capturedUrl, /status=approved/);
    assert.match(capturedUrl, /filter%5Bplacement%5D=night_finder_results|filter\[placement\]=night_finder_results/);
  });
});
