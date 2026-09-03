# P+R parkoviště — datový zdroj, audit a provozní poznámky

Tento dokument doprovází implementaci P+R sekce (`lib/parking/`,
`components/parking/`, `app/api/park-and-ride/`) a je referencovaný z
komentářů v kódu. Popisuje přesně to, co bylo živě ověřeno proti
Golemio Open Data API dne **2026-09-03**, a proč byla zvolena
konkrétní rozhodnutí (limit vzdálenosti, odvození ceny, "nelze
rezervovat").

## 1. Zdroj dat

- **API:** Golemio v3 Parking (`https://api.golemio.cz`), volné
  API klíče na `api.golemio.cz/api-keys`, autentizace hlavičkou
  `X-Access-Token`. Rate limit 20 requestů / 8 s.
- **Endpointy použité appkou:**
  - `GET /v3/parking?parkingPolicy[]=park_and_ride&primarySource[]=tsk-offstreet` —
    statická metadata (build-time import, `scripts/import-park-and-ride.ts`).
  - `GET /v3/parking-tariffs/{id}` — ceník, volaný jen pro unikátní
    `tariff_id` nalezené v předchozím kroku, taky build-time.
  - `GET /v3/parking-measurements?parkingId[]=...` — živá obsazenost,
    voláno ze serverového route handleru `app/api/park-and-ride/route.ts`
    (revalidate 240 s), NIKDY z klienta.
- **Token:** `GOLEMIO_API_KEY`, jen server-side (`.env.local` lokálně,
  Vercel env proměnná v produkci). Nikdy v klientském JS ani v
  repozitáři — `.env.example` obsahuje jen prázdný název proměnné.

### Proč `primarySource[]=tsk-offstreet`

Filtr `parkingPolicy[]=park_and_ride` sám o sobě vrací P+R z **celé
ČR** (109 záznamů při ověření, včetně např. Olbramovic u Plzně).
`primarySource[]=tsk-offstreet` je oficiální zdroj Technické správy
komunikací hl. m. Prahy a omezuje výsledek na 23 pražských P+R —
počet prakticky odpovídá vlastnímu výčtu na Parking.praha.eu.

## 2. Limit vzdálenosti k metru

`MAX_PARK_AND_RIDE_TO_METRO_DISTANCE_METERS = 400` metrů
(`lib/parking/match-metro-station.ts`), počítáno k nejbližšímu
KONKRÉTNÍMU vstupu stanice (ne ke středu stanice).

Hodnota je zvolená z reálného rozložení vzdáleností všech 23 živých
`tsk-offstreet` P+R k nejbližšímu vstupu z `data/metro-entrances.json`:
posledních 16 skutečně souvisejících P+R spadá do 44–370 m, další v
pořadí (Kotlářka, Braník, Nádraží Hostivař, Zahradní Město, Běchovice,
Radotín, Troja) začínají až na 651 m a výš — tedy jasná mezera, do
které se `400 m` vejde bez rizika falešného přiřazení i s rezervou.

## 3. Tabulka P+R ↔ metro ↔ vzdálenost (živě ověřeno 2026-09-03)

| P+R | nejbližší metro (linka) | vzdálenost k vstupu | kapacita | online obsazenost |
|---|---|---|---|---|
| P+R Garáže Černý Most | Černý Most (B) | 136 m | 886 | ano |
| P+R Černý most 2 | Černý Most (B) | 370 m | 136 | ano |
| P+R Chodov | Chodov (C) | 45 m | 729 | ne (viz níže) |
| P+R Opatov | Opatov (C) | 110 m | 111 | ano |
| P+R Roztyly | Roztyly (C) | 134 m | 100 | ano |
| P+R Nové Butovice | Nové Butovice (B) | 154 m | 189 | ano |
| P+R Zličín 1 | Zličín (B) | 106 m | 88 | ano |
| P+R Zličín 2 | Zličín (B) | 85 m | 66 | ano |
| P+R Skalka 1 | Skalka (A) | 123 m | 136 | ano |
| P+R Skalka 2 | Skalka (A) | 346 m | 78 | ano |
| P+R Depo Hostivař | Depo Hostivař (A) | 216 m | 110 | ne (viz níže) |
| P+R Ládví | Ládví (C) | 93 m | 85 | ne (viz níže) |
| P+R Letňany | Letňany (C) | 68 m | 679 | ne (viz níže) |
| P+R Holešovice | Nádraží Holešovice (C) | 67 m | 76 | ano |
| P+R Rajská zahrada | Rajská zahrada (B) | 106 m | 103 | ano |
| P+R Kongresové centrum Praha | Vyšehrad (C) | 218 m | 251 | ano |

**23 stažených → 16 přiřazeno k metru** (`totalFetched: 23`,
`matchedToMetro: 16` v `data/park-and-ride.json`). Zbylých 7 (mj.
Kotlářka, Braník, Nádraží Hostivař, Zahradní Město, Běchovice,
Radotín, Troja — P+R bez metra v docházkové vzdálenosti) se do appky
záměrně nedostane, protože nejsou skutečné P+R metra — to je právě
účel limitu z bodu 2, viz i `test/park-and-ride-matching.test.ts`
body 13.

**Chodov, Depo Hostivař, Ládví a Letňany aktuálně nemají živé
měření** (Golemio na ně v `/v3/parking-measurements` k okamžiku
auditu nevrátilo žádný záznam) — appka pro ně korektně zobrazuje
"Obsazenost se online nesleduje" + kapacitu, ne chybu ani `0`. Je to
očekávaný, ne chybový stav — Golemio senzoricky nepokrývá úplně
všechna pražská P+R.

## 4. Odvození ceny — pravidlo a výjimka Roztyly

`lib/parking/price.ts::derivePriceLabel()` vrací cenu POUZE když je
jednoznačně čitelná z jediného tarifního pásma:

- `free_of_charge: true` → `"Zdarma"`.
- Jedno pásmo, jeden `charge` s `charge_interval === 86400` (přesně
  24 h) → `"{částka} Kč / 24 hodin"`.
- Cokoliv jiné → `null` (žádný text v UI, ne "Cena: neuvedena").

**P+R Roztyly** je jediná výjimka v datové sadě: jeho tarif je
**hodinový** (`charge_interval: 3600`), ne paušál na 24 h. Appka
proto pro Roztyly cenu vůbec nezobrazuje (`priceLabel: null`) —
přepočet hodinové sazby na 24 h by byl odhad (kolik hodin typický
uživatel P+R skutečně parkuje), a zadání výslovně zakazuje ceny
odhadovat.

## 5. "Parkovací místo nelze předem rezervovat"

Pole `reservation.reservation_type` je u všech živých `tsk-offstreet`
záznamů `null` — Golemio samo o sobě nepotvrzuje ani nevyvrací
rezervovatelnost. Nezávisle na tom Parking.praha.eu (oficiální portál
téže sítě P+R) uvádí, že místa nelze předem rezervovat. Kombinace
těchto dvou faktů je důvod, proč `resolveReservationPossible()` vrací
`true` jen při výslovném Golemio potvrzení (`possible`/`required`) a
`false` ve všech ostatních případech u tohoto zdroje — nikdy se ale
nezobrazuje tvrzení "místo je zaručeno".

## 6. Cachování a chování při výpadku Golemio

- Statická metadata (`data/park-and-ride.json`) jsou build-time
  snapshot, obnovovaný samostatným příkazem `npm run parking:refresh`
  — NEZÁVISLE na GTFS importu, takže výpadek Golemio nikdy nezablokuje
  denní GTFS refresh a naopak.
- Živá obsazenost se cachuje na serveru přes
  `export const revalidate = 240` (Next.js/Vercel cache) —
  souběžní návštěvníci ve stejném ~4minutovém okně nezpůsobí
  opakované volání Golemio.
- Při výpadku `/v3/parking-measurements` vrací
  `app/api/park-and-ride/route.ts` pořád statická metadata s
  `measurementsFailed: true` — sekce a karty zůstávají viditelné,
  jen s hláškou "Aktuální obsazenost se nepodařilo načíst."
  (nikdy se neschovává celá karta).

## 7. Ruční konfigurace

Po nasazení je potřeba (jednorázově, mimo běžný kód appky):

1. Nastavit `GOLEMIO_API_KEY` ve Vercel (Production i Preview
   environment) — appka bez něj sama zůstane funkční (P+R sekce se
   podle `parkAndRideDataset.parkAndRides.length > 0` guardy v
   `components/HomeClient.tsx` prostě nezobrazí), ale živá obsazenost
   ani refresh dat nepůjdou spustit.
2. Pravidelně spouštět `npm run parking:refresh` (mimo repozitář, např.
   cron/CI job) pro obnovu `data/park-and-ride.json` — obdobně jako
   existující GTFS import, ale jako samostatný krok.
