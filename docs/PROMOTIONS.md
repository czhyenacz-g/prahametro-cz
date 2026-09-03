# Reklamy (promotions) — Content API integrace

Doprovodný dokument k migraci reklamního systému na
[Universal Content API](https://content-api.darbujan.com) (dále UCA),
provedené 2026-09. Doplňuje sekci "Reklamy" v `README.md` o technické
detaily; pro postup správy reklam v adminu viz README.

## Proč

Reklamy byly do 2026-09 natvrdo zapsané v `lib/ads/campaigns.ts` — nová
reklama nebo změna affiliate odkazu vyžadovala úpravu kódu a nový
deploy. UCA je sdílený backend (Laravel + Filament), který už spravoval
promotions pro HowToFish.cz — KdeJeMetro.cz je jeho druhý klient,
project slug `kdejemetro`.

## Architektura

```
components/HomePage.tsx (Server Component)
  → getActivePromotionCampaigns("finder_results")   [lib/promotions/get-promotions.ts]
    → getRecords("promotions", { filter: { placement }, ... })  [lib/content-api/records.ts]
      → GET /api/v1/projects/kdejemetro/collections/promotions/records  [lib/content-api/client.ts]
  → <HomeClient promotionCampaigns={...} />  (prop, ne Context)
    → <FinderSection promotionCampaigns={...} />
      → <AdSlot campaigns={...} placement="finder-results" />  ("use client")
        → useSelectedAd(campaigns, locale, stationId)  [hooks/useSelectedAd.ts, BEZE ZMĚNY]
          → resolveSelectedAd → filterCampaigns → weightedSelect  [lib/ads/*.ts, BEZE ZMĚNY]
```

Stejný vzor nezávisle pro `components/night/NightPage.tsx` →
`night_finder_results` → `NightFinder.tsx`.

**Klíčové architektonické rozhodnutí:** veškerá výběrová logika
(`lib/ads/filter-campaigns.ts`, `weighted-select.ts`, `select-ad.ts`,
`language-fallback.ts`, `validate-url.ts`, `resolve-slot-content.ts`) i
`hooks/useSelectedAd.ts` zůstaly **beze změny** — jen `lib/ads/campaigns.ts`
(statické pole) nahradilo `lib/promotions/get-promotions.ts`
(server-side fetch z UCA, mapovaný na stejný typ `AdCampaign`). Nulové
riziko regrese ve výběrové logice, protože se vůbec nezměnila.

## Data flow a cache

- Fetch se děje jen na serveru (Server Components výše), token nikdy
  neopustí server (`lib/content-api/client.ts`, env `UCA_API_TOKEN`).
- Next.js `next: { revalidate: 300 }` (~5 minut) — viz
  `lib/promotions/get-promotions.ts::REVALIDATE_SECONDS`.
- Výpadek/chybějící konfigurace UCA: `getRecords(...).catch(() => [])`
  — appka nikdy nespadne, reklamní slot se prostě chová jako "žádná
  způsobilá kampaň" (viz `lib/ads/resolve-slot-content.ts`).

## Mapování `UcaRecord` → `AdCampaign`

`lib/promotions/get-promotions.ts::mapRecordToCampaign()`:

| UCA `data.*` | `AdCampaign` pole | Poznámka |
|---|---|---|
| `active` | `enabled` (implicitně) | `!== true` → record se vůbec nenamapuje |
| `placement` | — (jen filtr) | musí odpovídat požadovanému placementu |
| `title` | `title[lang]` | povinné, jinak `null` |
| `body_html` | `description[lang]` | prostý text (appka rich text nerenderuje) |
| `cta_label` | `cta[lang]` | |
| `href` | `href` | přesně jak je v UCA, žádná úprava |
| `weight` | `weight` | fallback `1` |
| `locale` | `languages` | chybí → `["cs","en","de","uk"]`, jinak `[locale]` |
| `valid_from`/`valid_until` | `validFrom`/`validTo` | |
| — | `advertiser` | vždy `null` — UCA schéma nemá odpovídající pole |
| — | `icon` | vždy `undefined` — UCA schéma nemá odpovídající pole |

`advertiser`/`icon` jsou vědomé zjednodušení: UCA promotion schéma je
sdílené s HowToFish.cz/Gembl.cz a nemá pole pro jméno partnera ani
kategorii ikony — přidávat je jen kvůli KdeJeMetro by byl zbytečný
rozsah navíc. Karta po migraci vždy ukazuje obecnou výchozí ikonu.

## Placementy a jazyk

- `finder_results` — pod výsledky hledání nejbližšího metra.
- `night_finder_results` — pod výsledky noční dopravy.

Obě hodnoty odpovídají `App\Enums\PromotionPlacement` v UCA (přidané
touhle migrací, bez obrázku — `requiresImage()` vrací `false`, appka
zobrazuje jen ikonu + text, žádný banner).

`data.locale` je nepovinné pole v UCA adminu — beze změny appka nabízí
kampaň jen pro daný jazyk, s `de`/`uk` fallbackem na `en`
(`lib/ads/language-fallback.ts`, beze změny), přesně jako dřív u
statického pole.

## Import existujících reklam (2026-09, jednorázově)

Dvě reálné affiliate kampaně z `lib/ads/campaigns.ts` (Bounce =
`luggage-en`, GetYourGuide = `activities-en`) byly importovány do UCA
příkazem `promotions:import-kdejemetro-ads` (repozitář
`universal-content-api`) — idempotentní, klíčováno
`data.external_key = "kdejemetro:<puvodni-id>:<placement>"`. Čtyři
placeholder kampaně bez affiliate URL (`pharmacy-cs`, `shopping-cs`,
`esim-en`, `transfer-en`) se NEIMPORTOVALY — v produkci se nikdy
nezobrazovaly. Podrobnosti viz
`universal-content-api/docs/KDEJEMETRO_INTEGRATION.md`.

## Bezpečnost

- `UCA_API_TOKEN` má jen scope `records:read` — appka nikdy nic do UCA
  nezapisuje ani nenahrává, čtení promotions je jediné použití.
- Token je jen server-side env proměnná (Vercel Production + Preview),
  nikdy v client bundlu ani v repozitáři (`.env.example` má jen prázdný
  název proměnné).
- Poloha uživatele/ID stanice se do UCA nikdy neposílají.
