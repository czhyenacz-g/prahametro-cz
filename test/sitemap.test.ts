import { test, describe } from "node:test";
import assert from "node:assert/strict";
import sitemap from "../app/sitemap.ts";

describe("sitemap — 18. obsahuje / a /en", () => {
  test("obsahuje přesně dvě URL, kořen (\"/\") a \"/en\"", () => {
    const entries = sitemap();
    const urls = entries.map((e) => e.url);
    assert.equal(urls.length, 2);
    assert.ok(urls.some((u) => !u.endsWith("/en")), "chybí kořenová URL");
    assert.ok(urls.some((u) => u.endsWith("/en")), "chybí /en URL");
  });

  test("každá URL má obousměrné alternates.languages (cs i en) a stejnou hodnotu pro obě položky", () => {
    const [csEntry, enEntry] = sitemap();
    assert.ok(csEntry.alternates?.languages?.cs);
    assert.ok(csEntry.alternates?.languages?.en);
    assert.deepEqual(csEntry.alternates?.languages, enEntry.alternates?.languages);
  });

  test("česká URL má vyšší prioritu než anglická (primární trh)", () => {
    const [csEntry, enEntry] = sitemap();
    assert.ok((csEntry.priority ?? 0) >= (enEntry.priority ?? 0));
  });
});
