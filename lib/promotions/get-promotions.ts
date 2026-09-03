// Server-only (viz komentář v ../content-api/client.ts) — importuj jen
// ze Server Component (components/HomePage.tsx, components/night/NightPage.tsx),
// nikdy z "use client" komponenty.
import { getRecords } from "../content-api/records.ts";
import type { UcaRecord } from "../content-api/types.ts";
import type { AdCampaign, Language } from "../ads/types.ts";
import type { PromotionPlacement } from "./types.ts";

const COLLECTION = "promotions";
const ALL_LANGUAGES: readonly Language[] = ["cs", "en", "de", "uk"];
const VALID_LANGUAGES = new Set<string>(ALL_LANGUAGES);

// Reklamy se dnes spravují výhradně přes content-api.darbujan.com/admin/
// promotions (viz zadání) — obsah tam nemění nikdo automaticky, takže
// je bezpečné cachovat déle než typický dynamický obsah appky. ~5 minut
// (revalidate: 300, viz zadání bod 7) — změna v adminu se tedy neprojeví
// okamžitě, jen s tímhle zpožděním, což je podle zadání v pořádku.
const REVALIDATE_SECONDS = 300;

/**
 * `UcaRecord` (syrová odpověď Content API) -> `AdCampaign` (existující,
 * plně otestovaný typ/výběrová logika appky, viz lib/ads/select-ad.ts).
 * Content API o poli `active` nic neví (je to jen další hodnota v
 * `data`) — filtrování na `active !== true` je čistě na nás, stejně
 * jako u UCA promotions v HowToFish.cz/Gembl.cz.
 *
 * `null` = record není zobrazitelná reklama (chybí povinné pole, jiný
 * placement, neaktivní) — zbytek požadavků (platný https: odkaz,
 * kompletní text pro daný jazyk) řeší až `filterCampaigns` po namapování,
 * stejně jako to dřív dělal pro statické `lib/ads/campaigns.ts`.
 *
 * Vědomé zjednodušení oproti dřívějším statickým kampaním: `advertiser`
 * (jméno partnera) a `icon` (kategorie ikony) v UCA promotion schématu
 * nemají odpovídající pole — nejde o byznys rozhodnutí appky, ale o to,
 * že obecné Content API schéma (sdílené s HowToFish.cz/Gembl.cz) žádné
 * takové pole nemá a přidávat ho jen kvůli KdeJeMetro by byl zbytečný
 * rozsah navíc (viz zadání "nezaváděj komplikovaný targeting/nový
 * systém"). Karta proto vždy ukazuje obecnou výchozí ikonu (stejné
 * chování jako AdIcon.tsx dřív pro `icon: undefined`) a bez jména
 * partnera.
 */
function mapRecordToCampaign(record: UcaRecord, placement: PromotionPlacement): AdCampaign | null {
  const data = record.data;
  if (data.active !== true) return null;
  if (data.placement !== placement) return null;

  const title = typeof data.title === "string" ? data.title.trim() : "";
  if (!title) return null;

  const description = typeof data.body_html === "string" ? data.body_html.trim() : "";
  const cta = typeof data.cta_label === "string" ? data.cta_label.trim() : "";

  const rawLocale = typeof data.locale === "string" ? data.locale : null;
  const languages: Language[] = rawLocale && VALID_LANGUAGES.has(rawLocale) ? [rawLocale as Language] : [...ALL_LANGUAGES];

  const href = typeof data.href === "string" && data.href ? data.href : null;
  const weight = typeof data.weight === "number" && data.weight > 0 ? data.weight : 1;
  const validFrom = typeof data.valid_from === "string" ? data.valid_from : undefined;
  const validTo = typeof data.valid_until === "string" ? data.valid_until : undefined;

  return {
    id: `content-api-${record.id}`,
    enabled: true,
    languages,
    title: Object.fromEntries(languages.map((lang) => [lang, title])),
    description: Object.fromEntries(languages.map((lang) => [lang, description])),
    cta: Object.fromEntries(languages.map((lang) => [lang, cta])),
    href,
    advertiser: null,
    weight,
    validFrom,
    validTo,
  };
}

/**
 * Všechny reklamy daného placementu z Content API, namapované na
 * `AdCampaign[]` — dál se posílají do STEJNÉ, beze změny ponechané
 * výběrové logiky (`lib/ads/select-ad.ts`, `hooks/useSelectedAd.ts`)
 * jako dřív dostávala statická `lib/ads/campaigns.ts`. Výpadek/chybějící
 * konfigurace Content API se zachytí a vrátí prázdné pole — appka nikdy
 * nespadne kvůli reklamě (viz zadání bod 8), reklamní karta se prostě
 * nezobrazí (fallback na svátkové přání v češtině přes
 * lib/ads/resolve-slot-content.ts zůstává beze změny).
 */
export async function getActivePromotionCampaigns(placement: PromotionPlacement): Promise<AdCampaign[]> {
  const records = await getRecords(COLLECTION, {
    status: "approved",
    filter: { placement },
    perPage: 50,
    revalidateSeconds: REVALIDATE_SECONDS,
  }).catch(() => []);

  const campaigns: AdCampaign[] = [];
  for (const record of records) {
    const campaign = mapRecordToCampaign(record, placement);
    if (campaign) campaigns.push(campaign);
  }
  return campaigns;
}
