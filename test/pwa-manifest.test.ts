import { test, describe } from "node:test";
import assert from "node:assert/strict";
import manifest from "../app/manifest.ts";
import { PWA_NAME, PWA_SHORT_NAME } from "../lib/pwa/config.ts";

describe("app/manifest.ts — Web App Manifest (zadání bod 2)", () => {
  const result = manifest();

  test("name/short_name odpovídají zadání", () => {
    assert.equal(result.name, "KdeJeMetro.cz");
    assert.equal(result.short_name, "Metro");
    // Zároveň konzistentní se sdílenou konstantou použitou i v appleWebApp metadatech (lib/pwa/config.ts).
    assert.equal(result.name, PWA_NAME);
    assert.equal(result.short_name, PWA_SHORT_NAME);
  });

  test("má smysluplný neprázdný český popis", () => {
    assert.ok(result.description && result.description.length > 20);
    assert.match(result.description!, /metr/i);
  });

  test("start_url a scope jsou '/'", () => {
    assert.equal(result.start_url, "/");
    assert.equal(result.scope, "/");
  });

  test("display: standalone", () => {
    assert.equal(result.display, "standalone");
  });

  test("má background_color a theme_color jako platné hex barvy", () => {
    assert.match(result.background_color ?? "", /^#[0-9a-fA-F]{6}$/);
    assert.match(result.theme_color ?? "", /^#[0-9a-fA-F]{6}$/);
  });

  test("obsahuje ikony 192×192 a 512×512 (purpose 'any') a maskable 512×512", () => {
    const icons = result.icons ?? [];
    const any192 = icons.find((i) => i.sizes === "192x192" && i.purpose !== "maskable");
    const any512 = icons.find((i) => i.sizes === "512x512" && i.purpose !== "maskable");
    const maskable512 = icons.find((i) => i.sizes === "512x512" && i.purpose === "maskable");

    assert.ok(any192, "chybí běžná ikona 192×192");
    assert.ok(any512, "chybí běžná ikona 512×512");
    assert.ok(maskable512, "chybí maskable ikona 512×512");
    assert.equal(any192!.type, "image/png");
    assert.equal(any512!.type, "image/png");
    assert.equal(maskable512!.type, "image/png");
  });

  test("žádná ikona neukazuje na neexistující/externí URL (relativní cesty v rámci webu)", () => {
    for (const icon of result.icons ?? []) {
      assert.doesNotMatch(icon.src, /^https?:\/\//);
      assert.match(icon.src, /^\//);
    }
  });
});
