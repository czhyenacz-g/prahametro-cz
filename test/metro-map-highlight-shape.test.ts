import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// .tsx komponenty se nedají v tomto projektu přímo importovat do testů
// (viz test/i18n-routing-shape.test.ts pro vysvětlení a stejný vzorec) —
// vizuální požadavky (podtržení jen u vybraných stanic, ne na
// kroužku/trati/kliku) se ověřují nad zdrojovým textem.
function readSource(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(`../${relativePath}`, import.meta.url)), "utf-8");
}

describe("10./11. MetroMapSvg — podtržení jen u vybraných stanic, vlastní <line> (ne CSS text-decoration)", () => {
  const source = readSource("components/map/MetroMapSvg.tsx");

  // CSS text-decoration na SVG <text> se v kombinaci s halo obtahem
  // (paintOrder/stroke pro čitelnost nad tratí) v praxi ztrácí — proto
  // se podtržení kreslí jako samostatná <line>, viz komentář v
  // MetroMapSvg.tsx. Tenhle test hlídá, že se tahle regrese nevrátí.
  test("podtržení se vykresluje jako vlastní <line>, ne přes CSS text-decoration", () => {
    assert.doesNotMatch(source, /textDecoration/);
    assert.match(source, /<line/);
  });

  test("<line> se vykresluje podmíněně podle isHighlighted (highlightedStationIds.has(node.id))", () => {
    assert.match(source, /const isHighlighted = highlightedStationIds\.has\(node\.id\)/);
    assert.match(source, /\{isHighlighted && \(\s*<line/);
  });

  test("podtržení má vlastní barvu mimo paletu čtyř linek metra (LINE_HEX)", () => {
    const lineHexValues = ["#1E8E3E", "#F4B400", "#D93025", "#6B4FBB"];
    const underlineColorMatch = /HIGHLIGHT_UNDERLINE_COLOR = "(#[0-9A-Fa-f]{6})"/.exec(source);
    assert.ok(underlineColorMatch, "nenalezena konstanta HIGHLIGHT_UNDERLINE_COLOR");
    assert.ok(!lineHexValues.includes(underlineColorMatch![1].toUpperCase()));
  });

  test("podtržení má tloušťku nezávislou na halo stroku textu (vlastní strokeWidth, ne 5)", () => {
    assert.match(source, /HIGHLIGHT_UNDERLINE_THICKNESS = \d+/);
  });

  test("nepřidává nové ikony/pulzování/animaci/legendu (žádné nové importy z lucide-react ani CSS animace)", () => {
    assert.doesNotMatch(source, /from "lucide-react"/);
    assert.doesNotMatch(source, /animate-|@keyframes|transition/);
  });

  test("nepřidává barevné kruhy ani špendlíky (žádný nový <circle> jen pro zvýraznění)", () => {
    const circleCount = (source.match(/<circle/g) ?? []).length;
    // Beze změny oproti původním dvěma kroužkům na stanici (klikací plocha + viditelný kroužek).
    assert.equal(circleCount, 2);
  });

  test("nezvětšuje layout — pozice textu (x/y) zůstává beze změny podle radius/node souřadnic", () => {
    assert.match(source, /x=\{node\.x \+ radius \+ 6\}/);
    assert.match(source, /y=\{node\.y \+ 5\}/);
  });

  test("<line> je pointerEvents=\"none\" (nic neblokuje klik na stanici)", () => {
    // \b hlídá, ať se nechytí "<polyline" ani zmínka "<line>" v komentáři výše.
    const lineBlockMatch = source.match(/<line\s+x1=[\s\S]*?\/>/);
    assert.ok(lineBlockMatch, "nenalezen <line> element s atributem x1");
    assert.match(lineBlockMatch![0], /pointerEvents="none"/);
  });
});

describe("12. MetroMapSvg — klik na stanici a detail zůstávají funkční beze změny", () => {
  const source = readSource("components/map/MetroMapSvg.tsx");

  test("klikací kruh dál volá onSelectStation(node.id) přes onClick i Enter/mezerník", () => {
    assert.match(source, /onClick=\{\(\) => onSelectStation\(node\.id\)\}/);
    assert.match(source, /event\.key === "Enter" \|\| event\.key === " "/);
  });

  test("text zůstává pointerEvents=\"none\" (podtržení nic neblokuje)", () => {
    const textBlockMatch = source.match(/<text[\s\S]*?<\/text>/);
    assert.match(textBlockMatch![0], /pointerEvents="none"/);
  });
});

describe("MetroMap.tsx / HomeClient.tsx — zvýraznění navázané na stationId, výsledkové karty beze změny", () => {
  test("MetroMap.tsx předává highlightedStationIds beze změny selectedStationId/detailu stanice", () => {
    const source = readSource("components/map/MetroMap.tsx");
    assert.match(source, /highlightedStationIds: ReadonlySet<string>/);
    assert.match(source, /highlightedStationIds=\{highlightedStationIds\}/);
    // Detail stanice a výsledkové karty dál používají nearestEntrances (vstupy), ne novou funkci.
    assert.match(source, /nearestEntrances\(/);
    assert.doesNotMatch(source, /computeHighlightedStationIds/);
  });

  test("HomeClient.tsx počítá zvýraznění přes computeHighlightedStationIds derivované z position", () => {
    const source = readSource("components/HomeClient.tsx");
    assert.match(source, /from "\.\.\/lib\/metro\/highlighted-stations\.ts"/);
    assert.match(source, /computeHighlightedStationIds\(position, entrances\)/);
  });

  test("FinderSection.tsx (výsledkové karty) nebyl kvůli této změně upravený", () => {
    const source = readSource("components/FinderSection.tsx");
    assert.doesNotMatch(source, /highlightedStationIds/);
    assert.doesNotMatch(source, /computeHighlightedStationIds/);
  });
});
