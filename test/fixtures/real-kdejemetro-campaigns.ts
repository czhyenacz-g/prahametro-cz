import type { AdCampaign } from "../../lib/ads/types.ts";

// Testovací zrcadlo skutečné produkční konfigurace v Content API
// (content-api.darbujan.com/admin/promotions, project "kdejemetro") —
// nahrazuje dřívější `lib/ads/campaigns.ts` (smazáno, viz git historie)
// jako zdroj "realCampaigns" fixture pro testy výběrové logiky.
// Přesný tvar (href/weight/jazyk) ověřuje samostatně
// test/promotions-get-promotions.test.ts nad skutečným mapováním
// `UcaRecord -> AdCampaign` — tenhle soubor jen simuluje VÝSTUP toho
// mapování pro testy, které samotné mapování neřeší (select-ad,
// resolve-slot-content, language-fallback).
export const realKdeJeMetroCampaigns: AdCampaign[] = [
  {
    id: "content-api-luggage-en",
    enabled: true,
    languages: ["en"],
    title: { en: "Carrying luggage around Prague?" },
    description: { en: "Find secure luggage storage near metro stations across the city." },
    cta: { en: "Find luggage storage" },
    href: "https://go.bounce.com/KDEJEMETROCZ75593727",
    advertiser: null,
    weight: 45,
  },
  {
    id: "content-api-activities-en",
    enabled: true,
    languages: ["en"],
    title: { en: "Looking for things to do in Prague?" },
    description: { en: "Discover tours, attractions and experiences around the city." },
    cta: { en: "Explore Prague" },
    href: "https://www.getyourguide.com/prague-l10/?partner_id=XGLGW1H&utm_medium=online_publisher",
    advertiser: null,
    weight: 30,
  },
];
