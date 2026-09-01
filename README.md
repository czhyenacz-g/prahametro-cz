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
- Čeština/angličtina — přepínač v hlavičce, volba se ukládá do
  `localStorage`, výchozí jazyk se odvodí z prohlížeče při první
  návštěvě (`lib/i18n/`).
- Volitelný "18+" humorný textový režim, který mění jen hlavní hlášku
  (žádný erotický obsah, žádná kontrola věku) — nezávislý na jazyce,
  taky uložený v `localStorage`.
- Když je uživatel dál než 25 km od nejbližšího vstupu, appka to
  zřetelně označí a ukáže tři nejbližší RŮZNÉ stanice místo tří vstupů
  jedné stanice poblíž.
- Jednoduchý, rozšiřitelný systém rotovatelných affiliate reklam pod
  výsledky hledání — viz sekce [Reklamy](#reklamy) níže.

## Co MVP záměrně NEumí

- Neplánuje trasu/jízdu metrem, nemá jízdní řády ani realtime provoz.
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
`stop_times.txt` — vyžaduje systémový příkaz `unzip`), odvodí skutečné
vstupy do metra a jejich linky, a zapíše:

- `data/metro-entrances.json` — všechny vstupy (souřadnice, linky,
  bezbariérovost),
- `data/metro-line-order.json` — reálné pořadí stanic na každé lince
  (podle `stop_sequence`), ze kterého vychází schematická mapa.

Import **selže s chybou** (nenulový návratový kód), pokud by výsledek
byl nápadně malý (méně než 50 stanic nebo 200 vstupů) — ochrana proti
omylem nasazeným prázdným/změněným datům. Appka za běhu žádné GTFS/ZIP
nezná, jen tenhle hotový JSON.

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

## Reklamy

Jednoduchý, rozšiřitelný systém rotovatelných affiliate reklam — jedna
karta pod výsledky hledání, vybraná podle jazyka a stabilní po zbytek
návštěvy.

**Aktivní kampaně:** `luggage-en` (Bounce, úschovna zavazadel) a
`activities-en` (GetYourGuide, výlety a zážitky) — obě mají platný
`https://` affiliate odkaz, takže rotují v anglické verzi. Zbylé
kampaně (`pharmacy-cs`, `shopping-cs`, `esim-en`, `transfer-en`) mají
`href: null` a zůstávají v konfiguraci připravené, ale **nejsou
způsobilé k výběru** — dokud nemáme český affiliate odkaz, česká verze
nezobrazuje žádnou reklamu (a mapa se přirozeně posune nahoru, bez
prázdného místa po reklamní kartě).

- **Kampaň se zobrazí JEN s platným affiliate odkazem.** Způsobilá je
  kampaň, která je `enabled: true`, odpovídá jazyku, má kompletní texty
  pro daný jazyk, je v platnosti (`validFrom`/`validTo`), odpovídá
  případnému cílení na stanici, A MÁ `href` s platnou absolutní
  `https://` URL (`lib/ads/validate-url.ts` → `hasValidAffiliateUrl`,
  používá `new URL(...)` + explicitní `protocol === "https:"`).
  `href: null`, prázdný/whitespace řetězec, `http:`, `javascript:`,
  `data:`, `file:` i relativní cesta se vždy vyřadí. Kampaň bez
  platného odkazu se nikdy nevylosuje, nevykreslí ani negeneruje
  `ad_impression`/`ad_click` — zůstává ale dál v `lib/ads/campaigns.ts`
  pro pozdější aktivaci.
- **Váhy se počítají jen mezi způsobilými kampaněmi.** Zápisové váhy
  v konfiguraci se nepřepočítávají na součet 100 — vážený výběr
  (`lib/ads/weighted-select.ts`) prostě pracuje se skutečným součtem
  vah aktuálně způsobilé množiny (např. Bounce 45 + GetYourGuide 30 =
  75, tedy poměr cca 60 % / 40 %).
- **Seznam kampaní:** `lib/ads/campaigns.ts` — typovaný podle
  `lib/ads/types.ts` (`AdCampaign`).
- **Výběrová logika:** `lib/ads/filter-campaigns.ts` (filtrování podle
  jazyka/textů/platnosti/stanice/platného odkazu, v tomto pořadí) +
  `lib/ads/weighted-select.ts` (vážená rotace nad už vyfiltrovanou
  způsobilou množinou) + `lib/ads/select-ad.ts` (spojuje obojí, plus
  obnovení uložené kampaně ze session). Validace affiliate URL je v
  `lib/ads/validate-url.ts`.
- **Stabilita během návštěvy a samoopravné sessionStorage:**
  `hooks/useSelectedAd.ts` uloží ID vybrané kampaně do `sessionStorage`
  pod klíčem `kdejemetro:selected-ad:{jazyk}` — reklama se tak během
  jedné návštěvy a stejného jazyka nemění, ale při přepnutí jazyka se
  vybere zvlášť (a návrat k předchozímu jazyku ji obnoví, pokud je
  pořád platná/způsobilá). Pokud uložené ID patří kampani, která mezitím
  přestala být způsobilá (vypnutá, mimo platnost, jiný jazyk, nebo —
  nejčastější případ — pořád nemá platný `href`), stará hodnota se
  automaticky zahodí (`safeRemove`, `lib/storage/safe-storage.ts`) a
  vybere se nová způsobilá kampaň. Do `sessionStorage` se nikdy
  neukládá poloha, souřadnice ani žádný osobní údaj.
- **Vykreslení:** `components/ads/AdCard.tsx` (+ `AdIcon.tsx` pro
  lucide-react ikony podle kategorie) — použito ve `FinderSection.tsx`
  pod výsledky hledání. Bez způsobilé kampaně komponenta vrátí `null`
  a nezanechá po sobě žádnou mezeru (odsazení `mt-6` je součástí
  kořenové `<section>` samotné komponenty, ne obalového elementu).

### Jak přidat novou kampaň

Přidej objekt typu `AdCampaign` do pole v `lib/ads/campaigns.ts`. `id`
musí být unikátní a stabilní (mění se podle něj i klíč v
`sessionStorage`, takže po jeho změně by se aktivní reklama pro
právě probíhající návštěvy jednou přepočítala). Text (`title`,
`description`, `cta`) vyplň jen pro jazyky, které kampaň podporuje —
`languages` musí obsahovat právě ty jazyky, pro které jsou texty
kompletní.

### Jak nastavit váhu

Pole `weight` — kladné konečné číslo. Vyšší váha = vyšší pravděpodobnost
výběru relativně k ostatním způsobilým kampaním (kampaň s `weight: 70`
má mezi kampaněmi s celkovou vahou 100 zhruba 70% šanci). Nula, záporné
číslo, `NaN` nebo `Infinity` kampaň z výběru úplně vyřadí.

### Jak nastavit datum platnosti

Volitelná pole `validFrom`/`validTo`, formát ISO 8601 (např.
`"2026-07-01T00:00:00Z"`), porovnávané v UTC. Bez nich kampaň platí
neomezeně.

### Jak kampaň vypnout

Nastav `enabled: false` — okamžitě se přestane nabízet k výběru, aniž
by bylo nutné ji mazat (a bez ztráty konfigurace pro pozdější zapnutí).

### Jak funguje výběr podle jazyka

Kampaň se nabízí jen pro jazyky uvedené v `languages` a jen pokud má
pro daný jazyk vyplněné VŠECHNY texty (`title`, `description`, `cta`).
Výběr pro češtinu a angličtinu je nezávislý — přepnutí jazyka nikdy
neovlivní, jaká kampaň byla vybraná pro ten druhý.

### Jak později doplnit affiliate odkaz (např. aktivovat českou kampaň)

Stačí u dané kampaně vyplnit `href` (musí to být platná absolutní
`https://` URL — cokoliv jiného, včetně `http://`, se dál bere jako
"bez odkazu" a kampaň zůstane vyřazená z výběru) a volitelně
`advertiser`. Jakmile má kampaň platný `https://` odkaz, `filterCampaigns`
ji automaticky začne nabízet k výběru — žádná změna komponenty ani
výběrové logiky není potřeba. Stejným způsobem se aktivuje i první
česká kampaň (`pharmacy-cs` nebo `shopping-cs`) — jakmile má jedna z
nich platný `href`, česká verze začne zase zobrazovat reklamu.

Affiliate URL se vkládá přesně tak, jak ji partner poskytl — appka ji
nijak neupravuje, nezkracuje, nepřejmenovává parametry ani nepřidává
vlastní. Datový model je připravený i na budoucí Dognet parametry —
celou už hotovou schválenou affiliate URL (klidně včetně `d1`/`d2`
apod., nebo `partner_id`/`utm_*` jako u GetYourGuide) prostě vlož do
`href` tak, jak je:

```ts
{
  // ...
  href: "https://schvalena-affiliate-url.example/...",
  advertiser: "Název schváleného partnera",
}
```

(Tohle je jen dokumentační příklad — do žádné skutečné kampaně tuhle
URL nevkládej.)

### Soukromí

Poloha uživatele ani ID stanice se reklamním partnerům nikdy neposílají
— appka jen otevře cílovou `href` URL v nové kartě. V `sessionStorage`
se ukládá výhradně ID vybrané kampaně, nic víc. Systém má připravené
typy pro budoucí měření (`lib/ads/events.ts`, `AdEvent`), ale v této
iteraci se žádná reklamní data nikam neodesílají — jen volitelný
`console.debug` v development režimu.

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
