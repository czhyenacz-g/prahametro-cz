import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { SMS_90206_TEXT } from "../lib/sms90206/content.ts";
import { CITY_SMS_SERVICES, PARKING_SMS_SERVICES, PRAGUE_DUPLICATE, SMS_90206_PATH, SMS_90206_VERIFIED_AT } from "../lib/sms90206/services.ts";
import { buildSmsHref, SMS_NUMBER, SMS_OPTIONS } from "../lib/tickets/tariff.ts";
import { TICKETS_TEXT } from "../lib/tickets/content.ts";
import { getSeoContent } from "../lib/seo/content.ts";
import { buildFaqPageJsonLd } from "../lib/seo/structured-data.ts";
import { getNightSeoContent } from "../lib/seo/night-content.ts";
import { findRoutePlatformMatches, normalizeRouteQuery } from "../lib/stations/build-guide-view.ts";
import { stationAreaStops } from "../lib/stations/load-area-stops.ts";
import { getStationGuide } from "../lib/stations/guides.ts";

describe("/90206 — obsah a metadata", () => {
  test("titulek, H1, popis a úvod přesně podle zadání", () => {
    assert.equal(SMS_90206_TEXT.seo.title, "90206 – SMS jízdenky a parkovné v Česku");
    assert.equal(SMS_90206_TEXT.seo.h1, "Co se dá koupit přes SMS na čísle 90206?");
    assert.equal(
      SMS_90206_TEXT.seo.description,
      "Přehled ověřených služeb na čísle 90206. SMS jízdenky pro Prahu, Brno a další města, kódy DPT42–DPT350 a parkovné v podporovaných lokalitách."
    );
    assert.equal(
      SMS_90206_TEXT.intro,
      "90206 je krátké číslo pro objednávky přes SMS. V Praze na něm koupíte jízdenku na MHD. Stejné číslo používají i další dopravci a některé parkovací služby. O tom, co objednáte, rozhoduje text zprávy."
    );
    assert.equal(SMS_90206_PATH, "/90206");
  });

  test("navigace pod úvodem: Praha první, pak Další města a Parkovné", () => {
    assert.deepEqual(
      SMS_90206_TEXT.toc.map((i) => i.label),
      ["Praha", "Další města", "Parkovné"]
    );
  });

  test("odlišné titulky i úvody od /jizdenky-praha", () => {
    assert.notEqual(SMS_90206_TEXT.seo.title, TICKETS_TEXT.cs.seo.title);
    assert.notEqual(SMS_90206_TEXT.intro, TICKETS_TEXT.cs.intro);
  });

  test("duplikát DPTA na 9000603 jen v odpovědi na dotaz o smazané jízdence", () => {
    const json = JSON.stringify({ ...SMS_90206_TEXT, faq: undefined });
    assert.ok(!json.includes(PRAGUE_DUPLICATE.number), "číslo duplikátu mimo FAQ");
    const hits = SMS_90206_TEXT.faq.filter((f) => f.answer.includes(PRAGUE_DUPLICATE.number));
    assert.equal(hits.length, 1);
    assert.match(hits[0].question, /Smazal/);
    assert.match(hits[0].answer, /DPTA/);
  });
});

describe("/90206 — pražské SMS tlačítka", () => {
  test("čtyři ověřené varianty podle DPP, všechny na 90206", () => {
    assert.equal(SMS_NUMBER, "90206");
    assert.deepEqual(
      SMS_OPTIONS.map((o) => [o.code, o.price, o.needsConfirmation, o.verified]),
      [
        ["DPT42", 42, false, true],
        ["DPT55", 55, false, true],
        ["DPT150", 150, true, true],
        ["DPT350", 350, true, true],
      ]
    );
  });

  test("každé tlačítko otevře SMS na 90206 se správným kódem (Android i iOS)", () => {
    for (const option of SMS_OPTIONS) {
      assert.equal(buildSmsHref(option.code, "other"), `sms:90206?body=${option.code}`);
      assert.equal(buildSmsHref(option.code, "ios"), `sms:90206&body=${option.code}`);
    }
  });
});

describe("/90206 — další města a parkovné", () => {
  test("každé město má https zdroj dopravce, aspoň jednu jízdenku a kódy jsou unikátní", () => {
    const codes = new Set<string>();
    for (const service of CITY_SMS_SERVICES) {
      assert.match(service.sourceUrl, /^https:\/\//, service.city);
      assert.ok(service.tickets.length > 0, service.city);
      for (const ticket of service.tickets) {
        assert.match(ticket.code, /^[A-Z0-9]+$/, ticket.code);
        assert.ok(ticket.price > 0);
        assert.ok(!codes.has(ticket.code), `duplicitní kód ${ticket.code}`);
        codes.add(ticket.code);
      }
    }
    assert.ok(!codes.has("DPT42"), "pražské kódy patří jen do tariff.ts");
  });

  test("parkovné: Pardubice a SMS TIR Parking s oficiálním zdrojem", () => {
    assert.deepEqual(
      PARKING_SMS_SERVICES.map((s) => s.id),
      ["pardubice", "sms-tir-parking"]
    );
    for (const s of PARKING_SMS_SERVICES) assert.match(s.sourceUrl, /^https:\/\//);
  });

  test("datum kontroly je ISO datum", () => {
    assert.match(SMS_90206_VERIFIED_AT, /^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("homepage FAQ — odkaz na NechciVolit.cz", () => {
  test("je jen v češtině, na konci sekce a NENÍ ve FAQPage JSON-LD", () => {
    const cs = getSeoContent("cs");
    assert.deepEqual(cs.faq.closingLink, { label: "Končí demokracie volbami?", href: "https://nechcivolit.cz/" });
    const jsonLd = JSON.stringify(buildFaqPageJsonLd(cs.faq.items));
    assert.ok(!jsonLd.includes("nechcivolit"));
    assert.ok(!jsonLd.includes("Končí demokracie"));
    for (const locale of ["en", "de", "uk"] as const) assert.equal(getSeoContent(locale).faq.closingLink, undefined);
  });

  test("SeoContent vykresluje odkaz až za všemi dotazy", () => {
    const source = readFileSync(new URL("../components/seo/SeoContent.tsx", import.meta.url), "utf-8");
    assert.ok(source.indexOf("seo.faq.closingLink") > source.indexOf("seo.faq.items.map"));
  });
});

describe("/nocni-mhd — odkaz na SMS jízdenku", () => {
  test("dotaz na jízdné odkazuje na /jizdenky-praha#sms", () => {
    const item = getNightSeoContent("cs").faq.items.find((i) => /jízdenka/.test(i.question));
    assert.deepEqual(item?.link, { label: "Připravit SMS jízdenku", href: "/jizdenky-praha#sms" });
  });
});

describe("Letňany — vyhledání stanoviště podle linky", () => {
  const guide = getStationGuide("letnany");
  const platforms = stationAreaStops.stations[guide!.stationId] ?? [];

  test("průvodce Letňany má popisek „Zadejte číslo autobusu“", () => {
    assert.equal(guide?.routeSearch?.label, "Zadejte číslo autobusu");
  });

  test("normalizace dotazu", () => {
    assert.equal(normalizeRouteQuery(" 413 "), "413");
    assert.equal(normalizeRouteQuery("x 1"), "X1");
    assert.equal(normalizeRouteQuery("   "), null);
  });

  test("neznámá linka = prázdný výsledek", () => {
    assert.deepEqual(findRoutePlatformMatches(platforms, "99999"), []);
  });

  test("linka se směry na více stanovištích vrátí každé stanoviště se svým směrem", () => {
    const synthetic = [
      { code: "B", name: "X", lat: 50, lon: 14, routes: [{ name: "201", mode: "bus" as const, headsigns: ["Nádraží Holešovice"] }] },
      { code: "D", name: "X", lat: 50, lon: 14, routes: [{ name: "201", mode: "bus" as const, headsigns: ["Černý Most"] }] },
    ];
    assert.deepEqual(
      findRoutePlatformMatches(synthetic, "201").map((m) => [m.platform.code, m.headsigns]),
      [
        ["B", ["Nádraží Holešovice"]],
        ["D", ["Černý Most"]],
      ]
    );
  });
});
