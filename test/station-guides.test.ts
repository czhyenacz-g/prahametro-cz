import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { STATION_GUIDES, ORDERED_STATION_GUIDES, getStationGuide, stationGuidePath } from "../lib/stations/guides.ts";
import { metroEntrances } from "../lib/metro/load-entrances.ts";
import { stationAreaStops } from "../lib/stations/load-area-stops.ts";
import { findPlatformsForRoute } from "../lib/stations/build-guide-view.ts";
import type { GuideDestination } from "../lib/stations/types.ts";

const EXPECTED = {
  mustek: ["A", "B"],
  muzeum: ["A", "C"],
  florenc: ["B", "C"],
  "cerny-most": ["B"],
  "nadrazi-veleslavin": ["A"],
  zlicin: ["B"],
  haje: ["C"],
  letnany: ["C"],
} as const;

describe("průvodci stanicemi — rozsah", () => {
  test("přesně osm pilotních stanic se správnými slugy a linkami", () => {
    assert.equal(STATION_GUIDES.length, 8);
    for (const [slug, lines] of Object.entries(EXPECTED)) {
      const guide = getStationGuide(slug);
      assert.ok(guide, `chybí ${slug}`);
      assert.deepEqual([...guide.lines], [...lines]);
      assert.equal(stationGuidePath(slug), `/stanice/${slug}`);
    }
    assert.equal(ORDERED_STATION_GUIDES.length, 8);
  });

  test("stationId i linky sedí na data PID (metro-entrances.json)", () => {
    for (const guide of STATION_GUIDES) {
      const entrances = metroEntrances.entrances.filter((e) => e.stationId === guide.stationId);
      assert.ok(entrances.length > 0, `${guide.slug}: stationId ${guide.stationId} nemá v datech vstupy`);
      assert.equal(entrances[0].stationName, guide.name);
      assert.deepEqual([...entrances[0].lines].sort(), [...guide.lines].sort());
    }
  });
});

describe("průvodci stanicemi — SEO", () => {
  test("unikátní title, description a H1", () => {
    for (const key of ["seoTitle", "seoDescription", "h1"] as const) {
      const values = STATION_GUIDES.map((g) => g[key]);
      assert.equal(new Set(values).size, values.length, `${key} není unikátní`);
    }
  });

  test("title končí značkou a description má rozumnou délku", () => {
    for (const guide of STATION_GUIDES) {
      assert.match(guide.seoTitle, /\| KdeJeMetro$/);
      assert.ok(guide.seoDescription.length >= 80 && guide.seoDescription.length <= 170, `${guide.slug}: description ${guide.seoDescription.length} znaků`);
    }
  });
});

describe("průvodci stanicemi — odkazy a zdroje", () => {
  test("každý odkaz je https, má poskytovatele a unikátní id v rámci stanice", () => {
    for (const guide of STATION_GUIDES) {
      const ids = guide.links.map((l) => l.id);
      assert.equal(new Set(ids).size, ids.length, `${guide.slug}: duplicitní id odkazu`);
      for (const link of guide.links) {
        assert.equal(new URL(link.url).protocol, "https:");
        assert.ok(link.provider);
        if (link.verifiedAt) assert.match(link.verifiedAt, /^\d{4}-\d{2}-\d{2}$/);
      }
    }
  });

  test("všechna id odkazů použitá v akcích, sekcích a FAQ existují", () => {
    for (const guide of STATION_GUIDES) {
      const ids = new Set(guide.links.map((l) => l.id));
      const destinations: GuideDestination[] = [...guide.destinations, ...guide.actions];
      for (const d of destinations) {
        if (d.action.kind === "link") assert.ok(ids.has(d.action.linkId), `${guide.slug}: ${d.action.linkId}`);
      }
      for (const section of guide.sections) {
        assert.ok(section.sourceIds.length > 0, `${guide.slug}/${section.id}: sekce bez zdroje`);
        for (const id of section.sourceIds) assert.ok(ids.has(id), `${guide.slug}/${section.id}: ${id}`);
      }
      for (const item of guide.faq) {
        if (item.more && "linkId" in item.more) assert.ok(ids.has(item.more.linkId), `${guide.slug} FAQ: ${item.more.linkId}`);
      }
    }
  });

  test("odkaz na odjezdy Florenc vede na odjezdovou tabuli nádraží a upozorňuje na Holešovice", () => {
    const link = getStationGuide("florenc")!.links.find((l) => l.id === "florenc-odjezdy")!;
    assert.equal(link.url, "https://www.florenc.cz/odjezdy");
    assert.match(link.note ?? "", /Holešovic/);
  });

  test("zastávková tabla PID vedou přímo na zastávku stanice", () => {
    const expected: Record<string, string> = {
      "cerny-most": "https://pid.cz/zastavkova-tabla/?stanoviste=&stop=%C4%8Cern%C3%BD+Most&tab=1",
      "nadrazi-veleslavin": "https://pid.cz/zastavkova-tabla/?stop=N%C3%A1dra%C5%BE%C3%AD+Veleslav%C3%ADn&tab=1",
      zlicin: "https://pid.cz/zastavkova-tabla/?stop=Zli%C4%8D%C3%ADn",
      letnany: "https://pid.cz/zastavkova-tabla/?stop=Let%C5%88any&tab=1",
      haje: "https://pid.cz/zastavkova-tabla/?stop=H%C3%A1je&tab=1",
    };
    for (const [slug, url] of Object.entries(expected)) {
      const link = getStationGuide(slug)!.links.find((l) => l.id === "pid-odjezdy")!;
      assert.equal(link.url, url, slug);
      assert.equal(link.direct, true);
    }
  });
});

describe("průvodci stanicemi — funkční cíle", () => {
  test("kotvy na stanoviště míří jen u stanic, které mají data stanovišť a sekci stanovišť", () => {
    for (const guide of STATION_GUIDES) {
      const platforms = stationAreaStops.stations[guide.stationId] ?? [];
      const targets = [...guide.destinations, ...guide.actions, ...guide.faq.map((f) => ({ action: f.more && "sectionId" in f.more ? { kind: "section", sectionId: f.more.sectionId } : null }))];
      for (const t of targets) {
        const action = t.action as GuideDestination["action"] | null;
        if (!action) continue;
        if (action.kind === "section" && action.sectionId === "stanoviste") {
          assert.ok(guide.platforms && platforms.length > 0, `${guide.slug}: odkaz na #stanoviste bez dat`);
        }
        if (action.kind === "section" && ["prestup", "bezbarierovost", "dobre-vedet"].includes(action.sectionId)) {
          assert.ok(guide.sections.some((s) => s.id === action.sectionId), `${guide.slug}: chybí sekce #${action.sectionId}`);
        }
        if (action.kind === "route") {
          assert.ok(findPlatformsForRoute(platforms, action.routeName).length > 0, `${guide.slug}: linka ${action.routeName} v datech stanovišť chybí`);
        }
      }
    }
  });

  test("linka 59 odjíždí z Nádraží Veleslavín a linka 100 ze Zličína (aktuální GTFS data)", () => {
    assert.ok(findPlatformsForRoute(stationAreaStops.stations.U462S1, "59").length > 0);
    assert.ok(findPlatformsForRoute(stationAreaStops.stations.U1141S1, "100").length > 0);
  });

  test("každá stanice má 'Kam potřebujete?', aspoň jednu akci a FAQ", () => {
    for (const guide of STATION_GUIDES) {
      assert.ok(guide.destinations.length >= 3, guide.slug);
      assert.ok(guide.actions.length >= 1, guide.slug);
      assert.ok(guide.faq.length >= 3, guide.slug);
    }
  });
});

describe("GUIDE_SLUG_BY_STATION_ID (odkazy z výsledků hledání)", () => {
  test("přesně odpovídá STATION_GUIDES", async () => {
    const { GUIDE_SLUG_BY_STATION_ID, stationGuideHref } = await import("../lib/stations/guide-slugs.ts");
    assert.deepEqual(GUIDE_SLUG_BY_STATION_ID, Object.fromEntries(STATION_GUIDES.map((g) => [g.stationId, g.slug])));
    for (const g of STATION_GUIDES) assert.equal(stationGuideHref(g.stationId), stationGuidePath(g.slug));
    assert.equal(stationGuideHref("U1S1"), null);
  });
});
