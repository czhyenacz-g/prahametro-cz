import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { buildLocalProjection, groupStationEntrances, normalizeEntranceLabel, platformAnchorId, shortEntranceLabel } from "../lib/stations/build-guide-view.ts";
import { buildPlaceLinks } from "../lib/stations/place-links.ts";
import { stationEventFromDataset, toAnalyticsProperties, STATION_EVENT_TYPES } from "../lib/stations/events.ts";
import type { MetroEntrance } from "../lib/metro/types.ts";

function entrance(id: string, label: string, wheelchair: MetroEntrance["wheelchair"] = "no"): MetroEntrance {
  return { id, stationId: "S", stationName: "X", entranceLabel: label, lat: 50.08, lon: 14.42, wheelchair, lines: ["A"] };
}

describe("groupStationEntrances", () => {
  test("seskupí body se stejným popiskem, řadí přirozeně a bezbariérovost platí, když ji má aspoň jeden bod", () => {
    const groups = groupStationEntrances([entrance("1", "E10"), entrance("2", "E2 (B)"), entrance("3", "E2 (B)", "yes"), entrance("4", "(Výtah/Lift)", "yes")], "S");
    assert.deepEqual(
      groups.map((g) => [g.label, g.points.length, g.wheelchair, g.anchorId]),
      [
        ["E2 (B)", 2, true, "vstup-e2-b"],
        ["E10", 1, false, "vstup-e10"],
        ["Výtah", 1, true, "vstup-vytah"],
      ]
    );
  });

  test("popisky", () => {
    assert.equal(normalizeEntranceLabel("(Výtah/Lift)"), "Výtah");
    assert.equal(shortEntranceLabel("E2 (B)"), "2B");
    assert.equal(shortEntranceLabel("E10"), "10");
    assert.equal(shortEntranceLabel("Výtah"), "Vý");
    assert.equal(platformAnchorId("V1"), "stanoviste-v1");
  });
});

describe("buildLocalProjection", () => {
  test("sever je nahoře, východ vpravo a body zůstanou v mapě", () => {
    const points = [
      { lat: 50.1, lon: 14.5 },
      { lat: 50.101, lon: 14.502 },
    ];
    const p = buildLocalProjection(points);
    const sw = p.project(50.1, 14.5);
    const ne = p.project(50.101, 14.502);
    assert.ok(ne.x > sw.x && ne.y < sw.y);
    for (const pt of [sw, ne]) {
      assert.ok(pt.x >= 0 && pt.x <= p.width && pt.y >= 0 && pt.y <= p.height);
    }
  });
});

describe("buildPlaceLinks", () => {
  test("souřadnice: Google/Apple bez výchozí polohy, Mapy.com showmap v pořadí lon,lat", () => {
    const links = buildPlaceLinks({ kind: "coordinates", lat: 50.054775, lon: 14.290716 });
    const google = new URL(links.google);
    assert.equal(google.searchParams.get("destination"), "50.054775,14.290716");
    assert.equal(google.searchParams.get("origin"), null);
    assert.equal(google.searchParams.get("travelmode"), "walking");
    assert.equal(new URL(links.apple).searchParams.get("daddr"), "50.054775,14.290716");
    assert.equal(new URL(links.apple).searchParams.get("saddr"), null);
    assert.equal(new URL(links.mapy).searchParams.get("center"), "14.290716,50.054775");
  });

  test("cíl jen podle názvu = vyhledání místa, ne navigace s předstíraným přesným cílem", () => {
    const links = buildPlaceLinks({ kind: "query", query: "Národní muzeum, Praha" });
    const google = new URL(links.google);
    assert.equal(google.pathname, "/maps/search/");
    assert.equal(google.searchParams.get("query"), "Národní muzeum, Praha");
    assert.equal(google.searchParams.get("destination"), null);
    assert.equal(new URL(links.apple).searchParams.get("q"), "Národní muzeum, Praha");
    assert.equal(new URL(links.apple).searchParams.get("daddr"), null);
    assert.equal(new URL(links.mapy).pathname, "/fnc/v1/search");
  });

  test("neplatné souřadnice vyhodí chybu", () => {
    assert.throws(() => buildPlaceLinks({ kind: "coordinates", lat: Number.NaN, lon: 14 }), RangeError);
  });
});

describe("stationEventFromDataset", () => {
  test("sestaví event jen se slugem/id/poskytovatelem, neznámý typ ignoruje", () => {
    assert.deepEqual(stationEventFromDataset({ stationEvent: "station_departures_click", stationSlug: "zlicin", provider: "PID" }), {
      type: "station_departures_click",
      station_slug: "zlicin",
      provider: "PID",
    });
    assert.deepEqual(stationEventFromDataset({ stationEvent: "station_navigation_click", stationSlug: "florenc", destinationId: "vstup-e1", provider: "google" }), {
      type: "station_navigation_click",
      station_slug: "florenc",
      destination_id: "vstup-e1",
      provider: "google",
    });
    assert.equal(stationEventFromDataset({ stationEvent: "nope", stationSlug: "x" }), null);
    assert.equal(stationEventFromDataset({ stationEvent: "station_departures_click" }), null);
  });

  test("do Vercel Analytics jdou nejvýš 2 vlastnosti (limit plánu Pro), žádné souřadnice", () => {
    for (const type of STATION_EVENT_TYPES) {
      const event = stationEventFromDataset({ stationEvent: type, stationSlug: "zlicin", destinationId: "stanoviste-4", provider: "google" })!;
      const props = toAnalyticsProperties(event);
      assert.ok(Object.keys(props).length <= 2, type);
      assert.equal(props.station_slug, "zlicin");
      for (const value of Object.values(props)) assert.doesNotMatch(value, /\d+\.\d{3,}/);
    }
    assert.deepEqual(
      toAnalyticsProperties({ type: "station_navigation_click", station_slug: "zlicin", destination_id: "stanoviste-4", provider: "google" }),
      { station_slug: "zlicin", destination_provider: "stanoviste-4:google" }
    );
  });
});

describe("spreadMarkers", () => {
  test("překrývající se značky rozestoupí na minimální vzdálenost a nechá je v mapě", async () => {
    const { spreadMarkers } = await import("../lib/stations/build-guide-view.ts");
    const input = [
      { x: 100, y: 100 },
      { x: 101, y: 100 },
      { x: 100, y: 100 },
      { x: 300, y: 50 },
    ];
    const out = spreadMarkers(input, 27, { width: 400, height: 300, margin: 14 });
    for (let i = 0; i < out.length; i++) {
      for (let j = i + 1; j < out.length; j++) {
        assert.ok(Math.hypot(out[i].x - out[j].x, out[i].y - out[j].y) >= 26, `${i}-${j}`);
      }
      assert.ok(out[i].x >= 14 && out[i].x <= 386 && out[i].y >= 14 && out[i].y <= 286);
    }
    assert.deepEqual(out[3], { x: 300, y: 50 }, "vzdálená značka se nepohne");
    assert.deepEqual(spreadMarkers(input, 27, { width: 400, height: 300, margin: 14 }), out, "deterministické");
  });
});
