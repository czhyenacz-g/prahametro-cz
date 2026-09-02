import { test, describe } from "node:test";
import assert from "node:assert/strict";
import sitemap from "../app/sitemap.ts";

function isNightUrl(url: string): boolean {
  return url.endsWith("/nocni-mhd") || url.endsWith("/night-transport") || url.endsWith("/nachtverkehr") || url.endsWith("/nichnyi-transport");
}

describe("sitemap — 18. obsahuje /, /en, /de a /ua", () => {
  test("homepage cluster: obsahuje přesně čtyři URL /, /en, /de, /ua", () => {
    const entries = sitemap().filter((e) => !isNightUrl(e.url));
    const urls = entries.map((e) => e.url);
    assert.equal(urls.length, 4);
    assert.ok(urls.some((u) => !u.endsWith("/en") && !u.endsWith("/de") && !u.endsWith("/ua")), "chybí kořenová URL");
    assert.ok(urls.some((u) => u.endsWith("/en")), "chybí /en URL");
    assert.ok(urls.some((u) => u.endsWith("/de")), "chybí /de URL");
    assert.ok(urls.some((u) => u.endsWith("/ua")), "chybí /ua URL");
  });

  test("žádná URL nekončí na /uk (samostatně indexovatelná URL)", () => {
    const urls = sitemap().map((e) => e.url);
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

  test("každá URL homepage clusteru má stejné, obousměrné alternates.languages se všemi čtyřmi jazyky (klíč uk, ne ua)", () => {
    const entries = sitemap().filter((e) => !isNightUrl(e.url));
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
    const csEntry = entries.find((e) => !e.url.endsWith("/en") && !e.url.endsWith("/de") && !e.url.endsWith("/ua") && !isNightUrl(e.url))!;
    for (const entry of entries) {
      assert.ok((csEntry.priority ?? 0) >= (entry.priority ?? 0));
    }
  });
});

describe("sitemap — 19. noční sekce (4 vlastní URL, samostatný hreflang klastr)", () => {
  test("obsahuje přesně čtyři noční URL: /nocni-mhd, /en/night-transport, /de/nachtverkehr, /ua/nichnyi-transport", () => {
    const urls = sitemap()
      .filter((e) => isNightUrl(e.url))
      .map((e) => e.url);
    assert.equal(urls.length, 4);
    assert.ok(urls.some((u) => u.endsWith("/nocni-mhd")));
    assert.ok(urls.some((u) => u.endsWith("/en/night-transport")));
    assert.ok(urls.some((u) => u.endsWith("/de/nachtverkehr")));
    assert.ok(urls.some((u) => u.endsWith("/ua/nichnyi-transport")));
  });

  test("noční URL mají VLASTNÍ hreflang klastr (4 jazyky, uk -> /ua/nichnyi-transport), NEODKAZUJÍ na homepage cluster", () => {
    const nightEntries = sitemap().filter((e) => isNightUrl(e.url));
    for (const entry of nightEntries) {
      const languages = entry.alternates?.languages;
      assert.ok(languages?.cs?.toString().endsWith("/nocni-mhd"));
      assert.ok(languages?.en?.toString().endsWith("/en/night-transport"));
      assert.ok(languages?.de?.toString().endsWith("/de/nachtverkehr"));
      assert.ok(languages?.uk?.toString().endsWith("/ua/nichnyi-transport"));
    }
    const [first, ...rest] = nightEntries;
    for (const entry of rest) {
      assert.deepEqual(entry.alternates?.languages, first.alternates?.languages);
    }
  });

  test("sitemap má celkem přesně 8 URL (4 homepage + 4 noční)", () => {
    assert.equal(sitemap().length, 8);
  });
});
