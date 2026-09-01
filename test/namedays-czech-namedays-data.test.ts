import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { CZECH_NAMEDAYS } from "../lib/namedays/czech-namedays.ts";

// Civilní kalendář v ČR má 5 dnů, které jsou státním svátkem, ale
// tradičně bez jmenin (viz komentář v lib/namedays/czech-namedays.ts u
// zdroje dat) — appka pro ně použije formatNamedaySentence([]) fallback.
const DAYS_WITHOUT_NAMEDAY = new Set(["01-01", "05-01", "05-08", "07-06", "12-25"]);

const DAYS_IN_MONTH: Record<number, number> = {
  1: 31,
  2: 29, // včetně 29. února (přestupný den, viz zadání)
  3: 31,
  4: 30,
  5: 31,
  6: 30,
  7: 31,
  8: 31,
  9: 30,
  10: 31,
  11: 30,
  12: 31,
};

function allCalendarKeys(): string[] {
  const keys: string[] = [];
  for (let month = 1; month <= 12; month++) {
    for (let day = 1; day <= DAYS_IN_MONTH[month]; day++) {
      keys.push(`${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
    }
  }
  return keys;
}

describe("CZECH_NAMEDAYS — pokrytí celého kalendářního roku", () => {
  test("obsahuje záznam (nebo dokumentovanou výjimku bez jmenin) pro všech 366 kalendářních dnů", () => {
    const missing: string[] = [];
    for (const key of allCalendarKeys()) {
      if (!(key in CZECH_NAMEDAYS) && !DAYS_WITHOUT_NAMEDAY.has(key)) {
        missing.push(key);
      }
    }
    assert.deepEqual(missing, []);
  });

  test("29. únor je v datech (přestupný den)", () => {
    assert.ok(Array.isArray(CZECH_NAMEDAYS["02-29"]));
    assert.ok(CZECH_NAMEDAYS["02-29"].length > 0);
  });

  test("začátek roku (2. leden — 1. leden je dokumentovaná výjimka bez jmenin) a konec roku (31. prosinec) jsou v datech", () => {
    assert.ok(CZECH_NAMEDAYS["01-02"]?.length > 0);
    assert.ok(CZECH_NAMEDAYS["12-31"]?.length > 0);
  });

  test("aspoň jeden den má víc než jedno jméno", () => {
    const hasMultiple = Object.values(CZECH_NAMEDAYS).some((names) => names.length > 1);
    assert.ok(hasMultiple);
  });

  test("žádná hodnota není prázdné pole a žádné jméno není prázdný/whitespace řetězec", () => {
    for (const [key, names] of Object.entries(CZECH_NAMEDAYS)) {
      assert.ok(names.length > 0, `${key} nesmí mít prázdné pole jmen`);
      for (const name of names) {
        assert.equal(typeof name, "string");
        assert.notEqual(name.trim(), "", `${key} obsahuje prázdné/whitespace jméno`);
      }
    }
  });

  test("žádná data neobsahují HTML (viz zadání 'nevkládej do dat HTML')", () => {
    for (const names of Object.values(CZECH_NAMEDAYS)) {
      for (const name of names) {
        assert.doesNotMatch(name, /[<>]/);
      }
    }
  });

  test("žádný klíč mimo formát MM-DD (zero-padded), žádný duplicitní klíč", () => {
    const keys = Object.keys(CZECH_NAMEDAYS);
    assert.equal(new Set(keys).size, keys.length, "žádné duplicity");
    for (const key of keys) {
      assert.match(key, /^(0[1-9]|1[0-2])-([0-2][0-9]|3[01])$/, `neplatný formát klíče: ${key}`);
    }
  });
});
