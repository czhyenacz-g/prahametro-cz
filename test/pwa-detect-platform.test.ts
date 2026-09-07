import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { isIosDevice, isStandaloneDisplay } from "../lib/pwa/detect-platform.ts";

const IPHONE_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const IPAD_UA = "Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const ANDROID_UA = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36";
const DESKTOP_MAC_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";
const DESKTOP_WINDOWS_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

describe("isIosDevice", () => {
  test("iPhone Safari UA -> true", () => {
    assert.equal(isIosDevice({ userAgent: IPHONE_UA }), true);
  });

  test("iPad Safari UA (klasický 'iPad' řetězec) -> true", () => {
    assert.equal(isIosDevice({ userAgent: IPAD_UA }), true);
  });

  test("iPadOS 13+ (UA se hlásí jako Macintosh, ale má dotykový displej) -> true", () => {
    assert.equal(isIosDevice({ userAgent: DESKTOP_MAC_UA, platform: "MacIntel", maxTouchPoints: 5 }), true);
  });

  test("skutečný macOS desktop (Macintosh UA, bez dotykového displeje) -> false", () => {
    assert.equal(isIosDevice({ userAgent: DESKTOP_MAC_UA, platform: "MacIntel", maxTouchPoints: 0 }), false);
  });

  test("Android -> false", () => {
    assert.equal(isIosDevice({ userAgent: ANDROID_UA }), false);
  });

  test("desktop Windows -> false", () => {
    assert.equal(isIosDevice({ userAgent: DESKTOP_WINDOWS_UA }), false);
  });

  test("chybějící platform/maxTouchPoints (starší prohlížeč) nesmí spadnout", () => {
    assert.equal(isIosDevice({ userAgent: DESKTOP_MAC_UA }), false);
  });
});

describe("isStandaloneDisplay", () => {
  test("display-mode: standalone media query -> true", () => {
    assert.equal(isStandaloneDisplay({ matchesStandaloneMediaQuery: true }), true);
  });

  test("iOS navigator.standalone -> true", () => {
    assert.equal(isStandaloneDisplay({ matchesStandaloneMediaQuery: false, iosStandaloneFlag: true }), true);
  });

  test("ani jedno -> false (běžná karta v prohlížeči)", () => {
    assert.equal(isStandaloneDisplay({ matchesStandaloneMediaQuery: false, iosStandaloneFlag: false }), false);
  });

  test("iosStandaloneFlag chybí (Android/desktop) -> false, nespadne", () => {
    assert.equal(isStandaloneDisplay({ matchesStandaloneMediaQuery: false }), false);
  });
});
