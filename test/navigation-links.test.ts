import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  appleMapsWalkingUrl,
  googleMapsWalkingUrl,
  isApplePlatform,
  primaryNavigationUrl,
  secondaryNavigationUrl,
} from "../lib/metro/navigation-links.ts";

const target = { lat: 50.08359, lon: 14.4241 };

describe("navigation-links", () => {
  test("googleMapsWalkingUrl obsahuje travelmode=walking a přesné souřadnice", () => {
    const url = googleMapsWalkingUrl(target);
    assert.match(url, /destination=50\.08359,14\.4241/);
    assert.match(url, /travelmode=walking/);
  });

  test("appleMapsWalkingUrl obsahuje dirflg=w a přesné souřadnice", () => {
    const url = appleMapsWalkingUrl(target);
    assert.match(url, /daddr=50\.08359,14\.4241/);
    assert.match(url, /dirflg=w/);
  });

  test("isApplePlatform detekuje iPhone/iPad/Mac", () => {
    assert.equal(isApplePlatform("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)"), true);
    assert.equal(isApplePlatform("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"), true);
    assert.equal(isApplePlatform("Mozilla/5.0 (Linux; Android 14)"), false);
    assert.equal(isApplePlatform("Mozilla/5.0 (Windows NT 10.0; Win64; x64)"), false);
  });

  test("primární/sekundární odkaz se prohodí podle platformy", () => {
    const iosUA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)";
    const androidUA = "Mozilla/5.0 (Linux; Android 14)";

    assert.equal(primaryNavigationUrl(target, iosUA), appleMapsWalkingUrl(target));
    assert.equal(secondaryNavigationUrl(target, iosUA), googleMapsWalkingUrl(target));

    assert.equal(primaryNavigationUrl(target, androidUA), googleMapsWalkingUrl(target));
    assert.equal(secondaryNavigationUrl(target, androidUA), appleMapsWalkingUrl(target));
  });
});
