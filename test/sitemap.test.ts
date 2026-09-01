import { test, describe } from "node:test";
import assert from "node:assert/strict";
import sitemap from "../app/sitemap.ts";

describe("sitemap — 18. obsahuje /, /en, /de a /ua", () => {
  test("obsahuje přesně čtyři URL: /, /en, /de, /ua", () => {
    const entries = sitemap();
    const urls = entries.map((e) => e.url);
    assert.equal(urls.length, 4);
    assert.ok(urls.some((u) => !u.endsWith("/en") && !u.endsWith("/de") && !u.endsWith("/ua")), "chybí kořenová URL");
    assert.ok(urls.some((u) => u.endsWith("/en")), "chybí /en URL");
    assert.ok(urls.some((u) => u.endsWith("/de")), "chybí /de URL");
    assert.ok(urls.some((u) => u.endsWith("/ua")), "chybí /ua URL");
    assert.ok(
      urls.every((u) => !u.endsWith("/uk")),
      "/uk nesmí být v sitemapě jako samostatná indexovatelná URL"
    );
  });

  test("žádná URL neukazuje na *.vercel.app preview doménu", () => {
    const entries = sitemap();
    for (const entry of entries) {
      assert.doesNotMatch(entry.url, /vercel\.app/);
    }
  });

  test("každá URL má stejné, obousměrné alternates.languages se všemi čtyřmi jazyky (klíč uk, ne ua)", () => {
    const entries = sitemap();
    for (const entry of entries) {
      const languages = entry.alternates?.languages;
      assert.ok(languages?.cs);
      assert.ok(languages?.en);
      assert.ok(languages?.de);
      assert.ok(languages?.uk);
      assert.ok(languages?.uk?.toString().endsWith("/ua"), "hreflang uk musí ukazovat na URL /ua");
    }
    const [first, ...rest] = entries;
    for (const entry of rest) {
      assert.deepEqual(entry.alternates?.languages, first.alternates?.languages);
    }
  });

  test("česká URL má nejvyšší prioritu (primární trh)", () => {
    const entries = sitemap();
    const csEntry = entries.find((e) => !e.url.endsWith("/en") && !e.url.endsWith("/de") && !e.url.endsWith("/ua"))!;
    for (const entry of entries) {
      assert.ok((csEntry.priority ?? 0) >= (entry.priority ?? 0));
    }
  });
});
