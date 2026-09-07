// .tsx komponenty se v tomhle projektu nedají přímo importovat do testů
// (Node nativně nepodporuje JSX pro .tsx — viz package.json "test"
// script), takže se ověřují nad zdrojovým textem, stejný vzorec jako
// test/departures-ui-shape.test.ts.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

function readSource(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(`../${relativePath}`, import.meta.url)), "utf-8");
}

describe("components/pwa/InstallPrompt.tsx (zadání body 5–11, 13)", () => {
  const source = readSource("components/pwa/InstallPrompt.tsx");

  test("schová se v standalone režimu, po zavření, nebo když není ani beforeinstallprompt ani iOS", () => {
    assert.match(source, /if \(isStandalone \|\| dismissed \|\| \(!canInstall && !isIOS\)\) return null;/);
  });

  test("schovaná od 'sm:' šířky výš — desktop uživatelům se karta nezobrazuje", () => {
    assert.match(source, /sm:hidden/);
  });

  test("na iOS se NESPOUŠTÍ promptInstall (žádný fake install) — otevře se jen lokální sheet s návodem", () => {
    const handleCta = source.match(/async function handleCta\(\) \{([\s\S]*?)\n  \}/);
    assert.ok(handleCta);
    assert.match(handleCta![1], /if \(isIOS\) \{\s*setShowIosSheet\(true\);\s*return;\s*\}/);
  });

  test("po klik na Android CTA (promptInstall) i po zavření iOS návodu se zavolá dismiss() (zapamatuje se)", () => {
    assert.match(source, /await promptInstall\(\);\s*dismiss\(\);/);
    assert.match(source, /function closeIosSheet\(\) \{\s*setShowIosSheet\(false\);\s*dismiss\(\);/);
  });

  test("žádné vykreslení iOS sheetu hned po mountu — jen po explicitním kliknutí (showIosSheet začíná na false)", () => {
    assert.match(source, /useState\(false\)/);
    assert.doesNotMatch(source, /useEffect\(\(\) => \{\s*setShowIosSheet\(true\)/);
  });

  test("iOS sheet je skutečný přístupný dialog (role, aria-modal, focus trap), ne fake tlačítko předstírající instalaci", () => {
    assert.match(source, /role="dialog"/);
    assert.match(source, /aria-modal="true"/);
    assert.match(source, /useFocusTrap\(true, onClose\)/);

    const sheetFn = source.match(/function IosInstructionsSheet\([\s\S]*$/);
    assert.ok(sheetFn);
    // Sheet komponenta o nativním beforeinstallprompt vůbec neví — jen zobrazuje kroky a zavírá se.
    assert.doesNotMatch(sheetFn![0], /\.prompt\(\)|beforeinstallprompt|promptInstall/);
  });

  test("respektuje safe-area na iPhonech (spodní panel)", () => {
    assert.match(source, /env\(safe-area-inset-bottom\)/);
  });

  test("texty i barva CTA přichází jako props, ne natvrdo zapsané v komponentě (přenositelnost, zadání bod 13)", () => {
    assert.match(source, /texts: InstallPromptTexts/);
    assert.match(source, /ctaClassName = "bg-gray-900 hover:bg-gray-800"/);
    // Žádná konkrétní brand barva (navy) ani čeština natvrdo v komponentě samotné.
    assert.doesNotMatch(source, /navy-900/);
    assert.doesNotMatch(source, /"Přidat na plochu"|"Mějte metro/);
  });

  test("použije usePwaInstall a usePersistentDismiss (žádná duplicitní paralelní logika)", () => {
    assert.match(source, /from "..\/..\/hooks\/usePwaInstall\.ts"/);
    assert.match(source, /from "..\/..\/hooks\/usePersistentDismiss\.ts"/);
  });
});

describe("components/HomePage.tsx — zapojení InstallPrompt (zadání bod 7 umístění)", () => {
  const source = readSource("components/HomePage.tsx");

  test("vykresluje se AŽ PO HomeClient (pod hlavní funkční částí, ne nad výsledky/tlačítky)", () => {
    const homeClientIndex = source.indexOf("<HomeClient");
    const installPromptIndex = source.indexOf("<InstallPrompt");
    assert.ok(homeClientIndex >= 0 && installPromptIndex >= 0);
    assert.ok(installPromptIndex > homeClientIndex, "InstallPrompt musí být až po HomeClient");
  });

  test("dostává lokalizované texty přes dict.pwa, ne natvrdo zapsaný text", () => {
    assert.match(source, /texts=\{getDictionary\(locale\)\.pwa\}/);
  });
});

describe("Web App Manifest a Apple ikona jsou zapojené ve všech čtyřech jazykových root layoutech", () => {
  const layouts = ["app/(cs)/layout.tsx", "app/en/layout.tsx", "app/de/layout.tsx", "app/ua/layout.tsx"];

  for (const layout of layouts) {
    test(`${layout} exportuje viewport (theme-color) a appleWebApp metadata`, () => {
      const source = readSource(layout);
      assert.match(source, /export const viewport: Viewport = PWA_VIEWPORT;/);
      assert.match(source, /appleWebApp: PWA_APPLE_WEB_APP_METADATA/);
    });
  }
});
