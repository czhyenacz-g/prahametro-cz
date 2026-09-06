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

## 6. Bezpečnost a soukromí

- Poloha se posílá Mapy.com jen jednorázově, jen souřadnice potřebné k
  výpočtu (žádná identita, žádné jiné osobní údaje).
- Poloha se nikde neloguje, neukládá do `localStorage`/`sessionStorage`,
  neposílá do analytiky ani do Content API.
- Klientský API klíč je z podstaty veřejný (viditelný v síťové
  komunikaci) — bezpečnost stojí na referer restriction v Mapy.com
  administraci, ne na utajení klíče.
