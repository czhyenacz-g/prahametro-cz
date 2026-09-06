import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { getDictionary, dictionaries } from "../lib/i18n/dictionary.ts";
import { LOCALES } from "../lib/i18n/types.ts";

// Stejný vzorec jako test/park-and-ride-ui-shape.test.ts — "use client"
// komponenty a React hooky nejdou v tomhle projektu přímo importovat/
// vyrenderovat v node:test (žádné jsdom/RTL v devDependencies, viz
// zadání "nepřidávej těžkou knihovnu"), takže se zadání body 27-44
// (async chování, UI vazba, lokalizace, soukromí) ověřují nad zdrojovým
// textem — logika samotná (výběr kandidátů/matrix klient/řazení) má
// plnohodnotné testy v select-walking-route-candidates.test.ts,
// mapy-walking-matrix.test.ts a rank-walking-results.test.ts.
function readSource(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(`../${relativePath}`, import.meta.url)), "utf-8");
}

describe("27. předběžné výsledky se zobrazí okamžitě (synchronně, ne až po fetchi)", () => {
  test("`results` v hooku je preliminaryResults, dokud routedResults není nastaveno — počítáno synchronně mimo efekt", () => {
    const source = readSource("hooks/useMetroFinderResults.ts");
    assert.match(source, /const results = routedResults \?\? toAirDistanceResults\(preliminaryResults\);/);
    // preliminaryResults se počítá NAD `useEffect`, ne uvnitř něj.
    const effectIndex = source.indexOf("useEffect(");
    const preliminaryIndex = source.indexOf("const preliminaryResults");
    assert.ok(preliminaryIndex > 0 && preliminaryIndex < effectIndex);
  });
});

describe("28. nenápadný stav 'Zpřesňuji pěší trasy…' v existujícím aria-live prostoru", () => {
  const source = readSource("components/FinderSection.tsx");

  test("FinderSection podmíněně vykreslí dict.finder.refining podle isRefining", () => {
    assert.match(source, /\{isRefining && <p[^>]*>\{dict\.finder\.refining\}<\/p>\}/);
  });

  test("text je uvnitř existujícího aria-live=\"polite\" wrapperu, ne v novém", () => {
    const ariaLiveIndex = source.indexOf('aria-live="polite"');
    const refiningIndex = source.indexOf("dict.finder.refining");
    assert.ok(ariaLiveIndex > 0 && ariaLiveIndex < refiningIndex);
    assert.doesNotMatch(source, /aria-live="polite"[\s\S]*aria-live="polite"/);
  });

  test("žádný nový spinner/modal/skeleton — jen <p>, žádný <dialog>/role=\"dialog\" navíc, žádný .animate-spin", () => {
    assert.doesNotMatch(source, /role="dialog"|<dialog|animate-spin|Skeleton/);
  });
});

describe("29./30. routovaný výsledek má jiný text a jiný disclaimer než vzdušný", () => {
  const source = readSource("components/EntranceResultCard.tsx");

  test("29. hlavní vzdálenost/čas použije walkingDistanceLabel/walkingTimeLabel jen pro distanceSource walking-route", () => {
    assert.match(source, /isWalkingRoute \? dict\.result\.walkingDistanceLabel\(formatDistance\(distanceMeters\)\) : formatDistance\(distanceMeters\)/);
    assert.match(
      source,
      /isWalkingRoute && durationSeconds !== null \? dict\.result\.walkingTimeLabel\(Math\.ceil\(durationSeconds \/ 60\)\) : formatWalkingTime\(distanceMeters\)/
    );
  });

  test("30. disclaimer má tři různé větve: routed / fallback-po-pokusu / obecný vzdušný", () => {
    assert.match(source, /isWalkingRoute \? \(/);
    assert.match(source, /disclaimerWalkingRoutePrefix/);
    assert.match(source, /routingAttempted \? \(/);
    assert.match(source, /disclaimerRouteFallback/);
    assert.match(source, /dict\.result\.disclaimer\s*\n?\s*\)/);
  });

  test("30. výchozí hodnoty parametrů zachovávají PŮVODNÍ chování pro volající, kteří je nepředávají (MetroMap.tsx detail stanice)", () => {
    assert.match(source, /distanceSource = "air-distance"/);
    assert.match(source, /durationSeconds = null/);
    assert.match(source, /routingAttempted = false/);
    const mapSource = readSource("components/map/MetroMap.tsx");
    assert.doesNotMatch(mapSource, /distanceSource=|routingAttempted=/);
  });
});

describe("31. při chybě zůstane původní UI použitelné (žádný throw, žádný celoplošný error stav)", () => {
  const source = readSource("hooks/useMetroFinderResults.ts");

  test("MapyRoutingError se v .catch mění na null (fallback), ne na rethrow", () => {
    assert.match(source, /if \(error instanceof MapyRoutingError\) return null;/);
  });

  test("selhání se nikdy nepropaguje do React stavu jako 'error' — jen isRefining=false a beze změny routedResults", () => {
    assert.doesNotMatch(source, /setError|errorState|status: "error"/);
  });
});

describe("32./33. závody: nový request zruší starý, stará odpověď nepřepíše novou", () => {
  const source = readSource("hooks/useMetroFinderResults.ts");

  test("32. cleanup funkce efektu volá controller.abort()", () => {
    assert.match(source, /return \(\) => \{\s*controller\.abort\(\);\s*\};/);
  });

  test("33. generation counter zabrání starší odpovědi přepsat novější stav", () => {
    assert.match(source, /const myGeneration = \+\+generationRef\.current;/);
    assert.match(source, /if \(generationRef\.current !== myGeneration\) return;/);
  });
});

describe("34. přepnutí jazyka nevytvoří nový API request", () => {
  test("dependency pole efektu neobsahuje locale/dict/vulgar, jen lat/lon/isOutsidePrague/entrances", () => {
    const source = readSource("hooks/useMetroFinderResults.ts");
    const match = source.match(/\}, \[(.*?)\]\);/);
    assert.ok(match, "efekt musí mít explicitní dependency pole");
    const deps = match![1];
    assert.doesNotMatch(deps, /locale|dict|vulgar/);
    assert.match(deps, /lat, lon, isOutsidePrague, entrances/);
  });
});

describe("35. mimo Prahu se matrix API nikdy nevolá", () => {
  test("efekt se vrátí před výběrem kandidátů, pokud isOutsidePrague", () => {
    const source = readSource("hooks/useMetroFinderResults.ts");
    const guardIndex = source.indexOf("if (lat === null || lon === null || isOutsidePrague) return;");
    const candidatesIndex = source.indexOf("selectWalkingRouteCandidates(origin");
    assert.ok(guardIndex > 0 && candidatesIndex > guardIndex);
  });

  test("chybějící API klíč má stejný časný `return` PŘED voláním selectWalkingRouteCandidates", () => {
    const source = readSource("hooks/useMetroFinderResults.ts");
    const keyCheckIndex = source.indexOf("if (!apiKey) return;");
    const candidatesIndex = source.indexOf("selectWalkingRouteCandidates(origin");
    assert.ok(keyCheckIndex > 0 && candidatesIndex > keyCheckIndex);
  });
});

describe("36. navigační tlačítka zůstala tři, beze změny pořadí/logiky", () => {
  test("EntranceResultCard pořád vykresluje MapNavigationButtons se třemi URL beze změny volání", () => {
    const source = readSource("components/EntranceResultCard.tsx");
    assert.match(source, /<MapNavigationButtons\s+googleUrl=\{googleUrl\}\s+appleUrl=\{appleUrl\}\s+mapyUrl=\{mapyUrl\}/);
  });
});

describe("37. mapa zvýrazní finální (routované) stanice, ne původní vzdušný shortlist", () => {
  test("HomeClient upřednostní finder.routedStationIds před computeHighlightedStationIds", () => {
    const source = readSource("components/HomeClient.tsx");
    assert.match(source, /const highlightedStationIds = finder\.routedStationIds \?\? computeHighlightedStationIds\(position, entrances\);/);
  });

  test("MetroMapSvg/SVG mapa samotná beze změny (žádná zmínka o routingu/Mapy.com)", () => {
    const svgSource = readSource("components/map/MetroMapSvg.tsx");
    assert.doesNotMatch(svgSource, /routing|Mapy\.com|matrix/i);
  });
});

describe("38.-41. lokalizace cs/en/de/uk pro nová pole (refining, walking labels, disclaimery)", () => {
  test("dictionaries obsahuje přesně cs/en/de/uk (beze změny sady jazyků)", () => {
    assert.deepEqual(Object.keys(dictionaries).sort(), [...LOCALES].sort());
  });

  test("finder.refining je vyplněné a jiné pro každý ze 4 jazyků", () => {
    const values = LOCALES.map((locale) => getDictionary(locale).finder.refining);
    assert.ok(values.every((v) => v.length > 0));
    assert.equal(new Set(values).size, 4);
  });

  test("result.disclaimerWalkingRoutePrefix a disclaimerRouteFallback jsou vyplněné a jiné pro každý jazyk", () => {
    const prefixes = LOCALES.map((locale) => getDictionary(locale).result.disclaimerWalkingRoutePrefix);
    const fallbacks = LOCALES.map((locale) => getDictionary(locale).result.disclaimerRouteFallback);
    assert.ok(prefixes.every((v) => v.length > 0));
    assert.ok(fallbacks.every((v) => v.length > 0));
    assert.equal(new Set(prefixes).size, 4);
    assert.equal(new Set(fallbacks).size, 4);
  });

  test("result.walkingDistanceLabel/walkingTimeLabel fungují jako funkce ve všech 4 jazycích", () => {
    for (const locale of LOCALES) {
      const dict = getDictionary(locale);
      assert.equal(typeof dict.result.walkingDistanceLabel("1,8 km"), "string");
      assert.equal(typeof dict.result.walkingTimeLabel(24), "string");
      assert.match(dict.result.walkingDistanceLabel("1,8 km"), /1,8 km/);
      assert.match(dict.result.walkingTimeLabel(24), /24/);
    }
  });

  test("anglický blok je opravdu anglicky (bez české diakritiky)", () => {
    const en = getDictionary("en");
    assert.doesNotMatch(en.finder.refining, /[ěščřžýáíéůú]/i);
    assert.doesNotMatch(en.result.disclaimerRouteFallback, /[ěščřžýáíéůú]/i);
  });

  test("ukrajinský blok nepoužívá ruské tvary (ы/ъ/э/ё)", () => {
    const uk = getDictionary("uk");
    const allNewText = JSON.stringify([uk.finder.refining, uk.result.disclaimerWalkingRoutePrefix, uk.result.disclaimerRouteFallback]);
    assert.doesNotMatch(allNewText, /[ыъэё]/);
  });

  test("německý blok používá formální vykání (Ihre/Sie), ne du/dein", () => {
    const de = getDictionary("de");
    for (const text of [de.finder.privacyNote, de.footer.privacy, de.finder.refining]) {
      assert.doesNotMatch(text, /\bdu\b|\bdein\b|\bdeine\b/i);
    }
  });
});

describe("42. informace o soukromí zmiňuje jednorázové předání polohy Mapy.com ve všech 4 jazycích", () => {
  test("finder.privacyNote i footer.privacy obsahují 'Mapy.com' v každém jazyce", () => {
    for (const locale of LOCALES) {
      const dict = getDictionary(locale);
      assert.match(dict.finder.privacyNote, /Mapy\.com/);
      assert.match(dict.footer.privacy, /Mapy\.com/);
    }
  });

  test("noční MHD (night-dictionary.ts) NENÍ dotčené — jeho privacyNote pořád tvrdí 'jen na zařízení' (routing se tam nepoužívá)", () => {
    const source = readSource("lib/i18n/night-dictionary.ts");
    assert.match(source, /privacyNote: "Poloha zůstává jen ve vašem zařízení\."/);
    assert.doesNotMatch(source, /Mapy\.com/);
  });
});

describe("43./44. přesná poloha se neukládá ani neposílá jinam než na Mapy.com routing", () => {
  const newFiles = [
    "hooks/useMetroFinderResults.ts",
    "lib/routing/select-walking-route-candidates.ts",
    "lib/routing/mapy-walking-matrix.ts",
    "lib/routing/rank-walking-results.ts",
    "lib/routing/matrix-cache-key.ts",
    "components/FinderSection.tsx",
    "components/HomeClient.tsx",
    "components/EntranceResultCard.tsx",
  ];

  test("43. žádný z nových/upravených souborů nepoužívá localStorage/sessionStorage", () => {
    for (const file of newFiles) {
      assert.doesNotMatch(readSource(file), /localStorage\.\w|localStorage\[|sessionStorage\.\w|sessionStorage\[/);
    }
  });

  test("43./44. žádný z nových/upravených souborů polohu neloguje (console.*)", () => {
    for (const file of newFiles) {
      assert.doesNotMatch(readSource(file), /console\.(log|debug|info|warn|error)\(/);
    }
  });

  test("44. jediné externí volání s polohou je fetchWalkingMatrix (Mapy.com) — hook neposílá polohu do content-api/ads/parking eventů", () => {
    const hookSource = readSource("hooks/useMetroFinderResults.ts");
    assert.doesNotMatch(hookSource, /content-api|emitAdEvent|emitParkingEvent|ucaJsonRequest/);
  });

  test("ParkingEvent (analytika) nemá žádné pole s GPS souřadnicemi", () => {
    const source = readSource("lib/parking/events.ts");
    assert.doesNotMatch(source, /\blat\b|\blon\b|latitude|longitude/i);
  });
});
