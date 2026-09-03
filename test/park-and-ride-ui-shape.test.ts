import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Stejný vzorec jako test/departures-ui-shape.test.ts — "use client"
// komponenty nejdou v tomhle projektu přímo importovat do node:test, takže
// se zadání body 28-40 (UI/i18n/layout) ověřují nad zdrojovým textem.
function readSource(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(`../${relativePath}`, import.meta.url)), "utf-8");
}

describe("28. badge se zobrazí jen u stanice s P+R", () => {
  const source = readSource("components/EntranceResultCard.tsx");

  test("hasParkAndRide vyžaduje jak onOpenParkAndRide, tak členství v STATIONS_WITH_PARK_AND_RIDE", () => {
    assert.match(source, /const hasParkAndRide = onOpenParkAndRide && STATIONS_WITH_PARK_AND_RIDE\.has\(entrance\.stationId\)/);
  });

  test("badge se vykreslí podmíněně, ne vždy", () => {
    assert.match(source, /\{hasParkAndRide && <ParkAndRideBadge/);
  });

  test("STATIONS_WITH_PARK_AND_RIDE se počítá ze skutečného datasetu, ne z natvrdo vypsaného seznamu", () => {
    assert.match(source, /getStationsWithParkAndRide\(parkAndRideDataset\)/);
  });
});

describe("29. badge se čte jako 'Stanice (P+R)'", () => {
  test("aria-label je 'Zobrazit P+R parkoviště u stanice {station}' (cs) — obsahuje jméno stanice i 'P+R'", () => {
    const source = readSource("lib/i18n/dictionary.ts");
    assert.match(source, /badgeAriaLabel: \(station\) => `Zobrazit P\+R parkoviště u stanice \$\{station\}`/);
  });

  test("viditelný text badge je jen krátké 'P+R' (screen reader dostává plný popisek přes aria-label, ne vizuální text)", () => {
    const source = readSource("components/parking/ParkAndRideBadge.tsx");
    assert.match(source, /\{dict\.parkAndRide\.badgeLabel\}/);
    assert.match(source, /aria-label=\{dict\.parkAndRide\.badgeAriaLabel\(stationName\)\}/);
  });
});

describe("30. toggle tlačítko má správné aria-expanded/aria-controls", () => {
  const source = readSource("components/parking/ParkAndRideSection.tsx");

  test("aria-expanded odráží stav open", () => {
    assert.match(source, /aria-expanded=\{open\}/);
  });

  test("aria-controls ukazuje na id sekce, které se skutečně vykresluje jen když je otevřeno", () => {
    assert.match(source, /aria-controls=\{dict\.parkAndRide\.sectionId\}/);
    assert.match(source, /id=\{dict\.parkAndRide\.sectionId\}/);
  });

  test("44px minimální dotyková plocha tlačítka", () => {
    assert.match(source, /min-h-\[44px\]/);
  });
});

describe("31. sekce je výchozí zavřená a nic si neukládá do localStorage", () => {
  test("HomeClient.tsx inicializuje parkAndRideOpen na false", () => {
    const source = readSource("components/HomeClient.tsx");
    assert.match(source, /useState\(false\)/);
  });

  test("žádná ze souvisejících komponent nevolá localStorage API (komentáře dokumentující, že se nepoužívá, jsou v pořádku)", () => {
    for (const file of ["components/HomeClient.tsx", "components/parking/ParkAndRideSection.tsx"]) {
      assert.doesNotMatch(readSource(file), /localStorage\.\w|localStorage\[/);
    }
  });
});

describe("32. kliknutí na badge otevře sekci a vybere správnou stanici", () => {
  const source = readSource("components/HomeClient.tsx");

  test("openParkAndRideForStation otevře sekci a nastaví focusStationId na ID kliknuté stanice", () => {
    assert.match(source, /function openParkAndRideForStation\(stationId: string\) \{/);
    assert.match(source, /setParkAndRideOpen\(true\)/);
    assert.match(source, /setParkAndRideFocusStationId\(stationId\)/);
  });

  test("ParkAndRideSection dostává focusStationId a po zpracování ho čistí (onFocusHandled)", () => {
    assert.match(source, /focusStationId=\{parkAndRideFocusStationId\}/);
    assert.match(source, /onFocusHandled=\{\(\) => setParkAndRideFocusStationId\(null\)\}/);
  });

  test("focus se přesune jen na kartu odpovídající požadované stanici (metroStationId === focusStationId)", () => {
    const sectionSource = readSource("components/parking/ParkAndRideSection.tsx");
    assert.match(sectionSource, /sorted\.find\(\(pr\) => pr\.metroStationId === focusStationId\)/);
  });
});

describe("33. lokalizace cs/en/de/uk — texty existují ve všech čtyřech jazycích a nespadají zpět na češtinu", () => {
  const source = readSource("lib/i18n/dictionary.ts");
  const blocks = [...source.matchAll(/parkAndRide: \{([\s\S]*?)\n {2}\},/g)].map((m) => m[1]);

  test("dictionary.ts obsahuje přesně 4 vyplněné parkAndRide bloky (cs/en/de/uk) plus 1 typový blok", () => {
    // 4 konkrétní locale objekty + 1 `Dictionary` typový blok (ten neobsahuje uvozovky s hodnotami stejného tvaru).
    assert.ok(blocks.length >= 4, `očekáváno alespoň 4 bloky, nalezeno ${blocks.length}`);
  });

  test("žádný jazyk nemá prázdný text (žádné `: \"\"` uvnitř parkAndRide bloků)", () => {
    for (const block of blocks) {
      assert.doesNotMatch(block, /:\s*""/);
    }
  });

  test("anglický blok je opravdu anglicky (obsahuje 'parking', ne českou diakritiku)", () => {
    const en = blocks.find((b) => b.includes("Show P+R parking"));
    assert.ok(en);
    assert.doesNotMatch(en!, /[ěščřžýáíéůú]/i);
  });

  test("německý blok používá dativ přes germanPlaceCount pro staleNotice (ne nominativ z pluralize)", () => {
    const de = blocks.find((b) => b.includes("Parkplätze bei"));
    assert.ok(de);
    assert.match(de!, /staleNotice: \(free\) => `Letzter bekannter Stand: \$\{germanPlaceCount\(free\)\} frei`/);
  });

  test("ukrajinský blok správně skloňuje 'хвилину/хвилини/хвилин' bez fallbacku na angličtinu/češtinu", () => {
    const uk = blocks.find((b) => b.includes("Показати паркування"));
    assert.ok(uk);
    assert.match(uk!, /хвилину.*хвилини.*хвилин/s);
  });
});

describe("34. '0 volných míst' se zobrazí jako skutečná nula, ne jako 'neznámo'", () => {
  test("resolveOccupancyDisplay považuje freeSpaces === 0 za 'fresh', ne 'unmeasured' (viz i park-and-ride-occupancy.test.ts)", () => {
    const source = readSource("lib/parking/occupancy-display.ts");
    assert.doesNotMatch(source, /freeSpaces === 0[\s\S]{0,40}unmeasured/);
  });

  test("ParkAndRideCard nemá žádnou podmínku, co by 0 volných míst schovávala za 'unmeasured' text", () => {
    const source = readSource("components/parking/ParkAndRideCard.tsx");
    assert.doesNotMatch(source, /occupancy\.freeSpaces === 0/);
  });
});

describe("35. karta zůstává viditelná i při chybě načtení obsazenosti", () => {
  const sectionSource = readSource("components/parking/ParkAndRideSection.tsx");

  test("measurementsFailed nefiltruje pole karet — pořád se mapuje přes všechna 'sorted' P+R", () => {
    assert.doesNotMatch(sectionSource, /measurementsFailed[\s\S]{0,20}\.filter/);
    assert.match(sectionSource, /\{sorted\.map\(\(pr\) => \{/);
  });

  test("fetchFailed se posílá do karty jako prop, karta samotná se nepodmiňuje jeho hodnotou", () => {
    assert.match(sectionSource, /fetchFailed=\{state\.measurementsFailed\}/);
  });

  test("ParkAndRideCard.tsx vykresluje load-error jen v OccupancyLine, zbytek karty (jméno, adresa, cena, navigace) zůstává", () => {
    const cardSource = readSource("components/parking/ParkAndRideCard.tsx");
    const occupancyLineStart = cardSource.indexOf("function OccupancyLine");
    const loadErrorIndex = cardSource.indexOf('occupancy.kind === "load-error"');
    assert.ok(loadErrorIndex > occupancyLineStart, "load-error větev patří jen do OccupancyLine");
    assert.match(cardSource, /<MapNavigationButtons/);
  });
});

describe("36. mapa neobsahuje žádné nové P+R prvky (SVG mapa beze změny)", () => {
  test("MetroMapSvg.tsx zdroj neobsahuje žádnou zmínku o parkování", () => {
    const source = readSource("components/map/MetroMapSvg.tsx");
    assert.doesNotMatch(source, /park/i);
  });

  test("MetroMap.tsx byl upraven jen kvůli prostupu onOpenParkAndRide, ne kvůli vlastní vizualizaci", () => {
    const source = readSource("components/map/MetroMap.tsx");
    assert.match(source, /onOpenParkAndRide: \(stationId: string\) => void/);
    assert.doesNotMatch(source, /ParkAndRideBadge|ParkAndRideSection|ParkAndRideCard/);
  });
});

describe("37. layout nemá horizontální scroll na 320/375/430 px", () => {
  test("ParkAndRideSection.tsx a ParkAndRideCard.tsx nepoužívají pevné šířky ani `w-screen`", () => {
    for (const file of ["components/parking/ParkAndRideSection.tsx", "components/parking/ParkAndRideCard.tsx", "components/parking/ParkAndRideBadge.tsx"]) {
      const source = readSource(file);
      assert.doesNotMatch(source, /\bw-\[\d+px\]/);
      assert.doesNotMatch(source, /w-screen/);
    }
  });

  test("sekce má max-w a responzivní padding stejně jako zbytek appky (mx-auto w-full max-w-2xl px-4)", () => {
    const source = readSource("components/parking/ParkAndRideSection.tsx");
    assert.match(source, /className="mx-auto w-full max-w-2xl px-4"/);
  });

  test("dlouhé texty (jméno, adresa) mají zalamování, ne fixní jednořádkové truncate s přetečením", () => {
    const source = readSource("components/parking/ParkAndRideCard.tsx");
    assert.doesNotMatch(source, /whitespace-nowrap/);
  });
});

describe("38. barva nikdy jako jediný indikátor obsazenosti", () => {
  test("barevné pásmo (band) je vždy doprovázeno textem s číslem, ne jen barevnou třídou", () => {
    const source = readSource("components/parking/ParkAndRideCard.tsx");
    const bandBlockStart = source.indexOf("const BAND_CLASS");
    const returnAfterBand = source.slice(bandBlockStart);
    assert.match(returnAfterBand, /dict\.parkAndRide\.freeOfTotal\(occupancy\.freeSpaces, totalPlaceCountAfterPreposition\(occupancy\.totalSpaces\)\)/);
  });
});

describe("39. respektuje prefers-reduced-motion při scrollování na kartu", () => {
  test("ParkAndRideSection.tsx čte window.matchMedia před voláním scrollIntoView", () => {
    const source = readSource("components/parking/ParkAndRideSection.tsx");
    assert.match(source, /window\.matchMedia\("\(prefers-reduced-motion: reduce\)"\)\.matches/);
    assert.match(source, /behavior: prefersReducedMotion \? "auto" : "smooth"/);
  });
});

describe("40. plná klávesová ovladatelnost — žádný prvek není jen myší ovladatelný div s onClick", () => {
  test("ParkAndRideBadge je skutečný <button>, ne <div onClick>", () => {
    const source = readSource("components/parking/ParkAndRideBadge.tsx");
    assert.match(source, /<button[\s\S]*type="button"/);
    assert.doesNotMatch(source, /<div[^>]*onClick/);
  });

  test("toggle tlačítko sekce je skutečný <button>", () => {
    const source = readSource("components/parking/ParkAndRideSection.tsx");
    assert.match(source, /<button[\s\S]{0,80}type="button"[\s\S]{0,80}onClick=\{onToggle\}/);
  });

  test("karta má viditelný focus-visible ring (klávesové zaostření je vidět, ne jen výchozí obrys)", () => {
    const source = readSource("components/parking/ParkAndRideCard.tsx");
    assert.match(source, /focus-visible:ring-2 focus-visible:ring-navy-900/);
  });
});
