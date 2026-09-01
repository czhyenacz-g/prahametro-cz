import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// .tsx komponenty se nedají v tomhle projektu přímo importovat do testů
// (Node nativně nepodporuje JSX pro .tsx, jen .ts — viz package.json
// "test" script), takže se komponentové/přístupnostní požadavky (viz
// zadání bod 13) ověřují nad zdrojovým textem, stejný vzorec jako
// test/nameday-greeting-shape.test.ts a test/i18n-routing-shape.test.ts.
function readSource(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(`../${relativePath}`, import.meta.url)), "utf-8");
}

describe("DeparturesButton.tsx", () => {
  const source = readSource("components/DeparturesButton.tsx");

  test("2. minimální dotyková plocha 44×44 px", () => {
    assert.match(source, /min-h-\[44px\] min-w-\[44px\]/);
  });

  test("3. klik otevře panel (setOpen(true) -> podmíněné vykreslení DeparturesPanel)", () => {
    assert.match(source, /onClick=\{\(\) => setOpen\(true\)\}/);
    assert.match(source, /\{open && <DeparturesPanel/);
  });

  test("4. panel dostává onClose, který ho zavře (setOpen(false))", () => {
    assert.match(source, /onClose=\{\(\) => setOpen\(false\)\}/);
  });

  test("1. vykresluje se pro každou stanici appky bez podmínky (import garantuje pokrytí dat, viz lib/gtfs/validate-departures-coverage.ts)", () => {
    assert.doesNotMatch(source, /if \(!stationId/);
  });

  test("ikona hodin je dekorativní (aria-hidden) a z už použité knihovny lucide-react", () => {
    assert.match(source, /from "lucide-react"/);
    assert.match(source, /<Clock aria-hidden="true"/);
  });

  test("používá dict.departures.buttonLabel/buttonAriaLabel, ne natvrdo zapsaný text", () => {
    assert.match(source, /dict\.departures\.buttonLabel/);
    assert.match(source, /dict\.departures\.buttonAriaLabel\(stationName\)/);
  });
});

describe("DeparturesPanel.tsx — přístupnost (viz zadání bod 3/13)", () => {
  const source = readSource("components/DeparturesPanel.tsx");

  test("role=dialog, aria-modal, aria-labelledby", () => {
    assert.match(source, /role="dialog"/);
    assert.match(source, /aria-modal="true"/);
    assert.match(source, /aria-labelledby=\{headingId\}/);
  });

  test("5./6./7. focus trap + Escape + návrat focusu přes useFocusTrap", () => {
    assert.match(source, /import \{ useFocusTrap \} from "..\/hooks\/useFocusTrap.ts"/);
    assert.match(source, /useFocusTrap\(true, onClose\)/);
  });

  test("zavírací tlačítko s přístupným popiskem", () => {
    assert.match(source, /aria-label=\{dict\.departures\.dialogCloseLabel\}/);
  });

  test("8. přepnutí linky mění selectedLine (aria-pressed reflektuje výběr)", () => {
    assert.match(source, /onClick=\{\(\) => selectLine\(l\.line\)\}/);
    assert.match(source, /aria-pressed=\{l\.line === selectedLine\}/);
  });

  test("9. přepnutí směru mění selectedDirection", () => {
    assert.match(source, /onClick=\{\(\) => setSelectedDirection\(d\.directionId\)\}/);
    assert.match(source, /aria-pressed=\{d\.directionId === selectedDirection\}/);
  });

  test("volba směru se vynechá, pokud je dostupný jen jeden (directions.length > 1)", () => {
    assert.match(source, /currentLine\.directions\.length > 1/);
  });

  test("volba linky se vynechá, pokud stanice má jen jednu (lines.length > 1)", () => {
    assert.match(source, /file\.lines\.length > 1/);
  });

  test("13. chybový stav používá dict.departures.errorTitle/errorBody", () => {
    assert.match(source, /state\.status === "error"/);
    assert.match(source, /dict\.departures\.errorTitle/);
    assert.match(source, /dict\.departures\.errorBody/);
  });

  test("14. upozornění na zastaralá data používá dict.departures.staleTitle/staleBody, ne tvrzení 'metro (ne)jede'", () => {
    assert.match(source, /isStale/);
    assert.match(source, /dict\.departures\.staleTitle/);
    assert.match(source, /dict\.departures\.staleBody/);
    assert.doesNotMatch(source, /metro (už )?nejede/i);
    assert.doesNotMatch(source, /metro (ještě )?jede/i);
  });

  test("nejbližší odjezdy a poslední metro čtou přesně z lib/departures/next-departures.ts, žádné vlastní ad-hoc výpočty", () => {
    assert.match(source, /import \{ getLastDeparture, getUpcomingDepartures \} from "..\/lib\/departures\/next-departures.ts"/);
  });

  test("zdroj a datum importu (dict.departures.sourceLabel/updatedLabel + formatUpdatedDate)", () => {
    assert.match(source, /dict\.departures\.sourceLabel/);
    assert.match(source, /dict\.departures\.updatedLabel/);
    assert.match(source, /formatUpdatedDate\(file\.generatedAt, locale\)/);
  });

  test("directionLabel: čte skutečný trip headsign z dat, nepřekládá název stanice ručně", () => {
    assert.match(source, /dict\.departures\.towards\(d\.headsign\)/);
    assert.match(source, /dict\.departures\.towards\(departure\.headsign\)/);
  });

  test("12. text v pomocném řádku nepůsobí přetečením — disclaimer má min-w-0/flex-1, tlačítko si drží vlastní šířku", () => {
    const cardSource = readSource("components/EntranceResultCard.tsx");
    assert.match(cardSource, /min-w-0 flex-1 text-xs text-gray-400/);
  });
});

describe("11. tři navigační tlačítka zůstávají beze změny (EntranceResultCard.tsx)", () => {
  const source = readSource("components/EntranceResultCard.tsx");

  test("přesně tři <NavigationButton>, stále v grid-cols-3 řádku", () => {
    const matches = source.match(/<NavigationButton/g) ?? [];
    assert.equal(matches.length, 3);
    assert.match(source, /grid grid-cols-3/);
  });

  test("Odjezdy tlačítko NENÍ součástí grid-cols-3 řádku ani čtvrtým NavigationButton", () => {
    const gridRowMatch = source.match(/<div className="mt-3 grid grid-cols-3[^]*?<\/div>/);
    assert.ok(gridRowMatch);
    assert.doesNotMatch(gridRowMatch![0], /DeparturesButton/);
  });

  test("DeparturesButton se vykresluje v samostatném pomocném řádku pod navigačními tlačítky", () => {
    const navIndex = source.indexOf("grid grid-cols-3");
    const departuresIndex = source.indexOf("<DeparturesButton");
    assert.ok(navIndex >= 0 && departuresIndex > navIndex);
  });
});

describe("useFocusTrap.ts", () => {
  const source = readSource("hooks/useFocusTrap.ts");

  test("Escape zavře panel", () => {
    assert.match(source, /event\.key === "Escape"/);
    assert.match(source, /onCloseRef\.current\(\)/);
  });

  test("Tab/Shift+Tab drží focus uvnitř kontejneru", () => {
    assert.match(source, /event\.key !== "Tab"/);
    assert.match(source, /event\.shiftKey/);
  });

  test("focus se po zavření vrátí na původně zaostřený prvek", () => {
    assert.match(source, /previouslyFocused\?\.focus\(\)/);
  });
});
