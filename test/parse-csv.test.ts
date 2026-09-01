import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { parseCsv } from "../lib/gtfs/parse-csv.ts";

describe("parseCsv", () => {
  test("jednoduchý CSV bez uvozovek", () => {
    const rows = parseCsv("a,b,c\n1,2,3\n4,5,6\n");
    assert.deepEqual(rows, [
      { a: "1", b: "2", c: "3" },
      { a: "4", b: "5", c: "6" },
    ]);
  });

  test("quoted pole s čárkou uvnitř", () => {
    const rows = parseCsv('name,city\n"Stanice, ulice",Praha\n');
    assert.deepEqual(rows, [{ name: "Stanice, ulice", city: "Praha" }]);
  });

  test("zdvojená uvozovka uvnitř quoted pole", () => {
    const rows = parseCsv('name\n"Řekl ""ahoj"""\n');
    assert.deepEqual(rows, [{ name: 'Řekl "ahoj"' }]);
  });

  test("prázdný vstup vrátí prázdné pole", () => {
    assert.deepEqual(parseCsv(""), []);
  });

  test("jen hlavička bez datových řádků", () => {
    assert.deepEqual(parseCsv("a,b\n"), []);
  });
});
