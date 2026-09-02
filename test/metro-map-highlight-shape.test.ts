import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// .tsx komponenty se nedají v tomto projektu přímo importovat do testů
// (viz test/i18n-routing-shape.test.ts pro vysvětlení a stejný vzorec) —
// vizuální požadavky (podtržení jen na textu, ne na kroužku/trati/kliku)
// se ověřují nad zdrojovým textem.
function readSource(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(`../${relativePath}`, import.meta.url)), "utf-8");
}

describe("10./11. MetroMapSvg — podtržení jen u vybraných stanic, jen na <text>", () => {
  const source = readSource("components/map/MetroMapSvg.tsx");

  test("styl podtržení se aplikuje podmíněně podle highlightedStationIds.has(node.id)", () => {
    assert.match(source, /highlightedStationIds\.has\(node\.id\)/);
  });

  test("konstanta s textDecorationLine/Thickness/UnderlineOffset existuje a je použitá jen v rámci <text>", () => {
    assert.match(source, /textDecorationLine:\s*"underline"/);
    assert.match(source, /textDecorationThickness/);
    assert.match(source, /textUnderlineOffset/);

    const textBlockMatch = source.match(/<text[\s\S]*?<\/text>/);
    assert.ok(textBlockMatch, "chybí <text> blok pro jméno stanice");
    assert.match(textBlockMatch![0], /HIGHLIGHT_TEXT_DECORATION_STYLE/);

    const circleBlocks = source.match(/<circle[\s\S]*?\/>/g) ?? [];
    for (const block of circleBlocks) {
      assert.doesNotMatch(block, /textDecoration|HIGHLIGHT_TEXT_DECORATION_STYLE/);
    }
    const polylineBlocks = source.match(/<polyline[\s\S]*?\/>/g) ?? [];
    for (const block of polylineBlocks) {
      assert.doesNotMatch(block, /textDecoration|HIGHLIGHT_TEXT_DECORATION_STYLE/);
    }
  });

  test("nepřidává nové ikony/pulzování/animaci/legendu (žádné nové importy z lucide-react ani CSS animace)", () => {
    assert.doesNotMatch(source, /from "lucide-react"/);
    assert.doesNotMatch(source, /animate-|@keyframes|transition/);
  });

  test("nepřidává barevné kruhy ani špendlíky (žádný nový <circle>/<path> jen pro zvýraznění)", () => {
    const circleCount = (source.match(/<circle/g) ?? []).length;
    // Beze změny oproti původním dvěma kroužkům na stanici (klikací plocha + viditelný kroužek).
    assert.equal(circleCount, 2);
  });

  test("nezvětšuje layout — pozice textu (x/y) zůstává beze změny podle radius/node souřadnic", () => {
    assert.match(source, /x=\{node\.x \+ radius \+ 6\}/);
    assert.match(source, /y=\{node\.y \+ 5\}/);
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
