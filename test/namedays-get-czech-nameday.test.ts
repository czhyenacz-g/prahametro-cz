import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  formatNamedaySentence,
  getCzechNamedays,
  getMsUntilNextPragueMidnight,
  getPragueCalendarDate,
  getPragueOffsetMinutes,
} from "../lib/namedays/get-czech-nameday.ts";

// Všechny okamžiky jsou pevné (viz zadání "ne aktuální datum při
// spuštění testu") — konkrétní UTC instanty, ne `new Date()`.

describe("getPragueCalendarDate — Europe/Prague, ne prosté UTC pole", () => {
  test("10. běžný okamžik uprostřed dne — stejné datum v UTC i Praze", () => {
    assert.deepEqual(getPragueCalendarDate(new Date("2026-06-15T10:00:00Z")), { year: 2026, month: 6, day: 15 });
  });

  test("11. UTC ještě předchozí den, ale v Praze (CET, +1) už následující", () => {
    // 2026-01-14T23:30:00Z = 2026-01-15T00:30 CET.
    assert.deepEqual(getPragueCalendarDate(new Date("2026-01-14T23:30:00Z")), { year: 2026, month: 1, day: 15 });
  });

  test("1. leden", () => {
    assert.deepEqual(getPragueCalendarDate(new Date("2026-01-01T12:00:00Z")), { year: 2026, month: 1, day: 1 });
  });

  test("31. prosinec", () => {
    assert.deepEqual(getPragueCalendarDate(new Date("2026-12-31T12:00:00Z")), { year: 2026, month: 12, day: 31 });
  });

  test("29. únor v přestupném roce", () => {
    assert.deepEqual(getPragueCalendarDate(new Date("2024-02-29T12:00:00Z")), { year: 2024, month: 2, day: 29 });
  });
});

describe("getCzechNamedays — data pro konkrétní pevná data", () => {
  test("4. 28. únor (nepřestupný rok 2026) — jedno jméno", () => {
    assert.deepEqual(getCzechNamedays(new Date("2026-02-28T12:00:00Z")), ["Lumír"]);
  });

  test("5. 29. únor (přestupný rok 2024) — jedno jméno", () => {
    assert.deepEqual(getCzechNamedays(new Date("2024-02-29T12:00:00Z")), ["Horymír"]);
  });

  test("6. 1. březen — dvě jména", () => {
    assert.deepEqual(getCzechNamedays(new Date("2026-03-01T12:00:00Z")), ["Bedřich", "Bedřiška"]);
  });

  test("1. datum uprostřed běžného roku — jedno jméno", () => {
    assert.deepEqual(getCzechNamedays(new Date("2026-06-15T10:00:00Z")), ["Vít"]);
  });

  test("7. datum s jedním jménem (31. prosinec)", () => {
    assert.deepEqual(getCzechNamedays(new Date("2026-12-31T12:00:00Z")), ["Silvestr"]);
  });

  test("8. datum s více jmény (2 i 3)", () => {
    assert.deepEqual(getCzechNamedays(new Date("2026-01-03T12:00:00Z")), ["Radmila", "Radomil"]);
    assert.deepEqual(getCzechNamedays(new Date("2026-01-06T12:00:00Z")), ["Kašpar", "Melichar", "Baltazar"]);
  });

  test("2. 1. leden — neexistující záznam (státní svátek bez jmenin) vrátí prázdné pole", () => {
    assert.deepEqual(getCzechNamedays(new Date("2026-01-01T12:00:00Z")), []);
  });

  test("11. UTC ještě 14. leden, v Praze už 15. leden — vrátí jména 15. ledna, ne 14. ledna", () => {
    assert.deepEqual(getCzechNamedays(new Date("2026-01-14T23:30:00Z")), ["Alice"]);
  });
});

describe("formatNamedaySentence — český formát bez lomítek", () => {
  test("13. jedno jméno: 'Dnes má svátek X.'", () => {
    assert.equal(formatNamedaySentence(["Linda"]), "Dnes má svátek Linda.");
  });

  test("14. dvě jména: 'Dnes mají svátek X a Y.'", () => {
    assert.equal(formatNamedaySentence(["Linda", "Samuel"]), "Dnes mají svátek Linda a Samuel.");
  });

  test("15. tři a více jmen: přirozený český výčet čárkami + poslední spojka 'a'", () => {
    assert.equal(formatNamedaySentence(["Anna", "Hana", "Jana"]), "Dnes mají svátek Anna, Hana a Jana.");
    assert.equal(formatNamedaySentence(["Kašpar", "Melichar", "Baltazar"]), "Dnes mají svátek Kašpar, Melichar a Baltazar.");
  });

  test("nikdy lomítko mezi jmény", () => {
    assert.doesNotMatch(formatNamedaySentence(["Linda", "Samuel"]), /\//);
  });

  test("9./16. prázdné pole -> bezpečný obecný fallback, ne 'undefined'/'null'/prázdná věta", () => {
    const result = formatNamedaySentence([]);
    assert.equal(result, "Ať se vám dnes daří.");
    assert.doesNotMatch(result, /undefined|null/i);
    assert.notEqual(result.trim(), "");
  });

  test("16. vstup s prázdnými/whitespace položkami se vyfiltruje, nikdy nedá 'undefined'", () => {
    const result = formatNamedaySentence(["", "   ", "Josef"]);
    assert.equal(result, "Dnes má svátek Josef.");
    assert.doesNotMatch(result, /undefined|null/i);
  });
});

describe("getPragueOffsetMinutes — CET/CEST kolem přechodu letního času", () => {
  test("zimní čas (CET) = 60 minut před UTC", () => {
    assert.equal(getPragueOffsetMinutes(new Date("2026-01-15T12:00:00Z")), 60);
  });

  test("letní čas (CEST) = 120 minut před UTC", () => {
    assert.equal(getPragueOffsetMinutes(new Date("2026-07-15T12:00:00Z")), 120);
  });

  test("12. těsně před jarním přechodem (2026-03-29, 01:00 UTC) — ještě CET", () => {
    assert.equal(getPragueOffsetMinutes(new Date("2026-03-29T00:30:00Z")), 60);
  });

  test("12. těsně po jarním přechodu — už CEST", () => {
    assert.equal(getPragueOffsetMinutes(new Date("2026-03-29T01:30:00Z")), 120);
  });

  test("těsně před podzimním přechodem (2026-10-25, 01:00 UTC) — ještě CEST", () => {
    assert.equal(getPragueOffsetMinutes(new Date("2026-10-25T00:30:00Z")), 120);
  });

  test("těsně po podzimním přechodu — už CET", () => {
    assert.equal(getPragueOffsetMinutes(new Date("2026-10-25T01:30:00Z")), 60);
  });
});

describe("getMsUntilNextPragueMidnight — self-konzistentní invariant (bez ručně spočtených ms)", () => {
  function assertLandsExactlyAtNextPragueMidnight(from: Date) {
    const ms = getMsUntilNextPragueMidnight(from);
    assert.ok(ms > 0, "posun musí být kladný");

    const target = new Date(from.getTime() + ms);
    const oneMsBefore = new Date(target.getTime() - 1);

    const fromDay = getPragueCalendarDate(from);
    const targetDay = getPragueCalendarDate(target);
    const dayBeforeTarget = getPragueCalendarDate(oneMsBefore);

    // Cílový okamžik je přesně první milisekunda následujícího pražského dne.
    assert.deepEqual(dayBeforeTarget, fromDay, "1 ms před cílem je ještě dnešní pražský den");
    assert.notDeepEqual(targetDay, fromDay, "cílový okamžik už je jiný pražský den");

    // targetDay je fromDay + 1 kalendářní den (spočteno nezávisle přes Date.UTC, ať test neopakuje logiku testované funkce).
    const expectedNextDay = new Date(Date.UTC(fromDay.year, fromDay.month - 1, fromDay.day + 1));
    assert.deepEqual(targetDay, {
      year: expectedNextDay.getUTCFullYear(),
      month: expectedNextDay.getUTCMonth() + 1,
      day: expectedNextDay.getUTCDate(),
    });
  }

  test("běžný den (mimo DST přechod)", () => {
    assertLandsExactlyAtNextPragueMidnight(new Date("2026-06-15T10:00:00Z"));
  });

  test("1. leden -> 2. leden", () => {
    assertLandsExactlyAtNextPragueMidnight(new Date("2026-01-01T12:00:00Z"));
  });

  test("31. prosinec -> přechod do nového roku", () => {
    assertLandsExactlyAtNextPragueMidnight(new Date("2026-12-31T20:00:00Z"));
  });

  test("28. únor -> 29. únor (přestupný rok)", () => {
    assertLandsExactlyAtNextPragueMidnight(new Date("2024-02-28T20:00:00Z"));
  });

  test("12. den jarního přechodu na letní čas (2026-03-29)", () => {
    assertLandsExactlyAtNextPragueMidnight(new Date("2026-03-29T10:00:00Z"));
  });

  test("12. den podzimního přechodu na zimní čas (2026-10-25)", () => {
    assertLandsExactlyAtNextPragueMidnight(new Date("2026-10-25T10:00:00Z"));
  });

  test("volané těsně před půlnocí vrátí malý kladný posun, ne skoro celý den", () => {
    const from = new Date("2026-06-15T21:59:00Z"); // 23:59 CEST
    const ms = getMsUntilNextPragueMidnight(from);
    assert.ok(ms > 0 && ms <= 60_000, `očekáván posun do 1 minuty, dostal ${ms} ms`);
  });
});
