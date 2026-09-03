# KdeJeMetro.cz — MVP

Mobilní utilita: jedním klepnutím zjisti 2–3 nejbližší konkrétní vstupy do
pražského metra a spusť k nim pěší navigaci v Google/Apple Maps. Plus
vlastní čitelná, přibližovatelná schematická mapa metra (linky A, B, C)
a jedna nenápadná reklamní pozice (zatím jen placeholder).

## Co MVP umí

- Najde tvou polohu (`navigator.geolocation`) a ukáže 3 nejbližší vstupy
  do metra — s barevnými odznaky linek, orientační vzdáleností/časem
  chůze a tlačítkem na pěší navigaci k přesným GPS souřadnicím vstupu.
- Vlastní schematická SVG mapa metra s pinch-to-zoom, panem a tlačítky
  zoomu — klepnutí na stanici ukáže její linky a všechny její vstupy.
- V development režimu jde vyzkoušet bez GPS přes tři demo polohy
  (Václavské náměstí, Anděl, Hlavní nádraží) — v produkčním buildu se
  tahle sekce vůbec nevyrenderuje.
- Čeština/angličtina jako dvě samostatné, serverově vykreslené a
  indexovatelné URL — `/` (čeština) a `/en` (angličtina), viz sekce
  [SEO a jazykové URL](#seo-a-jazykové-url) níže. Přepínač v hlavičce
  je skutečný odkaz mezi oběma routami, žádné klientské přepnutí ani
  detekce/uložení preferovaného jazyka v `localStorage` — URL je jediný
  zdroj pravdy.
- Volitelný "18+" humorný textový režim, který mění jen hlavní hlášku
  (žádný erotický obsah, žádná kontrola věku) — nezávislý na jazyce,
  taky uložený v `localStorage`.
- Když je uživatel dál než 25 km od nejbližšího vstupu, appka to
  zřetelně označí a ukáže tři nejbližší RŮZNÉ stanice místo tří vstupů
  jedné stanice poblíž.
- Jednoduchý, rozšiřitelný systém rotovatelných affiliate reklam pod
  výsledky hledání — viz sekce [Reklamy](#reklamy) níže.
- Když pro češtinu zrovna není žádná způsobilá reklama, appka místo ní
  ukáže české přání se jmeninami (ne reklamu) — viz [České přání se
  jmeninami](#české-přání-se-jmeninami) níže.
- Nenápadné tlačítko **Odjezdy** na každé výsledkové kartě — otevře
  panel s nejbližšími plánovanými odjezdy dané linky/směru a posledním
  vlakem podle GTFS jízdního řádu, viz [Odjezdy](#odjezdy) níže.

## Co MVP záměrně NEumí

- Neukazuje polohu vlaků v reálném čase — jen plánované odjezdy podle
  GTFS jízdního řádu (viz [Odjezdy](#odjezdy)), žádné zpoždění/výluky.
- Neintegruje žádné placené mapové API — navigace se otevírá externě
  (Google Maps / Apple Maps).
- Nemá účty, přihlašování, CMS, administraci ani žádný backend za běhu.
- Nepoužívá vlastní/DPP grafiku — mapa i favicon jsou naše vlastní
  jednoduchá prezentační vrstva.

## Lokální spuštění

```bash
npm install
npm run data:refresh   # stáhne aktuální PID GTFS a vygeneruje data/*.json (viz níže)
npm run dev
# → http://localhost:3000
```

`data/metro-entrances.json` a `data/metro-line-order.json` jsou
verzované v repozitáři, takže `npm run dev`/`npm run build` fungují i
bez spuštění importu — `data:refresh` stačí pouštět jen když chceš
data aktualizovat.

## `npm run data:refresh`

Stáhne oficiální feed `https://data.pid.cz/PID_GTFS.zip`, rozbalí jen
potřebné CSV soubory (`routes.txt`, `trips.txt`, `stops.txt`,
`stop_times.txt`, `calendar.txt`, `calendar_dates.txt` — vyžaduje
systémový příkaz `unzip`), odvodí skutečné vstupy do metra, jejich
linky a plánované odjezdy, a zapíše:

- `data/metro-entrances.json` — všechny vstupy (souřadnice, linky,
  bezbariérovost),
- `data/metro-line-order.json` — reálné pořadí stanic na každé lince
  (podle `stop_sequence`), ze kterého vychází schematická mapa,
- `public/data/departures/{stationId}.json` — jeden kompaktní soubor
  odjezdů na stanici (viz [Odjezdy](#odjezdy) níže).

Import **selže s chybou** (nenulový návratový kód), pokud by výsledek
byl nápadně malý (méně než 50 stanic nebo 200 vstupů), nebo pokud by
některá stanice appky neměla v GTFS odpovídající naplánované odjezdy —
ochrana proti omylem nasazeným prázdným/změněným/nekonzistentním datům.
Appka za běhu žádné GTFS/ZIP nezná, jen tyhle hotové JSONy.

## Zdroj dat a licence

Dopravní data pocházejí z oficiálního feedu
[Pražské integrované dopravy (PID)](https://pid.cz/opendata/),
licence **CC BY 4.0** — atribuce je vždy v patičce appky.

Vzdálenosti zobrazené u výsledků jsou **vzdušné** (Haversinova
formule), ne délka skutečné pěší trasy — appka to u výsledků
transparentně říká. Skutečnou trasu spočítá až externí navigace
(Google/Apple Maps), na kterou appka jen odkazuje.

## Nasazení na Vercel (bez vlastní domény)

Projekt je běžná Next.js 15 aplikace, žádná databáze ani env proměnné
nejsou potřeba:

```bash
npm i -g vercel   # pokud ještě není nainstalované
vercel --prod
```

Vercel přidělí `*.vercel.app` URL — to stačí pro MVP. Vlastní doména se
připojí později (Project → Settings → Domains), kód se kvůli tomu měnit
nemusí (`app/config/site.ts` si `SITE_URL` sám odvodí z
`NEXT_PUBLIC_SITE_URL`/`VERCEL_URL`).

## SEO a jazykové URL

Čeština (`/`) a angličtina (`/en`) jsou dvě samostatné, serverově
vykreslené a nezávisle indexovatelné routy — ne jedna URL s klientským
přepínáním jazyka. Jazyk stránky určuje výhradně URL; appka nikdy
needetekuje jazyk prohlížeče ani needetekuje/nepřepisuje jazyk z
`localStorage` (jediná výjimka je nezávislý 18+ přepínač, který
zůstává v `localStorage` a jazyk nijak neovlivňuje).

- **Routy a "multiple root layouts":** `app/(cs)/` (route group, na URL
  se neprojeví) obsahuje `layout.tsx` (`<html lang="cs">`) a `page.tsx`
  (route `/`). `app/en/` obsahuje vlastní `layout.tsx`
  (`<html lang="en">`) a `page.tsx` (route `/en`). Jde o standardní
  Next.js vzorec "multiple root layouts" — proto už neexistuje jeden
  sdílený `app/layout.tsx`. `app/not-found.tsx` je fallback pro cestu,
  která nepatří ani pod jednu z těchto dvou skupin.
- **Sdílený obsah:** obě routy vykreslují stejnou
  `components/HomePage.tsx` (Server Component) s `locale` propem —
  hledání/mapa/reklamy zůstávají shodné, mění se jen jazyk textů
  (`lib/i18n/dictionary.ts`) a SEO obsah (`lib/seo/content.ts`).
- **`I18nProvider`** (`components/i18n/I18nProvider.tsx`) dostává
  `locale` jako povinný prop odvozený serverem — nikdy sám nedetekuje
  ani neukládá jazyk. `LanguageToggle` je skutečný `next/link` mezi
  `/` a `/en`, ne klientské přepnutí stavu.
- **SEO metadata** (title/description/canonical/hreflang/OG/Twitter,
  `robots: index,follow`) jsou u obou stránek nastavená přímo v
  `app/(cs)/page.tsx` / `app/en/page.tsx` přes `lib/seo/content.ts`.
  `alternates.languages` na obou stránkách odkazuje obousměrně na `cs`,
  `en` i `x-default`. `metadataBase` (v obou `layout.tsx`) je postavené
  nad `SITE_URL`, takže se canonical/hreflang v preview prostředí nikdy
  neprosáknou k produkční doméně.
- **Strukturovaná data:** `WebApplication` JSON-LD (jen ověřitelné
  údaje — žádné hodnocení, cena, autor) na obou stránkách a `FAQPage`
  JSON-LD sestavené přímo z pole viditelných FAQ otázek
  (`lib/seo/structured-data.ts`), takže nikdy neujede od toho, co
  appka skutečně zobrazuje.
- **Indexovatelný obsah pod appkou:** `components/seo/SeoContent.tsx`
  (čistě serverová komponenta, žádné `"use client"`) vykresluje úvod,
  "Jak to funguje", tematický rozcestník ("Nejčastěji hledané" /
  "Explore the Prague Metro") a FAQ — vše je součástí prvotního HTML,
  žádná z těchto sekcí nevyžaduje JavaScript.
- **Brněnská hláška:** viz `lib/metro/brno.ts` (`isNearBrno`,
  `classifyOutsidePrague`) — čistě lokální Haversinův výpočet nad
  existující `haversineDistanceMeters`, žádný geocoding, poloha nikam
  neodchází. Kontroluje se AŽ po existující hranici "mimo Prahu" (25 km).
- **`app/sitemap.ts`** obsahuje obě jazykové URL s obousměrnými
  `alternates.languages`.

## Odjezdy

Malé sekundární tlačítko **Odjezdy** / **Departures** na každé
výsledkové kartě (v pomocném řádku pod trojicí navigačních tlačítek,
vedle textu s vysvětlením vzdušné vzdálenosti — nikdy jako čtvrté
tlačítko v jejich řádku) otevře přístupný panel s plánovanými odjezdy
podle GTFS jízdního řádu. **Nejde o polohu vlaků v reálném čase.**

- **Zdroj dat:** stejný oficiální PID GTFS feed jako vstupy do metra
  (`https://data.pid.cz/PID_GTFS.zip`), navíc `trips.txt` (`service_id`,
  `trip_headsign`, `direction_id`), `stop_times.txt`
  (`departure_time`, `stop_sequence`), `calendar.txt` a
  `calendar_dates.txt`.
- **Propojení appka ↔ GTFS:** stejný `stationId`, jaký už mají vstupy v
  `data/metro-entrances.json` (GTFS `parent_station`) — žádné párování
  podle názvu. `scripts/import-pid-gtfs.ts` po vygenerování odjezdů
  ověří, že KAŽDÁ stanice appky má odpovídající soubor odjezdů
  (`lib/gtfs/validate-departures-coverage.ts`) — chybějící/nejednoznačná
  vazba je fatální chyba importu, appka nikdy tiše nezobrazí odjezdy
  cizí stanice.
- **Linka a směr:** linka podle stejné `route_type=1` +
  `route_short_name` identifikace jako u vstupů
  (`lib/gtfs/metro-routes.ts`, sdílené s importem vstupů). Směr podle
  GTFS `direction_id` (0/1) — popisek volby směru je nejčastější
  `trip_headsign` v tom směru, ale každý jednotlivý odjezd si nese
  VLASTNÍ headsign, takže krátce ukončený spoj (jiná konečná než
  "hlavní" směr) ukáže svůj skutečný cíl, ne zavádějící společný
  popisek. Poslední zastávka spoje (GTFS ji vždy vyplní, i když vlak
  dál nepokračuje) se do odjezdů nepočítá — jinak by se na konečné
  stanici objevovaly "odjezdy" směrem k ní samé (příjezdy).
- **Provozní den a čas po půlnoci:** veškeré vyhodnocení v
  `Europe/Prague` (`lib/time/prague-time.ts`, sdílené se svátkovým
  přáním). Aktivní `service_id` pro dané datum řeší
  `lib/departures/service-calendar.ts` přesně podle GTFS sémantiky
  (`calendar.txt` týdenní vzor, `calendar_dates.txt` výjimky mají vždy
  přednost). Nejbližší odjezdy (`lib/departures/next-departures.ts`)
  posuzují aktivní služby DNEŠNÍHO i VČEREJŠÍHO provozního dne — spoj
  zapsaný v GTFS jako např. `24:35:00` (čas > 24:00:00, spoj přes
  půlnoc) se tak správně objeví jako dnešní brzké ráno, pokud mu
  odpovídající služba platila včera.
- **Poslední odjezd** se pro každou kombinaci stanice/linky/směru/dne
  počítá zvlášť jako maximum mezi odjezdy AKTIVNÍMI pro daný provozní
  den (`getLastDeparture`) — nikdy jako pevně uložená hodnota.
- **Stáří dat:** `lib/departures/freshness.ts` — starší než 3 dny (GTFS
  kalendáře PID typicky pokrývají jen pár týdnů dopředu) zobrazí
  upozornění "Jízdní řád nemusí být aktuální." místo tvrzení o
  posledním vlaku. Selhání načtení po kliknutí zobrazí samostatnou
  chybovou hlášku — appka nikdy nevymýšlí náhradní časy.
- **Výkon:** `public/data/departures/{stationId}.json` — jeden kompaktní
  soubor na stanici (~35–115 kB nekomprimovaně, cca 5–10 kB po gzipu),
  fetchovaný AŽ při otevření panelu. Homepage/`/en` ho nikdy nestahuje,
  obě jazykové verze sdílejí stejné soubory (jazykově neutrální data).
- **Přístupnost:** `hooks/useFocusTrap.ts` — focus trap, zavření
  klávesou Escape, návrat focusu na tlačítko, které panel otevřelo.
  `components/DeparturesPanel.tsx` (`role="dialog"`, `aria-modal`,
  `aria-labelledby`) je na mobilu spodní panel, od `sm:` výš
  vycentrovaný dialog.
- **Odkaz "Ověřit v PID Lítačce"** (sekce 10 zadání) se v UI
  nevykresluje — GTFS feed neobsahuje `stop_url` pro žádnou stanici
  metra a appka nechtěla vymýšlet neověřenou URL. Text pro budoucí
  použití zůstává v `lib/i18n/dictionary.ts`
  (`dict.departures.checkInPidLitacka`).

## Reklamy

**Reklamy se od 2026-09 spravují výhradně přes
[content-api.darbujan.com/admin/promotions](https://content-api.darbujan.com/admin/promotions)
(project "kdejemetro"), NE v tomto repozitáři.** Appka je jen ČTE — žádná
kampaň se sem nezapisuje natvrdo, přidání/úprava/deaktivace nové reklamy
nikdy nevyžaduje nový deploy KdeJeMetro.cz. Podrobná architektura
Content API (Project → Collection → Record, per-projekt tokeny) je
zdokumentovaná v repozitáři `universal-content-api`
(`docs/KDEJEMETRO_INTEGRATION.md`).

Appka má dvě reklamní pozice (`finder_results` pod výsledky hledání
nejbližšího metra, `night_finder_results` pod výsledky noční dopravy) —
každá se stahuje NEZÁVISLE, výpadek jedné neovlivní druhou.

- **Server-side fetch + cache.** `components/HomePage.tsx` a
  `components/night/NightPage.tsx` (Server Components) volají
  `lib/promotions/get-promotions.ts::getActivePromotionCampaigns(placement)`
  a výsledek posílají dolů jako obyčejnou prop (`HomeClient` →
  `FinderSection` → `AdSlot`, resp. `NightFinder` → `AdSlot`) — žádná z
  klientských komponent neví, že Content API existuje, a browser samotné
  Content API nikdy nevolá přímo. Fetch je cachovaný Next.js
  `revalidate: 300` (~5 minut) — změna v adminu se tedy neprojeví
  okamžitě, jen s tímhle zpožděním.
- **Bezpečný fallback při výpadku.** `getRecords(...).catch(() => [])`
  — chybějící env proměnné, timeout, HTTP chyba i nevalidní JSON vždy
  skončí jako prázdné pole, appka nikdy nespadne kvůli reklamě. Prázdné
  pole se pak chová stejně jako "žádná způsobilá kampaň" (viz České
  přání se jmeninami níže).
- **Mapování na doménový typ appky:** `lib/promotions/get-promotions.ts`
  převádí syrovou odpověď Content API (`UcaRecord`) na existující,
  beze změny ponechaný typ `AdCampaign` (`lib/ads/types.ts`) — CELÁ
  výběrová logika (`lib/ads/filter-campaigns.ts`,
  `lib/ads/weighted-select.ts`, `lib/ads/select-ad.ts`,
  `lib/ads/language-fallback.ts`, `lib/ads/validate-url.ts`,
  `lib/ads/resolve-slot-content.ts`) zůstala z dřívějška nezměněná a
  plně otestovaná — jen dřív dostávala natvrdo zapsané pole
  (`lib/ads/campaigns.ts`, smazáno), teď dostává pole staené server-side
  z Content API. `data.locale` (nepovinné pole v adminu) se mapuje na
  `languages` — bez vyplnění platí kampaň pro všechny 4 jazyky, s
  vyplněním jen pro ten jeden (s `de`/`uk` fallbackem na `en`, viz níže).
  `advertiser` a ikona podle kategorie nemají v Content API schématu
  odpovídající pole (obecné schéma sdílené s HowToFish.cz/Gembl.cz) —
  karta teď vždy ukazuje obecnou výchozí ikonu bez jména partnera.
- **Kampaň se zobrazí JEN s platným affiliate odkazem.** Způsobilá je
  kampaň, která je aktivní, odpovídá jazyku, má kompletní texty pro daný
  jazyk, je v platnosti (`valid_from`/`valid_until` v adminu), A MÁ
  `href` s platnou absolutní `https://` URL (`lib/ads/validate-url.ts`
  → `hasValidAffiliateUrl`). `href` prázdné, `http:`, `javascript:`,
  `data:`, `file:` i relativní cesta se vždy vyřadí.
- **Váhy se počítají jen mezi způsobilými kampaněmi.** Pole "Váha" v
  adminu se nepřepočítává na součet 100 — vážený výběr
  (`lib/ads/weighted-select.ts`) prostě pracuje se skutečným součtem vah
  aktuálně způsobilé množiny.
- **Stabilita během návštěvy a samoopravné sessionStorage:**
  `hooks/useSelectedAd.ts` (beze změny) uloží ID vybrané kampaně do
  `sessionStorage` pod klíčem `kdejemetro:selected-ad:{jazyk}` — reklama
  se tak během jedné návštěvy a stejného jazyka nemění. Pokud uložené ID
  patří kampani, která mezitím přestala existovat/být způsobilá
  (deaktivovaná v adminu, mimo platnost, jiný jazyk), stará hodnota se
  automaticky zahodí a vybere se nová způsobilá kampaň. Do
  `sessionStorage` se nikdy neukládá poloha, souřadnice ani žádný
  osobní údaj — a poloha uživatele se ani nikdy neposílá Content API.
- **Vykreslení:** `components/ads/AdSlot.tsx` (beze změny logiky, jen
  nový povinný `campaigns` prop) rozhoduje mezi reklamou a fallbackem —
  rozhodovací logika je čistá testovatelná funkce
  `lib/ads/resolve-slot-content.ts`. Samotná reklamní karta
  (`components/ads/AdCard.tsx` + `AdIcon.tsx`) dostává už vybranou
  kampaň jako prop a žádnou výběrovou logiku sama neřeší.

## České přání se jmeninami

Když pro aktuální jazyk (`cs`) neexistuje žádná způsobilá reklama s
platným `https://` affiliate odkazem, appka pod výsledky hledání
zobrazí místo reklamy jednoduché přání se jmeninami — **není to
reklama**: žádný štítek "Reklama", žádné CTA, žádný odkaz, žádný název
partnera, žádné reklamní tracking. V angličtině se přání nikdy
nezobrazuje — bez způsobilé anglické reklamy appka pod výsledky
nezobrazí nic.

- **Rozhodovací logika:** `lib/ads/resolve-slot-content.ts` (čistá
  funkce, `AdResolutionState` → `pending`/`ad`/`nameday`/`none`) použitá
  v `components/ads/AdSlot.tsx`. Dokud výběr reklamy na klientovi ještě
  neproběhl (`pending`), nevykreslí se ani reklama, ani přání — ať
  jedno neprobliskne pod druhým.
- **Zdroj dat:** `lib/namedays/czech-namedays.ts` — statická data
  převzatá z [OzzyCzech/namedays-cs](https://github.com/OzzyCzech/namedays-cs)
  (soubor `lib/names.json`), licence **MIT** (© Roman Ožana), plný text
  licence je přímo v hlavičce souboru. Appka žádné externí API pro
  jmeniny nevolá — data jsou uložená lokálně v repozitáři a načtou se
  jako běžný TS modul.
- **Datum:** vždy podle kalendářního dne v `Europe/Prague`
  (`lib/namedays/get-czech-nameday.ts`, `getPragueCalendarDate` přes
  `Intl.DateTimeFormat`), ne podle UTC — důležité, protože Vercel běží
  v UTC a prosté `new Date().getDate()` by kolem půlnoci dávalo špatný
  den. Když appka zůstane otevřená přes pražskou půlnoc, přání se samo
  aktualizuje (jeden `setTimeout` naplánovaný přesně na příští pražskou
  půlnoc, žádný interval tikající každou sekundu/minutu).
- **Formát věty:** `formatNamedaySentence()` — jedno jméno "Dnes má
  svátek X.", dvě jména "Dnes mají svátek X a Y.", tři a více
  "Dnes mají svátek X, Y a Z." (přirozený český výčet, nikdy lomítko).
  Pro dny bez jména v datech (v civilním kalendáři jde o 5 státních
  svátků bez jmenin — 1. leden, 1. a 8. květen, 6. červenec, 25.
  prosinec) bezpečný obecný fallback "Ať se vám dnes daří.".
- **Jak aktualizovat kalendářní data:** stáhni aktuální
  `lib/names.json` z [OzzyCzech/namedays-cs](https://github.com/OzzyCzech/namedays-cs)
  a nahraď obsah `CZECH_NAMEDAYS` v `lib/namedays/czech-namedays.ts` —
  formát je stejný (`"MM-DD": ["Jméno", ...]`), jen zachovej hlavičku s
  licencí a zdrojem.
- **Po aktivaci české reklamy** (nová promotion v adminu s `locale: cs`
  a platným `href`) se přání automaticky přestane zobrazovat, aniž by
  bylo potřeba cokoliv v `NamedayGreeting.tsx` nebo `AdSlot.tsx` měnit
  nebo appku znovu nasazovat.

### Jak spravovat reklamy (přidat/upravit/deaktivovat)

Výhradně přes [content-api.darbujan.com/admin/promotions](https://content-api.darbujan.com/admin/promotions)
— vyfiltruj projekt "KdeJeMetro.cz", zvol umístění ("KdeJeMetro —
výsledky hledání" / "KdeJeMetro — noční doprava"), vyplň title/text/CTA/
odkaz/váhu, volitelně jazyk (bez výběru platí pro všechny 4). Nový
záznam je hned "Aktivní" ve výchozím stavu — appka ho vyzvedne do ~5
minut (`revalidate: 300`), bez nutnosti nového deploy. Deaktivace =
přepnutí "Aktivní" na vypnuto (nebo tlačítko "Deaktivovat" v seznamu),
appka přestane kampaň nabízet ve stejném cache okně.

Affiliate URL se vkládá přesně tak, jak ji partner poskytl — appka ji
nijak neupravuje, nezkracuje, nepřejmenovává parametry ani nepřidává
vlastní. Datový model je připravený i na budoucí Dognet parametry —
celou už hotovou schválenou affiliate URL (klidně včetně `d1`/`d2`
apod., nebo `partner_id`/`utm_*` jako u GetYourGuide) prostě vlož do
pole "Odkaz (href)" tak, jak je.

### Soukromí

Poloha uživatele ani ID stanice se reklamním partnerům ani Content API
nikdy neposílají — appka jen otevře cílovou `href` URL v nové kartě.
V `sessionStorage` se ukládá výhradně ID vybrané kampaně, nic víc.
Systém má připravené typy pro budoucí měření (`lib/ads/events.ts`,
`AdEvent`), ale v této iteraci se žádná reklamní data nikam neodesílají
— jen volitelný `console.debug` v development režimu. Content API token
je jen server-side (env proměnná `UCA_API_TOKEN`, scope pouze
`records:read`) a nikdy neopustí server.

## Známá omezení

- Označení vstupů (`E1`, `E2`, …) je přímo z GTFS feedu — pokud feed
  nemá lidštější název (např. název ulice), appka si nic nevymýšlí a
  zobrazí jen tohle technické označení.
- Schematická mapa je naše vlastní prezentační vrstva (souřadnice uzlů
  jsou ručně zvolené kotvy + lineární interpolace) — neodpovídá
  geografickému měřítku, jen topologii linek.
- Feed PID se mění denně — počty stanic/vstupů se mohou mezi
  jednotlivými `npm run data:refresh` mírně lišit (např. dočasně
  uzavřená stanice kvůli rekonstrukci se v datech krátkodobě neobjeví).
