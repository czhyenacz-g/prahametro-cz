# Zpřesnění vstupů skutečnou pěší trasou — Mapy.com Matrix Routing

Tento dokument doprovází implementaci `lib/routing/`,
`hooks/useMetroFinderResults.ts` a je referencovaný z `.env.example`.
Popisuje přesně to, co bylo živě ověřeno proti Mapy.com REST API dne
**2026-09-06**.

## 1. Proč

Původní řazení nejbližších vstupů metra bylo čistě podle vzdušné
vzdálenosti (Haversine). V Praze to může být výrazně nepřesné kvůli
řece, železnici, dálnicím/silnicím, uzavřeným areálům a omezenému
počtu mostů/přechodů — vzdušně nejbližší vstup nemusí být pěšky
nejrychlejší, nebo nemusí být rozumně dostupný vůbec.

## 2. API

- **Endpoint:** `GET https://api.mapy.com/v1/routing/matrix-m` — ověřeno
  přímo z aktuální OpenAPI specifikace
  (`https://api.mapy.com/v1/docs/routing/openapi.json`), ne z
  předpokladu.
- **Parametry:** `starts` (jeden bod, `"lon,lat"`), `ends` (max 12 bodů,
  `"lon,lat"` každý, `POZOR opačné pořadí než interní {lat, lon}`),
  `routeType=foot_fast` (přesná hodnota z enumu `RouteType` v OpenAPI
  specu — "rychlá pěší trasa"), `apikey=<klíč>`.
- **Limit:** starts × ends nejvýš 100 (my používáme 1 × max 12). Rate
  limit 30 req/s (podle dokumentace API).
- **Odpověď:** `{ matrix: [[{ length, duration }, ...]] }` — řádky =
  starts, sloupce = ends, `length` v metrech, `duration` v sekundách.
  Záporné hodnoty jsou chybové kódy Mapy.com (-1 obecná chyba, -2 body
  příliš daleko, -3 trasa nenalezena, -4 interní timeout) — takový cíl
  se zahazuje jako nedostupný, nezpůsobí pád celého requestu.
- **Autentizace a CORS:** klíč jde jako query parametr `apikey`.
  Live ověřeno (`curl` s `Origin`/`Referer` hlavičkou), že Mapy.com API
  gateway vrací korektní `Access-Control-Allow-Origin` na preflight
  (`OPTIONS`) i skutečný `GET` request — přímé volání z prohlížeče
  (client-side) je oficiálně podporované, žádný proxy endpoint není
  potřeba.

### Referer restriction (ověřeno živě)

Aktuální klíč (`NEXT_PUBLIC_MAPY_API_KEY`) je už nastavený jako
referer-restricted — funguje jen s hlavičkou `Referer` obsahující
`kdejemetro.cz` nebo `www.kdejemetro.cz` (ověřeno `curl` s/bez
`Referer` hlavičky, viz historie implementace). Bez shodujícího
refereru vrací API `403 Forbidden`. Prohlížeč posílá `Referer`
automaticky u cross-origin `fetch()` (pokud appka nenastavuje vlastní
`Referrer-Policy` — tenhle projekt žádnou nemá, viz `next.config.ts`),
takže v produkci na `kdejemetro.cz` request projde bez dalšího
nastavení.

**Pro localhost/Vercel Preview tenhle klíč nefunguje** (`Referer`
neodpovídá povoleným doménám) — appka se v takovém případě bezpečně
chová jako by API klíč chyběl (spadne na vzdušný fallback, žádná
chyba v konzoli navíc). Pro plné otestování happy path lokálně je
potřeba buď: (a) samostatný vývojový klíč bez referer restriction nebo
s `localhost` v povolených doménách, nebo (b) dočasně rozšířit povolené
domény produkčního klíče v Mapy.com administraci. Do doby, než bude
takový klíč k dispozici, `.env.local`/Vercel Preview používají stejnou
hodnotu jako produkce — funkčně to jen znamená, že Preview/lokální dev
vždy uvidí fallback (vzdušný výpočet), ne chybu.

## 3. Výběr kandidátů pro matrix request

`lib/routing/select-walking-route-candidates.ts` — 6 nejbližších
RŮZNÝCH stanic (vzdušně), max 2 nejbližší vstupy z každé, dohromady
max 12 cílů (`lib/routing/constants.ts`). Jeden matrix request na
jedno hledání.

## 4. Řazení a fallback

`lib/routing/rank-walking-results.ts` — routované výsledky se řadí
podle skutečného pěšího času, zobrazí se první 3. Neúplný výsledek (1–2
platné trasy) se doplní nejbližším nepoužitým vstupem podle vzdušné
vzdálenosti (označen jako `air-distance`). Žádný platný routovaný
výsledek → zachová se přesně původní vzdušná trojice.

## 5. Reálné srovnání před/po (živě ověřeno 2026-09-06, produkční klíč a dataset)

| Scénář | Vzdušně (top 1) | Skutečně pěšky (top 1) |
|---|---|---|
| Protější břeh Vltavy (Podolí, 50.0555, 14.4157) | Smíchovské nádraží, ~696 m vzdušně | Smíchovské nádraží, **2182 m / 35 min** pěšky (musí k mostu) |
| Železniční koridor (sever od Hl. nádraží, 50.0862, 14.4368) | Hlavní nádraží, ~305 m vzdušně | **Náměstí Republiky** vyhrává (498 m / 8 min) — jiná stanice než vzdušně nejbližší |
| U Jižní spojky (Chodovská, 50.0567, 14.4732) | Kačerov, ~1877 m vzdušně | Kačerov se do trojice vůbec nedostane — **Roztyly**/Strašnická (2944–3202 m / 52 min) |
| Uzavřený areál (FN Motol, 50.0648, 14.3378) | Nemocnice Motol, ~1086 m vzdušně | Nemocnice Motol pořád první, ale **1458 m / 27 min** (obchvat plotu); 3. místo připadne jiné stanici (Hůrka) |

Ve všech čtyřech scénářích se buď výrazně liší odhad vzdálenosti/času,
nebo se změní i to, KTERÁ stanice/vstup je ve výsledku — přesně problém
popsaný v zadání.

## 6. Odolnost — cache, deduplikace, circuit breaker (doplněno 2026-09-06)

Matrix API je čistě VOLITELNÉ zpřesnění — appka musí zůstat plně
použitelná i při vyčerpaných kreditech, rate limitu nebo výpadku.
Mapy.com nemá zdokumentovaný jediný status kód pro "došly kredity"
(ověřeno — jejich dokumentace jen říká, že spotřeba se po vyčerpání
bezplatných kreditů "zastaví do konce měsíce", bez konkrétního HTTP
kódu), proto appka rozlišuje TŘÍDY chyb, ne jeden kód:

- **`lib/routing/matrix-result-cache.ts`** (`MatrixResultCache`) — v
  paměti si pamatuje jen POSLEDNÍ úspěšný výpočet. Nový požadavek se
  přeskočí a znovu použije uložený výsledek, pokud zároveň platí:
  méně než 5 minut od výpočtu (`WALKING_MATRIX_CACHE_MAX_AGE_MS`),
  nová poloha do 100 m od polohy výpočtu
  (`WALKING_MATRIX_CACHE_MAX_DISTANCE_METERS`), stejná sada kandidátů a
  stejný `routeType`. Žádná persistence — jen vlastnost instance v
  paměti, zaniká s reloadem stránky.
- **`lib/routing/in-flight-request-map.ts`** (`InFlightRequestMap`) —
  souběžné požadavky se stejným klíčem (origin+kandidáti+režim) sdílejí
  jeden Promise, ne vlastní fetch (řeší React Strict Mode dvojité
  spuštění efektu i rychlé dvojité kliknutí).
- **`lib/routing/matrix-circuit-breaker.ts`** (`MatrixCircuitBreaker` +
  `classifyMatrixFailure`) — `401`/`402`/`403` (autorizace/kredit)
  otevře breaker natrvalo do konce načtení stránky, appka pak Matrix
  API vůbec nezkouší volat. `429` nebo libovolné `5xx` nastaví cooldown
  na `WALKING_MATRIX_COOLDOWN_MS` (5 minut), po jehož uplynutí to appka
  zkusí znovu. Timeout/abort/nevalidní odpověď (bez HTTP status kódu)
  breaker/cooldown NEOVLIVNÍ — jen tenhle jeden request skončí
  fallbackem.
- Živě ověřeno (viz historie implementace, skript proti reálnému API):
  opakované hledání ~30 m od předchozího do 5 minut vyvolá **0** dalších
  network requestů (cache hit), neplatný klíč (403) korektně otevře
  breaker, dva souběžné požadavky se stejným klíčem spustí jen **1**
  skutečný fetch.

### Fallback hláška

`dict.finder.routingFallbackNotice` se zobrazí pod výsledky JEN po
skutečně neúspěšném pokusu (chyba, prázdná odpověď, aktivní
breaker/cooldown) — nikdy když API klíč chybí (to je tichý, plánovaný
stav, ne chyba).

## 7. Bezpečnost a soukromí

- Poloha se posílá Mapy.com jen jednorázově, jen souřadnice potřebné k
  výpočtu (žádná identita, žádné jiné osobní údaje).
- Poloha se nikde neloguje, neukládá do `localStorage`/`sessionStorage`,
  neposílá do analytiky ani do Content API.
- Klientský API klíč je z podstaty veřejný (viditelný v síťové
  komunikaci) — bezpečnost stojí na referer restriction v Mapy.com
  administraci, ne na utajení klíče.
