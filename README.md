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
