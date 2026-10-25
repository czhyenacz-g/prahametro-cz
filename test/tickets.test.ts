import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { buildSmsHref, detectSmsPlatform, PRAGUE_PRICES, SMS_NUMBER, SMS_OPTIONS, TARIFF_VERIFIED_AT, TARIFF_YEAR, TICKET_SOURCES, TICKETS_SEO } from "../lib/tickets/tariff.ts";
import { toTicketAnalyticsProperties, type TicketEvent } from "../lib/tickets/events.ts";

describe("tarif PID (ověřeno 2026-10-25 na pid.cz a dpp.cz)", () => {
  test("ceny plnocenného jízdného pro Prahu", () => {
    assert.deepEqual(
      PRAGUE_PRICES.map((r) => [r.id, r.app, r.paper, r.sms]),
      [
        ["30min", 36, 39, 42],
        ["90min", 46, 50, 55],
        ["24h", 140, 150, 150],
        ["72h", 340, 350, 350],
      ]
    );
  });

  test("SMS: číslo 90206, kód = DPT + cena, potvrzení jen u 24/72 h, cena shodná s tabulkou", () => {
    assert.equal(SMS_NUMBER, "90206");
    for (const option of SMS_OPTIONS) {
      assert.equal(option.code, `DPT${option.price}`);
      assert.equal(option.price, PRAGUE_PRICES.find((r) => r.id === option.id)!.sms);
      assert.equal(option.needsConfirmation, option.id === "24h" || option.id === "72h");
    }
    assert.deepEqual(
      SMS_OPTIONS.map((o) => o.code),
      ["DPT42", "DPT55", "DPT150", "DPT350"]
    );
  });

  test("rok v titulku odpovídá roku ověření tarifu (nemění se sám)", () => {
    assert.equal(TARIFF_YEAR, Number(TARIFF_VERIFIED_AT.slice(0, 4)));
    assert.match(TICKETS_SEO.title, new RegExp(`^Jízdenky MHD Praha ${TARIFF_YEAR} – `));
  });

  test("zdroje jsou jen oficiální https odkazy PID/DPP", () => {
    for (const s of TICKET_SOURCES) assert.match(s.url, /^https:\/\/(pid\.cz|www\.dpp\.cz)\//);
  });
});

describe("buildSmsHref", () => {
  test("Android/ostatní: RFC 5724 ?body=", () => {
    assert.equal(buildSmsHref("DPT42", "other"), "sms:90206?body=DPT42");
  });

  test("iOS: &body=", () => {
    assert.equal(buildSmsHref("DPT350", "ios"), "sms:90206&body=DPT350");
  });

  test("příjemce a text se dají z URI přesně vyčíst a nic jiného v ní není", () => {
    for (const option of SMS_OPTIONS) {
      for (const platform of ["ios", "other"] as const) {
        const href = buildSmsHref(option.code, platform);
        const match = /^sms:(\d+)[?&]body=([A-Z0-9]+)$/.exec(href);
        assert.ok(match, href);
        assert.equal(match[1], "90206");
        assert.equal(match[2], option.code);
      }
    }
  });

  test("neplatné číslo vyhodí chybu", () => {
    assert.throws(() => buildSmsHref("DPT42", "other", "+420 abc"), RangeError);
  });
});

describe("detectSmsPlatform", () => {
  test("iPhone, iPad (i iPadOS jako Mac s dotykem) = ios; Android, desktop = other", () => {
    assert.equal(detectSmsPlatform("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)"), "ios");
    assert.equal(detectSmsPlatform("Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)"), "ios");
    assert.equal(detectSmsPlatform("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 5), "ios");
    assert.equal(detectSmsPlatform("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 0), "other");
    assert.equal(detectSmsPlatform("Mozilla/5.0 (Linux; Android 14; Pixel 8)"), "other");
  });
});

describe("analytika jízdenek", () => {
  test("nejvýš 2 vlastnosti, žádné telefonní číslo", () => {
    const events: TicketEvent[] = [
      { type: "ticket_sms_option_select", ticket_duration: "90min", ticket_price: 55 },
      { type: "ticket_sms_prepare_click", ticket_duration: "30min", ticket_price: 42 },
      { type: "ticket_sms_copy_click", ticket_duration: "24h", ticket_price: 150 },
      { type: "ticket_pid_app_click", ticket_method: "pid_litacka", placement: "litacka-section" },
    ];
    for (const event of events) {
      const props = toTicketAnalyticsProperties(event);
      assert.ok(Object.keys(props).length <= 2, event.type);
      assert.ok(!Object.values(props).some((v) => String(v).includes("90206")));
    }
  });
});
